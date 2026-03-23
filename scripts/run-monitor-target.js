import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const scope = process.argv[2]

if (scope !== 'news' && scope !== 'pann') {
  console.error('Usage: node ./scripts/run-monitor-target.js <news|pann>')
  process.exit(1)
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

await loadDotEnv()

const envName = `MONITOR_TARGET_URL_${scope.toUpperCase()}`
const scopedUrl = process.env[envName] ?? ''
const directUrl = process.env.MONITOR_TARGET_URL ?? ''

if (!directUrl && !scopedUrl) {
  console.error(`Missing target URL. Set ${envName} or MONITOR_TARGET_URL before running ${scope} monitor.`)
  process.exit(1)
}

const child = spawn(
  process.execPath,
  [path.resolve(process.cwd(), 'monitor.js')],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      MONITOR_TARGET_SCOPE: scope,
      MONITOR_TARGET_URL: directUrl || scopedUrl,
      MONITOR_REPORT_PATH: process.env.MONITOR_REPORT_PATH || path.join('public', scope, 'monitor-report.json'),
    },
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
