import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const rootDir = process.argv[2] || 'public'

const aliasPairs = [
  ['news/view/monitor-report.json', 'news/monitor-report.json'],
  ['news/view/history.json', 'news/history.json'],
  ['pann/view/monitor-report.json', 'pann/monitor-report.json'],
  ['pann/view/history.json', 'pann/history.json'],
]

let copiedCount = 0
let skippedCount = 0

for (const [sourceRelativePath, targetRelativePath] of aliasPairs) {
  const sourcePath = path.join(rootDir, sourceRelativePath)
  const targetPath = path.join(rootDir, targetRelativePath)

  if (!existsSync(sourcePath)) {
    skippedCount += 1
    console.warn(`Skipped legacy alias (missing source): ${sourcePath}`)
    continue
  }

  await mkdir(path.dirname(targetPath), { recursive: true })
  await copyFile(sourcePath, targetPath)
  copiedCount += 1
  console.log(`Wrote legacy alias: ${targetPath}`)
}

console.log(`Legacy flat aliases complete. copied=${copiedCount}, skipped=${skippedCount}`)
