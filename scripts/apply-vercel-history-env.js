/**
 * Vercel 빌드/배포 시 이전 배포의 history.json URL을 HISTORY_SOURCE_URL_* 에 주입합니다.
 * SITE_URL(권장) 또는 VERCEL_PROJECT_PRODUCTION_URL 이 없으면 히스토리는 새로 시작합니다.
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

export function applyVercelHistoryEnv() {
  const base = resolveVercelSiteBase()
  if (!base) {
    console.log('[vercel-history] SITE_URL not set; history will start fresh on this deploy.')
    return { base: '', applied: [] }
  }

  const applied = []
  for (const [envName, relativePath] of Object.entries(HISTORY_PATHS)) {
    if (process.env[envName]) continue
    process.env[envName] = `${base}/${relativePath}`
    applied.push(envName)
  }

  if (applied.length > 0) {
    console.log(`[vercel-history] Using ${base} as history source base.`)
    for (const envName of applied) {
      console.log(`[vercel-history] ${envName}=${process.env[envName]}`)
    }
  }

  return { base, applied }
}
