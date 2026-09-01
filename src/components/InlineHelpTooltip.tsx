import { ViewportInlineHelp } from './ViewportInlineHelp'

export function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="10" cy="5.6" r="1" fill="currentColor" />
    </svg>
  )
}

export function InlineHelpTooltip({
  text,
  ariaLabel,
  openOnClick = false,
}: {
  text: string
  ariaLabel?: string
  /** true면 호버가 아니라 클릭으로 열고, 내용이 길면 스크롤합니다. */
  openOnClick?: boolean
}) {
  return (
    <ViewportInlineHelp
      triggerClassName="inlineHelpButton"
      tooltipClassName={openOnClick ? 'inlineHelpTooltip--click' : ''}
      ariaLabel={ariaLabel ?? text}
      trigger={<InfoIcon />}
      openOn={openOnClick ? 'click' : 'hover'}
    >
      {text}
    </ViewportInlineHelp>
  )
}
