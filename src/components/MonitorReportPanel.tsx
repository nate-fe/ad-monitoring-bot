import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { explainMessage } from '../monitor/messageExplanations'
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
import { AdSlotVisibilitySection } from './AdSlotVisibilitySection'
import { RefreshIcon } from './RefreshIcon'
import { DomainSourceTop5 } from './DomainSourceTop5'
import { ScriptIssueTop10, SCRIPT_ISSUE_TOP10_HELP_TEXT } from './ScriptIssueTop10'
import { InlineHelpTooltip } from './InlineHelpTooltip'
import { MessageExplainBadge, MessageExplainLegend } from './MessageExplainBadge'
import { IssueLifecycleBadge, IssueLifecycleProvider } from './IssueLifecycleBadge'
import { buildIssueLifecycleModel, buildLifecycleLookup } from '../monitor/issueLifecycle'
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

/**
 * 「낡음」 관련 줄은 고치는 방법이 달라서 두 칸으로 나눈다.
 *
 * - 오래된 문법: 기능·작성 방식 자체가 낡은 것. 광고사가 **코드를 다시 짜야** 없어진다.
 * - 구식 라이브러리: 광고사가 주는 스크립트·SDK 가 옛날 버전인 것. **태그를 새 버전으로 갈면** 없어진다.
 *
 * document.write 는 브라우저가 log 레벨로 찍어 「콘솔 log / info」에, deprecated 경고는 warning 이라
 * 「콘솔 경고」에 섞여 들어가는데, 둘 다 잡음에 묻히면 안 되는 실제 개선 근거라 밖으로 뺀다.
 */
function isLegacySyntaxMessage(text: string | undefined) {
  return Boolean(text && /document\.write|scriptprocessornode/i.test(text))
}

function isLegacyLibraryMessage(text: string | undefined) {
  return Boolean(text && /deprecat/i.test(text)) && !isLegacySyntaxMessage(text)
}

const LEGACY_SYNTAX_HELP_TEXT =
  '기능이나 작성 방식 자체가 낡아서 브라우저가 경고하는 경우입니다. 대표적으로 document.write 는 광고 태그가 페이지를 그리는 도중에 내용을 직접 써 넣는 옛날 방식인데, 광고는 나오지만 그 광고가 다 올 때까지 화면 그리기가 멈춰 페이지가 늦게 뜹니다. 태그만 갈아서는 해결되지 않고 광고사가 코드를 다시 짜야 없어집니다.'

const LEGACY_LIBRARY_HELP_TEXT =
  '광고사가 주는 스크립트·SDK 가 옛날 버전이라 "새 버전을 쓰라"는 안내가 뜨는 경우입니다. 지금은 정상 동작하지만 언젠가 지원이 끊깁니다. 오래된 문법과 달리 태그를 새 버전으로 교체하면 해소되므로, 교체 일정을 잡을 수 있는 항목입니다.'

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

type MessageOccurrence = {
  url?: string
  sourceUrl?: string
  line?: number
  column?: number
  sourceSnippet?: SourceSnippet
  dupeCount?: number
}

type MessageGroup = {
  type?: string
  text?: string
  /** 이 문구가 실제로 찍힌 총 횟수(각 항목 dupeCount 합) */
  totalCount: number
  /** 같은 문구가 나온 파일·위치들 */
  occurrences: MessageOccurrence[]
}

/**
 * 같은 문구를 한 줄로 묶고, 나온 파일·위치는 그 아래에 모아 둔다.
 * dedupe 는 (문구 + 파일 + 줄)이 모두 같아야 합치므로, 같은 경고가 파일 10곳에서 나면 10줄이 된다.
 * 읽는 사람이 실제로 알고 싶은 것은 「무슨 문제가 몇 종류인가」라서 문구 기준으로 한 번 더 묶는다.
 */
function groupConsoleMessagesByText<
  T extends { type?: string; text?: string; dupeCount?: number } & MessageOccurrence,
>(messages: T[]): MessageGroup[] {
  const map = new Map<string, MessageGroup>()
  for (const m of messages) {
    const key = m.text ?? ''
    const inc = m.dupeCount ?? 1
    const prev = map.get(key)
    if (prev) {
      prev.totalCount += inc
      prev.occurrences.push(m)
    } else {
      map.set(key, { type: m.type, text: m.text, totalCount: inc, occurrences: [m] })
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

function hasSourceInfo(o: MessageOccurrence) {
  return Boolean(o.sourceUrl || (o.line != null && Number.isFinite(o.line)) || o.sourceSnippet?.text)
}

/** 한 문구가 나온 파일·위치 목록. 한 곳뿐이면 접지 않고 그대로 보여 준다. */
function MessageOccurrences({ occurrences }: { occurrences: MessageOccurrence[] }) {
  const withSource = occurrences.filter(hasSourceInfo)
  if (!withSource.length) return null

  if (withSource.length === 1) {
    const only = withSource[0]
    return (
      <SourceLocationUrlBlock
        sourceUrl={only.sourceUrl}
        line={only.line}
        column={only.column}
        sourceSnippet={only.sourceSnippet}
      />
    )
  }

  return (
    <details className="msgOccurrenceGroup">
      <summary className="msgOccurrenceSummary">
        발생한 파일·위치 <span className="count">{withSource.length}</span>
        <span className="msgOccurrenceSummaryHint">보기</span>
      </summary>
      <ol className="msgOccurrenceList">
        {withSource.map((o, idx) => (
          <li key={`${idx}-${o.sourceUrl ?? ''}-${o.line ?? ''}-${o.column ?? ''}`}>
            <SourceLocationUrlBlock
              sourceUrl={o.sourceUrl}
              line={o.line}
              column={o.column}
              sourceSnippet={o.sourceSnippet}
            />
          </li>
        ))}
      </ol>
    </details>
  )
}

/** 문구 기준으로 묶은 콘솔 메시지 목록 */
function GroupedConsoleMessageList({
  groups,
  keyPrefix,
  showPill = true,
  listClassName = 'diagList',
}: {
  groups: MessageGroup[]
  keyPrefix: string
  showPill?: boolean
  /** 실행 기록 안에서는 miniConsoleList 를 쓴다 */
  listClassName?: string
}) {
  return (
    <ul className={listClassName}>
      {groups.map((g, idx) => (
        <li key={`${keyPrefix}-${idx}-${g.text ?? ''}`}>
          <div className="diagLineHead">
            {showPill && g.type ? <span className={`pill ${g.type}`}>{g.type}</span> : null}
            <span className="diagLineHeadMsg">
              <MessageExplainBadge text={g.text} />
              <IssueLifecycleBadge text={g.text} />
              {g.text}
            </span>
            {g.totalCount > 1 ? <span className="diagDupeCount">×{g.totalCount}</span> : null}
          </div>
          <MessageOccurrences occurrences={g.occurrences} />
        </li>
      ))}
    </ul>
  )
}

/** 접힌 채로 열어도 되는 칸인지 — 조치 필요·확인만이나 아직 분류 안 된 줄이 하나라도 있으면 펼쳐 둔다 */
function hasNoteworthyMessage(groups: MessageGroup[]) {
  return groups.some((g) => {
    const info = explainMessage(g.text)
    return !info || info.level !== 'noise'
  })
}

/**
 * 「추가 정보」 한 칸.
 * 잡음 위주인 칸은 `collapsible` 로 접어 두되, 볼 것이 섞여 있으면 펼친 채로 연다.
 * 내용이 없는 칸은 아예 렌더하지 않는다(호출부에서 거른다) — 「없음」만 적힌 칸이 화면을 길게 만든다.
 */
function DiagSection({
  title,
  help,
  count,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: ReactNode
  help?: string
  count?: number
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  const titleInner = (
    <>
      <span>
        {title}
        {count ? <> <span className="count">{count}</span></> : null}
      </span>
      {help ? (
        // summary 안에서 ⓘ 를 눌러도 칸이 접히지 않도록
        <span className="diagSectionHelpSlot" onClick={(e) => e.stopPropagation()}>
          <InlineHelpTooltip text={help} />
        </span>
      ) : null}
    </>
  )

  if (!collapsible) {
    return (
      <div className="diagSection">
        <div className={`diagSectionTitle${help ? ' diagSectionTitleWithHelp' : ''}`}>{titleInner}</div>
        {children}
      </div>
    )
  }

  return (
    <details
      className="diagSection diagSectionCollapsible"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="diagSectionTitle diagSectionSummary">{titleInner}</summary>
      {children}
    </details>
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
          <span className="diagLineHeadMsg">
            <MessageExplainBadge text={item.text} />
            <IssueLifecycleBadge text={item.text} />
            {item.text}
          </span>
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
    return groupConsoleMessagesByText(
      dedupeConsoleMessages(
        (state.report.diagnostics?.consoleMessages ?? []).filter(
          (m) =>
            m.type === 'warning' &&
            !isMixedContentWarning(m.text) &&
            !isLegacyLibraryMessage(m.text) &&
            !isLegacySyntaxMessage(m.text),
        ),
      ),
    )
  }, [state])

  const currentLegacyLibraryWarnings = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return groupConsoleMessagesByText(
      dedupeConsoleMessages(
        (state.report.diagnostics?.consoleMessages ?? []).filter(
          (m) => m.type === 'warning' && isLegacyLibraryMessage(m.text),
        ),
      ),
    )
  }, [state])

  const currentLegacyLibraryCount = useMemo(
    () => currentLegacyLibraryWarnings.reduce((sum, g) => sum + g.totalCount, 0),
    [currentLegacyLibraryWarnings],
  )

  const currentMixedContentWarnings = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return groupConsoleMessagesByText(
      dedupeMixedContentWarnings(
        (state.report.diagnostics?.consoleMessages ?? []).filter(
          (m) => m.type === 'warning' && isMixedContentWarning(m.text),
        ),
      ),
    )
  }, [state])

  const currentMixedContentWarningCount = useMemo(
    () => currentMixedContentWarnings.reduce((sum, g) => sum + g.totalCount, 0),
    [currentMixedContentWarnings],
  )

  const currentRequestFailures = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return state.report.diagnostics?.requestFailures ?? []
  }, [state])

  const currentConsoleLogs = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return groupConsoleMessagesByText(
      dedupeConsoleMessages(
        (state.report.diagnostics?.consoleMessages ?? []).filter(
          (m) => (m.type === 'log' || m.type === 'info') && !isLegacySyntaxMessage(m.text),
        ),
      ),
    )
  }, [state])

  /** log 로 찍히는 document.write 와 warning 으로 찍히는 ScriptProcessorNode 를 한 칸에 모은다 */
  const currentLegacySyntaxMessages = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return groupConsoleMessagesByText(
      dedupeConsoleMessages(
        (state.report.diagnostics?.consoleMessages ?? []).filter(
          (m) => m.source !== 'devtools' && isLegacySyntaxMessage(m.text),
        ),
      ),
    )
  }, [state])

  const currentLegacySyntaxCount = useMemo(
    () => currentLegacySyntaxMessages.reduce((sum, g) => sum + g.totalCount, 0),
    [currentLegacySyntaxMessages],
  )

  const currentDevToolsConsole = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return groupConsoleMessagesByText(
      dedupeConsoleMessages((state.report.diagnostics?.consoleMessages ?? []).filter((m) => m.source === 'devtools')),
    )
  }, [state])

  const currentAdSlots = useMemo(() => {
    if (state.kind !== 'loaded') return []
    return state.report.diagnostics?.adSlots ?? []
  }, [state])

  const currentPerformanceMetrics = useMemo(() => {
    if (state.kind !== 'loaded') return null
    return state.report.diagnostics?.performanceMetrics ?? null
  }, [state])

  /**
   * 「추가 정보」 범례에 표시할 단계별 건수.
   *
   * 기준은 **경고 레벨인가**이지 어느 칸에 보이는가가 아니다. 그래서 밖으로 뺀 구식 라이브러리
   * 경고는 계속 세고, log 로 찍히는 document.write 는 세지 않는다. 칸을 옮겼다고 숫자가
   * 달라지면 「봐야 할 것이 몇 건인가」라는 뜻이 무너진다.
   * (헤드리스 네트워크 로그 제외는 이 파일의 다른 집계와 같은 기준이다.)
   */
  const currentDiagMessageTexts = useMemo(
    () =>
      [
        ...currentConsoleWarnings,
        ...currentMixedContentWarnings,
        ...currentLegacyLibraryWarnings,
        // 오래된 문법 칸에는 log 도 섞여 있으니 경고만 센다
        ...currentLegacySyntaxMessages.filter((m) => m.type === 'warning'),
      ].map((m) => m.text),
    [currentConsoleWarnings, currentMixedContentWarnings, currentLegacyLibraryWarnings, currentLegacySyntaxMessages],
  )

  /** 「고쳐야 할 항목」 범례용 — 콘솔 오류와 페이지 오류 메시지 */
  const currentFailureMessageTexts = useMemo(() => {
    if (state.kind !== 'loaded') return []
    const diag = state.report.diagnostics
    return [
      ...(diag?.consoleMessages ?? []).filter((m) => m.type === 'error' && m.source !== 'devtools').map((m) => m.text),
      ...(diag?.pageErrors ?? []).map((e) => e.message),
    ]
  }, [state])

  /** Top 5 · Top 10 모두 최근 한 달(30일)만 — 오래전에 고쳐진 도메인·스크립트가 계속 상위에 남지 않도록 */
  const aggregatedRankings = useMemo(() => {
    const items = history.kind === 'loaded' ? history.items : []
    const report = state.kind === 'loaded' ? state.report : null
    return buildAggregatedRankings(items, report, {
      sinceMs: Date.now() - RANKING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    })
  }, [history, state])

  /**
   * 메시지 옆 「신규/만성/간헐」 배지용.
   *
   * 월 필터(historyItemsForView)가 아니라 **전체 기록**으로 만든다 — 생애주기는 최근 며칠을
   * 보는 것이라, 화면에서 6월을 고르면 배지가 사라지는 식으로 따라 움직이면 안 된다.
   */
  const lifecycleLookup = useMemo(() => {
    const items = history.kind === 'loaded' ? history.items : []
    const report = state.kind === 'loaded' ? state.report : null
    if (!items.length && !report) return null
    return buildLifecycleLookup(buildIssueLifecycleModel(items, report))
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

                                      {/* 지난 실행 안쪽에는 생애주기 배지를 달지 않는다 — 배지는 「지금」 상태라
                                          6월 기록 옆에 「신규」가 붙으면 그때 새로 났다는 말로 읽힌다 */}
                                      <IssueLifecycleProvider lookup={null}>
                                      <div className="historyBody">
                                        <ScreenshotViewer screenshot={it.screenshot} />
                                        {(() => {
                                          const consoleErrors = it.counts?.consoleErrors ?? 0
                                          const consoleWarnings = it.counts?.consoleWarnings ?? 0
                                          const consoleLogs = it.counts?.consoleLogs ?? 0
                                          const pageErrors = it.counts?.pageErrors ?? 0
                                          const requestFailures = it.counts?.requestFailures ?? 0
                                          const s = summarizeFailures(it.failures, 5)
                                          // 페이지 오류는 text 대신 message 라서 묶기 전에 맞춰 준다
                                          const pageErrorSample = groupConsoleMessagesByText(
                                            (it.pageErrorSample ?? []).map((e) => ({ ...e, text: e.message })),
                                          )
                                          const consoleErrorSample = groupConsoleMessagesByText(it.consoleErrorSample ?? [])
                                          const consoleWarningSample = groupConsoleMessagesByText(
                                            (it.consoleWarningSample ?? []).filter(
                                              (m) => !isLegacyLibraryMessage(m.text) && !isLegacySyntaxMessage(m.text),
                                            ),
                                          )
                                          const legacyLibrarySample = groupConsoleMessagesByText(
                                            (it.consoleWarningSample ?? []).filter((m) => isLegacyLibraryMessage(m.text)),
                                          )
                                          const legacySyntaxSample = groupConsoleMessagesByText(
                                            [...(it.consoleWarningSample ?? []), ...(it.consoleLogSample ?? [])].filter((m) =>
                                              isLegacySyntaxMessage(m.text),
                                            ),
                                          )
                                          const consoleLogSample = groupConsoleMessagesByText(
                                            (it.consoleLogSample ?? []).filter((m) => !isLegacySyntaxMessage(m.text)),
                                          )
                                          const devToolsConsoleSample = groupConsoleMessagesByText(
                                            it.devToolsConsoleSample ?? [],
                                          )
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
                                                    <GroupedConsoleMessageList
                                                      groups={pageErrorSample}
                                                      keyPrefix="h-pageerr"
                                                      listClassName="miniConsoleList"
                                                      showPill={false}
                                                    />
                                                  </li>
                                                ) : null}
                                                {consoleErrorSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">콘솔 오류 내용</div>
                                                    <GroupedConsoleMessageList
                                                      groups={consoleErrorSample}
                                                      keyPrefix="h-err"
                                                      listClassName="miniConsoleList"
                                                    />
                                                  </li>
                                                ) : null}
                                                {consoleWarningSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">콘솔 경고 내용</div>
                                                    <GroupedConsoleMessageList
                                                      groups={consoleWarningSample}
                                                      keyPrefix="h-warn"
                                                      listClassName="miniConsoleList"
                                                    />
                                                  </li>
                                                ) : null}
                                                {legacyLibrarySample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">구식 라이브러리 사용</div>
                                                    <GroupedConsoleMessageList
                                                      groups={legacyLibrarySample}
                                                      keyPrefix="h-legacylib"
                                                      listClassName="miniConsoleList"
                                                    />
                                                  </li>
                                                ) : null}
                                                {legacySyntaxSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">오래된 문법 사용</div>
                                                    <GroupedConsoleMessageList
                                                      groups={legacySyntaxSample}
                                                      keyPrefix="h-legacy"
                                                      listClassName="miniConsoleList"
                                                      showPill={false}
                                                    />
                                                  </li>
                                                ) : null}
                                                {consoleLogSample.length ? (
                                                  <li>
                                                    <div className="miniSectionTitle">콘솔 log / info 내용</div>
                                                    <GroupedConsoleMessageList
                                                      groups={consoleLogSample}
                                                      keyPrefix="h-log"
                                                      listClassName="miniConsoleList"
                                                    />
                                                  </li>
                                                ) : null}
                                                {devToolsConsoleSample.length ? (
                                                  <li>
                                                    <div className="diagSection">
                                                      <div className="diagSectionTitle">
                                                        <HeadlessNetworkLogTitle />
                                                      </div>
                                                      <GroupedConsoleMessageList
                                                        groups={devToolsConsoleSample}
                                                        keyPrefix="h-devtools"
                                                        showPill={false}
                                                      />
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
                                      </IssueLifecycleProvider>
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
    <IssueLifecycleProvider lookup={lifecycleLookup}>
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
              <MessageExplainLegend texts={currentFailureMessageTexts} />
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
                      currentLegacyLibraryWarnings.length +
                      currentLegacySyntaxMessages.length +
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

                <MessageExplainLegend texts={currentDiagMessageTexts} />

                <div className="diagSections">
                  {currentAdSlots.length ? <AdSlotVisibilitySection slots={currentAdSlots} /> : null}
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
                  {currentConsoleWarnings.length || currentMixedContentWarnings.length ? (
                  <div className="diagSection">
                    <div className="diagSectionTitle">콘솔 경고</div>
                    {currentConsoleWarnings.length ? (
                      <GroupedConsoleMessageList groups={currentConsoleWarnings} keyPrefix="warn" />
                    ) : null}
                    {currentMixedContentWarnings.length ? (
                      <details className="mixedContentGroup">
                        <summary className="mixedContentSummary">
                          <span className="mixedContentSummaryLabel">
                            <span className="pill warning">warning</span>
                            <span className="diagLineHeadMsg">
                              <MessageExplainBadge text="Mixed Content" />
                              Mixed Content
                            </span>
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
                        <GroupedConsoleMessageList
                          groups={currentMixedContentWarnings}
                          keyPrefix="mixed"
                          showPill={false}
                        />
                      </details>
                    ) : null}
                  </div>
                  ) : null}
                  {currentRequestFailures.length ? (
                    <DiagSection title={<RequestFailureTitle />}>
                      <RequestFailureList items={currentRequestFailures} />
                    </DiagSection>
                  ) : null}
                  {currentLegacyLibraryWarnings.length ? (
                    <DiagSection
                      title="구식 라이브러리 사용"
                      count={currentLegacyLibraryCount}
                      help={LEGACY_LIBRARY_HELP_TEXT}
                    >
                      <GroupedConsoleMessageList groups={currentLegacyLibraryWarnings} keyPrefix="legacylib" />
                    </DiagSection>
                  ) : null}
                  {currentLegacySyntaxMessages.length ? (
                    <DiagSection
                      title="오래된 문법 사용"
                      count={currentLegacySyntaxCount}
                      help={LEGACY_SYNTAX_HELP_TEXT}
                    >
                      <GroupedConsoleMessageList
                        groups={currentLegacySyntaxMessages}
                        keyPrefix="legacy"
                        showPill={false}
                      />
                    </DiagSection>
                  ) : null}
                  {currentConsoleLogs.length ? (
                    <DiagSection
                      title="콘솔 log / info"
                      count={currentConsoleLogs.length}
                      collapsible
                      defaultOpen={hasNoteworthyMessage(currentConsoleLogs)}
                    >
                      <GroupedConsoleMessageList groups={currentConsoleLogs} keyPrefix="log" />
                    </DiagSection>
                  ) : null}
                  {currentDevToolsConsole.length ? (
                    <DiagSection
                      title="헤드리스가 기록한 네트워크 로그"
                      count={currentDevToolsConsole.length}
                      help={HEADLESS_NETWORK_LOG_HELP_TEXT}
                      collapsible
                      defaultOpen={hasNoteworthyMessage(currentDevToolsConsole)}
                    >
                      <GroupedConsoleMessageList groups={currentDevToolsConsole} keyPrefix="devtools" showPill={false} />
                    </DiagSection>
                  ) : null}
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
    </IssueLifecycleProvider>
  )
}

