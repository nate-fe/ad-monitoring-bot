import { ViewportInlineHelp } from './ViewportInlineHelp'

type DomainErrorRateResourceUrlTooltipProps = {
  hostname: string
  resourceCount: number
  resourceUrls?: string[]
}

export function DomainErrorRateResourceUrlTooltip({
  hostname,
  resourceCount,
  resourceUrls,
}: DomainErrorRateResourceUrlTooltipProps) {
  const urls = resourceUrls ?? []
  const uniqueCount = urls.length
  const ariaLabel =
    uniqueCount > 0
      ? `리소스 ${resourceCount}건, 고유 URL ${uniqueCount}개 — 툴팁에서 목록 확인`
      : resourceCount < 1
        ? '리소스 0건'
        : `리소스 ${resourceCount}건 — URL 목록 없음(구 리포트일 수 있음)`

  return (
    <ViewportInlineHelp
      wrapClassName="domainTop5ResourceUrlWrap"
      tooltipClassName="domainTop5ResourceUrlsTooltip"
      triggerClassName="domainTop5ResourceCountBtn"
      ariaLabel={ariaLabel}
      zIndex={90}
      trigger={resourceCount}
    >
      <span className="domainTop5ResourceUrlsTooltipHost">{hostname}</span>
      {uniqueCount > 0 ? (
        <>
          {resourceCount !== uniqueCount ? (
            <p className="domainTop5ResourceUrlsTooltipMeta">
              타이밍 {resourceCount}건 · 고유 URL {uniqueCount}개
            </p>
          ) : null}
          <ul className="domainTop5UrlList">
            {urls.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer" className="domainTop5UrlLink">
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="domainTop5ResourceUrlsTooltipEmpty">
          {resourceCount < 1 ? '이 호스트로 측정된 리소스 타이밍이 없습니다.' : 'URL 목록이 없습니다.'}
        </p>
      )}
    </ViewportInlineHelp>
  )
}
