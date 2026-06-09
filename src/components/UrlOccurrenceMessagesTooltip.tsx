import { useCallback, useId, useState, type ReactNode } from 'react'

const URL_OCC_MSG_LINE_HEIGHT = 1.45
const URL_OCC_MSG_FONT_SIZE = 12
const URL_OCC_MSG_DEFAULT_LINES = 5
const URL_OCC_MSG_DEFAULT_SCROLL_HEIGHT = Math.round(
  URL_OCC_MSG_FONT_SIZE * URL_OCC_MSG_LINE_HEIGHT * URL_OCC_MSG_DEFAULT_LINES,
)
const URL_OCC_MSG_MIN_SCROLL_HEIGHT = URL_OCC_MSG_DEFAULT_SCROLL_HEIGHT
const URL_OCC_MSG_MAX_SCROLL_HEIGHT = 360

type UrlOccurrenceMessagesTooltipProps = {
  url: string
  errorSampleCount: number
  warningSampleCount: number
  pageErrorSampleCount: number
  errorMessages: string[]
  warningMessages: string[]
  pageErrorMessages: string[]
  children?: ReactNode
}

function MessageSection({
  title,
  sampleCount,
  messages,
}: {
  title: string
  sampleCount: number
  messages: string[]
}) {
  if (sampleCount < 1) return null

  const countLabel =
    messages.length > 0
      ? messages.length !== sampleCount
        ? `집계 ${sampleCount}건 · 고유 ${messages.length}건`
        : `고유 ${messages.length}건`
      : `샘플 ${sampleCount}건`

  return (
    <div className="urlOccurrenceMsgSection">
      <div className="urlOccurrenceMsgSectionTitle">
        {title} <span className="urlOccurrenceMsgSectionCount">{countLabel}</span>
      </div>
      {messages.length > 0 && messages.length !== sampleCount ? (
        <p className="scriptIssueMsgTooltipMeta">
          집계 {sampleCount}건 — 아래는 <strong>중복을 제외한 고유 메시지</strong>입니다.
        </p>
      ) : null}
      {messages.length ? (
        <ul className="scriptIssueMsgTooltipList">
          {messages.map((msg) => (
            <li key={msg} className="scriptIssueMsgTooltipItem">
              <pre className="scriptIssueMsgTooltipPre">{msg}</pre>
            </li>
          ))}
        </ul>
      ) : (
        <p className="scriptIssueMsgTooltipEmpty">메시지 본문이 저장되지 않았습니다.</p>
      )}
    </div>
  )
}

export function UrlOccurrenceMessagesTooltip({
  url,
  errorSampleCount,
  warningSampleCount,
  pageErrorSampleCount,
  errorMessages,
  warningMessages,
  pageErrorMessages,
  children,
}: UrlOccurrenceMessagesTooltipProps) {
  const [open, setOpen] = useState(false)
  const [scrollHeightPx, setScrollHeightPx] = useState(URL_OCC_MSG_DEFAULT_SCROLL_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)
  const panelId = useId()

  const onResizePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startHeight = scrollHeightPx

    const onPointerMove = (ev: PointerEvent) => {
      const next = Math.min(
        URL_OCC_MSG_MAX_SCROLL_HEIGHT,
        Math.max(URL_OCC_MSG_MIN_SCROLL_HEIGHT, Math.round(startHeight + (ev.clientY - startY))),
      )
      setScrollHeightPx(next)
    }

    const onPointerUp = () => {
      setIsResizing(false)
      document.body.classList.remove('urlOccurrenceMsgPanelResizing')
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
    }

    setIsResizing(true)
    document.body.classList.add('urlOccurrenceMsgPanelResizing')
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }, [scrollHeightPx])

  const totalSamples = errorSampleCount + warningSampleCount + pageErrorSampleCount
  const uniqueCount = errorMessages.length + warningMessages.length + pageErrorMessages.length
  const ariaLabel =
    uniqueCount > 0
      ? `${url} — 고유 메시지 ${uniqueCount}개`
      : `${url} — 샘플 ${totalSamples}건, 메시지 본문 없음`

  if (totalSamples < 1) {
    return children ? (
      <div className="urlOccurrenceMsgInlineRoot">
        <div className="issueOccurrenceUrlMetaRow">{children}</div>
      </div>
    ) : null
  }

  return (
    <div className="urlOccurrenceMsgInlineRoot">
      <div className="issueOccurrenceUrlMetaRow">
        <button
          type="button"
          className={`urlOccurrenceMsgTrigger${open ? ' urlOccurrenceMsgTriggerOpen' : ''}`}
          aria-label={`${ariaLabel} — ${open ? '접기' : '메시지 모두 보기'}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="urlOccurrenceMsgTriggerLabel">
            {open ? '메시지 접기' : '메시지 모두 보기'}
          </span>
          <svg
            className="urlOccurrenceMsgTriggerIcon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M3 4.5 6 7.5 9 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {children}
      </div>
      {open ? (
        <div
          className={`urlOccurrenceMsgPanelInline${isResizing ? ' urlOccurrenceMsgPanelInline--resizing' : ''}`}
          id={panelId}
        >
          <div
            className="urlOccurrenceMsgPanelScroll"
            style={{ height: scrollHeightPx, maxHeight: scrollHeightPx }}
          >
            <MessageSection title="콘솔 오류" sampleCount={errorSampleCount} messages={errorMessages} />
            <MessageSection title="콘솔 경고" sampleCount={warningSampleCount} messages={warningMessages} />
            <MessageSection title="페이지 오류" sampleCount={pageErrorSampleCount} messages={pageErrorMessages} />
          </div>
          <button
            type="button"
            className="urlOccurrenceMsgPanelResizeHandle"
            aria-label="메시지 패널 높이 조절"
            onPointerDown={onResizePointerDown}
          />
        </div>
      ) : null}
    </div>
  )
}
