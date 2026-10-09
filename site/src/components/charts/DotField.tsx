import { useEffect, useRef } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'

/**
 * One dot per unit, drawn on a canvas so tens of thousands are cheap. The
 * highlighted dots are scattered through the field with a fixed seed so the
 * picture is the same on every load. Built for "92 trials out of 56,591".
 */
export default function DotField({ total, highlight, title, subtitle, source, caption, color = 'var(--c-emphasis)', base = '#E6CBD4', annotations = [] }: { total: number; highlight: number; title: string; subtitle?: string; source: string; caption: string; color?: string; base?: string; annotations?: { n: number; label: string }[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const dot = 3, gap = 1
  const cols = Math.max(1, Math.floor(width / (dot + gap)))
  const rowsN = Math.ceil(total / cols)
  const height = rowsN * (dot + gap)
  useEffect(() => {
    const c = canvas.current
    if (!c || width === 0) return
    const dpr = window.devicePixelRatio || 1
    c.width = width * dpr; c.height = height * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)
    // resolve CSS variables to real colours for canvas
    const css = getComputedStyle(document.documentElement)
    const resolve = (v: string) => v.startsWith('var(') ? css.getPropertyValue(v.slice(4, -1)).trim() || '#8B1E4B' : v
    const hi = resolve(color), lo = resolve(base)
    ctx.fillStyle = lo
    for (let i = 0; i < total; i++) ctx.fillRect((i % cols) * (dot + gap), Math.floor(i / cols) * (dot + gap), dot, dot)
    // seeded spread of highlighted dots
    let seed = 20260101
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
    const picked = new Set<number>()
    while (picked.size < Math.min(highlight, total)) picked.add(Math.floor(rnd() * total))
    ctx.fillStyle = hi
    picked.forEach(i => { ctx.fillRect((i % cols) * (dot + gap) - 1, Math.floor(i / cols) * (dot + gap) - 1, dot + 2, dot + 2) })
  }, [width, height, cols, total, highlight, color, base])
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div ref={ref} className="w-full">
        {width > 0 && <canvas ref={canvas} style={{ width, height, display: 'block' }} role="img" aria-label={`${highlight.toLocaleString()} of ${total.toLocaleString()}`} />}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="text-[13px] text-ink"><span className="inline-block h-3 w-3 align-middle mr-1.5" style={{ background: color }} />{caption}</p>
          {annotations.map(a => <p key={a.label} className="text-[12px] text-ink-2"><b className="text-ink">{a.n.toLocaleString()}</b> {a.label}</p>)}
        </div>
      </div>
    </ChartFrame>
  )
}
