import * as d3 from 'd3'
import { useSize } from '../../../lib/useSize'
import { DENSITIES, LETTER, SHORT } from '../../lib/data'

type Props = { rows: { label: string; v: (number | null)[] }[]; unit: string; threshold?: number; thresholdLabel?: string; max?: number; fmt?: (v: number) => string }

const SHADE = ['#5A5057', '#8C7A84', '#C58AA4', '#E6A9C1']

/** Grouped bars: one group per row (an age band or risk band), one bar per BI-RADS density A to D. */
export default function DensityBars({ rows, unit, threshold, thresholdLabel, max, fmt = v => String(v) }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(300, width), h = 290
  const m = { top: 24, right: 12, bottom: 34, left: 40 }
  const x0 = d3.scaleBand().domain(rows.map(r => r.label)).range([m.left, w - m.right]).paddingInner(0.28).paddingOuter(0.1)
  const x1 = d3.scaleBand().domain(DENSITIES).range([0, x0.bandwidth()]).padding(0.12)
  const top = max ?? (d3.max(rows.flatMap(r => r.v.filter((v): v is number => v != null))) ?? 1) * 1.12
  const y = d3.scaleLinear().domain([0, top]).range([h - m.bottom, m.top]).nice()
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={h}>
        {y.ticks(4).map(t => (
          <g key={t}>
            <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t}</text>
          </g>
        ))}
        <text x={m.left - 6} y={m.top - 10} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{unit}</text>
        {threshold != null && (
          <g>
            <line x1={m.left} x2={w - m.right} y1={y(threshold)} y2={y(threshold)} stroke="var(--c-text-2)" strokeDasharray="2 4" />
            {thresholdLabel && <text x={w - m.right} y={y(threshold) - 4} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{thresholdLabel}</text>}
          </g>
        )}
        {rows.map(r => (
          <g key={r.label} transform={`translate(${x0(r.label)},0)`}>
            {DENSITIES.map((d, i) => r.v[i] == null ? (
              <text key={d} x={(x1(d) ?? 0) + x1.bandwidth() / 2} y={h - m.bottom - 6} textAnchor="middle" fontSize={9} fill="var(--c-text-2)">n/a</text>
            ) : (
              <g key={d}>
                <rect x={x1(d)} y={y(r.v[i]!)} width={x1.bandwidth()} height={h - m.bottom - y(r.v[i]!)} fill={SHADE[i]} />
                <text x={(x1(d) ?? 0) + x1.bandwidth() / 2} y={y(r.v[i]!) - 4} textAnchor="middle" fontSize={9.5} fill="var(--c-text)">{fmt(r.v[i]!)}</text>
              </g>
            ))}
            <text x={x0.bandwidth() / 2} y={h - m.bottom + 16} textAnchor="middle" fontSize={11} fill="var(--c-text)">{r.label}</text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-2 text-[11px] text-ink-2">
        {DENSITIES.map((d, i) => <span key={d} className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SHADE[i] }} />{LETTER[d]} {SHORT[d]}</span>)}
      </div>
    </div>
  )
}
