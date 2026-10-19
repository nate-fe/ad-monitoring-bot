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
  /** 다른 광고사 칸이면 그 칸을 띄운 네이트 광고태그(`지면@슬롯`) */
  parentAdTag?: string
  /** bounced: 같은 묶음 안에서 끊겼다가 다시 나옴 */
  kind: 'down' | 'recovered' | 'bounced'
  /** 연속으로 미노출이었던 실행 시각(오래된 것부터). 다시 나온 경우엔 끊겼던 동안 전부 */
  missedAt: string[]
}

export type TargetAlerts = {
  /** 판정한 실행 중 가장 이른 것 */
  firstCheckedAt: string
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
 * startIndex 이후 실행에서 처음 잡힌 오류.
 *
 * 「처음」은 이 지면의 전체 기록 기준이다(생애주기의 firstSeenDay 와 같은 기준).
 * 비교할 이전 기록이 며칠 치 안 되면 전부 처음으로 보이므로 판정하지 않는다.
 * 「무시 가능」 단계는 광고사·브라우저가 남긴 기록이라 알리지 않는다.
 */
function detectNewIssues(
  sorted: MonitorHistoryEntry[],
  startIndex: number,
): { skipped: boolean; items: NewIssueAlert[] } {
  const previousDays = new Set(sorted.slice(0, startIndex).map((it) => it.checkedAt.slice(0, 10)))
  const seen = new Set<string>()
  for (const entry of sorted.slice(0, startIndex)) {
    for (const m of messagesOf(entry)) seen.add(lifecycleKeyFromMessage(m.text).key)
  }

  // 묶음 안의 실행을 차례로 「마지막 실행」으로 보고 판정한다. 앞 실행에서 처음 나온 오류는
  // 뒤 실행에서는 이미 본 것이 되므로 묶음 안에서 한 번만 실린다.
  let skipped = true
  const found = new Map<string, NewIssueAlert>()
  for (const entry of sorted.slice(startIndex)) {
    const judgeable = previousDays.size >= LIFECYCLE_MIN_OBSERVED_DAYS
    if (judgeable) skipped = false
    for (const m of messagesOf(entry)) {
      const info = lifecycleKeyFromMessage(m.text)
      if (seen.has(info.key)) continue
      seen.add(info.key)
      if (!judgeable || info.explainLevel === 'noise') continue
      found.set(info.key, {
        key: info.key,
        label: info.label,
        explainLevel: info.explainLevel,
        sampleText: m.text,
        sourceUrl: m.sourceUrl,
      })
    }
    previousDays.add(entry.checkedAt.slice(0, 10))
  }
  return { skipped, items: Array.from(found.values()) }
}

/**
 * 광고태그별 노출 여부. 같은 태그가 여러 칸이면 하나라도 나오면 노출로 본다.
 * 잴 수 없었던 칸(measurable: false)은 미노출이 아니므로 판정에서 뺀다(undefined).
 */
type SlotRun = {
  checkedAt: string
  states: Map<string, boolean>
  parents: Map<string, string>
}

function slotRunOf(entry: MonitorHistoryEntry): SlotRun {
  const states = new Map<string, boolean>()
  const parents = new Map<string, string>()
  for (const slot of entry.adSlots ?? []) {
    if (slot.parentAdTag) parents.set(slot.adTag, slot.parentAdTag)
    if (!slot.measurable) continue
    states.set(slot.adTag, (states.get(slot.adTag) ?? false) || slot.rendered)
  }
  return { checkedAt: entry.checkedAt, states, parents }
}

/**
 * 잘 나오던 칸이 SLOT_DOWN_STREAK 회 연속 안 나오기 **시작한** 실행, 그리고 그렇게 끊겼던 칸이
 * 다시 나온 실행에서만 알린다. 원래부터 비어 있던 칸은 「나오던」 실행이 없어 알리지 않는다.
 * 광고칸 기록이 없는 실행(2026-10 이전)은 건너뛰고, 기록이 있는 실행끼리만 연속을 센다.
 */
function detectSlotAlertsAt(sorted: MonitorHistoryEntry[]): SlotAlert[] {
  const latest = sorted[sorted.length - 1]
  if (!latest.adSlots?.length) return []
  const runs = sorted.filter((it) => it.adSlots?.length).map(slotRunOf)
  const needed = SLOT_DOWN_STREAK + 1

  const alerts: SlotAlert[] = []
  for (const adTag of runs[runs.length - 1].states.keys()) {
    // 이 태그를 잴 수 있었던 실행끼리만 잇는다 — 중간에 한 번 못 잰 것으로 연속이 끊기지 않게
    const measured = runs
      .filter((r) => r.states.has(adTag))
      .map((r) => ({ checkedAt: r.checkedAt, rendered: r.states.get(adTag) === true }))
    const recent = measured.slice(-needed)
    if (recent.length < needed) continue
    // 광고태그 기록이 생기기 전 실행도 섞여 있으므로 가장 최근에 남은 것을 쓴다
    const parentAdTag = [...runs].reverse().find((r) => r.parents.has(adTag))?.parents.get(adTag)
    const base = { adTag, ...(parentAdTag ? { parentAdTag } : {}) }

    if (recent[0].rendered && recent.slice(1).every((s) => !s.rendered)) {
      alerts.push({ ...base, kind: 'down', missedAt: recent.slice(1).map((s) => s.checkedAt) })
    } else if (recent[recent.length - 1].rendered && recent.slice(0, -1).every((s) => !s.rendered)) {
      // 끊겼던 동안 전부(SLOT_DOWN_STREAK 회보다 길 수 있다)
      let from = measured.length - 1
      while (from > 0 && !measured[from - 1].rendered) from -= 1
      alerts.push({ ...base, kind: 'recovered', missedAt: measured.slice(from, -1).map((s) => s.checkedAt) })
    }
  }
  return alerts.sort((a, b) => a.adTag.localeCompare(b.adTag))
}

/** 묶음 안의 실행마다 광고칸 전이를 보고, 태그별로 묶음 전체의 결과 하나로 줄인다 */
function detectSlotAlerts(sorted: MonitorHistoryEntry[], startIndex: number): SlotAlert[] {
  const byTag = new Map<string, SlotAlert>()
  for (let i = startIndex; i < sorted.length; i++) {
    for (const alert of detectSlotAlertsAt(sorted.slice(0, i + 1))) {
      const prev = byTag.get(alert.adTag)?.kind
      const kind = alert.kind === 'recovered' && (prev === 'down' || prev === 'bounced') ? 'bounced' : alert.kind
      byTag.set(alert.adTag, { ...alert, kind })
    }
  }
  return Array.from(byTag.values()).sort((a, b) => a.adTag.localeCompare(b.adTag))
}

/**
 * since 보다 뒤에 실행된 기록을 한 묶음으로 판정한다(팀룸은 하루 두 번만 보내므로 그 사이 실행을 모은다).
 * since 가 없으면 마지막 실행 하나만 본다.
 */
export function detectTargetAlerts(
  historyItems: MonitorHistoryEntry[],
  { since }: { since?: string } = {},
): TargetAlerts | null {
  const sorted = sortByCheckedAt(historyItems)
  if (!sorted.length) return null
  const sinceMs = since ? Date.parse(since) : NaN
  let startIndex = sorted.length - 1
  if (Number.isFinite(sinceMs)) {
    const idx = sorted.findIndex((it) => Date.parse(it.checkedAt) > sinceMs)
    if (idx === -1) return null
    startIndex = idx
  }
  const newIssues = detectNewIssues(sorted, startIndex)
  return {
    firstCheckedAt: sorted[startIndex].checkedAt,
    latestCheckedAt: sorted[sorted.length - 1].checkedAt,
    newIssuesSkipped: newIssues.skipped,
    newIssues: newIssues.items,
    slots: detectSlotAlerts(sorted, startIndex),
  }
}
