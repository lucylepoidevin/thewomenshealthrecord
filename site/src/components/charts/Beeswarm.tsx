import { scaleLinear, forceSimulation, forceX, forceY, forceCollide } from 'd3'
import { useMemo, useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Drug } from '../../lib/types'
import ChartFrame from './ChartFrame'
import Tooltip, { type Tip } from './Tooltip'

type Props = {
  drugs: Drug[]
  title: string
  subtitle?: string
  source: string
  /** 'all' = uniform rose; 'low' = emphasise drugs under 30% women; 'category' = highlight a category */
  mode: 'all' | 'low' | 'category'
  category?: string
  highlightSlug?: string
}

/** One dot per drug, placed by % women in its pivotal trials. */
export default function Beeswarm({ drugs, title, subtitle, source, mode, category, highlightSlug }: Props) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 20, right: 16, bottom: 36, left: 16 }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const x = useMemo(() => scaleLinear().domain([0, 100]).range([0, iw]), [iw])
  const r = iw > 600 ? 5 : 4

  const nodes = useMemo(() => {
    if (iw === 0 || ih === 0) return []
    const ns = drugs.map(d => ({ d, x: x(d.trial_female_pct), y: ih / 2 }))
    const sim = forceSimulation(ns as any)
      .force('x', forceX((n: any) => x(n.d.trial_female_pct)).strength(1))
      .force('y', forceY(ih / 2).strength(0.08))
      .force('collide', forceCollide(r + 1))
      .stop()
    for (let i = 0; i < 180; i++) sim.tick()
    return ns as { d: Drug; x: number; y: number }[]
  }, [drugs, iw, ih, x, r])

  const colorOf = (d: Drug) => {
    if (highlightSlug && d.slug === highlightSlug) return 'var(--c-emphasis)'
    if (mode === 'low') return d.trial_female_pct < 30 ? 'var(--c-emphasis)' : 'var(--c-muted)'
    if (mode === 'category') return d.category === category ? 'var(--c-emphasis)' : 'var(--c-muted)'
    return 'var(--c-female)'
  }

  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div ref={ref} className="relative h-full w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {[0, 25, 50, 75, 100].map(t => (
                <g key={t} transform={`translate(${x(t)},0)`}>
                  <line y1={0} y2={ih} stroke="var(--c-grid)" strokeDasharray={t === 50 ? undefined : '2 3'} />
                  <text y={ih + 20} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}%</text>
                </g>
              ))}
              <text x={x(50)} y={-6} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">half women</text>
              {mode === 'low' && <text x={x(30)} y={-6} textAnchor="end" fontSize={11} fill="var(--c-emphasis)" fontWeight={600}>under 30% ←</text>}
              {nodes.map(n => (
                <circle key={n.d.slug} cx={n.x} cy={n.y} r={highlightSlug === n.d.slug ? r + 3 : r} fill={colorOf(n.d)}
                  stroke="var(--c-surface)" strokeWidth={1}
                  style={{ transition: 'fill 400ms' }}
                  onMouseEnter={() => setTip({ x: n.x + m.left, y: n.y + m.top, content: <><b>{n.d.brand}</b> ({n.d.year})<br />{n.d.trial_female_pct.toFixed(0)}% women of {n.d.trial_n.toLocaleString()} trial participants<br /><span style={{ color: 'var(--c-text-2)' }}>{n.d.category}</span></> })}
                  onMouseLeave={() => setTip(null)} />
              ))}
              <text x={iw} y={ih + 34} textAnchor="end" fontSize={11} fill="var(--c-text-2)">share of pivotal-trial participants who were women →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
