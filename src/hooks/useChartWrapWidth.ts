import { useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_MIN_WIDTH = 280

export function useChartWrapWidth(minWidth = DEFAULT_MIN_WIDTH) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(minWidth)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const apply = () => {
      const width = Math.floor(el.clientWidth)
      if (width > 0) setChartWidth(Math.max(minWidth, width))
    }

    apply()
    const raf = requestAnimationFrame(apply)
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [minWidth])

  return { wrapRef, chartWidth }
}
