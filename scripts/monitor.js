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
]

function safeSnippet(s, maxLen = 120) {
  const oneLine = String(s).replaceAll(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return `${oneLine.slice(0, maxLen - 1)}…`
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

function inferTargetScope(targetUrl) {
  const lower = String(targetUrl).toLowerCase()
  if (lower.includes('m.news.nate.com') || lower.includes('/news/')) return 'news'
  if (lower.includes('pann.nate.com') || lower.includes('/talk/') || lower.includes('/pann/')) return 'pann'
  return ''
}

function getScopedTargetUrl(scope) {
  if (!scope) return ''
  return getEnv(`MONITOR_TARGET_URL_${scope.toUpperCase()}`, { defaultValue: '' })
}

const CONSOLE_CAPTURE_SCRIPT = `
(() => {
  const key = '__adMonitorConsoleMessages__';
  if (globalThis[key]) return;

  const formatArg = (value) => {
    if (typeof value === 'string') return value;
    if (value == null) return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const store = [];
  Object.defineProperty(globalThis, key, {
    value: store,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  const wrap = (methodName, normalizedType) => {
    const original = console[methodName];
    if (typeof original !== 'function') return;
    console[methodName] = (...args) => {
      try {
        store.push({
          type: normalizedType,
          text: args.map(formatArg).join(' '),
          url: globalThis.location?.href || undefined,
        });
      } catch {
        // ignore capture errors
      }
      return original.apply(console, args);
    };
  };

  wrap('error', 'error');
  wrap('warn', 'warning');
})();
`

async function main() {
  await loadDotEnv()

  const requestedScope = getEnv('MONITOR_TARGET_SCOPE', { defaultValue: '' })
  const scopedTargetUrl = getScopedTargetUrl(requestedScope)
  const directTargetUrl = getEnv('MONITOR_TARGET_URL', { defaultValue: '' })
  if (requestedScope && !directTargetUrl && !scopedTargetUrl) {
    throw new Error(`Missing target URL for scope "${requestedScope}". Set MONITOR_TARGET_URL_${requestedScope.toUpperCase()} or MONITOR_TARGET_URL.`)
  }
  const targetUrl = directTargetUrl || scopedTargetUrl || 'https://m.news.nate.com/view/20260223n02867?issue_sq=10477'
  const targetScope = requestedScope || inferTargetScope(targetUrl)
  const timeoutMs = Number(getEnv('MONITOR_TIMEOUT_MS', { defaultValue: '45000' }))
  const navTimeoutMs = Number(getEnv('MONITOR_NAV_TIMEOUT_MS', { defaultValue: '30000' }))
  const afterLoadWaitMs = Number(getEnv('MONITOR_WAIT_AFTER_LOAD_MS', { defaultValue: '1500' }))
  const userAgent = getEnv('MONITOR_USER_AGENT', {
    defaultValue: 'ad-monitoring-bot/1.0 (+https://github.com)',
  })

  if (!targetScope) {
    throw new Error('Could not infer target scope from MONITOR_TARGET_URL. Set MONITOR_TARGET_SCOPE to news or pann.')
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
  /** @type {{ message: string, stack?: string }[]} */
  const pageErrors = []
  /** @type {{ type: string, text: string, url?: string }[]} */
  const consoleMessages = []
  /** @type {{ url: string, method: string, resourceType: string, errorText: string }[]} */
  const requestFailures = []

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
      await context.addInitScript(CONSOLE_CAPTURE_SCRIPT)
      const page = await context.newPage()
      page.setDefaultTimeout(Number.isFinite(timeoutMs) ? timeoutMs : 45000)
      page.setDefaultNavigationTimeout(Number.isFinite(navTimeoutMs) ? navTimeoutMs : 30000)

      page.on('pageerror', (err) => {
        const message = err instanceof Error ? err.message : String(err)
        if (shouldIgnore(message)) return
        pageErrors.push({ message, stack: err instanceof Error ? err.stack : undefined })
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
      if (Number.isFinite(afterLoadWaitMs) && afterLoadWaitMs > 0) {
        await page.waitForTimeout(afterLoadWaitMs)
      }

      const capturedConsoleMessages = await page.evaluate(() => {
        const key = '__adMonitorConsoleMessages__'
        const messages = globalThis[key]
        return Array.isArray(messages) ? messages : []
      })
      consoleMessages.push(
        ...capturedConsoleMessages.filter((item) => item && !shouldIgnore(String(item.text ?? ''))),
      )

      if (failOnPageError && pageErrors.length > 0) failures.push(`JS page errors: ${pageErrors.length}`)
      if (failOnConsoleError && consoleMessages.some((m) => m.type === 'error')) {
        failures.push(`Console errors: ${consoleMessages.filter((m) => m.type === 'error').length}`)
      }
      if (failOnRequestFailed && requestFailures.length > 0) failures.push(`Request failures: ${requestFailures.length}`)

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
  const result = {
    ok,
    url: targetUrl,
    status,
    durationMs,
    checkedAt: new Date().toISOString(),
    failures,
    diagnostics: {
      pageErrors,
      consoleMessages,
      requestFailures,
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