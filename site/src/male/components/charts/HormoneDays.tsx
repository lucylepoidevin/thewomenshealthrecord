import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { BLOCKS, HORMONE_META, dayX, type Session } from '../../lib/data'

type Key = 'testosterone' | 'cortisol' | 'estradiol'
type Props = { sessions: Session[]; current: number; onSession: (s: number) => void }

/**
 * Testosterone, cortisol and estradiol across the 30 days. Morning draws are
 * filled dots joined by a line, evening draws hollow dots joined by a dashed
 * one, so the daily rhythm reads as two bands rather than a zigzag.
 */
export default function HormoneDays({ sessions, current, onSession }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const keys: Key[] = ['testosterone', 'cortisol', 'estradiol']
  const rowH = 80
  const m = { top: 26, right: 14, bottom: 26, left: 50 }
  const w = Math.max(260, width)
  const h = m.top + keys.length * rowH + m.bottom
  const x = d3.scaleLinear().domain([0.5, 30.5]).range([m.left, w - m.right])
  const cur = sessions.find(s => s.session === current)
  const nearest = (px: number) => sessions.reduce((a, b) => Math.abs(x(dayX(b)) - px) < Math.abs(x(dayX(a)) - px) ? b : a).session
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    onSession(nearest(e.clientX - r.left))
  }
  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerDown={onPointer} onPointerMove={onPointer} style={{ touchAction: 'none', cursor: 'col-resize' }}>
        {BLOCKS.map((b, i) => (
          <g key={b.key}>
            <rect x={x(b.from - 0.5)} y={m.top - 14} width={x(b.to + 0.5) - x(b.from - 0.5)} height={h - m.top - m.bottom + 14} fill={i % 2 ? 'var(--c-band-2)' : 'var(--c-band)'} />
            <text x={(x(b.from - 0.5) + x(b.to + 0.5)) / 2} y={m.top - 10} textAnchor="middle" fontSize={9.5} fontWeight={700} letterSpacing="0.12em" fill="var(--c-text-2)">
              {(x(b.to + 0.5) - x(b.from - 0.5)) > b.short.length * 7.5 ? b.short.toUpperCase() : b.name.split(' ')[0].toUpperCase()}
            </text>
          </g>
        ))}
        {keys.map((k, i) => {
          const top = m.top + i * rowH
          const pts = sessions.filter(s => s.hormones[k] != null)
          const am = pts.filter(s => s.time === 'morning'), pm = pts.filter(s => s.time === 'evening')
          const y = d3.scaleLinear().domain([0, (d3.max(pts, s => s.hormones[k]!) ?? 1) * 1.08]).range([top + rowH - 10, top + 14]).nice()
          const line = d3.line<Session>().x(s => x(dayX(s))).y(s => y(s.hormones[k]!)).curve(d3.curveMonotoneX)
          const meta = HORMONE_META[k]
          return (
            <g key={k}>
              {y.ticks(2).map(t => (
                <g key={t}>
                  <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" strokeWidth={1} />
                  <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t}</text>
                </g>
              ))}
              <path d={line(am) ?? ''} fill="none" stroke={meta.color} strokeWidth={1.8} />
              <path d={line(pm) ?? ''} fill="none" stroke={meta.color} strokeWidth={1.4} strokeDasharray="3 3" opacity={0.8} />
              {pts.map(s => (
                <circle key={s.session} cx={x(dayX(s))} cy={y(s.hormones[k]!)} r={s.session === current ? 4.5 : 2.4}
                  fill={s.time === 'morning' || s.session === current ? meta.color : 'var(--c-surface)'} stroke={meta.color} strokeWidth={1.4} />
              ))}
              <text x={m.left} y={top + 9} fontSize={11} fontWeight={700} fill={meta.color}>{meta.name}
                <tspan fontWeight={500} fill="var(--c-text-2)"> {meta.unit}</tspan>
                {cur && <tspan fontWeight={700} fill="var(--c-text)">  {cur.hormones[k] == null ? 'no draw this session' : cur.hormones[k]!.toLocaleString('en-US', { maximumFractionDigits: 2 })}</tspan>}
              </text>
            </g>
          )
        })}
        {cur && <line x1={x(dayX(cur))} x2={x(dayX(cur))} y1={m.top - 14} y2={h - m.bottom + 4} stroke="var(--c-emphasis)" strokeWidth={1.2} strokeDasharray="3 3" />}
        {[1, 5, 10, 15, 20, 25, 30].map(t => <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t}</text>)}
        <text x={4} y={h - 8} fontSize={9} fontWeight={700} letterSpacing="0.1em" fill="var(--c-text-2)">DAY</text>
      </svg>
      <div className="-mt-1 flex justify-end gap-4 pr-3 text-[10px] text-ink-2">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-ink-2 align-middle" />7 am, filled</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full border border-ink-2 align-middle" />8 pm, hollow</span>
      </div>
    </div>
  )
}
