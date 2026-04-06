import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryStack } from 'victory'
import type { MonitorHistoryEntry } from '../monitor/types'
import {
  buildMonthlyConsoleAdChartModel,
  formatMonthKeyShortLabel,
  MONTHLY_AD_CHART_FILLS,
} from '../monitor/issueSources'

export type HistoryLoadKind = 'idle' | 'loading' | 'error' | 'loaded'

type HistoryMonthlyConsoleSectionProps = {
  historyItems?: MonitorHistoryEntry[]
  historyStatus: HistoryLoadKind
  /** 월 필터가 '전체'가 아닐 때 표시할 월 라벨 */
  activeMonthFilterLabel?: string | null
}

function MonthlyStackedBars({
  title,
  series,
  monthKeys,
  chartWidth,
  axisStyle,
}: {
  title: string
  series: { key: string; label: string; colorIndex: number; data: { x: string; y: number }[] }[]
  monthKeys: string[]
  chartWidth: number
  axisStyle: {
    axis: { stroke: string }
    tickLabels: { fontSize: number; fill: string; fontFamily: string; angle?: number; textAnchor?: string }
    grid: { stroke: string }
  }
}) {
  const hasData = series.some((s) => s.data.some((d) => d.y > 0))
  if (!hasData || !monthKeys.length) {
    return (
      <div className="adIssueMonthlyChartBlock">
        <div className="adIssueMonthlyChartTitle">{title}</div>
        <p className="muted adIssueMonthlyEmpty">해당 기간 샘플에 집계할 항목이 없습니다.</p>
      </div>
    )
  }

  const chartHeight = Math.min(340, Math.max(200, 120 + monthKeys.length * 6))

  return (
    <div className="adIssueMonthlyChartBlock">
      <div className="adIssueMonthlyChartTitle">{title}</div>
      <div className="adIssueChartWrap" role="img" aria-label={title}>
        <VictoryChart
          domainPadding={{ x: 28 }}
          width={chartWidth}
          height={chartHeight}
          padding={{ left: 52, right: 20, top: 12, bottom: monthKeys.length > 8 ? 72 : 52 }}
        >
          <VictoryAxis
            tickValues={monthKeys}
            tickFormat={(m) => formatMonthKeyShortLabel(String(m))}
            style={{
              ...axisStyle,
              tickLabels: {
                ...axisStyle.tickLabels,
                ...(monthKeys.length > 6
                  ? { angle: -28, textAnchor: 'end' as const, padding: 6 }
                  : {}),
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(v) => (Number.isInteger(v) ? `${v}` : '')}
            style={axisStyle}
          />
          <VictoryStack>
            {series.map((s) => (
              <VictoryBar
                key={s.key}
                data={s.data}
                style={{
                  data: {
                    fill: MONTHLY_AD_CHART_FILLS[s.colorIndex % MONTHLY_AD_CHART_FILLS.length],
                  },
                }}
              />
            ))}
          </VictoryStack>
        </VictoryChart>
      </div>
    </div>
  )
}

function MonthlyLegend({
  series,
}: {
  series: { key: string; label: string; colorIndex: number }[]
}) {
  return (
    <div className="adIssueMonthlyLegend" aria-hidden="true">
      {series.map((s) => (
        <span className="adIssueMonthlyLegendItem" key={s.key}>
          <span
            className="adIssueMonthlySwatch"
            style={{
              background: MONTHLY_AD_CHART_FILLS[s.colorIndex % MONTHLY_AD_CHART_FILLS.length],
            }}
          />
          {s.label}
        </span>
      ))}
    </div>
  )
}

export function HistoryMonthlyConsoleSection({
  historyItems,
  historyStatus,
  activeMonthFilterLabel,
}: HistoryMonthlyConsoleSectionProps) {
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

  const axisStyle = useMemo(
    () => ({
      axis: { stroke: 'var(--border)' },
      tickLabels: { fontSize: 12, fill: 'var(--muted)', fontFamily: 'inherit' },
      grid: { stroke: 'rgba(255, 255, 255, 0.08)' },
    }),
    [],
  )

  const monthlyModel = useMemo(() => {
    if (!historyItems?.length) return null
    return buildMonthlyConsoleAdChartModel(historyItems)
  }, [historyItems])

  const legendSeries = monthlyModel?.errorsSeries ?? []

  const body = (() => {
    if (historyStatus === 'loading') {
      return <p className="muted">실행 기록을 불러오는 중…</p>
    }
    if (historyStatus === 'idle') {
      return <p className="muted">실행 기록을 불러오면 월별 그래프가 표시됩니다.</p>
    }
    if (historyStatus === 'error') {
      return <p className="muted">실행 기록을 불러오지 못해 월별 그래프를 표시할 수 없습니다.</p>
    }
    if (!historyItems?.length) {
      return <p className="muted">저장된 실행 기록이 없어 월별 그래프를 그릴 수 없습니다.</p>
    }
    if (!monthlyModel) {
      return null
    }
    if (!monthlyModel.hasAnyConsoleSample || !monthlyModel.monthKeys.length) {
      return (
        <p className="muted">
          기록에 콘솔 오류·경고 샘플이 없거나, 유효한 실행 시각이 없어 월별 그래프를 그릴 수 없습니다.
        </p>
      )
    }

    return (
      <>
        {activeMonthFilterLabel ? (
          <p className="historyMonthlyFilterHint">
            아래 목록과 같이 <strong>{activeMonthFilterLabel}</strong> 실행만 반영했습니다.
          </p>
        ) : null}
        <p className="adIssueMonthlyNote">
          히스토리에 저장된 <strong>콘솔 샘플</strong>(실행당 오류·경고 최대 5건, DevTools 네트워크 메시지 샘플 포함)을
          월·광고·영역 규칙으로 묶어 집계합니다. 전체 발생 건수와는 다를 수 있습니다.
        </p>
        {legendSeries.length ? <MonthlyLegend series={legendSeries} /> : null}
        <MonthlyStackedBars
          title="월별 콘솔 오류 (광고·영역)"
          series={monthlyModel.errorsSeries}
          monthKeys={monthlyModel.monthKeys}
          chartWidth={chartWidth}
          axisStyle={axisStyle}
        />
        <MonthlyStackedBars
          title="월별 콘솔 경고 (광고·영역)"
          series={monthlyModel.warningsSeries}
          monthKeys={monthlyModel.monthKeys}
          chartWidth={chartWidth}
          axisStyle={axisStyle}
        />
      </>
    )
  })()

  return (
    <div className="historyMonthlyConsole" ref={wrapRef}>
      <h3 className="adIssueSubTitle">월별 콘솔 오류 / 경고 (히스토리)</h3>
      {body}
    </div>
  )
}
