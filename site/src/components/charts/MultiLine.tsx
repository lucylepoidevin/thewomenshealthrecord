import { scaleLinear, line as d3line } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type Series = { label: string; color: string; points: { x: number; y: number }[] }

/** Lines over a numeric x (years), one per series, with hover. */
export default function MultiLine({ series, title, subtitle, source, yLabel, fmt = v => v.toFixed(0), yMin = 0, reference }: { series: Series[]; title: string; subtitle?: string; source: string; yLabel: string; fmt?: (v: number) => string; yMin?: number; reference?: { value: number; label: string } }) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 14, right: 20, bottom: 36, left: 56 }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const xs = series.flatMap(s => s.points.map(p => p.x)), ys = series.flatMap(s => s.points.map(p => p.y))
  const x = scaleLinear().domain([Math.min(...xs), Math.max(...xs)]).range([0, iw])
  const y = scaleLinear().domain([yMin, Math.max(...ys, reference?.value ?? 0) * 1.1]).range([ih, 0])
  const ln = d3line<{ x: number; y: number }>().x(p => x(p.x)).y(p => y(p.y))
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      {series.length > 1 && <Legend items={series.map(s => ({ label: s.label, color: s.color }))} />}
      <div ref={ref} className={`relative w-full ${series.length > 1 ? 'h-[calc(100%-1.5rem)]' : 'h-full'}`}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {y.ticks(5).map(t => <g key={t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" /><text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {x.ticks(Math.min(8, xs.length)).map(t => <text key={t} x={x(t)} y={ih + 18} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}</text>)}
              {reference && <g><line x1={0} x2={iw} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--c-text-2)" strokeDasharray="4 3" /><text x={iw} y={y(reference.value) - 6} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{reference.label}</text></g>}
              {series.map(s => <path key={s.label} d={ln(s.points) ?? ''} fill="none" stroke={s.color} strokeWidth={2.5} />)}
              {series.map(s => s.points.map(p => (
                <circle key={s.label + p.x} cx={x(p.x)} cy={y(p.y)} r={4} fill={s.color} stroke="var(--c-surface)" strokeWidth={1.5}
                  onMouseEnter={() => setTip({ x: x(p.x) + m.left, y: y(p.y) + m.top, content: <><b>{s.label}</b>, {p.x}<br />{fmt(p.y)}</> })} onMouseLeave={() => setTip(null)} />
              )))}
              <text transform={`translate(${-44},0) rotate(-90)`} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{yLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
