import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MANIFEST_FILE,
  parseRetentionHours,
  pruneManifest,
  pruneOrphanFiles,
  readManifest,
  writeManifest,
} from './screenshot-store.js'

/**
 * dist/ 는 매 실행마다 새로 만들어지므로, 직전 Pages 배포에 올라간 최근 캡쳐를 먼저 내려받아야
 * 보존 기간(기본 24시간)만큼의 기록이 이어진다. JSON 과 달리 이미지는 이 저장소 Pages 에만 있다.
 */
const SCREENSHOT_DIRS = [
  'news/view',
  'news/home',
  'news/pc/view',
  'news/pc/home',
  'pann/view',
  'pann/home',
  'pann/pc/view',
  'pann/pc/home',
]

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

function resolveBaseUrl() {
  const fromEnv = normalizeBaseUrl(process.env.SCREENSHOT_SYNC_BASE_URL)
  if (fromEnv) return fromEnv

  const owner = process.env.GITHUB_REPOSITORY_OWNER
  const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
  if (!owner || !repo) return ''
  return `https://${owner}.github.io/${repo}`
}

async function fileExists(filePath) {
  try {
    const info = await stat(filePath)
    return info.isFile() && info.size > 0
  } catch {
    return false
  }
}

async function downloadBinary(url, destPath) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) return false
  const buffer = Buffer.from(await res.arrayBuffer())
  if (!buffer.length) return false
  await mkdir(path.dirname(destPath), { recursive: true })
  await writeFile(destPath, buffer)
  return true
}

async function fetchRemoteManifest(baseUrl, relativeDir) {
  try {
    const res = await fetch(`${baseUrl}/${relativeDir}/screenshots/${MANIFEST_FILE}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function syncDir(baseUrl, relativeDir, retentionHours) {
  const localDir = path.join('public', relativeDir, 'screenshots')
  const remoteEntries = await fetchRemoteManifest(baseUrl, relativeDir)
  const localEntries = await readManifest(localDir)
  const { kept } = pruneManifest([...localEntries, ...remoteEntries], { retentionHours })

  /** 파일을 실제로 확보한 항목만 매니페스트에 남긴다 — 깨진 이미지 링크를 대시보드에 넘기지 않기 위해. */
  const usable = []
  let downloaded = 0
  let missing = 0

  for (const entry of kept) {
    let complete = true
    for (const name of entry.files ?? []) {
      const destPath = path.join(localDir, String(name))
      if (await fileExists(destPath)) continue
      try {
        const ok = await downloadBinary(`${baseUrl}/${relativeDir}/screenshots/${name}`, destPath)
        if (ok) {
          downloaded += 1
        } else {
          complete = false
          missing += 1
        }
      } catch {
        complete = false
        missing += 1
      }
    }
    if (complete) usable.push(entry)
  }

  if (usable.length || localEntries.length) {
    await writeManifest(localDir, usable)
    await pruneOrphanFiles(localDir, usable)
  }

  return { relativeDir, entries: usable.length, downloaded, missing }
}

async function main() {
  const baseUrl = resolveBaseUrl()
  if (!baseUrl) {
    console.log('[screenshot-sync] SCREENSHOT_SYNC_BASE_URL not set — skipping (local run).')
    return
  }

  const retentionHours = parseRetentionHours(process.env.MONITOR_SCREENSHOT_RETENTION_HOURS)
  console.log(`[screenshot-sync] restoring last ${retentionHours}h from ${baseUrl}`)

  for (const relativeDir of SCREENSHOT_DIRS) {
    try {
      const result = await syncDir(baseUrl, relativeDir, retentionHours)
      console.log(
        `[screenshot-sync] ${result.relativeDir}: kept=${result.entries}, downloaded=${result.downloaded}, missing=${result.missing}`,
      )
    } catch (err) {
      console.warn(`[screenshot-sync] skip ${relativeDir} (${err instanceof Error ? err.message : String(err)})`)
    }
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCli) {
  main().catch((err) => {
    // 캡쳐 복원 실패는 모니터링 자체를 막지 않는다.
    console.warn(err instanceof Error ? err.stack || err.message : String(err))
  })
}
