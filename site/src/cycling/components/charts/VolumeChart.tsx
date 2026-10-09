import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { PHASES, phaseOf, fmt, type Day, type RegionStats } from '../../lib/data'

type Props = { days: Day[]; day: number; onDay: (d: number) => void; regionKey: string; regionName: string; stats?: RegionStats }

const PHASE_COLOR: Record<string, string> = {
  'late-luteal': 'var(--c-progesterone)', menstrual: 'var(--c-muted)', follicular: 'var(--c-estradiol)', ovulatory: 'var(--c-emphasis)', luteal: 'var(--c-progesterone)',
}

/**
 * The chosen region's volume on each day, as percent deviation from its
 * 30-day mean. Dots take the colour of the cycle phase. The y-axis is held
 * to at least ±3% so a flat line looks flat.
 */
export default function VolumeChart({ days, day, onDay, regionKey, regionName, stats }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(240, width), h = 150
  const m = { top: 22, right: 14, bottom: 22, left: 48 }
  const pts = days.filter(d => d.has_scan && d.volumes[regionKey] != null)
  const mean = stats?.mean ?? d3.mean(pts, d => d.volumes[regionKey]) ?? 1
  const dev = (d: Day) => (d.volumes[regionKey] / mean - 1) * 100
  const maxAbs = Math.max(3, (d3.max(pts, d => Math.abs(dev(d))) ?? 0) * 1.15)
  const x = d3.scaleLinear().domain([1, 30]).range([m.left, w - m.right])
  const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([h - m.bottom, m.top])
  const line = d3.line<Day>().x(d => x(d.day)).y(d => y(dev(d))).curve(d3.curveMonotoneX)
  const cur = pts.find(d => d.day === day)

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    onDay(Math.max(1, Math.min(30, Math.round(x.invert(e.clientX - r.left)))))
  }

  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {PHASES.map((p, i) => (
          <rect key={p.key} x={x(p.from - 0.5)} y={m.top - 6} width={x(p.to + 0.5) - x(p.from - 0.5)} height={h - m.top - m.bottom + 6}
            fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />
        ))}
        {y.ticks(4).map(t => (
          <g key={t}>
            <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--c-muted)' : 'var(--c-grid)'} strokeWidth={t === 0 ? 1.2 : 1} />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t > 0 ? '+' : ''}{t}%</text>
          </g>
        ))}
        {stats && (
          <rect x={m.left} y={y(stats.sd / mean * 100)} width={w - m.left - m.right} height={y(-stats.sd / mean * 100) - y(stats.sd / mean * 100)} fill="var(--c-region)" opacity={0.07} />
        )}
        <path d={line(pts) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.4} opacity={0.6} />
        {pts.map(d => (
          <circle key={d.day} cx={x(d.day)} cy={y(dev(d))} r={d.day === day ? 5 : 3} fill={PHASE_COLOR[phaseOf(d.day).key]} stroke="var(--c-surface)" strokeWidth={1.2} />
        ))}
        <line x1={x(day)} x2={x(day)} y1={m.top - 6} y2={h - m.bottom} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />
        <text x={m.left} y={12} fontSize={11} fontWeight={700} fill="var(--c-emphasis)">{regionName}
          <tspan fontWeight={500} fill="var(--c-text-2)">{w < 480 ? ' vs mean' : ' volume vs 30-day mean'}</tspan>
          {cur && <tspan fontWeight={700} fill="var(--c-text)">  {fmt.cm3(cur.volumes[regionKey])} cm³ ({fmt.pct(dev(cur))})</tspan>}
          {!cur && <tspan fontWeight={500} fill="var(--c-text-2)">  no scan measured for this day</tspan>}
        </text>
        {[1, 5, 10, 15, 20, 25, 30].map(t => (
          <text key={t} x={x(t)} y={h - 6} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t}</text>
        ))}
      </svg>
    </div>
  )
}
