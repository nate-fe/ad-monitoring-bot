import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { filterHistoryJsonByUntil, parseJsonSyncUntilMs } from './json-sync-until.js'

const PUBLIC_JSON_PATHS = [
  'news/view/monitor-report.json',
  'news/view/history.json',
  'news/home/monitor-report.json',
  'news/home/history.json',
  'pann/view/monitor-report.json',
  'pann/view/history.json',
  'pann/home/monitor-report.json',
  'pann/home/history.json',
  'news/monitor-report.json',
  'news/history.json',
  'pann/monitor-report.json',
  'pann/history.json',
]

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
    return 'https://yoonzeen.github.io/ad-monitoring-bot'
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
  console.log(`[json-sync] Syncing from ${baseUrl} → public/ (overwrite when remote exists${untilLabel})`)

  let written = 0
  let skipped = 0

  for (const relativePath of PUBLIC_JSON_PATHS) {
    try {
      const result = await downloadJsonOverwrite(baseUrl, relativePath)
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
