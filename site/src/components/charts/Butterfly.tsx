import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Cmp } from '../../lib/types2'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

export type ButterflyRow = { label: string; sub?: string; cmp: Cmp }

/**
 * Back-to-back bars: women grow to the left of a centre spine, men to the right,
 * with the 95% interval drawn as a thin cap. The row label sits on the spine.
 * The reader compares wingspans; a symmetrical butterfly is parity.
 */
export default function Butterfly({ rows, title, subtitle, source, axisLabel, fmt = v => `${v.toFixed(0)}%`, max }: { rows: ButterflyRow[]; title: string; subtitle?: string; source: string; axisLabel: string; fmt?: (v: number) => string; max?: number }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const narrow = width > 0 && width < 480
  const rowH = narrow ? 50 : 34
  const mid = narrow ? 10 : Math.min(150, Math.max(96, width * 0.28))
  const m = { top: narrow ? 30 : 26, bottom: 30, side: narrow ? 34 : 44 }
  const half = Math.max(0, (width - mid - 2 * m.side) / 2)
  const ih = rows.length * rowH
  const hi = max ?? Math.max(...rows.flatMap(r => [r.cmp.women.hi, r.cmp.men.hi])) * 1.08
  const x = scaleLinear().domain([0, hi]).range([0, half])
  const cxL = m.side + half, cxR = m.side + half + mid
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Women', color: 'var(--c-female)' }, { label: 'Men', color: 'var(--c-male)' }]} />
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(0,${m.top})`}>
              {x.ticks(narrow ? 2 : 4).map(t => <g key={t}>
                <line x1={cxL - x(t)} x2={cxL - x(t)} y1={-4} y2={ih} stroke="var(--c-grid)" />{!(narrow && t === 0) && <text x={cxL - x(t)} y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text>}
                <line x1={cxR + x(t)} x2={cxR + x(t)} y1={-4} y2={ih} stroke="var(--c-grid)" />{!(narrow && t === 0) && <text x={cxR + x(t)} y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text>}
              </g>)}
              {rows.map((r, i) => {
                const cy = i * rowH + (narrow ? rowH - 14 : rowH / 2)
                const w = r.cmp.women, mn = r.cmp.men
                const clear = r.cmp.diff_lo > 0 || r.cmp.diff_hi < 0
                return (
                  <g key={r.label}>
                    <rect x={cxL - x(w.est)} y={cy - 11} width={x(w.est)} height={22} fill="var(--c-female)" opacity={0.85} rx={2} onMouseEnter={() => setTip({ x: cxL - x(w.est), y: cy + m.top, content: <><b>{r.label}</b><br />Women {fmt(w.est)} ({fmt(w.lo)}–{fmt(w.hi)}), {w.n.toLocaleString()} visits</> })} onMouseLeave={() => setTip(null)} />
                    <line x1={cxL - x(w.lo)} x2={cxL - x(w.hi)} y1={cy} y2={cy} stroke="var(--c-text)" strokeWidth={1.2} opacity={0.6} />
                    <rect x={cxR} y={cy - 11} width={x(mn.est)} height={22} fill="var(--c-male)" opacity={0.85} rx={2} onMouseEnter={() => setTip({ x: cxR + x(mn.est), y: cy + m.top, content: <><b>{r.label}</b><br />Men {fmt(mn.est)} ({fmt(mn.lo)}–{fmt(mn.hi)}), {mn.n.toLocaleString()} visits</> })} onMouseLeave={() => setTip(null)} />
                    <line x1={cxR + x(mn.lo)} x2={cxR + x(mn.hi)} y1={cy} y2={cy} stroke="var(--c-text)" strokeWidth={1.2} opacity={0.6} />
                    <text x={cxL - x(w.est) - 6} y={cy + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmt(w.est)}</text>
                    <text x={cxR + x(mn.est) + 6} y={cy + 4} fontSize={11} fill="var(--c-text-2)">{fmt(mn.est)}</text>
                    {narrow ? <text x={cxL + mid / 2} y={i * rowH + 13} textAnchor="middle" fontSize={11.5} fontWeight={clear ? 700 : 600} fill={clear ? 'var(--c-emphasis)' : 'var(--c-text)'}>{r.label}{r.sub && <tspan fill="var(--c-text-2)" fontWeight={400} fontSize={10}> · {r.sub}</tspan>}</text> : <>
                    <text x={cxL + mid / 2} y={cy + (r.sub ? 0 : 4)} textAnchor="middle" fontSize={12} fontWeight={clear ? 700 : 500} fill={clear ? 'var(--c-emphasis)' : 'var(--c-text)'}>{r.label}</text>
                    {r.sub && <text x={cxL + mid / 2} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}</>}
                  </g>
                )
              })}
              <text x={cxL} y={ih + 22} textAnchor="end" fontSize={11} fill="var(--c-text-2)">← {axisLabel}, women</text>
              <text x={cxR} y={ih + 22} fontSize={11} fill="var(--c-text-2)">men, {axisLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
      <p className="mt-1 text-[11px] text-ink-3">Thin line: 95% interval. A label in dark rose marks a difference whose interval does not cross zero.</p>
    </ChartFrame>
  )
}
