import type { MonitorHistoryEntry, MonitorReport } from './types'

export type IssueSourceCandidate =
  | string
  | {
      text?: string
      url?: string
      /** 스크립트 출처 URL — 페이지 URL과 다를 때 분류에 사용 */
      sourceUrl?: string
      /** 이미 합쳐진 동일 메시지의 개수(리포트 dedup). 없으면 1로 센다. */
      dupeCount?: number
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
  /**
   * 이디엘 태그가 document.write 로 띄우는 서드파티 광고 iframe(doorigo/z00) 안에서 도는 RTX 핑거프린트
   * SDK. wasm CORS 차단·encrypted-media 퍼미션 위반 등 파생 메시지가 한 번에 여러 건 찍히는데 전부 같은
   * 원인이라 한 줄로 묶는다. 원본 콘솔 메시지는 리포트에 그대로 남는다.
   *
   * iframe URL 에 `tsource=m.news.nate.com` 같은 파라미터가 붙어 있어서 아래 nate 규칙보다 먼저 와야
   * 한다(그러지 않으면 서드파티 오류가 'Nate 내부'로 잡힌다).
   */
  {
    key: 'rtx',
    label: 'RTX 핑거프린트 SDK (z00.kr)',
    patterns: ['z00.kr', 'rtbx.co.kr', 'doorigo.co.kr', 'rtx_wasm_fingerprint', 'rtx.bundle.prod'],
  },
  { key: 'nate', label: 'Nate 내부', patterns: ['news.nate.com', 'm.news.nate.com', 'nate.com'] },
] as const

export function extractHttpUrlFromText(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s)\]}>'"]+/i)
  return m ? m[0] : undefined
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
    // 리포트에서 이미 합쳐진 동일 메시지는 dupeCount 만큼 가중치로 센다.
    const weight = typeof item === 'string' ? 1 : item.dupeCount ?? 1
    const prev = bucket.get(matched.key)
    if (prev) {
      prev.count += weight
    } else {
      bucket.set(matched.key, { ...matched, count: weight })
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

/** 콘솔 오류·경고(헤드리스 source 제외), 페이지 오류를 광고/영역 규칙으로 묶어 집계합니다. 요청 실패는 포함하지 않습니다. */
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
    if (m.type === 'warning') {
      bump(map, { text: m.text, url: m.url, sourceUrl: m.sourceUrl }, 'warnings')
    }
  }

  for (const e of report.diagnostics?.pageErrors ?? []) {
    bump(map, { text: e.message, sourceUrl: e.sourceUrl }, 'errors')
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

function dayKeyFromCheckedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 월 축 라벨 (예: 2026년 4월) */
export function formatMonthKeyShortLabel(monthKey: string): string {
  const d = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return monthKey
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}

/** 일 축 라벨 (예: 4월 3일) */
export function formatDayKeyShortLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dayKey
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export type MonthlyStackSeries = {
  key: string
  label: string
  colorIndex: number
  data: { x: string; y: number }[]
}

/** 일·월 버킷 한 칸: 막대는 오류/경고 개수만, byAd는 툴팁용 */
export type ConsoleHistoryBucketPoint = {
  x: string
  errors: number
  warnings: number
  byAd: { label: string; errors: number; warnings: number }[]
}

export type MonthlyConsoleAdChartModel = {
  monthKeys: string[]
  points: ConsoleHistoryBucketPoint[]
  hasAnyConsoleSample: boolean
}

export type DailyConsoleAdChartModel = {
  dayKeys: string[]
  points: ConsoleHistoryBucketPoint[]
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

function buildConsoleAdChartByBucket(
  items: MonitorHistoryEntry[],
  options: {
    bucketFromCheckedAt: (iso: string) => string
    /** 최근 N개 버킷만 표시 (일별 등 막대 과다 방지) */
    maxBuckets?: number
  },
): {
  bucketKeys: string[]
  points: ConsoleHistoryBucketPoint[]
  hasAnyConsoleSample: boolean
} {
  const maxBuckets = options.maxBuckets
  const cell = new Map<string, Map<string, { label: string; errors: number; warnings: number }>>()
  let hasAnyConsoleSample = false

  const bumpCell = (bucket: string, adKey: string, label: string, field: 'errors' | 'warnings') => {
    let row = cell.get(bucket)
    if (!row) {
      row = new Map()
      cell.set(bucket, row)
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

  const bumpMsg = (bucket: string, candidate: IssueSourceCandidate, field: 'errors' | 'warnings') => {
    hasAnyConsoleSample = true
    const { key, label } = classifyIssueText(candidate)
    bumpCell(bucket, key, label, field)
  }

  for (const entry of items) {
    const bk = options.bucketFromCheckedAt(entry.checkedAt)
    if (!bk) continue

    for (const m of entry.consoleErrorSample ?? []) {
      bumpMsg(bk, { text: m.text, url: m.url ?? extractHttpUrlFromText(m.text), sourceUrl: m.sourceUrl }, 'errors')
    }
    for (const m of entry.consoleWarningSample ?? []) {
      bumpMsg(bk, { text: m.text, url: m.url, sourceUrl: m.sourceUrl }, 'warnings')
    }
  }

  let bucketKeys = Array.from(cell.keys()).sort((a, b) => a.localeCompare(b))
  if (maxBuckets != null && bucketKeys.length > maxBuckets) {
    bucketKeys = bucketKeys.slice(-maxBuckets)
  }

  if (!bucketKeys.length) {
    return { bucketKeys: [], points: [], hasAnyConsoleSample }
  }

  const points: ConsoleHistoryBucketPoint[] = bucketKeys.map((bk) => {
    const row = cell.get(bk)!
    let errors = 0
    let warnings = 0
    const byAd: { label: string; errors: number; warnings: number }[] = []
    for (const [, v] of row) {
      errors += v.errors
      warnings += v.warnings
      if (v.errors + v.warnings > 0) {
        byAd.push({ label: v.label, errors: v.errors, warnings: v.warnings })
      }
    }
    byAd.sort((a, b) => b.errors + b.warnings - (a.errors + a.warnings))
    return { x: bk, errors, warnings, byAd }
  })

  return {
    bucketKeys,
    points,
    hasAnyConsoleSample,
  }
}

/**
 * 콘솔 샘플(실행당 오류·경고)을 월 단위로 집계합니다.
 * 막대는 오류·경고 개수(스택 2단), 광고·영역별 내역은 UI 툴팁용 points.byAd.
 * 기본 최근 12개월만 축에 표시합니다.
 */
export function buildMonthlyConsoleAdChartModel(
  items: MonitorHistoryEntry[],
  options?: { maxMonths?: number },
): MonthlyConsoleAdChartModel {
  const r = buildConsoleAdChartByBucket(items, {
    bucketFromCheckedAt: monthKeyFromCheckedAt,
    maxBuckets: options?.maxMonths ?? 12,
  })
  return {
    monthKeys: r.bucketKeys,
    points: r.points,
    hasAnyConsoleSample: r.hasAnyConsoleSample,
  }
}

/** 일 단위 집계. 기본 최근 90일만 축에 표시합니다. */
export function buildDailyConsoleAdChartModel(
  items: MonitorHistoryEntry[],
  options?: { maxDays?: number },
): DailyConsoleAdChartModel {
  const r = buildConsoleAdChartByBucket(items, {
    bucketFromCheckedAt: dayKeyFromCheckedAt,
    maxBuckets: options?.maxDays ?? 90,
  })
  return {
    dayKeys: r.bucketKeys,
    points: r.points,
    hasAnyConsoleSample: r.hasAnyConsoleSample,
  }
}

/** 일별: 해당 일의 실행 기록에 대해 성능 지표 산술 평균 */
export type PerformanceHistoryBucketPoint = {
  x: string
  approxTbtMs: number
  avgAdScriptResourceDurationMs: number
  runCount: number
}

export type DailyPerformanceChartModel = {
  dayKeys: string[]
  points: PerformanceHistoryBucketPoint[]
  hasAnyPerformanceSample: boolean
}

export function buildDailyPerformanceChartModel(
  items: MonitorHistoryEntry[],
  options?: { maxDays?: number },
): DailyPerformanceChartModel {
  const maxDays = options?.maxDays ?? 90
  const byDay = new Map<string, { tbtSum: number; scriptSum: number; n: number }>()
  let hasAnyPerformanceSample = false

  for (const entry of items) {
    const pm = entry.performanceMetrics
    if (!pm) continue
    hasAnyPerformanceSample = true
    const bk = dayKeyFromCheckedAt(entry.checkedAt)
    if (!bk) continue
    const tbt = Number(pm.approxTbtMs)
    const scr = Number(pm.avgAdScriptResourceDurationMs)
    if (!Number.isFinite(tbt) || !Number.isFinite(scr)) continue
    const cur = byDay.get(bk) ?? { tbtSum: 0, scriptSum: 0, n: 0 }
    cur.tbtSum += tbt
    cur.scriptSum += scr
    cur.n += 1
    byDay.set(bk, cur)
  }

  let dayKeys = Array.from(byDay.keys()).sort((a, b) => a.localeCompare(b))
  if (dayKeys.length > maxDays) dayKeys = dayKeys.slice(-maxDays)

  const points: PerformanceHistoryBucketPoint[] = dayKeys.map((bk) => {
    const v = byDay.get(bk)!
    const n = v.n || 1
    return {
      x: bk,
      approxTbtMs: v.tbtSum / n,
      avgAdScriptResourceDurationMs: v.scriptSum / n,
      runCount: v.n,
    }
  })

  return { dayKeys, points, hasAnyPerformanceSample }
}

/** 모니터 실행 시점에 잡힌 오류·경고 1건 이상이 있는 기록(페이지 오류·콘솔 오류·경고만, 요청 실패 제외) */
export type IssueOccurrenceRecord = {
  checkedAt: string
  pageErrors: number
  consoleErrors: number
  consoleWarnings: number
  total: number
  /** 동일 checkedAt에 현재 리포트가 있으면 true */
  isCurrent?: boolean
}

function countReportIssueTotals(report: MonitorReport): Omit<IssueOccurrenceRecord, 'checkedAt' | 'isCurrent'> | null {
  const diag = report.diagnostics
  if (!diag) return null
  const pageErrors = diag.pageErrors?.length ?? 0
  const consoleErrors = (diag.consoleMessages ?? []).filter(
    (m) => m.type === 'error' && m.source !== 'devtools',
  ).length
  const consoleWarnings = (diag.consoleMessages ?? []).filter((m) => m.type === 'warning').length
  const total = pageErrors + consoleErrors + consoleWarnings
  if (total <= 0) return null
  return { pageErrors, consoleErrors, consoleWarnings, total }
}

function countHistoryIssueTotals(entry: MonitorHistoryEntry): Omit<IssueOccurrenceRecord, 'checkedAt' | 'isCurrent'> | null {
  const pageErrors = entry.counts?.pageErrors ?? 0
  const consoleErrors = entry.counts?.consoleErrors ?? 0
  const consoleWarnings = entry.counts?.consoleWarnings ?? 0
  const total = pageErrors + consoleErrors + consoleWarnings
  if (total <= 0) return null
  return { pageErrors, consoleErrors, consoleWarnings, total }
}

/** 저장된 실행 기록과 현재 리포트를 checkedAt 단위로 합쳐, 최신순 목록을 만듭니다. */
export function buildIssueOccurrenceRecords(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): IssueOccurrenceRecord[] {
  const byAt = new Map<string, IssueOccurrenceRecord>()

  for (const it of historyItems) {
    const totals = countHistoryIssueTotals(it)
    if (!totals) continue
    byAt.set(it.checkedAt, { checkedAt: it.checkedAt, ...totals })
  }

  if (currentReport) {
    const totals = countReportIssueTotals(currentReport)
    if (totals) {
      byAt.set(currentReport.checkedAt, {
        checkedAt: currentReport.checkedAt,
        ...totals,
        isCurrent: true,
      })
    }
  }

  return Array.from(byAt.values()).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
}
