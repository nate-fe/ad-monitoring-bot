import { ViewportInlineHelp } from './ViewportInlineHelp'

type ScriptIssueMessagesTooltipProps = {
  kind: 'error' | 'warning'
  count: number
  sourceUrl: string
  messages?: string[]
}

export function ScriptIssueMessagesTooltip({ kind, count, sourceUrl, messages }: ScriptIssueMessagesTooltipProps) {
  const list = messages ?? []
  const title = kind === 'error' ? '오류' : '경고'
  const ariaLabel =
    list.length > 0
      ? `${title} ${count}건 — 고유 메시지 ${list.length}개(툴팁에서 전문 확인)`
      : `${title} ${count}건 — 메시지 본문 없음(구 리포트일 수 있음)`

  if (count < 1) {
    return <>{count}</>
  }

  return (
    <ViewportInlineHelp
      wrapClassName="scriptIssueMsgTooltipWrap"
      tooltipClassName="scriptIssueMsgTooltip"
      triggerClassName="scriptIssueCountBtn"
      ariaLabel={ariaLabel}
      zIndex={120}
      trigger={count}
    >
      {kind === 'error' ? <code className="scriptIssueMsgTooltipCode">{sourceUrl}</code> : null}
      {list.length > 0 && list.length !== count ? (
        <p className="scriptIssueMsgTooltipMeta">
          집계 {count}건 — 아래는 <strong>중복을 제외한 고유 메시지</strong>입니다.
        </p>
      ) : null}
      {list.length > 0 ? (
        <ul className="scriptIssueMsgTooltipList">
          {list.map((msg) => (
            <li key={msg} className="scriptIssueMsgTooltipItem">
              <pre className="scriptIssueMsgTooltipPre">{msg}</pre>
            </li>
          ))}
        </ul>
      ) : (
        <p className="scriptIssueMsgTooltipEmpty">
          이 리포트에는 메시지 본문이 없습니다.<br />
          (구 리포트일 수 있음)
        </p>
      )}
    </ViewportInlineHelp>
  )
}
