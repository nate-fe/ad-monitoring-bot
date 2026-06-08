import './App.css'
import { MonitorReportPanel, type HeroReportMetaPayload } from './components/MonitorReportPanel'
import { IssueOccurrencePage } from './components/IssueOccurrencePage'
import { useCallback, useEffect, useMemo, useState } from 'react'

const TARGETS = {
  news: {
    id: 'news',
    label: '모바일 뉴스 뷰',
    description: '네이트 모바일 뉴스 뷰 페이지의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/view/monitor-report.json'],
    historyPaths: ['news/view/history.json'],
    icon: 'MN',
  },
  'news-home': {
    id: 'news-home',
    label: '모바일 뉴스 홈',
    description: '네이트 모바일 뉴스 홈의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/home/monitor-report.json'],
    historyPaths: ['news/home/history.json'],
    icon: 'NH',
  },
  pann: {
    id: 'pann',
    label: '모바일 판 뷰',
    description: '네이트 판 뷰 페이지의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/view/monitor-report.json'],
    historyPaths: ['pann/view/history.json'],
    icon: 'PN',
  },
  'pann-home': {
    id: 'pann-home',
    label: '모바일 판 홈',
    description: '네이트 모바일 판 홈의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/home/monitor-report.json'],
    historyPaths: ['pann/home/history.json'],
    icon: 'PH',
  },
} as const

type TargetId = keyof typeof TARGETS

type AppView =
  | { kind: 'home' }
  | { kind: 'report'; targetId: TargetId }
  | { kind: 'occurrence'; targetId: TargetId }

function isTargetId(value: string): value is TargetId {
  return value in TARGETS
}

function parseAppView(): AppView {
  const hash = window.location.hash.replace(/^#/, '').trim()
  if (!hash) return { kind: 'home' }

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
  if (view.kind === 'report') return view.targetId
  return `${view.targetId}/occurrence`
}

function App() {
  const [mascotOk, setMascotOk] = useState(true)
  const darongUrl = `${import.meta.env.BASE_URL}darong.png`
  const [appView, setAppView] = useState<AppView>(() =>
    typeof window === 'undefined' ? { kind: 'home' } : parseAppView(),
  )
  const [heroReportMeta, setHeroReportMeta] = useState<HeroReportMetaPayload | null>(null)
  const targets = Object.values(TARGETS)

  const target = useMemo(() => {
    if (appView.kind === 'home') return null
    return TARGETS[appView.targetId]
  }, [appView])

  useEffect(() => {
    const onHashChange = () => {
      const next = parseAppView()
      setAppView(next)
      setHeroReportMeta(next.kind === 'report' ? { status: 'loading' } : null)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const handleHeroReportMeta = useCallback((meta: HeroReportMetaPayload) => {
    setHeroReportMeta(meta)
  }, [])

  const navigateToView = (view: AppView) => {
    const nextUrl = `${window.location.pathname}${window.location.search}${hashForView(view) ? `#${hashForView(view)}` : ''}`
    window.history.pushState(null, '', nextUrl)
    setAppView(view)
    setHeroReportMeta(view.kind === 'report' ? { status: 'loading' } : null)
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

  const subtitle = target
    ? appView.kind === 'occurrence'
      ? `${target.label} — 발생 일시·매체 데이터`
      : `${target.label} 모니터링 결과를 확인합니다.`
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
            occurrenceRoute={`${target.id}/occurrence`}
            onHeroReportMeta={handleHeroReportMeta}
          />
        ) : appView.kind === 'occurrence' && target ? (
          <IssueOccurrencePage
            reportPaths={target.reportPaths as unknown as string[]}
            historyPaths={target.historyPaths as unknown as string[]}
            targetLabel={target.label}
          />
        ) : (
          <section className="targetPicker">
            {targets.map((item) => (
              <button type="button" className="targetCard" key={item.id} onClick={() => moveToTarget(item.id)}>
                <span className="targetCardText">
                  <span className="targetTitle">{item.label}</span>
                  <span className="targetDescription">{item.description}</span>
                </span>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
