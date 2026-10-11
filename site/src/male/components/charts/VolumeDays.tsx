import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { BLOCKS, dayX, fmt, type Session, type RegionStats } from '../../lib/data'

type Props = { sessions: Session[]; current: number; onSession: (s: number) => void; regionKey: string; regionName: string; stats?: RegionStats }

/**
 * The region's volume at each of the 40 scans as percent of its 30-day mean.
 * Mornings filled, evenings hollow; on the ten double days a thin tie joins
 * the pair so the morning-to-evening change is visible scan by scan.
 */
export default function VolumeDays({ sessions, current, onSession, regionKey, regionName, stats }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(260, width), h = 170
  const m = { top: 22, right: 14, bottom: 22, left: 50 }
  const pts = sessions.filter(s => s.has_scan)
  const mean = stats?.mean ?? d3.mean(pts, s => s.volumes[regionKey]) ?? 1
  const dev = (s: Session) => (s.volumes[regionKey] / mean - 1) * 100
  const maxAbs = Math.max(3, (d3.max(pts, s => Math.abs(dev(s))) ?? 0) * 1.15)
  const x = d3.scaleLinear().domain([0.5, 30.5]).range([m.left, w - m.right])
  const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([h - m.bottom, m.top])
  const am = pts.filter(s => s.time === 'morning'), pm = pts.filter(s => s.time === 'evening')
  const line = d3.line<Session>().x(s => x(dayX(s))).y(s => y(dev(s))).curve(d3.curveMonotoneX)
  const cur = pts.find(s => s.session === current)
  const nearest = (px: number) => sessions.reduce((a, b) => Math.abs(x(dayX(b)) - px) < Math.abs(x(dayX(a)) - px) ? b : a).session
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    onSession(nearest(e.clientX - r.left))
  }
  const pairs = am.map(a => [a, pm.find(p => p.day === a.day)]).filter((p): p is [Session, Session] => !!p[1])
  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {BLOCKS.map((b, i) => <rect key={b.key} x={x(b.from - 0.5)} y={m.top - 6} width={x(b.to + 0.5) - x(b.from - 0.5)} height={h - m.top - m.bottom + 6} fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />)}
        {y.ticks(4).map(t => (
          <g key={t}>
            <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--c-muted)' : 'var(--c-grid)'} strokeWidth={t === 0 ? 1.2 : 1} />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t > 0 ? '+' : ''}{t}%</text>
          </g>
        ))}
        {stats && <rect x={m.left} y={y(stats.cv_pct)} width={w - m.left - m.right} height={y(-stats.cv_pct) - y(stats.cv_pct)} fill="var(--c-region)" opacity={0.07} />}
        <path d={line(am) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.3} opacity={0.55} />
        <path d={line(pm) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.1} strokeDasharray="3 3" opacity={0.55} />
        {pairs.map(([a, p]) => <line key={a.day} x1={x(dayX(a))} x2={x(dayX(p))} y1={y(dev(a))} y2={y(dev(p))} stroke="var(--c-emphasis)" strokeWidth={1} opacity={0.6} />)}
        {pts.map(s => (
          <circle key={s.session} cx={x(dayX(s))} cy={y(dev(s))} r={s.session === current ? 5 : 3}
            fill={s.time === 'morning' ? 'var(--c-emphasis)' : 'var(--c-surface)'} stroke="var(--c-emphasis)" strokeWidth={1.3} />
        ))}
        {cur && <line x1={x(dayX(cur))} x2={x(dayX(cur))} y1={m.top - 6} y2={h - m.bottom} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />}
        <text x={m.left} y={12} fontSize={11} fontWeight={700} fill="var(--c-emphasis)">{regionName}
          <tspan fontWeight={500} fill="var(--c-text-2)">{w < 480 ? ' vs mean' : ' volume vs 30-day mean'}</tspan>
          {cur && <tspan fontWeight={700} fill="var(--c-text)">  {fmt.cm3(cur.volumes[regionKey])} cm³ ({fmt.pct(dev(cur))})</tspan>}
        </text>
        {[1, 5, 10, 15, 20, 25, 30].map(t => <text key={t} x={x(t)} y={h - 6} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t}</text>)}
      </svg>
    </div>
  )
}
