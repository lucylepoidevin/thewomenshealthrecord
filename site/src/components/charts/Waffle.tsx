import { useState } from 'react'
import ChartFrame from './ChartFrame'
import Legend from './Legend'

export type WaffleItem = { id: string; label: string; category: string; detail?: string }
export type WaffleCategory = { key: string; label: string; color: string }

/**
 * One tile per item, coloured by category, grouped so each category forms a
 * block. Hover a tile to see the item. Built for "390 drug labels, one square
 * each, by what the label says about sex".
 */
export default function Waffle({ items, categories, title, subtitle, source, cols = 30 }: { items: WaffleItem[]; categories: WaffleCategory[]; title: string; subtitle?: string; source: string; cols?: number }) {
  const [hover, setHover] = useState<WaffleItem | null>(null)
  const ordered = categories.flatMap(c => items.filter(i => i.category === c.key))
  const cell = 14, gap = 3
  const rows = Math.ceil(ordered.length / cols)
  const w = cols * (cell + gap), h = rows * (cell + gap)
  const color = (k: string) => categories.find(c => c.key === k)?.color ?? 'var(--c-muted)'
  const counts = categories.map(c => ({ ...c, n: items.filter(i => i.category === c.key).length }))
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <Legend items={counts.map(c => ({ label: `${c.label} (${c.n})`, color: c.color }))} />
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 720, display: 'block' }} role="img" aria-label={title}>
        {ordered.map((it, i) => (
          <rect key={it.id} x={(i % cols) * (cell + gap)} y={Math.floor(i / cols) * (cell + gap)} width={cell} height={cell} rx={2} fill={color(it.category)} opacity={hover && hover.id !== it.id ? 0.35 : 1} onMouseEnter={() => setHover(it)} onMouseLeave={() => setHover(null)}>
            <title>{it.label}: {categories.find(c => c.key === it.category)?.label}</title>
          </rect>
        ))}
      </svg>
      <p className="mt-2 text-[12px] text-ink-2 min-h-[2.5rem]">{hover ? <><b className="text-ink">{hover.label}</b> · {categories.find(c => c.key === hover.category)?.label}{hover.detail ? <span className="text-ink-3"> · {hover.detail}</span> : null}</> : 'Hover a square for the drug.'}</p>
    </ChartFrame>
  )
}
