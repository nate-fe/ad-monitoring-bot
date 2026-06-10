/**
 * history.json 원격 소스 URL을 HISTORY_SOURCE_URL_* 에 주입합니다.
 * 우선순위: 이미 설정된 값 > SITE_URL(Vercel 등) > GitHub Pages URL
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

export function resolveVercelSiteBase() {
  const candidates = [
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const base = normalizeBaseUrl(candidate)
    if (base) return base
  }

  return ''
}

function resolveGitHubPagesBase() {
  const owner = process.env.GITHUB_REPOSITORY_OWNER
  const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
  if (!owner || !repo) return ''
  return `https://${owner}.github.io/${repo}`
}

export function applyVercelHistoryEnv() {
  const base = resolveVercelSiteBase() || resolveGitHubPagesBase()
  if (!base) {
    console.log('[history] No SITE_URL or GitHub Pages base; history will start fresh on this run.')
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
