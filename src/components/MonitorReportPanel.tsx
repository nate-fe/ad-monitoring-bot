import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MonitorHistoryEntry, MonitorReport } from '../monitor/types'

type LoadState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; report: MonitorReport }

type HistoryState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; items: MonitorHistoryEntry[] }

type MonitorReportPanelProps = {
  reportPaths?: string[]
  historyPaths?: string[]
}

type ClassifiedIssue = {
  key: string
  label: string
  count: number
}

type IssueUrlPreviewProps = {
  url: string
}

type ConsoleLikeMessage = {
  type: string
  text: string
  url?: string
  sourceUrl?: string
  line?: number
  column?: number
}

const REQUEST_FAILURE_HELP_TEXT =
  '페이지 로드 중 완료되지 못한 네트워크 요청입니다. 광고 스크립트나 광고 API 문제를 추적할 때 참고용으로 확인합니다.'

type IssueSourceCandidate =
  | string
  | {
      text?: string
      url?: string
    }

const ISSUE_SOURCE_RULES = [
  { key: 'adsense', label: 'Google AdSense', patterns: ['googlesyndication', 'pagead2', 'show_ads.js', 'adsbygoogle'] },
  { key: 'gam', label: 'Google Ad Manager', patterns: ['googletag', 'doubleclick', 'pubads'] },
  { key: 'dable', label: 'Dable', patterns: ['api.dable.io', 'dablewidget', 'dable'] },
  { key: 'widerplanet', label: 'WiderPlanet', patterns: ['widerplanet'] },
  { key: 'mobwith', label: 'Mobwith', patterns: ['mobwith', 'nateimp.mobwith.co.kr'] },
  { key: 'criteo', label: 'Criteo', patterns: ['criteo'] },
  { key: 'nate', label: 'Nate 내부', patterns: ['news.nate.com', 'm.news.nate.com', 'nate.com'] },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function formatDateKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(dateKey: string) {
  const d = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateKey
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatTimeOnly(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function fetchJsonFromPaths<T>(paths: string[]) {
  let lastError = '리포트를 불러오지 못했습니다.'

  for (const path of paths) {
    try {
      const cacheBust = Date.now()
      const url = `${import.meta.env.BASE_URL}${path}?ts=${cacheBust}`
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) {
        lastError = `${path} 불러오기 실패 (HTTP ${res.status})`
        continue
      }
      return (await res.json()) as T
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  throw new Error(lastError)
}

function shouldHideConsoleWarning(text: string) {
  return text.includes('automatically upgraded to HTTPS')
}

function classifyIssueText(candidate: IssueSourceCandidate) {
  const lower =
    typeof candidate === 'string'
      ? candidate.toLowerCase()
      : `${candidate.url ?? ''} ${candidate.text ?? ''}`.toLowerCase()
  for (const rule of ISSUE_SOURCE_RULES) {
    if (rule.patterns.some((pattern) => lower.includes(pattern.toLowerCase()))) {
      return { key: rule.key, label: rule.label }
    }
  }
  return { key: 'other', label: '기타/미분류' }
}

function buildClassifiedIssues(items: IssueSourceCandidate[]): ClassifiedIssue[] {
  const bucket = new Map<string, ClassifiedIssue>()

  for (const item of items) {
    const matched = classifyIssueText(item)
    const prev = bucket.get(matched.key)
    if (prev) {
      prev.count += 1
    } else {
      bucket.set(matched.key, { ...matched, count: 1 })
    }
  }

  return Array.from(bucket.values()).sort((a, b) => b.count - a.count)
}

function getFailureBuckets(failures: string[] | undefined) {
  const items = failures ?? []
  let actionableCount = 0
  let collectionFailureCount = 0

  for (const failure of items) {
    if (
      failure.startsWith('Console errors:') ||
      failure.startsWith('Console warnings:') ||
      failure.startsWith('JS page errors:') ||
      failure.startsWith('Request failures:') ||
      failure.startsWith('HTTP status not OK:')
    ) {
      actionableCount += 1
    } else {
      collectionFailureCount += 1
    }
  }

  return { actionableCount, collectionFailureCount }
}

function classifyCurrentReportErrors(report: MonitorReport): ClassifiedIssue[] {
  const items: IssueSourceCandidate[] = []

  if ((report.failures ?? []).some((f) => f.startsWith('Console errors:'))) {
    items.push(
      ...((report.diagnostics?.consoleMessages ?? [])
        .filter((m) => m.type === 'error')
        .map((m) => ({ text: m.text, url: m.url })) ?? []),
    )
  }
  if ((report.failures ?? []).some((f) => f.startsWith('JS page errors:'))) {
    items.push(...(report.diagnostics?.pageErrors?.map((e) => e.message) ?? []))
  }
  if ((report.failures ?? []).some((f) => f.startsWith('Request failures:'))) {
    items.push(...(report.diagnostics?.requestFailures?.map((r) => ({ url: r.url })) ?? []))
  }

  return buildClassifiedIssues(items)
}

function classifyCurrentReportAll(report: MonitorReport): ClassifiedIssue[] {
  const items = (report.diagnostics?.consoleMessages ?? [])
    .filter((m) => m.type === 'warning')
    .map((m) => ({ text: m.text, url: m.url }))
  return buildClassifiedIssues(items)
}

function classifyHistoryEntry(entry: MonitorHistoryEntry): ClassifiedIssue[] {
  const items = [
    ...(entry.consoleErrorSample?.map((m) => ({ text: m.text, url: m.url })) ?? []),
    ...(entry.consoleWarningSample?.map((m) => ({ text: m.text, url: m.url })) ?? []),
  ]
  return buildClassifiedIssues(items)
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M16.85 10a6.85 6.85 0 1 1-2.007-4.844"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M13.6 2.95h3.45V6.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function IssueUrlPreview({ url }: IssueUrlPreviewProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timeoutId = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="diagUrlWrap">
      <button type="button" className="diagUrlTrigger" aria-label={`원인 URL 보기: ${url}`}>
        {url}
      </button>
      <div className="diagUrlTooltip" role="tooltip">
        <div className="diagUrlTooltipText">{url}</div>
        {copied ? (
          <span className="diagUrlCopied" aria-live="polite">
            복사됨
          </span>
        ) : (
          <button type="button" className="diagUrlCopyButton" onClick={handleCopy}>
            복사
          </button>
        )}
      </div>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="10" cy="5.6" r="1" fill="currentColor" />
    </svg>
  )
}

function InlineHelpTooltip({ text }: { text: string }) {
  return (
    <span className="inlineHelpWrap">
      <button type="button" className="inlineHelpButton" aria-label={text}>
        <InfoIcon />
      </button>
      <span className="inlineHelpTooltip" role="tooltip">
        {text}
      </span>
    </span>
  )
}

function RequestFailureTitle({ suffix = '' }: { suffix?: string }) {
  return (
    <span className="requestFailureTitle">
      요청 실패 내용{suffix}
      <InlineHelpTooltip text={REQUEST_FAILURE_HELP_TEXT} />
    </span>
  )
}

function SourceLocationMeta({
  sourceUrl,
  line,
  column,
}: {
  sourceUrl?: string
  line?: number
  column?: number
}) {
  if (!line) return null

  return (
    <div className="sourceLocationMeta">
      <span className="pill info">위치</span>
      <span className="sourceLocationText">
        줄 {line}
        {column ? `:${column}` : ''}
        {sourceUrl ? ` · ${sourceUrl}` : ''}
      </span>
    </div>
  )
}

function RequestFailureList({
  items,
}: {
  items: { url: string; method: string; resourceType: string; errorText: string }[]
}) {
  if (!items.length) return <p className="muted">없음</p>

  return (
    <ul className="failDetailList">
      {items.map((item, idx) => (
        <li key={`${idx}-${item.url}-${item.errorText}`}>
          <span className="pill info">{item.method}</span>{' '}
          <span className="pill info">{item.resourceType}</span> {item.errorText}
          <IssueUrlPreview url={item.url} />
        </li>
      ))}
    </ul>
  )
}

function FailureSourceUrl({ url }: { url: string }) {
  return (
    <div className="failureSourceUrl">
      <IssueUrlPreview url={url} />
    </div>
  )
}

export function MonitorReportPanel({
  reportPaths = ['monitor-report.json'],
  historyPaths = ['history.json'],
}: MonitorReportPanelProps) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const [history, setHistory] = useState<HistoryState>({ kind: 'idle' })

  const summarizeFailures = (failures: string[] | undefined, maxItems = 2) => {
    if (!failures?.length) return null
    const shown = failures.slice(0, maxItems)
    const remaining = failures.length - shown.length
    return { shown, remaining }
  }

  const summarizeHistoryLine = (it: MonitorHistoryEntry) => {
    const consoleErrors = it.counts?.consoleErrors ?? 0
    const consoleWarnings = it.counts?.consoleWarnings ?? 0
    const pageErrors = it.counts?.pageErrors ?? 0
    const requestFailures = it.counts?.requestFailures ?? 0
    const { actionableCount, collectionFailureCount } = getFailureBuckets(it.failures)

    const parts: string[] = []

    if (consoleErrors || consoleWarnings) {
      parts.push(`콘솔 오류 ${consoleErrors}개, 경고 ${consoleWarnings}개`)
    } else {
      parts.push('콘솔 이상 없음')
    }

    if (pageErrors) parts.push(`페이지 오류 ${pageErrors}개`)
    if (requestFailures) parts.push(`요청 실패 ${requestFailures}개`)
    if (actionableCount) parts.push(`고쳐야 할 항목 ${actionableCount}개`)
    if (collectionFailureCount) parts.push(`데이터 수집 실패 ${collectionFailureCount}개`)

    return parts.join(' · ')
  }

  const renderCurrentFailureDetails = (report: MonitorReport, failure: string) => {
    const consoleErrors = (report.diagnostics?.consoleMessages ?? []).filter((m) => m.type === 'error')
    const consoleWarnings = (report.diagnostics?.consoleMessages ?? []).filter((m) => m.type === 'warning')
    const pageErrors = report.diagnostics?.pageErrors ?? []
    const requestFailures = report.diagnostics?.requestFailures ?? []

    const renderConsoleMessage = (item: ConsoleLikeMessage, idx: number) => (
      <li key={`${idx}-${item.type}-${item.text}-${item.url ?? ''}`}>
        <div>
          <span className={`pill ${item.type}`}>{item.type}</span> {item.text}
        </div>
        <SourceLocationMeta sourceUrl={item.sourceUrl} line={item.line} column={item.column} />
        {item.url ? <IssueUrlPreview url={item.url} /> : null}
      </li>
    )

    if (failure.startsWith('Console errors:')) {
      if (!consoleErrors.length) return null
      return (
        <ul className="failDetailList">
          {consoleErrors.map(renderConsoleMessage)}
        </ul>
      )
    }

    if (failure.startsWith('Console warnings:')) {
      if (!consoleWarnings.length) return null
      return (
        <ul className="failDetailList">
          {consoleWarnings.map(renderConsoleMessage)}
        </ul>
      )
    }

    if (failure.startsWith('JS page errors:')) {
      if (!pageErrors.length) return null
      return (
        <ul className="failDetailList">
          {pageErrors.map((item, idx) => (
            <li key={`${idx}-${item.message}`}>
              <div>{item.message}</div>
              <SourceLocationMeta sourceUrl={item.sourceUrl} line={item.line} column={item.column} />
              <FailureSourceUrl url={report.url} />
            </li>
          ))}
        </ul>
      )
    }

    if (failure.startsWith('Request failures:')) {
      if (!requestFailures.length) return null
      return <RequestFailureList items={requestFailures} />
    }

    if (failure.startsWith('HTTP status not OK:') || failure.startsWith('Request failed:')) {
      return (
        <ul className="failDetailList">
          <li>
            <FailureSourceUrl url={report.url} />
          </li>
        </ul>
      )
    }

    return null
  }

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const data = (await fetchJsonFromPaths<unknown>(reportPaths)) as unknown
      const report = data as MonitorReport
      if (
        typeof report !== 'object' ||
        report == null ||
        typeof report.ok !== 'boolean' ||
        typeof report.url !== 'string' ||
        typeof report.status !== 'number' ||
        typeof report.durationMs !== 'number' ||
        typeof report.checkedAt !== 'string' ||
        !Array.isArray(report.failures)
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

  useEffect(() => {
    void load()
    void loadHistory()
  }, [load, loadHistory])

  const header = useMemo(() => {
    if (state.kind === 'loaded') {
      return state.report.ok ? '이상 없음' : '이상 감지'
    }
    if (state.kind === 'error') return '리포트 없음'
    return '불러오는 중…'
  }, [state])

  const groupedHistory = useMemo(() => {
    if (history.kind !== 'loaded') return []

    const groups = new Map<string, MonitorHistoryEntry[]>()
    for (const item of history.items) {
      const key = formatDateKey(item.checkedAt)
      const existing = groups.get(key)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(key, [item])
      }
    }

    return Array.from(groups.entries()).map(([dateKey, items]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      items,
    }))
  }, [history])

  const currentErrorIssueSources = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return classifyCurrentReportErrors(state.report)
  }, [state])

  const currentAllIssueSources = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return classifyCurrentReportAll(state.report)
  }, [state])

  const currentConsoleWarnings = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return (state.report.diagnostics?.consoleMessages ?? []).filter(
      (m) => m.type === 'warning' && !shouldHideConsoleWarning(m.text),
    )
  }, [state])

  const currentRequestFailures = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return state.report.diagnostics?.requestFailures ?? []
  }, [state])

  const currentFailureBuckets = useMemo(() => {
    if (state.kind !== 'loaded') {
      return { actionableCount: 0, collectionFailureCount: 0 }
    }

    return getFailureBuckets(state.report.failures)
  }, [state])

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{header}</div>
        <div className="panelActions">
          <button
            type="button"
            className="refreshIconButton"
            onClick={load}
            disabled={state.kind === 'loading'}
            aria-label="새로고침"
            title="새로고침"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {state.kind === 'loaded' ? (
        <div className="panelBody">
          <dl className="kv">
            <div>
              <dt>대상 URL</dt>
              <dd>
                <a href={state.report.url} target="_blank" rel="noreferrer">
                  {state.report.url}
                </a>
              </dd>
            </div>
            <div>
              <dt>체크 시각</dt>
              <dd>{formatDate(state.report.checkedAt)}</dd>
            </div>
            <div>
              <dt>소요 시간</dt>
              <dd>{state.report.durationMs}ms</dd>
            </div>
          </dl>

          {state.report.ok ? (
            <div className="okBox">광고 코드/페이지 상태에 문제가 발견되지 않았습니다.</div>
          ) : (
            <div className="failBox">
              <div className="failTitle">
                {currentFailureBuckets.actionableCount > 0 ? '고쳐야 할 항목' : '데이터 수집 실패'}
              </div>
              {currentErrorIssueSources.length ? (
                <div className="issueSourceBlock">
                  <div className="issueSourceTitle">문제가 발생한 광고/영역</div>
                  <div className="diagChips">
                    {currentErrorIssueSources.map((source) => (
                      <span className="chip" key={source.key}>
                        {source.label} <b>{source.count}</b>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <ul className="failList">
                {state.report.failures.map((f, idx) => (
                  <li key={`${idx}-${f}`}>
                    <div>{f}</div>
                    {renderCurrentFailureDetails(state.report, f)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.report.diagnostics ? (
            <div className="diag">
              <details className="diagItem">
                <summary>
                  추가 정보{' '}
                  <span className="count">{currentConsoleWarnings.length + currentRequestFailures.length}</span>
                </summary>

                {currentAllIssueSources.length ? (
                  <div className="issueSourceBlock">
                    <div className="issueSourceTitle">콘솔 경고가 발생한 광고/영역</div>
                    <div className="diagChips">
                      {currentAllIssueSources.map((source) => (
                        <span className="chip" key={source.key}>
                          {source.label} <b>{source.count}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="diagSections">
                  <div className="diagSection">
                    <div className="diagSectionTitle">콘솔 경고</div>
                    {currentConsoleWarnings.length ? (
                      <ul className="diagList">
                        {currentConsoleWarnings.map((m, idx) => (
                          <li key={`${idx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                            <span className={`pill ${m.type}`}>{m.type}</span> {m.text}
                            {m.url ? <IssueUrlPreview url={m.url} /> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">없음</p>
                    )}
                  </div>
                  <div className="diagSection">
                    <div className="diagSectionTitle">
                      <RequestFailureTitle />
                    </div>
                    <RequestFailureList items={currentRequestFailures} />
                  </div>
                </div>
              </details>
            </div>
          ) : null}

          <div className="history">
            <details className="diagItem">
              <summary>
                최근 실행 기록 <span className="count">{history.kind === 'loaded' ? history.items.length : 0}</span>
              </summary>
              <div className="btnGhostWrap">
                <button
                  type="button"
                  className="btnGhost refreshGhostButton"
                  onClick={loadHistory}
                  disabled={history.kind === 'loading'}
                  aria-label="기록 새로고침"
                  title="기록 새로고침"
                >
                  <RefreshIcon />
                </button>
              </div>

              {history.kind === 'loaded' ? (
                <ul className="diagList">
                  {groupedHistory.map((group) => (
                    <li key={group.dateKey}>
                      <details className="historyDateGroup">
                        <summary className="historyDateSummary">
                          <span className="historyDateLabel">{group.label}</span>
                        </summary>

                        <ul className="historyDateList">
                          {group.items.map((it, idx) => (
                            <li key={`${idx}-${it.checkedAt}`}>
                              <details className="historyItem">
                                <summary className="historySummaryRow">
                                  <div className="historySummaryText">
                                    <div className="historyWhen">{formatTimeOnly(it.checkedAt)} · {it.durationMs}ms</div>
                                    <div className="historyMeta">{summarizeHistoryLine(it)}</div>
                                  </div>
                                  <div className="historySummaryRight" aria-hidden="true">
                                    <span className="historyChevron">▾</span>
                                  </div>
                                </summary>

                                <div className="historyBody">
                                  {(() => {
                                    const consoleErrors = it.counts?.consoleErrors ?? 0
                                    const consoleWarnings = it.counts?.consoleWarnings ?? 0
                                    const pageErrors = it.counts?.pageErrors ?? 0
                                    const requestFailures = it.counts?.requestFailures ?? 0
                                    const s = summarizeFailures(it.failures, 5)
                                    const pageErrorSample = it.pageErrorSample ?? []
                                    const consoleErrorSample = it.consoleErrorSample ?? []
                                    const consoleWarningSample = (it.consoleWarningSample ?? []).filter(
                                      (m) => !shouldHideConsoleWarning(m.text),
                                    )
                                    const requestFailureSample = it.requestFailureSample ?? []
                                    const issueSources = classifyHistoryEntry(it)

                                    const hasAnyDetail =
                                      consoleErrors ||
                                      consoleWarnings ||
                                      pageErrors ||
                                      requestFailures ||
                                      s ||
                                      pageErrorSample.length ||
                                      consoleErrorSample.length ||
                                      consoleWarningSample.length ||
                                      requestFailureSample.length

                                    if (!hasAnyDetail) {
                                      return <p className="muted">이 실행에서 특별한 이상은 기록되지 않았습니다.</p>
                                    }

                                    return (
                                      <>
                                        {issueSources.length ? (
                                          <div className="issueSourceBlock">
                                            <div className="issueSourceTitle">문제가 발생한 광고/영역</div>
                                            <div className="diagChips">
                                              {issueSources.map((source) => (
                                                <span className="chip" key={source.key}>
                                                  {source.label} <b>{source.count}</b>
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
                                        <div className="diagChips">
                                          <span className="chip">
                                            페이지 <b>{pageErrors}</b>
                                          </span>
                                          <span className="chip">
                                            콘솔 오류 <b>{consoleErrors}</b>
                                          </span>
                                          <span className="chip">
                                            콘솔 경고 <b>{consoleWarnings}</b>
                                          </span>
                                          <span className="chip">
                                            요청 실패<b>{requestFailures}</b>
                                          </span>
                                        </div>

                                        <ul className="miniList">
                                          <li>페이지 오류: {pageErrors}개</li>
                                          <li>콘솔 로그: 오류 {consoleErrors}개, 경고 {consoleWarnings}개</li>
                                          <li>요청 실패: {requestFailures}개</li>
                                          {pageErrorSample.length ? (
                                            <li>
                                              <div className="miniSectionTitle">페이지 오류 내용</div>
                                              <ul className="miniConsoleList">
                                                {pageErrorSample.map((item, sampleIdx) => (
                                                  <li key={`${sampleIdx}-${item.message}`}>
                                                    <div>{item.message}</div>
                                                    <SourceLocationMeta
                                                      sourceUrl={item.sourceUrl}
                                                      line={item.line}
                                                      column={item.column}
                                                    />
                                                    {it.url ? <FailureSourceUrl url={it.url} /> : null}
                                                  </li>
                                                ))}
                                              </ul>
                                            </li>
                                          ) : null}
                                          {consoleErrorSample.length ? (
                                            <li>
                                              <div className="miniSectionTitle">콘솔 오류 내용</div>
                                              <ul className="miniConsoleList">
                                                {consoleErrorSample.map((m, sampleIdx) => (
                                                  <li key={`${sampleIdx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                                                    <div>
                                                      <span className={`pill ${m.type}`}>{m.type}</span> {m.text}
                                                    </div>
                                                    <SourceLocationMeta
                                                      sourceUrl={m.sourceUrl}
                                                      line={m.line}
                                                      column={m.column}
                                                    />
                                                    {m.url ? <IssueUrlPreview url={m.url} /> : null}
                                                  </li>
                                                ))}
                                              </ul>
                                            </li>
                                          ) : null}
                                          {consoleWarningSample.length ? (
                                            <li>
                                              <div className="miniSectionTitle">콘솔 경고 내용</div>
                                              <ul className="miniConsoleList">
                                                {consoleWarningSample.map((m, sampleIdx) => (
                                                  <li key={`${sampleIdx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                                                    <div>
                                                      <span className={`pill ${m.type}`}>{m.type}</span> {m.text}
                                                    </div>
                                                    <SourceLocationMeta
                                                      sourceUrl={m.sourceUrl}
                                                      line={m.line}
                                                      column={m.column}
                                                    />
                                                    {m.url ? <IssueUrlPreview url={m.url} /> : null}
                                                  </li>
                                                ))}
                                              </ul>
                                            </li>
                                          ) : null}
                                          {requestFailureSample.length ? (
                                            <li>
                                              <div className="miniSectionTitle">
                                                <RequestFailureTitle />
                                              </div>
                                              <RequestFailureList items={requestFailureSample} />
                                            </li>
                                          ) : null}
                                        </ul>
                                      </>
                                    )
                                  })()}
                                </div>
                              </details>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : history.kind === 'error' ? (
                <p className="muted">{history.message}</p>
              ) : (
                <p className="muted">불러오는 중…</p>
              )}
            </details>
          </div>
        </div>
      ) : state.kind === 'error' ? (
        <div className="panelBody">
          <div className="failBox">
            <div className="failTitle">리포트를 찾을 수 없습니다</div>
            <p className="muted">{state.message}</p>
            <p className="muted">
              로컬에서는 <code>npm run monitor:all</code>과 <code>npm run history:update:all</code>을 실행해
              대상별 <code>public/news/view</code>, <code>public/news/home</code>, <code>public/pann/view</code>,
              <code>public/pann/home</code> JSON을 생성한 뒤 새로고침하세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="panelBody">
          <p className="muted">잠시만 기다려주세요.</p>
        </div>
      )}
    </section>
  )
}

