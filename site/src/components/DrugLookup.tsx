import { useMemo, useState } from 'react'
import type { Drug } from '../lib/types'

type Live = { name: string; field: 'brand' | 'generic'; female: number; male: number; unknown: number; updated: string | null }

const FAERS = 'https://api.fda.gov/drug/event.json'

async function countBySex(field: string, value: string): Promise<{ female: number; male: number; unknown: number; updated: string | null } | null> {
  const url = `${FAERS}?search=patient.drug.openfda.${field}:"${encodeURIComponent(value)}"&count=patient.patientsex`
  const r = await fetch(url)
  if (!r.ok) return null
  const j = await r.json()
  const d: Record<number, number> = {}
  for (const x of j.results ?? []) d[x.term] = x.count
  return { female: d[2] ?? 0, male: d[1] ?? 0, unknown: d[0] ?? 0, updated: j.meta?.last_updated ?? null }
}

/** Search the chapter's drugs by brand or generic name; anything else is looked up live in FAERS. */
export default function DrugLookup({ drugs, minReports }: { drugs: Drug[]; minReports: number }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Drug | null>(null)
  const [live, setLive] = useState<Live | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return drugs.filter(d => d.brand.toLowerCase().includes(t) || (d.generic ?? '').toLowerCase().includes(t)).slice(0, 6)
  }, [q, drugs])

  const reset = () => { setPick(null); setLive(null); setErr(null) }

  async function searchLive() {
    const name = q.trim()
    if (name.length < 3) return
    setBusy(true); setErr(null); setLive(null)
    try {
      let res = await countBySex('brand_name', name)
      let field: 'brand' | 'generic' = 'brand'
      if (!res || res.female + res.male === 0) { res = await countBySex('generic_name', name); field = 'generic' }
      if (!res || res.female + res.male === 0) setErr(`No adverse-event reports found for "${name}". Check the spelling, or try the generic name.`)
      else setLive({ name, field, ...res })
    } catch {
      setErr('The FDA API did not respond. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const d = pick
  const pct = (f: number, m: number) => (f / (f + m)) * 100

  return (
    <div className="graphic-card p-5 sm:p-7">
      <h3 className="display text-lg sm:text-[1.35rem] font-medium leading-tight text-ink">Look up a drug</h3>
      <p className="text-xs sm:text-sm text-ink-2 mt-1">Novel drugs approved since 2015 have trial data. Any other drug can still be checked live against the FDA's adverse-event reports.</p>
      <form className="relative mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); if (matches.length === 1) { setPick(matches[0]); setQ(matches[0].brand) } else if (matches.length === 0) searchLive() }}>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); reset() }}
          placeholder="Brand or generic name, e.g. Ozempic, Ambien, ibuprofen"
          className="w-full rounded-full border border-hairline bg-white px-5 py-3 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10"
          aria-label="Search drugs"
        />
        {matches.length > 0 && !pick && (
          <ul className="absolute left-0 top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_20px_50px_-25px_rgba(139,30,75,0.35)]">
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
        {q.trim().length >= 3 && matches.length === 0 && !pick && !live && (
          <button type="submit" disabled={busy} className="shrink-0 rounded-full bg-berry px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose disabled:opacity-60">
            {busy ? 'Searching…' : 'Search FDA reports'}
          </button>
        )}
      </form>
      {err && <p className="mt-3 text-sm text-ink-2">{err}</p>}
      {q.trim().length >= 2 && q.trim().length < 3 && matches.length === 0 && <p className="mt-3 text-sm text-ink-3">Keep typing to search the FDA's reports for any drug.</p>}

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
          {d.rate_ratio != null && (
            <p className="mt-3 text-sm text-ink-2">Adjusted for who takes it: women are {d.meps_female_pct!.toFixed(0)}% of its users in the federal prescription survey, so they file <span className="font-semibold text-berry">{d.rate_ratio.toFixed(1)}×</span> as many adverse-event reports per user as men.</p>
          )}
          <p className="mt-4 text-xs text-ink-3">
            <a className="text-berry underline underline-offset-2" href={d.snapshot_url} target="_blank" rel="noreferrer">Read the FDA's snapshot for {d.brand}</a>
            {d.enrollment_source !== 'fda-snapshot' && ' · enrollment figure from the Carmeli et al. 2023 compilation'}
          </p>
        </div>
      )}

      {live && (
        <div className="mt-5 fade-up">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display text-2xl font-medium text-ink">{live.name}</span>
            <span className="text-sm text-ink-3">matched by {live.field} name in FAERS</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-ink-3">—</div>
              <p className="mt-2 text-xs text-ink-2">no FDA trial snapshot: it was approved before 2015, or is not a novel drug</p>
            </div>
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-berry">{live.female + live.male >= minReports ? `${pct(live.female, live.male).toFixed(0)}%` : '—'}</div>
              <p className="mt-2 text-xs text-ink-2">{live.female + live.male >= minReports ? `of its ${(live.female + live.male).toLocaleString()} sex-recorded adverse-event reports are from women` : `only ${(live.female + live.male).toLocaleString()} sex-recorded reports, too few to read anything into`}</p>
            </div>
            <div className="rounded-2xl bg-blush-2/60 p-4">
              <div className="display text-4xl font-light leading-none text-berry">60%</div>
              <p className="mt-2 text-xs text-ink-2">of all FAERS reports with a recorded sex are from women, for comparison</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-3">Live from openFDA{live.updated ? `, data through ${live.updated}` : ''}. Reports, not rates: a drug taken mostly by women will have mostly female reports.</p>
        </div>
      )}
    </div>
  )
}
