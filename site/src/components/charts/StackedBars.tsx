import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type StackRow = { label: string; sub?: string; parts: { key: string; value: number }[] }
export type StackSeries = { key: string; label: string; color: string }

/** Horizontal 100%-style stacked bars: one bar per row, segments in series order. */
export default function StackedBars({ rows, series, title, subtitle, source, axisLabel, fmt = v => `${v.toFixed(0)}%`, max = 100 }: { rows: StackRow[]; series: StackSeries[]; title: string; subtitle?: string; source: string; axisLabel: string; fmt?: (v: number) => string; max?: number }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rowH = 30
  const m = { top: 24, right: 16, bottom: 30, left: Math.min(200, Math.max(110, width * 0.26)) }
  const iw = Math.max(0, width - m.left - m.right), ih = rows.length * rowH
  const x = scaleLinear().domain([0, max]).range([0, iw])
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={series.map(s => ({ label: s.label, color: s.color }))} />
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks(5).map(t => <g key={t} transform={`translate(${x(t)},0)`}><line y1={-4} y2={ih} stroke="var(--c-grid)" /><text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {rows.map((r, i) => {
                const cy = i * rowH
                let acc = 0
                return (
                  <g key={r.label}>
                    <text x={-10} y={cy + rowH / 2 + (r.sub ? 0 : 4)} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.label}</text>
                    {r.sub && <text x={-10} y={cy + rowH / 2 + 12} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}
                    {series.map(s => {
                      const v = r.parts.find(p => p.key === s.key)?.value ?? 0
                      const x0 = acc; acc += v
                      if (v <= 0) return null
                      return <g key={s.key} onMouseEnter={() => setTip({ x: x(x0 + v / 2) + m.left, y: cy + m.top, content: <><b>{r.label}</b><br />{s.label}: {fmt(v)}</> })} onMouseLeave={() => setTip(null)}>
                        <rect x={x(x0)} y={cy + 4} width={Math.max(0, x(x0 + v) - x(x0) - 1)} height={rowH - 8} fill={s.color} rx={2} />
                        {x(v) > 30 && <text x={x(x0 + v / 2)} y={cy + rowH / 2 + 4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#fff">{fmt(v)}</text>}
                      </g>
                    })}
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
