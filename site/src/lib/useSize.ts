import { useCallback, useEffect, useState } from 'react'

/**
 * Observe a container's size so SVG charts can be responsive. The ref is a callback ref, so the observer attaches
 * whenever the element appears, including after a loading state that rendered without it.
 */
export function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const ref = useCallback((node: T | null) => setEl(node), [])
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      setSize({ width: Math.floor(r.width), height: Math.floor(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return { ref, ...size }
}
