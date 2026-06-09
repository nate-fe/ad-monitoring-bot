/** 방패 아이콘 — CSP(정책) 관련 호스트 안내용 */
import { CSP_REPORT_HOST_TOOLTIP } from '../monitor/cspReportHost'
import { ViewportInlineHelp } from './ViewportInlineHelp'

export function CspShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M10 2.5 4 5.2v4.8c0 3.8 2.4 7.3 6 8.5 3.6-1.2 6-4.7 6-8.5V5.2L10 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type CspReportHostHintProps = {
  /** 접근성용 짧은 라벨 (버튼 aria-label) */
  labelShort?: string
}

export function CspReportHostHint({ labelShort = 'CSP 리포트 요청 안내' }: CspReportHostHintProps) {
  const ariaLabel = `${labelShort}. ${CSP_REPORT_HOST_TOOLTIP.replace(/\n+/g, ' ')}`
  return (
    <ViewportInlineHelp
      wrapClassName="cspReportHintWrap"
      tooltipClassName="cspReportHintTooltip"
      triggerClassName="inlineHelpButton cspReportHintButton"
      ariaLabel={ariaLabel}
      trigger={<CspShieldIcon />}
    >
      {CSP_REPORT_HOST_TOOLTIP}
    </ViewportInlineHelp>
  )
}
