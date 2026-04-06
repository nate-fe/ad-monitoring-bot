import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryStack } from 'victory'
import type { MonitorReport } from '../monitor/types'
import { getAdIssueBreakdown } from '../monitor/issueSources'

type AdIssueBreakdownProps = {
  report: MonitorReport
}

export function AdIssueBreakdown({ report }: AdIssueBreakdownProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(560)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const apply = () => setChartWidth(Math.max(280, Math.floor(el.getBoundingClientRect().width)))
    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rows = useMemo(() => (report.diagnostics ? getAdIssueBreakdown(report) : []), [report])

  const chartHeight = useMemo(() => Math.max(160, 56 + rows.length * 34), [rows.length])

  const errorData = useMemo(() => rows.map((r) => ({ x: r.label, y: r.errors })), [rows])
  const warnData = useMemo(() => rows.map((r) => ({ x: r.label, y: r.warnings })), [rows])

  const axisStyle = useMemo(
    () => ({
      axis: { stroke: 'var(--border)' },
      tickLabels: { fontSize: 12, fill: 'var(--muted)', fontFamily: 'inherit' },
      grid: { stroke: 'rgba(255, 255, 255, 0.08)' },
    }),
    [],
  )

  if (!report.diagnostics) {
    return (
      <div className="adIssueBreakdownRoot" ref={wrapRef}>
        <p className="muted">진단 정보가 없어 이번 실행의 광고·영역별 집계를 할 수 없습니다.</p>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="adIssueBreakdownRoot" ref={wrapRef}>
        <p className="muted">
          이번 실행에서 집계할 콘솔 오류·경고, 페이지 오류, 요청 실패가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="adIssueBreakdownRoot" ref={wrapRef}>
      <div className="adIssueBreakdownLegend" aria-hidden="true">
        <span className="adIssueBreakdownLegendItem">
          <span className="adIssueBreakdownSwatch adIssueBreakdownSwatchError" /> 오류
        </span>
        <span className="adIssueBreakdownLegendItem">
          <span className="adIssueBreakdownSwatch adIssueBreakdownSwatchWarn" /> 경고
        </span>
      </div>

      <div className="adIssueChartWrap" role="img" aria-label="광고·영역별 오류 및 경고 건수 막대 그래프">
        <VictoryChart
          horizontal
          width={chartWidth}
          height={chartHeight}
          domainPadding={{ y: 12, x: 8 }}
          padding={{ left: 132, right: 28, top: 8, bottom: 32 }}
        >
          <VictoryAxis style={axisStyle} />
          <VictoryAxis dependentAxis tickFormat={(v) => (Number.isInteger(v) ? `${v}` : '')} style={axisStyle} />
          <VictoryStack>
            <VictoryBar
              data={errorData}
              style={{
                data: {
                  fill: 'var(--fail)',
                  width: 18,
                },
              }}
            />
            <VictoryBar
              data={warnData}
              style={{
                data: {
                  fill: 'var(--warn)',
                  width: 18,
                },
              }}
            />
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
