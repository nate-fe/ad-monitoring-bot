import { useState } from 'react'

export function CodeTab({ code, blocked }: { code: string; blocked: boolean }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const lines = code.replace(/\n$/, '').split('\n').length

  return (
    <div className="mkCodeTab">
      <div className="mkRow mkCodeBar">
        <span className="mkHint">
          {lines}줄 · {code.length.toLocaleString()}자 · 다른 파일에 의존하지 않는 IIFE
        </span>
        <button type="button" className="mkBtn mkBtnPrimary" onClick={copy} disabled={blocked} title={blocked ? '오류를 먼저 고치세요.' : undefined}>
          {copied ? '복사했습니다' : '코드 복사'}
        </button>
      </div>
      <pre className="mkCode">
        <code>{code}</code>
      </pre>
    </div>
  )
}
