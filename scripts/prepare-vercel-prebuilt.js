import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const distDir = 'dist'
const outputDir = '.vercel/output'
const staticDir = path.join(outputDir, 'static')

if (!existsSync(distDir)) {
  console.error('[vercel-prebuilt] dist/ not found. Run npm run build first.')
  process.exit(1)
}

await mkdir(staticDir, { recursive: true })

const entries = await readdir(distDir, { withFileTypes: true })
for (const entry of entries) {
  const from = path.join(distDir, entry.name)
  const to = path.join(staticDir, entry.name)
  await cp(from, to, { recursive: true })
}

const config = {
  version: 3,
  routes: [{ handle: 'filesystem' }],
}

await writeFile(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2), 'utf8')
console.log(`[vercel-prebuilt] Prepared ${staticDir} for deploy --prebuilt`)
