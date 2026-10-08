import { scaleLinear, scaleLog } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type LolliRow = { label: string; sub?: string; value: number; color: string; tip?: React.ReactNode }

/** Horizontal lollipop, one row per item, optional log axis and reference line. */
export default function Lollipop({ rows, title, subtitle, source, axisLabel, fmt = v => v.toFixed(0), log = false, reference, legend }: { rows: LolliRow[]; title: string; subtitle?: string; source: string; axisLabel: string; fmt?: (v: number) => string; log?: boolean; reference?: { value: number; label: string }; legend?: { label: string; color: string }[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rowH = 28
  const m = { top: 26, right: 70, bottom: 30, left: Math.min(230, Math.max(120, width * 0.3)) }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = rows.length * rowH
  const vals = rows.map(r => r.value)
  const x = log ? scaleLog().domain([Math.min(...vals) * 0.7, Math.max(...vals) * 1.3]).range([0, iw]) : scaleLinear().domain([0, Math.max(...vals) * 1.08]).range([0, iw])
  const x0 = log ? x.domain()[0] : 0
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      {legend && <Legend items={legend} />}
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {(log ? [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].filter(t => t >= x.domain()[0] && t <= x.domain()[1]) : x.ticks(5)).map(t => <g key={t} transform={`translate(${x(t)},0)`}><line y1={-4} y2={ih} stroke="var(--c-grid)" /><text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {reference && <g transform={`translate(${x(reference.value)},0)`}><line y1={-4} y2={ih} stroke="var(--c-text-2)" strokeDasharray="4 3" /><text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)" fontWeight={600}>{reference.label}</text></g>}
              {rows.map((r, i) => {
                const cy = i * rowH + rowH / 2
                return (
                  <g key={r.label}>
                    <text x={-10} y={cy + (r.sub ? 0 : 4)} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.label}</text>
                    {r.sub && <text x={-10} y={cy + 12} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}
                    <line x1={x(x0)} x2={x(r.value)} y1={cy} y2={cy} stroke={r.color} strokeWidth={2} opacity={0.55} />
                    <circle cx={x(r.value)} cy={cy} r={6} fill={r.color} stroke="var(--c-surface)" strokeWidth={1.5}
                      onMouseEnter={() => setTip({ x: x(r.value) + m.left, y: cy + m.top, content: r.tip ?? <><b>{r.label}</b><br />{fmt(r.value)}</> })} onMouseLeave={() => setTip(null)} />
                    <text x={x(r.value) + 11} y={cy + 4} fontSize={11} fill="var(--c-text-2)">{fmt(r.value)}</text>
                  </g>
                )
              })}
              <text x={iw} y={ih + 22} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{axisLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
