import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildAggregatedRankings } from '../monitor/aggregateRankings'
import type { MonitorHistoryEntry, MonitorReport } from '../monitor/types'
import {
  buildClassifiedIssues,
  classifyHistoryEntry,
  extractHttpUrlFromText,
  type ClassifiedIssue,
  type IssueSourceCandidate,
} from '../monitor/issueSources'
import { AdIssueBreakdown } from './AdIssueBreakdown'
import { RefreshIcon } from './RefreshIcon'
import { DomainSourceTop5 } from './DomainSourceTop5'
import { ScriptIssueTop10, SCRIPT_ISSUE_TOP10_HELP_TEXT } from './ScriptIssueTop10'
import { InlineHelpTooltip } from './InlineHelpTooltip'
import { HistoryMonthlyConsoleSection } from './HistoryMonthlyConsoleSection'
import { HistoryPerformanceSection } from './HistoryPerformanceSection'
import { ScreenshotViewer } from './ScreenshotViewer'
import { fetchJsonFromPaths } from '../monitor/fetchJsonFromPaths'
import type { SourceSnippet } from '../monitor/types'

type LoadState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; report: MonitorReport }

type HistoryState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; items: MonitorHistoryEntry[] }

export type HeroReportMetaPayload =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; url: string; checkedAtLabel: string; durationMs: number }

type MonitorReportPanelProps = {
  reportPaths?: string[]
  historyPaths?: string[]
  onHeroReportMeta?: (meta: HeroReportMetaPayload) => void
}

type IssueUrlPreviewProps = {
  url: string
  /** 미지정 시 원인 URL 보기 */
  ariaLabel?: string
}

type ConsoleLikeMessage = {
  type: string
  text: string
  url?: string
  sourceUrl?: string
  line?: number
  column?: number
  source?: string
  dupeCount?: number
  sourceSnippet?: SourceSnippet
}

const REQUEST_FAILURE_HELP_TEXT =
  '페이지 로드 중 완료되지 못한 네트워크 요청입니다. 광고 스크립트나 광고 API 문제를 추적할 때 참고용으로 확인합니다.'

const HEADLESS_NETWORK_LOG_HELP_TEXT =
  'Playwright로 띄운 headless Chromium이 페이지를 열 때, 브라우저 엔진이 콘솔 API로 넘기는 네트워크 관련 한 줄입니다. 본문에 Failed to load resource처럼 보여도, 직접 연 크롬의 개발자 도구 Console·Network에 같은 항목이 항상 보이지는 않을 수 있습니다(자동화 전용 User-Agent·쿠키·타이밍 등이 다를 때). 크롬 UI에서 빨간 오류로 분류되지 않는 경우도 있어 참고용으로만 두었습니다. 페이지 스크립트가 찍은 console 오류와는 별도입니다.'

const PERFORMANCE_METRICS_HELP_TEXT =
  'TBT는 Long Task 기반 근사치이며, 스크립트 시간은 리소스 duration 평균입니다. CLS(레이아웃 밀림)는 placeholder 확보 등 별도 점검이 필요합니다.'

const MIXED_CONTENT_HELP_TEXT =
  'HTTPS 페이지에서 업체(광고) 측 코드가 http:// 이미지·리소스를 요청해 브라우저가 경고한 경우입니다. 소재 URL을 https로 바꾸면 대개 해소됩니다.'

const DOMAIN_RANKINGS_HELP_TECH =
  '리소스 URL·오류 출처 URL·실패 요청 URL에서 hostname을 뽑아, 평균 지연과 에러 대비 리소스 비율을 각각 상위 5개까지 보여 줍니다. 에러율에는 헤드리스 네트워크 로그 건수를 넣지 않습니다.'

/** 도메인 Top 5 · 스크립트 Top 10 집계 구간(일) */
const RANKING_WINDOW_DAYS = 30

const RANKINGS_AGGREGATE_HELP = `최근 ${RANKING_WINDOW_DAYS}일 동안 쌓인 실행 기록에서 집계한 값입니다. 각 실행이 남긴 순위 스냅샷을 모두 더했습니다(같은 시각 checkedAt 은 한 번만). 30일 이전 기록은 포함하지 않습니다.`

function isMixedContentWarning(text: string | undefined) {
  return Boolean(text && /mixed content/i.test(text))
}

function domainRankingsHelpFull() {
  return `${DOMAIN_RANKINGS_HELP_TECH}\n\n${RANKINGS_AGGREGATE_HELP}`
}

function scriptRankingsHelpWithAggregate() {
  return `${SCRIPT_ISSUE_TOP10_HELP_TEXT}\n\n${RANKINGS_AGGREGATE_HELP}`
}

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

function formatMonthKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const d = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return monthKey
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
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
        .map((m) => ({
          text: m.text,
          url: m.url ?? extractHttpUrlFromText(m.text),
          sourceUrl: m.sourceUrl,
          dupeCount: m.dupeCount,
        })) ?? []),
    )
  }
  if ((report.failures ?? []).some((f) => f.startsWith('JS page errors:'))) {
    items.push(
      ...(report.diagnostics?.pageErrors?.map((e) => ({ text: e.message, sourceUrl: e.sourceUrl })) ?? []),
    )
  }
  if ((report.failures ?? []).some((f) => f.startsWith('Request failures:'))) {
    items.push(...(report.diagnostics?.requestFailures?.map((r) => ({ url: r.url })) ?? []))
  }

  return buildClassifiedIssues(items)
}

function classifyCurrentReportAll(report: MonitorReport): ClassifiedIssue[] {
  const items = (report.diagnostics?.consoleMessages ?? [])
    .filter((m) => m.type === 'warning' && !isMixedContentWarning(m.text))
    .map((m) => ({ text: m.text, url: m.url, sourceUrl: m.sourceUrl, dupeCount: m.dupeCount }))
  return buildClassifiedIssues(items)
}

function classifyCurrentReportMixedContent(report: MonitorReport): ClassifiedIssue[] {
  const items = (report.diagnostics?.consoleMessages ?? [])
    .filter((m) => m.type === 'warning' && isMixedContentWarning(m.text))
    .map((m) => ({ text: m.text, url: m.url, sourceUrl: m.sourceUrl, dupeCount: m.dupeCount }))
  return buildClassifiedIssues(items)
}

/**
 * 콘솔 메시지 중 완전히 동일한 항목(내용·위치·출처)을 한 줄로 합치고 dupeCount 를 매긴다.
 * 광고 스크립트가 같은 경고를 여러 번 찍어도 목록에는 1행(×N)으로만 보이게 한다.
 */
function dedupeConsoleMessages<
  T extends {
    type?: string
    text?: string
    url?: string
    sourceUrl?: string
    line?: number | null
    column?: number | null
    dupeCount?: number
  },
>(messages: T[]): Array<T & { dupeCount: number }> {
  const map = new Map<string, T & { dupeCount: number }>()
  for (const m of messages) {
    const key = [m.type, m.text, m.url ?? '', m.sourceUrl ?? '', m.line ?? '', m.column ?? ''].join('')
    const inc = m.dupeCount ?? 1
    const prev = map.get(key)
    if (prev) prev.dupeCount += inc
    else map.set(key, { ...m, dupeCount: inc })
  }
  return [...map.values()]
}

/**
 * Mixed Content 는 같은 비보안 리소스 경고가 line 만 다르게 여러 번 찍히는 경우가 많아
 * 텍스트(+페이지 URL) 기준으로 묶어 ×N 으로 보여 준다.
 */
function dedupeMixedContentWarnings<
  T extends {
    type?: string
    text?: string
    url?: string
    sourceUrl?: string
    line?: number | null
    column?: number | null
    dupeCount?: number
    sourceSnippet?: SourceSnippet
  },
>(messages: T[]): Array<T & { dupeCount: number }> {
  const map = new Map<string, T & { dupeCount: number }>()
  for (const m of messages) {
    const key = [m.type ?? 'warning', m.text ?? '', m.url ?? ''].join('')
    const inc = m.dupeCount ?? 1
    const prev = map.get(key)
    if (prev) {
      prev.dupeCount += inc
      // 스니펫·출처가 비어 있으면 나중에 온 항목으로 보강
      if (!prev.sourceSnippet && m.sourceSnippet) prev.sourceSnippet = m.sourceSnippet
      if (!prev.sourceUrl && m.sourceUrl) {
        prev.sourceUrl = m.sourceUrl
        prev.line = m.line
        prev.column = m.column
      }
    } else {
      map.set(key, { ...m, dupeCount: inc })
    }
  }
  return [...map.values()]
}

type DiagCopyableFieldProps = {
  value: string
  ariaLabel: string
}

function DiagCopyableField({ value, ariaLabel }: DiagCopyableFieldProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timeoutId = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="diagUrlWrap">
      <button type="button" className="diagUrlTrigger" aria-label={ariaLabel}>
        {value}
      </button>
      <div className="diagUrlTooltip" role="tooltip">
        <div className="diagUrlTooltipText">{value}</div>
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

function IssueUrlPreview({ url, ariaLabel }: IssueUrlPreviewProps) {
  return (
    <DiagCopyableField value={url} ariaLabel={ariaLabel ?? `원인 URL 보기: ${url}`} />
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

function HeadlessNetworkLogTitle({ suffix = '' }: { suffix?: string }) {
  return (
    <span className="headlessNetworkLogTitle">
      헤드리스가 기록한 네트워크 로그{suffix}
      <InlineHelpTooltip text={HEADLESS_NETWORK_LOG_HELP_TEXT} />
    </span>
  )
}
function SourceLocationLineText({ line, column }: { line?: number; column?: number }) {
  const hasLine = line != null && Number.isFinite(line)
  const hasCol = column != null && Number.isFinite(column)
  if (!hasLine) return null
  return (
    <span className="sourceLocationText">
      Line {line}
      {hasCol ? `:${column}` : ''}
    </span>
  )
}

function SourceLocationUrlBlock({
  sourceUrl,
  line,
  column,
  sourceSnippet,
}: {
  sourceUrl?: string
  line?: number
  column?: number
  sourceSnippet?: SourceSnippet
}) {
  const hasLine = line != null && Number.isFinite(line)
  if (!sourceUrl && !hasLine && !sourceSnippet?.text) return null
  return (
    <div className="sourceLocationMeta">
      {sourceUrl || hasLine ? (
        <div className="sourceLocationUrlLine">
          {sourceUrl ? <IssueUrlPreview url={sourceUrl} ariaLabel={`출처 URL: ${sourceUrl}`} /> : null}
          <SourceLocationLineText line={line} column={column} />
        </div>
      ) : null}
      {sourceSnippet?.text ? (
        <pre className="sourceSnippet" aria-label="출처 코드 스니펫">
          {sourceSnippet.focusLine != null ? (
            <span className="sourceSnippetMeta">
              원인 코드
              {sourceSnippet.startLine != null &&
              sourceSnippet.endLine != null &&
              sourceSnippet.startLine !== sourceSnippet.endLine
                ? ` · L${sourceSnippet.startLine}–${sourceSnippet.endLine}`
                : ` · L${sourceSnippet.focusLine}`}
              {sourceSnippet.truncated ? ' · 일부' : ''}
            </span>
          ) : null}
          <code>{sourceSnippet.text}</code>
        </pre>
      ) : null}
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
          <span className="pill">{item.resourceType}</span> {item.errorText}
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
  onHeroReportMeta,
}: MonitorReportPanelProps) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const [history, setHistory] = useState<HistoryState>({ kind: 'idle' })
  const [historyMonthFilter, setHistoryMonthFilter] = useState<'all' | string>('all')

  const summarizeFailures = (failures: string[] | undefined, maxItems = 2) => {
    if (!failures?.length) return null
    const shown = failures.slice(0, maxItems)
    const remaining = failures.length - shown.length
    return { shown, remaining }
  }

  const summarizeHistoryLine = (it: MonitorHistoryEntry) => {
    const consoleErrors = it.counts?.consoleErrors ?? 0
    const consoleWarnings = it.counts?.consoleWarnings ?? 0
    const consoleLogs = it.counts?.consoleLogs ?? 0
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
    if (consoleLogs) parts.push(`콘솔 log/info ${consoleLogs}개`)
    if (requestFailures) parts.push(`요청 실패 ${requestFailures}개`)
    if (actionableCount) parts.push(`고쳐야 할 항목 ${actionableCount}개`)
    if (collectionFailureCount) parts.push(`데이터 수집 실패 ${collectionFailureCount}개`)

    return parts.join(' · ')
  }

  const renderCurrentFailureDetails = (report: MonitorReport, failure: string) => {
    const consoleErrors = (report.diagnostics?.consoleMessages ?? []).filter(
      (m) => m.type === 'error' && m.source !== 'devtools',
    )
    const consoleWarnings = (report.diagnostics?.consoleMessages ?? []).filter((m) => m.type === 'warning')
    const pageErrors = report.diagnostics?.pageErrors ?? []
    const requestFailures = report.diagnostics?.requestFailures ?? []

    const renderConsoleMessage = (item: ConsoleLikeMessage, idx: number) => (
      <li key={`${idx}-${item.type}-${item.text}-${item.url ?? ''}`}>
        <div className="diagLineHead">
          <span className={`pill ${item.type}`}>{item.type}</span>
          <span className="diagLineHeadMsg">{item.text}</span>
        </div>
        <SourceLocationUrlBlock
          sourceUrl={item.sourceUrl}
          line={item.line}
          column={item.column}
          sourceSnippet={item.sourceSnippet}
        />
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
              <div className="diagLineHead">
                <span className="diagLineHeadMsg">{item.message}</span>
              </div>
              <SourceLocationUrlBlock
                sourceUrl={item.sourceUrl}
                line={item.line}
                column={item.column}
                sourceSnippet={item.sourceSnippet}
              />
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

  useEffect(() => {
    if (!onHeroReportMeta) return
    if (state.kind === 'loaded') {
      onHeroReportMeta({
        status: 'loaded',
        url: state.report.url,
        checkedAtLabel: formatDate(state.report.checkedAt),
        durationMs: state.report.durationMs,
      })
    } else if (state.kind === 'error') {
      onHeroReportMeta({ status: 'error', message: state.message })
    } else {
      onHeroReportMeta({ status: 'loading' })
    }
  }, [state, onHeroReportMeta])

  useEffect(() => {
    if (history.kind !== 'loaded' || historyMonthFilter === 'all') return
    const hasMonth = history.items.some((it) => formatMonthKey(it.checkedAt) === historyMonthFilter)
    if (!hasMonth) setHistoryMonthFilter('all')
  }, [history, historyMonthFilter])

  const header = useMemo(() => {
    if (state.kind === 'loaded') {
      return state.report.ok ? '이상 없음' : '이상 감지'
    }
    if (state.kind === 'error') return '리포트 없음'
    return '불러오는 중…'
  }, [state])

  const historyMonthOptions = useMemo(() => {
    if (history.kind !== 'loaded') return []
    const set = new Set<string>()
    for (const it of history.items) {
      const mk = formatMonthKey(it.checkedAt)
      if (mk) set.add(mk)
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [history])

  const historyItemsForView = useMemo(() => {
    if (history.kind !== 'loaded') return []
    if (historyMonthFilter === 'all') return history.items
    return history.items.filter((it) => formatMonthKey(it.checkedAt) === historyMonthFilter)
  }, [history, historyMonthFilter])

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, MonitorHistoryEntry[]>()
    for (const item of historyItemsForView) {
      const key = formatDateKey(item.checkedAt)
      const existing = groups.get(key)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(key, [item])
      }
    }

    return Array.from(groups.entries())
      .map(([dateKey, items]) => ({
        dateKey,
        label: formatDateLabel(dateKey),
        items,
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [historyItemsForView])

  const currentErrorIssueSources = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return classifyCurrentReportErrors(state.report)
  }, [state])

  const currentAllIssueSources = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return classifyCurrentReportAll(state.report)
  }, [state])

  const currentMixedContentIssueSources = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return classifyCurrentReportMixedContent(state.report)
  }, [state])

  const currentConsoleWarnings = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return dedupeConsoleMessages(
      (state.report.diagnostics?.consoleMessages ?? []).filter(
        (m) => m.type === 'warning' && !isMixedContentWarning(m.text),
      ),
    )
  }, [state])

  const currentMixedContentWarnings = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return dedupeMixedContentWarnings(
      (state.report.diagnostics?.consoleMessages ?? []).filter(
        (m) => m.type === 'warning' && isMixedContentWarning(m.text),
      ),
    )
  }, [state])

  const currentMixedContentWarningCount = useMemo(
    () => currentMixedContentWarnings.reduce((sum, m) => sum + (m.dupeCount ?? 1), 0),
    [currentMixedContentWarnings],
  )

  const currentRequestFailures = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return state.report.diagnostics?.requestFailures ?? []
  }, [state])

  const currentConsoleLogs = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return dedupeConsoleMessages(
      (state.report.diagnostics?.consoleMessages ?? []).filter((m) => m.type === 'log' || m.type === 'info'),
    )
  }, [state])

  const currentDevToolsConsole = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return dedupeConsoleMessages(
      (state.report.diagnostics?.consoleMessages ?? []).filter((m) => m.source === 'devtools'),
    )
  }, [state])

  const currentPerformanceMetrics = useMemo(() => {
    if (state.kind !== 'loaded') return null
    return state.report.diagnostics?.performanceMetrics ?? null
  }, [state])

  /** Top 5 · Top 10 모두 최근 한 달(30일)만 — 오래전에 고쳐진 도메인·스크립트가 계속 상위에 남지 않도록 */
  const aggregatedRankings = useMemo(() => {
    const items = history.kind === 'loaded' ? history.items : []
    const report = state.kind === 'loaded' ? state.report : null
    return buildAggregatedRankings(items, report, {
      sinceMs: Date.now() - RANKING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    })
  }, [history, state])

  const currentFailureBuckets = useMemo(() => {
    if (state.kind !== 'loaded') {
      return { actionableCount: 0, collectionFailureCount: 0 }
    }

    return getFailureBuckets(state.report.failures)
  }, [state])

  function renderHistoryBlock() {
    return (
                <div className="history">
                  <details className="diagItem">
                    <summary>
                      최근 실행 기록{' '}
                      <span className="count">
                        {history.kind === 'loaded' ? historyItemsForView.length : 0}
                      </span>
                      {history.kind === 'loaded' && historyMonthFilter !== 'all' ? (
                        <span className="historyMonthFilterHint"> · {formatMonthLabel(historyMonthFilter)}</span>
                      ) : null}
                    </summary>
                    <HistoryMonthlyConsoleSection
                      historyItems={history.kind === 'loaded' ? historyItemsForView : undefined}
                      historyStatus={history.kind}
                      activeMonthFilterLabel={
                        history.kind === 'loaded' && historyMonthFilter !== 'all'
                          ? formatMonthLabel(historyMonthFilter)
                          : null
                      }
                    />
                    <HistoryPerformanceSection
                      historyItems={history.kind === 'loaded' ? historyItemsForView : undefined}
                      historyStatus={history.kind}
                      activeMonthFilterLabel={
                        history.kind === 'loaded' && historyMonthFilter !== 'all'
                          ? formatMonthLabel(historyMonthFilter)
                          : null
                      }
                    />
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
                      <>
                        {historyMonthOptions.length ? (
                          <div className="historyMonthBar">
                            <select
                              id="history-month-filter"
                              className="historyMonthSelect"
                              value={historyMonthFilter}
                              onChange={(e) => setHistoryMonthFilter(e.target.value === 'all' ? 'all' : e.target.value)}
                              aria-label="최근 실행 기록 월 필터"
                            >
                              <option value="all">전체</option>
                              {historyMonthOptions.map((mk) => (
                                <option key={mk} value={mk}>
                                  {formatMonthLabel(mk)}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        {!history.items.length ? (
                          <p className="muted">아직 저장된 실행 기록이 없습니다.</p>
                        ) : groupedHistory.length ? (
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
                                        <ScreenshotViewer screenshot={it.screenshot} />
                                        {(() => {
                                          const consoleErrors = it.counts?.consoleErrors ?? 0
                                          const consoleWarnings = it.counts?.consoleWarnings ?? 0
                                          const consoleLogs = it.counts?.consoleLogs ?? 0
                                          const pageErrors = it.counts?.pageErrors ?? 0
                                          const requestFailures = it.counts?.requestFailures ?? 0
                                          const s = summarizeFailures(it.failures, 5)
                                          const pageErrorSample = it.pageErrorSample ?? []
                                          const consoleErrorSample = it.consoleErrorSample ?? []
                                          const consoleWarningSample = it.consoleWarningSample ?? []
                                          const consoleLogSample = it.consoleLogSample ?? []
                                          const devToolsConsoleSample = it.devToolsConsoleSample ?? []
                                          const requestFailureSample = it.requestFailureSample ?? []
                                          const issueSources = classifyHistoryEntry(it)

                                          const hasAnyDetail =
                                            consoleErrors ||
                                            consoleWarnings ||
                                            consoleLogs ||
                                            pageErrors ||
                                            requestFailures ||
                                            s ||
                                            pageErrorSample.length ||
                                            consoleErrorSample.length ||
                                            consoleWarningSample.length ||
                                            consoleLogSample.length ||
                                            devToolsConsoleSample.length ||
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
                                              <ul className="miniList">
                                                <li>페이지 오류: {pageErrors}개</li>
                                                <li>콘솔 로그: 오류 {consoleErrors}개, 경고 {consoleWarnings}개</li>
                                                <li>콘솔 log/info: {consoleLogs}개</li>
                                                <li>요청 실패: {requestFailures}개</li>
                                                {pageErrorSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">페이지 오류 내용</div>
                                                    <ul className="miniConsoleList">
                                                      {pageErrorSample.map((item, sampleIdx) => (
                                                        <li key={`${sampleIdx}-${item.message}`}>
                                                          <div className="diagLineHead">
                                                            <span className="diagLineHeadMsg">{item.message}</span>
                                                          </div>
                                                          <SourceLocationUrlBlock
                                                            sourceUrl={item.sourceUrl}
                                                            line={item.line}
                                                            column={item.column}
                                                            sourceSnippet={item.sourceSnippet}
                                                          />
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
                                                          <div className="diagLineHead">
                                                            <span className={`pill ${m.type}`}>{m.type}</span>
                                                            <span className="diagLineHeadMsg">{m.text}</span>
                                                          </div>
                                                          <SourceLocationUrlBlock
                                                            sourceUrl={m.sourceUrl}
                                                            line={m.line}
                                                            column={m.column}
                                                            sourceSnippet={m.sourceSnippet}
                                                          />
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
                                                          <div className="diagLineHead">
                                                            <span className={`pill ${m.type}`}>{m.type}</span>
                                                            <span className="diagLineHeadMsg">{m.text}</span>
                                                          </div>
                                                          <SourceLocationUrlBlock
                                                            sourceUrl={m.sourceUrl}
                                                            line={m.line}
                                                            column={m.column}
                                                            sourceSnippet={m.sourceSnippet}
                                                          />
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </li>
                                                ) : null}
                                                {consoleLogSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">콘솔 log / info 내용</div>
                                                    <ul className="miniConsoleList">
                                                      {consoleLogSample.map((m, sampleIdx) => (
                                                        <li key={`${sampleIdx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                                                          <div className="diagLineHead">
                                                            <span className={`pill ${m.type}`}>{m.type}</span>
                                                            <span className="diagLineHeadMsg">{m.text}</span>
                                                          </div>
                                                          <SourceLocationUrlBlock
                                                            sourceUrl={m.sourceUrl}
                                                            line={m.line}
                                                            column={m.column}
                                                            sourceSnippet={m.sourceSnippet}
                                                          />
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </li>
                                                ) : null}
                                                {devToolsConsoleSample.length ? (
                                                  <li>
                                                    <div className="diagSection">
                                                      <div className="diagSectionTitle">
                                                        <HeadlessNetworkLogTitle />
                                                      </div>
                                                      <ul className="diagList">
                                                        {devToolsConsoleSample.map((m, sampleIdx) => {
                                                          return (
                                                            <li key={`${sampleIdx}-devtools-${m.text}`}>
                                                              <div className="diagLineHead">
                                                                <span className="diagLineHeadMsg">{m.text}</span>
                                                              </div>
                                                              <SourceLocationUrlBlock
                                                                sourceUrl={m.sourceUrl}
                                                                line={m.line}
                                                                column={m.column}
                                                              />
                                                            </li>
                                                          )
                                                        })}
                                                      </ul>
                                                    </div>
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
                        ) : (
                          <p className="muted">선택한 월에 해당하는 기록이 없습니다.</p>
                        )}
                      </>
                    ) : history.kind === 'error' ? (
                      <p className="muted">{history.message}</p>
                    ) : (
                      <p className="muted">불러오는 중…</p>
                    )}
                  </details>
                </div>
    )
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelHeaderText">
          <div className="panelTitle">{header}</div>
          {state.kind === 'loaded' && state.report.ok ? (
            <p className="panelHeaderSub panelHeaderSubOk">
              광고 코드/페이지 상태에 문제가 발견되지 않았습니다.
            </p>
          ) : null}
        </div>
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
          {state.report.ok ? null : (
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

          {/* 넓은 화면에서는 오류 요약 옆에 캡쳐를 두고, 좁아지면 캡쳐가 아래로 내려간다 */}
          <div className="reportOverviewRow">
            <div className="adIssueSection">
              <h2 className="adIssueSectionTitle">광고·영역별 오류 / 경고</h2>
              <p className="adIssueSectionDesc">
                페이지 스크립트 콘솔의 오류·경고와 페이지 오류 메시지·URL을 키워드로 묶어, 어떤 광고/플랫폼 쪽 이슈가 많은지 보여
                줍니다. 요청 실패는 여기에 포함하지 않습니다.
              </p>
              <AdIssueBreakdown report={state.report} />
            </div>

            <div className="screenshotSection">
              <ScreenshotViewer
                screenshot={state.report.screenshot}
                title="이번 실행 화면 전체 캡쳐"
                emptyHint="이번 실행에는 저장된 화면 캡쳐가 없습니다."
                variant="panel"
              />
            </div>
          </div>

          {state.report.diagnostics ? (
            <div className="diag">
              <div className="diagItem">
                <div className="diagHeader">
                  추가 정보{' '}
                  <span className="count">
                    {currentConsoleWarnings.length +
                      currentMixedContentWarnings.length +
                      currentRequestFailures.length +
                      currentConsoleLogs.length +
                      currentDevToolsConsole.length}
                  </span>
                </div>

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
                  {currentPerformanceMetrics ? (
                    <div className="diagSection">
                      <div className="diagSectionTitle diagSectionTitleWithHelp">
                        <span>메인 스레드·광고 스크립트 (이번 실행)</span>
                        <InlineHelpTooltip text={PERFORMANCE_METRICS_HELP_TEXT} />
                      </div>
                      <ul className="diagList diagPerfList">
                        <li>
                          <span className="diagPerfLabel">TBT(근사)</span>{' '}
                          <strong>{Math.round(currentPerformanceMetrics.approxTbtMs)}ms</strong>
                          <span className="muted"> · Long Task {currentPerformanceMetrics.longTaskCount}건</span>
                        </li>
                        <li>
                          <span className="diagPerfLabel">광고 스크립트 평균</span>{' '}
                          <strong>{currentPerformanceMetrics.avgAdScriptResourceDurationMs.toFixed(1)}ms</strong>
                          <span className="muted">
                            {' '}
                            · 스크립트 {currentPerformanceMetrics.adScriptResourceCount}개 URL 기준
                          </span>
                        </li>
                      </ul>
                    </div>
                  ) : null}
                  <div className="diagSection">
                    <div className="diagSectionTitle">콘솔 경고</div>
                    {currentConsoleWarnings.length ? (
                      <ul className="diagList">
                        {currentConsoleWarnings.map((m, idx) => (
                          <li key={`${idx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                            <div className="diagLineHead">
                              <span className={`pill ${m.type}`}>{m.type}</span>
                              <span className="diagLineHeadMsg">{m.text}</span>
                              {m.dupeCount > 1 ? <span className="diagDupeCount">×{m.dupeCount}</span> : null}
                            </div>
                            <SourceLocationUrlBlock
                              sourceUrl={m.sourceUrl}
                              line={m.line}
                              column={m.column}
                              sourceSnippet={m.sourceSnippet}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {currentMixedContentWarnings.length ? (
                      <details className="mixedContentGroup">
                        <summary className="mixedContentSummary">
                          <span className="mixedContentSummaryLabel">
                            <span className="pill warning">warning</span>
                            <span className="diagLineHeadMsg">Mixed Content</span>
                            <span className="count">{currentMixedContentWarningCount}</span>
                            <span className="mixedContentSummaryHint">내용 보기</span>
                          </span>
                        </summary>
                        <p className="diagSectionHint mixedContentHint">{MIXED_CONTENT_HELP_TEXT}</p>
                        {currentMixedContentIssueSources.length ? (
                          <div className="diagChips">
                            {currentMixedContentIssueSources.map((source) => (
                              <span className="chip" key={`mixed-${source.key}`}>
                                {source.label} <b>{source.count}</b>
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <ul className="diagList">
                          {currentMixedContentWarnings.map((m, idx) => (
                            <li key={`mixed-${idx}-${m.type}-${m.text}-${m.url ?? ''}`}>
                              <div className="diagLineHead">
                                <span className="diagLineHeadMsg">{m.text}</span>
                                {m.dupeCount > 1 ? <span className="diagDupeCount">×{m.dupeCount}</span> : null}
                              </div>
                              <SourceLocationUrlBlock
                                sourceUrl={m.sourceUrl}
                                line={m.line}
                                column={m.column}
                                sourceSnippet={m.sourceSnippet}
                              />
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    {!currentConsoleWarnings.length && !currentMixedContentWarnings.length ? (
                      <p className="muted">없음</p>
                    ) : null}
                  </div>
                  <div className="diagSection">
                    <div className="diagSectionTitle">
                      <RequestFailureTitle />
                    </div>
                    <RequestFailureList items={currentRequestFailures} />
                  </div>
                  <div className="diagSection">
                    <div className="diagSectionTitle">콘솔 log / info</div>
                    {currentConsoleLogs.length ? (
                      <ul className="diagList">
                        {currentConsoleLogs.map((m, idx) => (
                          <li key={`${idx}-${m.type}-${m.text}`}>
                            <div className="diagLineHead">
                              <span className={`pill ${m.type}`}>{m.type}</span>
                              <span className="diagLineHeadMsg">{m.text}</span>
                              {m.dupeCount > 1 ? <span className="diagDupeCount">×{m.dupeCount}</span> : null}
                            </div>
                            <SourceLocationUrlBlock
                              sourceUrl={m.sourceUrl}
                              line={m.line}
                              column={m.column}
                              sourceSnippet={m.sourceSnippet}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">없음</p>
                    )}
                  </div>
                  <div className="diagSection">
                    <div className="diagSectionTitle">
                      <HeadlessNetworkLogTitle />
                    </div>
                    {currentDevToolsConsole.length ? (
                      <ul className="diagList">
                        {currentDevToolsConsole.map((m, idx) => {
                          return (
                            <li key={`${idx}-devtools-${m.text}`}>
                              <div className="diagLineHead">
                                <span className="diagLineHeadMsg">{m.text}</span>
                                {m.dupeCount > 1 ? <span className="diagDupeCount">×{m.dupeCount}</span> : null}
                              </div>
                              <SourceLocationUrlBlock
                                sourceUrl={m.sourceUrl}
                                line={m.line}
                                column={m.column}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="muted">없음</p>
                    )}
                  </div>
                </div>
              </div>

              {(aggregatedRankings.domainInsights != null || aggregatedRankings.scriptIssueTop10.length > 0) ? (
                <div className="diagItem diagRankingsBlock">
                  {aggregatedRankings.domainInsights ? (
                    <>
                      <h2 className="diagRankingsTitle adIssueSectionTitleWithHelp">
                        <span>도메인(Source URL) 지연 · 에러율 Top 5</span>
                        <InlineHelpTooltip text={domainRankingsHelpFull()} />
                      </h2>
                      <p className="diagRankingsDesc">최근 {RANKING_WINDOW_DAYS}일 집계</p>
                      <DomainSourceTop5 insights={aggregatedRankings.domainInsights} />
                    </>
                  ) : null}
                  {aggregatedRankings.scriptIssueTop10.length > 0 ? (
                    <div
                      className={
                        aggregatedRankings.domainInsights != null ? 'diagRankingsSubsection' : undefined
                      }
                    >
                      <h2 className="diagRankingsTitle adIssueSectionTitleWithHelp">
                        <span>스크립트 파일별 오류 · 경고 Top 10</span>
                        <InlineHelpTooltip text={scriptRankingsHelpWithAggregate()} />
                      </h2>
                      <p className="diagRankingsDesc">
                        가장 많은 에러 및 경고를 일으키는 스크립트 출처(<strong>sourceUrl</strong>)입니다. 최근 {RANKING_WINDOW_DAYS}일 집계
                      </p>
                      <ScriptIssueTop10 rows={aggregatedRankings.scriptIssueTop10} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {renderHistoryBlock()}
        </div>
      ) : state.kind === 'error' ? (
        <div className="panelBody">
          <div className="failBox">
            <div className="failTitle">리포트를 찾을 수 없습니다</div>
            <p className="muted">{state.message}</p>
            <p className="muted">
              로컬에서는 <code>npm run monitor:all</code>과 <code>npm run history:update:all</code>을 실행해
              대상별 <code>public/news/view</code>, <code>public/news/home</code>, <code>public/pann/view</code>,
              <code>public/pann/home</code>, PC용 <code>public/news/pc</code>, <code>public/pann/pc</code> JSON을
              생성한 뒤 새로고침하세요.
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

