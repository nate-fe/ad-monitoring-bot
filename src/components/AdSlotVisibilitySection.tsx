import { useMemo } from 'react'
import type { AdSlotSource, AdSlotVisibility } from '../monitor/types'
import { AD_LAYOUTS } from '../adLayouts'
import { InlineHelpTooltip } from './InlineHelpTooltip'

const AD_SLOT_HELP_TEXT = [
  '캡쳐를 찍기 직전의 지면에서, 광고태그별로 광고칸이 실제로 그려졌는지 잰 것입니다.',
  '',
  '· 노출 — 광고칸에 높이가 있고 소재(iframe·이미지 등)가 1개 이상 들어 있음',
  '· 미노출 — 광고칸 높이가 0이거나 소재가 하나도 없음',
  '· 확인 불가 — 광고칸을 특정하지 못한 것. 미노출이 아니라 「재지 못했다」는 뜻입니다.',
  '',
  '캡쳐 이미지에서 흰 공간을 찾는 방식은 쓰지 않습니다. 광고가 안 나오면 칸이 비는 게 아니라 높이가 0으로 접히고 아래 내용이 위로 올라붙어서, 이미지에는 흔적이 남지 않기 때문입니다. 흰 공간을 찾아내도 그것이 어느 광고태그인지 붙일 수 없습니다.',
  '',
  '광고칸 상당수가 네이트 도메인으로 뜬 iframe 안에 있어서, 같은 도메인인 iframe 은 안까지 들어가 셉니다. 광고 안에 광고가 들어가는 패스백 구조까지 따라갑니다.',
  '',
  '다른 도메인으로 뜬 iframe(ep.elementunit.com 등)은 규격상 안을 볼 수 없습니다. 즉 「iframe 은 떠 있는데 내용이 백지」인 경우는 여기서 노출로 잡힙니다.',
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

const UNMEASURABLE_REASON_LABEL: Record<string, string> = {
  'no-container': '스크립트가 head 에 있어 광고칸을 못 찾음(앵커·팝업 종류)',
  'container-is-section': '광고칸이 아니라 본문 섹션 전체가 잡힘(수집용 스크립트로 보임)',
}

export function AdSlotVisibilitySection({ slots }: { slots: AdSlotVisibility[] }) {
  const labelMap = useMemo(() => buildSlotLabelMap(), [])

  const { missing, rendered, unmeasurable } = useMemo(() => {
    const missing: AdSlotVisibility[] = []
    const rendered: AdSlotVisibility[] = []
    const unmeasurable: AdSlotVisibility[] = []
    for (const slot of slots) {
      if (!slot.measurable) unmeasurable.push(slot)
      else if (slot.rendered) rendered.push(slot)
      else missing.push(slot)
    }
    return { missing, rendered, unmeasurable }
  }, [slots])

  const nameOf = (adTag: string) => labelMap.get(adTag.toLowerCase())

  return (
    <div className="diagSection adSlotSection">
      <div className="diagSectionTitle diagSectionTitleWithHelp">
        <span>
          광고 노출 <span className="count">{slots.length}</span>
        </span>
        <span className="diagSectionHelpSlot" onClick={(e) => e.stopPropagation()}>
          <InlineHelpTooltip text={AD_SLOT_HELP_TEXT} />
        </span>
      </div>

      <div className="adSlotSummary">
        <span className="adSlotStat adSlotStat--ok">
          노출 <b>{rendered.length}</b>
        </span>
        <span className={`adSlotStat${missing.length ? ' adSlotStat--fail' : ''}`}>
          미노출 <b>{missing.length}</b>
        </span>
        {unmeasurable.length ? (
          <span className="adSlotStat adSlotStat--unknown">
            확인 불가 <b>{unmeasurable.length}</b>
          </span>
        ) : null}
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

      {rendered.length ? (
        <details className="adSlotDetails">
          <summary>노출된 광고태그 {rendered.length}개</summary>
          <ul className="adSlotList">
            {rendered.map((slot) => (
              <li key={`${slot.source}:${slot.adTag}`}>
                <span className={`adSlotSource adSlotSource--${slot.source}`}>
                  {AD_SLOT_SOURCE_LABEL[slot.source]}
                </span>
                {nameOf(slot.adTag) ? <span className="adSlotName">{nameOf(slot.adTag)}</span> : null}
                <code className="adSlotTag">{slot.adTag}</code>
                {slot.measurable ? (
                  <span className="muted adSlotDetail">
                    {slot.rect.width}×{slot.rect.height}
                    {slot.content ? ` · 소재 ${slot.content.rect.width}×${slot.content.rect.height}` : ''}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {unmeasurable.length ? (
        <details className="adSlotDetails">
          <summary>확인 불가 {unmeasurable.length}개 — 미노출과 다릅니다</summary>
          <ul className="adSlotList">
            {unmeasurable.map((slot) => (
              <li key={`${slot.source}:${slot.adTag}`}>
                <span className={`adSlotSource adSlotSource--${slot.source}`}>
                  {AD_SLOT_SOURCE_LABEL[slot.source]}
                </span>
                {nameOf(slot.adTag) ? <span className="adSlotName">{nameOf(slot.adTag)}</span> : null}
                <code className="adSlotTag">{slot.adTag}</code>
                <span className="muted adSlotDetail">
                  {slot.measurable ? '' : UNMEASURABLE_REASON_LABEL[slot.reason] ?? slot.reason}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
