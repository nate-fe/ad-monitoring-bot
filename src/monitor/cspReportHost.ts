export const CSP_REPORT_HOST_TOOLTIP =
  'CSP(Content-Security-Policy) 리포트·보고 요청으로 보입니다. 콘솔이 아니라 DevTools Network에서 실패 이유(net::…)를 확인하세요.\n\n' +
  '• ERR_BLOCKED_BY_CLIENT — 확장·광고차단 등 환경 영향이 흔함. 서비스 버그와는 별개인 경우가 많음.\n' +
  '• ERR_CONNECTION_REFUSED / 이름 확인 실패 — URL·DNS·일시 네트워크·인프라 점검.\n' +
  '• CSP 위반 메시지 — 우리가 내려주는 CSP라면 헤더·정책 담당(프론트·백엔드·인프라)에서 connect-src 등 검토.\n' +
  '• csp.withgoogle.com 등 제3자 수집 URL — Google 측 엔드포인트라 우리 코드로 직접 수정 불가인 경우가 많고, 대시보드에서는 노이즈로 둘 수 있음.'

/** 에러율 집계에 나온 호스트명이 CSP 리포트 전송으로 흔한 도메인인지 */
export function isLikelyCspReportHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase()
  if (!h) return false
  if (h === 'csp.withgoogle.com' || h.endsWith('.csp.withgoogle.com')) return true
  if (h === 'csp-reporting.cloudflare.com') return true
  return false
}
