/**
 * 팀룸 알림에 실을 광고칸 현황을 실행 기록에서 골라낸다(scripts/notify-teamroom.js 가 번들해서 쓴다).
 *
 * 하루 두 번 보내는 회차마다 지금 안 나오는 칸을 전부 싣는다(downSlots).
 * 상태 파일 없이 히스토리만으로 판정하므로, 같은 실행 기록이면 몇 번을 돌려도 같은 결과가 나온다.
 */

import type { MonitorHistoryEntry } from './types'

/** 이만큼 연속으로 미노출이어야 알린다. 한두 번은 소재가 비는 시간대일 수 있다 */
export const SLOT_DOWN_STREAK = 3

export type SlotAlert = {
  /** 네이트 광고태그(`지면@슬롯`) */
  adTag: string
  /** bounced: 같은 묶음 안에서 끊겼다가 다시 나옴 */
  kind: 'down' | 'recovered' | 'bounced'
  /** 연속으로 미노출이었던 실행 시각(오래된 것부터). 다시 나온 경우엔 끊겼던 동안 전부 */
  missedAt: string[]
  /** 이번 묶음(지난 알림 뒤 ~ 이번 알림) 안에서 이 칸을 잰 횟수와 그중 안 나온 횟수 */
  windowMeasured: number
  windowMissed: number
}

/** 마지막 실행에서 안 나온 광고칸 — 새로 끊긴 것이든 오래 끊긴 것이든 매 회차 전부 싣는다 */
export type DownSlot = {
  adTag: string
  /** 마지막 실행까지 연속으로 미노출이었던 실행 시각(오래된 것부터) */
  missedAt: string[]
  /** 이번 묶음(지난 알림 뒤 ~ 이번 알림) 안에서 이 칸을 잰 횟수와 그중 안 나온 횟수 */
  windowMeasured: number
  windowMissed: number
  /** 기록상 한 번이라도 나온 적이 있는지. 없으면 원래부터 비어 있는 칸일 수 있다 */
  everRendered: boolean
}

export type TargetAlerts = {
  /** 판정한 실행 중 가장 이른 것 */
  firstCheckedAt: string
  /** 판정 기준이 된 마지막 실행 */
  latestCheckedAt: string
  slots: SlotAlert[]
  /** 마지막 실행에서 광고칸을 쟀는지. 못 쟀으면 downSlots 가 비어 있어도 「미노출 없음」이 아니다 */
  slotsMeasured: boolean
  downSlots: DownSlot[]
}

function sortByCheckedAt(items: MonitorHistoryEntry[]): MonitorHistoryEntry[] {
  return items
    .filter((it) => Number.isFinite(Date.parse(it?.checkedAt ?? '')))
    .sort((a, b) => Date.parse(a.checkedAt) - Date.parse(b.checkedAt))
}

/**
 * 네이트 광고태그별 노출 여부. 같은 태그가 여러 칸이면 하나라도 나오면 노출로 본다.
 * 다른 광고사 칸(parentAdTag 있음)은 그 칸을 띄운 네이트 광고태그의 일부로 친다 — 태그 자리에
 * 다른 광고가 떴거나 안쪽 칸이 나왔으면 그 태그는 노출이다. 따로 세면 같은 태그가
 * 「미노출」과 「다시 노출」에 동시에 실린다.
 * 잴 수 없었던 칸(measurable: false)은 미노출이 아니므로 판정에서 뺀다(키 없음).
 *
 * states 는 「미노출이 아님」이다: 광고가 나왔거나, 광고가 없어 영역이 닫힌 칸(collapsed)은 true.
 * 미노출은 영역이 열린 채 비어 있는 칸뿐이다. shown 은 실제로 광고가 나왔는지만 본다.
 * legacy: 닫힘을 구분하기 전(2026-10-26 이전) 기록 — 안 나온 칸이 닫힌 건지 알 수 없다.
 */
type SlotRun = {
  checkedAt: string
  states: Map<string, boolean>
  shown: Map<string, boolean>
  legacy: boolean
}

function slotRunOf(entry: MonitorHistoryEntry): SlotRun {
  const states = new Map<string, boolean>()
  const shown = new Map<string, boolean>()
  let legacy = false
  for (const slot of entry.adSlots ?? []) {
    if (!slot.measurable) continue
    if (!slot.rendered && slot.collapsed === undefined) legacy = true
    const ok = slot.rendered || slot.collapsed === true
    const tags = slot.parentAdTag ? slot.parentAdTag.split(',').map((t) => t.trim()).filter(Boolean) : [slot.adTag]
    for (const tag of tags) {
      states.set(tag, (states.get(tag) ?? false) || ok)
      shown.set(tag, (shown.get(tag) ?? false) || slot.rendered)
    }
  }
  return { checkedAt: entry.checkedAt, states, shown, legacy }
}

function measuredSeries(runs: SlotRun[], adTag: string) {
  return runs
    .filter((r) => r.states.has(adTag))
    .map((r) => ({ checkedAt: r.checkedAt, rendered: r.states.get(adTag) === true }))
}

/** 묶음(windowFrom 이후) 안에서 이 칸을 잰 횟수와 안 나온 횟수 — 지난 알림 앞의 기록은 세지 않는다 */
function windowCounts(runs: SlotRun[], adTag: string, windowFrom: number) {
  const inWindow = runs.filter((r) => r.states.has(adTag) && Date.parse(r.checkedAt) >= windowFrom)
  return {
    windowMeasured: inWindow.length,
    windowMissed: inWindow.filter((r) => r.states.get(adTag) !== true).length,
  }
}

/**
 * 잘 나오던 칸이 SLOT_DOWN_STREAK 회 연속 안 나오기 **시작한** 실행, 그리고 그렇게 끊겼던 칸이
 * 다시 나온 실행에서만 알린다. 원래부터 비어 있던 칸은 「나오던」 실행이 없어 알리지 않는다.
 * 광고칸 기록이 없는 실행(2026-10 이전)은 건너뛰고, 기록이 있는 실행끼리만 연속을 센다.
 */
function detectSlotAlertsAt(runs: SlotRun[]): Omit<SlotAlert, 'windowMeasured' | 'windowMissed'>[] {
  if (!runs.length) return []
  const needed = SLOT_DOWN_STREAK + 1

  const alerts: Omit<SlotAlert, 'windowMeasured' | 'windowMissed'>[] = []
  for (const adTag of runs[runs.length - 1].states.keys()) {
    // 이 태그를 잴 수 있었던 실행끼리만 잇는다 — 중간에 한 번 못 잰 것으로 연속이 끊기지 않게
    const measured = measuredSeries(runs, adTag)
    const recent = measured.slice(-needed)
    if (recent.length < needed) continue

    if (recent[0].rendered && recent.slice(1).every((s) => !s.rendered)) {
      alerts.push({ adTag, kind: 'down', missedAt: recent.slice(1).map((s) => s.checkedAt) })
    } else if (recent[recent.length - 1].rendered && recent.slice(0, -1).every((s) => !s.rendered)) {
      // 끊겼던 동안 전부(SLOT_DOWN_STREAK 회보다 길 수 있다)
      let from = measured.length - 1
      while (from > 0 && !measured[from - 1].rendered) from -= 1
      alerts.push({ adTag, kind: 'recovered', missedAt: measured.slice(from, -1).map((s) => s.checkedAt) })
    }
  }
  return alerts
}

/**
 * 마지막 실행에서 잰 칸 중 영역이 열린 채 비어 있던 것.
 * 「나온 적 있는지」는 닫힘 구분 전 기록(allRuns)까지 본다 — 광고가 나왔는지는 예전 기록도 정확하다.
 */
function detectDownSlots(runs: SlotRun[], allRuns: SlotRun[], windowFrom: number): DownSlot[] {
  const down: DownSlot[] = []
  for (const [adTag, ok] of runs[runs.length - 1].states) {
    if (ok) continue
    const measured = measuredSeries(runs, adTag)
    let from = measured.length - 1
    while (from > 0 && !measured[from - 1].rendered) from -= 1
    down.push({
      adTag,
      missedAt: measured.slice(from).map((s) => s.checkedAt),
      ...windowCounts(runs, adTag, windowFrom),
      everRendered: allRuns.some((r) => r.shown.get(adTag) === true),
    })
  }
  return down.sort((a, b) => a.adTag.localeCompare(b.adTag))
}

/** 묶음 안의 실행마다 광고칸 전이를 보고, 태그별로 묶음 전체의 결과 하나로 줄인다 */
function detectSlotAlerts(runs: SlotRun[], windowFrom: number): SlotAlert[] {
  const byTag = new Map<string, SlotAlert>()
  for (let i = 0; i < runs.length; i++) {
    if (Date.parse(runs[i].checkedAt) < windowFrom) continue
    for (const alert of detectSlotAlertsAt(runs.slice(0, i + 1))) {
      const prev = byTag.get(alert.adTag)?.kind
      const kind = alert.kind === 'recovered' && (prev === 'down' || prev === 'bounced') ? 'bounced' : alert.kind
      byTag.set(alert.adTag, { ...alert, kind, ...windowCounts(runs, alert.adTag, windowFrom) })
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
  const latest = sorted[sorted.length - 1]
  const allRuns = sorted.filter((it) => it.adSlots?.length).map(slotRunOf)
  // 연속 미노출·횟수는 닫힘을 구분한 기록끼리만 센다. 섞으면 닫힌 칸이 「다시 노출」로 한 번 잘못 실린다
  const runs = allRuns.filter((r) => !r.legacy)
  const slotsMeasured = Boolean(latest.adSlots?.length) && runs[runs.length - 1]?.checkedAt === latest.checkedAt
  const windowFrom = Date.parse(sorted[startIndex].checkedAt)
  return {
    firstCheckedAt: sorted[startIndex].checkedAt,
    latestCheckedAt: latest.checkedAt,
    slots: slotsMeasured ? detectSlotAlerts(runs, windowFrom) : [],
    slotsMeasured,
    downSlots: slotsMeasured ? detectDownSlots(runs, allRuns, windowFrom) : [],
  }
}
