import { useMemo, type CSSProperties } from 'react'
import { useInView, usePrefersReducedMotion } from '../hooks/useInView'
import type { OccurrenceCalendarModel } from '../monitor/issueOccurrenceAnalysis'

type IssueOccurrenceMediaBarChartProps = {
  model: OccurrenceCalendarModel
}

export function IssueOccurrenceMediaBarChart({ model }: IssueOccurrenceMediaBarChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { ref: mediaListRef, hasEntered: mediaListEntered } = useInView<HTMLUListElement>({
    resetKey: model.monthKey,
  })
  const animateMediaBars = mediaListEntered && !prefersReducedMotion

  const { monthMediaBreakdown, monthInspectionTotal } = model

  const chartData = useMemo(
    () =>
      monthMediaBreakdown.map((media) => ({
        label: media.label,
        detectionRunCount: media.detectionRunCount,
      })),
    [monthMediaBreakdown],
  )

  if (!chartData.length) {
    return (
      <p className="muted issueOccurrenceMonthMediaEmpty">
        이 달에 URL이 잡힌 매체별 감지는 없습니다. 검사 {monthInspectionTotal}회만 기록되어 있습니다.
      </p>
    )
  }

  return (
    <div className="issueOccurrenceMediaChartRoot">
      <div className="issueOccurrenceMediaChartLegend" aria-hidden="true">
        <span className="issueOccurrenceMediaChartLegendItem">
          <span className="issueOccurrenceMediaChartSwatch issueOccurrenceMediaChartSwatchDetect" />
          감지된 검사
        </span>
        <span className="issueOccurrenceMediaChartLegendItem">
          <span className="issueOccurrenceMediaChartSwatch issueOccurrenceMediaChartSwatchTotal" />
          검사 횟수 ({monthInspectionTotal}회)
        </span>
      </div>

      <ul
        ref={mediaListRef}
        className={[
          'issueOccurrenceCalendarMediaList',
          'issueOccurrenceMonthMediaBarList',
          animateMediaBars ? 'issueOccurrenceCalendarMediaListAnimated' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {chartData.map((row, index) => {
          const barWidth =
            monthInspectionTotal > 0
              ? Math.min(100, (row.detectionRunCount / monthInspectionTotal) * 100)
              : 0

          return (
            <li key={row.label} className="issueOccurrenceCalendarMediaRow">
              <div className="issueOccurrenceCalendarMediaRowMain">
                <span className="issueOccurrenceCalendarMediaLabel">{row.label}</span>
                <div
                  className="issueOccurrenceCalendarMediaBar"
                  role="img"
                  aria-label={`${row.label} 감지된 검사 ${row.detectionRunCount}회, 검사 ${monthInspectionTotal}회`}
                >
                  <div
                    className="issueOccurrenceCalendarMediaBarFill"
                    style={
                      {
                        '--bar-fill-pct': `${barWidth}%`,
                        '--bar-fill-delay': `${index * 70}ms`,
                        ...(prefersReducedMotion ? { width: `${barWidth}%` } : {}),
                      } as CSSProperties
                    }
                  />
                </div>
              </div>
              <span className="issueOccurrenceCalendarMediaStats">
                <strong>{row.detectionRunCount}</strong>
                <span className="issueOccurrenceCalendarStatsSep">/</span>
                {monthInspectionTotal}
              </span>
            </li>
          )
        })}
      </ul>

      <ul className="srOnly">
        {chartData.map((row) => (
          <li key={row.label}>
            {row.label}: 감지된 검사 {row.detectionRunCount}회 / 검사 {monthInspectionTotal}회
          </li>
        ))}
      </ul>
    </div>
  )
}
