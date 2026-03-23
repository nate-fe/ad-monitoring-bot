import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const scope = process.argv[2]
const validScopes = ['news', 'news-home', 'pann', 'pann-home']

const SCOPE_CONFIG = {
  news: {
    historyEnvNames: ['HISTORY_SOURCE_URL_NEWS_VIEW', 'HISTORY_SOURCE_URL_NEWS'],
    reportPath: path.join('public', 'news', 'view', 'monitor-report.json'),
    historyPath: path.join('public', 'news', 'view', 'history.json'),
  },
  'news-home': {
    historyEnvNames: ['HISTORY_SOURCE_URL_NEWS_HOME'],
    reportPath: path.join('public', 'news', 'home', 'monitor-report.json'),
    historyPath: path.join('public', 'news', 'home', 'history.json'),
  },
  pann: {
    historyEnvNames: ['HISTORY_SOURCE_URL_PANN_VIEW', 'HISTORY_SOURCE_URL_PANN'],
    reportPath: path.join('public', 'pann', 'view', 'monitor-report.json'),
    historyPath: path.join('public', 'pann', 'view', 'history.json'),
  },
  'pann-home': {
    historyEnvNames: ['HISTORY_SOURCE_URL_PANN_HOME'],
    reportPath: path.join('public', 'pann', 'home', 'monitor-report.json'),
    historyPath: path.join('public', 'pann', 'home', 'history.json'),
  },
}

if (!validScopes.includes(scope)) {
  console.error('Usage: node ./scripts/run-history-target.js <news|news-home|pann|pann-home>')
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

const child = spawn(
  process.execPath,
  [path.resolve(process.cwd(), 'scripts', 'update-history.js')],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      MONITOR_TARGET_SCOPE: scope,
      REPORT_PATH: process.env.REPORT_PATH || scopeConfig.reportPath,
      HISTORY_PATH: process.env.HISTORY_PATH || scopeConfig.historyPath,
      HISTORY_SOURCE_URL:
        process.env.HISTORY_SOURCE_URL ||
        scopeConfig.historyEnvNames.map((name) => process.env[name] ?? '').find(Boolean) ||
        '',
    },
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
