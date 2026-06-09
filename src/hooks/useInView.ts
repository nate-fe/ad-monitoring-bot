import { useEffect, useRef, useState } from 'react'

type UseInViewOptions = {
  threshold?: number
  rootMargin?: string
  /** Changes here reset the enter animation (e.g. month or selected date). */
  resetKey?: string | number | null
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setPrefersReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  return prefersReducedMotion
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const { threshold = 0.2, rootMargin = '0px 0px -8% 0px', resetKey } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [prevResetKey, setPrevResetKey] = useState(resetKey)

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setInView(false)
    setHasEntered(false)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) {
          setHasEntered(true)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, resetKey])

  return { ref, inView, hasEntered }
}
