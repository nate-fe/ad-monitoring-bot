import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MonitorHistoryEntry, MonitorReport } from '../monitor/types'
import { fetchJsonFromPaths } from '../monitor/fetchJsonFromPaths'
import {
  buildIssueLifecycleModel,
  formatLifecycleDayLabel,
  LIFECYCLE_BASELINE_DAY,
  LIFECYCLE_CHRONIC_DAY_RATIO,
  LIFECYCLE_MIN_OBSERVED_DAYS,
  LIFECYCLE_NEW_WINDOW_DAYS,
  LIFECYCLE_RESOLVED_QUIET_DAYS,
  type IssueLifecycleItem,
} from '../monitor/issueLifecycle'
import {
  MESSAGE_EXPLAIN_LEVEL_LABEL,
  type MessageExplainLevel,
} from '../monitor/messageExplanations'
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

type IssueLifecyclePageProps = {
  reportPaths?: string[]
  historyPaths?: string[]
  targetLabel: string
}

/** 「기준이 뭐냐」가 화면 안에서 끝나도록, 제목 옆에 붙이는 판정 규칙 */
const LIFECYCLE_HELP_TEXT = [
  '콘솔 오류·경고를 「언제부터 나는가」로 나눕니다.',
  '',
  `기준 기간은 마지막 검사일부터 ${LIFECYCLE_RESOLVED_QUIET_DAYS}일, 비율은 검사한 날 수입니다.`,
  '',
  `· 신규 — 최근 ${LIFECYCLE_NEW_WINDOW_DAYS}일 안에 처음 잡힌 것`,
  `· 만성 — 검사한 날의 ${Math.round(LIFECYCLE_CHRONIC_DAY_RATIO * 100)}% 이상`,
  '· 간헐 — 최근에도 나오지만 그보다 드묾',
  `· 해소 — 최근 ${LIFECYCLE_RESOLVED_QUIET_DAYS}일 동안 안 나온 것, 혹은 광고 종료`,
  '',
  '신규가 만성보다 우선입니다. 같은 오류인지는 원인 코드로 판정합니다.',
].join('\n')

function LifecycleItemRow({ item }: { item: IssueLifecycleItem }) {
  const kindLabel = item.kinds.includes('pageError')
    ? '페이지 오류'
    : item.kinds.includes('error')
      ? '오류'
      : '경고'

  return (
    <li className="lifecycleItem">
      <div className="lifecycleItemHead">
        {item.explainLevel ? (
          <span className={`msgExplainBadge msgExplainBadge--${item.explainLevel} msgExplainBadge--static`}>
            {MESSAGE_EXPLAIN_LEVEL_LABEL[item.explainLevel as MessageExplainLevel]}
          </span>
        ) : null}
        <span className={`pill ${item.kinds.includes('warning') && !item.kinds.includes('error') ? 'warning' : 'error'}`}>
          {kindLabel}
        </span>
        <span className="lifecycleItemLabel">{item.label}</span>
      </div>

      <p className="lifecycleItemText">{item.sampleText}</p>

      <dl className="lifecycleItemStats">
        <div>
          <dt>처음 본 날</dt>
          <dd>{formatLifecycleDayLabel(item.firstSeenDay)}</dd>
        </div>
        <div>
          <dt>마지막 발생</dt>
          <dd>{formatLifecycleDayLabel(item.lastSeenDay)}</dd>
        </div>
        <div>
          <dt>최근 발생일</dt>
          <dd>
            검사한 {item.observedDayCount}일 중 <strong>{item.daysInWindow.length}일</strong>
            {item.observedDayCount ? ` (${Math.round(item.dayRatio * 100)}%)` : ''}
          </dd>
        </div>
        <div>
          <dt>누적 건수</dt>
          <dd>{item.totalCount.toLocaleString()}건</dd>
        </div>
      </dl>

      {item.sourceUrls.length ? (
        <ul className="lifecycleItemSources">
          {item.sourceUrls.map((url) => (
            <li key={url}>{url}</li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function IssueLifecyclePage({
  reportPaths = ['monitor-report.json'],
  historyPaths = ['history.json'],
  targetLabel,
}: IssueLifecyclePageProps) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const [history, setHistory] = useState<HistoryState>({ kind: 'idle' })

  const loadReport = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const data = (await fetchJsonFromPaths<unknown>(reportPaths)) as unknown
      const report = data as MonitorReport
      if (
        typeof report !== 'object' ||
        report == null ||
        typeof report.ok !== 'boolean' ||
        typeof report.checkedAt !== 'string'
      ) {
        throw new Error('리포트 형식이 예상과 다릅니다.')
      }
      setState({ kind: 'loaded', report })
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
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

  const model = useMemo(
    () => buildIssueLifecycleModel(historyItems, currentReport),
    [historyItems, currentReport],
  )

  const isLoading = state.kind === 'loading' || history.kind === 'loading'

  return (
    <section className="panel issueLifecyclePage">
      <div className="panelHeader">
        <div className="panelHeaderText">
          <div className="panelTitle adIssueSectionTitleWithHelp">
            <span>오류 생애주기</span>
            <InlineHelpTooltip
              text={LIFECYCLE_HELP_TEXT}
              ariaLabel="오류 생애주기 안내"
              openOnClick
            />
          </div>
          <p className="panelHeaderSub">
            {targetLabel} — 새로 생긴 오류와 매번 반복되는 오류를 나눠 봅니다.
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
        {history.kind === 'error' ? (
          <div className="failBox">
            <div className="failTitle">실행 기록을 불러오지 못했습니다</div>
            <p className="muted">{history.message}</p>
            <p className="muted">생애주기는 실행 기록이 있어야 판정할 수 있습니다.</p>
          </div>
        ) : isLoading && !model ? (
          <p className="muted">불러오는 중…</p>
        ) : !model ? (
          <p className="muted">아직 검사 기록이 없습니다.</p>
        ) : (
          <>
            <div className="lifecycleWindowBar">
              <span className="lifecycleWindowMain">
                {formatLifecycleDayLabel(model.windowStartDay)} ~{' '}
                {formatLifecycleDayLabel(model.latestDay)}
              </span>
              <span className="lifecycleWindowSub">
                이 기간에 검사한 날 <strong>{model.observedDayCount}일</strong> · 오류·경고{' '}
                <strong>{model.itemCount}종</strong>
              </span>
            </div>

            {model.isBaselineClamped ? (
              <p className="lifecycleNotice">
                {formatLifecycleDayLabel(LIFECYCLE_BASELINE_DAY)}에 모바일 에뮬레이션이 적용되어 그
                전후로 잡히는 메시지가 다릅니다. 비율은 그 날 이후만 세고, 「처음 본 날」은 전체
                기록으로 따집니다 — 이전부터 있던 오류가 신규로 밀려 올라오지 않게 하려는 것입니다.
                다만 하필 그 날 처음 잡힌 항목은 실제로 새로 터진 것인지, 전에는 안 잡히던 것이 이제
                잡히는 것인지 구분되지 않아 따로 표시해 두었습니다.
              </p>
            ) : null}

            {model.isInsufficient ? (
              <p className="lifecycleNotice lifecycleNotice--warn">
                이 기간에 검사한 날이 {model.observedDayCount}일뿐이라 「만성」과 「해소」는 아직
                판정하지 않습니다. {LIFECYCLE_MIN_OBSERVED_DAYS}일 이상 쌓이면 자동으로 나뉩니다.
              </p>
            ) : null}

            {state.kind === 'error' ? (
              <p className="lifecycleNotice">
                최신 리포트를 불러오지 못해 실행 기록만으로 분석했습니다. 이번 실행은 빠져 있을 수
                있습니다.
              </p>
            ) : null}

            {model.groups.length === 0 ? (
              <p className="muted">기간 안에 잡힌 오류·경고가 없습니다.</p>
            ) : (
              <div className="lifecycleGroups">
                {model.groups.map((group) => (
                  <section className={`lifecycleGroup lifecycleGroup--${group.status}`} key={group.status}>
                    <header className="lifecycleGroupHead">
                      <h3 className="lifecycleGroupTitle">
                        <span className={`lifecycleGroupName lifecycleGroupName--${group.status}`}>
                          {group.label}
                        </span>
                        <span className="lifecycleGroupCount">{group.items.length}종</span>
                      </h3>
                      <p className="lifecycleGroupDesc">{group.description}</p>
                    </header>
                    <ul className="lifecycleItemList">
                      {group.items.map((item) => (
                        <LifecycleItemRow item={item} key={item.key} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
