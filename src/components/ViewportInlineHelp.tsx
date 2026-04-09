import { useState, type ReactNode } from 'react'
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
}

export function ViewportInlineHelp({
  wrapClassName = '',
  tooltipClassName = '',
  triggerClassName,
  ariaLabel,
  trigger,
  children,
  zIndex = 80,
}: ViewportInlineHelpProps) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
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

  const hover = useHover(context, { move: false })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <span className={`inlineHelpWrap ${wrapClassName}`.trim()}>
      <button
        type="button"
        ref={refs.setReference}
        className={triggerClassName}
        aria-label={ariaLabel}
        {...getReferenceProps()}
      >
        {trigger}
      </button>
      {open ? (
        <span
          ref={refs.setFloating}
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
