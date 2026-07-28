import process from 'node:process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

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

function mapLogLevelToConsoleType(level) {
  if (level === 'error') return 'error'
  if (level === 'warning') return 'warning'
  return 'log'
}

/** 화면 아래쪽 지연 로딩 광고(슬라이더·비디오 등)는 뷰포트에 들어와야 초기화되므로, 실제 사용자처럼 스크롤해 내려가며 트리거한다 */
async function simulateUserScroll(page, { steps, stepDelayMs }) {
  try {
    const viewportHeight = page.viewportSize()?.height ?? 720
    const stepPx = Math.round(viewportHeight * 0.85)
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, stepPx)
      await page.waitForTimeout(stepDelayMs)
    }
  } catch {
    // 스크롤 시뮬레이션 실패는 치명적이지 않음 — 베스트에포트
  }
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
  const userAgent = getEnv('MONITOR_USER_AGENT', {
    defaultValue: 'ad-monitoring-bot/1.0 (+https://github.com)',
  })
  /** 화면 아래쪽 지연 로딩 광고를 트리거하기 위한 스크롤 시뮬레이션 설정 */
  const scrollEnabled = parseBool(getEnv('MONITOR_SCROLL_ENABLED', { defaultValue: 'true' }), true)
  const scrollSteps = Number(getEnv('MONITOR_SCROLL_STEPS', { defaultValue: '12' }))
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

  let status = 0
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
  /** CDP Runtime.consoleAPICalled 로 뽑은 실제 출처. key=`${type} ${text}` → {sourceUrl,line,column} */
  /** @type {Map<string, { sourceUrl: string, line?: number, column?: number }>} */
  const cdpConsoleSourceByKey = new Map()

  const shouldIgnore = (text) => ignoreErrorPatterns.some((p) => p && text.includes(p))

  try {
    /** @type {import('playwright').Browser | undefined} */
    let browser
    /** @type {import('playwright').BrowserContext | undefined} */
    let context
    try {
      browser = await chromium.launch({ headless: true })
      context = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 720 },
      })
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
        if (!text || shouldIgnore(text)) return
        browserLogMessages.push({
          type: mapLogLevelToConsoleType(entry.level),
          text,
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
        await simulateUserScroll(page, {
          steps: Number.isFinite(scrollSteps) ? scrollSteps : 12,
          stepDelayMs: Number.isFinite(scrollStepDelayMs) ? scrollStepDelayMs : 400,
        })
      }

      if (Number.isFinite(afterLoadWaitMs) && afterLoadWaitMs > 0) {
        await page.waitForTimeout(afterLoadWaitMs)
      }

      const capturedConsoleMessages = await page.evaluate(() => {
        const key = '__adMonitorConsoleMessages__'
        const messages = globalThis[key]
        return Array.isArray(messages) ? messages : []
      })
      const fromPage = capturedConsoleMessages.filter((item) => item && !shouldIgnore(String(item.text ?? '')))
      consoleMessages.push(...fromPage)
      const pageTexts = new Set(fromPage.map((m) => String(m.text ?? '')))

      for (const m of playwrightPageConsoleMessages) {
        const tx = String(m.text ?? '')
        if (tx === 'JSHandle@node' && consoleMessages.some((x) => String(x.text ?? '').includes('[HTML 태그 객체:'))) {
          continue
        }
        if (pageTexts.has(tx)) {
          const idx = consoleMessages.findIndex((x) => String(x.text ?? '') === tx)
          if (idx >= 0 && m.sourceUrl) {
            const cur = consoleMessages[idx]
            if (!cur?.sourceUrl || cur.line == null) consoleMessages[idx] = m
          }
          continue
        }
        pageTexts.add(tx)
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

      for (const m of devToolsFiltered) {
        if (pageTexts.has(m.text)) continue
        pageTexts.add(m.text)
        consoleMessages.push(m)
      }

      for (const m of browserLogMessages) {
        const tx = String(m.text ?? '')
        if (pageTexts.has(tx)) continue
        pageTexts.add(tx)
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
  const result = {
    ok,
    url: targetUrl,
    status,
    durationMs,
    checkedAt: new Date().toISOString(),
    failures,
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