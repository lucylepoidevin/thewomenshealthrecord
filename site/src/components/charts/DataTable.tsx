import { useMemo, useState } from 'react'
import type { Drug } from '../../lib/types'
import ChartFrame from './ChartFrame'

type Key = 'brand' | 'year' | 'category' | 'trial_female_pct' | 'faers_female_pct' | 'gap'
const COLS: { key: Key; label: string; num?: boolean }[] = [
  { key: 'brand', label: 'Drug' },
  { key: 'year', label: 'Approved', num: true },
  { key: 'category', label: 'Area' },
  { key: 'trial_female_pct', label: '% women in trials', num: true },
  { key: 'faers_female_pct', label: '% of reports from women', num: true },
  { key: 'gap', label: 'Gap (points)', num: true },
]

export default function DataTable({ drugs, title, subtitle, source }: { drugs: Drug[]; title: string; subtitle?: string; source: string }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: 'gap', dir: -1 })
  const rows = useMemo(() => [...drugs].sort((a, b) => {
    const av = a[sort.key] as any, bv = b[sort.key] as any
    if (av == null) return 1
    if (bv == null) return -1
    return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir
  }), [drugs, sort])
  return (
    <ChartFrame title={title} subtitle={subtitle} source={source}>
      <div className="table-wrap text-[13px] sm:text-[14px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className={`th-sort py-2.5 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 border-b border-hairline ${c.num ? 'text-right' : ''}`}
                  onClick={() => setSort(s => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : (c.num ? -1 : 1) }))}>
                  {c.label}{sort.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(d => (
              <tr key={d.slug} className="border-b border-hairline/60 hover:bg-blush-2/50 transition">
                <td className="py-2.5 pr-4"><a href={d.snapshot_url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-berry">{d.brand}</a><div className="text-ink-3 text-[11px] truncate max-w-[14rem]">{d.generic}</div></td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{d.year}</td>
                <td className="py-2.5 pr-4">{d.category}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{d.trial_female_pct.toFixed(0)}%</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{d.faers_female_pct?.toFixed(0)}%</td>
                <td className="py-2.5 pr-0 text-right tabular-nums font-semibold text-berry">+{d.gap?.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  )
}
