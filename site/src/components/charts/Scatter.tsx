import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Drug } from '../../lib/types'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

type Props = {
  drugs: Drug[]
  title: string
  subtitle?: string
  source: string
  /** 'plain' shows the cloud; 'quadrant' highlights low-enrollment/high-report drugs; 'zolpidem' singles one drug out */
  mode: 'plain' | 'quadrant' | 'zolpidem'
  gapThreshold: number
}

export const inGapQuadrant = (d: Drug, gapThreshold: number) =>
  d.faers_female_pct != null && d.trial_female_pct < 50 && (d.gap ?? -1) >= gapThreshold

export default function Scatter({ drugs, title, subtitle, source, mode, gapThreshold }: Props) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 14, right: 16, bottom: 40, left: 44 }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const x = scaleLinear().domain([0, 100]).range([0, iw])
  const y = scaleLinear().domain([0, 100]).range([ih, 0])
  const pts = drugs.filter(d => d.faers_female_pct != null)
  const r = iw > 600 ? 5.5 : 4.5

  const colorOf = (d: Drug) => {
    if (mode === 'zolpidem') return d.slug === 'zolpidem' ? 'var(--c-emphasis)' : 'var(--c-muted)'
    if (mode === 'quadrant') return inGapQuadrant(d, gapThreshold) ? 'var(--c-emphasis)' : 'var(--c-muted)'
    return 'var(--c-female)'
  }

  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      {mode === 'quadrant' && <Legend items={[{ label: `Under half women in trials, and ${gapThreshold}+ points more of the reports`, color: 'var(--c-emphasis)' }, { label: 'Other drugs', color: 'var(--c-muted)' }]} />}
      <div ref={ref} className={`relative w-full ${mode === 'quadrant' ? 'h-[calc(100%-1.5rem)]' : 'h-full'}`}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {mode === 'quadrant' && (
                <rect x={0} y={0} width={x(50)} height={y(50)} fill="var(--c-emphasis)" opacity={0.07} />
              )}
              {[0, 25, 50, 75, 100].map(t => (
                <g key={t}>
                  <line x1={x(t)} x2={x(t)} y1={0} y2={ih} stroke="var(--c-grid)" />
                  <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" />
                  <text x={x(t)} y={ih + 18} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{t}%</text>
                  <text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{t}%</text>
                </g>
              ))}
              <line x1={x(0)} y1={y(0)} x2={x(100)} y2={y(100)} stroke="var(--c-text-2)" strokeDasharray="4 4" strokeWidth={1} />
              <text x={x(72)} y={y(72) - 8} fontSize={11} fill="var(--c-text-2)" transform={`rotate(${-Math.atan2(ih, iw) * 180 / Math.PI} ${x(72)} ${y(72)})`}>reports match trial share</text>
              {pts.map(d => (
                <circle key={d.slug} cx={x(d.trial_female_pct)} cy={y(d.faers_female_pct!)} r={mode === 'zolpidem' && d.slug === 'zolpidem' ? r + 3 : r}
                  fill={colorOf(d)} stroke="var(--c-surface)" strokeWidth={1.5} style={{ transition: 'fill 400ms' }}
                  onMouseEnter={() => setTip({ x: x(d.trial_female_pct) + m.left, y: y(d.faers_female_pct!) + m.top, content: <><b>{d.brand}</b> ({d.year}) · {d.category}<br />{d.trial_female_pct.toFixed(0)}% of trial participants were women<br />{d.faers_female_pct!.toFixed(0)}% of {d.faers_n!.toLocaleString()} adverse-event reports are from women</> })}
                  onMouseLeave={() => setTip(null)} />
              ))}
              <text x={iw} y={ih + 34} textAnchor="end" fontSize={11} fill="var(--c-text-2)">% women in pivotal trials →</text>
              <text transform={`translate(${-34},${0}) rotate(-90)`} textAnchor="end" fontSize={11} fill="var(--c-text-2)">% of adverse-event reports from women →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
