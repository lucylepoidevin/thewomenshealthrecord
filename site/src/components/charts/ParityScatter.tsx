import { scaleLinear, scaleSqrt } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Tooltip, { type Tip } from './Tooltip'

export type ParityPoint = { label: string; x: number; y: number; size?: number; tip?: React.ReactNode; show?: boolean }

/**
 * Men on one axis, women on the other, a diagonal of parity. Points above the
 * line are higher for women. Bubble area scales with `size`.
 */
export default function ParityScatter({ points, title, subtitle, source, xLabel, yLabel, fmt = v => `${v.toFixed(0)}%`, aboveLabel = 'higher for women', belowLabel = 'higher for men', log = false }: { points: ParityPoint[]; title: string; subtitle?: string; source: string; xLabel: string; yLabel: string; fmt?: (v: number) => string; aboveLabel?: string; belowLabel?: string; log?: boolean }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const h = Math.min(560, Math.max(380, width * 0.72))
  const m = { top: 20, right: 30, bottom: 44, left: 56 }
  const iw = Math.max(0, width - m.left - m.right), ih = h - m.top - m.bottom
  const vals = points.flatMap(p => [p.x, p.y])
  const lo = log ? Math.min(...vals) * 0.8 : 0, hi = Math.max(...vals) * 1.08
  const sc = () => (log ? scaleSqrt() : scaleLinear())
  const x = sc().domain([lo, hi]).range([0, iw]), y = sc().domain([lo, hi]).range([ih, 0])
  const r = scaleSqrt().domain([0, Math.max(...points.map(p => p.size ?? 1))]).range([3, 22])
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div ref={ref} className="relative w-full" style={{ height: h }}>
        {width > 0 && (
          <svg width={width} height={h} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {x.ticks(5).map(t => <g key={'x' + t}><line x1={x(t)} x2={x(t)} y1={0} y2={ih} stroke="var(--c-grid)" /><text x={x(t)} y={ih + 16} textAnchor="middle" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              {y.ticks(5).map(t => <g key={'y' + t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke="var(--c-grid)" /><text x={-8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{fmt(t)}</text></g>)}
              <polygon points={`0,${ih} ${iw},0 0,0`} fill="var(--c-female)" opacity={0.05} /><polygon points={`0,${ih} ${iw},0 ${iw},${ih}`} fill="var(--c-male)" opacity={0.05} />
              <line x1={0} y1={ih} x2={iw} y2={0} stroke="var(--c-text-2)" strokeDasharray="4 3" />
              <text x={10} y={14} fontSize={11} fill="var(--c-female)" fontWeight={600}>{aboveLabel}</text>
              <text x={iw - 8} y={ih - 8} textAnchor="end" fontSize={11} fill="var(--c-male)" fontWeight={600}>{belowLabel}</text>
              {points.map(p => (
                <g key={p.label}>
                  <circle cx={x(p.x)} cy={y(p.y)} r={r(p.size ?? 1)} fill={p.y > p.x ? 'var(--c-female)' : 'var(--c-male)'} opacity={0.7} stroke="var(--c-surface)" strokeWidth={1}
                    onMouseEnter={() => setTip({ x: x(p.x) + m.left, y: y(p.y) + m.top, content: p.tip ?? <><b>{p.label}</b><br />women {fmt(p.y)} · men {fmt(p.x)}</> })} onMouseLeave={() => setTip(null)} />
                  {p.show && <text x={x(p.x) + r(p.size ?? 1) + 3} y={y(p.y) + 4} fontSize={11} fill="var(--c-text)">{p.label}</text>}
                </g>
              ))}
              <text x={iw} y={ih + 36} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{xLabel} →</text>
              <text transform={`translate(${-42},0) rotate(-90)`} textAnchor="end" fontSize={11} fill="var(--c-text-2)">{yLabel} →</text>
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
