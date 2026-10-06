import { useEffect, useMemo, useState } from 'react'
import type { AdConfig } from '../config'
import { buildSimDoc, pickSimPage } from '../lib/sim'

/**
 * 생성 코드를 보이지 않는 가상 페이지에서 광고 있음·없음 두 번 실행해 보고 결과만 한 줄로 보여 준다.
 * 광고 서버는 부르지 않는다 (외부 요청은 가상 페이지의 CSP 로 막힘).
 */

type Response = 'filled' | 'unfilled'
const RESPONSES: Response[] = ['filled', 'unfilled']
const RESPONSE_LABEL: Record<Response, string> = { filled: '광고 있음', unfilled: '광고 없음' }
const TIMEOUT_MS = 5000

interface RunResult {
  done: boolean
  rendered: boolean
  timedOut: boolean
  issues: string[]
}

const EMPTY: RunResult = { done: false, rendered: false, timedOut: false, issues: [] }

function hashKey(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function RunCheck({ code, config, blocked }: { code: string; config: AdConfig; blocked: boolean }) {
  // 입력 중에는 기다렸다가 멈추면 실행
  const [debounced, setDebounced] = useState({ code, config })
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced({ code, config }), 600)
    return () => window.clearTimeout(t)
  }, [code, config])

  const runs = useMemo(() => {
    const key = hashKey(`${debounced.code}|${JSON.stringify(debounced.config)}`)
    const page = pickSimPage(debounced.config)
    return RESPONSES.map((response) => {
      const run = `check-${key}-${response}`
      const built = buildSimDoc(debounced.code, debounced.config, { run, page, fill: response === 'filled' })
      return { response, run, html: built.html, skipReason: built.skipReason }
    })
  }, [debounced])

  const [results, setResults] = useState<Record<string, RunResult>>({})

  useEffect(() => {
    const ids = new Set(runs.map((r) => r.run))
    const patch = (run: string, fn: (prev: RunResult) => RunResult) =>
      setResults((prev) => ({ ...prev, [run]: fn(prev[run] ?? EMPTY) }))

    const onMessage = (e: MessageEvent) => {
      const data = e.data as { __adSim?: string; type?: string; level?: string; text?: string; rendered?: boolean }
      if (!data || !data.__adSim || !ids.has(data.__adSim)) return
      const run = data.__adSim
      if (data.type === 'done') {
        patch(run, (p) => ({ ...p, done: true, rendered: Boolean(data.rendered) }))
        return
      }
      if (data.type !== 'console') return
      const text = data.text ?? ''
      // console.error 와, 생성 코드의 try/catch 가 잡은 예외(console.warn('[AD]', e))를 문제로 본다
      const isIssue = data.level === 'error' || (data.level === 'warn' && text.startsWith('[AD]'))
      if (!isIssue) return
      patch(run, (p) => (p.done || p.issues.includes(text) ? p : { ...p, issues: [...p.issues, text] }))
    }
    window.addEventListener('message', onMessage)
    const timer = window.setTimeout(() => {
      for (const run of ids) patch(run, (p) => (p.done ? p : { ...p, done: true, timedOut: true }))
    }, TIMEOUT_MS)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
    }
  }, [runs])

  if (blocked) {
    return (
      <p className="mkWarning is-idle">
        <span className="mkBadge">실행 검사</span>검증 오류를 고치면 실행해 봅니다.
      </p>
    )
  }

  const skipReason = runs.find((r) => r.skipReason)?.skipReason
  if (skipReason) {
    return (
      <p className="mkWarning is-idle">
        <span className="mkBadge">실행 검사</span>건너뜀 — {skipReason}
      </p>
    )
  }

  const stale = debounced.code !== code || debounced.config !== config
  const states = runs.map((r) => ({ ...r, result: results[r.run] ?? EMPTY }))
  const running = stale || states.some((s) => !s.result.done)

  // 같은 문제는 한 번만, 한쪽 응답에서만 나면 그 응답을 붙인다
  const problems: string[] = []
  if (!running) {
    const byText = new Map<string, Response[]>()
    for (const s of states) {
      for (const text of s.result.issues) byText.set(text, [...(byText.get(text) ?? []), s.response])
      if (s.result.timedOut) problems.push(`${RESPONSE_LABEL[s.response]}: 시간 안에 실행이 끝나지 않았습니다.`)
    }
    for (const [text, responses] of byText) {
      problems.push(responses.length === RESPONSES.length ? text : `${RESPONSE_LABEL[responses[0]]}일 때: ${text}`)
    }
    const filled = states.find((s) => s.response === 'filled')
    if (filled && !filled.result.timedOut && !filled.result.rendered) {
      problems.push('광고 영역에 아무것도 넣지 못했습니다. 위치를 못 찾았거나 중간에 멈췄습니다.')
    }
  }

  return (
    <>
      {running ? (
        <p className="mkWarning is-idle">
          <span className="mkBadge">실행 검사</span>가상 페이지에서 실행하는 중…
        </p>
      ) : problems.length ? (
        <ul className="mkWarnings" aria-label="실행 검사 결과">
          {problems.map((text) => (
            <li key={text} className="mkWarning is-error">
              <span className="mkBadge">실행 오류</span>
              <span className="mkRunText">{text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="mkWarning is-ok"
          title="광고 서버는 부르지 않습니다. 광고 있음·없음 응답을 흉내 내 두 번 실행해 보고, 오류가 없는지와 광고 영역이 만들어지는지만 확인합니다."
        >
          <span className="mkBadge">실행 검사</span>광고 있음·없음 두 경우 모두 실행 오류가 없습니다.
        </p>
      )}
      <div className="mkRunFrames" aria-hidden="true">
        {runs.map((r) => (
          <iframe key={r.run} title={`실행 검사 ${RESPONSE_LABEL[r.response]}`} tabIndex={-1} sandbox="allow-scripts allow-same-origin" srcDoc={r.html} />
        ))}
      </div>
    </>
  )
}
