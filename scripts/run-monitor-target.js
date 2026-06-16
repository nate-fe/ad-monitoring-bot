import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const scope = process.argv[2]
const validScopes = ['news', 'news-home', 'pann', 'pann-home', 'news-pc', 'news-pc-home', 'pann-pc', 'pann-pc-home']

const SCOPE_CONFIG = {
  news: {
    envNames: ['MONITOR_TARGET_URL_NEWS_VIEW', 'MONITOR_TARGET_URL_NEWS'],
    reportPath: path.join('public', 'news', 'view', 'monitor-report.json'),
  },
  'news-home': {
    envNames: ['MONITOR_TARGET_URL_NEWS_HOME'],
    reportPath: path.join('public', 'news', 'home', 'monitor-report.json'),
  },
  pann: {
    envNames: ['MONITOR_TARGET_URL_PANN_VIEW', 'MONITOR_TARGET_URL_PANN'],
    reportPath: path.join('public', 'pann', 'view', 'monitor-report.json'),
  },
  'pann-home': {
    envNames: ['MONITOR_TARGET_URL_PANN_HOME'],
    reportPath: path.join('public', 'pann', 'home', 'monitor-report.json'),
  },
  'news-pc': {
    envNames: ['MONITOR_TARGET_URL_NEWS_PC_VIEW', 'MONITOR_TARGET_URL_NEWS_PC'],
    reportPath: path.join('public', 'news', 'pc', 'view', 'monitor-report.json'),
  },
  'news-pc-home': {
    envNames: ['MONITOR_TARGET_URL_NEWS_PC_HOME'],
    reportPath: path.join('public', 'news', 'pc', 'home', 'monitor-report.json'),
  },
  'pann-pc': {
    envNames: ['MONITOR_TARGET_URL_PANN_PC_VIEW', 'MONITOR_TARGET_URL_PANN_PC'],
    reportPath: path.join('public', 'pann', 'pc', 'view', 'monitor-report.json'),
  },
  'pann-pc-home': {
    envNames: ['MONITOR_TARGET_URL_PANN_PC_HOME'],
    reportPath: path.join('public', 'pann', 'pc', 'home', 'monitor-report.json'),
  },
}

if (!validScopes.includes(scope)) {
  console.error('Usage: node ./scripts/run-monitor-target.js <news|news-home|pann|pann-home|news-pc|news-pc-home|pann-pc|pann-pc-home>')
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

const scopeConfig = SCOPE_CONFIG[scope]
const scopedUrl = scopeConfig.envNames.map((name) => process.env[name] ?? '').find(Boolean) ?? ''
const directUrl = process.env.MONITOR_TARGET_URL ?? ''

if (!directUrl && !scopedUrl) {
  console.error(`Missing target URL. Set ${scopeConfig.envNames.join(' or ')} or MONITOR_TARGET_URL before running ${scope} monitor.`)
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
      MONITOR_REPORT_PATH: process.env.MONITOR_REPORT_PATH || scopeConfig.reportPath,
    },
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
