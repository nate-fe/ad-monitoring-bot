import {
  explainMessage,
  MESSAGE_EXPLAIN_LEVEL_HINT,
  MESSAGE_EXPLAIN_LEVEL_LABEL,
  summarizeExplainLevels,
  type MessageExplainLevel,
} from '../monitor/messageExplanations'
import { InfoIcon } from './InlineHelpTooltip'
import { ViewportInlineHelp } from './ViewportInlineHelp'

/** 「기준이 뭐냐」는 질문이 화면 안에서 끝나도록, 범례 옆에 붙이는 판단 기준 */
const LEVEL_CRITERIA_HELP_TEXT = [
  '배지를 나누는 기준입니다.',
  '',
  '· 조치 필요 — 그 줄만 보고 "실제로 실패했다"가 확정되고, 실패한 대상이 광고를 띄우는 데 필요한 것',
  '· 확인만 — 지금은 광고가 나오지만 조건이 바뀌면 깨질 수 있거나, 속도·스크롤 같은 품질만 떨어지는 것. 막힌 대상이 광고 표시가 아니라 입찰·통계용이라 노출과 무관한 것도 여기입니다.',
  '· 무시 가능 — 광고사나 브라우저가 남긴 기록이거나, 검사용 브라우저에서만 나는 것',
  '',
  '"실패했을 수도 있다"는 조치 필요가 아닙니다. 예를 들어 Mixed Content는 브라우저가 http 주소를 https로 바꿔 다시 요청하므로 확인만이고, 그 요청까지 실패했다면 같은 주소로 조치 필요 줄이 따로 뜹니다.',
].join('\n')

/**
 * 콘솔 메시지 앞에 붙는 「조치 필요 / 확인만 / 무시 가능」 배지.
 * 눌러(또는 올려) 두면 기획자용 설명이 뜬다. 사전에 없는 메시지에는 배지를 달지 않는다.
 */
export function MessageExplainBadge({ text }: { text?: string }) {
  const info = explainMessage(text)
  if (!info) return null

  const levelLabel = MESSAGE_EXPLAIN_LEVEL_LABEL[info.level]

  return (
    <ViewportInlineHelp
      wrapClassName="msgExplainWrap"
      tooltipClassName="msgExplainTooltip"
      triggerClassName={`msgExplainBadge msgExplainBadge--${info.level}`}
      ariaLabel={`${levelLabel} — ${info.title}. 설명 보기`}
      zIndex={130}
      stayOpenOnClick
      trigger={levelLabel}
    >
      <span className={`msgExplainTooltipLevel msgExplainTooltipLevel--${info.level}`}>{levelLabel}</span>
      <strong className="msgExplainTooltipTitle">{info.title}</strong>
      <span className="msgExplainTooltipBody">
        <b>무슨 뜻이냐면</b>
        {info.meaning}
      </span>
      <span className="msgExplainTooltipBody">
        <b>어떻게 하면 되냐면</b>
        {info.action}
      </span>
      <span className="msgExplainTooltipFoot">{MESSAGE_EXPLAIN_LEVEL_HINT[info.level]}</span>
    </ViewportInlineHelp>
  )
}

const LEGEND_ITEMS: { level: MessageExplainLevel; desc: string }[] = [
  { level: 'action', desc: '광고가 안 나올 수 있음 — 확인 필요' },
  { level: 'watch', desc: '지금은 광고가 나오지만 알아둘 것' },
  { level: 'noise', desc: '광고 노출에 영향을 주지 않는 기록' },
]

/**
 * 배지 색이 무슨 뜻인지 알려 주는 범례. 메시지 목록 위에 한 번만 노출한다.
 * `texts`를 넘기면 아래 목록의 단계별 건수까지 같이 세어 보여 준다.
 */
export function MessageExplainLegend({ texts }: { texts?: (string | undefined)[] }) {
  const summary = texts ? summarizeExplainLevels(texts) : null
  const countByLevel = new Map(summary?.rows.map((r) => [r.level, r.count]))

  return (
    <div className="msgExplainLegend">
      <div className="msgExplainLegendLead">
        메시지 앞 배지
        <ViewportInlineHelp
          wrapClassName="msgExplainCriteriaWrap"
          tooltipClassName="msgExplainCriteriaTooltip"
          triggerClassName="inlineHelpButton"
          ariaLabel="배지를 나누는 기준 보기"
          zIndex={130}
          stayOpenOnClick
          trigger={<InfoIcon />}
        >
          {LEVEL_CRITERIA_HELP_TEXT}
        </ViewportInlineHelp>
      </div>
      {LEGEND_ITEMS.map((item) => {
        const count = countByLevel.get(item.level)
        return (
          <span className="msgExplainLegendItem" key={item.level}>
            <span className={`msgExplainBadge msgExplainBadge--${item.level} msgExplainBadge--static`}>
              {MESSAGE_EXPLAIN_LEVEL_LABEL[item.level]}
            </span>
            <span className="msgExplainLegendDesc">
              {item.desc}
              {summary ? <b className="msgExplainLegendCount">{count ?? 0}건</b> : null}
            </span>
          </span>
        )
      })}
    </div>
  )
}
