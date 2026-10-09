import { scaleLinear, line as d3line } from 'd3'
import ChartFrame from './ChartFrame'

export type Multiple = { label: string; color: string; points: { x: number; y: number }[]; note?: string }

/**
 * A grid of small line charts on a shared y scale, one panel per series,
 * with the first and last values printed. Reads as a contact sheet.
 */
export default function SmallMultiples({ panels, title, subtitle, source, yLabel, fmt = v => `${v.toFixed(0)}%`, domain = [0, 100], reference, }: { panels: Multiple[]; title: string; subtitle?: string; source: string; yLabel: string; fmt?: (v: number) => string; domain?: [number, number]; reference?: { value: number; label: string } }) {
  const w = 220, h = 120
  const m = { top: 10, right: 8, bottom: 20, left: 8 }
  const iw = w - m.left - m.right, ih = h - m.top - m.bottom
  const y = scaleLinear().domain(domain).range([ih, 0])
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div className="grid gap-x-4 gap-y-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.min(w, 180)}px, 1fr))` }}>
        {panels.map(p => {
          const xs = p.points.map(q => q.x)
          const x = scaleLinear().domain([Math.min(...xs), Math.max(...xs)]).range([0, iw])
          const path = d3line<{ x: number; y: number }>().x(q => x(q.x)).y(q => y(q.y))(p.points) ?? ''
          const first = p.points[0], last = p.points[p.points.length - 1]
          return (
            <div key={p.label}>
              <p className="text-[12px] font-semibold text-ink leading-tight">{p.label}</p>
              <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={`${p.label}: ${fmt(first.y)} in ${first.x} to ${fmt(last.y)} in ${last.x}`}>
                <g transform={`translate(${m.left},${m.top})`}>
                  {reference && <line x1={0} x2={iw} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--c-text-2)" strokeDasharray="3 3" opacity={0.6} />}
                  <line x1={0} x2={iw} y1={ih} y2={ih} stroke="var(--c-grid)" />
                  <path d={path} fill="none" stroke={p.color} strokeWidth={2.2} />
                  <circle cx={x(first.x)} cy={y(first.y)} r={3} fill={p.color} /><circle cx={x(last.x)} cy={y(last.y)} r={3} fill={p.color} />
                  <text x={x(first.x) + 4} y={y(first.y) - 6} fontSize={11} fill="var(--c-text-2)">{fmt(first.y)}</text>
                  <text x={x(last.x) - 4} y={y(last.y) - 6} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--c-text)">{fmt(last.y)}</text>
                  <text x={0} y={ih + 14} fontSize={10} fill="var(--c-text-2)">{first.x}</text>
                  <text x={iw} y={ih + 14} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{last.x}</text>
                </g>
              </svg>
              {p.note && <p className="text-[11px] text-ink-3 leading-snug -mt-1">{p.note}</p>}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-3">{yLabel}. Shared scale {fmt(domain[0])} to {fmt(domain[1])}{reference ? `; dotted line at ${reference.label}` : ''}.</p>
    </ChartFrame>
  )
}
