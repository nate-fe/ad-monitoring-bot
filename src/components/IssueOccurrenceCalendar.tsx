import { useEffect, useState, type CSSProperties } from 'react'
import { useInView, usePrefersReducedMotion } from '../hooks/useInView'
import type { OccurrenceCalendarModel } from '../monitor/issueOccurrenceAnalysis'
import { formatOccurrenceDateLabel } from '../monitor/issueOccurrenceAnalysis'

type IssueOccurrenceCalendarProps = {
  model: OccurrenceCalendarModel | null
}

function formatDayAriaLabel(day: number, inspectionCount: number, detectionRunCount: number) {
  if (inspectionCount <= 0) return `${day}일, 검사 없음`
  return `${day}일, 검사 ${inspectionCount}회 중 감지된 검사 ${detectionRunCount}회`
}

export function IssueOccurrenceCalendar({ model }: IssueOccurrenceCalendarProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const { ref: mediaListRef, hasEntered: mediaListEntered } = useInView<HTMLUListElement>({
    resetKey: selectedDateKey,
  })
  const animateMediaBars = mediaListEntered && !prefersReducedMotion

  useEffect(() => {
    setTimeout(() => {
      setSelectedDateKey(null)
    }, 0)
  }, [model?.monthKey])

  const selectedDay = selectedDateKey && model ? model.dayByDateKey[selectedDateKey] : null

  if (!model) return null

  const hasAnyActivity = model.monthInspectionTotal > 0

  return (
    <div className="issueOccurrenceCalendarInner">
      <div className="issueOccurrenceCalendarHead">
        <p className="issueOccurrenceCalendarSummary">
          {model.monthLabel} — 검사 <strong>{model.monthInspectionTotal}회</strong> · 감지된 검사{' '}
          <strong>{model.monthDetectionRunTotal}회</strong>
        </p>
      </div>

      {!hasAnyActivity ? (
        <p className="muted issueOccurrenceCalendarEmpty">이 달에 저장된 모니터 실행 기록이 없습니다.</p>
      ) : (
        <>
          <div className="issueOccurrenceCalendarLegend" aria-hidden="true">
            <span className="issueOccurrenceCalendarLegendItem">
              <span className="issueOccurrenceCalendarSwatch issueOccurrenceCalendarSwatchInspection" />
              검사 있음
            </span>
            <span className="issueOccurrenceCalendarLegendItem">
              <span className="issueOccurrenceCalendarSwatch issueOccurrenceCalendarSwatchDetection" />
              감지 있음
            </span>
          </div>

          <div className="issueOccurrenceCalendarGrid" role="grid" aria-label={`${model.monthLabel} 일별 검사·감지`}>
            <div className="issueOccurrenceCalendarWeekdays" role="row">
              {model.weekDayLabels.map((label) => (
                <div key={label} className="issueOccurrenceCalendarWeekday" role="columnheader">
                  {label}
                </div>
              ))}
            </div>

            {model.weeks.map((week, weekIdx) => (
              <div key={`week-${weekIdx}`} className="issueOccurrenceCalendarWeek" role="row">
                {week.map((cell, cellIdx) => {
                  if (!cell.inMonth) {
                    return (
                      <div
                        key={`pad-${weekIdx}-${cellIdx}`}
                        className="issueOccurrenceCalendarCell issueOccurrenceCalendarCellPad"
                        role="gridcell"
                        aria-hidden="true"
                      />
                    )
                  }

                  const hasInspection = cell.inspectionCount > 0
                  const hasDetection = cell.detectionRunCount > 0
                  const isSelected = selectedDateKey === cell.dateKey
                  const cellClass = [
                    'issueOccurrenceCalendarCell',
                    hasInspection ? 'issueOccurrenceCalendarCellHasInspection' : '',
                    hasDetection ? 'issueOccurrenceCalendarCellHasDetection' : '',
                    isSelected ? 'issueOccurrenceCalendarCellSelected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      className={cellClass}
                      role="gridcell"
                      aria-label={formatDayAriaLabel(cell.day, cell.inspectionCount, cell.detectionRunCount)}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                    >
                      <span className="issueOccurrenceCalendarDayNum">{cell.day}</span>
                      {hasInspection ? (
                        <span className="issueOccurrenceCalendarStats">
                          <span className="issueOccurrenceCalendarDetections">{cell.detectionRunCount}</span>
                          <span className="issueOccurrenceCalendarStatsSep">/</span>
                          <span className="issueOccurrenceCalendarInspections">{cell.inspectionCount}</span>
                        </span>
                      ) : (
                        <span className="issueOccurrenceCalendarStatsMuted">—</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {selectedDay ? (
            <div className="issueOccurrenceCalendarDayDetail" aria-live="polite">
              <div className="issueOccurrenceCalendarDayDetailHead">
                <h4 className="issueOccurrenceCalendarDayDetailTitle">
                  {formatOccurrenceDateLabel(`${selectedDay.dateKey}T12:00:00`)}
                </h4>
                <p className="issueOccurrenceCalendarDayDetailSummary">
                  검사 <strong>{selectedDay.inspectionCount}회</strong> · 감지된 검사{' '}
                  <strong>{selectedDay.detectionRunCount}회</strong>
                </p>
              </div>

              {selectedDay.inspectionCount <= 0 ? (
                <p className="muted issueOccurrenceCalendarDayDetailEmpty">이 날짜에 모니터 검사 기록이 없습니다.</p>
              ) : selectedDay.mediaBreakdown.length ? (
                <ul
                  ref={mediaListRef}
                  className={[
                    'issueOccurrenceCalendarMediaList',
                    animateMediaBars ? 'issueOccurrenceCalendarMediaListAnimated' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {selectedDay.mediaBreakdown.map((media, index) => {
                    const barWidth =
                      selectedDay.inspectionCount > 0
                        ? Math.min(100, (media.detectionRunCount / selectedDay.inspectionCount) * 100)
                        : 0

                    return (
                      <li key={media.key} className="issueOccurrenceCalendarMediaRow">
                        <div className="issueOccurrenceCalendarMediaRowMain">
                          <span className="issueOccurrenceCalendarMediaLabel">{media.label}</span>
                          <div
                            className="issueOccurrenceCalendarMediaBar"
                            role="img"
                            aria-label={`${media.label} 감지된 검사 ${media.detectionRunCount}회, 검사 ${selectedDay.inspectionCount}회`}
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
                          <strong>{media.detectionRunCount}</strong>
                          <span className="issueOccurrenceCalendarStatsSep">/</span>
                          {selectedDay.inspectionCount}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="muted issueOccurrenceCalendarDayDetailEmpty">
                  검사는 있었지만 URL이 잡힌 매체별 감지는 없습니다.
                </p>
              )}
            </div>
          ) : ''}
        </>
      )}
    </div>
  )
}
