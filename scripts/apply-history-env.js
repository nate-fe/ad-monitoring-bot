/**
 * history.json 원격 소스 URL을 HISTORY_SOURCE_URL_* 에 주입합니다.
 * 우선순위: 이미 설정된 값 > HISTORY_SOURCE_BASE_URL > GitHub Pages URL
 */
const HISTORY_PATHS = {
  HISTORY_SOURCE_URL_NEWS_VIEW: 'news/view/history.json',
  HISTORY_SOURCE_URL_NEWS_HOME: 'news/home/history.json',
  HISTORY_SOURCE_URL_PANN_VIEW: 'pann/view/history.json',
  HISTORY_SOURCE_URL_PANN_HOME: 'pann/home/history.json',
}

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

function resolveGitHubPagesBase() {
  const owner = process.env.GITHUB_REPOSITORY_OWNER
  const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
  if (!owner || !repo) return ''
  return `https://${owner}.github.io/${repo}`
}

const YOONZEEN_PAGES_BASE = 'https://yoonzeen.github.io/ad-monitoring-bot'

export function resolveHistorySourceBase() {
  const explicit = normalizeBaseUrl(process.env.HISTORY_SOURCE_BASE_URL)
  if (explicit) return explicit

  // nate-fe: yoonzeen Pages가 canonical history — 자체 Pages는 아직 누적이 적음
  if (process.env.GITHUB_REPOSITORY_OWNER === 'nate-fe') {
    return YOONZEEN_PAGES_BASE
  }

  return resolveGitHubPagesBase()
}

export function applyHistoryEnv() {
  const base = resolveHistorySourceBase()
  if (!base) {
    console.log('[history] No history source base; history will start fresh on this run.')
    return { base: '', applied: [] }
  }

  const applied = []
  for (const [envName, relativePath] of Object.entries(HISTORY_PATHS)) {
    if (process.env[envName]) continue
    process.env[envName] = `${base}/${relativePath}`
    applied.push(envName)
  }

  if (applied.length > 0) {
    console.log(`[history] Using ${base} as history source base.`)
    for (const envName of applied) {
      console.log(`[history] ${envName}=${process.env[envName]}`)
    }
  }

  return { base, applied }
}
