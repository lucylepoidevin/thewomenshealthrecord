import * as d3 from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import { ROLE_LABEL, type Device, type Role } from '../lib/data'

const ROLES: Role[] = ['detection', 'triage', 'density', 'other', 'risk']
type Field = 'race_reported' | 'density_reported' | 'us_in_test' | 'subgroup_performance_reported'
const FIELD_LABEL: Record<Field, string> = { race_reported: 'race or ethnicity of the test patients reported', density_reported: 'breast density of the test patients reported', us_in_test: 'United States named among the test sites', subgroup_performance_reported: 'performance reported by subgroup' }

/** One dot per FDA decision, by year and role; filled where the summary reports the chosen fact. */
export default function Timeline({ devices, field }: { devices: Device[]; field: Field }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(320, width), h = 230
  const m = { top: 16, right: 12, bottom: 28, left: 150 }
  const years = d3.extent(devices, d => d.year) as [number, number]
  const x = d3.scaleLinear().domain([2015.5, years[1] + 0.5]).range([m.left, w - m.right])
  const y = d3.scaleBand<Role>().domain(ROLES).range([m.top, h - m.bottom]).padding(0.3)
  const [hov, setHov] = useState<Device | null>(null)
  // stack dots within the same year and role
  const groups = d3.group(devices, d => `${d.year}-${d.role}`)
  const r = 5
  const early = devices.filter(d => d.year < 2016)
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={h}>
        {ROLES.map(role => <g key={role}><line x1={m.left} x2={w - m.right} y1={(y(role) ?? 0) + y.bandwidth() / 2} y2={(y(role) ?? 0) + y.bandwidth() / 2} stroke="var(--c-grid)" /><text x={m.left - 8} y={(y(role) ?? 0) + y.bandwidth() / 2} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--c-text-2)">{ROLE_LABEL[role]}</text></g>)}
        {d3.range(2016, years[1] + 1).map(yr => <text key={yr} x={x(yr)} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--c-text-2)">{yr}</text>)}
        {early.length > 0 && <text x={w - m.right} y={m.top - 4} textAnchor="end" fontSize={9.5} fill="var(--c-text-2)">{early.length} earlier clearances (1998 to 2015) not drawn</text>}
        {Array.from(groups.values()).flatMap(g0 => {
          const g = g0.filter(d => d.year >= 2016)
          const band = x(2017) - x(2016), step = r * 2.4, perRow = Math.max(1, Math.floor((band - step) / step))
          const rows = Math.ceil(g.length / perRow)
          return g.map((d, i) => {
          const row = Math.floor(i / perRow), inRow = Math.min(perRow, g.length - row * perRow), col = i % perRow
          const cx = x(d.year) + (col - (inRow - 1) / 2) * step, cy = (y(d.role) ?? 0) + y.bandwidth() / 2 + (row - (rows - 1) / 2) * step
          const on = Boolean(d[field])
          return <circle key={d.submission} cx={cx} cy={cy} r={r} fill={on ? 'var(--c-emphasis)' : 'transparent'} stroke="var(--c-emphasis)" strokeWidth={1.2} onPointerEnter={() => setHov(d)} onPointerLeave={() => setHov(null)} style={{ cursor: 'default' }} />
          })
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-[11px] text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--c-emphasis)' }} />{FIELD_LABEL[field]}</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ borderColor: 'var(--c-emphasis)' }} />not reported</span>
        {hov && <span className="text-ink">{hov.device} ({hov.company}, {hov.submission}, {hov.decision_date.slice(-4)})</span>}
      </div>
    </div>
  )
}
