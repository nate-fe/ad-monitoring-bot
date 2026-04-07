import type { DomainErrorRateRankRow, DomainInsights, DomainLatencyRankRow } from '../monitor/types'
import { InlineHelpTooltip } from './InlineHelpTooltip'

const DOMAIN_LATENCY_HELP_TEXT =
  'Performance 리소스 타이밍 기준, navigation 제외 후 호스트별 duration 평균(ms).'

const DOMAIN_ERROR_RATE_HELP_TEXT =
  '에러 건수 ÷ 동일 호스트의 리소스 타이밍 건수. 페이지 오류·페이지 콘솔 오류의 sourceUrl, 요청 실패 URL 호스트만 집계합니다. 헤드리스 네트워크 로그(콘솔 devtools)는 제외합니다.'

type DomainSourceTop5Props = {
  insights: DomainInsights
}

function formatErrorRateLabel(row: DomainErrorRateRankRow): string {
  if (row.resourceCount < 1) return '—'
  if (row.errorRate <= 1) return `${(row.errorRate * 100).toFixed(1)}%`
  return `${row.errorCount}/${row.resourceCount}`
}

function LatencyTable({ rows }: { rows: DomainLatencyRankRow[] }) {
  if (!rows.length) {
    return <p className="muted domainTop5Empty">표시할 호스트가 없습니다. (리소스 2건 이상인 호스트만 순위에 포함)</p>
  }
  return (
    <div className="domainTop5TableWrap">
      <table className="adIssueTable domainTop5Table">
        <caption className="srOnly">호스트별 평균 리소스 지연 시간 상위 5</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">호스트 (Source / 요청)</th>
            <th scope="col">평균 지연</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.hostname}>
              <td>{i + 1}</td>
              <th scope="row" className="domainTop5Host">
                {r.hostname}
              </th>
              <td>{r.avgDurationMs.toFixed(1)}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorRateTable({ rows }: { rows: DomainErrorRateRankRow[] }) {
  if (!rows.length) {
    return <p className="muted domainTop5Empty">에러가 잡힌 호스트가 없습니다.</p>
  }
  return (
    <div className="domainTop5TableWrap">
      <table className="adIssueTable domainTop5Table">
        <caption className="srOnly">호스트별 에러율 상위 5</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">호스트</th>
            <th scope="col">에러</th>
            <th scope="col">리소스</th>
            <th scope="col">에러율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.hostname}>
              <td>{i + 1}</td>
              <th scope="row" className="domainTop5Host">
                {r.hostname}
              </th>
              <td>{r.errorCount}</td>
              <td>{r.resourceCount}</td>
              <td>{formatErrorRateLabel(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DomainSourceTop5({ insights }: DomainSourceTop5Props) {
  return (
    <div className="domainTop5Root">
      <div className="domainTop5Grid">
        <div className="domainTop5Block">
          <h3 className="domainTop5BlockTitle domainTop5BlockTitleWithHelp">
            <span>지연 시간 Top 5</span>
            <InlineHelpTooltip text={DOMAIN_LATENCY_HELP_TEXT} />
          </h3>
          <LatencyTable rows={insights.latencyTop5} />
        </div>
        <div className="domainTop5Block">
          <h3 className="domainTop5BlockTitle domainTop5BlockTitleWithHelp">
            <span>에러율 Top 5</span>
            <InlineHelpTooltip text={DOMAIN_ERROR_RATE_HELP_TEXT} />
          </h3>
          <ErrorRateTable rows={insights.errorRateTop5} />
        </div>
      </div>
    </div>
  )
}
