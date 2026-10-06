import { scaleLinear, scaleBand } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

type Row = { label: string; female: number; male: number }

/** Female vs male value per row, joined by a line. Values are percentages. */
export default function Dumbbell({ rows, title, subtitle, source, max = 40 }: { rows: Row[]; title: string; subtitle?: string; source: string; max?: number }) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 8, right: 24, bottom: 28, left: 10 }
  const labelH = 20
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const x = scaleLinear().domain([0, max]).range([0, iw])
  const y = scaleBand<string>().domain(rows.map(r => r.label)).range([0, ih]).paddingInner(0.5)
  const F = 'var(--c-female)', M = 'var(--c-male)'
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Women', color: F }, { label: 'Men', color: M }]} />
      <div ref={ref} className="relative h-[calc(100%-1.5rem)] w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks(4).map(t => (
                <g key={t} transform={`translate(${x(t)},0)`}>
                  <line y1={0} y2={ih} stroke="var(--c-grid)" />
                  <text y={ih + 18} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}%</text>
                </g>
              ))}
              {rows.map(r => {
                const cy = (y(r.label) ?? 0) + y.bandwidth() / 2 + labelH / 2
                return (
                  <g key={r.label}>
                    <text x={0} y={(y(r.label) ?? 0) + 10} fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.label}</text>
                    <line x1={x(r.male)} x2={x(r.female)} y1={cy} y2={cy} stroke="var(--c-muted)" strokeWidth={2} />
                    {[{ v: r.male, c: M, who: 'Men' }, { v: r.female, c: F, who: 'Women' }].map(p => (
                      <g key={p.who}>
                        <circle cx={x(p.v)} cy={cy} r={7} fill={p.c} stroke="var(--c-surface)" strokeWidth={2}
                          onMouseEnter={() => setTip({ x: x(p.v) + m.left, y: cy + m.top, content: <><b>{p.who}</b>: {p.v}% above 50 ng/mL<br />{r.label}</> })}
                          onMouseLeave={() => setTip(null)} />
                        <text x={x(p.v)} y={cy - 12} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{p.v}%</text>
                      </g>
                    ))}
                  </g>
                )
              })}
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
