import { useState } from 'react'
import type { Disease } from '../lib/types3'
import MultiLine from './charts/MultiLine'

const fmtM = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(2)} billion` : `$${v.toFixed(0)} million`

/** Pick a disease; see its burden split, funding, dollars per DALY, rank and 2008–2025 history. */
export default function DiseaseExplorer({ diseases, n, source, burdenYear = 2023 }: { diseases: Disease[]; n: number; source: string; burdenYear?: number }) {
  const sorted = [...diseases].sort((a, b) => a.disease.localeCompare(b.disease))
  const [pick, setPick] = useState('Migraine')
  const d = diseases.find(x => x.disease === pick)
  const color = d?.skew === 'female' ? 'var(--c-female)' : d?.skew === 'male' ? 'var(--c-male)' : 'var(--c-emphasis)'
  return (
    <div className="graphic-card p-5 sm:p-7">
      <h3 className="display text-lg sm:text-[1.35rem] font-medium leading-tight text-ink">Look up a disease</h3>
      <p className="mt-3 text-[15px] text-ink-2">
        Show me{' '}
        <select value={pick} onChange={e => setPick(e.target.value)} className="rounded-full border border-hairline bg-white px-4 py-2 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10" aria-label="Disease">
          {sorted.map(x => <option key={x.disease} value={x.disease}>{x.disease}</option>)}
        </select>
      </p>
      {d && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-3 content-start">
            <div className="rounded-2xl bg-blush-2/60 p-4"><div className="display text-3xl font-light leading-none text-berry">{d.female_share.toFixed(0)}%</div><p className="mt-2 text-xs text-ink-2">of its US burden falls on women</p></div>
            <div className="rounded-2xl bg-blush-2/60 p-4"><div className="display text-3xl font-light leading-none text-berry">{d.dalys_k >= 1000 ? `${(d.dalys_k / 1000).toFixed(1)}M` : `${d.dalys_k.toFixed(0)}k`}</div><p className="mt-2 text-xs text-ink-2">disability-adjusted life years lost in the US, {burdenYear}</p></div>
            <div className="rounded-2xl bg-blush-2/60 p-4"><div className="display text-3xl font-light leading-none text-berry">{fmtM(d.funding_m)}</div><p className="mt-2 text-xs text-ink-2">NIH funding, fiscal 2024</p></div>
            <div className="rounded-2xl bg-blush-2/60 p-4"><div className="display text-3xl font-light leading-none text-berry">${d.dollars_per_daly.toLocaleString()}</div><p className="mt-2 text-xs text-ink-2">per DALY. {d.ratio_to_expected.toFixed(2)}× what its burden predicts; rank {d.rank_by_ratio} of {n}, where 1 is the most underfunded</p></div>
            {d.note && <p className="col-span-2 text-[11px] text-ink-3">Note: {d.note}.</p>}
            <p className="col-span-2 text-[11px] text-ink-3">NIH categories: {d.nih_categories.join(', ')}.</p>
          </div>
          <div className="h-[280px]">
            <MultiLine series={[{ label: d.disease, color, points: d.history.filter(h => h.funding_m > 0).map(h => ({ x: h.fy, y: h.funding_m })) }]} title="NIH funding by fiscal year" subtitle={`Millions of dollars, as reported in NIH's category estimates${d.history.find(h => h.funding_m > 0)?.fy && d.history.find(h => h.funding_m > 0)!.fy > 2008 ? ` (category reported from FY${d.history.find(h => h.funding_m > 0)!.fy})` : ''}`} source={source} yLabel="$ millions" fmt={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'B' : v.toFixed(0) + 'M'}`} />
          </div>
        </div>
      )}
    </div>
  )
}
