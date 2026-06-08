import { useMemo } from 'react'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryStack } from 'victory'
import { useChartWrapWidth } from '../hooks/useChartWrapWidth'
import type { MonitorReport } from '../monitor/types'
import { getAdIssueBreakdown } from '../monitor/issueSources'

type AdIssueBreakdownProps = {
  report: MonitorReport
}

export function AdIssueBreakdown({ report }: AdIssueBreakdownProps) {
  const { wrapRef: chartWrapRef, chartWidth } = useChartWrapWidth()

  const rows = useMemo(() => (report.diagnostics ? getAdIssueBreakdown(report) : []), [report])

  const chartHeight = useMemo(() => Math.max(160, 56 + rows.length * 34), [rows.length])

  const errorData = useMemo(() => rows.map((r) => ({ x: r.label, y: r.errors })), [rows])
  const warnData = useMemo(() => rows.map((r) => ({ x: r.label, y: r.warnings })), [rows])
  const hasAnyErrors = useMemo(() => rows.some((r) => r.errors > 0), [rows])
  const hasAnyWarnings = useMemo(() => rows.some((r) => r.warnings > 0), [rows])

  const leftPadding = useMemo(() => {
    const longest = rows.reduce((max, row) => Math.max(max, row.label.length), 0)
    return Math.min(200, Math.max(96, longest * 7 + 24))
  }, [rows])

  const axisStyle = useMemo(
    () => ({
      axis: { stroke: 'var(--border)' },
      tickLabels: { fontSize: 13, fill: 'var(--muted)', fontFamily: 'inherit' },
      grid: { stroke: 'rgba(255, 255, 255, 0.08)' },
    }),
    [],
  )

  if (!report.diagnostics) {
    return (
      <div className="adIssueBreakdownRoot">
        <p className="muted">진단 정보가 없어 이번 실행의 광고·영역별 집계를 할 수 없습니다.</p>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="adIssueBreakdownRoot">
        <p className="muted">
          이번 실행에서 집계할 콘솔 오류·경고, 페이지 오류가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="adIssueBreakdownRoot">
      <div className="adIssueBreakdownLegend" aria-hidden="true">
        {hasAnyErrors ? (
          <span className="adIssueBreakdownLegendItem">
            <span className="adIssueBreakdownSwatch adIssueBreakdownSwatchError" /> 오류
          </span>
        ) : null}
        {hasAnyWarnings ? (
          <span className="adIssueBreakdownLegendItem">
            <span className="adIssueBreakdownSwatch adIssueBreakdownSwatchWarn" /> 경고
          </span>
        ) : null}
      </div>

      <div
        className="adIssueChartWrap"
        ref={chartWrapRef}
        role="img"
        aria-label="광고·영역별 오류 및 경고 건수 막대 그래프"
      >
        <VictoryChart
          horizontal
          width={chartWidth}
          height={chartHeight}
          domainPadding={{ y: 12, x: [12, 20] }}
          padding={{ left: leftPadding, right: 40, top: 8, bottom: 32 }}
        >
          <VictoryAxis style={axisStyle} />
          <VictoryAxis dependentAxis tickFormat={(v) => (Number.isInteger(v) ? `${v}` : '')} style={axisStyle} />
          <VictoryStack>
            {hasAnyErrors ? (
              <VictoryBar
                data={errorData}
                style={{
                  data: {
                    fill: 'var(--fail)',
                    width: 18,
                  },
                }}
              />
            ) : null}
            {hasAnyWarnings ? (
              <VictoryBar
                data={warnData}
                style={{
                  data: {
                    fill: 'var(--warn)',
                    width: 18,
                  },
                }}
              />
            ) : null}
          </VictoryStack>
        </VictoryChart>
      </div>

      <div className="adIssueTableWrap">
        <table className="adIssueTable">
          <caption className="srOnly">광고·영역별 오류 및 경고 건수</caption>
          <thead>
            <tr>
              <th scope="col">광고·영역</th>
              <th scope="col">오류</th>
              <th scope="col">경고</th>
              <th scope="col">합계</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{r.errors}</td>
                <td>{r.warnings}</td>
                <td>{r.errors + r.warnings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
