import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Cmp } from '../../lib/types2'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

type Row = { label: string; cmp: Cmp; sub?: string }

/** Women vs men per row, each a dot with a 95% whisker, difference labelled at the right. */
export default function SexCompare({ rows, title, subtitle, source, unit = '%', max, axisLabel }: { rows: Row[]; title: string; subtitle?: string; source: string; unit?: string; max?: number; axisLabel: string }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rowH = 44
  const m = { top: 26, right: 92, bottom: 30, left: Math.min(190, Math.max(110, width * 0.26)) }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = rows.length * rowH
  const hiMax = Math.max(...rows.map(r => Math.max(r.cmp.women.hi, r.cmp.men.hi)))
  const x = scaleLinear().domain([0, max ?? Math.ceil(hiMax * 1.08)]).range([0, iw])
  const F = 'var(--c-female)', M = 'var(--c-male)'
  const fmt = (v: number) => unit === '%' ? `${v.toFixed(0)}%` : `${v.toFixed(0)}${unit}`
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Women', color: F }, { label: 'Men', color: M }]} />
      <p className="text-[11px] text-ink-3 -mt-0.5 mb-1">Whiskers: 95% confidence intervals from the survey design. Right column: women minus men.</p>
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks(Math.min(6, Math.floor(iw / 70))).map(t => (
                <g key={t} transform={`translate(${x(t)},0)`}>
                  <line y1={-4} y2={ih} stroke="var(--c-grid)" />
                  <text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text>
                </g>
              ))}
              {rows.map((r, i) => {
                const cy = i * rowH + rowH / 2
                const pts = [{ k: 'men', e: r.cmp.men, c: M, dy: 7, who: 'Men' }, { k: 'women', e: r.cmp.women, c: F, dy: -7, who: 'Women' }]
                const sig = r.cmp.diff_lo > 0 || r.cmp.diff_hi < 0
                return (
                  <g key={r.label}>
                    <text x={-12} y={cy + (r.sub ? -2 : 4)} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.label}</text>
                    {r.sub && <text x={-12} y={cy + 12} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}
                    {i > 0 && <line x1={0} x2={iw} y1={i * rowH} y2={i * rowH} stroke="var(--c-grid)" />}
                    {pts.map(p => (
                      <g key={p.k} transform={`translate(0,${p.dy})`}>
                        <line x1={x(Math.max(0, p.e.lo))} x2={x(p.e.hi)} y1={cy} y2={cy} stroke={p.c} strokeWidth={1.5} opacity={0.6} />
                        <line x1={x(Math.max(0, p.e.lo))} x2={x(Math.max(0, p.e.lo))} y1={cy - 4} y2={cy + 4} stroke={p.c} opacity={0.6} />
                        <line x1={x(p.e.hi)} x2={x(p.e.hi)} y1={cy - 4} y2={cy + 4} stroke={p.c} opacity={0.6} />
                        <circle cx={x(p.e.est)} cy={cy} r={6} fill={p.c} stroke="var(--c-surface)" strokeWidth={1.5}
                          onMouseEnter={() => setTip({ x: x(p.e.est) + m.left, y: cy + m.top + p.dy, content: <><b>{p.who}</b>, {r.label.toLowerCase()}<br />{fmt(p.e.est)} (95% CI {fmt(Math.max(0, p.e.lo))} to {fmt(p.e.hi)})<br />{p.e.n.toLocaleString()} sampled visits</> })}
                          onMouseLeave={() => setTip(null)} />
                      </g>
                    ))}
                    <text x={iw + 10} y={cy + 4} fontSize={12} fill={sig ? 'var(--c-emphasis)' : 'var(--c-text-2)'} fontWeight={sig ? 700 : 400}>
                      {Math.abs(r.cmp.diff) < 0.5 ? '0' : (r.cmp.diff > 0 ? '+' : '') + r.cmp.diff.toFixed(0)}{unit === '%' ? ' pts' : unit}
                    </text>
                  </g>
                )
              })}
              <text x={iw} y={ih + 22} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{axisLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
