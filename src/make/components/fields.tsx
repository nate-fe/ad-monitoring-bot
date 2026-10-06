import { useState, type ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
  wide,
  group,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  wide?: boolean
  /** 버튼 여러 개를 담을 때. <label> 이면 글자를 눌렀을 때 첫 버튼이 눌린다 */
  group?: boolean
}) {
  const className = `mkField${wide ? ' mkFieldWide' : ''}`
  const body = (
    <>
      <span className="mkFieldLabel">{label}</span>
      {children}
      {hint ? <span className="mkHint">{hint}</span> : null}
    </>
  )
  return group ? (
    <div className={className} role="group" aria-label={label}>
      {body}
    </div>
  ) : (
    <label className={className}>{body}</label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <input
      className={`mkInput${mono ? ' mkMono' : ''}`}
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      className="mkInput mkMono"
      value={value}
      rows={rows}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function SizeInput({
  width,
  height,
  onChange,
}: {
  width: string
  height: string
  onChange: (w: string, h: string) => void
}) {
  return (
    <span className="mkSize">
      <input
        className="mkInput"
        inputMode="numeric"
        value={width}
        aria-label="너비"
        placeholder="W"
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''), height)}
      />
      <span aria-hidden="true">×</span>
      <input
        className="mkInput"
        inputMode="numeric"
        value={height}
        aria-label="높이"
        placeholder="H"
        onChange={(e) => onChange(width, e.target.value.replace(/[^\d]/g, ''))}
      />
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="mkSegmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'isOn' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="mkCheck">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <select className="mkInput" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/**
 * 자주 쓰는 값을 칩으로 고르고, 목록에 없으면 "직접 입력"으로 넣는다.
 * 값이 목록에 없으면(태그로 채우기 등) 자동으로 직접 입력 상태로 보인다.
 */
export function Choice({
  value,
  onChange,
  options,
  label,
  placeholder,
  mono,
  renderCustom,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
  placeholder?: string
  mono?: boolean
  /** 직접 입력 칸을 다르게 그릴 때 (예: W×H 두 칸) */
  renderCustom?: () => ReactNode
}) {
  const [customOpen, setCustomOpen] = useState(false)
  const matched = options.some((o) => o.value === value)
  const custom = customOpen || !matched
  return (
    <div className="mkChoice">
      <div className="mkSegmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value || '(empty)'}
            type="button"
            role="radio"
            aria-checked={!custom && value === o.value}
            className={!custom && value === o.value ? 'isOn' : ''}
            onClick={() => {
              setCustomOpen(false)
              onChange(o.value)
            }}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          className={custom ? 'isOn' : ''}
          onClick={() => setCustomOpen(true)}
        >
          직접 입력
        </button>
      </div>
      {custom ? (
        renderCustom ? (
          renderCustom()
        ) : (
          <TextInput mono={mono} value={value} onChange={onChange} placeholder={placeholder} />
        )
      ) : null}
    </div>
  )
}
