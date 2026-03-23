import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.argv[2] || 'public'

const aliasPairs = [
  ['news/view/monitor-report.json', 'news/monitor-report.json'],
  ['news/view/history.json', 'news/history.json'],
  ['pann/view/monitor-report.json', 'pann/monitor-report.json'],
  ['pann/view/history.json', 'pann/history.json'],
]

for (const [sourceRelativePath, targetRelativePath] of aliasPairs) {
  const sourcePath = path.join(rootDir, sourceRelativePath)
  const targetPath = path.join(rootDir, targetRelativePath)
  await mkdir(path.dirname(targetPath), { recursive: true })
  await copyFile(sourcePath, targetPath)
  console.log(`Wrote legacy alias: ${targetPath}`)
}
