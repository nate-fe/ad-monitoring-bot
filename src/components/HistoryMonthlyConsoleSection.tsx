import { useMemo } from 'react'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryStack,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory'
import { useChartWrapWidth } from '../hooks/useChartWrapWidth'
import { isLabeledTickIndex, pickTickStride } from './chartAxisTicks'
import type { MonitorHistoryEntry } from '../monitor/types'
import {
  buildDailyConsoleAdChartModel,
  buildMonthlyConsoleAdChartModel,
  formatDayKeyShortLabel,
  formatMonthKeyShortLabel,
  type ConsoleHistoryBucketPoint,
} from '../monitor/issueSources'

export type HistoryLoadKind = 'idle' | 'loading' | 'error' | 'loaded'

type HistoryMonthlyConsoleSectionProps = {
  historyItems?: MonitorHistoryEntry[]
  historyStatus: HistoryLoadKind
  /** 월 필터가 '전체'가 아닐 때 표시할 월 라벨 */
  activeMonthFilterLabel?: string | null
}

function formatConsoleHistoryTooltip(
  datum: { tip?: ConsoleHistoryBucketPoint } | undefined,
  formatBucketLabel: (k: string) => string,
): string {
  const p = datum?.tip
  if (!p) return ''
  const head = `${formatBucketLabel(p.x)}\n오류 ${p.errors}건 · 경고 ${p.warnings}건`
  if (!p.byAd.length) return head
  const body = p.byAd
    .filter((a) => a.errors + a.warnings > 0)
    .map((a) => `· ${a.label}: 오류 ${a.errors}, 경고 ${a.warnings}`)
    .join('\n')
  return `${head}\n—\n${body}`
}

function ErrorWarnLegend() {
  return (
    <div className="adIssueMonthlyLegend" aria-hidden="true">
      <span className="adIssueMonthlyLegendItem">
        <span className="adIssueMonthlySwatch adIssueBreakdownSwatchError" />
        오류
      </span>
      <span className="adIssueMonthlyLegendItem">
        <span className="adIssueMonthlySwatch adIssueBreakdownSwatchWarn" />
        경고
      </span>
    </div>
  )
}

function ConsoleHistoryErrorWarnChart({
  title,
  points,
  bucketKeys,
  formatBucketLabel,
  axisStyle,
}: {
  title: string
  points: ConsoleHistoryBucketPoint[]
  bucketKeys: string[]
  formatBucketLabel: (key: string) => string
  axisStyle: {
    axis: { stroke: string }
    tickLabels: { fontSize: number; fill: string; fontFamily: string; angle?: number; textAnchor?: string }
    grid: { stroke: string }
  }
}) {
  const { wrapRef, chartWidth } = useChartWrapWidth()
  const hasData = points.some((p) => p.errors > 0 || p.warnings > 0)
  if (!hasData || !bucketKeys.length) {
    return (
      <div className="adIssueMonthlyChartBlock">
        <div className="adIssueMonthlyChartTitle">{title}</div>
        <p className="muted adIssueMonthlyEmpty">해당 기간 샘플에 집계할 항목이 없습니다.</p>
      </div>
    )
  }

  const errorData = points.map((p) => ({ x: p.x, y: p.errors, tip: p }))
  const warnData = points.map((p) => ({ x: p.x, y: p.warnings, tip: p }))
  /** 스택은 동일 x·동일 voronoi Y로 두 점이 잡혀 툴팁 문구가 두 번 붙음 → 히트용 막대만 Voronoi에 넣음 */
  const hitData = points.map((p) => {
    const sum = p.errors + p.warnings
    return { x: p.x, y: sum > 0 ? sum : 0.001, tip: p }
  })

  const yMax = Math.max(
    1,
    ...points.map((p) => p.errors + p.warnings),
  )

  const chartHeight = Math.min(400, Math.max(260, 240))
  const tiltTicks = bucketKeys.length > 6
  const bucketCount = bucketKeys.length
  const xDomainPadding: [number, number] =
    bucketCount <= 1 ? [72, 72] : bucketCount <= 3 ? [36, 36] : [24, 24]
  const barWidth = bucketCount <= 1 ? 56 : bucketCount <= 3 ? 40 : undefined
  const chartPadding = { left: 68, right: 40, top: 28, bottom: tiltTicks ? 76 : 48 }
  /** 카테고리(문자열) 축이라 눈금 자체는 두고 라벨만 솎아 낸다 — tickValues를 줄이면 막대 위치가 어긋남 */
  const tickStride = pickTickStride(bucketCount, chartWidth - chartPadding.left - chartPadding.right)

  return (
    <div className="adIssueMonthlyChartBlock">
      <div className="adIssueMonthlyChartTitle">{title}</div>
      <div className="adIssueChartWrap" ref={wrapRef} role="img" aria-label={title}>
        <VictoryChart
          width={chartWidth}
          height={chartHeight}
          domainPadding={{ x: xDomainPadding }}
          domain={{ y: [0, yMax * 1.08] }}
          padding={chartPadding}
          containerComponent={
            <VictoryVoronoiContainer
              responsive={false}
              voronoiDimension="x"
              voronoiBlacklist={['console-hist-errors', 'console-hist-warns']}
              labels={({ datum }) =>
                formatConsoleHistoryTooltip(
                  datum as { tip?: ConsoleHistoryBucketPoint },
                  formatBucketLabel,
                )
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
            tickValues={bucketKeys}
            tickFormat={(k, index) =>
              isLabeledTickIndex(index, bucketCount, tickStride) ? formatBucketLabel(String(k)) : ''
            }
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
            tickFormat={(v) => (Number.isInteger(v) ? `${v}` : '')}
            style={{
              ...axisStyle,
              tickLabels: { ...axisStyle.tickLabels, padding: 6 },
            }}
          />
          <VictoryStack>
            <VictoryBar
              name="console-hist-errors"
              data={errorData}
              style={{
                data: {
                  fill: 'var(--fail)',
                  ...(barWidth != null ? { width: barWidth } : {}),
                },
              }}
            />
            <VictoryBar
              name="console-hist-warns"
              data={warnData}
              style={{
                data: {
                  fill: 'var(--warn)',
                  ...(barWidth != null ? { width: barWidth } : {}),
                },
              }}
            />
          </VictoryStack>
          <VictoryBar
            name="console-hist-hit"
            data={hitData}
            style={{
              data: {
                fill: 'transparent',
                pointerEvents: 'all',
                ...(barWidth != null ? { width: barWidth } : {}),
              },
            }}
          />
        </VictoryChart>
      </div>
    </div>
  )
}

export function HistoryMonthlyConsoleSection({
  historyItems,
  historyStatus,
  activeMonthFilterLabel,
}: HistoryMonthlyConsoleSectionProps) {
  const axisStyle = useMemo(
    () => ({
      axis: { stroke: 'var(--border)' },
      tickLabels: { fontSize: 13, fill: 'var(--muted)', fontFamily: 'inherit' },
      grid: { stroke: 'rgba(255, 255, 255, 0.08)' },
    }),
    [],
  )

  const dailyModel = useMemo(() => {
    if (!historyItems?.length) return null
    return buildDailyConsoleAdChartModel(historyItems)
  }, [historyItems])

  const monthlyModel = useMemo(() => {
    if (!historyItems?.length) return null
    return buildMonthlyConsoleAdChartModel(historyItems)
  }, [historyItems])

  const hasAnySample =
    Boolean(dailyModel?.hasAnyConsoleSample) || Boolean(monthlyModel?.hasAnyConsoleSample)

  const body = (() => {
    if (historyStatus === 'loading') {
      return <p className="muted">실행 기록을 불러오는 중…</p>
    }
    if (historyStatus === 'idle') {
      return <p className="muted">실행 기록을 불러오면 일별·월별 그래프가 표시됩니다.</p>
    }
    if (historyStatus === 'error') {
      return <p className="muted">실행 기록을 불러오지 못해 그래프를 표시할 수 없습니다.</p>
    }
    if (!historyItems?.length) {
      return <p className="muted">저장된 실행 기록이 없어 그래프를 그릴 수 없습니다.</p>
    }
    if (!dailyModel || !monthlyModel) {
      return null
    }
    if (!hasAnySample || (!dailyModel.dayKeys.length && !monthlyModel.monthKeys.length)) {
      return (
        <p className="muted">
          기록에 콘솔 오류·경고 샘플이 없거나, 유효한 실행 시각이 없어 그래프를 그릴 수 없습니다.
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
          막대는 <strong>오류·경고 샘플 건수</strong>만 표시합니다. 막대에 마우스를 올리면 해당 일·월에 어떤{' '}
          <strong>광고·영역 규칙</strong>으로 잡혔는지(오류/경고 각각) 나옵니다. 일별 축은 기본{' '}
          <strong>최근 90일</strong>입니다. 헤드리스 네트워크 샘플은 포함하지 않으며, 저장된 샘플 기준이라 전체
          발생 건수와는 다를 수 있습니다.
        </p>
        <ErrorWarnLegend />
        {dailyModel.dayKeys.length && dailyModel.points.length ? (
          <ConsoleHistoryErrorWarnChart
            title="일별 콘솔 오류·경고"
            points={dailyModel.points}
            bucketKeys={dailyModel.dayKeys}
            formatBucketLabel={formatDayKeyShortLabel}
            axisStyle={axisStyle}
          />
        ) : null}
        {monthlyModel.monthKeys.length && monthlyModel.points.length ? (
          <ConsoleHistoryErrorWarnChart
            title="월별 콘솔 오류·경고"
            points={monthlyModel.points}
            bucketKeys={monthlyModel.monthKeys}
            formatBucketLabel={formatMonthKeyShortLabel}
            axisStyle={axisStyle}
          />
        ) : null}
      </>
    )
  })()

  return (
    <div className="historyMonthlyConsole">
      <h3 className="adIssueSubTitle">일별·월별 콘솔 오류·경고 (히스토리)</h3>
      {body}
    </div>
  )
}
