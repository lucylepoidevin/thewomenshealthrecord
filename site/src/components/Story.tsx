import { useEffect, useRef, useState, type ReactNode } from 'react'

export type Block =
  | { type: 'text'; id: string; body: ReactNode }
  | { type: 'figure'; id: string; body: ReactNode; /** 'chart' gets a fixed height; 'flow' grows with content (tables) */ size?: 'chart' | 'tall' | 'flow'; wide?: boolean }

/** Fades a block up when it scrolls into view. */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect() } }, { rootMargin: '0px 0px -12% 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`}>{children}</div>
}

/**
 * Long-form story: centred prose, with each figure as its own full-width
 * section between paragraphs. A thin progress bar tracks reading position.
 */
export default function Story({ blocks }: { blocks: Block[] }) {
  const wrap = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setProgress(Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight))))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={wrap}>
      <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
      {blocks.map(b =>
        b.type === 'text' ? (
          <Reveal key={b.id} className="prose-step mx-auto max-w-[42rem] px-4 py-6 text-[18px] leading-[1.75] text-ink">
            {b.body}
          </Reveal>
        ) : (
          <Reveal key={b.id} className={`mx-auto px-4 py-8 sm:py-10 ${b.wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
            <div className={`graphic-card p-4 sm:p-7 ${b.size === 'flow' ? '' : b.size === 'tall' ? 'h-[520px] sm:h-[640px]' : 'h-[440px] sm:h-[560px]'}`}>
              {b.body}
            </div>
          </Reveal>
        ),
      )}
    </div>
  )
}
