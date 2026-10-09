import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { HORMONE_META, PHASES, type Day } from '../../lib/data'

type Key = 'estradiol' | 'progesterone' | 'lh' | 'fsh'

type Props = { days: Day[]; day: number; onDay: (d: number) => void; keys?: Key[]; compact?: boolean }

/**
 * Daily serum hormones as stacked small multiples sharing one day axis,
 * with the cycle phases shaded behind and a cursor on the selected day.
 * Pointer moves over the chart scrub the day.
 */
export default function HormoneChart({ days, day, onDay, keys = ['estradiol', 'progesterone', 'lh', 'fsh'], compact = false }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const rowH = compact ? 64 : 88
  const m = { top: 26, right: 14, bottom: 26, left: 48 }
  const w = Math.max(240, width)
  const h = m.top + keys.length * rowH + m.bottom
  const x = d3.scaleLinear().domain([1, 30]).range([m.left, w - m.right])
  const cur = days.find(d => d.day === day)

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    const d = Math.round(x.invert(e.clientX - r.left))
    onDay(Math.max(1, Math.min(30, d)))
  }

  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {/* phase bands */}
        {PHASES.map((p, i) => (
          <g key={p.key}>
            <rect x={x(p.from - 0.5)} y={m.top - 14} width={x(p.to + 0.5) - x(p.from - 0.5)} height={h - m.top - m.bottom + 14}
              fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />
            <text x={(x(p.from - 0.5) + x(p.to + 0.5)) / 2} y={m.top - 10} textAnchor="middle" fontSize={9.5} fontWeight={700} letterSpacing="0.12em" fill="var(--c-text-2)">
              {x(p.to + 0.5) - x(p.from - 0.5) > p.short.length * 8.5 ? p.short.toUpperCase() : p.short[0]}
            </text>
          </g>
        ))}
        {keys.map((k, i) => {
          const top = m.top + i * rowH
          const vals = days.map(d => d.hormones[k]).filter((v): v is number => v != null)
          const y = d3.scaleLinear().domain([0, d3.max(vals)! * 1.08]).range([top + rowH - 10, top + 14]).nice()
          const line = d3.line<Day>().defined(d => d.hormones[k] != null).x(d => x(d.day)).y(d => y(d.hormones[k]!)).curve(d3.curveMonotoneX)
          const area = d3.area<Day>().defined(d => d.hormones[k] != null).x(d => x(d.day)).y0(y(0)).y1(d => y(d.hormones[k]!)).curve(d3.curveMonotoneX)
          const meta = HORMONE_META[k]
          const ticks = y.ticks(2)
          return (
            <g key={k}>
              {ticks.map(t => (
                <g key={t}>
                  <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" strokeWidth={1} />
                  <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t}</text>
                </g>
              ))}
              <path d={area(days) ?? ''} fill={meta.color} opacity={0.12} />
              <path d={line(days) ?? ''} fill="none" stroke={meta.color} strokeWidth={2} />
              {days.map(d => d.hormones[k] != null && (
                <circle key={d.day} cx={x(d.day)} cy={y(d.hormones[k]!)} r={d.day === day ? 4.5 : 2} fill={d.day === day ? meta.color : 'var(--c-surface)'} stroke={meta.color} strokeWidth={1.4} />
              ))}
              <text x={m.left} y={top + 9} fontSize={11} fontWeight={700} fill={meta.color}>{meta.name}
                <tspan fontWeight={500} fill="var(--c-text-2)"> {meta.unit}</tspan>
                {cur && <tspan fontWeight={700} fill="var(--c-text)">  {cur.hormones[k] == null ? 'not assayed' : cur.hormones[k]!.toLocaleString('en-US', { maximumFractionDigits: 2 })}</tspan>}
              </text>
            </g>
          )
        })}
        {/* cursor */}
        <line x1={x(day)} x2={x(day)} y1={m.top - 14} y2={h - m.bottom + 4} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />
        {/* day axis */}
        {[1, 5, 10, 15, 20, 25, 30].map(t => (
          <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t}</text>
        ))}
        <text x={w - m.right} y={h - 8} textAnchor="end" fontSize={9} fill="var(--c-text-2)" opacity={0.8}> </text>
        <text x={m.left} y={h - 8} textAnchor="start" fontSize={9} fontWeight={700} letterSpacing="0.1em" fill="var(--c-text-2)" dx={-m.left + 4}>DAY</text>
      </svg>
    </div>
  )
}
