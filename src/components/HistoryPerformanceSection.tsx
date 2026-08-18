import { useMemo } from 'react'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'
import { useChartWrapWidth } from '../hooks/useChartWrapWidth'
import { isLabeledTickIndex, pickTickStride } from './chartAxisTicks'
import type { MonitorHistoryEntry } from '../monitor/types'
import {
  buildDailyPerformanceChartModel,
  formatDayKeyShortLabel,
  type PerformanceHistoryBucketPoint,
} from '../monitor/issueSources'

/** Google/LH 계열 구간에 맞춘 TBT(근사) 참고선 — ms (차트 Y축과 동일) */
const TBT_THRESHOLD_GOOD_MAX_MS = 200
const TBT_THRESHOLD_POOR_MIN_MS = 600

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
      <span className="adIssueMonthlyLegendItem historyPerfLegendThreshold">
        <span className="historyPerfLineSwatch historyPerfLineSwatchThGood" />
        TBT 기준 0.2s (좋음)
      </span>
      <span className="adIssueMonthlyLegendItem historyPerfLegendThreshold">
        <span className="historyPerfLineSwatch historyPerfLineSwatchThPoor" />
        TBT 기준 0.6s (이상 시 Poor)
      </span>
    </div>
  )
}

function HistoryPerformanceLineChart({
  title,
  points,
  dayKeys,
  axisStyle,
}: {
  title: string
  points: PerformanceHistoryBucketPoint[]
  dayKeys: string[]
  axisStyle: {
    axis: { stroke: string }
    tickLabels: { fontSize: number; fill: string; fontFamily: string; angle?: number; textAnchor?: string }
    grid: { stroke: string }
  }
}) {
  const { wrapRef, chartWidth } = useChartWrapWidth()
  const hasData = points.length > 0
  if (!hasData || !dayKeys.length) {
    return (
      <div className="adIssueMonthlyChartBlock">
        <div className="adIssueMonthlyChartTitle">{title}</div>
        <p className="muted adIssueMonthlyEmpty">해당 기간에 성능 샘플이 없습니다.</p>
      </div>
    )
  }

  const n = dayKeys.length
  /** 일이 1일 때도 참고 가로선이 그려지도록 x를 [0,1]·중앙 0.5에 둠 */
  const xAt = (i: number) => (n === 1 ? 0.5 : i)
  const thresholdSegment = (yMs: number) =>
    n === 1
      ? [
          { x: 0, y: yMs },
          { x: 1, y: yMs },
        ]
      : [
          { x: 0, y: yMs },
          { x: n - 1, y: yMs },
        ]

  const tbtData = points.map((p, i) => ({ x: xAt(i), y: p.approxTbtMs, tip: p }))
  const scriptData = points.map((p, i) => ({ x: xAt(i), y: p.avgAdScriptResourceDurationMs, tip: p }))
  const hitData = points.map((p, i) => ({
    x: xAt(i),
    y: Math.max(p.approxTbtMs, p.avgAdScriptResourceDurationMs, 0.001),
    tip: p,
  }))

  const dataMax = Math.max(
    1,
    ...points.map((p) => Math.max(p.approxTbtMs, p.avgAdScriptResourceDurationMs)),
  )
  const yMax = Math.max(
    dataMax * 1.12,
    TBT_THRESHOLD_POOR_MIN_MS * 1.12,
    TBT_THRESHOLD_GOOD_MAX_MS * 1.15,
  )

  const chartHeight = Math.min(360, Math.max(240, 220))
  const tiltTicks = dayKeys.length > 6
  const xDomain: [number, number] = n === 1 ? [0, 1] : [0, Math.max(0, n - 1)]
  const chartPadding = { left: 58, right: 36, top: 28, bottom: tiltTicks ? 76 : 48 }
  /** 눈금선은 매일 두고 날짜 라벨만 솎아 냄 — 90일 축에서 글자가 겹치지 않게 */
  const tickStride = pickTickStride(n, chartWidth - chartPadding.left - chartPadding.right)
  const xTickValues = n === 1 ? [0.5] : dayKeys.map((_, i) => i)

  return (
    <div className="adIssueMonthlyChartBlock">
      <div className="adIssueMonthlyChartTitle">{title}</div>
      <div className="adIssueChartWrap" ref={wrapRef} role="img" aria-label={title}>
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          domainPadding={{ x: [20, 20] }}
          domain={{ x: xDomain, y: [0, yMax] }}
          padding={chartPadding}
          containerComponent={
            <VictoryVoronoiContainer
              responsive={false}
              voronoiDimension="x"
              voronoiBlacklist={['perf-tbt', 'perf-script', 'perf-threshold-good', 'perf-threshold-poor']}
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
                    fontSize: 12,
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
            tickValues={xTickValues}
            tickFormat={(v) => {
              const idx = n === 1 ? 0 : Math.round(Number(v))
              if (!isLabeledTickIndex(idx, n, tickStride)) return ''
              const key = dayKeys[idx]
              return key ? formatDayKeyShortLabel(key) : ''
            }}
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
              axisLabel: { padding: 38, fill: 'var(--muted)', fontSize: 12 },
            }}
          />
          <VictoryLine
            name="perf-threshold-good"
            data={thresholdSegment(TBT_THRESHOLD_GOOD_MAX_MS)}
            style={{
              data: {
                stroke: 'var(--ok)',
                strokeWidth: 1.75,
                strokeDasharray: '7,5',
                strokeLinecap: 'round',
              },
            }}
          />
          <VictoryLine
            name="perf-threshold-poor"
            data={thresholdSegment(TBT_THRESHOLD_POOR_MIN_MS)}
            style={{
              data: {
                stroke: '#f97316',
                strokeWidth: 1.75,
                strokeDasharray: '4,4',
                strokeLinecap: 'round',
              },
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
  const axisStyle = useMemo(
    () => ({
      axis: { stroke: 'var(--border)' },
      tickLabels: { fontSize: 13, fill: 'var(--muted)', fontFamily: 'inherit' },
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
          <strong>TBT(근사)</strong>는 Long Task(50ms 초과)마다 <code>duration − 50ms</code>를 더한 값(ms)으로, 메인 스레드
          블로킹을 대략 나타냅니다. Lighthouse TBT·필드 INP와 정의·구간이 다릅니다.
        </p>
        <p className="adIssueMonthlyNote historyPerfNoteSub">
          광고 스크립트 곡선은 <code>script</code> 리소스 <code>duration</code>{' '}
          일 평균이며, 최근 90일·해당 일 실행 산술 평균입니다.
        </p>
        <PerfLineLegend />
        <HistoryPerformanceLineChart
          title="일별 TBT(근사) · 광고 스크립트 평균(ms) — 녹색·주황 점선은 TBT(근사) 기준만 해당"
          points={model.points}
          dayKeys={model.dayKeys}
          axisStyle={axisStyle}
        />
      </>
    )
  })()

  return (
    <div className="historyPerformance">
      <h3 className="adIssueSubTitle">메인 스레드·광고 스크립트 (히스토리)</h3>
      {body}
    </div>
  )
}
