import './App.css'
import { MonitorReportPanel, type HeroReportMetaPayload } from './components/MonitorReportPanel'
import { IssueOccurrencePage } from './components/IssueOccurrencePage'
import { AdDashboardPage, AdTagDetailPage } from './components/AdDashboardPage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const TARGETS = {
  news: {
    id: 'news',
    label: '모바일 뉴스 뷰',
    description: '네이트 모바일 뉴스 뷰 페이지의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/view/monitor-report.json'],
    historyPaths: ['news/view/history.json'],
  },
  'news-home': {
    id: 'news-home',
    label: '모바일 뉴스 홈',
    description: '네이트 모바일 뉴스 홈의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/home/monitor-report.json'],
    historyPaths: ['news/home/history.json'],
  },
  pann: {
    id: 'pann',
    label: '모바일 판 뷰',
    description: '네이트 판 뷰 페이지의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/view/monitor-report.json'],
    historyPaths: ['pann/view/history.json'],
  },
  'pann-home': {
    id: 'pann-home',
    label: '모바일 판 홈',
    description: '네이트 모바일 판 홈의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/home/monitor-report.json'],
    historyPaths: ['pann/home/history.json'],
  },
  'news-pc': {
    id: 'news-pc',
    label: 'PC 뉴스 기사뷰',
    description: '네이트 PC 뉴스 기사뷰 페이지의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/pc/view/monitor-report.json'],
    historyPaths: ['news/pc/view/history.json'],
  },
  'news-pc-home': {
    id: 'news-pc-home',
    label: 'PC 뉴스 홈',
    description: '네이트 PC 뉴스 홈의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/pc/home/monitor-report.json'],
    historyPaths: ['news/pc/home/history.json'],
  },
  'pann-pc': {
    id: 'pann-pc',
    label: 'PC 판 뷰',
    description: '네이트 PC 판 뷰 페이지의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/pc/view/monitor-report.json'],
    historyPaths: ['pann/pc/view/history.json'],
  },
  'pann-pc-home': {
    id: 'pann-pc-home',
    label: 'PC 판 홈',
    description: '네이트 PC 판 홈의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/pc/home/monitor-report.json'],
    historyPaths: ['pann/pc/home/history.json'],
  },
} as const

type TargetId = keyof typeof TARGETS

const TARGET_GROUPS: { id: string; title: string; targetIds: TargetId[] }[] = [
  {
    id: 'news',
    title: '뉴스',
    targetIds: ['news', 'news-home', 'news-pc', 'news-pc-home'],
  },
  {
    id: 'pann',
    title: '판',
    targetIds: ['pann', 'pann-home', 'pann-pc', 'pann-pc-home'],
  },
]

type AppView =
  | { kind: 'home' }
  | { kind: 'dashboard' }
  | { kind: 'adTagDetail'; tag: string }
  | { kind: 'report'; targetId: TargetId }
  | { kind: 'occurrence'; targetId: TargetId }

function isTargetId(value: string): value is TargetId {
  return value in TARGETS
}

function parseAppView(): AppView {
  const hash = window.location.hash.replace(/^#/, '').trim()
  if (!hash) return { kind: 'home' }

  if (hash === 'dashboard') return { kind: 'dashboard' }

  // dashboard/ad?tag=... : 광고태그별(업체 분류) 상세 페이지
  if (hash.startsWith('dashboard/ad?')) {
    const query = hash.slice(hash.indexOf('?') + 1)
    const tag = new URLSearchParams(query).get('tag')?.trim()
    if (tag) return { kind: 'adTagDetail', tag }
    return { kind: 'dashboard' }
  }

  const occurrenceMatch = hash.match(/^(.+)\/occurrence$/)
  if (occurrenceMatch?.[1] && isTargetId(occurrenceMatch[1])) {
    return { kind: 'occurrence', targetId: occurrenceMatch[1] }
  }

  if (isTargetId(hash)) {
    return { kind: 'report', targetId: hash }
  }

  return { kind: 'home' }
}

function hashForView(view: AppView): string {
  if (view.kind === 'home') return ''
  if (view.kind === 'dashboard') return 'dashboard'
  if (view.kind === 'adTagDetail') return `dashboard/ad?tag=${encodeURIComponent(view.tag)}`
  if (view.kind === 'report') return view.targetId
  return `${view.targetId}/occurrence`
}

function dashboardScrollFromState(state: unknown): number | null {
  if (!state || typeof state !== 'object') return null
  const value = (state as { dashboardScrollY?: unknown }).dashboardScrollY
  return typeof value === 'number' ? value : null
}

function App() {
  const [mascotOk, setMascotOk] = useState(true)
  const darongUrl = `${import.meta.env.BASE_URL}darong.png`
  const [appView, setAppView] = useState<AppView>(() =>
    typeof window === 'undefined' ? { kind: 'home' } : parseAppView(),
  )
  const [heroReportMeta, setHeroReportMeta] = useState<HeroReportMetaPayload | null>(null)
  const dashboardScrollYRef = useRef(0)
  const appViewRef = useRef(appView)

  const target = useMemo(() => {
    if (appView.kind === 'report' || appView.kind === 'occurrence') {
      return TARGETS[appView.targetId]
    }
    return null
  }, [appView])

  useEffect(() => {
    const previousScrollRestoration =
      'scrollRestoration' in window.history ? window.history.scrollRestoration : null
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const onLocationChange = (event?: PopStateEvent) => {
      const previous = appViewRef.current
      if (previous.kind === 'dashboard') {
        dashboardScrollYRef.current = window.scrollY
      }
      const next = parseAppView()
      appViewRef.current = next
      setAppView(next)
      setHeroReportMeta(next.kind === 'report' ? { status: 'loading' } : null)

      if (next.kind === 'adTagDetail') {
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }))
      } else if (next.kind === 'dashboard' && previous.kind === 'adTagDetail') {
        const restoredY = dashboardScrollFromState(event?.state) ?? dashboardScrollYRef.current
        window.requestAnimationFrame(() => window.scrollTo({ top: restoredY, left: 0 }))
      }
    }
    const onHashChange = () => onLocationChange()
    const onPopState = (event: PopStateEvent) => onLocationChange(event)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onPopState)
      if (previousScrollRestoration && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration
      }
    }
  }, [])

  const handleHeroReportMeta = useCallback((meta: HeroReportMetaPayload) => {
    setHeroReportMeta(meta)
  }, [])

  const navigateToView = (view: AppView) => {
    const previous = appViewRef.current
    if (previous.kind === 'dashboard') {
      dashboardScrollYRef.current = window.scrollY
      window.history.replaceState(
        { ...(window.history.state ?? {}), dashboardScrollY: dashboardScrollYRef.current },
        '',
      )
    }
    const nextUrl = `${window.location.pathname}${window.location.search}${hashForView(view) ? `#${hashForView(view)}` : ''}`
    window.history.pushState({ dashboardScrollY: dashboardScrollYRef.current }, '', nextUrl)
    appViewRef.current = view
    setAppView(view)
    setHeroReportMeta(view.kind === 'report' ? { status: 'loading' } : null)
    if (view.kind === 'adTagDetail') {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }))
    } else if (view.kind === 'dashboard' && previous.kind === 'adTagDetail') {
      window.requestAnimationFrame(() => window.scrollTo({ top: dashboardScrollYRef.current, left: 0 }))
    }
  }

  const moveToTarget = (targetId: TargetId) => {
    navigateToView({ kind: 'report', targetId })
  }

  const moveToOccurrence = (targetId: TargetId) => {
    navigateToView({ kind: 'occurrence', targetId })
  }

  const moveToHome = () => {
    navigateToView({ kind: 'home' })
  }

  const moveToDashboard = () => {
    navigateToView({ kind: 'dashboard' })
  }

  const moveToAdTag = useCallback((tag: string) => {
    navigateToView({ kind: 'adTagDetail', tag })
  }, [])

  const subtitle = target
    ? appView.kind === 'occurrence'
      ? `${target.label} — 발생 일시·매체 데이터`
      : `${target.label} 모니터링 결과를 확인합니다.`
    : appView.kind === 'dashboard'
      ? '광고 스크립트를 업체·광고태그별로 모아 봅니다.'
      : appView.kind === 'adTagDetail'
        ? `광고 태그 「${appView.tag}」`
        : '모니터링할 페이지를 선택하세요.'

  return (
    <div className="app">
      <header className="top">
        <div className="heroCopy">
          <h1 className="title">Ad monitoring</h1>
          <p className="subtitle">{subtitle}</p>
          {target ? (
            <>
              {appView.kind === 'report' ? (
                <div className="heroReportMeta">
                  {!heroReportMeta || heroReportMeta.status === 'loading' ? (
                    <p className="heroReportMetaStatus">리포트를 불러오는 중…</p>
                  ) : heroReportMeta.status === 'error' ? (
                    <p className="heroReportMetaStatus">{heroReportMeta.message}</p>
                  ) : (
                    <dl className="kv kvInHero">
                      <div>
                        <dt>대상 URL</dt>
                        <dd>
                          <a href={heroReportMeta.url} target="_blank" rel="noreferrer">
                            {heroReportMeta.url}
                          </a>
                        </dd>
                      </div>
                      <div className="kvRow">
                        <div>
                          <dt>체크 시각</dt>
                          <dd>{heroReportMeta.checkedAtLabel}</dd>
                        </div>
                        <div>
                          <dt>소요 시간</dt>
                          <dd>{heroReportMeta.durationMs}ms</dd>
                        </div>
                      </div>
                    </dl>
                  )}
                </div>
              ) : (
                <p className="heroReportMetaStatus">
                  달력으로 일별 검사·감지 현황을 보고, 매체별·URL별 발생 데이터를 확인합니다.
                </p>
              )}
              <div className="heroActions">
                {appView.kind === 'occurrence' ? (
                  <button
                    type="button"
                    className="btnBackHome"
                    onClick={() => moveToTarget(appView.targetId)}
                  >
                    모니터링 결과
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btnOccurrenceLog"
                    onClick={() => moveToOccurrence(target.id)}
                  >
                    발생 일시 기록
                  </button>
                )}
                <button type="button" className="btnBackHome" onClick={moveToHome}>
                  전체 보기
                </button>
              </div>
            </>
          ) : appView.kind === 'dashboard' ? (
            <div className="heroActions">
              <button type="button" className="btnBackHome" onClick={moveToHome}>
                전체 보기
              </button>
            </div>
          ) : appView.kind === 'adTagDetail' ? (
            <div className="heroActions">
              <button type="button" className="btnBackHome" onClick={moveToDashboard}>
                대시보드
              </button>
              <button type="button" className="btnBackHome" onClick={moveToHome}>
                전체 보기
              </button>
            </div>
          ) : null}
        </div>

        <figure className="mascot" aria-label="대시보드 마스코트">
          {mascotOk ? (
            <img
              className="mascotImg"
              src={darongUrl}
              alt="다롱이"
              loading="lazy"
              onError={() => setMascotOk(false)}
            />
          ) : (
            <div
              className="mascotFallback"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${darongUrl})`,
              }}
            >
            </div>
          )}
          <figcaption className="mascotCaption">
            네이트 광고 스크립트 모니터링 봇, <br />
            <strong>다롱이</strong>
          </figcaption>
        </figure>
      </header>

      <main className="main">
        {appView.kind === 'report' && target ? (
          <MonitorReportPanel
            reportPaths={target.reportPaths as unknown as string[]}
            historyPaths={target.historyPaths as unknown as string[]}
            onHeroReportMeta={handleHeroReportMeta}
          />
        ) : appView.kind === 'occurrence' && target ? (
          <IssueOccurrencePage
            reportPaths={target.reportPaths as unknown as string[]}
            historyPaths={target.historyPaths as unknown as string[]}
            targetLabel={target.label}
          />
        ) : appView.kind === 'dashboard' ? (
          <AdDashboardPage onOpenAdTag={moveToAdTag} />
        ) : appView.kind === 'adTagDetail' ? (
          <AdTagDetailPage tag={appView.tag} onOpenAdTag={moveToAdTag} />
        ) : (
          <section className="targetPicker">
            <section className="targetServiceRow" aria-labelledby="target-service-dashboard">
              <h2 className="targetServiceTitle" id="target-service-dashboard">
                광고 스크립트
              </h2>
              <div className="targetServiceCards">
                <button type="button" className="targetCard" onClick={moveToDashboard}>
                  <span className="targetCardText">
                    <span className="targetTitle">스크립트 대시보드</span>
                    <span className="targetDescription">
                      작업했던 광고 스크립트를 업체·광고태그별로 모아 보고, 코드를 바로 확인합니다.
                    </span>
                  </span>
                </button>
              </div>
            </section>
            {TARGET_GROUPS.map((group) => (
              <section className="targetServiceRow" key={group.id} aria-labelledby={`target-service-${group.id}`}>
                <h2 className="targetServiceTitle" id={`target-service-${group.id}`}>
                  {group.title}
                </h2>
                <div className="targetServiceCards">
                  {group.targetIds.map((targetId) => {
                    const item = TARGETS[targetId]
                    return (
                      <button type="button" className="targetCard" key={item.id} onClick={() => moveToTarget(item.id)}>
                        <span className="targetCardText">
                          <span className="targetTitle">{item.label}</span>
                          <span className="targetDescription">{item.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
