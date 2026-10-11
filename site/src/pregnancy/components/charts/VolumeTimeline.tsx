import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { STAGES, fmt, pctFrom, stageOf, weekScale, type Session } from '../../lib/data'

type Props = { sessions: Session[]; current: number; onSession: (s: number) => void; regionKey: string; regionName: string; ref_: number; refLabel: string }

const STAGE_COLOR: Record<string, string> = { pre: 'var(--c-muted)', first: 'var(--c-estradiol)', second: 'var(--c-estradiol)', third: 'var(--c-emphasis)', post: 'var(--c-progesterone)' }

/**
 * The chosen region's volume at every scan as percent change from the
 * reference. The y-axis never shrinks below ±4% so a flat line looks flat;
 * the retest pair (sessions 26 and 27, a day apart on two scanners) is
 * joined by a bracket so the reader can see pure measurement noise.
 */
export default function VolumeTimeline({ sessions, current, onSession, regionKey, regionName, ref_, refLabel }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(260, width), h = 190
  const m = { top: 24, right: 14, bottom: 22, left: 54 }
  const pts = sessions.filter(s => s.has_scan && s.volumes[regionKey] != null)
  const dev = (s: Session) => pctFrom(ref_, s, regionKey)
  const maxAbs = Math.max(4, (d3.max(pts, s => Math.abs(dev(s))) ?? 0) * 1.15)
  const x = weekScale(m.left, w - m.right)
  const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([h - m.bottom, m.top])
  const main = pts.filter(s => s.session !== 27)
  const line = d3.line<Session>().x(s => x(s.week)).y(s => y(dev(s))).curve(d3.curveMonotoneX)
  const cur = pts.find(s => s.session === current)
  const s26 = pts.find(s => s.session === 26), s27 = pts.find(s => s.session === 27)
  const nearest = (px: number) => sessions.reduce((a, b) => Math.abs(x(b.week) - px) < Math.abs(x(a.week) - px) ? b : a).session

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    onSession(nearest(e.clientX - r.left))
  }

  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {STAGES.map((p, i) => <rect key={p.key} x={x(p.from)} y={m.top - 6} width={x(p.to) - x(p.from)} height={h - m.top - m.bottom + 6} fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />)}
        <line x1={x.breakX} x2={x.breakX} y1={m.top - 6} y2={h - m.bottom} stroke="var(--c-emphasis)" strokeWidth={1} opacity={0.5} />
        {y.ticks(4).map(t => (
          <g key={t}>
            <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--c-muted)' : 'var(--c-grid)'} strokeWidth={t === 0 ? 1.2 : 1} />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t > 0 ? '+' : ''}{t}%</text>
          </g>
        ))}
        <path d={line(main) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.4} opacity={0.6} />
        {s26 && s27 && (
          <g>
            <line x1={x(s26.week) + 6} x2={x(s26.week) + 6} y1={y(dev(s26))} y2={y(dev(s27))} stroke="var(--c-text-2)" strokeWidth={1} strokeDasharray="2 2" />
            <text x={x(s26.week) + 9} y={(y(dev(s26)) + y(dev(s27))) / 2} dy="0.32em" fontSize={9} fill="var(--c-text-2)">retest</text>
          </g>
        )}
        {pts.map(s => (
          <circle key={s.session} cx={x(s.week) + (s.session === 27 ? 6 : 0)} cy={y(dev(s))} r={s.session === current ? 5 : 3}
            fill={s.session === 27 ? 'var(--c-surface)' : STAGE_COLOR[stageOf(s.week).key]} stroke={s.session === 27 ? 'var(--c-text-2)' : 'var(--c-surface)'} strokeWidth={1.2} />
        ))}
        {cur && <line x1={x(cur.week) + (cur.session === 27 ? 6 : 0)} x2={x(cur.week) + (cur.session === 27 ? 6 : 0)} y1={m.top - 6} y2={h - m.bottom} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />}
        <text x={m.left} y={12} fontSize={11} fontWeight={700} fill="var(--c-emphasis)">{regionName}
          <tspan fontWeight={500} fill="var(--c-text-2)">{w < 480 ? ' vs ' : ' volume vs '}{refLabel}</tspan>
          {cur && <tspan fontWeight={700} fill="var(--c-text)">  {fmt.cm3(cur.volumes[regionKey])} cm³ ({fmt.pct(dev(cur))})</tspan>}
        </text>
        {[0, 10, 20, 30].map(t => <text key={t} x={x(t)} y={h - 6} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t === 0 ? 'wk 0' : t}</text>)}
        {[66, 92, 144].map(t => <text key={t} x={x(t)} y={h - 6} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t === 66 ? '+6 mo' : t === 92 ? '+1 yr' : '+2 yr'}</text>)}
      </svg>
    </div>
  )
}
