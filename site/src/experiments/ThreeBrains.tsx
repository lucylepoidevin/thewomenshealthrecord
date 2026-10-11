import * as d3 from 'd3'
import { useEffect, useState } from 'react'
import { useSize } from '../lib/useSize'

type Pt = { x: number; pct: number; hollow?: boolean }
type Panel = { key: string; title: string; sub: string; xLabel: (v: number) => string; ticks: number[]; pts: Pt[]; note: string }
const BASE = import.meta.env.BASE_URL

/**
 * Three brains on one scale: whole-brain volume (ventricles excluded) as
 * percent deviation from each person's own reference, drawn on a shared
 * ±4% axis. Her cycle and his month against their 30-day means; her
 * pregnancy against her four pre-conception scans.
 */
export default function ThreeBrains() {
  const { ref, width } = useSize<HTMLDivElement>()
  const [panels, setPanels] = useState<Panel[] | null>(null)
  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/cycling/cycle.json`).then(r => r.json()),
      fetch(`${BASE}data/male/male.json`).then(r => r.json()),
      fetch(`${BASE}data/pregnancy/pregnancy.json`).then(r => r.json()),
    ]).then(([c, m, p]) => {
      const cm = c.stats.total_brain.mean, mm = m.stats.total_brain.mean, pb = p.stats.total_brain.baseline
      setPanels([
        { key: 'her', title: 'Her month', sub: '30 mornings across a menstrual cycle', xLabel: v => `day ${v}`, ticks: [1, 10, 20, 30],
          pts: c.days.filter((d: { has_scan: boolean }) => d.has_scan).map((d: { day: number; volumes: { total_brain: number } }) => ({ x: d.day, pct: (d.volumes.total_brain / cm - 1) * 100 })),
          note: `spread ${c.stats.total_brain.cv_pct.toFixed(2)}% · no hormone tracks it` },
        { key: 'him', title: 'His month', sub: '40 scans, 7 am filled, 8 pm hollow', xLabel: v => `day ${v}`, ticks: [1, 10, 20, 30],
          pts: m.sessions.filter((s: { has_scan: boolean }) => s.has_scan).map((s: { day: number; time: string; volumes: { total_brain: number } }) => ({ x: s.day + (s.time === 'morning' ? -0.2 : 0.2), pct: (s.volumes.total_brain / mm - 1) * 100, hollow: s.time === 'evening' })),
          note: `${m.stats.total_brain.ampm_mean_pct > 0 ? '+' : '−'}${Math.abs(m.stats.total_brain.ampm_mean_pct).toFixed(2)}% from 7 am to 8 pm, on ${m.stats.total_brain.ampm_n_down} of ${m.stats.total_brain.ampm_n} days` },
        { key: 'preg', title: 'Her pregnancy', sub: '27 scans, conception to two years after', xLabel: v => v < 0 ? 'before' : v <= 40 ? `wk ${v}` : `+${Math.round((v - 40) / 52 * 12)} mo`, ticks: [0, 20, 40, 92, 162],
          pts: p.sessions.filter((s: { has_scan: boolean; session: number }) => s.has_scan && s.session !== 27).map((s: { week: number; volumes: { total_brain: number } }) => ({ x: s.week, pct: (s.volumes.total_brain / pb - 1) * 100 })),
          note: `${p.stats.total_brain.third_trimester_pct.toFixed(1)}% in the third trimester, lowest ${p.stats.total_brain.min_pregnancy.pct.toFixed(1)}% at week ${p.stats.total_brain.min_pregnancy.week}, back to ${p.stats.total_brain.two_years_pct > 0 ? '+' : '−'}${Math.abs(p.stats.total_brain.two_years_pct).toFixed(1)}% at two years` },
      ])
    }).catch(() => setPanels([]))
  }, [])
  if (!panels) return <p className="text-sm text-ink-3">Loading the three brains…</p>
  if (!panels.length) return null
  const w = Math.max(300, width), panelH = 212, gap = 18
  const m = { top: 30, right: 10, bottom: 26, left: 44 }
  const h = m.top + panels.length * (panelH + gap) - gap + m.bottom
  const y = (top: number) => d3.scaleLinear().domain([-4, 4]).range([top + panelH - 20, top + 32])
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={h}>
        {panels.map((p, i) => {
          const top = m.top + i * (panelH + gap)
          const yy = y(top)
          const xs = p.key === 'preg' ? (() => { const s = d3.scaleLinear().domain([-5, 41]).range([m.left, m.left + (w - m.left - m.right) * 0.62]); const t = d3.scaleLinear().domain([41, 166]).range([m.left + (w - m.left - m.right) * 0.62, w - m.right]); return (v: number) => (v <= 41 ? s(v) : t(v)) })() : d3.scaleLinear().domain([0.5, 30.5]).range([m.left, w - m.right])
          const sorted = [...p.pts].sort((a, b) => a.x - b.x)
          const line = d3.line<Pt>().x(d => xs(d.x)).y(d => yy(d.pct)).curve(d3.curveMonotoneX)
          return (
            <g key={p.key}>
              <text x={m.left} y={top + 2} fontSize={12} fontWeight={700} fill="var(--c-emphasis)">{p.title} <tspan fontWeight={500} fill="var(--c-text-2)">· {p.sub}</tspan></text>
              {[-4, -2, 0, 2, 4].map(t => (
                <g key={t}>
                  <line x1={m.left} x2={w - m.right} y1={yy(t)} y2={yy(t)} stroke={t === 0 ? 'var(--c-muted)' : 'var(--c-grid)'} strokeWidth={t === 0 ? 1.2 : 1} />
                  <text x={m.left - 6} y={yy(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--c-text-2)">{t > 0 ? '+' : ''}{t}%</text>
                </g>
              ))}
              {p.key === 'preg' && <line x1={xs(41)} x2={xs(41)} y1={top + 32} y2={top + panelH - 20} stroke="var(--c-emphasis)" strokeWidth={1} opacity={0.5} />}
              <path d={line(p.key === 'him' ? sorted.filter(d => !d.hollow) : sorted) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.3} opacity={0.55} />
              {p.key === 'him' && <path d={line(sorted.filter(d => d.hollow)) ?? ''} fill="none" stroke="var(--c-text-2)" strokeWidth={1.1} strokeDasharray="3 3" opacity={0.55} />}
              {sorted.map((d, j) => <circle key={j} cx={xs(d.x)} cy={yy(d.pct)} r={3} fill={d.hollow ? 'var(--c-surface)' : 'var(--c-region)'} stroke="var(--c-region)" strokeWidth={1.2} />)}
              {p.ticks.map((t, k) => <text key={t} x={xs(t)} y={top + panelH - 6} textAnchor={k === p.ticks.length - 1 ? 'end' : k === 0 ? 'start' : 'middle'} fontSize={10} fill="var(--c-text-2)">{p.xLabel(t)}</text>)}
              <text x={m.left} y={top + 17} fontSize={10.5} fontWeight={600} fill="var(--c-text)">{p.note}</text>
            </g>
          )
        })}
      </svg>
      <p className="mt-2 text-xs text-ink-3 leading-relaxed">Whole-brain volume, ventricles excluded, as percent of each person's own reference: the 30-day mean for the two months, the four pre-conception scans for the pregnancy (shown without the second-scanner retest). Same model, same pipeline, same y-axis.</p>
    </div>
  )
}
