import { scaleLinear, line as d3line, area as d3area } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Cmp } from '../../lib/types2'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

type Pt = { score: number; cmp: Cmp }

/** One line per sex across the 0–10 pain score, with a 95% band. */
export default function ScoreLines({ points, title, subtitle, source, yLabel }: { points: Pt[]; title: string; subtitle?: string; source: string; yLabel: string }) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 16, right: 20, bottom: 40, left: 44 }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const x = scaleLinear().domain([0, 10]).range([0, iw])
  const yMax = Math.ceil(Math.max(...points.map(p => Math.max(p.cmp.women.hi, p.cmp.men.hi))) / 10) * 10
  const y = scaleLinear().domain([0, yMax]).range([ih, 0])
  const F = 'var(--c-female)', M = 'var(--c-male)'
  const series = [{ k: 'women' as const, c: F, who: 'Women' }, { k: 'men' as const, c: M, who: 'Men' }]
  const ln = (k: 'women' | 'men') => d3line<Pt>().x(p => x(p.score)).y(p => y(p.cmp[k].est))(points) ?? ''
  const band = (k: 'women' | 'men') => d3area<Pt>().x(p => x(p.score)).y0(p => y(p.cmp[k].lo)).y1(p => y(p.cmp[k].hi))(points) ?? ''
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Women', color: F }, { label: 'Men', color: M }]} />
      <div ref={ref} className="relative h-[calc(100%-1.5rem)] w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {y.ticks(5).map(t => (
                <g key={t}>
                  <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" />
                  <text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{t}%</text>
                </g>
              ))}
              {x.ticks(10).map(t => <text key={t} x={x(t)} y={ih + 18} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}</text>)}
              {series.map(s => <path key={s.k + 'b'} d={band(s.k)} fill={s.c} opacity={0.12} />)}
              {series.map(s => <path key={s.k} d={ln(s.k)} fill="none" stroke={s.c} strokeWidth={2.5} />)}
              {series.map(s => points.map(p => (
                <circle key={s.k + p.score} cx={x(p.score)} cy={y(p.cmp[s.k].est)} r={4.5} fill={s.c} stroke="var(--c-surface)" strokeWidth={1.5}
                  onMouseEnter={() => setTip({ x: x(p.score) + m.left, y: y(p.cmp[s.k].est) + m.top, content: <><b>{s.who}</b>, pain score {p.score}<br />{p.cmp[s.k].est.toFixed(0)}% (95% CI {p.cmp[s.k].lo.toFixed(0)}–{p.cmp[s.k].hi.toFixed(0)}%)<br />{p.cmp[s.k].n.toLocaleString()} sampled visits</> })}
                  onMouseLeave={() => setTip(null)} />
              )))}
              <text x={iw} y={ih + 34} textAnchor="end" fontSize={11} fill="var(--c-text-2)">patient's reported pain, 0 (none) to 10 (worst) →</text>
              <text transform={`translate(${-34},0) rotate(-90)`} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{yLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
