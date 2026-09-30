import { useState, type ReactNode } from 'react'

type LazyDetailsProps = {
  className?: string
  summary: ReactNode
  /** 펼쳐 있는 동안에만 호출된다. */
  children: () => ReactNode
}

/**
 * 닫힌 <details> 도 안쪽을 전부 렌더링하므로, 실행 기록처럼 수백 건이 쌓이는 목록은
 * 접혀 있어도 DOM 이 수십만 개가 되고 메모리를 크게 잡아먹는다.
 * 펼친 동안에만 내용을 그리고, 다시 접으면 비워서 메모리를 돌려준다.
 */
export function LazyDetails({ className, summary, children }: LazyDetailsProps) {
  const [open, setOpen] = useState(false)

  return (
    <details className={className} onToggle={(e) => setOpen(e.currentTarget.open)}>
      {summary}
      {open ? children() : null}
    </details>
  )
}
