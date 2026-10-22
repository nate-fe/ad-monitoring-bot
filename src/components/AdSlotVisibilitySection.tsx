import { useMemo } from 'react'
import type { AdSlotSource, AdSlotVisibility } from '../monitor/types'
import { AD_LAYOUTS } from '../adLayouts'
import { InlineHelpTooltip } from './InlineHelpTooltip'

const AD_SLOT_HELP_TEXT = [
  '캡쳐 직전에 광고칸 높이가 0이거나 소재가 하나도 없던 광고태그입니다.',
  '앞 광고사가 비워도 같은 자리를 다음 광고사가 채웠으면(패스백) 넣지 않습니다.',
  '',
  '다른 도메인 iframe 안은 볼 수 없어서, iframe만 뜨고 내용이 백지인 경우는 여기에 잡히지 않습니다.',
].join('\n')

/** 광고태그 → 지면에서 부르는 이름(예: 기사 중간1). 없으면 태그를 그대로 쓴다 */
function buildSlotLabelMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const layout of AD_LAYOUTS) {
    for (const slot of layout.slots) {
      for (const tag of slot.adTags) {
        const key = tag.toLowerCase()
        if (!map.has(key)) map.set(key, slot.label)
      }
    }
  }
  return map
}

const AD_SLOT_SOURCE_LABEL: Record<AdSlotSource, string> = {
  cyad: '광고태그',
  gpt: 'GPT',
  dable: '데이블',
  coupang: '쿠팡',
}

export function AdSlotVisibilitySection({ slots }: { slots: AdSlotVisibility[] }) {
  const labelMap = useMemo(() => buildSlotLabelMap(), [])
  /** 잰 칸 중 안 나온 것만. 재지 못한 칸은 미노출로 보지 않는다 */
  const missing = useMemo(() => slots.filter((slot) => slot.measurable && !slot.rendered), [slots])

  const nameOf = (adTag: string) => labelMap.get(adTag.toLowerCase())

  return (
    <div className="diagSection adSlotSection">
      <div className="diagSectionTitle diagSectionTitleWithHelp">
        <span>
          광고 미노출 <span className="count">{missing.length}</span>
        </span>
        <span className="diagSectionHelpSlot" onClick={(e) => e.stopPropagation()}>
          <InlineHelpTooltip text={AD_SLOT_HELP_TEXT} />
        </span>
      </div>

      {missing.length ? (
        <ul className="adSlotList adSlotList--missing">
          {missing.map((slot) => (
            <li key={`${slot.source}:${slot.adTag}`}>
              <span className="pill error">미노출</span>
              <span className={`adSlotSource adSlotSource--${slot.source}`}>
                {AD_SLOT_SOURCE_LABEL[slot.source]}
              </span>
              {nameOf(slot.adTag) ? <span className="adSlotName">{nameOf(slot.adTag)}</span> : null}
              <code className="adSlotTag">{slot.adTag}</code>
              {slot.measurable ? (
                <span className="muted adSlotDetail">
                  광고칸 {slot.rect.width}×{slot.rect.height} · 소재 {slot.mediaCount}개
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">이번 실행에서 미노출로 잡힌 광고태그는 없습니다.</p>
      )}
    </div>
  )
}
