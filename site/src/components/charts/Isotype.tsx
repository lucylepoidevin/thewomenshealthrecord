import ChartFrame from './ChartFrame'

export type IsotypePanel = { label: string; sub?: string; count: number; color: string }

/**
 * Pictogram grids: each panel is `per` units (default 1,000) drawn as a grid of
 * small squares, with `count` of them filled. Built for "of 1,000 women with
 * dizziness, 62 leave with an anxiety code; of 1,000 men, 18".
 */
export default function Isotype({ panels, title, subtitle, source, per = 1000, cols = 40, unit = 'visits' }: { panels: IsotypePanel[]; title: string; subtitle?: string; source: string; per?: number; cols?: number; unit?: string }) {
  const cell = 7, gap = 2
  const rows = Math.ceil(per / cols)
  const w = cols * (cell + gap), h = rows * (cell + gap)
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div className="grid gap-5 sm:grid-cols-2">
        {panels.map(p => (
          <div key={p.label}>
            <p className="text-[13px] text-ink"><b className="display text-2xl font-medium" style={{ color: p.color }}>{p.count}</b> <span className="text-ink-2">of {per.toLocaleString()} {unit}</span> · <b>{p.label}</b>{p.sub && <span className="text-ink-3"> · {p.sub}</span>}</p>
            <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 420, display: 'block', marginTop: 6 }} role="img" aria-label={`${p.count} of ${per} ${unit}, ${p.label}`}>
              {Array.from({ length: per }, (_, i) => <rect key={i} x={(i % cols) * (cell + gap)} y={Math.floor(i / cols) * (cell + gap)} width={cell} height={cell} rx={1} fill={i < p.count ? p.color : 'rgba(139,30,75,0.10)'} />)}
            </svg>
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}
