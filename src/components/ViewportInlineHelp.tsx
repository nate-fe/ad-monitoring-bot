import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'

const VIEWPORT_PAD = 12

export type ViewportInlineHelpProps = {
  wrapClassName?: string
  tooltipClassName?: string
  triggerClassName: string
  ariaLabel: string
  trigger: ReactNode
  children: ReactNode
  /** 도메인 URL 목록·스크립트 메시지 등 레이어 순서 */
  zIndex?: number
  /**
   * true면 트리거를 눌러 연 뒤(또는 열린 상태에서 한 번 더 눌러 고정한 뒤) 마우스가 벗어나도 툴팁이 유지됩니다.
   * 열린 상태에서 이미 고정된 경우 다시 클릭하면 닫힙니다. 바깥 클릭·Esc도 닫힙니다.
   */
  stayOpenOnClick?: boolean
}

export function ViewportInlineHelp({
  wrapClassName = '',
  tooltipClassName = '',
  triggerClassName,
  ariaLabel,
  trigger,
  children,
  zIndex = 80,
  stayOpenOnClick = false,
}: ViewportInlineHelpProps) {
  const [open, setOpen] = useState(false)
  const [clickPinned, setClickPinned] = useState(false)
  const clickPinnedRef = useRef(false)
  const shouldCloseOnClickRef = useRef(false)

  useEffect(() => {
    clickPinnedRef.current = clickPinned
  }, [clickPinned])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setClickPinned(false)
  }, [])

  const {
    refs: { setReference, setFloating, reference: referenceRef },
    floatingStyles,
    context,
  } = useFloating({
    open,
    onOpenChange: handleOpenChange,
    placement: 'top',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: VIEWPORT_PAD }),
      shift({ padding: VIEWPORT_PAD }),
      size({
        padding: VIEWPORT_PAD,
        apply({ availableWidth, availableHeight, elements }) {
          const w = Math.floor(availableWidth)
          if (w > 0) {
            elements.floating.style.maxWidth = `${w}px`
          }
          if (availableHeight != null) {
            const h = Math.floor(availableHeight)
            if (h > 80) {
              elements.floating.style.maxHeight = `${h}px`
            }
          }
        },
      }),
    ],
  })

  /** 포커스만으로 열린 경우(호버 없이 클릭 등)에도 고정되도록 */
  useEffect(() => {
    if (!stayOpenOnClick || !open) return
    const id = requestAnimationFrame(() => {
      const el = referenceRef.current
      if (el && document.activeElement === el) {
        setClickPinned(true)
      }
    })
    return () => cancelAnimationFrame(id)
  }, [open, stayOpenOnClick, referenceRef])

  const hover = useHover(context, {
    move: false,
    enabled: !stayOpenOnClick || !clickPinned,
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  const referenceProps = getReferenceProps() as ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <span className={`inlineHelpWrap ${wrapClassName}`.trim()}>
      <button
        type="button"
        ref={setReference}
        className={triggerClassName}
        aria-label={ariaLabel}
        {...referenceProps}
        onPointerDown={(e) => {
          referenceProps.onPointerDown?.(e)
          if (!stayOpenOnClick) return
          const wasAlreadyPinned = clickPinnedRef.current
          if (open) {
            setClickPinned(true)
            shouldCloseOnClickRef.current = wasAlreadyPinned && open
          }
        }}
        onClick={(e) => {
          referenceProps.onClick?.(e)
          if (!stayOpenOnClick) return
          if (shouldCloseOnClickRef.current) {
            handleOpenChange(false)
          }
          shouldCloseOnClickRef.current = false
        }}
      >
        {trigger}
      </button>
      {open ? (
        <span
          ref={setFloating}
          style={{ ...floatingStyles, zIndex }}
          className={`inlineHelpTooltip inlineHelpTooltipViewport ${tooltipClassName}`.trim()}
          role="tooltip"
          {...getFloatingProps()}
        >
          {children}
        </span>
      ) : null}
    </span>
  )
}
