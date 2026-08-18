import { createContext, useContext, type ReactNode } from 'react'
import {
  formatLifecycleDayLabel,
  lifecycleKeyOf,
  LIFECYCLE_STATUS_DESCRIPTION,
  LIFECYCLE_STATUS_LABEL,
  type IssueLifecycleItem,
} from '../monitor/issueLifecycle'
import { ViewportInlineHelp } from './ViewportInlineHelp'

/**
 * 메시지 원문으로 생애주기를 찾아 주는 통로.
 *
 * 콘솔 메시지 목록은 리포트 화면 여기저기(오류·경고·구식 문법·실행 기록 안쪽)에서 그려지는데,
 * 그 전부에 lookup 을 인자로 내려보내면 손대는 곳이 너무 많아진다. 배지는 있으면 좋은 부가 정보라
 * 없을 때 조용히 사라지면 그만이므로 컨텍스트로 둔다.
 */
const IssueLifecycleContext = createContext<Map<string, IssueLifecycleItem> | null>(null)

export function IssueLifecycleProvider({
  lookup,
  children,
}: {
  lookup: Map<string, IssueLifecycleItem> | null
  children: ReactNode
}) {
  return <IssueLifecycleContext.Provider value={lookup}>{children}</IssueLifecycleContext.Provider>
}

function useIssueLifecycle(text: string | undefined): IssueLifecycleItem | null {
  const lookup = useContext(IssueLifecycleContext)
  if (!lookup) return null
  const key = lifecycleKeyOf(text)
  if (!key) return null
  return lookup.get(key) ?? null
}

/**
 * 콘솔 메시지 옆에 붙는 「신규 / 만성 / 간헐」 배지.
 *
 * 해소는 지금 리포트에 없는 오류라서 이 자리에는 나오지 않는다 — 해소 목록은 생애주기 화면에서 본다.
 * 판단에 쓴 숫자(며칠 중 며칠, 처음 본 날)를 툴팁에 그대로 적어, 「왜 만성인데?」가 화면 안에서 끝나게 한다.
 */
export function IssueLifecycleBadge({ text }: { text?: string }) {
  const item = useIssueLifecycle(text)
  if (!item || item.status === 'resolved') return null

  const statusLabel = LIFECYCLE_STATUS_LABEL[item.status]
  const ratioText = `검사한 ${item.observedDayCount}일 중 ${item.daysInWindow.length}일`

  return (
    <ViewportInlineHelp
      wrapClassName="lifecycleBadgeWrap"
      tooltipClassName="lifecycleBadgeTooltip"
      triggerClassName={`lifecycleBadge lifecycleBadge--${item.status}`}
      ariaLabel={`${statusLabel} — 발생 이력 보기`}
      zIndex={130}
      stayOpenOnClick
      trigger={statusLabel}
    >
      <span className={`lifecycleBadgeTooltipStatus lifecycleBadgeTooltipStatus--${item.status}`}>
        {statusLabel}
      </span>
      <span className="lifecycleBadgeTooltipBody">{LIFECYCLE_STATUS_DESCRIPTION[item.status]}</span>
      <span className="lifecycleBadgeTooltipBody">
        <b>처음 본 날</b>
        {formatLifecycleDayLabel(item.firstSeenDay)}
      </span>
      <span className="lifecycleBadgeTooltipBody">
        <b>최근 발생</b>
        {ratioText}
      </span>
    </ViewportInlineHelp>
  )
}
