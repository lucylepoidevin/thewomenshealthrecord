import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type StripRow = { label: string; sub?: string; marks: { key: string; value: number | null; tip?: React.ReactNode }[]; tick?: { value: number; label?: string }; arrow?: [number, number] }
export type StripSeries = { key: string; label: string; color: string; shape?: 'dot' | 'diamond' | 'square' }

/**
 * One row per item, several marks on a shared axis, an optional vertical tick
 * (the yardstick) and an optional arrow from one value to another. Built for
 * "industry, academic and NIH trials against the burden share" and for
 * "share of burden after 65 → share of trial participants over 65".
 */
export default function StripPlot({ rows, series, title, subtitle, source, axisLabel, tickLabel, fmt = v => `${v.toFixed(0)}%`, domain = [0, 100], arrowColor = 'var(--c-emphasis)', arrowLegend }: { rows: StripRow[]; series: StripSeries[]; title: string; subtitle?: string; source: string; axisLabel: string; tickLabel?: string; fmt?: (v: number) => string; domain?: [number, number]; arrowColor?: string; arrowLegend?: string }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rowH = 30
  const m = { top: 26, right: 24, bottom: 30, left: Math.min(230, Math.max(width < 480 ? 92 : 120, width * 0.3)) }
  const iw = Math.max(0, width - m.left - m.right), ih = rows.length * rowH
  const x = scaleLinear().domain(domain).range([0, iw])
  const shape = (s: StripSeries, cx: number, cy: number, extra: object) => s.shape === 'diamond'
    ? <path d={`M${cx},${cy - 6} L${cx + 6},${cy} L${cx},${cy + 6} L${cx - 6},${cy} Z`} fill={s.color} stroke="var(--c-surface)" strokeWidth={1.5} {...extra} />
    : s.shape === 'square' ? <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={s.color} stroke="var(--c-surface)" strokeWidth={1.5} {...extra} />
    : <circle cx={cx} cy={cy} r={5.5} fill={s.color} stroke="var(--c-surface)" strokeWidth={1.5} {...extra} />
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[...series.map(s => ({ label: s.label, color: s.color })), ...(tickLabel ? [{ label: tickLabel, color: 'var(--c-text)' }] : []), ...(arrowLegend ? [{ label: arrowLegend, color: arrowColor }] : [])]} />
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <defs><marker id="strip-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={arrowColor} /></marker></defs>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks(5).map(t => <g key={t} transform={`translate(${x(t)},0)`}><line y1={-4} y2={ih} stroke="var(--c-grid)" /><text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {rows.map((r, i) => {
                const cy = i * rowH + rowH / 2
                return (
                  <g key={r.label}>
                    {i % 2 === 1 && <rect x={-m.left + 4} y={i * rowH} width={iw + m.left - 4} height={rowH} fill="rgba(139,30,75,0.03)" />}
                    <text x={-10} y={cy + (r.sub ? 0 : 4)} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.label}</text>
                    {r.sub && <text x={-10} y={cy + 12} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}
                    {r.arrow && Math.abs(r.arrow[1] - r.arrow[0]) > 0.5 && <line x1={x(r.arrow[0])} x2={x(r.arrow[1])} y1={cy} y2={cy} stroke={arrowColor} strokeWidth={2} markerEnd="url(#strip-arrow)" opacity={0.85} />}
                    {r.tick && <g><line x1={x(r.tick.value)} x2={x(r.tick.value)} y1={cy - 10} y2={cy + 10} stroke="var(--c-text)" strokeWidth={2} /></g>}
                    {r.marks.map(mk => {
                      const s = series.find(ss => ss.key === mk.key)
                      if (!s || mk.value == null) return null
                      return <g key={mk.key} onMouseEnter={() => setTip({ x: x(mk.value!) + m.left, y: cy + m.top, content: mk.tip ?? <><b>{r.label}</b><br />{s.label}: {fmt(mk.value!)}</> })} onMouseLeave={() => setTip(null)}>{shape(s, x(mk.value), cy, {})}</g>
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
