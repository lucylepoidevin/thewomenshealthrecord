import * as d3 from 'd3'
import { useState } from 'react'
import { useSize } from '../../../lib/useSize'
import { PROFILE_COLOR, clock, fmt, type Drug } from '../../lib/data'
import type { Curve } from '../../lib/pk'

export type Series = { key: string; name: string; curve: Curve; dashed?: boolean; color?: string }
type Props = { drug: Drug; series: Series[]; hoverHour: number | null; onHover: (h: number | null) => void }

/**
 * Blood concentration over one day for every selected body, with the night
 * shaded (11 pm to 7 am), dose times ticked, and the drug's reference line
 * where one is cited. Hover reads every curve at once.
 */
export default function ConcChart({ drug, series, hoverHour, onHover }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [pinned, setPinned] = useState(false)
  const w = Math.max(280, width), h = 300
  const m = { top: 20, right: 16, bottom: 30, left: 54 }
  const x = d3.scaleLinear().domain([0, 24]).range([m.left, w - m.right])
  const maxC = Math.max(...series.map(s => d3.max(s.curve.c) ?? 0), ...drug.reference_lines.map(r => r.value * 1.1)) * 1.08
  const y = d3.scaleLinear().domain([0, maxC]).range([h - m.bottom, m.top]).nice()
  const line = d3.line<number>().x((_, i) => x(series[0].curve.t[i])).y(v => y(v)).curve(d3.curveMonotoneX)
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pinned && e.type === 'pointermove') return
    const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
    const hh = x.invert(e.clientX - r.left)
    onHover(Math.max(0, Math.min(24, Math.round(hh * 10) / 10)))
  }
  return (
    <div ref={ref} className="w-full select-none">
      <svg width={w} height={h} onPointerMove={onPointer} onPointerDown={e => { setPinned(p => !p); onPointer(e) }} onPointerLeave={() => { if (!pinned) onHover(null) }} style={{ touchAction: 'none', cursor: 'crosshair' }}>
        <rect x={x(0)} y={m.top} width={x(7) - x(0)} height={h - m.top - m.bottom} fill="var(--c-band-2)" />
        <rect x={x(23)} y={m.top} width={x(24) - x(23)} height={h - m.top - m.bottom} fill="var(--c-band-2)" />
        <text x={x(3.5)} y={m.top + 12} textAnchor="middle" fontSize={9.5} fontWeight={700} letterSpacing="0.12em" fill="var(--c-text-2)">ASLEEP</text>
        {y.ticks(5).map(t => (
          <g key={t}>
            <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" strokeWidth={1} />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t}</text>
          </g>
        ))}
        <text x={m.left - 6} y={m.top - 8} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{drug.unit}</text>
        {drug.reference_lines.map(r => (
          <g key={r.label}>
            <line x1={m.left} x2={w - m.right} y1={y(r.value)} y2={y(r.value)} stroke="var(--c-text-2)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={m.left + 4} y={y(r.value) - 4} textAnchor="start" fontSize={10} fill="var(--c-text-2)">{r.label}</text>
          </g>
        ))}
        {drug.regimen.times.map(t => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={h - m.bottom} y2={h - m.bottom - 8} stroke="var(--c-emphasis)" strokeWidth={2} />
            <text x={x(t)} y={h - m.bottom - 11} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--c-emphasis)">dose</text>
          </g>
        ))}
        {series.map(s => (
          <path key={s.key} d={line(s.curve.c) ?? ''} fill="none" stroke={s.color ?? PROFILE_COLOR[s.key] ?? 'var(--c-text-2)'} strokeWidth={s.dashed ? 1.6 : 2.4} strokeDasharray={s.dashed ? '5 4' : undefined} />
        ))}
        {hoverHour != null && (
          <g>
            <line x1={x(hoverHour)} x2={x(hoverHour)} y1={m.top} y2={h - m.bottom} stroke="var(--c-emphasis)" strokeWidth={1} strokeDasharray="3 3" />
            {series.map(s => {
              const i = Math.round(hoverHour / (s.curve.t[1] - s.curve.t[0]))
              const v = s.curve.c[Math.min(i, s.curve.c.length - 1)]
              return <circle key={s.key} cx={x(hoverHour)} cy={y(v)} r={4.5} fill={s.color ?? PROFILE_COLOR[s.key] ?? 'var(--c-text-2)'} stroke="var(--c-surface)" strokeWidth={1.5} />
            })}
            <text x={x(hoverHour) + (hoverHour > 18 ? -6 : 6)} y={m.top + 12} textAnchor={hoverHour > 18 ? 'end' : 'start'} fontSize={10} fontWeight={700} fill="var(--c-text)">{clock(hoverHour)}</text>
          </g>
        )}
        {[0, 4, 8, 12, 16, 20, 24].map(t => <text key={t} x={x(t)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{t === 0 ? 'midnight' : t === 24 ? 'midnight' : clock(t)}</text>)}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-2 text-[11px] text-ink-2">
        {series.map(s => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded" style={{ background: s.color ?? PROFILE_COLOR[s.key] ?? 'var(--c-text-2)', opacity: s.dashed ? 0.7 : 1 }} />{s.name}
            {hoverHour != null && <span className="font-semibold text-ink"> {fmt.conc(s.curve.c[Math.min(Math.round(hoverHour / (s.curve.t[1] - s.curve.t[0])), s.curve.c.length - 1)], drug.unit)}</span>}
          </span>
        ))}
        {pinned && <span className="text-ink-3">(click to unpin)</span>}
      </div>
    </div>
  )
}
