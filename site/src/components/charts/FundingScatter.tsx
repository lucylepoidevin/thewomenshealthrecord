import { scaleLog } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import type { Disease } from '../../lib/types3'
import ChartFrame from './ChartFrame'
import Legend from './Legend'
import Tooltip, { type Tip } from './Tooltip'

const colorOf = (s: Disease['skew']) => (s === 'female' ? 'var(--c-female)' : s === 'male' ? 'var(--c-male)' : 'var(--c-muted)')

/** Log-log scatter of NIH funding against US burden, with the power-law fit. */
export default function FundingScatter({ diseases, fit, title, subtitle, source, labels = [] }: { diseases: Disease[]; fit: { a: number; b: number }; title: string; subtitle?: string; source: string; labels?: string[] }) {
  const { ref, width, height } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const m = { top: 14, right: 110, bottom: 44, left: 56 }
  const nice = (t: number) => { const mant = t / Math.pow(10, Math.floor(Math.log10(t))); return Math.abs(mant - 1) < 1e-9 || Math.abs(mant - 3) < 1e-9 }
  const iw = Math.max(0, width - m.left - m.right)
  const ih = Math.max(0, height - m.top - m.bottom)
  const xs = diseases.map(d => d.dalys_k), ys = diseases.map(d => d.funding_m)
  const x = scaleLog().domain([Math.min(...xs) * 0.8, Math.max(...xs) * 1.2]).range([0, iw])
  const y = scaleLog().domain([Math.min(...ys) * 0.8, Math.max(...ys) * 1.3]).range([ih, 0])
  const fitY = (dk: number) => Math.pow(10, fit.a + fit.b * Math.log10(dk))
  const [x0, x1] = x.domain()
  const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}M` : `${v.toFixed(0)}k`
  const fmtM = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={[{ label: 'Mostly women (60%+ of burden)', color: 'var(--c-female)' }, { label: 'Mostly men (60%+)', color: 'var(--c-male)' }, { label: 'Mixed', color: 'var(--c-muted)' }]} />
      <div ref={ref} className="relative h-[calc(100%-1.5rem)] w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks().filter(nice).map(t => <g key={'x' + t}><line x1={x(t)} x2={x(t)} y1={0} y2={ih} stroke="var(--c-grid)" /><text x={x(t)} y={ih + 18} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmtK(t)}</text></g>)}
              {y.ticks().filter(nice).map(t => <g key={'y' + t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" /><text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmtM(t)}</text></g>)}
              <line x1={x(x0)} y1={y(fitY(x0))} x2={x(x1)} y2={y(fitY(x1))} stroke="var(--c-text-2)" strokeDasharray="4 4" />
              <text x={x(x0) + 4} y={y(fitY(x0)) - 8} fontSize={11} fill="var(--c-text-2)">funding expected for the burden</text>
              {diseases.map(d => (
                <g key={d.disease}>
                  <circle cx={x(d.dalys_k)} cy={y(d.funding_m)} r={d.skew === 'balanced' ? 4.5 : 6} fill={colorOf(d.skew)} stroke="var(--c-surface)" strokeWidth={1.5} opacity={d.skew === 'balanced' ? 0.7 : 1}
                    onMouseEnter={() => setTip({ x: x(d.dalys_k) + m.left, y: y(d.funding_m) + m.top, content: <><b>{d.disease}</b> · {d.female_share.toFixed(0)}% of burden falls on women<br />{fmtM(d.funding_m)} NIH funding (FY2024) for {fmtK(d.dalys_k)} DALYs<br />${d.dollars_per_daly.toLocaleString()} per DALY · {d.ratio_to_expected.toFixed(2)}× what the burden predicts</> })}
                    onMouseLeave={() => setTip(null)} />
                  {labels.includes(d.disease) && <text x={x(d.dalys_k) + 8} y={y(d.funding_m) + 4} fontSize={11} fill="var(--c-text)" fontWeight={600}>{d.disease}</text>}
                </g>
              ))}
              <text x={iw} y={ih + 36} textAnchor="end" fontSize={11} fill="var(--c-text-2)">US burden, disability-adjusted life years lost (2021) →</text>
              <text transform={`translate(${-44},0) rotate(-90)`} textAnchor="end" fontSize={11} fill="var(--c-text-2)">NIH funding, FY2024 →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
