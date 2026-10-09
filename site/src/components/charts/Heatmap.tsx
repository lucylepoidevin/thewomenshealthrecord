import { scaleLinear } from 'd3'
import { useState } from 'react'
import { useSize } from '../../lib/useSize'
import ChartFrame from './ChartFrame'
import Tooltip, { type Tip } from './Tooltip'

export type HeatRow = { label: string; sub?: string; values: (number | null)[]; color?: string }

/** Rows × columns of shaded cells with the number printed in each. */
export default function Heatmap({ rows, columns, title, subtitle, source, fmt = v => `${v.toFixed(0)}%`, max = 100, hue = '139, 30, 75' }: { rows: HeatRow[]; columns: string[]; title: string; subtitle?: string; source: string; fmt?: (v: number) => string; max?: number; hue?: string }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [tip, setTip] = useState<Tip>(null)
  const rowH = 26
  const m = { top: width < 480 ? 70 : 58, right: 8, bottom: 6, left: Math.min(230, Math.max(width < 480 ? 88 : 120, width * 0.3)) }
  const iw = Math.max(0, width - m.left - m.right), ih = rows.length * rowH
  const cw = iw / columns.length
  const alpha = scaleLinear().domain([0, max]).range([0.04, 0.95]).clamp(true)
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div ref={ref} className="relative w-full" style={{ height: ih + m.top + m.bottom }}>
        {width > 0 && (
          <svg width={width} height={ih + m.top + m.bottom} role="img" aria-label={title}>
            <g transform={`translate(${m.left},${m.top})`}>
              {columns.map((c, j) => <foreignObject key={c} x={j * cw} y={-(m.top - 2)} width={cw} height={m.top - 6}><div style={{ fontSize: width < 480 ? 9.5 : 11, lineHeight: '12px', textAlign: 'center', color: 'var(--c-text)', fontWeight: 600, padding: '0 2px' }}>{c}</div></foreignObject>)}
              {rows.map((r, i) => (
                <g key={r.label} transform={`translate(0,${i * rowH})`}>
                  <text x={-10} y={rowH / 2 + (r.sub ? 0 : 4)} textAnchor="end" fontSize={12} fill="var(--c-text)" fontWeight={500}>{r.color && <tspan fill={r.color}>● </tspan>}{r.label}</text>
                  {r.sub && <text x={-10} y={rowH / 2 + 11} textAnchor="end" fontSize={10} fill="var(--c-text-2)">{r.sub}</text>}
                  {r.values.map((v, j) => (
                    <g key={j} onMouseEnter={() => v != null && setTip({ x: j * cw + cw / 2 + m.left, y: i * rowH + m.top, content: <><b>{r.label}</b><br />{columns[j]}: {fmt(v)}</> })} onMouseLeave={() => setTip(null)}>
                      <rect x={j * cw + 1} y={1} width={cw - 2} height={rowH - 2} rx={3} fill={v == null ? 'transparent' : `rgba(${hue}, ${alpha(v)})`} stroke="var(--c-grid)" />
                      {v != null && <text x={j * cw + cw / 2} y={rowH / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={alpha(v) > 0.5 ? '#fff' : 'var(--c-text)'}>{fmt(v)}</text>}
                    </g>
                  ))}
                </g>
              ))}
            </g>
          </svg>
        )}
        <Tooltip tip={tip} width={width} />
      </div>
    </ChartFrame>
  )
}
