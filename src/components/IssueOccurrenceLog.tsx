import { useMemo } from 'react'
import type { MonitorHistoryEntry, MonitorReport } from '../monitor/types'
import {
  buildMediaOccurrenceAnalysis,
  buildOccurrenceCalendarModel,
  buildUrlRecommendationParts,
  type MediaUrlOccurrence,
} from '../monitor/issueOccurrenceAnalysis'
import type { HistoryLoadKind } from './HistoryPerformanceSection'
import { IssueOccurrenceCalendar } from './IssueOccurrenceCalendar'
import { IssueOccurrenceMediaBarChart } from './IssueOccurrenceMediaBarChart'
import { UrlOccurrenceMessagesTooltip } from './UrlOccurrenceMessagesTooltip'

type IssueOccurrenceLogProps = {
  historyItems?: MonitorHistoryEntry[]
  historyStatus: HistoryLoadKind
  currentReport?: MonitorReport | null
  monthKey: string | null
  monthLabel?: string | null
}

function PatternBadge({ pattern }: { pattern: MediaUrlOccurrence['pattern'] }) {
  if (pattern === 'new') {
    return <span className="issueOccurrencePatternBadge issueOccurrencePatternNew">신규 감지</span>
  }
  return <span className="issueOccurrencePatternBadge issueOccurrencePatternRecurring">반복</span>
}

export function IssueOccurrenceLog({
  historyItems,
  historyStatus,
  currentReport = null,
  monthKey,
  monthLabel,
}: IssueOccurrenceLogProps) {
  const items = useMemo(() => historyItems ?? [], [historyItems])

  const calendarModel = useMemo(() => {
    if (!monthKey) return null
    return buildOccurrenceCalendarModel(monthKey, items, currentReport ?? null)
  }, [items, currentReport, monthKey])

  const analysis = useMemo(() => {
    if (!monthKey) return null
    return buildMediaOccurrenceAnalysis(monthKey, items, currentReport ?? null)
  }, [items, currentReport, monthKey])

  if (historyStatus === 'loading') {
    return <p className="muted issueOccurrenceEmpty">실행 기록을 불러오는 중…</p>
  }
  if (historyStatus === 'error') {
    return <p className="muted issueOccurrenceEmpty">실행 기록을 불러오지 못해 발생 일시를 표시할 수 없습니다.</p>
  }
  if (!monthKey) {
    return <p className="muted issueOccurrenceEmpty">분석할 월을 선택해 주세요.</p>
  }

  return (
    <div className="issueOccurrenceLog">
      <section className="issueOccurrenceTier issueOccurrenceTierCalendar">
        <div className="issueOccurrenceTierHead">
          <h3 className="issueOccurrenceTierTitle">1. 일별 현황</h3>
          <p className="issueOccurrenceTierDesc">
            달력에서 날짜별 <strong>감지된 검사 / 검사 횟수</strong>를 보고, 날짜를 누르면 그날 매체별 내역을
            확인합니다.
          </p>
        </div>
        <IssueOccurrenceCalendar model={calendarModel} />
      </section>

      <section className="issueOccurrenceTier issueOccurrenceTierMedia">
        <div className="issueOccurrenceTierHead">
          <h3 className="issueOccurrenceTierTitle">2. 매체별 분석</h3>
          <p className="issueOccurrenceTierDesc">
            한 달 기준 매체별 <strong>감지된 검사 / 검사 횟수</strong>와 URL별 발생 데이터입니다.
          </p>
        </div>

        {calendarModel ? (
          <div className="issueOccurrenceMonthMediaBlock">
            <h4 className="issueOccurrenceSubsectionTitle">월 합계</h4>
            <IssueOccurrenceMediaBarChart model={calendarModel} />
          </div>
        ) : null}

        {analysis ? (
          <div className="issueOccurrenceCoopBlock">
            <h4 className="issueOccurrenceSubsectionTitle">URL 상세 데이터</h4>
            <p className="issueOccurrenceCoopIntro muted">
              URL 감지 샘플 <strong>{analysis.totalCount}건</strong> 기준 (
              {analysis.mediaSummary.map((m) => `${m.label} ${m.count}건`).join(', ')})
            </p>

            <div className="issueOccurrenceMediaList">
              {analysis.mediaGroups.map((group) => (
                <details className="issueOccurrenceMediaCard" key={group.key} open>
                  <summary className="issueOccurrenceMediaSummary">
                    <span className="issueOccurrenceMediaTitle">
                      {group.label} <span className="issueOccurrenceMediaCount">{group.monthCount}건</span>
                    </span>
                  </summary>

                  <div className="issueOccurrenceMediaBody">
                    <div className="issueOccurrenceUrlList">
                      {group.urls.map((urlItem) => {
                        const { url, suffix } = buildUrlRecommendationParts(urlItem)
                        const cardKey = urlItem.isGrouped
                          ? `${url}::${urlItem.memberUrls?.join('|')}`
                          : url
                        return (
                          <div className="issueOccurrenceUrlCard" key={cardKey}>
                            <PatternBadge pattern={urlItem.pattern} />
                            <p className="issueOccurrenceUrlSummary">
                              <strong className="issueOccurrenceUrlText">{url}</strong>
                              {suffix}
                            </p>
                            <UrlOccurrenceMessagesTooltip
                              url={urlItem.url}
                              errorSampleCount={urlItem.errorSampleCount}
                              warningSampleCount={urlItem.warningSampleCount}
                              pageErrorSampleCount={urlItem.pageErrorSampleCount}
                              errorMessages={urlItem.errorMessages}
                              warningMessages={urlItem.warningMessages}
                              pageErrorMessages={urlItem.pageErrorMessages}
                            >
                              <span className="issueOccurrenceUrlMeta">
                                이번 달 {urlItem.monthCount}회
                                {urlItem.priorCount > 0 ? ` · 이전 ${urlItem.priorCount}회` : ''}
                              </span>
                            </UrlOccurrenceMessagesTooltip>
                            {urlItem.isGrouped && urlItem.memberUrls?.length ? (
                              <details className="issueOccurrenceMemberUrls">
                                <summary>원본 URL 목록</summary>
                                <ul>
                                  {urlItem.memberUrls.map((memberUrl) => (
                                    <li key={memberUrl}>
                                      <code>{memberUrl}</code>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted issueOccurrenceEmpty issueOccurrenceNoUrlSamples">
            {monthLabel
              ? `${monthLabel}에는 URL이 잡힌 분석 데이터가 없습니다. 위 월 합계와 달력만 확인할 수 있습니다.`
              : '선택한 월에 URL이 잡힌 분석 데이터가 없습니다.'}
          </p>
        )}
      </section>
    </div>
  )
}
