/** 방패 아이콘 — CSP(정책) 관련 호스트 안내용 */
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

export const CSP_REPORT_HOST_TOOLTIP =
  'CSP(Content-Security-Policy) 리포트·보고 요청으로 보입니다. 콘솔이 아니라 DevTools Network에서 실패 이유(net::…)를 확인하세요.\n\n' +
  '• ERR_BLOCKED_BY_CLIENT — 확장·광고차단 등 환경 영향이 흔함. 서비스 버그와는 별개인 경우가 많음.\n' +
  '• ERR_CONNECTION_REFUSED / 이름 확인 실패 — URL·DNS·일시 네트워크·인프라 점검.\n' +
  '• CSP 위반 메시지 — 우리가 내려주는 CSP라면 헤더·정책 담당(프론트·백엔드·인프라)에서 connect-src 등 검토.\n' +
  '• csp.withgoogle.com 등 제3자 수집 URL — Google 측 엔드포인트라 우리 코드로 직접 수정 불가인 경우가 많고, 대시보드에서는 노이즈로 둘 수 있음.'

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

/** 에러율 집계에 나온 호스트명이 CSP 리포트 전송으로 흔한 도메인인지 */
export function isLikelyCspReportHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase()
  if (!h) return false
  if (h === 'csp.withgoogle.com' || h.endsWith('.csp.withgoogle.com')) return true
  if (h === 'csp-reporting.cloudflare.com') return true
  return false
}
