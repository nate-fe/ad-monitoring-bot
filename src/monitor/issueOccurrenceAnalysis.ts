import type { MonitorHistoryEntry, MonitorReport } from './types'
import {
  classifyIssueText,
  extractHttpUrlFromText,
  formatMonthKeyShortLabel,
  type IssueSourceCandidate,
} from './issueSources'

export type UrlOccurrencePattern = 'new' | 'recurring'

export type UrlOccurrenceTimelineItem = {
  checkedAt: string
}

export type IssueEventKind = 'error' | 'warning' | 'pageError'

export type MediaUrlOccurrence = {
  /** 표시용 URL. 묶인 경우 변동 구간은 XXX */
  url: string
  pattern: UrlOccurrencePattern
  monthCount: number
  priorCount: number
  occurrences: UrlOccurrenceTimelineItem[]
  errorSampleCount: number
  warningSampleCount: number
  pageErrorSampleCount: number
  errorMessages: string[]
  warningMessages: string[]
  pageErrorMessages: string[]
  /** 숫자·키값만 다른 URL이 2개 이상일 때 원본 목록 */
  memberUrls?: string[]
  isGrouped?: boolean
}

export type UrlRecommendationParts = {
  url: string
  suffix: string
}

export type MediaOccurrenceGroup = {
  key: string
  label: string
  monthCount: number
  urls: MediaUrlOccurrence[]
}

export type MediaOccurrenceAnalysis = {
  monthKey: string
  monthLabel: string
  totalCount: number
  mediaSummary: { label: string; count: number }[]
  mediaGroups: MediaOccurrenceGroup[]
}

type RawIssueEvent = {
  checkedAt: string
  monthKey: string
  mediaKey: string
  mediaLabel: string
  url: string
  issueKind: IssueEventKind
  message: string
}

export function normalizeIssueUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null
  const t = url.trim()
  try {
    const u = new URL(t)
    return `${u.origin}${u.pathname}`
  } catch {
    return t
  }
}

function monthKeyFromCheckedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function resolveEventUrl(candidate: IssueSourceCandidate): string | null {
  if (typeof candidate === 'string') {
    return normalizeIssueUrl(extractHttpUrlFromText(candidate))
  }
  return (
    normalizeIssueUrl(candidate.sourceUrl) ??
    normalizeIssueUrl(candidate.url) ??
    normalizeIssueUrl(extractHttpUrlFromText(candidate.text ?? ''))
  )
}

function messageFromCandidate(candidate: IssueSourceCandidate): string {
  if (typeof candidate === 'string') return candidate.trim()
  return (candidate.text ?? '').trim()
}

function pushEvent(
  events: RawIssueEvent[],
  checkedAt: string,
  candidate: IssueSourceCandidate,
  issueKind: IssueEventKind,
) {
  const url = resolveEventUrl(candidate)
  if (!url) return
  const { key, label } = classifyIssueText(candidate)
  const monthKey = monthKeyFromCheckedAt(checkedAt)
  if (!monthKey) return
  events.push({
    checkedAt,
    monthKey,
    mediaKey: key,
    mediaLabel: label,
    url,
    issueKind,
    message: messageFromCandidate(candidate),
  })
}

function collectUrlIssueMessages(events: RawIssueEvent[]): Pick<
  MediaUrlOccurrence,
  | 'errorSampleCount'
  | 'warningSampleCount'
  | 'pageErrorSampleCount'
  | 'errorMessages'
  | 'warningMessages'
  | 'pageErrorMessages'
> {
  const errorSet = new Set<string>()
  const warningSet = new Set<string>()
  const pageSet = new Set<string>()
  let errorSampleCount = 0
  let warningSampleCount = 0
  let pageErrorSampleCount = 0

  for (const e of events) {
    if (e.issueKind === 'error') {
      errorSampleCount += 1
      if (e.message) errorSet.add(e.message)
    } else if (e.issueKind === 'warning') {
      warningSampleCount += 1
      if (e.message) warningSet.add(e.message)
    } else {
      pageErrorSampleCount += 1
      if (e.message) pageSet.add(e.message)
    }
  }

  const sortMsgs = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b))

  return {
    errorSampleCount,
    warningSampleCount,
    pageErrorSampleCount,
    errorMessages: sortMsgs(errorSet),
    warningMessages: sortMsgs(warningSet),
    pageErrorMessages: sortMsgs(pageSet),
  }
}

function mergeUrlIssueMessageFields(items: MediaUrlOccurrence[]): Pick<
  MediaUrlOccurrence,
  | 'errorSampleCount'
  | 'warningSampleCount'
  | 'pageErrorSampleCount'
  | 'errorMessages'
  | 'warningMessages'
  | 'pageErrorMessages'
> {
  const errorSet = new Set<string>()
  const warningSet = new Set<string>()
  const pageSet = new Set<string>()
  let errorSampleCount = 0
  let warningSampleCount = 0
  let pageErrorSampleCount = 0

  for (const item of items) {
    errorSampleCount += item.errorSampleCount
    warningSampleCount += item.warningSampleCount
    pageErrorSampleCount += item.pageErrorSampleCount
    for (const m of item.errorMessages) errorSet.add(m)
    for (const m of item.warningMessages) warningSet.add(m)
    for (const m of item.pageErrorMessages) pageSet.add(m)
  }

  const sortMsgs = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b))

  return {
    errorSampleCount,
    warningSampleCount,
    pageErrorSampleCount,
    errorMessages: sortMsgs(errorSet),
    warningMessages: sortMsgs(warningSet),
    pageErrorMessages: sortMsgs(pageSet),
  }
}

function extractFromHistoryEntry(entry: MonitorHistoryEntry): RawIssueEvent[] {
  const events: RawIssueEvent[] = []
  const checkedAt = entry.checkedAt

  for (const item of entry.pageErrorSample ?? []) {
    pushEvent(events, checkedAt, { text: item.message, sourceUrl: item.sourceUrl }, 'pageError')
  }
  for (const m of entry.consoleErrorSample ?? []) {
    pushEvent(
      events,
      checkedAt,
      {
        text: m.text,
        url: m.url ?? extractHttpUrlFromText(m.text),
        sourceUrl: m.sourceUrl,
      },
      'error',
    )
  }
  for (const m of entry.consoleWarningSample ?? []) {
    pushEvent(events, checkedAt, { text: m.text, url: m.url, sourceUrl: m.sourceUrl }, 'warning')
  }

  return events
}

function extractFromReport(report: MonitorReport): RawIssueEvent[] {
  const events: RawIssueEvent[] = []
  const checkedAt = report.checkedAt
  const diag = report.diagnostics
  if (!diag) return events

  for (const item of diag.pageErrors ?? []) {
    pushEvent(events, checkedAt, { text: item.message, sourceUrl: item.sourceUrl }, 'pageError')
  }
  for (const m of diag.consoleMessages ?? []) {
    if (m.source === 'devtools') continue
    if (m.type === 'error') {
      pushEvent(
        events,
        checkedAt,
        {
          text: m.text,
          url: m.url ?? extractHttpUrlFromText(m.text),
          sourceUrl: m.sourceUrl,
        },
        'error',
      )
    } else if (m.type === 'warning') {
      pushEvent(
        events,
        checkedAt,
        {
          text: m.text,
          url: m.url ?? extractHttpUrlFromText(m.text),
          sourceUrl: m.sourceUrl,
        },
        'warning',
      )
    }
  }

  return events
}

export function collectIssueEvents(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): RawIssueEvent[] {
  const byAt = new Map<string, RawIssueEvent[]>()

  for (const it of historyItems) {
    byAt.set(it.checkedAt, extractFromHistoryEntry(it))
  }

  if (currentReport) {
    byAt.set(currentReport.checkedAt, extractFromReport(currentReport))
  }

  return Array.from(byAt.values())
    .flat()
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
}

export function listMonthsWithIssueEvents(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): string[] {
  const set = new Set<string>()
  for (const e of collectIssueEvents(historyItems, currentReport)) {
    if (e.monthKey) set.add(e.monthKey)
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

export type MonitorRunRef = {
  checkedAt: string
  monthKey: string
  dayKey: string
}

export function collectMonitorRuns(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): MonitorRunRef[] {
  const byAt = new Map<string, MonitorRunRef>()

  for (const it of historyItems) {
    if (!it.checkedAt) continue
    byAt.set(it.checkedAt, {
      checkedAt: it.checkedAt,
      monthKey: monthKeyFromCheckedAt(it.checkedAt),
      dayKey: occurrenceDayKeyFromCheckedAt(it.checkedAt),
    })
  }

  if (currentReport?.checkedAt) {
    byAt.set(currentReport.checkedAt, {
      checkedAt: currentReport.checkedAt,
      monthKey: monthKeyFromCheckedAt(currentReport.checkedAt),
      dayKey: occurrenceDayKeyFromCheckedAt(currentReport.checkedAt),
    })
  }

  return Array.from(byAt.values()).sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
}

/** 실행 기록 또는 URL 감지가 있는 월(달력·분석 월 선택용) */
export function listMonthsWithMonitorActivity(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): string[] {
  const set = new Set<string>()
  for (const run of collectMonitorRuns(historyItems, currentReport)) {
    if (run.monthKey) set.add(run.monthKey)
  }
  for (const e of collectIssueEvents(historyItems, currentReport)) {
    if (e.monthKey) set.add(e.monthKey)
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

export type OccurrenceCalendarMediaDayStat = {
  key: string
  label: string
  /** 해당 매체 이슈가 잡힌 검사(실행) 횟수 */
  detectionRunCount: number
}

export type OccurrenceCalendarDayCell = {
  dateKey: string
  day: number
  inMonth: boolean
  inspectionCount: number
  /** 어떤 매체든 이슈가 잡힌 검사(실행) 횟수 */
  detectionRunCount: number
  mediaBreakdown: OccurrenceCalendarMediaDayStat[]
}

export type OccurrenceCalendarModel = {
  monthKey: string
  monthLabel: string
  weekDayLabels: string[]
  weeks: OccurrenceCalendarDayCell[][]
  monthInspectionTotal: number
  monthDetectionRunTotal: number
  /** 2단: 월 전체 매체별 감지된 검사 / 월 검사 횟수 */
  monthMediaBreakdown: OccurrenceCalendarMediaDayStat[]
  dayByDateKey: Record<string, OccurrenceCalendarDayCell>
}

const CALENDAR_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function occurrenceDayKeyFromCheckedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildOccurrenceCalendarModel(
  monthKey: string,
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): OccurrenceCalendarModel | null {
  if (!monthKey) return null

  const [yearText, monthText] = monthKey.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null

  const runs = collectMonitorRuns(historyItems, currentReport).filter((run) => run.monthKey === monthKey)
  const events = collectIssueEvents(historyItems, currentReport).filter((event) => event.monthKey === monthKey)

  const inspectionsByDay = new Map<string, Set<string>>()
  for (const run of runs) {
    if (!run.dayKey) continue
    const set = inspectionsByDay.get(run.dayKey) ?? new Set<string>()
    set.add(run.checkedAt)
    inspectionsByDay.set(run.dayKey, set)
  }

  const anyDetectionRunsByDay = new Map<string, Set<string>>()
  const mediaRunsByDay = new Map<string, Map<string, { label: string; runs: Set<string> }>>()
  const monthMediaRuns = new Map<string, { label: string; runs: Set<string> }>()
  const monthDetectionRuns = new Set<string>()

  for (const event of events) {
    const dayKey = occurrenceDayKeyFromCheckedAt(event.checkedAt)
    if (!dayKey) continue

    monthDetectionRuns.add(event.checkedAt)

    const monthMediaCur =
      monthMediaRuns.get(event.mediaKey) ?? { label: event.mediaLabel, runs: new Set<string>() }
    monthMediaCur.runs.add(event.checkedAt)
    monthMediaRuns.set(event.mediaKey, monthMediaCur)

    const anySet = anyDetectionRunsByDay.get(dayKey) ?? new Set<string>()
    anySet.add(event.checkedAt)
    anyDetectionRunsByDay.set(dayKey, anySet)

    const mediaMap = mediaRunsByDay.get(dayKey) ?? new Map<string, { label: string; runs: Set<string> }>()
    const mediaCur = mediaMap.get(event.mediaKey) ?? { label: event.mediaLabel, runs: new Set<string>() }
    mediaCur.runs.add(event.checkedAt)
    mediaMap.set(event.mediaKey, mediaCur)
    mediaRunsByDay.set(dayKey, mediaMap)
  }

  const monthMediaBreakdown: OccurrenceCalendarMediaDayStat[] = [...monthMediaRuns.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      detectionRunCount: value.runs.size,
    }))
    .filter((row) => row.detectionRunCount > 0)
    .sort((a, b) => b.detectionRunCount - a.detectionRunCount || a.label.localeCompare(b.label))

  const buildMediaBreakdown = (dateKey: string): OccurrenceCalendarMediaDayStat[] => {
    const mediaMap = mediaRunsByDay.get(dateKey)
    if (!mediaMap) return []
    return [...mediaMap.entries()]
      .map(([key, value]) => ({
        key,
        label: value.label,
        detectionRunCount: value.runs.size,
      }))
      .filter((row) => row.detectionRunCount > 0)
      .sort((a, b) => b.detectionRunCount - a.detectionRunCount || a.label.localeCompare(b.label))
  }

  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startOffset = firstDay.getDay()

  const weeks: OccurrenceCalendarDayCell[][] = []
  const dayByDateKey: Record<string, OccurrenceCalendarDayCell> = {}
  let cursor = 1 - startOffset

  while (cursor <= daysInMonth) {
    const week: OccurrenceCalendarDayCell[] = []
    for (let col = 0; col < 7; col += 1) {
      if (cursor < 1 || cursor > daysInMonth) {
        week.push({
          dateKey: '',
          day: cursor,
          inMonth: false,
          inspectionCount: 0,
          detectionRunCount: 0,
          mediaBreakdown: [],
        })
      } else {
        const dateKey = `${yearText}-${monthText}-${String(cursor).padStart(2, '0')}`
        const cell: OccurrenceCalendarDayCell = {
          dateKey,
          day: cursor,
          inMonth: true,
          inspectionCount: inspectionsByDay.get(dateKey)?.size ?? 0,
          detectionRunCount: anyDetectionRunsByDay.get(dateKey)?.size ?? 0,
          mediaBreakdown: buildMediaBreakdown(dateKey),
        }
        dayByDateKey[dateKey] = cell
        week.push(cell)
      }
      cursor += 1
    }
    weeks.push(week)
  }

  return {
    monthKey,
    monthLabel: formatMonthKeyShortLabel(monthKey),
    weekDayLabels: [...CALENDAR_WEEKDAY_LABELS],
    weeks,
    monthInspectionTotal: runs.length,
    monthDetectionRunTotal: monthDetectionRuns.size,
    monthMediaBreakdown,
    dayByDateKey,
  }
}

function classifyUrlPattern(priorCount: number, monthCount: number): UrlOccurrencePattern {
  if (priorCount > 0 || monthCount >= 2) return 'recurring'
  return 'new'
}

function dedupeOccurrencesByCheckedAt(items: UrlOccurrenceTimelineItem[]): UrlOccurrenceTimelineItem[] {
  const seen = new Set<string>()
  const out: UrlOccurrenceTimelineItem[] = []
  for (const item of [...items].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {
    if (seen.has(item.checkedAt)) continue
    seen.add(item.checkedAt)
    out.push(item)
  }
  return out
}

function countUniquePriorRuns(
  allEvents: RawIssueEvent[],
  mediaKey: string,
  urls: string[],
  monthKey: string,
): number {
  const urlSet = new Set(urls)
  return new Set(
    allEvents
      .filter((e) => e.mediaKey === mediaKey && urlSet.has(e.url) && e.monthKey < monthKey)
      .map((e) => e.checkedAt),
  ).size
}

type ParsedIssueUrl = {
  origin: string
  segments: string[]
}

function parseIssueUrl(url: string): ParsedIssueUrl | null {
  try {
    const u = new URL(url)
    return {
      origin: u.origin,
      segments: u.pathname.split('/').filter(Boolean),
    }
  } catch {
    const noQuery = url.split('?')[0]?.split('#')[0] ?? url
    const slash = noQuery.indexOf('/', noQuery.includes('://') ? noQuery.indexOf('://') + 3 : 0)
    if (slash < 0) return { origin: noQuery, segments: [] }
    return {
      origin: noQuery.slice(0, slash),
      segments: noQuery.slice(slash + 1).split('/').filter(Boolean),
    }
  }
}

function isNumericOrKeyToken(token: string): boolean {
  if (!token) return false
  if (/^\d+$/.test(token)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return true
  if (/^[0-9a-f]{16,}$/i.test(token)) return true
  if (/^(?:[a-z][a-z0-9]*[-_])?\d+[a-z0-9]*$/i.test(token)) return true
  return false
}

function normalizeSegmentNumericToX(segment: string): string {
  return segment.replace(/\d+/g, 'XXX')
}

function segmentsMatchAsPattern(variants: string[]): string | null {
  const uniq = [...new Set(variants)]
  if (uniq.length === 1) return uniq[0]

  if (uniq.every(isNumericOrKeyToken)) return 'XXX'

  const normalized = uniq.map(normalizeSegmentNumericToX)
  if (new Set(normalized).size === 1 && normalized[0].includes('XXX')) {
    return normalized[0]
  }

  return null
}

/** 숫자·키값만 다른 URL 2개 이상이면 XXX 패턴 URL을 반환 */
export function buildPatternFromUrls(urls: string[]): string | null {
  if (urls.length < 2) return null

  const parsed = urls.map(parseIssueUrl).filter((p): p is ParsedIssueUrl => p != null)
  if (parsed.length !== urls.length) return null

  const origins = new Set(parsed.map((p) => p.origin))
  if (origins.size !== 1) return null

  const segLens = new Set(parsed.map((p) => p.segments.length))
  if (segLens.size !== 1) return null

  const len = parsed[0].segments.length
  const patternSegs: string[] = []
  let varied = false

  for (let i = 0; i < len; i++) {
    const at = parsed.map((p) => p.segments[i])
    const pat = segmentsMatchAsPattern(at)
    if (!pat) return null
    if (new Set(at).size > 1) varied = true
    patternSegs.push(pat)
  }

  if (!varied) return null

  const origin = parsed[0].origin
  const path = patternSegs.length ? `/${patternSegs.join('/')}` : ''
  return `${origin}${path}`
}

function mergeUrlOccurrenceCluster(
  cluster: MediaUrlOccurrence[],
  displayUrl: string,
  allEvents: RawIssueEvent[],
  mediaKey: string,
  monthKey: string,
): MediaUrlOccurrence {
  const memberUrls = cluster.map((item) => item.url).sort((a, b) => a.localeCompare(b))
  const occurrences = dedupeOccurrencesByCheckedAt(cluster.flatMap((item) => item.occurrences))
  const monthCount = occurrences.length
  const priorCount = countUniquePriorRuns(allEvents, mediaKey, memberUrls, monthKey)

  return {
    url: displayUrl,
    pattern: classifyUrlPattern(priorCount, monthCount),
    monthCount,
    priorCount,
    occurrences,
    memberUrls,
    isGrouped: true,
    ...mergeUrlIssueMessageFields(cluster),
  }
}

function groupSimilarUrlOccurrences(
  urls: MediaUrlOccurrence[],
  allEvents: RawIssueEvent[],
  mediaKey: string,
  monthKey: string,
): MediaUrlOccurrence[] {
  const remaining = [...urls]
  const result: MediaUrlOccurrence[] = []

  while (remaining.length) {
    const seed = remaining.shift()!
    const cluster = [seed]

    let i = 0
    while (i < remaining.length) {
      const trialUrls = [...cluster, remaining[i]].map((item) => item.url)
      if (buildPatternFromUrls(trialUrls)) {
        cluster.push(remaining[i])
        remaining.splice(i, 1)
      } else {
        i += 1
      }
    }

    if (cluster.length >= 2) {
      const displayUrl = buildPatternFromUrls(cluster.map((item) => item.url))!
      result.push(mergeUrlOccurrenceCluster(cluster, displayUrl, allEvents, mediaKey, monthKey))
    } else {
      result.push(seed)
    }
  }

  return result.sort((a, b) => b.monthCount - a.monthCount || a.url.localeCompare(b.url))
}

export function buildUrlRecommendationParts(url: MediaUrlOccurrence): UrlRecommendationParts {
  if (url.pattern === 'new') {
    return {
      url: url.url,
      suffix: '은(는) 이번 달 신규로 감지되었습니다. 초기 점검과 원인 파악을 검토해 주세요.',
    }
  }

  const freqNote =
    url.monthCount >= 3
      ? '빈도가 높고'
      : url.priorCount > 0
        ? '빈도는 높지 않지만'
        : '동일 URL이'

  return {
    url: url.url,
    suffix: `은(는) ${freqNote} 반복적으로 발생했습니다.`,
  }
}

export function buildMediaOccurrenceAnalysis(
  monthKey: string,
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): MediaOccurrenceAnalysis | null {
  if (!monthKey) return null

  const allEvents = collectIssueEvents(historyItems, currentReport)
  const monthEvents = allEvents.filter((e) => e.monthKey === monthKey)
  if (!monthEvents.length) return null

  const mediaMap = new Map<string, { label: string; events: RawIssueEvent[] }>()
  for (const e of monthEvents) {
    const cur = mediaMap.get(e.mediaKey)
    if (cur) {
      cur.events.push(e)
    } else {
      mediaMap.set(e.mediaKey, { label: e.mediaLabel, events: [e] })
    }
  }

  const mediaGroups: MediaOccurrenceGroup[] = []

  for (const [mediaKey, { label, events }] of mediaMap) {
    const urlMap = new Map<string, RawIssueEvent[]>()
    for (const e of events) {
      const list = urlMap.get(e.url) ?? []
      list.push(e)
      urlMap.set(e.url, list)
    }

    const urls: MediaUrlOccurrence[] = [...urlMap.entries()]
      .map(([url, monthList]) => {
        const occurrences = dedupeOccurrencesByCheckedAt(monthList.map((e) => ({ checkedAt: e.checkedAt })))
        const monthCount = occurrences.length
        const priorCount = countUniquePriorRuns(allEvents, mediaKey, [url], monthKey)
        return {
          url,
          pattern: classifyUrlPattern(priorCount, monthCount),
          monthCount,
          priorCount,
          occurrences,
          ...collectUrlIssueMessages(monthList),
        }
      })
      .sort((a, b) => b.monthCount - a.monthCount || a.url.localeCompare(b.url))

    const groupedUrls = groupSimilarUrlOccurrences(urls, allEvents, mediaKey, monthKey)

    const base = {
      key: mediaKey,
      label,
      monthCount: events.length,
      urls: groupedUrls,
    }
    mediaGroups.push(base)
  }

  mediaGroups.sort((a, b) => b.monthCount - a.monthCount || a.label.localeCompare(b.label))

  return {
    monthKey,
    monthLabel: formatMonthKeyShortLabel(monthKey),
    totalCount: monthEvents.length,
    mediaSummary: mediaGroups.map((g) => ({ label: g.label, count: g.monthCount })),
    mediaGroups,
  }
}

export type OccurrenceDateGroup = {
  dateKey: string
  dateLabel: string
  times: string[]
  count: number
}

export function formatOccurrenceDateLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const yy = String(d.getFullYear())
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${yy}년 ${month}월 ${day}일`
}

export function formatOccurrenceTimeLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

/** 타임라인용: 날짜별 시각 목록 + 건수 */
export function groupOccurrencesByDate(occurrences: UrlOccurrenceTimelineItem[]): OccurrenceDateGroup[] {
  const map = new Map<string, { dateLabel: string; items: { checkedAt: string; time: string }[] }>()

  for (const occ of occurrences) {
    const dateKey = occurrenceDayKeyFromCheckedAt(occ.checkedAt)
    if (!dateKey) continue
    const cur = map.get(dateKey) ?? {
      dateLabel: formatOccurrenceDateLabel(occ.checkedAt),
      items: [],
    }
    cur.items.push({
      checkedAt: occ.checkedAt,
      time: formatOccurrenceTimeLabel(occ.checkedAt),
    })
    map.set(dateKey, cur)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => {
      const items = [...value.items].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
      return {
        dateKey,
        dateLabel: value.dateLabel,
        times: items.map((item) => item.time),
        count: items.length,
      }
    })
}

export function formatOccurrenceTimelineLabel(iso: string) {
  return `${formatOccurrenceDateLabel(iso)} - ${formatOccurrenceTimeLabel(iso)}`
}
