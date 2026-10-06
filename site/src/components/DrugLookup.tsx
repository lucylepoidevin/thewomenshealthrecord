import { useMemo, useState } from 'react'
import type { Drug } from '../lib/types'

/** Search the chapter's drugs by brand or generic name and show that drug's numbers. */
export default function DrugLookup({ drugs, minReports }: { drugs: Drug[]; minReports: number }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Drug | null>(null)
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return drugs.filter(d => d.brand.toLowerCase().includes(t) || (d.generic ?? '').toLowerCase().includes(t)).slice(0, 6)
  }, [q, drugs])
  const d = pick

  return (
    <div className="graphic-card p-5 sm:p-7">
      <h3 className="display text-lg sm:text-[1.35rem] font-medium leading-tight text-ink">Look up a drug</h3>
      <p className="text-xs sm:text-sm text-ink-2 mt-1">Any novel drug the FDA approved from 2015 onward. Older drugs, generics and most vaccines are not in this dataset.</p>
      <div className="relative mt-4">
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPick(null) }}
          placeholder="Brand or generic name, e.g. Ozempic"
          className="w-full rounded-full border border-hairline bg-white px-5 py-3 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10"
          aria-label="Search drugs"
        />
        {matches.length > 0 && !pick && (
          <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_20px_50px_-25px_rgba(139,30,75,0.35)]">
            {matches.map(m => (
              <li key={m.slug}>
                <button type="button" onClick={() => { setPick(m); setQ(m.brand) }} className="flex w-full items-baseline justify-between px-5 py-2.5 text-left hover:bg-blush-2/60">
                  <span className="font-semibold text-ink">{m.brand}</span>
                  <span className="ml-3 truncate text-xs text-ink-3">{m.generic} · {m.year}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.trim().length >= 2 && matches.length === 0 && !pick && (
          <p className="mt-3 text-sm text-ink-2">Not in this dataset. You can search the FDA's own <a className="text-berry underline underline-offset-2" href="https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots" target="_blank" rel="noreferrer">Drug Trials Snapshots</a>, which also covers drugs approved before our data begins.</p>
        )}
      </div>

      {d && (
        <div className="mt-5 fade-up">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display text-2xl font-medium text-ink">{d.brand}</span>
            <span className="text-sm text-ink-3">{d.generic} · approved {d.year} · {d.category}</span>
          </div>
          {d.indication && <p className="mt-2 text-sm text-ink-2 leading-relaxed">{d.indication}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-berry">{d.trial_female_pct.toFixed(0)}%</div>
              <p className="mt-2 text-xs text-ink-2">of participants in its pivotal trials were women</p>
            </div>
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-berry">{d.faers_female_pct != null && (d.faers_n ?? 0) >= minReports ? `${d.faers_female_pct.toFixed(0)}%` : '—'}</div>
              <p className="mt-2 text-xs text-ink-2">{d.faers_female_pct != null && (d.faers_n ?? 0) >= minReports ? `of its ${d.faers_n!.toLocaleString()} adverse-event reports are from women` : `too few adverse-event reports to say (under ${minReports})`}</p>
            </div>
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-berry">{d.gap != null && (d.faers_n ?? 0) >= minReports ? `${d.gap > 0 ? '+' : ''}${d.gap.toFixed(0)}` : '—'}</div>
              <p className="mt-2 text-xs text-ink-2">point gap between the two. {d.gap != null && d.trial_female_pct < 50 && d.gap >= 15 ? 'This drug is in the Ambien corner.' : ''}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-3">
            <a className="text-berry underline underline-offset-2" href={d.snapshot_url} target="_blank" rel="noreferrer">Read the FDA's snapshot for {d.brand}</a>
            {d.enrollment_source !== 'fda-snapshot' && ' · enrollment figure from the Carmeli et al. 2023 compilation'}
          </p>
        </div>
      )}
    </div>
  )
}
