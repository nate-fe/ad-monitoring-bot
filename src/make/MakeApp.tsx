import { useMemo, useState } from 'react'
import { type AdConfig, DEFAULT_CONFIG } from './config'
import { generate } from './lib/generate'
import { hasError, validate, type WarningLevel } from './lib/validate'
import { ConfigForm } from './components/ConfigForm'
import { CodeTab } from './components/CodeTab'
import { RunCheck } from './components/RunCheck'

const LEVEL_LABEL: Record<WarningLevel, string> = { error: '오류', warn: '주의', info: '안내' }

export function MakeApp() {
  const [config, setConfig] = useState<AdConfig>(DEFAULT_CONFIG)
  // 처음부터 다시 만들 때 폼 안의 입력 상태(태그 붙여넣기 칸 등)까지 비우려고 key 를 바꾼다
  const [formKey, setFormKey] = useState(0)

  const code = useMemo(() => generate(config), [config])
  const warnings = useMemo(() => validate(config), [config])
  const blocked = hasError(warnings)

  const update = (patch: Partial<AdConfig>) => setConfig((prev) => ({ ...prev, ...patch }))

  const changed = JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG)
  const reset = () => {
    if (!window.confirm('입력한 값을 모두 지우고 처음부터 다시 만들까요?')) return
    setConfig(DEFAULT_CONFIG)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="mkApp">
      <header className="mkTop">
        <div>
          <a className="mkBack" href={import.meta.env.BASE_URL}>
            ← Ad monitoring
          </a>
          <h1 className="mkTitle">광고 스크립트 생성기</h1>
        </div>
        <button type="button" className="mkBtn" onClick={reset} disabled={!changed}>
          처음부터 다시
        </button>
      </header>

      <div className="mkLayout">
        <ConfigForm key={formKey} config={config} onChange={update} />

        <div className="mkOutput">
          {warnings.length ? (
            <ul className="mkWarnings" aria-label="검증 결과">
              {warnings.map((w, i) => (
                <li key={i} className={`mkWarning is-${w.level}`}>
                  <span className="mkBadge">{LEVEL_LABEL[w.level]}</span>
                  {w.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mkWarning is-ok">
              <span className="mkBadge">통과</span>검증 경고가 없습니다.
            </p>
          )}

          <RunCheck code={code} config={config} blocked={blocked} />
          <CodeTab code={code} blocked={blocked} />
        </div>
      </div>
    </div>
  )
}
