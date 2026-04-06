import type { MonitorHistoryEntry, MonitorReport } from './types'

export type IssueSourceCandidate =
  | string
  | {
      text?: string
      url?: string
      /** 스크립트 출처 URL — 페이지 URL과 다를 때 분류에 사용 */
      sourceUrl?: string
    }

export type ClassifiedIssue = {
  key: string
  label: string
  count: number
}

export const ISSUE_SOURCE_RULES = [
  { key: 'adsense', label: 'Google AdSense', patterns: ['googlesyndication', 'pagead2', 'show_ads.js', 'adsbygoogle'] },
  { key: 'gam', label: 'Google Ad Manager', patterns: ['googletag', 'doubleclick', 'pubads'] },
  { key: 'dable', label: 'Dable', patterns: ['api.dable.io', 'dablewidget', 'dable'] },
  { key: 'widerplanet', label: 'WiderPlanet', patterns: ['widerplanet'] },
  { key: 'mobwith', label: 'Mobwith', patterns: ['mobwith', 'nateimp.mobwith.co.kr'] },
  { key: 'criteo', label: 'Criteo', patterns: ['criteo'] },
  {
    key: 'taboola',
    label: 'Taboola',
    patterns: ['taboola', 'cdn.taboola.com', 'trc.taboola.com', 'api.taboola.com'],
  },
  { key: 'nate', label: 'Nate 내부', patterns: ['news.nate.com', 'm.news.nate.com', 'nate.com'] },
] as const

export function extractHttpUrlFromText(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s)\]}>'"]+/i)
  return m ? m[0] : undefined
}

export function shouldHideConsoleWarning(text: string) {
  return text.includes('automatically upgraded to HTTPS')
}

export function classifyIssueText(candidate: IssueSourceCandidate) {
  const lower =
    typeof candidate === 'string'
      ? candidate.toLowerCase()
      : [candidate.sourceUrl, candidate.url, candidate.text]
          .filter((s): s is string => Boolean(s))
          .join(' ')
          .toLowerCase()
  for (const rule of ISSUE_SOURCE_RULES) {
    if (rule.patterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
      return { key: rule.key, label: rule.label }
    }
  }
  return { key: 'other', label: '기타/미분류' }
}

export function buildClassifiedIssues(items: IssueSourceCandidate[]): ClassifiedIssue[] {
  const bucket = new Map<string, ClassifiedIssue>()

  for (const item of items) {
    const matched = classifyIssueText(item)
    const prev = bucket.get(matched.key)
    if (prev) {
      prev.count += 1
    } else {
      bucket.set(matched.key, { ...matched, count: 1 })
    }
  }

  return Array.from(bucket.values()).sort((a, b) => b.count - a.count)
}

function historySampleToCandidate(
  entry: MonitorHistoryEntry,
  m: { text: string; url?: string; sourceUrl?: string },
): IssueSourceCandidate {
  const pageUrl = entry.url?.trim() ?? ''
  const u = m.url?.trim()
  return {
    text: m.text,
    url: pageUrl && u === pageUrl ? undefined : m.url,
    sourceUrl: m.sourceUrl,
  }
}

function isDevtoolsConsoleSample(m: unknown): boolean {
  return typeof m === 'object' && m != null && (m as { source?: string }).source === 'devtools'
}

/**
 * 최근 실행 기록의 「문제가 발생한 광고/영역」 칩.
 * consoleError / warning / log 샘플만 사용하고, 헤드리스는 제외한다.
 * (`devToolsConsoleSample` 미사용, `source === 'devtools'` 행도 스킵.)
 */
export function classifyHistoryEntry(entry: MonitorHistoryEntry): ClassifiedIssue[] {
  const items: IssueSourceCandidate[] = []

  for (const m of entry.consoleErrorSample ?? []) {
    if (isDevtoolsConsoleSample(m)) continue
    items.push(historySampleToCandidate(entry, m))
  }
  for (const m of entry.consoleWarningSample ?? []) {
    if (isDevtoolsConsoleSample(m)) continue
    items.push(historySampleToCandidate(entry, m))
  }

  return buildClassifiedIssues(items)
}

export type AdIssueBreakdownRow = {
  key: string
  label: string
  errors: number
  warnings: number
}

function bump(
  map: Map<string, AdIssueBreakdownRow>,
  candidate: IssueSourceCandidate,
  field: 'errors' | 'warnings',
) {
  const { key, label } = classifyIssueText(candidate)
  const prev = map.get(key)
  if (prev) {
    prev[field] += 1
  } else {
    map.set(key, {
      key,
      label,
      errors: field === 'errors' ? 1 : 0,
      warnings: field === 'warnings' ? 1 : 0,
    })
  }
}

/** 콘솔 오류·경고(헤드리스 source 제외), 페이지 오류, 요청 실패를 광고/영역 규칙으로 묶어 집계합니다. */
export function getAdIssueBreakdown(report: MonitorReport): AdIssueBreakdownRow[] {
  const map = new Map<string, AdIssueBreakdownRow>()

  for (const m of report.diagnostics?.consoleMessages ?? []) {
    if (m.source === 'devtools') continue
    if (m.type === 'error') {
      bump(
        map,
        {
          text: m.text,
          url: m.url ?? extractHttpUrlFromText(m.text),
          sourceUrl: m.sourceUrl,
        },
        'errors',
      )
    }
    if (m.type === 'warning' && !shouldHideConsoleWarning(m.text)) {
      bump(map, { text: m.text, url: m.url, sourceUrl: m.sourceUrl }, 'warnings')
    }
  }

  for (const e of report.diagnostics?.pageErrors ?? []) {
    bump(map, { text: e.message, sourceUrl: e.sourceUrl }, 'errors')
  }

  for (const r of report.diagnostics?.requestFailures ?? []) {
    bump(map, { url: r.url }, 'errors')
  }

  return Array.from(map.values())
    .filter((r) => r.errors > 0 || r.warnings > 0)
    .sort((a, b) => b.errors + b.warnings - (a.errors + a.warnings))
}

function monthKeyFromCheckedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** 월 축 라벨 (예: 2026년 4월) */
export function formatMonthKeyShortLabel(monthKey: string): string {
  const d = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return monthKey
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}

export type MonthlyStackSeries = {
  key: string
  label: string
  colorIndex: number
  data: { x: string; y: number }[]
}

export type MonthlyConsoleAdChartModel = {
  monthKeys: string[]
  errorsSeries: MonthlyStackSeries[]
  warningsSeries: MonthlyStackSeries[]
  /** 샘플 메시지를 하나라도 집계했는지 (그래프가 비어 있을 때 안내용) */
  hasAnyConsoleSample: boolean
}

export const MONTHLY_AD_CHART_FILLS = [
  '#7c88ff',
  '#52d1ff',
  '#f97316',
  '#22c55e',
  '#a78bfa',
  '#fb7185',
  '#eab308',
  '#64748b',
] as const

/**
 * 최근 실행 기록의 콘솔 샘플(실행당 오류·경고)을 월·광고 키로 집계해 스택 막대용 시리즈를 만듭니다.
 * 헤드리스(devToolsConsoleSample)는 그래프에 넣지 않습니다. 전체 건수가 아니라 저장된 샘플 건수 기준입니다.
 */
export function buildMonthlyConsoleAdChartModel(
  items: MonitorHistoryEntry[],
  options?: { topAds?: number },
): MonthlyConsoleAdChartModel {
  const topN = options?.topAds ?? 7
  const cell = new Map<string, Map<string, { label: string; errors: number; warnings: number }>>()
  let hasAnyConsoleSample = false

  const bumpCell = (month: string, adKey: string, label: string, field: 'errors' | 'warnings') => {
    let row = cell.get(month)
    if (!row) {
      row = new Map()
      cell.set(month, row)
    }
    const cur = row.get(adKey)
    if (cur) {
      cur[field] += 1
    } else {
      row.set(adKey, {
        label,
        errors: field === 'errors' ? 1 : 0,
        warnings: field === 'warnings' ? 1 : 0,
      })
    }
  }

  const bumpMsg = (month: string, candidate: IssueSourceCandidate, field: 'errors' | 'warnings') => {
    hasAnyConsoleSample = true
    const { key, label } = classifyIssueText(candidate)
    bumpCell(month, key, label, field)
  }

  for (const entry of items) {
    const mk = monthKeyFromCheckedAt(entry.checkedAt)
    if (!mk) continue

    for (const m of entry.consoleErrorSample ?? []) {
      bumpMsg(mk, { text: m.text, url: m.url ?? extractHttpUrlFromText(m.text), sourceUrl: m.sourceUrl }, 'errors')
    }
    for (const m of entry.consoleWarningSample ?? []) {
      if (shouldHideConsoleWarning(m.text)) continue
      bumpMsg(mk, { text: m.text, url: m.url, sourceUrl: m.sourceUrl }, 'warnings')
    }
  }

  const monthKeys = Array.from(cell.keys()).sort((a, b) => a.localeCompare(b))

  if (!monthKeys.length) {
    return { monthKeys: [], errorsSeries: [], warningsSeries: [], hasAnyConsoleSample }
  }

  const adTotals = new Map<string, { label: string; total: number }>()
  for (const mk of monthKeys) {
    const row = cell.get(mk)!
    for (const [key, v] of row) {
      const add = v.errors + v.warnings
      const prev = adTotals.get(key)
      if (prev) prev.total += add
      else adTotals.set(key, { label: v.label, total: add })
    }
  }

  const sortedAds = Array.from(adTotals.entries()).sort((a, b) => b[1].total - a[1].total)
  const topEntries = sortedAds.slice(0, topN)
  const otherEntries = sortedAds.slice(topN)
  const otherKeysSet = new Set(otherEntries.map(([k]) => k))

  const displayKeys: string[] = topEntries.map(([k]) => k)
  if (otherEntries.length) displayKeys.push('__other__')

  const labelFor = (key: string) => {
    if (key === '__other__') return '기타 (묶음)'
    return adTotals.get(key)?.label ?? key
  }

  const buildSeries = (field: 'errors' | 'warnings'): MonthlyStackSeries[] =>
    displayKeys.map((adKey, colorIndex) => ({
      key: adKey,
      label: labelFor(adKey),
      colorIndex,
      data: monthKeys.map((mk) => {
        const row = cell.get(mk)
        let y = 0
        if (adKey === '__other__') {
          if (row) {
            for (const [k, v] of row) {
              if (otherKeysSet.has(k)) y += v[field]
            }
          }
        } else {
          y = row?.get(adKey)?.[field] ?? 0
        }
        return { x: mk, y }
      }),
    }))

  return {
    monthKeys,
    errorsSeries: buildSeries('errors'),
    warningsSeries: buildSeries('warnings'),
    hasAnyConsoleSample,
  }
}
