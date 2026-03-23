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
  if (normalized.includes('/news/monitor-report.json')) return 'news'
  if (normalized.includes('/pann/monitor-report.json')) return 'pann'
  return ''
}

function summarize(report) {
  const consoleMessages = report?.diagnostics?.consoleMessages ?? []
  const pageErrors = report?.diagnostics?.pageErrors ?? []
  const requestFailures = report?.diagnostics?.requestFailures ?? []
  const errorMessages = consoleMessages.filter((m) => m?.type === 'error')
  const warningMessages = consoleMessages.filter((m) => m?.type === 'warning')
  const consoleErrors = errorMessages.length
  const consoleWarnings = warningMessages.length
  const consoleErrorSample = errorMessages.slice(0, 5).map((m) => ({
    type: m?.type ?? 'error',
    text: String(m?.text ?? ''),
    url: typeof m?.url === 'string' && m.url ? m.url : undefined,
  }))
  const consoleWarningSample = warningMessages.slice(0, 5).map((m) => ({
    type: m?.type ?? 'log',
    text: String(m?.text ?? ''),
    url: typeof m?.url === 'string' && m.url ? m.url : undefined,
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
      requestFailures: requestFailures.length,
    },
    consoleErrorSample,
    consoleWarningSample,
    meta: {
      runId: getEnv('GITHUB_RUN_ID', { defaultValue: '' }),
      runUrl: getEnv('GITHUB_RUN_URL', { defaultValue: '' }),
      sha: getEnv('GITHUB_SHA', { defaultValue: '' }),
    },
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
  const historyMax = toInt(getEnv('HISTORY_MAX', { defaultValue: '720' }), 720)

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

