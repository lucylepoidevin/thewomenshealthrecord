import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type SlopeRow = { label: string; short?: string; left: number; right: number; color: string; weight?: number; tip?: React.ReactNode }

/**
 * Slope chart: each row is a line from a left value to a right value on the same scale.
 * Built for "share of the disease that is women → share of the trials that are women":
 * the eye reads the tilt of every line at once, and the funnelling towards the middle.
 */
export default function SlopeChart({ rows, title, subtitle, source, leftLabel, rightLabel, fmt = v => `${v.toFixed(0)}%`, domain = [0, 100], reference, legend, labels = [] }: { rows: SlopeRow[]; title: string; subtitle?: string; source: string; leftLabel: string; rightLabel: string; fmt?: (v: number) => string; domain?: [number, number]; reference?: { value: number; label: string }; legend?: { label: string; color: string }[]; labels?: string[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const [hover, setHover] = useState<string | null>(null)
  const h = 520
  const narrow = width > 0 && width < 480
  const m = { top: 34, right: narrow ? 118 : Math.min(190, Math.max(120, width * 0.24)), bottom: 18, left: narrow ? 40 : Math.min(170, Math.max(100, width * 0.2)) }
  const iw = Math.max(0, width - m.left - m.right), ih = h - m.top - m.bottom
  const y = scaleLinear().domain(domain).range([ih, 0])
  const xl = 0, xr = iw
  // stack end labels so they do not overlap: greedy nudge in y order
  const place = (side: 'left' | 'right') => {
    const items = rows.filter(r => labels.includes(r.label) || r.label === hover).map(r => ({ r, y: y(side === 'left' ? r.left : r.right) })).sort((a, b) => a.y - b.y)
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 13) items[i].y = items[i - 1].y + 13
    return items
  }
  const L = narrow ? [] : place('left'), R = place('right')
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      {legend && <Legend items={legend} />}
      <div ref={ref} className="relative w-full" style={{ height: h }}>
        {width > 0 && (
          <svg width={width} height={h} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {y.ticks(5).map(t => <g key={t}><line x1={xl} x2={xr} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" /><text x={xl - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {reference && <g><line x1={xl} x2={xr} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--c-text-2)" strokeDasharray="4 3" /><text x={xr + 8} y={y(reference.value) + 4} fontSize={11} fill="var(--c-text-2)" fontWeight={600}>{reference.label}</text></g>}
              <line x1={xl} x2={xl} y1={0} y2={ih} stroke="var(--c-text-2)" /><line x1={xr} x2={xr} y1={0} y2={ih} stroke="var(--c-text-2)" />
              <text x={xl} y={-16} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--c-text)">{leftLabel}</text>
              <text x={xr} y={-16} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--c-text)">{rightLabel}</text>
              {rows.map(r => {
                const dim = hover && hover !== r.label
                return (
                  <g key={r.label} opacity={dim ? 0.18 : 1} onMouseEnter={e => { setHover(r.label); setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, content: r.tip ?? <><b>{r.label}</b><br />{fmt(r.left)} → {fmt(r.right)}</> }) }} onMouseLeave={() => { setHover(null); setTip(null) }} style={{ cursor: 'default' }}>
                    <line x1={xl} x2={xr} y1={y(r.left)} y2={y(r.right)} stroke="transparent" strokeWidth={10} />
                    <line x1={xl} x2={xr} y1={y(r.left)} y2={y(r.right)} stroke={r.color} strokeWidth={hover === r.label ? 3 : Math.max(1, Math.min(3, (r.weight ?? 1)))} opacity={hover === r.label ? 1 : 0.75} />
                    <circle cx={xl} cy={y(r.left)} r={3.5} fill={r.color} /><circle cx={xr} cy={y(r.right)} r={3.5} fill={r.color} />
                  </g>
                )
              })}
              {L.map(({ r, y: yy }) => <text key={'l' + r.label} x={xl - 34} y={yy + 4} textAnchor="end" fontSize={11} fill="var(--c-text)" fontWeight={hover === r.label ? 700 : 500}>{r.short ?? r.label}</text>)}
              {R.map(({ r, y: yy }) => <text key={'r' + r.label} x={xr + 10} y={yy + 4} fontSize={narrow ? 10 : 11} fill="var(--c-text)" fontWeight={hover === r.label ? 700 : 500}>{r.short ?? r.label} <tspan fill="var(--c-text-2)">{fmt(r.right)}</tspan></text>)}
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
