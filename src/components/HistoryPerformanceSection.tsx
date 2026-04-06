import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'
import type { MonitorHistoryEntry } from '../monitor/types'
import {
  buildDailyPerformanceChartModel,
  formatDayKeyShortLabel,
  type PerformanceHistoryBucketPoint,
} from '../monitor/issueSources'

export type HistoryLoadKind = 'idle' | 'loading' | 'error' | 'loaded'

type HistoryPerformanceSectionProps = {
  historyItems?: MonitorHistoryEntry[]
  historyStatus: HistoryLoadKind
  activeMonthFilterLabel?: string | null
}

function formatPerfTooltip(
  datum: { tip?: PerformanceHistoryBucketPoint } | undefined,
  formatBucketLabel: (k: string) => string,
): string {
  const p = datum?.tip
  if (!p) return ''
  const day = formatBucketLabel(p.x)
  return `${day}\nTBT(근사) ${Math.round(p.approxTbtMs)}ms · 광고 스크립트 ${p.avgAdScriptResourceDurationMs.toFixed(1)}ms\n해당일 ${p.runCount}회 평균`
}

function PerfLineLegend() {
  return (
    <div className="adIssueMonthlyLegend historyPerfLegend" aria-hidden="true">
      <span className="adIssueMonthlyLegendItem">
        <span className="historyPerfLineSwatch historyPerfLineSwatchTbt" />
        TBT(근사)
      </span>
      <span className="adIssueMonthlyLegendItem">
        <span className="historyPerfLineSwatch historyPerfLineSwatchScript" />
        광고 스크립트 평균(ms)
      </span>
    </div>
  )
}

function HistoryPerformanceLineChart({
  title,
  points,
  dayKeys,
  chartWidth,
  axisStyle,
}: {
  title: string
  points: PerformanceHistoryBucketPoint[]
  dayKeys: string[]
  chartWidth: number
  axisStyle: {
    axis: { stroke: string }
    tickLabels: { fontSize: number; fill: string; fontFamily: string; angle?: number; textAnchor?: string }
    grid: { stroke: string }
  }
}) {
  const hasData = points.length > 0
  if (!hasData || !dayKeys.length) {
    return (
      <div className="adIssueMonthlyChartBlock">
        <div className="adIssueMonthlyChartTitle">{title}</div>
        <p className="muted adIssueMonthlyEmpty">해당 기간에 성능 샘플이 없습니다.</p>
      </div>
    )
  }

  const tbtData = points.map((p) => ({ x: p.x, y: p.approxTbtMs, tip: p }))
  const scriptData = points.map((p) => ({ x: p.x, y: p.avgAdScriptResourceDurationMs, tip: p }))
  const hitData = points.map((p) => ({
    x: p.x,
    y: Math.max(p.approxTbtMs, p.avgAdScriptResourceDurationMs, 0.001),
    tip: p,
  }))

  const yMax = Math.max(
    1,
    ...points.map((p) => Math.max(p.approxTbtMs, p.avgAdScriptResourceDurationMs)),
  )

  const chartHeight = Math.min(360, Math.max(240, 220))
  const tiltTicks = dayKeys.length > 6

  return (
    <div className="adIssueMonthlyChartBlock">
      <div className="adIssueMonthlyChartTitle">{title}</div>
      <div className="adIssueChartWrap" role="img" aria-label={title}>
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          domainPadding={{ x: 8 }}
          domain={{ y: [0, yMax * 1.12] }}
          padding={{ left: 52, right: 24, top: 28, bottom: tiltTicks ? 76 : 48 }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              voronoiBlacklist={['perf-tbt', 'perf-script']}
              labels={({ datum }) =>
                formatPerfTooltip(datum as { tip?: PerformanceHistoryBucketPoint }, formatDayKeyShortLabel)
              }
              labelComponent={
                <VictoryTooltip
                  flyoutPadding={{ top: 10, bottom: 10, left: 14, right: 14 }}
                  cornerRadius={6}
                  flyoutStyle={{
                    fill: 'color-mix(in srgb, var(--panel2) 96%, transparent)',
                    stroke: 'var(--border)',
                  }}
                  style={{
                    fill: 'var(--text)',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    textAnchor: 'start',
                  }}
                  pointerLength={6}
                  constrainToVisibleArea
                />
              }
            />
          }
        >
          <VictoryAxis
            tickValues={dayKeys}
            tickFormat={(k) => formatDayKeyShortLabel(String(k))}
            style={{
              ...axisStyle,
              tickLabels: {
                ...axisStyle.tickLabels,
                ...(tiltTicks ? { angle: -32, textAnchor: 'end' as const, padding: 4 } : {}),
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(v) => (Number.isFinite(v) ? `${Math.round(Number(v))}` : '')}
            label="ms"
            style={{
              ...axisStyle,
              axisLabel: { padding: 38, fill: 'var(--muted)', fontSize: 11 },
            }}
          />
          <VictoryLine
            name="perf-tbt"
            interpolation="monotoneX"
            data={tbtData}
            style={{
              data: {
                stroke: 'var(--warn)',
                strokeWidth: 2.5,
              },
            }}
          />
          <VictoryLine
            name="perf-script"
            interpolation="monotoneX"
            data={scriptData}
            style={{
              data: {
                stroke: 'var(--accent2)',
                strokeWidth: 2.5,
              },
            }}
          />
          <VictoryBar
            name="perf-hit"
            data={hitData}
            style={{
              data: {
                fill: 'transparent',
                pointerEvents: 'all',
              },
            }}
          />
        </VictoryChart>
      </div>
    </div>
  )
}

export function HistoryPerformanceSection({
  historyItems,
  historyStatus,
  activeMonthFilterLabel,
}: HistoryPerformanceSectionProps) {
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

  const model = useMemo(() => {
    if (!historyItems?.length) return null
    return buildDailyPerformanceChartModel(historyItems)
  }, [historyItems])

  const body = (() => {
    if (historyStatus === 'loading') {
      return <p className="adIssueMonthlyNote">실행 기록을 불러오는 중…</p>
    }
    if (historyStatus === 'idle') {
      return <p className="adIssueMonthlyNote">실행 기록을 불러오면 성능 추이가 표시됩니다.</p>
    }
    if (historyStatus === 'error') {
      return <p className="adIssueMonthlyNote">실행 기록을 불러오지 못해 그래프를 표시할 수 없습니다.</p>
    }
    if (!historyItems?.length) {
      return <p className="adIssueMonthlyNote">저장된 실행 기록이 없어 그래프를 그릴 수 없습니다.</p>
    }
    if (!model) return null
    if (!model.hasAnyPerformanceSample || !model.dayKeys.length) {
      return (
        <p className="adIssueMonthlyNote">
          기록에 성능 지표(TBT·광고 스크립트)가 아직 없습니다. 모니터를 새 버전으로 몇 차례 실행하면 누적됩니다.
        </p>
      )
    }

    return (
      <>
        {activeMonthFilterLabel ? (
          <p className="historyMonthlyFilterHint">
            아래 그래프도 <strong>{activeMonthFilterLabel}</strong> 실행만 반영했습니다.
          </p>
        ) : null}
        <p className="adIssueMonthlyNote">
          <strong>TBT(근사)</strong>는 Long Task(50ms 초과)마다 <code>duration − 50ms</code>를 합산한 값으로, 메인 스레드
          점유를 가늠합니다. Lighthouse TBT와 측정 구간·정의가 다를 수 있습니다.{' '}
          <strong>광고 스크립트 평균(ms)</strong>은 URL 패턴으로 잡은 <code>script</code> 리소스의 Performance{' '}
          <code>duration</code> 평균(다운로드·파싱·실행에 가까운 구간)입니다.{' '}
          <strong>CLS</strong>(콘텐츠 밀림)은 이 그래프에 포함되지 않으니, 광고 슬롯{' '}
          <strong>placeholder</strong> 확보 여부는 별도로 확인하세요. 일별 점은 해당 날짜 실행들의 산술 평균이며, 기본 최근{' '}
          <strong>90일</strong>입니다.
        </p>
        <PerfLineLegend />
        <HistoryPerformanceLineChart
          title="일별 TBT(근사) · 광고 스크립트 평균(ms)"
          points={model.points}
          dayKeys={model.dayKeys}
          chartWidth={chartWidth}
          axisStyle={axisStyle}
        />
      </>
    )
  })()

  return (
    <div className="historyPerformance" ref={wrapRef}>
      <h3 className="adIssueSubTitle">메인 스레드·광고 스크립트 (히스토리)</h3>
      {body}
    </div>
  )
}
