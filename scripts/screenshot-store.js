import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** 캡쳐 보존 기간(기본 24시간). Pages 용량·배포 시간이 부담되면 줄인다. */
export const DEFAULT_RETENTION_HOURS = 24

export const MANIFEST_FILE = 'manifest.json'

/** monitor-report.json 과 같은 디렉터리 아래 screenshots/ 에 모아 둔다. */
export function screenshotDirForReport(reportPath) {
  return path.join(path.dirname(reportPath), 'screenshots')
}

/**
 * public/ · dist/ 접두어를 뗀 웹 경로. 대시보드는 BASE_URL 뒤에 그대로 붙여서 불러온다.
 * 예: public/news/view/screenshots/a.jpg → news/view/screenshots/a.jpg
 */
export function toWebPath(filePath) {
  const normalized = String(filePath).replaceAll('\\', '/')
  return normalized.replace(/^(?:\.\/)?(?:public|dist)\//, '')
}

/** ISO 시각을 파일명으로 쓸 수 있게 바꾼다. 2026-08-10T09:07:00.000Z → 2026-08-10T09-07-00-000Z */
export function isoToFileBase(iso) {
  return String(iso).replaceAll(':', '-').replaceAll('.', '-')
}

export function parseRetentionHours(value, fallback = DEFAULT_RETENTION_HOURS) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

export async function readManifest(dirPath) {
  try {
    const raw = await readFile(path.join(dirPath, MANIFEST_FILE), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function writeManifest(dirPath, entries) {
  await mkdir(dirPath, { recursive: true })
  await writeFile(path.join(dirPath, MANIFEST_FILE), JSON.stringify(entries, null, 2), 'utf8')
}

function entryTimeMs(entry) {
  const t = Date.parse(String(entry?.capturedAt ?? ''))
  return Number.isFinite(t) ? t : Number.NaN
}

/** 같은 capturedAt 은 한 번만 남기고 최신순 정렬 후, 보존 기간을 넘긴 항목을 잘라낸다. */
export function pruneManifest(entries, { retentionHours = DEFAULT_RETENTION_HOURS, nowMs = Date.now() } = {}) {
  const cutoff = nowMs - retentionHours * 60 * 60 * 1000
  const seen = new Set()
  /** @type {any[]} */
  const kept = []
  /** @type {any[]} */
  const dropped = []

  const sorted = [...entries]
    .filter((e) => e && Array.isArray(e.files) && e.files.length > 0)
    .sort((a, b) => (entryTimeMs(b) || 0) - (entryTimeMs(a) || 0))

  for (const entry of sorted) {
    const key = String(entry.capturedAt ?? '')
    if (!key || seen.has(key)) {
      dropped.push(entry)
      continue
    }
    seen.add(key)

    const t = entryTimeMs(entry)
    // 시각을 못 읽는 항목은 남겨 둘 근거가 없으므로 버린다.
    if (!Number.isFinite(t) || t < cutoff) {
      dropped.push(entry)
      continue
    }
    kept.push(entry)
  }

  return { kept, dropped }
}

/** manifest 에 남은 파일 외의 이미지는 지운다(이전 실행에서 넘어온 것 포함). */
export async function pruneOrphanFiles(dirPath, keptEntries) {
  const keep = new Set()
  for (const entry of keptEntries) {
    for (const file of entry.files ?? []) keep.add(String(file))
  }

  let names = []
  try {
    names = await readdir(dirPath)
  } catch {
    return { removed: 0 }
  }

  let removed = 0
  for (const name of names) {
    if (name === MANIFEST_FILE) continue
    if (keep.has(name)) continue
    if (!/\.(?:jpg|jpeg|png|webp)$/i.test(name)) continue
    try {
      await unlink(path.join(dirPath, name))
      removed += 1
    } catch {
      // 지우지 못해도 다음 실행에서 다시 시도하면 된다.
    }
  }
  return { removed }
}
