/**
 * 콘솔 오류·경고의 **생애주기** 분류.
 *
 * 「이 오류, 원래 있던 거야 새로 생긴 거야?」에 답하기 위한 모듈이다.
 * 발생 일시 기록(issueOccurrenceAnalysis)이 *월 단위로 언제 몇 번 났나*를 본다면,
 * 여기서는 *최근 며칠 사이에 새로 생겼나 / 매일 나나 / 이제 안 나나*를 본다.
 *
 * 판정 기준 세 가지는 화면(IssueLifecyclePage)에도 그대로 적혀 있다. 기준을 바꾸면
 * 아래 상수만 고치면 되고, 설명 문구는 상수를 읽어 만들어지므로 따로 손대지 않아도 된다.
 */

import { explainMessage, type MessageExplainLevel } from './messageExplanations'
import type { IssueEventKind } from './issueOccurrenceAnalysis'
import type { MonitorHistoryEntry, MonitorReport } from './types'

/** 이 날짜 이후에 처음 잡힌 것만 「신규」로 본다 */
export const LIFECYCLE_NEW_WINDOW_DAYS = 7
/** 활성 창에서 검사한 날 중 이 비율 이상 발생하면 「만성」 */
export const LIFECYCLE_CHRONIC_DAY_RATIO = 0.5
/** 이 기간 동안 한 번도 안 나오면 「해소」 후보 */
export const LIFECYCLE_RESOLVED_QUIET_DAYS = 14
/**
 * 활성 창 안에서 이만큼은 검사했어야 비율·해소를 판정한다.
 * 이틀 치로 「50% 이상」을 따지면 하루만 나와도 만성이 되어 버린다.
 */
export const LIFECYCLE_MIN_OBSERVED_DAYS = 3

/**
 * 측정 조건이 바뀐 날. 이 날 이전 기록은 **비율 계산에서만** 뺀다.
 *
 * 2026-08-10 에 모바일 에뮬레이션이 적용되어 그 전후로 잡히는 메시지 자체가 다르다.
 * 다만 「처음 본 날」은 전체 기록으로 따진다 — 그러지 않으면 6월부터 있던 오류가
 * 전부 8/10 신규로 잡혀서, 측정 조건이 바뀐 것을 오류가 터진 것으로 읽게 된다.
 *
 * 활성 창(14일)이 이 날짜를 지나가면 아무 영향이 없어지므로, 그때 지워도 되는 값이다.
 */
export const LIFECYCLE_BASELINE_DAY = '2026-08-10'

export type IssueLifecycleStatus = 'new' | 'chronic' | 'intermittent' | 'resolved'

export type IssueLifecycleItem = {
  /** 원인 코드(사전에 있는 메시지) 또는 정규화한 문구 서명 */
  key: string
  /** 화면에 쓰는 짧은 이름 */
  label: string
  /** 대표 메시지 원문 */
  sampleText: string
  /** 사전에 있는 메시지면 조치 필요/확인만/무시 가능 단계 */
  explainLevel: MessageExplainLevel | null
  status: IssueLifecycleStatus
  kinds: IssueEventKind[]
  /** 전체 기록 기준(기준선 이전 포함) */
  firstSeenDay: string
  /**
   * 하필 측정 조건이 바뀐 날에 처음 잡힌 항목.
   * 진짜 새로 터진 것일 수도, 그 전에는 안 잡히던 것이 이제 잡히는 것일 수도 있어 구분이 안 된다.
   */
  firstSeenAtBaseline: boolean
  lastSeenDay: string
  /**
   * 측정 조건이 바뀌기 **전에** 기록이 끊긴 항목.
   * 고쳐져서 안 나오는 것인지, 이제 그 조건으로 측정하지 않아 안 잡히는 것인지 구분이 안 된다.
   * 「해소 N종」을 성과로 읽어 버리지 않도록 화면에서 따로 표시한다.
   */
  lastSeenBeforeBaseline: boolean
  /** 활성 창 안에서 이 항목이 잡힌 날 */
  daysInWindow: string[]
  /** 활성 창 안에서 검사한 날 수(분모). 모든 항목이 같은 값을 갖는다 */
  observedDayCount: number
  /** daysInWindow.length / observedDayCount */
  dayRatio: number
  /** 활성 창 안 발생 건수(실행 단위 합) */
  countInWindow: number
  /** 전체 기록 기준 발생 건수 */
  totalCount: number
  /** 대표 출처 스크립트(최대 5개) */
  sourceUrls: string[]
}

export type IssueLifecycleGroup = {
  status: IssueLifecycleStatus
  label: string
  description: string
  items: IssueLifecycleItem[]
}

export type IssueLifecycleModel = {
  /** 마지막으로 검사한 날. 「오늘」은 벽시계가 아니라 이 날이다 */
  latestDay: string
  windowStartDay: string
  /** 활성 창 안에서 실제로 검사한 날 */
  observedDays: string[]
  observedDayCount: number
  /** 활성 창이 기준선에 걸려 잘렸는지 */
  isBaselineClamped: boolean
  /** 검사한 날이 모자라 비율·해소를 판정할 수 없는 상태 */
  isInsufficient: boolean
  groups: IssueLifecycleGroup[]
  itemCount: number
}

export const LIFECYCLE_STATUS_LABEL: Record<IssueLifecycleStatus, string> = {
  new: '신규',
  chronic: '만성',
  intermittent: '간헐',
  resolved: '해소',
}

export const LIFECYCLE_STATUS_DESCRIPTION: Record<IssueLifecycleStatus, string> = {
  new: `최근 ${LIFECYCLE_NEW_WINDOW_DAYS}일 안에 처음 잡혔습니다. 이번에 바뀐 것이 원인일 수 있으니 먼저 보세요.`,
  chronic: `검사한 날의 ${Math.round(LIFECYCLE_CHRONIC_DAY_RATIO * 100)}% 이상에서 나옵니다. 매번 반복되는 것이라 새 소식은 아닙니다.`,
  intermittent: '가끔씩만 나옵니다. 특정 소재·시간대에만 걸리는 것일 수 있습니다.',
  resolved: `전에는 나왔지만 최근 ${LIFECYCLE_RESOLVED_QUIET_DAYS}일 동안 한 번도 안 나왔습니다.`,
}

const GROUP_ORDER: IssueLifecycleStatus[] = ['new', 'chronic', 'intermittent', 'resolved']

function dayKeyFromDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayKeyFromCheckedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return dayKeyFromDate(d)
}

function shiftDayKey(dayKey: string, deltaDays: number): string {
  const d = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dayKey
  d.setDate(d.getDate() + deltaDays)
  return dayKeyFromDate(d)
}

/**
 * 같은 오류인지 판정하는 키.
 *
 * 메시지 원문을 그대로 쓰면 URL·시각·요청 id 가 섞인 줄은 매번 다른 오류로 잡혀
 * 전부 「신규」가 되어 버린다. 그래서 사전에 있는 메시지는 **원인 코드**로 묶고,
 * 사전에 없는 메시지는 변동값을 자리표시자로 바꾼 서명으로 묶는다.
 */
function normalizeMessageSignature(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/[^\s'"()<>]+/g, '<url>')
    .replace(/\b[0-9a-f]{8,}\b/g, '<hash>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function shortenText(text: string, maxLen = 80): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t
}

type LifecycleKeyInfo = {
  key: string
  label: string
  explainLevel: MessageExplainLevel | null
}

function lifecycleKeyFromMessage(text: string): LifecycleKeyInfo {
  const info = explainMessage(text)
  if (info) return { key: `cause:${info.key}`, label: info.title, explainLevel: info.level }
  return { key: `text:${normalizeMessageSignature(text)}`, label: shortenText(text), explainLevel: null }
}

/** 화면에서 메시지 원문으로 생애주기를 되찾을 때 쓰는 키(배지용) */
export function lifecycleKeyOf(text: string | undefined): string | null {
  if (!text?.trim()) return null
  return lifecycleKeyFromMessage(text).key
}

type LifecycleEvent = {
  dayKey: string
  kind: IssueEventKind
  text: string
  sourceUrl?: string
}

function pushLifecycleEvent(
  out: LifecycleEvent[],
  dayKey: string,
  kind: IssueEventKind,
  text: string | undefined,
  sourceUrl: string | undefined,
) {
  if (!dayKey || !text?.trim()) return
  out.push({ dayKey, kind, text: text.trim(), sourceUrl })
}

/**
 * 실행 기록과 현재 리포트에서 오류·경고를 뽑는다.
 *
 * issueOccurrenceAnalysis 의 collectIssueEvents 와 달리 **URL 을 못 찾은 메시지도 버리지 않는다**.
 * 그쪽은 매체별 분석이라 URL 이 필수지만, 여기서는 「무슨 오류가 며칠 났나」가 전부라
 * URL 이 없다고 빼면 실제로 매일 나는 오류가 목록에서 사라진다.
 */
function collectLifecycleEvents(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): LifecycleEvent[] {
  const byCheckedAt = new Map<string, LifecycleEvent[]>()

  for (const entry of historyItems) {
    const dayKey = dayKeyFromCheckedAt(entry.checkedAt)
    const events: LifecycleEvent[] = []
    for (const m of entry.pageErrorSample ?? []) {
      pushLifecycleEvent(events, dayKey, 'pageError', m.message, m.sourceUrl)
    }
    for (const m of entry.consoleErrorSample ?? []) {
      pushLifecycleEvent(events, dayKey, 'error', m.text, m.sourceUrl)
    }
    for (const m of entry.consoleWarningSample ?? []) {
      pushLifecycleEvent(events, dayKey, 'warning', m.text, m.sourceUrl)
    }
    byCheckedAt.set(entry.checkedAt, events)
  }

  if (currentReport) {
    const dayKey = dayKeyFromCheckedAt(currentReport.checkedAt)
    const events: LifecycleEvent[] = []
    const diag = currentReport.diagnostics
    for (const m of diag?.pageErrors ?? []) {
      pushLifecycleEvent(events, dayKey, 'pageError', m.message, m.sourceUrl)
    }
    for (const m of diag?.consoleMessages ?? []) {
      // 헤드리스 devtools 네트워크 줄은 이 파일의 다른 집계와 같은 기준으로 뺀다
      if (m.source === 'devtools') continue
      if (m.type === 'error') pushLifecycleEvent(events, dayKey, 'error', m.text, m.sourceUrl)
      else if (m.type === 'warning') pushLifecycleEvent(events, dayKey, 'warning', m.text, m.sourceUrl)
    }
    byCheckedAt.set(currentReport.checkedAt, events)
  }

  return Array.from(byCheckedAt.values()).flat()
}

/** 검사한 날(실행이 한 번이라도 있는 날) 목록 */
function collectObservedDays(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): string[] {
  const set = new Set<string>()
  for (const entry of historyItems) {
    const dayKey = dayKeyFromCheckedAt(entry.checkedAt)
    if (dayKey) set.add(dayKey)
  }
  if (currentReport?.checkedAt) {
    const dayKey = dayKeyFromCheckedAt(currentReport.checkedAt)
    if (dayKey) set.add(dayKey)
  }
  return Array.from(set).sort()
}

type LifecycleAccumulator = {
  info: LifecycleKeyInfo
  sampleText: string
  kinds: Set<IssueEventKind>
  days: Set<string>
  daysInWindow: Set<string>
  countInWindow: number
  totalCount: number
  sourceUrls: Set<string>
}

export function buildIssueLifecycleModel(
  historyItems: MonitorHistoryEntry[],
  currentReport: MonitorReport | null,
): IssueLifecycleModel | null {
  const observedDaysAll = collectObservedDays(historyItems, currentReport)
  if (!observedDaysAll.length) return null

  const latestDay = observedDaysAll[observedDaysAll.length - 1]
  const quietWindowStart = shiftDayKey(latestDay, -(LIFECYCLE_RESOLVED_QUIET_DAYS - 1))
  // 마지막 검사가 기준선보다 앞선 대상(한동안 안 돌린 지면)은 기준선을 적용할 것이 없다.
  // 그대로 자르면 창이 뒤집혀(시작 > 끝) 검사한 날이 0일이 된다.
  const isBaselineClamped =
    LIFECYCLE_BASELINE_DAY > quietWindowStart && LIFECYCLE_BASELINE_DAY <= latestDay
  const windowStartDay = isBaselineClamped ? LIFECYCLE_BASELINE_DAY : quietWindowStart

  const observedDays = observedDaysAll.filter((d) => d >= windowStartDay && d <= latestDay)
  const observedDayCount = observedDays.length
  const isInsufficient = observedDayCount < LIFECYCLE_MIN_OBSERVED_DAYS

  const newFromDay = shiftDayKey(latestDay, -(LIFECYCLE_NEW_WINDOW_DAYS - 1))
  const observedDaySet = new Set(observedDays)

  const byKey = new Map<string, LifecycleAccumulator>()
  for (const event of collectLifecycleEvents(historyItems, currentReport)) {
    const info = lifecycleKeyFromMessage(event.text)
    let acc = byKey.get(info.key)
    if (!acc) {
      acc = {
        info,
        sampleText: event.text,
        kinds: new Set(),
        days: new Set(),
        daysInWindow: new Set(),
        countInWindow: 0,
        totalCount: 0,
        sourceUrls: new Set(),
      }
      byKey.set(info.key, acc)
    }
    acc.kinds.add(event.kind)
    acc.days.add(event.dayKey)
    acc.totalCount += 1
    if (observedDaySet.has(event.dayKey)) {
      acc.daysInWindow.add(event.dayKey)
      acc.countInWindow += 1
    }
    if (event.sourceUrl && acc.sourceUrls.size < 5) acc.sourceUrls.add(event.sourceUrl)
  }

  const items: IssueLifecycleItem[] = []
  for (const acc of byKey.values()) {
    const days = Array.from(acc.days).sort()
    if (!days.length) continue
    const daysInWindow = Array.from(acc.daysInWindow).sort()
    const firstSeenDay = days[0]
    const lastSeenDay = days[days.length - 1]
    const dayRatio = observedDayCount ? daysInWindow.length / observedDayCount : 0

    items.push({
      key: acc.info.key,
      label: acc.info.label,
      sampleText: acc.sampleText,
      explainLevel: acc.info.explainLevel,
      status: classifyStatus({
        hasWindowOccurrence: daysInWindow.length > 0,
        firstSeenDay,
        newFromDay,
        dayRatio,
        isInsufficient,
      }),
      kinds: Array.from(acc.kinds),
      firstSeenDay,
      firstSeenAtBaseline: firstSeenDay === LIFECYCLE_BASELINE_DAY,
      lastSeenDay,
      lastSeenBeforeBaseline: lastSeenDay < LIFECYCLE_BASELINE_DAY,
      daysInWindow,
      observedDayCount,
      dayRatio,
      countInWindow: acc.countInWindow,
      totalCount: acc.totalCount,
      sourceUrls: Array.from(acc.sourceUrls),
    })
  }

  const groups: IssueLifecycleGroup[] = GROUP_ORDER.map((status) => ({
    status,
    label: LIFECYCLE_STATUS_LABEL[status],
    description: LIFECYCLE_STATUS_DESCRIPTION[status],
    items: items.filter((it) => it.status === status).sort(compareItems),
  })).filter((group) => group.items.length > 0)

  return {
    latestDay,
    windowStartDay,
    observedDays,
    observedDayCount,
    isBaselineClamped,
    isInsufficient,
    groups,
    itemCount: items.length,
  }
}

function classifyStatus({
  hasWindowOccurrence,
  firstSeenDay,
  newFromDay,
  dayRatio,
  isInsufficient,
}: {
  hasWindowOccurrence: boolean
  firstSeenDay: string
  newFromDay: string
  dayRatio: number
  isInsufficient: boolean
}): IssueLifecycleStatus {
  // 「처음 본 날」이 최근이면 비율보다 이쪽이 먼저다 — 매일 나더라도 어제 생긴 것이면 신규다
  if (firstSeenDay >= newFromDay && hasWindowOccurrence) return 'new'
  if (!hasWindowOccurrence) {
    // 검사한 날이 모자라면 「안 나왔다」가 아니라 「아직 모른다」이므로 해소로 올리지 않는다
    return isInsufficient ? 'intermittent' : 'resolved'
  }
  if (!isInsufficient && dayRatio >= LIFECYCLE_CHRONIC_DAY_RATIO) return 'chronic'
  return 'intermittent'
}

const EXPLAIN_LEVEL_WEIGHT: Record<MessageExplainLevel, number> = {
  action: 0,
  watch: 1,
  noise: 2,
}

/** 조치 필요 → 확인만 → 무시 가능 → 사전에 없는 것, 같은 단계면 자주 난 것부터 */
function compareItems(a: IssueLifecycleItem, b: IssueLifecycleItem): number {
  const wa = a.explainLevel ? EXPLAIN_LEVEL_WEIGHT[a.explainLevel] : 3
  const wb = b.explainLevel ? EXPLAIN_LEVEL_WEIGHT[b.explainLevel] : 3
  if (wa !== wb) return wa - wb
  if (b.dayRatio !== a.dayRatio) return b.dayRatio - a.dayRatio
  return b.totalCount - a.totalCount
}

/** 메시지 원문 → 생애주기 항목. 리포트 화면에서 배지를 붙일 때 쓴다 */
export function buildLifecycleLookup(
  model: IssueLifecycleModel | null,
): Map<string, IssueLifecycleItem> {
  const map = new Map<string, IssueLifecycleItem>()
  if (!model) return map
  for (const group of model.groups) {
    for (const item of group.items) map.set(item.key, item)
  }
  return map
}

export function formatLifecycleDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dayKey
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}
