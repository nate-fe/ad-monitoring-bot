/**
 * 팀룸 알림에 실을 항목을 실행 기록에서 골라낸다(scripts/notify-teamroom.js 가 번들해서 쓴다).
 *
 * 알림은 「새로 생긴 것」만 보낸다. 매 실행마다 실패를 보내면 아무도 안 보는 방이 되기 때문이다.
 * 상태 파일 없이 히스토리만으로 판정하므로, 같은 실행 기록이면 몇 번을 돌려도 같은 결과가 나온다
 * (다음 실행에서는 이미 히스토리에 들어가 있어 다시 「처음」이 되지 않는다).
 */

import { LIFECYCLE_MIN_OBSERVED_DAYS, lifecycleKeyFromMessage } from './issueLifecycle'
import type { MessageExplainLevel } from './messageExplanations'
import type { MonitorHistoryEntry } from './types'

/** 이만큼 연속으로 미노출이어야 알린다. 한두 번은 소재가 비는 시간대일 수 있다 */
export const SLOT_DOWN_STREAK = 3

export type NewIssueAlert = {
  key: string
  label: string
  explainLevel: MessageExplainLevel | null
  sampleText: string
  sourceUrl?: string
}

export type SlotAlert = {
  adTag: string
  kind: 'down' | 'recovered'
}

export type TargetAlerts = {
  /** 판정 기준이 된 마지막 실행 */
  latestCheckedAt: string
  /** 비교할 기록이 모자라 새 오류 판정을 건너뛰었는지 */
  newIssuesSkipped: boolean
  newIssues: NewIssueAlert[]
  slots: SlotAlert[]
}

function sortByCheckedAt(items: MonitorHistoryEntry[]): MonitorHistoryEntry[] {
  return items
    .filter((it) => Number.isFinite(Date.parse(it?.checkedAt ?? '')))
    .sort((a, b) => Date.parse(a.checkedAt) - Date.parse(b.checkedAt))
}

type EntryMessage = { text: string; sourceUrl?: string }

/** 생애주기 화면과 같은 범위: 페이지 오류 + 페이지 스크립트 콘솔 오류·경고 */
function messagesOf(entry: MonitorHistoryEntry): EntryMessage[] {
  const out: EntryMessage[] = []
  for (const m of entry.pageErrorSample ?? []) out.push({ text: m.message, sourceUrl: m.sourceUrl })
  for (const m of entry.consoleErrorSample ?? []) out.push({ text: m.text, sourceUrl: m.sourceUrl })
  for (const m of entry.consoleWarningSample ?? []) out.push({ text: m.text, sourceUrl: m.sourceUrl })
  return out.filter((m) => m.text?.trim())
}

/**
 * 마지막 실행에서 처음 잡힌 오류.
 *
 * 「처음」은 이 지면의 전체 기록 기준이다(생애주기의 firstSeenDay 와 같은 기준).
 * 비교할 이전 기록이 며칠 치 안 되면 전부 처음으로 보이므로 판정하지 않는다.
 * 「무시 가능」 단계는 광고사·브라우저가 남긴 기록이라 알리지 않는다.
 */
function detectNewIssues(sorted: MonitorHistoryEntry[]): { skipped: boolean; items: NewIssueAlert[] } {
  const latest = sorted[sorted.length - 1]
  const previous = sorted.slice(0, -1)

  const previousDays = new Set(previous.map((it) => it.checkedAt.slice(0, 10)))
  if (previousDays.size < LIFECYCLE_MIN_OBSERVED_DAYS) return { skipped: true, items: [] }

  const seen = new Set<string>()
  for (const entry of previous) {
    for (const m of messagesOf(entry)) seen.add(lifecycleKeyFromMessage(m.text).key)
  }

  const found = new Map<string, NewIssueAlert>()
  for (const m of messagesOf(latest)) {
    const info = lifecycleKeyFromMessage(m.text)
    if (seen.has(info.key) || found.has(info.key)) continue
    if (info.explainLevel === 'noise') continue
    found.set(info.key, {
      key: info.key,
      label: info.label,
      explainLevel: info.explainLevel,
      sampleText: m.text,
      sourceUrl: m.sourceUrl,
    })
  }
  return { skipped: false, items: Array.from(found.values()) }
}

/**
 * 광고태그별 노출 여부. 같은 태그가 여러 칸이면 하나라도 나오면 노출로 본다.
 * 잴 수 없었던 칸(measurable: false)은 미노출이 아니므로 판정에서 뺀다(undefined).
 */
function slotStateOf(entry: MonitorHistoryEntry): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const slot of entry.adSlots ?? []) {
    if (!slot.measurable) continue
    map.set(slot.adTag, (map.get(slot.adTag) ?? false) || slot.rendered)
  }
  return map
}

/**
 * 잘 나오던 칸이 SLOT_DOWN_STREAK 회 연속 안 나오기 **시작한** 실행, 그리고 그렇게 끊겼던 칸이
 * 다시 나온 실행에서만 알린다. 원래부터 비어 있던 칸은 「나오던」 실행이 없어 알리지 않는다.
 * 광고칸 기록이 없는 실행(2026-10 이전)은 건너뛰고, 기록이 있는 실행끼리만 연속을 센다.
 */
function detectSlotAlerts(sorted: MonitorHistoryEntry[]): SlotAlert[] {
  const latest = sorted[sorted.length - 1]
  if (!latest.adSlots?.length) return []
  const withSlots = sorted.filter((it) => it.adSlots?.length).map(slotStateOf)
  const needed = SLOT_DOWN_STREAK + 1

  const alerts: SlotAlert[] = []
  for (const adTag of withSlots[withSlots.length - 1].keys()) {
    // 이 태그를 잴 수 있었던 실행끼리만 잇는다 — 중간에 한 번 못 잰 것으로 연속이 끊기지 않게
    const states = withSlots
      .map((m) => m.get(adTag))
      .filter((s): s is boolean => s !== undefined)
      .slice(-needed)
    if (states.length < needed) continue
    const first = states[0]
    const latestState = states[states.length - 1]

    if (first === true && states.slice(1).every((s) => s === false)) {
      alerts.push({ adTag, kind: 'down' })
    } else if (latestState === true && states.slice(0, -1).every((s) => s === false)) {
      alerts.push({ adTag, kind: 'recovered' })
    }
  }
  return alerts.sort((a, b) => a.adTag.localeCompare(b.adTag))
}

export function detectTargetAlerts(historyItems: MonitorHistoryEntry[]): TargetAlerts | null {
  const sorted = sortByCheckedAt(historyItems)
  if (!sorted.length) return null
  const newIssues = detectNewIssues(sorted)
  return {
    latestCheckedAt: sorted[sorted.length - 1].checkedAt,
    newIssuesSkipped: newIssues.skipped,
    newIssues: newIssues.items,
    slots: detectSlotAlerts(sorted),
  }
}
