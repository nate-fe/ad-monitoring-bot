import './App.css'
import { MonitorReportPanel } from './components/MonitorReportPanel'
import { useEffect, useMemo, useState } from 'react'

const TARGETS = {
  news: {
    id: 'news',
    label: '모바일 뉴스',
    description: '네이트 모바일 뉴스 페이지의 광고 스크립트 상태를 확인합니다.',
    reportPaths: ['news/monitor-report.json'],
    historyPaths: ['news/history.json'],
    icon: 'MN',
  },
  pann: {
    id: 'pann',
    label: '모바일 판',
    description: '네이트 판 페이지의 광고/콘솔 경고 및 에러를 확인합니다.',
    reportPaths: ['pann/monitor-report.json'],
    historyPaths: ['pann/history.json'],
    icon: 'PN',
  },
} as const

type TargetId = keyof typeof TARGETS

function getTargetFromHash(): TargetId | null {
  const hash = window.location.hash.replace('#', '').trim()
  if (hash === 'news' || hash === 'pann') return hash
  return null
}

function App() {
  const [mascotOk, setMascotOk] = useState(true)
  const darongUrl = `${import.meta.env.BASE_URL}darong.png`
  const [selectedTarget, setSelectedTarget] = useState<TargetId | null>(() =>
    typeof window === 'undefined' ? null : getTargetFromHash(),
  )
  const targets = Object.values(TARGETS)

  useEffect(() => {
    const onHashChange = () => setSelectedTarget(getTargetFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const target = useMemo(() => (selectedTarget ? TARGETS[selectedTarget] : null), [selectedTarget])

  const updateHash = (nextTarget: TargetId | null) => {
    const nextUrl = nextTarget
      ? `${window.location.pathname}${window.location.search}#${nextTarget}`
      : `${window.location.pathname}${window.location.search}`
    window.history.pushState(null, '', nextUrl)
    setSelectedTarget(nextTarget)
  }

  const moveToTarget = (targetId: TargetId) => {
    updateHash(targetId)
  }

  const moveToHome = () => {
    updateHash(null)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="heroCopy">
          <h1 className="title">Ad monitoring</h1>
          <p className="subtitle">
            {target ? `${target.label} 모니터링 결과를 확인합니다.` : '모니터링할 페이지를 선택하세요.'}
          </p>
          {target ? (
            <div className="heroActions">
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
        {target ? (
          <MonitorReportPanel reportPaths={target.reportPaths as unknown as string[]} historyPaths={target.historyPaths as unknown as string[]} />
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
