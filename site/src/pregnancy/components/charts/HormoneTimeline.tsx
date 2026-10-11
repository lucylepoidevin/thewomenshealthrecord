import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { HORMONE_META, STAGES, weekScale, type Session } from '../../lib/data'

type Key = 'estradiol' | 'progesterone'
type Props = { sessions: Session[]; current: number; onSession: (s: number) => void }

/**
 * Estradiol and progesterone across the whole arc, on a linear scale so the
 * size of pregnancy's surge is not hidden. Sessions without an assay are
 * simply absent. Pointer scrubbing snaps to the nearest scanned session.
 */
export default function HormoneTimeline({ sessions, current, onSession }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const keys: Key[] = ['estradiol', 'progesterone']
  const rowH = 96
  const m = { top: 26, right: 14, bottom: 26, left: 54 }
  const w = Math.max(260, width)
  const h = m.top + keys.length * rowH + m.bottom
  const x = weekScale(m.left, w - m.right)
  const cur = sessions.find(s => s.session === current)
  const nearest = (px: number) => sessions.reduce((a, b) => Math.abs(x(b.week) - px) < Math.abs(x(a.week) - px) ? b : a).session

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    onSession(nearest(e.clientX - r.left))
  }

  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {STAGES.map((p, i) => (
          <g key={p.key}>
            <rect x={x(p.from)} y={m.top - 14} width={x(p.to) - x(p.from)} height={h - m.top - m.bottom + 14} fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />
            <text x={(x(p.from) + x(p.to)) / 2} y={m.top - 10} textAnchor="middle" fontSize={9.5} fontWeight={700} letterSpacing="0.12em" fill="var(--c-text-2)">
              {(x(p.to) - x(p.from)) > p.short.length * 8.5 ? p.short.toUpperCase() : p.short[0]}
            </text>
          </g>
        ))}
        <line x1={x.breakX} x2={x.breakX} y1={m.top - 14} y2={h - m.bottom + 4} stroke="var(--c-emphasis)" strokeWidth={1} opacity={0.5} />
        <text x={x.breakX} y={h - 8} textAnchor="middle" fontSize={9} fontWeight={700} letterSpacing="0.1em" fill="var(--c-emphasis)">BIRTH</text>
        {keys.map((k, i) => {
          const top = m.top + i * rowH
          const pts = sessions.filter(s => s.hormones[k] != null)
          const y = d3.scaleLinear().domain([0, (d3.max(pts, s => s.hormones[k]!) ?? 1) * 1.08]).range([top + rowH - 10, top + 14]).nice()
          const line = d3.line<Session>().x(s => x(s.week)).y(s => y(s.hormones[k]!)).curve(d3.curveMonotoneX)
          const area = d3.area<Session>().x(s => x(s.week)).y0(y(0)).y1(s => y(s.hormones[k]!)).curve(d3.curveMonotoneX)
          const meta = HORMONE_META[k]
          return (
            <g key={k}>
              {y.ticks(2).map(t => (
                <g key={t}>
                  <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" strokeWidth={1} />
                  <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t >= 1000 ? `${t / 1000}k` : t}</text>
                </g>
              ))}
              <path d={area(pts) ?? ''} fill={meta.color} opacity={0.12} />
              <path d={line(pts) ?? ''} fill="none" stroke={meta.color} strokeWidth={2} />
              {pts.map(s => (
                <circle key={s.session} cx={x(s.week)} cy={y(s.hormones[k]!)} r={s.session === current ? 4.5 : 2.2} fill={s.session === current ? meta.color : 'var(--c-surface)'} stroke={meta.color} strokeWidth={1.4} />
              ))}
              <text x={m.left} y={top + 9} fontSize={11} fontWeight={700} fill={meta.color}>{meta.name}
                <tspan fontWeight={500} fill="var(--c-text-2)"> {meta.unit}</tspan>
                {cur && <tspan fontWeight={700} fill="var(--c-text)">  {cur.hormones[k] == null ? 'not assayed' : cur.hormones[k]!.toLocaleString('en-US', { maximumFractionDigits: 2 })}</tspan>}
              </text>
            </g>
          )
        })}
        {cur && <line x1={x(cur.week)} x2={x(cur.week)} y1={m.top - 14} y2={h - m.bottom + 4} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />}
        {[0, 10, 20, 30].map(t => <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t === 0 ? 'wk 0' : t}</text>)}
        {[66, 92, 144].map(t => <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t === 66 ? '+6 mo' : t === 92 ? '+1 yr' : '+2 yr'}</text>)}
      </svg>
    </div>
  )
}
