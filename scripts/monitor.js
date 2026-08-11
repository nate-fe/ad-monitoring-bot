import process from 'node:process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  isoToFileBase,
  parseRetentionHours,
  pruneManifest,
  pruneOrphanFiles,
  readManifest,
  screenshotDirForReport,
  toWebPath,
  writeManifest,
} from './screenshot-store.js'

function getEnv(name, { required = false, defaultValue = undefined } = {}) {
  const value = process.env[name]
  if (value == null || value === '') {
    if (required) throw new Error(`Missing required env: ${name}`)
    return defaultValue
  }
  return value
}

function parseList(value) {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function parseBool(value, defaultValue) {
  if (value == null || value === '') return defaultValue
  const v = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false
  return defaultValue
}

const DEFAULT_IGNORE_ERROR_PATTERNS = [
  'GL Driver Message',
  'GPU stall',
  'ReadPixels',
  "Cannot read properties of null (reading 'getBoundingClientRect') https://cyad1.nate.com/js.kti/mnate/mob@pann_Middle1",
]

function safeSnippet(s, maxLen = 120) {
  const oneLine = String(s).replaceAll(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen - 1)}…`
}

function extractHttpUrlFromText(text) {
  const m = String(text).match(/https?:\/\/[^\s)\]}>'"]+/i)
  return m ? m[0] : undefined
}

/** 동일 URL(쿼리까지, hash 제외)의 마지막 HTTP 상태 — 재시도 시 덮어씀 */
function getLastResponseStatus(urlStatusMap, url) {
  if (!url) return undefined
  if (urlStatusMap.has(url)) return urlStatusMap.get(url)
  try {
    const want = new URL(url)
    const wantKey = `${want.origin}${want.pathname}${want.search}`
    for (const [k, st] of urlStatusMap) {
      try {
        const ku = new URL(k)
        const kKey = `${ku.origin}${ku.pathname}${ku.search}`
        if (kKey === wantKey) return st
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return undefined
}

function stripOptionalQuotes(v) {
  const s = v.trim()
  if (s.length >= 2) {
    const q = s[0]
    if ((q === '"' || q === "'") && s[s.length - 1] === q) return s.slice(1, -1)
  }
  return s
}

async function loadDotEnv(filePath = '.env') {
  try {
    const raw = await readFile(filePath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue
      const key = m[1]
      const value = stripOptionalQuotes(m[2])
      if (process.env[key] == null || process.env[key] === '') {
        process.env[key] = value
      }
    }
  } catch {
    // ignore missing/invalid .env
  }
}

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath)
  if (dir && dir !== '.') await mkdir(dir, { recursive: true })
}

function hostnameFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Performance 리소스 타이밍(호스트별) + 페이지·페이지 콘솔 오류·요청 실패 URL을 묶어 Top5를 만든다.
 * 에러율 집계에서는 헤드리스 네트워크 한 줄(source: devtools)은 제외한다.
 * @param {Record<string, { sumDuration: number, count: number, resourceUrls?: string[] }>} resourceByHost
 * @param {Array<{ sourceUrl?: string }>} pageErrors
 * @param {Array<{ type?: string, source?: string, sourceUrl?: string }>} consoleMessages
 * @param {Array<{ url?: string }>} requestFailures
 */
function buildDomainInsights(resourceByHost, pageErrors, consoleMessages, requestFailures) {
  const byHost = resourceByHost && typeof resourceByHost === 'object' ? resourceByHost : {}

  const latencyTop5 = Object.entries(byHost)
    .map(([hostname, v]) => ({
      hostname,
      avgDurationMs: v.count > 0 ? v.sumDuration / v.count : 0,
      sampleCount: v.count,
    }))
    .filter((r) => r.sampleCount >= 2 && r.avgDurationMs > 0)
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    .slice(0, 5)

  const errByHost = new Map()
  const bumpErr = (u) => {
    const h = hostnameFromUrl(u)
    if (!h) return
    errByHost.set(h, (errByHost.get(h) ?? 0) + 1)
  }

  for (const e of pageErrors) {
    if (e?.sourceUrl) bumpErr(e.sourceUrl)
  }
  for (const m of consoleMessages) {
    if (m?.type === 'error' && m?.source !== 'devtools' && m?.sourceUrl) bumpErr(m.sourceUrl)
  }
  for (const r of requestFailures) {
    if (r?.url) bumpErr(r.url)
  }

  const rateCandidates = []
  const hostSet = new Set([...Object.keys(byHost), ...errByHost.keys()])
  for (const hostname of hostSet) {
    const errorCount = errByHost.get(hostname) ?? 0
    if (errorCount < 1) continue
    const hostRes = byHost[hostname]
    const resourceCount = hostRes?.count ?? 0
    const resourceUrls = Array.isArray(hostRes?.resourceUrls) ? hostRes.resourceUrls : []
    const errorRate = resourceCount > 0 ? errorCount / resourceCount : 1
    rateCandidates.push({ hostname, errorCount, resourceCount, errorRate, resourceUrls })
  }
  rateCandidates.sort((a, b) => b.errorRate - a.errorRate || b.errorCount - a.errorCount)
  const errorRateTop5 = rateCandidates.slice(0, 5)

  return { latencyTop5, errorRateTop5 }
}

/** 출처 URL을 스크립트(파일) 단위로 묶기 — 쿼리는 제외해 동일 경로를 한 줄로 집계 */
function normalizeScriptSourceKey(url) {
  if (!url || typeof url !== 'string') return null
  const t = url.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    return `${u.origin}${u.pathname}`
  } catch {
    return t
  }
}

/** 광고·네이트 태그·광고 iframe HTML 등, 원인 코드 추적용으로 본문을 캐시할 URL */
const SCRIPT_BODY_CACHE_URL_RE =
  /cyad\d*\.nate\.com|js\.kti|nate\.com\/etc\/|nate\.com\/js\/|googlesyndication|doubleclick|googletag|pagead2|adservice|taboola|criteo|adnxs|amazon-adsystem|casalemedia|pubmatic|rubiconproject|openx|prebid|adform|adsafeprotected|2mdn\.net|creativecdn|spotx|outbrain|facebook\.net\/|dable|widerplanet|mobwith|googletagservices|securepubads|gpt\.js|pubads/i

const SCRIPT_BODY_MAX_CHARS = 512 * 1024
const SCRIPT_BODY_CACHE_MAX_ENTRIES = 200
const SCRIPT_BODY_CACHE_MAX_TOTAL_CHARS = 8 * 1024 * 1024
const SOURCE_SNIPPET_CONTEXT_LINES = 2
const SOURCE_SNIPPET_MAX_LINE_CHARS = 240
const SOURCE_SNIPPET_MINIFIED_RADIUS = 100

function shouldCacheScriptBody(resourceType, url) {
  if (!url || typeof url !== 'string') return false
  if (resourceType === 'script') {
    // 스크립트는 용량 한도 안에서 전부 캐시(출처가 벤더 패턴 밖이어도 Violation 에 잡힐 수 있음)
    return true
  }
  // adShopBox 같은 광고 iframe HTML 안의 인라인 스크립트 줄번호를 위해 document 도 일부 캐시
  if (resourceType === 'document') return SCRIPT_BODY_CACHE_URL_RE.test(url)
  return false
}

/**
 * @param {Map<string, string>} cache
 * @param {string} url
 * @param {string} body
 * @param {{ totalChars: number }} budget
 */
function putScriptBody(cache, url, body, budget) {
  if (!url || body == null) return
  if (cache.size >= SCRIPT_BODY_CACHE_MAX_ENTRIES) return
  const text = String(body)
  if (!text) return
  if (text.length > SCRIPT_BODY_MAX_CHARS) return
  if (budget.totalChars + text.length > SCRIPT_BODY_CACHE_MAX_TOTAL_CHARS) return

  cache.set(url, text)
  const key = normalizeScriptSourceKey(url)
  if (key && key !== url && !cache.has(key)) cache.set(key, text)
  budget.totalChars += text.length
}

/**
 * @param {Map<string, string>} cache
 * @param {string | undefined} url
 */
function lookupScriptBody(cache, url) {
  if (!url) return undefined
  if (cache.has(url)) return cache.get(url)
  const key = normalizeScriptSourceKey(url)
  if (key && cache.has(key)) return cache.get(key)
  try {
    const u = new URL(url)
    const noQuery = `${u.origin}${u.pathname}`
    if (cache.has(noQuery)) return cache.get(noQuery)
  } catch {
    /* ignore */
  }
  return undefined
}

/**
 * sourceUrl + line(+column) 기준으로 스크립트/문서 본문에서 원인 코드 스니펫을 만든다.
 * @returns {{ text: string, focusLine?: number, startLine?: number, endLine?: number, truncated?: boolean } | undefined}
 */
function extractSourceSnippet(body, line, column) {
  if (body == null || body === '') return undefined
  const lines = String(body).split(/\r?\n/)
  const focusLine = Number.isFinite(line) && line > 0 ? Math.floor(line) : 1
  const idx = Math.min(Math.max(focusLine - 1, 0), Math.max(lines.length - 1, 0))

  // minify(사실상 한 줄)이면 column 주변만 잘라 보여 준다.
  if (lines.length === 1 && Number.isFinite(column) && column > 0) {
    const row = lines[0] ?? ''
    const col = Math.max(0, Math.floor(column) - 1)
    const start = Math.max(0, col - SOURCE_SNIPPET_MINIFIED_RADIUS)
    const end = Math.min(row.length, col + SOURCE_SNIPPET_MINIFIED_RADIUS)
    const slice = row.slice(start, end)
    if (!slice.trim()) return undefined
    return {
      text: `${start > 0 ? '…' : ''}${slice}${end < row.length ? '…' : ''}`,
      focusLine: 1,
      startLine: 1,
      endLine: 1,
      truncated: start > 0 || end < row.length,
    }
  }

  const from = Math.max(0, idx - SOURCE_SNIPPET_CONTEXT_LINES)
  const to = Math.min(lines.length - 1, idx + SOURCE_SNIPPET_CONTEXT_LINES)
  const parts = []
  for (let i = from; i <= to; i++) {
    let row = lines[i] ?? ''
    let truncated = false
    if (row.length > SOURCE_SNIPPET_MAX_LINE_CHARS) {
      row = `${row.slice(0, SOURCE_SNIPPET_MAX_LINE_CHARS)}…`
      truncated = true
    }
    const marker = i === idx ? '>' : ' '
    parts.push(`${marker}${String(i + 1).padStart(4, ' ')} | ${row}`)
    if (truncated) parts[parts.length - 1] += ''
  }
  const text = parts.join('\n').trimEnd()
  if (!text) return undefined
  return {
    text,
    focusLine,
    startLine: from + 1,
    endLine: to + 1,
  }
}

/**
 * @param {Array<{ sourceUrl?: string, line?: number, column?: number, sourceSnippet?: unknown }>} messages
 * @param {Map<string, string>} scriptBodyByUrl
 */
function attachSourceSnippets(messages, scriptBodyByUrl) {
  for (const m of messages) {
    if (!m || m.sourceSnippet) continue
    if (!m.sourceUrl || m.line == null || !Number.isFinite(m.line)) continue
    const body = lookupScriptBody(scriptBodyByUrl, m.sourceUrl)
    if (!body) continue
    const snippet = extractSourceSnippet(body, m.line, m.column)
    if (snippet) m.sourceSnippet = snippet
  }
}

/**
 * 페이지 오류·페이지 콘솔(헤드리스 제외)의 sourceUrl 기준, 오류·경고 건수 상위 10개 스크립트 URL.
 * 고유 메시지 텍스트는 errorMessages / warningMessages 로 함께 저장(건수와 불일치할 수 있음).
 * @param {Array<{ sourceUrl?: string, message?: string }>} pageErrors
 * @param {Array<{ type?: string, source?: string, sourceUrl?: string, text?: string }>} consoleMessages
 */
function buildScriptIssueTop10(pageErrors, consoleMessages) {
  const map = new Map()
  const ensure = (key) => {
    if (!key) return null
    if (!map.has(key)) {
      map.set(key, {
        errors: 0,
        warnings: 0,
        errorMsgSet: new Set(),
        warningMsgSet: new Set(),
      })
    }
    return map.get(key)
  }

  for (const e of pageErrors) {
    const key = normalizeScriptSourceKey(e?.sourceUrl)
    const cur = ensure(key)
    if (!cur) continue
    cur.errors += 1
    const msg = e?.message != null ? String(e.message) : '페이지 오류'
    cur.errorMsgSet.add(msg)
  }

  for (const m of consoleMessages) {
    if (m?.source === 'devtools') continue
    if (m?.type !== 'error' && m?.type !== 'warning') continue
    const key = normalizeScriptSourceKey(m?.sourceUrl)
    const cur = ensure(key)
    if (!cur) continue
    const text = String(m?.text ?? '')
    if (m.type === 'error') {
      cur.errors += 1
      if (text) cur.errorMsgSet.add(text)
    } else {
      cur.warnings += 1
      if (text) cur.warningMsgSet.add(text)
    }
  }

  return Array.from(map.entries())
    .map(([sourceUrl, v]) => ({
      sourceUrl,
      errors: v.errors,
      warnings: v.warnings,
      total: v.errors + v.warnings,
      errorMessages: [...v.errorMsgSet].sort((a, b) => a.localeCompare(b)),
      warningMessages: [...v.warningMsgSet].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.total - a.total || b.errors - a.errors)
    .slice(0, 10)
}

/**
 * 완전히 동일한 콘솔 메시지(내용·위치·출처)를 한 항목으로 합치고 dupeCount 를 매긴다.
 * 광고 스크립트가 같은 경고를 여러 번 찍는 경우 리포트 크기를 줄인다.
 */
function dedupeConsoleMessages(messages) {
  const map = new Map()
  for (const m of messages) {
    const key = [
      m.type,
      m.text,
      m.url ?? '',
      m.sourceUrl ?? '',
      m.line ?? '',
      m.column ?? '',
      m.source ?? '',
    ].join('')
    const prev = map.get(key)
    if (prev) {
      prev.dupeCount += 1
    } else {
      map.set(key, { ...m, dupeCount: 1 })
    }
  }
  // dupeCount 는 2 이상일 때만 남긴다(중복 없는 리포트는 필드 추가로 커지지 않게).
  return [...map.values()].map((m) => {
    if (m.dupeCount > 1) return m
    const { dupeCount: _omit, ...rest } = m
    return rest
  })
}

function inferTargetScope(targetUrl) {
  const lower = String(targetUrl).toLowerCase()
  try {
    const parsed = new URL(lower)
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/'

    if (parsed.hostname === 'm.news.nate.com') {
      return pathname.startsWith('/view/') ? 'news' : 'news-home'
    }

    if (parsed.hostname === 'm.pann.nate.com') {
      return pathname.startsWith('/talk/') ? 'pann' : 'pann-home'
    }

    if (parsed.hostname === 'news.nate.com') {
      return pathname.startsWith('/view/') ? 'news-pc' : 'news-pc-home'
    }

    if (parsed.hostname === 'pann.nate.com') {
      return pathname.startsWith('/talk/') ? 'pann-pc' : 'pann-pc-home'
    }
  } catch {
    // fall back to string heuristics below
  }

  if (lower.includes('m.news.nate.com/view/')) return 'news'
  if (lower.includes('m.news.nate.com')) return 'news-home'
  if (lower.includes('m.pann.nate.com/talk/')) return 'pann'
  if (lower.includes('m.pann.nate.com')) return 'pann-home'
  if (lower.includes('news.nate.com/view/')) return 'news-pc'
  if (lower.includes('news.nate.com')) return 'news-pc-home'
  if (lower.includes('pann.nate.com/talk/')) return 'pann-pc'
  if (lower.includes('pann.nate.com')) return 'pann-pc-home'
  return ''
}

function getScopedTargetUrl(scope) {
  if (!scope) return ''
  const envNamesByScope = {
    news: ['MONITOR_TARGET_URL_NEWS_VIEW', 'MONITOR_TARGET_URL_NEWS'],
    'news-home': ['MONITOR_TARGET_URL_NEWS_HOME'],
    pann: ['MONITOR_TARGET_URL_PANN_VIEW', 'MONITOR_TARGET_URL_PANN'],
    'pann-home': ['MONITOR_TARGET_URL_PANN_HOME'],
    'news-pc': ['MONITOR_TARGET_URL_NEWS_PC_VIEW', 'MONITOR_TARGET_URL_NEWS_PC'],
    'news-pc-home': ['MONITOR_TARGET_URL_NEWS_PC_HOME'],
    'pann-pc': ['MONITOR_TARGET_URL_PANN_PC_VIEW', 'MONITOR_TARGET_URL_PANN_PC'],
    'pann-pc-home': ['MONITOR_TARGET_URL_PANN_PC_HOME'],
  }
  const envNames = envNamesByScope[scope] ?? []
  for (const envName of envNames) {
    const value = getEnv(envName, { defaultValue: '' })
    if (value) return value
  }
  return ''
}

function parseLocationFromStack(stackText) {
  if (!stackText) return {}

  const lines = String(stackText)
    .split(/\r?\n/)
    .map((line) => line.trim())

  for (const line of lines) {
    const match =
      line.match(/\(?((?:https?|file):\/\/[^\s)]+):(\d+):(\d+)\)?$/i) ||
      line.match(/\(?([^()\s]+\.js):(\d+):(\d+)\)?$/i)
    if (!match) continue

    return {
      sourceUrl: match[1],
      line: Number(match[2]),
      column: Number(match[3]),
    }
  }

  return {}
}

// ── CDP Runtime.consoleAPICalled 스택 트레이스에서 실제 출처 추출 ──
// Playwright msg.location()/주입 래퍼가 못 잡는 출처(loader.js 등)를 보강하기 위한 헬퍼.

/** RemoteObject → 텍스트(문자열 인자 기준). 저장된 메시지 text 와 매칭용. */
function cdpRemoteObjectToText(arg) {
  if (arg == null) return ''
  if (typeof arg.value === 'string') return arg.value
  if (arg.value != null) return String(arg.value)
  if (typeof arg.unserializableValue === 'string') return arg.unserializableValue
  return arg.description ?? arg.className ?? arg.subtype ?? arg.type ?? ''
}

function cdpArgsToText(args) {
  return (Array.isArray(args) ? args : []).map(cdpRemoteObjectToText).join(' ')
}

/** CDP consoleAPICalled type → 저장 규격(log/info/warning/error). */
function mapCdpConsoleType(type) {
  if (type === 'warning') return 'warning'
  if (type === 'error' || type === 'assert') return 'error'
  if (type === 'info') return 'info'
  return 'log'
}

/** 스택 트레이스(부모 async 스택 포함)에서 첫 http(s) 프레임 = 실제 출처 스크립트. */
function firstHttpFrameFromStack(stackTrace) {
  let cur = stackTrace
  let guard = 0
  while (cur && guard < 20) {
    guard += 1
    for (const f of cur.callFrames ?? []) {
      if (typeof f.url === 'string' && /^https?:\/\//i.test(f.url)) {
        return {
          sourceUrl: f.url,
          line: Number.isFinite(f.lineNumber) ? f.lineNumber + 1 : undefined,
          column: Number.isFinite(f.columnNumber) ? f.columnNumber : undefined,
        }
      }
    }
    cur = cur.parent
  }
  return undefined
}

const CONSOLE_CAPTURE_SCRIPT = `
(() => {
  const key = '__adMonitorConsoleMessages__';
  if (globalThis[key]) return;

  const describeElement = (el) => {
    const tag = String(el.tagName || 'element').toLowerCase();
    const id = el.id ? \` id="\${el.id}"\` : '';
    const className =
      typeof el.className === 'string' && el.className.trim()
        ? \` class="\${el.className.trim().replace(/\\s+/g, ' ')}"\`
        : '';
    return \`[HTML 태그 객체: <\${tag}\${id}\${className}>]\`;
  };

  const formatArg = (value) => {
    if (typeof value === 'string') return value;
    if (value == null) return String(value);
    try {
      if (typeof Element !== 'undefined' && value instanceof Element) {
        return describeElement(value);
      }
    } catch {
      // ignore cross-realm checks
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  /** SDK 정책 덤프 — 저장·실제 콘솔 출력 모두 생략 */
  const isSilencedPolicyInfoLog = (args) =>
    /^\\s*setPolicyInfo\\b/.test(args.map(formatArg).join(' '));

  const store = [];
  Object.defineProperty(globalThis, key, {
    value: store,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  const parseLocation = (stackText) => {
    if (!stackText) return {};
    const lines = String(stackText)
      .split(/\\r?\\n/)
      .map((line) => line.trim());

    for (const line of lines) {
      const match =
        line.match(/\\(?((?:https?|file):\\/\\/[^\\s)]+):(\\d+):(\\d+)\\)?$/i) ||
        line.match(/\\(?([^()\\s]+\\.js):(\\d+):(\\d+)\\)?$/i);
      if (!match) continue;

      return {
        sourceUrl: match[1],
        line: Number(match[2]),
        column: Number(match[3]),
      };
    }

    return {};
  };

  const wrap = (methodName, normalizedType) => {
    const original = console[methodName];
    if (typeof original !== 'function') return;
    console[methodName] = (...args) => {
      if (isSilencedPolicyInfoLog(args)) return;
      try {
        const location = parseLocation(new Error().stack);
        store.push({
          type: normalizedType,
          text: args.map(formatArg).join(' '),
          url: globalThis.location?.href || undefined,
          sourceUrl: location.sourceUrl,
          line: location.line,
          column: location.column,
          source: 'page',
        });
      } catch {
        // ignore capture errors
      }
      return original.apply(console, args);
    };
  };

  wrap('error', 'error');
  wrap('warn', 'warning');
  wrap('log', 'log');
  wrap('info', 'info');
  wrap('debug', 'log');
})();
`

/** Long Task API로 메인 스레드 블로킹 구간을 버퍼링(초기화는 네비게이션 이전에 실행) */
const LONG_TASK_CAPTURE_SCRIPT = `
(() => {
  const key = '__adMonitorLongTasks__';
  if (globalThis[key]) return;
  const tasks = [];
  Object.defineProperty(globalThis, key, {
    value: tasks,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  try {
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        tasks.push({ duration: e.duration, startTime: e.startTime });
      }
    });
    po.observe({ type: 'longtask', buffered: true });
  } catch (_) {
    tasks._observeFailed = true;
  }
})();
`

/**
 * console.error/warn 같은 JS 호출이 아니라 브라우저 엔진이 직접 생성하는 진단 로그(CDP Log 도메인)의 source 값 중
 * 모니터링 가치가 있는 것만 선별. 'javascript'·'network'는 pageerror/response 리스너와 중복되므로 제외.
 */
const RELEVANT_BROWSER_LOG_SOURCES = new Set(['violation', 'intervention', 'security', 'deprecation'])

/**
 * 크롬 DevTools 콘솔이 브라우저 자체 진단 메시지 앞에 붙이는 접두어(예: `[Violation] Permissions policy
 * violation: unload is not allowed in this document.`). CDP 는 접두어 없는 원문을 주므로, 크롬에서 보이는
 * 문자열과 맞추려면 여기서 직접 붙여야 한다. security 는 DevTools 도 접두어를 붙이지 않아 제외.
 */
const BROWSER_LOG_TEXT_PREFIXES = {
  violation: '[Violation] ',
  intervention: '[Intervention] ',
  deprecation: '[Deprecation] ',
}

/**
 * 접두어를 뗀 원문. Playwright 는 같은 Log 항목을 접두어 없이 한 번 더 전달하므로, 중복 판정은 항상
 * 이 원문 기준으로 해야 같은 메시지로 인식된다.
 */
function stripBrowserLogPrefix(text) {
  return String(text ?? '').replace(/^\[(?:Violation|Intervention|Deprecation)\] /, '')
}

function mapLogLevelToConsoleType(level) {
  if (level === 'error') return 'error'
  if (level === 'warning') return 'warning'
  return 'log'
}

const DESKTOP_VIEWPORT = { width: 1280, height: 720 }
/** 모바일 지면은 실제 사용자와 같은 폭·UA로 열어야 로드되는 광고와 레이아웃이 일치한다 */
const MOBILE_VIEWPORT = { width: 393, height: 852 }
/**
 * 봇임을 알리는 토큰을 UA 에 붙이면 일부 광고 서버(ad.3dpop.kr 등)가 403 을 돌려주어,
 * 실제 사용자에게는 나오는 광고가 캡쳐·리포트에서만 오류로 보인다. 그래서 실제 크롬과 같은 UA 를 쓴다.
 */
const DEFAULT_MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const DEFAULT_DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/** '-pc' 가 붙지 않은 스코프(news, news-home, pann, pann-home)가 모바일 지면 */
function isMobileScope(scope) {
  return Boolean(scope) && !String(scope).includes('-pc')
}

/** Chromium 한 장 캡쳐의 높이 한계(16384px)보다 낮게 잡고, 넘으면 구간을 나눠 찍어 대시보드에서 이어 붙인다 */
const SCREENSHOT_SEGMENT_MAX_PX = 16000
/** 무한 스크롤 지면이 끝없이 길어질 때의 안전장치 — 초과분은 truncated 로 표시 */
const SCREENSHOT_MAX_SEGMENTS = 8

/**
 * 화면에 붙어 다니는 요소(하단 앵커 광고·상단 고정 네비 등)를 캡쳐 동안만 감춘다.
 * 긴 지면을 구간으로 나눠 찍으면 이런 요소가 구간마다 다시 그려져 본문 중간을 가리기 때문.
 * 레이아웃이 밀리지 않도록 visibility 만 바꾸고, 원래 인라인 값은 복원용으로 들고 있는다.
 * @returns {Promise<number>} 감춘 요소 수
 */
async function hideStickyOverlays(page, { includeSticky }) {
  return page.evaluate((withSticky) => {
    const KEY = '__adMonitorOverlayHider__'
    /** @type {any} */
    let state = globalThis[KEY]

    if (!state) {
      state = { withSticky, hidden: [], handled: new Set(), observer: null, pending: false }

      state.reassert = () => {
        // 사이트·광고 스크립트가 style 을 덮어썼을 수 있어 값만 다시 못 박는다.
        for (const entry of state.hidden) {
          const [el, prop, , , applied] = entry
          if (el.isConnected && el.style.getPropertyValue(prop) !== applied) {
            el.style.setProperty(prop, applied, 'important')
          }
        }
      }

      state.consider = (els) => {
        for (const el of els) {
          if (state.handled.has(el)) continue
          const cs = getComputedStyle(el)
          const isFixed = cs.position === 'fixed'
          const isSticky = cs.position === 'sticky'
          if (!isFixed && !(isSticky && state.withSticky)) continue
          if (cs.visibility === 'hidden' || cs.display === 'none') continue
          const rect = el.getBoundingClientRect()
          // 추적 픽셀처럼 작은 것은 건드리지 않는다
          if (rect.width < 40 || rect.height < 16) continue
          // fixed 는 흐름 밖이라 display:none 으로 지워도 본문 레이아웃이 밀리지 않는다.
          // sticky 는 제자리를 차지하므로 opacity 로만 지운다. 둘 다 자식이 visibility:visible 로 되살리지 못하는 방식.
          const prop = isFixed ? 'display' : 'opacity'
          const applied = isFixed ? 'none' : '0'
          state.hidden.push([el, prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop), applied])
          state.handled.add(el)
          el.style.setProperty(prop, applied, 'important')
        }
      }

      state.scan = () => {
        state.reassert()
        state.consider(document.querySelectorAll('body *'))
      }

      /**
       * 광고 스크립트가 스크롤·리사이즈에 반응해 앵커를 다시 만들어 넣으므로 캡쳐가 끝날 때까지 계속 지운다.
       * 콜백은 마이크로태스크(=페인트 전)라, 여기서 곧바로 처리해야 다시 그려지기 전에 지워진다.
       * 전체 DOM 순회는 비싸므로 바뀐 노드만 본다.
       */
      state.observer = new MutationObserver((records) => {
        state.reassert()
        for (const record of records) {
          if (record.type === 'attributes' && record.target instanceof Element) {
            // 클래스 하나 바뀌면서 안쪽 광고 슬롯이 보이게 되는 경우가 있어 자손까지 본다
            state.consider([record.target, ...record.target.querySelectorAll('*')])
            continue
          }
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue
            state.consider([node, ...node.querySelectorAll('*')])
          }
        }
      })
      state.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })

      globalThis[KEY] = state
    }

    state.withSticky = state.withSticky || withSticky
    state.scan()
    return state.hidden.length
  }, includeSticky)
}

async function restoreStickyOverlays(page) {
  await page
    .evaluate(() => {
      const KEY = '__adMonitorOverlayHider__'
      const state = globalThis[KEY]
      if (!state) return
      state.observer?.disconnect()
      for (const [el, prop, value, priority] of state.hidden) {
        if (value) el.style.setProperty(prop, value, priority)
        else el.style.removeProperty(prop)
      }
      globalThis[KEY] = undefined
    })
    .catch(() => {})
}

/**
 * 리포트를 만든 바로 그 세션에서 페이지 맨 위부터 맨 아래까지 찍는다(별도 재방문이 아니므로 checkedAt 과 같은 순간).
 * 한 장에 안 들어가는 긴 지면만 위에서부터 구간을 나눈다.
 * 하단 앵커 광고·고정 네비는 본문을 가리므로 캡쳐 동안 감춘다.
 * @returns {Promise<{ capturedAt: string, files: string[], width: number, totalHeight: number, capturedHeight: number, truncated?: boolean } | null>}
 */
async function captureFullPageScreenshot(
  page,
  { outDir, fileBase, quality, segmentMaxPx = SCREENSHOT_SEGMENT_MAX_PX, hideOverlays = true },
) {
  try {
    await page.evaluate(() => {
      globalThis.scrollTo(0, 0)
    })
    // 스크롤 위치에 붙어 있던 sticky 요소가 제자리를 찾을 시간
    await page.waitForTimeout(500)

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement
      const body = document.body
      return {
        width: Math.ceil(Math.max(doc?.clientWidth ?? 0, globalThis.innerWidth ?? 0)),
        height: Math.ceil(Math.max(body?.scrollHeight ?? 0, doc?.scrollHeight ?? 0, doc?.clientHeight ?? 0)),
      }
    })

    const width = metrics.width > 0 ? metrics.width : (page.viewportSize()?.width ?? DESKTOP_VIEWPORT.width)
    const totalHeight = metrics.height > 0 ? metrics.height : (page.viewportSize()?.height ?? DESKTOP_VIEWPORT.height)

    await mkdir(outDir, { recursive: true })

    /** @type {string[]} */
    const files = []
    const segmentCount = Math.min(Math.ceil(totalHeight / segmentMaxPx), SCREENSHOT_MAX_SEGMENTS)
    const segmented = segmentCount > 1
    // 구간 분할일 때만 sticky 까지 감춘다 — 한 장으로 찍을 때 sticky 는 원래 자리에 한 번만 그려진다.
    if (hideOverlays) await hideStickyOverlays(page, { includeSticky: segmented })

    // 뷰포트를 지면 높이만큼 키워 두고 찍는다. screenshot({ fullPage: true }) 는 화면 밖 영역을 따로 합성하는데,
    // 광고·댓글처럼 별도 프로세스로 뜨는 iframe 은 그때 그려지지 않아 통째로 흰칸이 된다.
    // (한계: 뷰포트를 키우면 GPT 앵커 슬롯이 새 크기에 맞춰 다시 그려져 구간 아래쪽에 앵커가 남을 수 있다.
    //  실제 모습은 위 overlay 캡쳐로 확인.)
    const originalViewport = page.viewportSize() ?? DESKTOP_VIEWPORT
    let capturedHeight = 0
    try {
      for (let i = 0; i < segmentCount; i += 1) {
        const y = i * segmentMaxPx
        const height = Math.min(segmentMaxPx, totalHeight - y)
        if (height <= 0) break
        await page.setViewportSize({ width: originalViewport.width, height })
        await page.evaluate((top) => {
          globalThis.scrollTo(0, top)
        }, y)
        // 넓어진 화면 안에서 지연 로딩 이미지·iframe 이 실제로 그려질 시간
        await page.waitForTimeout(1200)
        // 이 스크롤 위치에서 새로 붙어 나온 고정 요소까지 감춘다.
        if (hideOverlays) await hideStickyOverlays(page, { includeSticky: segmented })
        const name = segmented ? `${fileBase}--${String(i + 1).padStart(2, '0')}.jpg` : `${fileBase}.jpg`
        await page.screenshot({ path: path.join(outDir, name), type: 'jpeg', quality })
        files.push(name)
        capturedHeight = y + height
      }
    } finally {
      await page.setViewportSize(originalViewport).catch(() => {})
      if (hideOverlays) await restoreStickyOverlays(page)
    }

    if (!files.length) return null

    return {
      capturedAt: new Date().toISOString(),
      files,
      width,
      totalHeight,
      capturedHeight,
      ...(capturedHeight < totalHeight ? { truncated: true } : {}),
    }
  } catch (err) {
    // 캡쳐 실패로 모니터링 자체를 실패시키지는 않는다 — 베스트에포트
    console.warn(`[screenshot] capture failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

/**
 * 화면 아래쪽 지연 로딩 광고(슬라이더·비디오 등)는 뷰포트에 들어와야 초기화되므로, 실제 사용자처럼 스크롤해 내려가며 트리거한다.
 * steps 는 상한이고, 문서 끝에 닿으면 거기서 멈춘다 — 고정 횟수만 내리면 긴 기사의 아래쪽 광고가 아예 로드되지 않아
 * 수집에서도 캡쳐에서도 빈칸으로 남는다.
 * @returns {Promise<{ steps: number, reachedBottom: boolean }>}
 */
async function simulateUserScroll(page, { steps, stepDelayMs }) {
  let used = 0
  try {
    const viewportHeight = page.viewportSize()?.height ?? 720
    const stepPx = Math.round(viewportHeight * 0.85)
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, stepPx)
      await page.waitForTimeout(stepDelayMs)
      used = i + 1
      const atBottom = await page.evaluate(() => {
        const doc = document.documentElement
        const height = Math.max(document.body?.scrollHeight ?? 0, doc?.scrollHeight ?? 0)
        return globalThis.scrollY + globalThis.innerHeight >= height - 8
      })
      if (atBottom) return { steps: used, reachedBottom: true }
    }
  } catch {
    // 스크롤 시뮬레이션 실패는 치명적이지 않음 — 베스트에포트
  }
  return { steps: used, reachedBottom: false }
}

async function main() {
  await loadDotEnv()

  const requestedScope = getEnv('MONITOR_TARGET_SCOPE', { defaultValue: '' })
  const scopedTargetUrl = getScopedTargetUrl(requestedScope)
  const directTargetUrl = getEnv('MONITOR_TARGET_URL', { defaultValue: '' })
  if (requestedScope && !directTargetUrl && !scopedTargetUrl) {
    throw new Error(`Missing target URL for scope "${requestedScope}". Set the matching scoped MONITOR_TARGET_URL_* variable or MONITOR_TARGET_URL.`)
  }
  const targetUrl = directTargetUrl || scopedTargetUrl || 'https://m.news.nate.com/view/20260223n02867?issue_sq=10477'
  const targetScope = requestedScope || inferTargetScope(targetUrl)
  const timeoutMs = Number(getEnv('MONITOR_TIMEOUT_MS', { defaultValue: '45000' }))
  const navTimeoutMs = Number(getEnv('MONITOR_NAV_TIMEOUT_MS', { defaultValue: '30000' }))
  /** 너무 짧으면 Long Task/TBT(근사)가 거의 잡히지 않을 수 있음 — 랩에서 8s 권장 */
  const afterLoadWaitMs = Number(getEnv('MONITOR_WAIT_AFTER_LOAD_MS', { defaultValue: '8000' }))
  const desktopUserAgent = getEnv('MONITOR_USER_AGENT', { defaultValue: DEFAULT_DESKTOP_USER_AGENT })
  const mobileUserAgent = getEnv('MONITOR_MOBILE_USER_AGENT', { defaultValue: DEFAULT_MOBILE_USER_AGENT })
  /** 모바일 지면을 모바일 뷰포트·UA 로 열지 여부. 끄면 이전처럼 1280×720 데스크톱으로 측정한다. */
  const mobileEmulationEnabled = parseBool(getEnv('MONITOR_MOBILE_EMULATION', { defaultValue: 'true' }), true)
  /** 화면 전체 캡쳐 저장 여부·품질·보존 기간 */
  const screenshotEnabled = parseBool(getEnv('MONITOR_SCREENSHOT_ENABLED', { defaultValue: 'true' }), true)
  const screenshotQuality = Number(getEnv('MONITOR_SCREENSHOT_QUALITY', { defaultValue: '62' }))
  const screenshotRetentionHours = parseRetentionHours(getEnv('MONITOR_SCREENSHOT_RETENTION_HOURS', { defaultValue: '' }))
  const screenshotSegmentMaxPx = Number(
    getEnv('MONITOR_SCREENSHOT_SEGMENT_MAX_PX', { defaultValue: String(SCREENSHOT_SEGMENT_MAX_PX) }),
  )
  /** 하단 앵커 광고·고정 네비를 캡쳐 동안 감출지 */
  const screenshotHideOverlays = parseBool(getEnv('MONITOR_SCREENSHOT_HIDE_OVERLAYS', { defaultValue: 'true' }), true)
  /** 화면 아래쪽 지연 로딩 광고를 트리거하기 위한 스크롤 시뮬레이션 설정 */
  const scrollEnabled = parseBool(getEnv('MONITOR_SCROLL_ENABLED', { defaultValue: 'true' }), true)
  /** 스크롤 상한 — 문서 끝에 닿으면 이보다 일찍 멈춘다 */
  const scrollSteps = Number(getEnv('MONITOR_SCROLL_STEPS', { defaultValue: '40' }))
  const scrollStepDelayMs = Number(getEnv('MONITOR_SCROLL_STEP_DELAY_MS', { defaultValue: '400' }))

  if (!targetScope) {
    throw new Error('Could not infer target scope from MONITOR_TARGET_URL. Set MONITOR_TARGET_SCOPE to news, news-home, pann, pann-home, news-pc, news-pc-home, pann-pc, or pann-pc-home.')
  }

  const reportPath = getEnv('MONITOR_REPORT_PATH', {
    defaultValue: path.join('public', targetScope, 'monitor-report.json'),
  })

  const failOnPageError = parseBool(getEnv('MONITOR_FAIL_ON_PAGEERROR', { defaultValue: 'true' }), true)
  const failOnConsoleError = parseBool(getEnv('MONITOR_FAIL_ON_CONSOLE_ERROR', { defaultValue: 'true' }), true)
  const failOnRequestFailed = parseBool(getEnv('MONITOR_FAIL_ON_REQUEST_FAILED', { defaultValue: 'false' }), false)
  const ignoreErrorPatterns = [
    ...DEFAULT_IGNORE_ERROR_PATTERNS,
    ...parseList(getEnv('MONITOR_IGNORE_ERROR_PATTERNS', { defaultValue: '' })),
  ]

  const startedAt = Date.now()
  const useMobileEmulation = mobileEmulationEnabled && isMobileScope(targetScope)
  /** 캡쳐 파일명·매니페스트 키로 쓰는 실행 시각(리포트 checkedAt 과 같은 실행을 가리킨다) */
  const runIso = new Date(startedAt).toISOString()

  let status = 0
  /** @type {{ capturedAt: string, files: string[], width: number, totalHeight: number, viewport: { width: number, height: number }, truncated?: boolean } | null} */
  let screenshot = null
  let ok = false
  /** @type {string[]} */
  const failures = []
  /** @type {{ message: string, stack?: string, sourceUrl?: string, line?: number, column?: number }[]} */
  const pageErrors = []
  /** @type {{ type: string, text: string, url?: string, sourceUrl?: string, line?: number, column?: number, source?: string }[]} */
  const consoleMessages = []
  /** @type {{ type: string, text: string, url?: string, source?: string }[]} */
  const devToolsConsoleMessages = []
  /** Playwright가 잡는 일반 콘솔(네트워크 한 줄 제외). 인페이지 훅보다 출처(loader.js:줄)가 정확한 경우가 많음 */
  /** @type {{ type: string, text: string, url?: string, sourceUrl?: string, line?: number, column?: number, source?: string }[]} */
  const playwrightPageConsoleMessages = []
  /** @type {{ url: string, method: string, resourceType: string, errorText: string }[]} */
  const requestFailures = []
  /** @type {Map<string, number>} */
  const urlResponseStatus = new Map()
  /** @type {{ url: string, method: string, resourceType: string, errorText: string }[]} */
  let requestFailuresForReport = []
  /** @type {{ approxTbtMs: number, longTaskCount: number, avgAdScriptResourceDurationMs: number, adScriptResourceCount: number } | null} */
  let performanceMetrics = null
  /** @type {{ latencyTop5: object[], errorRateTop5: object[] } | null} */
  let domainInsights = null
  /** CDP Log 도메인(violation/intervention 등, console.* 호출이 아닌 브라우저 자체 진단 메시지) — 메인 프레임과 모든 iframe(광고 iframe 포함)에서 수집 */
  /** @type {{ type: string, text: string, url?: string, sourceUrl?: string, line?: number, source?: string }[]} */
  const browserLogMessages = []
  /** CDP Runtime.consoleAPICalled 로 뽑은 실제 출처. key=`${type} ${text}` → {sourceUrl,line,column} */
  /** @type {Map<string, { sourceUrl: string, line?: number, column?: number }>} */
  const cdpConsoleSourceByKey = new Map()
  /** 측정 중 받은 스크립트/광고 문서 본문 — Violation sourceUrl+line 스니펫용 */
  /** @type {Map<string, string>} */
  const scriptBodyByUrl = new Map()
  const scriptBodyBudget = { totalChars: 0 }
  /** @type {Promise<void>[]} */
  const scriptBodyFetchPromises = []

  const shouldIgnore = (text) => ignoreErrorPatterns.some((p) => p && text.includes(p))

  try {
    /** @type {import('playwright').Browser | undefined} */
    let browser
    /** @type {import('playwright').BrowserContext | undefined} */
    let context
    try {
      browser = await chromium.launch({ headless: true })
      context = await browser.newContext(
        useMobileEmulation
          ? {
              userAgent: mobileUserAgent,
              viewport: MOBILE_VIEWPORT,
              deviceScaleFactor: 1,
              isMobile: true,
              hasTouch: true,
            }
          : {
              userAgent: desktopUserAgent,
              viewport: DESKTOP_VIEWPORT,
            },
      )
      await context.addInitScript(LONG_TASK_CAPTURE_SCRIPT)
      await context.addInitScript(CONSOLE_CAPTURE_SCRIPT)
      const page = await context.newPage()
      page.setDefaultTimeout(Number.isFinite(timeoutMs) ? timeoutMs : 45000)
      page.setDefaultNavigationTimeout(Number.isFinite(navTimeoutMs) ? navTimeoutMs : 30000)

      page.on('response', (response) => {
        let st = 0
        try {
          st = response.status()
        } catch {
          return
        }
        try {
          urlResponseStatus.set(response.url(), st)
        } catch {
          /* ignore */
        }

        let resourceType = ''
        let url = ''
        try {
          resourceType = response.request().resourceType()
          url = response.url()
        } catch {
          return
        }
        if (!shouldCacheScriptBody(resourceType, url)) return
        if (!(st >= 200 && st < 300)) return

        const fetchBody = (async () => {
          try {
            const headers = response.headers()
            const lenHeader = headers['content-length']
            if (lenHeader != null && Number(lenHeader) > SCRIPT_BODY_MAX_CHARS) return
            const text = await response.text()
            putScriptBody(scriptBodyByUrl, url, text, scriptBodyBudget)
          } catch {
            /* 본문 읽기 실패는 스니펫만 포기 */
          }
        })()
        scriptBodyFetchPromises.push(fetchBody)
      })

      page.on('console', (msg) => {
        const t = msg.type()
        const text = msg.text()
        if (!text || shouldIgnore(text)) return

        // DevTools-style network lines (e.g. "news@rpbt_Bottom1:15  GET https://… net::ERR_…").
        // Chromium often emits these as console type "log" or "info", not "error", so we must not
        // filter by type before detecting the pattern.
        const looksNetwork =
          text.includes('net::') ||
          /failed to load resource/i.test(text) ||
          /\bGET\s+https?:\/\//i.test(text) ||
          /\bPOST\s+https?:\/\//i.test(text)

        if (looksNetwork) {
          const allowedDevToolsTypes = new Set(['error', 'warning', 'log', 'info', 'debug'])
          if (!allowedDevToolsTypes.has(t)) return

          const requestUrl = extractHttpUrlFromText(text)
          let sourceUrl
          let line
          let column
          try {
            const loc = msg.location()
            if (loc?.url) sourceUrl = loc.url
            if (Number.isFinite(loc.lineNumber)) line = loc.lineNumber + 1
            if (Number.isFinite(loc.columnNumber)) column = loc.columnNumber
          } catch {
            /* ignore */
          }

          devToolsConsoleMessages.push({
            type: 'error',
            text,
            url: requestUrl,
            sourceUrl,
            line,
            column,
            source: 'devtools',
          })
          return
        }

        const allowedPageTypes = new Set(['error', 'warning', 'log', 'info', 'debug', 'verbose'])
        if (!allowedPageTypes.has(t)) return

        const normalizePlaywrightType = (pt) => {
          if (pt === 'verbose') return 'info'
          if (pt === 'debug') return 'log'
          return pt
        }
        const typeNorm = normalizePlaywrightType(t)

        let sourceUrl
        let line
        let column
        try {
          const loc = msg.location()
          if (loc?.url) sourceUrl = loc.url
          if (Number.isFinite(loc.lineNumber)) line = loc.lineNumber + 1
          if (Number.isFinite(loc.columnNumber)) column = loc.columnNumber
        } catch {
          /* ignore */
        }

        let pageUrl
        try {
          pageUrl = page.url()
        } catch {
          /* ignore */
        }

        playwrightPageConsoleMessages.push({
          type: typeNorm,
          text,
          url: pageUrl,
          sourceUrl,
          line,
          column,
          source: 'page',
        })
      })

      page.on('pageerror', (err) => {
        const message = err instanceof Error ? err.message : String(err)
        const location = parseLocationFromStack(err instanceof Error ? err.stack : undefined)
        if (shouldIgnore(`${message} ${location.sourceUrl ?? ''}`)) return
        pageErrors.push({
          message,
          stack: err instanceof Error ? err.stack : undefined,
          sourceUrl: location.sourceUrl,
          line: location.line,
          column: location.column,
        })
      })
      page.on('requestfailed', (req) => {
        const failure = req.failure()
        const errorText = failure?.errorText ?? 'request failed'
        const url = req.url()
        if (shouldIgnore(`${url} ${errorText}`)) return
        requestFailures.push({
          url,
          method: req.method(),
          resourceType: req.resourceType(),
          errorText,
        })
      })

      const handleBrowserLogEntry = (entry, frameUrl) => {
        if (!entry || !RELEVANT_BROWSER_LOG_SOURCES.has(entry.source)) return
        const text = String(entry.text ?? '')
        // 무시 패턴은 사용자가 크롬 원문 그대로 적으므로 접두어를 붙이기 전에 판정한다.
        if (!text || shouldIgnore(text)) return
        browserLogMessages.push({
          type: mapLogLevelToConsoleType(entry.level),
          text: `${BROWSER_LOG_TEXT_PREFIXES[entry.source] ?? ''}${text}`,
          url: frameUrl,
          sourceUrl: typeof entry.url === 'string' ? entry.url : undefined,
          line: Number.isFinite(entry.lineNumber) ? entry.lineNumber + 1 : undefined,
          source: 'browser-log',
        })
      }

      /**
       * CDP Log 도메인(console.* 호출이 아닌 violation/intervention 등 브라우저 자체 진단 메시지)을 구독.
       * 광고 iframe(cross-origin 포함)에 개별 CDP 세션을 붙이는 것은 시도해봤으나 Playwright/Chromium이
       * 이런 iframe들을 메인 프레임과 같은 세션으로 묶어 처리해 항상 실패했다 — 메인 프레임 세션 하나로
       * 페이지 내 모든 프레임의 Log 이벤트가 들어온다(실측 확인됨).
       */
      try {
        const logSession = await context.newCDPSession(page)
        await logSession.send('Log.enable')

        /**
         * DevTools 가 `[Violation]` 접두어로 보여주는 진단 중 verbose 레벨(document.write, non-passive
         * 리스너, Forced reflow, unload 퍼미션 정책 등)은 세션마다 이 호출을 해야만 Log.entryAdded 로
         * 들어온다. DevTools 는 콘솔을 열 때 자동으로 부르지만 Playwright 는 부르지 않아서, 이 호출이
         * 없으면 verbose 위반이 한 건도 잡히지 않는다(error 레벨 위반은 이 설정과 무관하게 들어옴).
         * 임계값은 DevTools 기본값과 동일하게 맞춘다.
         */
        try {
          await logSession.send('Log.startViolationsReport', {
            config: [
              { name: 'longTask', threshold: 200 },
              { name: 'longLayout', threshold: 30 },
              { name: 'blockedEvent', threshold: 100 },
              { name: 'blockedParser', threshold: -1 },
              { name: 'handler', threshold: 150 },
              { name: 'recurringHandler', threshold: 50 },
              { name: 'discouragedAPIUse', threshold: -1 },
            ],
          })
        } catch {
          // 위반 리포트 미지원 — error 레벨 위반만 수집하고 계속 진행
        }

        logSession.on('Log.entryAdded', ({ entry }) => handleBrowserLogEntry(entry, page.url()))

        // console.* 호출의 전체 스택 트레이스를 받아 실제 출처(loader.js 등)를 뽑는다.
        // Playwright msg.location()/주입 래퍼가 못 잡는 출처를 나중에 보강하는 용도.
        try {
          await logSession.send('Runtime.enable')
          logSession.on('Runtime.consoleAPICalled', (e) => {
            try {
              const loc = firstHttpFrameFromStack(e.stackTrace)
              if (!loc) return
              const text = cdpArgsToText(e.args)
              if (!text) return
              const key = `${mapCdpConsoleType(e.type)} ${text}`
              if (!cdpConsoleSourceByKey.has(key)) cdpConsoleSourceByKey.set(key, loc)
            } catch {
              /* ignore */
            }
          })
        } catch {
          // Runtime 도메인 미지원 — 보강 없이 진행
        }
      } catch {
        // Log 도메인을 지원하지 않는 환경 — 베스트에포트이므로 무시
      }

      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
      status = response?.status() ?? 0
      if (status && (status < 200 || status >= 300)) {
        failures.push(`HTTP status not OK: ${status}`)
      }

      try {
        await page.waitForLoadState('networkidle')
      } catch {
        // It's common for pages to keep long-polling; don't fail on this alone.
      }

      if (scrollEnabled) {
        const scrolled = await simulateUserScroll(page, {
          steps: Number.isFinite(scrollSteps) ? scrollSteps : 40,
          stepDelayMs: Number.isFinite(scrollStepDelayMs) ? scrollStepDelayMs : 400,
        })
        if (!scrolled.reachedBottom) {
          console.log(`[scroll] ${scrolled.steps}회 내려갔지만 문서 끝에는 닿지 않음 — 아래쪽 광고는 로드되지 않았을 수 있음`)
        }
      }

      if (Number.isFinite(afterLoadWaitMs) && afterLoadWaitMs > 0) {
        await page.waitForTimeout(afterLoadWaitMs)
      }

      if (screenshotEnabled && reportPath && reportPath !== '0' && reportPath.toLowerCase() !== 'none') {
        const captured = await captureFullPageScreenshot(page, {
          outDir: screenshotDirForReport(reportPath),
          fileBase: isoToFileBase(runIso),
          quality: Number.isFinite(screenshotQuality) ? screenshotQuality : 62,
          segmentMaxPx:
            Number.isFinite(screenshotSegmentMaxPx) && screenshotSegmentMaxPx > 0
              ? screenshotSegmentMaxPx
              : SCREENSHOT_SEGMENT_MAX_PX,
          hideOverlays: screenshotHideOverlays,
        })
        if (captured) {
          const viewport = page.viewportSize() ?? (useMobileEmulation ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT)
          screenshot = { ...captured, viewport }
        }
      }

      const capturedConsoleMessages = await page.evaluate(() => {
        const key = '__adMonitorConsoleMessages__'
        const messages = globalThis[key]
        return Array.isArray(messages) ? messages : []
      })
      const fromPage = capturedConsoleMessages.filter((item) => item && !shouldIgnore(String(item.text ?? '')))
      consoleMessages.push(...fromPage)
      /**
       * 인페이지 훅이 잡은 console.* 텍스트. Playwright 가 같은 호출을 한 번 더 전달하므로 이것과 겹치는
       * 것만 합친다(텍스트만 비교 — 훅의 location 은 래퍼 지점이라 위치가 서로 다르게 잡힌다).
       */
      const hookTexts = new Set(fromPage.map((m) => String(m.text ?? '')))
      /**
       * 이미 담은 메시지의 신원 = 텍스트 + 위치. 크롬 DevTools 콘솔이 같은 줄로 묶는 기준과 동일하게 맞춘다.
       * 문구가 같아도 URL·줄번호가 다르면 콘솔에는 각각 찍히므로 별개로 남겨야 한다.
       */
      const messageIdentity = (m) =>
        [stripBrowserLogPrefix(m.text), m.url ?? '', m.sourceUrl ?? '', m.line ?? ''].join('\u0000')
      /** 아래 병합 루프들이 공유하는 중복 판정 집합. */
      const seenIdentities = new Set(consoleMessages.map(messageIdentity))

      for (const m of playwrightPageConsoleMessages) {
        const tx = String(m.text ?? '')
        if (tx === 'JSHandle@node' && consoleMessages.some((x) => String(x.text ?? '').includes('[HTML 태그 객체:'))) {
          continue
        }
        if (hookTexts.has(tx)) {
          const idx = consoleMessages.findIndex((x) => String(x.text ?? '') === tx)
          if (idx >= 0 && m.sourceUrl) {
            const cur = consoleMessages[idx]
            if (!cur?.sourceUrl || cur.line == null) consoleMessages[idx] = m
          }
          continue
        }
        seenIdentities.add(messageIdentity(m))
        consoleMessages.push(m)
      }

      const devToolsFiltered = devToolsConsoleMessages.filter((m) => {
        const text = String(m.text ?? '')
        if (text.includes('net::') || /failed to load resource/i.test(text)) return true
        const u = extractHttpUrlFromText(text)
        if (!u) return true
        const st = getLastResponseStatus(urlResponseStatus, u)
        if (Number.isFinite(st) && st >= 200 && st < 300) return false
        return true
      })

      requestFailuresForReport = requestFailures.filter((rf) => {
        const st = getLastResponseStatus(urlResponseStatus, rf.url)
        return !(Number.isFinite(st) && st >= 200 && st < 300)
      })

      // 네트워크 한 줄은 문구가 같아도(예: "Failed to load resource: …403") 리소스 URL 마다 콘솔에 따로 찍힌다.
      for (const m of devToolsFiltered) {
        const id = messageIdentity(m)
        if (seenIdentities.has(id)) continue
        seenIdentities.add(id)
        consoleMessages.push(m)
      }

      /**
       * error·warning 레벨 Log 항목은 Playwright 도 접두어 없이 위 루프로 한 번 전달한다. 신원은
       * 접두어를 뗀 원문 기준이라 서로 같게 잡히므로, 크롬 표기를 따르는 이쪽(접두어 있음)으로 교체한다.
       * 위치가 다르면 그대로 남긴다 — 같은 문구라도 광고 슬롯이 다르면 콘솔에는 각각 찍히기 때문이다.
       * 완전히 동일한 항목은 뒤의 dedupeConsoleMessages 가 dupeCount 로 묶는다.
       */
      for (const m of browserLogMessages) {
        const id = messageIdentity(m)
        const dupeIdx = consoleMessages.findIndex(
          (x) => x.source === 'page' && messageIdentity(x) === id,
        )
        if (dupeIdx >= 0) {
          consoleMessages[dupeIdx] = m
          continue
        }
        seenIdentities.add(id)
        consoleMessages.push(m)
      }

      // 출처(sourceUrl)가 비어 있는 메시지를 CDP 스택 트레이스 결과로 보강한다.
      // (Playwright msg.location() 이 주입 래퍼 지점만 가리켜 URL 이 없던 케이스)
      for (const m of consoleMessages) {
        if (m.sourceUrl) continue
        const loc = cdpConsoleSourceByKey.get(`${String(m.type ?? '')} ${String(m.text ?? '')}`)
        if (!loc) continue
        // 기존 line 은 주입 래퍼 위치라 실제 출처와 안 맞으니 함께 교체.
        m.sourceUrl = loc.sourceUrl
        if (loc.line != null) m.line = loc.line
        if (loc.column != null) m.column = loc.column
      }

      // 스크립트 본문 캐시가 끝날 때까지 기다린 뒤, sourceUrl+line 이 있는 메시지에 코드 스니펫을 붙인다.
      await Promise.allSettled(scriptBodyFetchPromises)
      attachSourceSnippets(consoleMessages, scriptBodyByUrl)
      attachSourceSnippets(pageErrors, scriptBodyByUrl)

      try {
        const perfRaw = await page.evaluate(() => {
          const key = '__adMonitorLongTasks__'
          const fromObs = Array.isArray(globalThis[key]) ? globalThis[key] : []
          const fromPerf = performance.getEntriesByType('longtask')
          const seen = new Set()
          /** @type {{ duration: number, startTime: number }[]} */
          const all = []
          const add = (e) => {
            const id = `${e.startTime}:${e.duration}`
            if (seen.has(id)) return
            seen.add(id)
            all.push({ duration: e.duration, startTime: e.startTime })
          }
          for (const e of fromObs) {
            if (e && typeof e.duration === 'number') add(e)
          }
          for (const e of fromPerf) add(e)
          let approxTbtMs = 0
          for (const e of all) {
            if (e.duration > 50) approxTbtMs += e.duration - 50
          }
          const adRe =
            /googlesyndication|doubleclick|googletagmanager\.com\/gtag|pagead2|adservice|taboola|criteo|adnxs|amazon-adsystem|casalemedia|pubmatic|rubiconproject|openx|prebid|adform|adsafeprotected|2mdn\.net|creativecdn|spotx|outbrain|facebook\.net\/|connect\.facebook|dable|widerplanet|mobwith|googletagservices|gpt\.js|pubads\.gmpubads|securepubads\.g\.doubleclick/i
          const resources = performance.getEntriesByType('resource')
          const adScripts = resources.filter((r) => r.initiatorType === 'script' && adRe.test(r.name))
          const avgAdScriptResourceDurationMs = adScripts.length
            ? adScripts.reduce((s, r) => s + r.duration, 0) / adScripts.length
            : 0
          const resourceByHost = {}
          for (const r of resources) {
            if (r.initiatorType === 'navigation') continue
            let host
            try {
              host = new URL(r.name).hostname
            } catch {
              continue
            }
            if (!host) continue
            if (!resourceByHost[host]) {
              resourceByHost[host] = { sumDuration: 0, count: 0, _urlSet: new Set() }
            }
            const bucket = resourceByHost[host]
            bucket.sumDuration += r.duration
            bucket.count += 1
            bucket._urlSet.add(r.name)
          }
          for (const h of Object.keys(resourceByHost)) {
            const b = resourceByHost[h]
            const urls = [...b._urlSet].sort((a, x) => a.localeCompare(x))
            resourceByHost[h] = {
              sumDuration: b.sumDuration,
              count: b.count,
              resourceUrls: urls,
            }
          }
          return {
            approxTbtMs,
            longTaskCount: all.length,
            avgAdScriptResourceDurationMs,
            adScriptResourceCount: adScripts.length,
            resourceByHost,
          }
        })
        if (perfRaw && typeof perfRaw === 'object') {
          const { resourceByHost, ...perfRest } = perfRaw
          performanceMetrics = perfRest
          domainInsights = buildDomainInsights(
            resourceByHost && typeof resourceByHost === 'object' ? resourceByHost : {},
            pageErrors,
            consoleMessages,
            requestFailuresForReport,
          )
        } else {
          performanceMetrics = null
          domainInsights = null
        }
      } catch {
        performanceMetrics = null
        domainInsights = null
      }

      if (failOnPageError && pageErrors.length > 0) failures.push(`JS page errors: ${pageErrors.length}`)
      const pageScriptConsoleErrors = consoleMessages.filter((m) => m.type === 'error' && m.source !== 'devtools')
      if (failOnConsoleError && pageScriptConsoleErrors.length > 0) {
        failures.push(`Console errors: ${pageScriptConsoleErrors.length}`)
      }
      if (failOnRequestFailed && requestFailuresForReport.length > 0) {
        failures.push(`Request failures: ${requestFailuresForReport.length}`)
      }

      ok = failures.length === 0
    } finally {
      await context?.close().catch(() => {})
      await browser?.close().catch(() => {})
    }
  } catch (err) {
    failures.push(`Request failed: ${err instanceof Error ? err.message : String(err)}`)
    ok = false
  }

  const durationMs = Date.now() - startedAt
  // 집계(scriptIssueTop10·domainInsights)는 원본 기준으로 이미 계산됨.
  // 저장용 consoleMessages 는 동일 메시지를 합쳐 리포트 크기를 줄인다(dupeCount 보존).
  const scriptIssueTop10 = buildScriptIssueTop10(pageErrors, consoleMessages)
  const dedupedConsoleMessages = dedupeConsoleMessages(consoleMessages)
  const screenshotDir = reportPath ? screenshotDirForReport(reportPath) : ''
  /** 대시보드가 BASE_URL 뒤에 붙여 쓰는 웹 경로(public/ 접두어 제거) */
  const screenshotForReport = screenshot
    ? {
        capturedAt: screenshot.capturedAt,
        width: screenshot.width,
        totalHeight: screenshot.totalHeight,
        viewport: screenshot.viewport,
        emulation: useMobileEmulation ? 'mobile' : 'desktop',
        files: screenshot.files.map((name) => toWebPath(path.join(screenshotDir, name))),
        ...(screenshot.truncated ? { truncated: true } : {}),
      }
    : null

  const result = {
    ok,
    url: targetUrl,
    status,
    durationMs,
    checkedAt: new Date().toISOString(),
    failures,
    ...(screenshotForReport ? { screenshot: screenshotForReport } : {}),
    diagnostics: {
      pageErrors,
      consoleMessages: dedupedConsoleMessages,
      requestFailures: requestFailuresForReport,
      scriptIssueTop10,
      ...(performanceMetrics != null ? { performanceMetrics } : {}),
      ...(domainInsights != null ? { domainInsights } : {}),
    },
  }

  if (reportPath && reportPath !== '0' && reportPath.toLowerCase() !== 'none') {
    await ensureParentDir(reportPath)
    await writeFile(reportPath, JSON.stringify(result, null, 2), 'utf8')
    console.log(`Wrote report: ${reportPath}`)
  }

  // 이번 캡쳐를 매니페스트에 넣고, 보존 기간이 지난 항목과 남은 이미지 파일을 함께 정리한다.
  if (screenshotEnabled && screenshotDir) {
    try {
      const previous = await readManifest(screenshotDir)
      const merged = screenshot
        ? [
            {
              capturedAt: screenshot.capturedAt,
              files: screenshot.files,
              width: screenshot.width,
              totalHeight: screenshot.totalHeight,
              viewport: screenshot.viewport,
              emulation: useMobileEmulation ? 'mobile' : 'desktop',
              ...(screenshot.truncated ? { truncated: true } : {}),
            },
            ...previous,
          ]
        : previous
      const { kept } = pruneManifest(merged, { retentionHours: screenshotRetentionHours })
      await writeManifest(screenshotDir, kept)
      const { removed } = await pruneOrphanFiles(screenshotDir, kept)
      console.log(
        `[screenshot] ${screenshot ? `saved ${screenshot.files.length} file(s), ` : ''}kept=${kept.length} (${screenshotRetentionHours}h), removed=${removed}`,
      )
    } catch (err) {
      console.warn(`[screenshot] manifest update failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (ok) {
    console.log(`OK: ${targetUrl} (${status}) in ${durationMs}ms`)
    process.exitCode = 0
    return
  }

  console.error(`FAIL: ${targetUrl} (${status || 'no status'}) in ${durationMs}ms`)
  for (const f of failures) console.error(`- ${f}`)
  process.exitCode = 1
}

await mkdir('public', { recursive: true })
await main()