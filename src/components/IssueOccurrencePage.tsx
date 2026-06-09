import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MonitorHistoryEntry, MonitorReport } from '../monitor/types'
import { fetchJsonFromPaths } from '../monitor/fetchJsonFromPaths'
import { listMonthsWithMonitorActivity } from '../monitor/issueOccurrenceAnalysis'
import { ISSUE_OCCURRENCE_LOG_HELP_TEXT } from './issueOccurrenceLogHelp'
import { IssueOccurrenceLog } from './IssueOccurrenceLog'
import { InlineHelpTooltip } from './InlineHelpTooltip'
import { RefreshIcon } from './RefreshIcon'

type LoadState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; report: MonitorReport }

type HistoryState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; items: MonitorHistoryEntry[] }

type IssueOccurrencePageProps = {
  reportPaths?: string[]
  historyPaths?: string[]
  targetLabel: string
}

function formatMonthLabel(monthKey: string) {
  const d = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return monthKey
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}

export function IssueOccurrencePage({
  reportPaths = ['monitor-report.json'],
  historyPaths = ['history.json'],
  targetLabel,
}: IssueOccurrencePageProps) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const [history, setHistory] = useState<HistoryState>({ kind: 'idle' })
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const data = (await fetchJsonFromPaths<unknown>(reportPaths)) as unknown
      const report = data as MonitorReport
      if (
        typeof report !== 'object' ||
        report == null ||
        typeof report.ok !== 'boolean' ||
        typeof report.url !== 'string' ||
        typeof report.checkedAt !== 'string'
      ) {
        throw new Error('리포트 형식이 예상과 다릅니다.')
      }
      setState({ kind: 'loaded', report })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }, [reportPaths])

  const loadHistory = useCallback(async () => {
    setHistory({ kind: 'loading' })
    try {
      const data = (await fetchJsonFromPaths<unknown>(historyPaths)) as unknown
      if (!Array.isArray(data)) throw new Error('히스토리 형식이 예상과 다릅니다.')
      setHistory({ kind: 'loaded', items: data as MonitorHistoryEntry[] })
    } catch (e) {
      setHistory({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }, [historyPaths])

  const loadAll = useCallback(async () => {
    await Promise.all([loadReport(), loadHistory()])
  }, [loadReport, loadHistory])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const historyItems = useMemo(
    () => (history.kind === 'loaded' ? history.items : []),
    [history],
  )
  const currentReport = state.kind === 'loaded' ? state.report : null

  const monthOptions = useMemo(
    () => listMonthsWithMonitorActivity(historyItems, currentReport),
    [historyItems, currentReport],
  )

  useEffect(() => {
    if (!monthOptions.length) {
      setSelectedMonth(null)
      return
    }
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0])
    }
  }, [monthOptions, selectedMonth])

  const isLoading = state.kind === 'loading' || history.kind === 'loading'
  const selectedMonthLabel = selectedMonth ? formatMonthLabel(selectedMonth) : null

  return (
    <section className="panel issueOccurrencePage">
      <div className="panelHeader">
        <div className="panelHeaderText">
          <div className="panelTitle adIssueSectionTitleWithHelp">
            <span>발생 일시 기록</span>
            <InlineHelpTooltip text={ISSUE_OCCURRENCE_LOG_HELP_TEXT} />
          </div>
          <p className="panelHeaderSub">
            {targetLabel} — 1단 일별 달력과 2단 매체별 분석을 확인합니다.
          </p>
        </div>
        <div className="panelActions">
          <button
            type="button"
            className="refreshIconButton"
            onClick={() => void loadAll()}
            disabled={isLoading}
            aria-label="새로고침"
            title="새로고침"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="panelBody">
        {history.kind === 'loaded' && monthOptions.length ? (
          <div className="historyMonthBar issueOccurrenceMonthBar">
            <label className="historyMonthLabel" htmlFor="occurrence-month-filter">
              분석 월
            </label>
            <select
              id="occurrence-month-filter"
              className="historyMonthSelect"
              value={selectedMonth ?? monthOptions[0]}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="발생 일시 분석 월"
            >
              {monthOptions.map((mk) => (
                <option key={mk} value={mk}>
                  {formatMonthLabel(mk)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {state.kind === 'error' ? (
          <div className="failBox issueOccurrenceReportError">
            <div className="failTitle">최신 리포트를 불러오지 못했습니다</div>
            <p className="muted">{state.message}</p>
            <p className="muted">실행 기록만으로 분석합니다. 이번 실행 샘플은 포함되지 않을 수 있습니다.</p>
          </div>
        ) : null}

        <IssueOccurrenceLog
          historyItems={historyItems}
          historyStatus={history.kind}
          currentReport={currentReport}
          monthKey={selectedMonth}
          monthLabel={selectedMonthLabel}
        />
      </div>
    </section>
  )
}
