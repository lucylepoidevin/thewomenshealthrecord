import { scaleLinear, area as d3area } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type AreaSeries = { key: string; label: string; color: string }
export type AreaPoint = { x: number; values: Record<string, number> }

/** Stacked area to 100%: how a whole divides over time. */
export default function StackedArea({ points, series, title, subtitle, source, yLabel, fmt = v => `${v.toFixed(0)}%` }: { points: AreaPoint[]; series: AreaSeries[]; title: string; subtitle?: string; source: string; yLabel: string; fmt?: (v: number) => string }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const h = 360
  const m = { top: 16, right: 16, bottom: 34, left: 44 }
  const iw = Math.max(0, width - m.left - m.right), ih = h - m.top - m.bottom
  const xs = points.map(p => p.x)
  const x = scaleLinear().domain([Math.min(...xs), Math.max(...xs)]).range([0, iw])
  const y = scaleLinear().domain([0, 100]).range([ih, 0])
  // cumulative stacks
  const stacks = series.map((s, si) => points.map(p => { const below = series.slice(0, si).reduce((a, t) => a + (p.values[t.key] ?? 0), 0); return { x: p.x, y0: below, y1: below + (p.values[s.key] ?? 0) } }))
  const gen = d3area<{ x: number; y0: number; y1: number }>().x(d => x(d.x)).y0(d => y(d.y0)).y1(d => y(d.y1))
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={series.map(s => ({ label: s.label, color: s.color }))} />
      <div ref={ref} className="relative w-full" style={{ height: h }}>
        {width > 0 && (
          <svg width={width} height={h} role="img" aria-label={title} onMouseLeave={() => setTip(null)}>
            <g transform={`translate(${m.left},${m.top})`}>
              {y.ticks(5).map(t => <g key={t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" /><text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {x.ticks(Math.min(8, xs.length)).map(t => <text key={t} x={x(t)} y={ih + 16} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}</text>)}
              {stacks.map((st, si) => <path key={series[si].key} d={gen(st) ?? ''} fill={series[si].color} opacity={0.85} />)}
              <rect x={0} y={0} width={iw} height={ih} fill="transparent" onMouseMove={e => { const px = e.nativeEvent.offsetX - m.left; const xv = x.invert(px); const p = points.reduce((a, b) => Math.abs(b.x - xv) < Math.abs(a.x - xv) ? b : a); setTip({ x: x(p.x) + m.left, y: m.top + 20, content: <><b>{p.x}</b>{series.map(s => <span key={s.key}><br /><span style={{ color: s.color }}>●</span> {s.label}: {fmt(p.values[s.key] ?? 0)}</span>)}</> }) }} />
              <text x={iw} y={ih + 30} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{yLabel}</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
