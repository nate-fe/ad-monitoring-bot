import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function getEnv(name, { defaultValue = '' } = {}) {
  const v = process.env[name]
  if (v == null || v === '') return defaultValue
  return v
}

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

async function readJsonFile(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function fetchJsonArray(url) {
  if (!url) return []
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath)
  if (dir && dir !== '.') await mkdir(dir, { recursive: true })
}

function inferTargetScopeFromReportPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/').toLowerCase()
  if (normalized.includes('/news/home/monitor-report.json')) return 'news-home'
  if (normalized.includes('/news/view/monitor-report.json')) return 'news'
  if (normalized.includes('/pann/home/monitor-report.json')) return 'pann-home'
  if (normalized.includes('/pann/view/monitor-report.json')) return 'pann'
  return ''
}

function summarize(report) {
  const consoleMessages = report?.diagnostics?.consoleMessages ?? []
  const pageErrors = report?.diagnostics?.pageErrors ?? []
  const requestFailures = report?.diagnostics?.requestFailures ?? []
  const errorMessages = consoleMessages.filter((m) => m?.type === 'error')
  const pageScriptErrors = errorMessages.filter((m) => m?.source !== 'devtools')
  const warningMessages = consoleMessages.filter((m) => m?.type === 'warning')
  const logLikeMessages = consoleMessages.filter((m) => m?.type === 'log' || m?.type === 'info')
  // 페이지 스크립트 콘솔 오류만 (헤드리스 네트워크 줄은 devToolsConsoleSample·별도 집계)
  const consoleErrors = pageScriptErrors.length
  const consoleWarnings = warningMessages.length
  const consoleLogs = logLikeMessages.length
  const consoleErrorSample = pageScriptErrors.slice(0, 5).map((m) => ({
    type: m?.type ?? 'error',
    text: String(m?.text ?? ''),
    url: typeof m?.url === 'string' && m.url ? m.url : undefined,
    sourceUrl: typeof m?.sourceUrl === 'string' && m.sourceUrl ? m.sourceUrl : undefined,
    line: Number.isFinite(Number(m?.line)) ? Number(m.line) : undefined,
    column: Number.isFinite(Number(m?.column)) ? Number(m.column) : undefined,
  }))
  const consoleWarningSample = warningMessages.slice(0, 5).map((m) => ({
    type: m?.type ?? 'log',
    text: String(m?.text ?? ''),
    url: typeof m?.url === 'string' && m.url ? m.url : undefined,
    sourceUrl: typeof m?.sourceUrl === 'string' && m.sourceUrl ? m.sourceUrl : undefined,
    line: Number.isFinite(Number(m?.line)) ? Number(m.line) : undefined,
    column: Number.isFinite(Number(m?.column)) ? Number(m.column) : undefined,
  }))
  const consoleLogSample = logLikeMessages.slice(0, 8).map((m) => ({
    type: m?.type ?? 'log',
    text: String(m?.text ?? ''),
    url: typeof m?.url === 'string' && m.url ? m.url : undefined,
    sourceUrl: typeof m?.sourceUrl === 'string' && m.sourceUrl ? m.sourceUrl : undefined,
    line: Number.isFinite(Number(m?.line)) ? Number(m.line) : undefined,
    column: Number.isFinite(Number(m?.column)) ? Number(m.column) : undefined,
  }))
  const devToolsConsoleSample = errorMessages
    .filter((m) => m?.source === 'devtools')
    .slice(0, 8)
    .map((m) => ({
      type: 'error',
      text: String(m?.text ?? ''),
      url: typeof m?.url === 'string' && m.url ? m.url : undefined,
      sourceUrl: typeof m?.sourceUrl === 'string' && m.sourceUrl ? m.sourceUrl : undefined,
      line: Number.isFinite(Number(m?.line)) ? Number(m.line) : undefined,
      column: Number.isFinite(Number(m?.column)) ? Number(m.column) : undefined,
      source: 'devtools',
    }))
  const requestFailureSample = requestFailures.slice(0, 5).map((item) => ({
    url: String(item?.url ?? ''),
    method: String(item?.method ?? ''),
    resourceType: String(item?.resourceType ?? ''),
    errorText: String(item?.errorText ?? ''),
  }))
  const rawPm = report?.diagnostics?.performanceMetrics
  const performanceMetrics =
    rawPm && typeof rawPm === 'object'
      ? {
          approxTbtMs: Number(rawPm.approxTbtMs) || 0,
          longTaskCount: Number(rawPm.longTaskCount) || 0,
          avgAdScriptResourceDurationMs: Number(rawPm.avgAdScriptResourceDurationMs) || 0,
          adScriptResourceCount: Number(rawPm.adScriptResourceCount) || 0,
        }
      : undefined
  const pageErrorSample = pageErrors.slice(0, 5).map((item) => ({
    message: String(item?.message ?? ''),
    sourceUrl: typeof item?.sourceUrl === 'string' && item.sourceUrl ? item.sourceUrl : undefined,
    line: Number.isFinite(Number(item?.line)) ? Number(item.line) : undefined,
    column: Number.isFinite(Number(item?.column)) ? Number(item.column) : undefined,
  }))

  return {
    checkedAt: String(report?.checkedAt ?? ''),
    ok: Boolean(report?.ok),
    url: String(report?.url ?? ''),
    status: Number(report?.status ?? 0),
    durationMs: Number(report?.durationMs ?? 0),
    failures: Array.isArray(report?.failures) ? report.failures.slice(0, 50) : [],
    counts: {
      pageErrors: pageErrors.length,
      consoleErrors,
      consoleWarnings,
      consoleLogs,
      requestFailures: requestFailures.length,
    },
    pageErrorSample,
    consoleErrorSample,
    consoleWarningSample,
    consoleLogSample,
    devToolsConsoleSample,
    requestFailureSample,
    meta: {
      runId: getEnv('GITHUB_RUN_ID', { defaultValue: '' }),
      runUrl: getEnv('GITHUB_RUN_URL', { defaultValue: '' }),
      sha: getEnv('GITHUB_SHA', { defaultValue: '' }),
    },
    ...(performanceMetrics ? { performanceMetrics } : {}),
  }
}

function buildFallbackReport(targetScope) {
  return {
    checkedAt: new Date().toISOString(),
    ok: false,
    url: '',
    status: 0,
    durationMs: 0,
    failures: [`${targetScope || 'unknown'} monitor-report.json could not be read while updating history`],
    diagnostics: {
      pageErrors: [],
      consoleMessages: [],
      requestFailures: [],
    },
  }
}

function dedupeAndTrim(items, max) {
  const seen = new Set()
  /** @type {any[]} */
  const out = []
  for (const it of items) {
    const key =
      (it && it.meta && typeof it.meta.runId === 'string' && it.meta.runId) ||
      (it && typeof it.checkedAt === 'string' && it.checkedAt) ||
      JSON.stringify(it)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
    if (out.length >= max) break
  }
  return out
}

async function main() {
  // Defaults are for local dev (Vite serves from public/).
  // CI can override to write directly into dist/ for GitHub Pages.
  const reportPathFromEnv = getEnv('REPORT_PATH', { defaultValue: '' })
  const targetScope = getEnv('MONITOR_TARGET_SCOPE', {
    defaultValue: inferTargetScopeFromReportPath(reportPathFromEnv),
  })
  const reportPath = reportPathFromEnv || path.join('public', targetScope || 'news', 'monitor-report.json')
  const historyPath = getEnv('HISTORY_PATH', {
    defaultValue: path.join('public', targetScope || 'news', 'history.json'),
  })
  const historySourceUrl = getEnv('HISTORY_SOURCE_URL', { defaultValue: '' })
  // 기본 ~약 3년치(시간당 1회 기준). 오래된 항목은 오래될수록 잘림 — 더 늘리려면 HISTORY_MAX 환경 변수 사용.
  const historyMax = toInt(getEnv('HISTORY_MAX', { defaultValue: '26280' }), 26280)

  const report = (await readJsonFile(reportPath)) ?? buildFallbackReport(targetScope)
  const previous = await fetchJsonArray(historySourceUrl)
  const entry = summarize(report)

  // Most recent first.
  const merged = dedupeAndTrim([entry, ...previous], historyMax)
  await ensureParentDir(historyPath)
  await writeFile(historyPath, JSON.stringify(merged, null, 2), 'utf8')
  console.log(`Wrote history: ${historyPath} (items=${merged.length})`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err))
  process.exitCode = 1
})

