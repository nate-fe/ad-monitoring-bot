import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { filterHistoryJsonByUntil, parseJsonSyncUntilMs } from './json-sync-until.js'

const PUBLIC_JSON_PATHS = [
  'news/view/monitor-report.json',
  'news/view/history.json',
  'news/home/monitor-report.json',
  'news/home/history.json',
  'news/pc/view/monitor-report.json',
  'news/pc/view/history.json',
  'news/pc/home/monitor-report.json',
  'news/pc/home/history.json',
  'pann/view/monitor-report.json',
  'pann/view/history.json',
  'pann/home/monitor-report.json',
  'pann/home/history.json',
  'pann/pc/view/monitor-report.json',
  'pann/pc/view/history.json',
  'pann/pc/home/monitor-report.json',
  'pann/pc/home/history.json',
  'news/monitor-report.json',
  'news/history.json',
  'pann/monitor-report.json',
  'pann/history.json',
]

const YOONZEEN_PAGES_BASE = 'https://yoonzeen.github.io/ad-monitoring-bot'

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

export function resolveJsonSyncBaseUrl() {
  const fromEnv = normalizeBaseUrl(process.env.JSON_SYNC_BASE_URL)
  if (fromEnv) return fromEnv

  if (process.env.GITHUB_REPOSITORY_OWNER === 'nate-fe') {
    return YOONZEEN_PAGES_BASE
  }

  return ''
}

function resolveGitHubPagesBase() {
  const owner = process.env.GITHUB_REPOSITORY_OWNER
  const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
  if (!owner || !repo) return ''
  return `https://${owner}.github.io/${repo}`
}

function resolveJsonSyncBaseUrlForPath(relativePath) {
  const fromEnv = normalizeBaseUrl(process.env.JSON_SYNC_BASE_URL)
  if (fromEnv) return fromEnv

  if (process.env.GITHUB_REPOSITORY_OWNER === 'nate-fe') {
    // yoonzeen Pages is the mobile canonical source, but PC JSON lives on
    // this repo's Pages deployment.
    if (relativePath.includes('/pc/')) return resolveGitHubPagesBase() || YOONZEEN_PAGES_BASE
    return YOONZEEN_PAGES_BASE
  }

  return ''
}

async function downloadJsonOverwrite(baseUrl, relativePath) {
  const url = `${baseUrl}/${relativePath}`
  const destPath = path.join('public', relativePath)

  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    return { relativePath, status: 'skipped', reason: `HTTP ${res.status}` }
  }

  let raw = await res.text()
  JSON.parse(raw)

  const untilMs = parseJsonSyncUntilMs()
  if (untilMs && relativePath.endsWith('history.json')) {
    const before = JSON.parse(raw).length
    raw = filterHistoryJsonByUntil(raw, untilMs)
    const after = JSON.parse(raw).length
    console.log(`[json-sync] filtered ${relativePath} by until=${process.env.JSON_SYNC_UNTIL} (${before} → ${after})`)
  }

  await mkdir(path.dirname(destPath), { recursive: true })
  await writeFile(destPath, raw, 'utf8')

  return { relativePath, status: 'written', destPath }
}

async function main() {
  const baseUrl = resolveJsonSyncBaseUrl()
  if (!baseUrl) {
    console.log('[json-sync] JSON_SYNC_BASE_URL not set — skipping public JSON sync.')
    return
  }

  const untilLabel = process.env.JSON_SYNC_UNTIL ? `, until=${process.env.JSON_SYNC_UNTIL}` : ''
  console.log(`[json-sync] Syncing from configured sources → public/ (overwrite when remote exists${untilLabel})`)

  let written = 0
  let skipped = 0

  for (const relativePath of PUBLIC_JSON_PATHS) {
    try {
      const sourceBaseUrl = resolveJsonSyncBaseUrlForPath(relativePath)
      if (!sourceBaseUrl) {
        skipped += 1
        console.warn(`[json-sync] skip ${relativePath} (JSON_SYNC_BASE_URL not set)`)
        continue
      }

      const result = await downloadJsonOverwrite(sourceBaseUrl, relativePath)
      if (result.status === 'written') {
        written += 1
        console.log(`[json-sync] overwrote ${result.destPath}`)
      } else {
        skipped += 1
        console.warn(`[json-sync] skip ${relativePath} (${result.reason})`)
      }
    } catch (err) {
      skipped += 1
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[json-sync] skip ${relativePath} (${message})`)
    }
  }

  console.log(`[json-sync] done. written=${written}, skipped=${skipped}`)
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCli) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack || err.message : String(err))
    process.exitCode = 1
  })
}
