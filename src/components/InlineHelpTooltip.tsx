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

export function InlineHelpTooltip({ text }: { text: string }) {
  return (
    <ViewportInlineHelp
      triggerClassName="inlineHelpButton"
      ariaLabel={text}
      trigger={<InfoIcon />}
    >
      {text}
    </ViewportInlineHelp>
  )
}
