import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Drug } from '../../lib/types'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

/**
 * Reports per user, women relative to men: (female/male share of adverse-event
 * reports) divided by (female/male share of prescription users). 1.0 = women and
 * men file reports at the same rate per user.
 */
export default function RateRatio({ drugs, title, subtitle, source }: { drugs: Drug[]; title: string; subtitle?: string; source: string }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rows = [...drugs].filter(d => d.rate_ratio != null).sort((a, b) => b.rate_ratio! - a.rate_ratio!)
  const rowH = 30
  const m = { top: 26, right: 56, bottom: 30, left: Math.min(150, Math.max(90, width * 0.22)) }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = rows.length * rowH
  const maxX = Math.max(2, Math.ceil(Math.max(...rows.map(d => d.rate_ratio_hi ?? d.rate_ratio!)) * 1.1 * 2) / 2)
  const x = scaleLinear().domain([0, maxX]).range([0, iw])
  const colorOf = (r: number) => (r >= 1.5 ? 'var(--c-emphasis)' : r < 1 ? 'var(--c-male)' : 'var(--c-female)')
  const ticks = x.ticks(Math.min(6, Math.floor(iw / 80)))
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Women report 1.5× or more per user', color: 'var(--c-emphasis)' }, { label: 'Between 1× and 1.5×', color: 'var(--c-female)' }, { label: 'Men report more per user', color: 'var(--c-male)' }]} />
      <p className="text-[11px] text-ink-3 -mt-0.5 mb-1">Whiskers: 95% interval from the survey's sampling error on the share of users who are women.</p>
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {ticks.map(t => (
                <g key={t} transform={`translate(${x(t)},0)`}>
                  <line y1={-6} y2={ih} stroke={t === 1 ? 'var(--c-text-2)' : 'var(--c-grid)'} strokeDasharray={t === 1 ? '4 3' : undefined} />
                  <text y={-10} textAnchor="middle" fontSize={11} fill="var(--c-text-2)" fontWeight={t === 1 ? 600 : 400}>{t === 1 ? 'same rate' : `${t}×`}</text>
                </g>
              ))}
              {rows.map((d, i) => {
                const cy = i * rowH + rowH / 2
                const r = d.rate_ratio!
                return (
                  <g key={d.slug}>
                    <text x={-10} y={cy + 4} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{d.brand}</text>
                    {d.rate_ratio_lo != null && d.rate_ratio_hi != null && (
                      <g stroke={colorOf(r)} strokeWidth={1.5} opacity={0.55}>
                        <line x1={x(d.rate_ratio_lo)} x2={x(Math.min(d.rate_ratio_hi, maxX))} y1={cy} y2={cy} />
                        <line x1={x(d.rate_ratio_lo)} x2={x(d.rate_ratio_lo)} y1={cy - 5} y2={cy + 5} />
                        <line x1={x(Math.min(d.rate_ratio_hi, maxX))} x2={x(Math.min(d.rate_ratio_hi, maxX))} y1={cy - 5} y2={cy + 5} />
                      </g>
                    )}
                    <circle cx={x(r)} cy={cy} r={6.5} fill={colorOf(r)} stroke="var(--c-surface)" strokeWidth={1.5}
                      onMouseEnter={() => setTip({ x: x(r) + m.left, y: cy + m.top, content: <><b>{d.brand}</b> ({d.year}) · {d.category}<br />Reports: {d.faers_female_pct!.toFixed(0)}% from women ({d.faers_n!.toLocaleString()} reports)<br />Users: {d.meps_female_pct!.toFixed(0)}% women ({d.meps_users_n!.toLocaleString()} MEPS person-years)<br />Women file <b>{r.toFixed(1)}×</b> as many reports per user{d.rate_ratio_lo != null ? ` (95% interval ${d.rate_ratio_lo.toFixed(1)}–${d.rate_ratio_hi!.toFixed(1)}×)` : ''}</> })}
                      onMouseLeave={() => setTip(null)} />
                    <text x={x(Math.min(d.rate_ratio_hi ?? r, maxX)) + 9} y={cy + 4} fontSize={11} fill="var(--c-text-2)">{r.toFixed(1)}×</text>
                  </g>
                )
              })}
              <text x={iw} y={ih + 22} textAnchor="end" fontSize={11} fill="var(--c-text-2)">adverse-event reports per user, women relative to men →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
