import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Cmp } from '../lib/types2'

type Drug = { brand: string; year: number | null; trial_female_pct: number; faers_female_pct: number | null; gap: number | null; rate_ratio: number | null; snapshot_url: string; label_sex?: string | null; label_no_preg?: boolean | null; label_no_lact?: boolean | null; label_flat?: boolean | null }
type Cond = {
  disease: string
  funding: { funding_m: number; dalys_k?: number; female_share?: number; dollars_per_daly?: number; ratio_to_expected?: number; rank_by_ratio?: number; n_ranked?: number; skew?: string; uncounted?: boolean }
  drugs: Drug[]
  ed: { complaint: string; n: number; metrics: Record<string, Cmp | null> } | null
  trials: { trials: number; participants: number; female_pct: number | null; burden_female_pct?: number | null; ratio?: number | null; rank?: number | null; excl_preg_pct?: number; contra_pct?: number; max_age_pct?: number; outcome_by_sex?: number; sex_specific?: boolean; industry_female_pct?: number | null; academic_female_pct?: number | null; n_ranked?: number; uncounted?: boolean } | null
  ed_label: { complaint: string; n: number; metrics: Record<string, Cmp | null> } | null
  cancer?: { label: string; cases_women: number; cases_men: number; distant: Cmp; localized: { women: number; men: number }; median_age: { women: number; men: number } | null } | null
}
const money = (m: number) => m >= 1000 ? `$${(m / 1000).toFixed(2)} billion` : `$${m.toFixed(0)} million`
const Tile = ({ v, l, c = 'text-berry' }: { v: string; l: string; c?: string }) => <div className="rounded-2xl bg-blush-2/60 p-4"><div className={`display text-3xl font-light leading-none ${c}`}>{v}</div><p className="mt-2 text-xs text-ink-2 leading-snug">{l}</p></div>
const Row = ({ label, c, unit = '%' }: { label: string; c: Cmp | null | undefined; unit?: string }) => {
  if (!c) return null
  const clear = c.diff_lo > 0 || c.diff_hi < 0
  const f = (v: number) => unit === '%' ? `${v.toFixed(0)}%` : unit === '' ? v.toFixed(1) : `${v.toFixed(0)}${unit}`
  return <tr className="border-t border-hairline/60"><td className="py-2 pr-3 text-ink">{label}</td><td className="py-2 pr-3 text-right tabular-nums font-semibold">{f(c.women.est)}</td><td className="py-2 pr-3 text-right tabular-nums font-semibold">{f(c.men.est)}</td><td className={`py-2 text-right tabular-nums ${clear ? 'font-bold text-berry' : 'text-ink-3'}`}>{c.diff > 0 ? '+' : ''}{unit === '' ? c.diff.toFixed(1) : c.diff.toFixed(0)}{unit === '%' ? ' pts' : unit}</td></tr>
}

/** One condition, everything the chapters know about it. */
export default function Record() {
  const [data, setData] = useState<{ generated: string; conditions: Cond[] } | null>(null)
  const [pick, setPick] = useState('Migraine')
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/record.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const c = data.conditions.find(x => x.disease === pick) ?? data.conditions[0]
  const F = c.funding
  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-16 fade-up">
      <header className="text-center pb-10">
        <p className="eyebrow">The record</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">One condition, every chapter</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Pick a condition. This pulls together what the chapters know about it: who it burdens, what research it gets, who is in its trials, who its drugs were tested on, and how its patients fare in the emergency department.</p>
        <p className="mt-6 text-[15px] text-ink-2">Show me{' '}
          <select value={c.disease} onChange={e => setPick(e.target.value)} className="rounded-full border border-hairline bg-white px-4 py-2 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10" aria-label="Condition">
            {data.conditions.map(x => <option key={x.disease} value={x.disease}>{x.disease}</option>)}
          </select>
        </p>
      </header>

      <section className="graphic-card p-5 sm:p-7">
        <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">Who it burdens, what it gets</h2><Link to="/chapters/funding-vs-burden" className="text-xs text-berry underline underline-offset-2">Chapter 3</Link></div>
        {F.uncounted ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink">NIH spent <b>{money(F.funding_m)}</b> on this condition in fiscal 2024. The World Health Organization has no burden estimate for it, so it cannot be placed on the funding-to-burden chart at all. It is one of {data.conditions.filter(x => x.funding.uncounted).length} such conditions, nearly all of which fall mostly on women.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile v={`${F.female_share!.toFixed(0)}%`} l="of its US burden falls on women" />
            <Tile v={F.dalys_k! >= 1000 ? `${(F.dalys_k! / 1000).toFixed(1)}M` : `${F.dalys_k!.toFixed(0)}k`} l="healthy years lost in the US a year" />
            <Tile v={money(F.funding_m)} l="NIH funding, fiscal 2024" />
            <Tile v={`$${F.dollars_per_daly!.toLocaleString()}`} l={`per year lost; ${F.ratio_to_expected!.toFixed(2)}× what the burden predicts, rank ${F.rank_by_ratio} of ${F.n_ranked} (1 = most underfunded)`} />
          </div>
        )}
      </section>

      <section className="graphic-card p-5 sm:p-7 mt-6">
        <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">Who is in its trials</h2><Link to="/chapters/who-gets-studied" className="text-xs text-berry underline underline-offset-2">Chapter 4</Link></div>
        {!c.trials ? <p className="mt-3 text-[15px] text-ink-2">Fewer than ten US trials with posted results could be matched to this condition.</p> : c.trials.uncounted || c.trials.sex_specific || c.trials.ratio == null ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink">ClinicalTrials.gov holds <b>{c.trials.trials.toLocaleString()}</b> US trials with posted results for this condition, enrolling {c.trials.participants.toLocaleString()} people, <b>{c.trials.female_pct?.toFixed(0)}%</b> of them women.{c.trials.uncounted ? ' There is no WHO burden estimate to compare that with.' : ''}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile v={c.trials.trials.toLocaleString()} l={`US trials with results, ${c.trials.participants.toLocaleString()} participants`} />
            <Tile v={`${c.trials.female_pct?.toFixed(0)}%`} l={`women in the trials, against ${c.trials.burden_female_pct?.toFixed(0)}% of the burden: ${c.trials.ratio?.toFixed(2)}× parity, rank ${c.trials.rank} of ${c.trials.n_ranked} (1 = most under-enrolled)`} />
            <Tile v={`${c.trials.industry_female_pct != null ? c.trials.industry_female_pct.toFixed(0) + '%' : '–'} / ${c.trials.academic_female_pct != null ? c.trials.academic_female_pct.toFixed(0) + '%' : '–'}`} l="women in industry / academic trials" />
            <Tile v={`${c.trials.outcome_by_sex}`} l={`trials reporting any result by sex; ${c.trials.excl_preg_pct?.toFixed(0)}% exclude pregnant women, ${c.trials.max_age_pct?.toFixed(0)}% cap age`} />
          </div>
        )}
      </section>

      <section className="graphic-card p-5 sm:p-7 mt-6">
        <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">Who its drugs were tested on</h2><Link to="/chapters/tested-on-men" className="text-xs text-berry underline underline-offset-2">Chapter 1</Link></div>
        {c.drugs.length === 0 ? <p className="mt-3 text-[15px] text-ink-2">No novel drug approved since 2015 lists this condition in its FDA snapshot indication.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[13px] sm:text-[14px]">
              <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Drug</th><th className="py-2 pr-3 text-right font-bold">Approved</th><th className="py-2 pr-3 text-right font-bold">Women in trials</th><th className="py-2 pr-3 text-right font-bold">Reports from women</th><th className="py-2 pr-3 text-right font-bold">Reports per user, W/M</th><th className="py-2 text-left font-bold">Label on sex · pregnancy data</th></tr></thead>
              <tbody>{c.drugs.map(d => (
                <tr key={d.brand} className="border-t border-hairline/60"><td className="py-2 pr-3"><a href={d.snapshot_url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-berry">{d.brand}</a></td><td className="py-2 pr-3 text-right tabular-nums">{d.year ?? ''}</td><td className={`py-2 pr-3 text-right tabular-nums ${d.trial_female_pct < 30 ? 'font-bold text-berry' : ''}`}>{d.trial_female_pct.toFixed(0)}%</td><td className="py-2 pr-3 text-right tabular-nums">{d.faers_female_pct != null ? `${d.faers_female_pct.toFixed(0)}%` : '–'}</td><td className="py-2 pr-3 text-right tabular-nums">{d.rate_ratio != null ? `${d.rate_ratio.toFixed(1)}×` : '–'}</td><td className="py-2 text-[12px] text-ink-2">{d.label_sex ? <>{d.label_sex}{d.label_no_preg != null ? ` · ${d.label_no_preg ? 'none or insufficient' : 'some'}` : ''}</> : '–'}</td></tr>
              ))}</tbody>
            </table>
            <p className="mt-2 text-[11px] text-ink-3">Drugs whose FDA snapshot indication mentions this condition. Bold: trials under 30% women. Reports per user needs enough surveyed users and is blank for most specialty drugs. The last column is what the current label's pharmacology section says about sex (<Link to="/chapters/male-default" className="underline">Chapter 6</Link>), and whether it reports human pregnancy data.</p>
          </div>
        )}
      </section>

      <section className="graphic-card p-5 sm:p-7 mt-6">
        <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">In the emergency department</h2><Link to="/chapters/pain-gap" className="text-xs text-berry underline underline-offset-2">Chapter 2</Link></div>
        {!c.ed ? <p className="mt-3 text-[15px] text-ink-2">The emergency department chapter covers pain complaints; this condition does not map onto one of them.</p> : (
          <div className="mt-3 overflow-x-auto">
            <p className="text-[13px] text-ink-2 mb-2">Adult visits where the main complaint was <b>{c.ed.complaint.toLowerCase()}</b>, 2018–2022, {c.ed.n.toLocaleString()} sampled visits.</p>
            <table className="w-full border-collapse text-[13px] sm:text-[14px]">
              <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Of those visits…</th><th className="py-2 pr-3 text-right font-bold text-rose">Women</th><th className="py-2 pr-3 text-right font-bold text-bronze">Men</th><th className="py-2 text-right font-bold">Gap</th></tr></thead>
              <tbody>
                <Row label="rated their pain 7 to 10" c={c.ed.metrics.severe_share} /><Row label="arrived by ambulance" c={c.ed.metrics.ems} /><Row label="were triaged urgent" c={c.ed.metrics.urgent} /><Row label="minutes to see a clinician" c={c.ed.metrics.wait_mean} unit=" min" /><Row label="were given any painkiller" c={c.ed.metrics.analgesic_ed} /><Row label="were given an opioid" c={c.ed.metrics.opioid_ed} /><Row label="were given an opioid, pain 7 to 10" c={c.ed.metrics.opioid_ed_severe} /><Row label="were admitted" c={c.ed.metrics.admitted} />
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-ink-3">A gap in bold is one the 95% interval does not reach across. Full intervals in the chapter and the data files.</p>
          </div>
        )}
      </section>
      {c.cancer && (
        <section className="graphic-card p-5 sm:p-7 mt-6">
          <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">When it was found</h2><Link to="/chapters/sent-home-with-a-label" className="text-xs text-berry underline underline-offset-2">Chapter 5</Link></div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile v={`${c.cancer.distant.women.est.toFixed(0)}%`} l="of women's cases found after the cancer had spread" />
            <Tile v={`${c.cancer.distant.men.est.toFixed(0)}%`} l="of men's cases found after it had spread" c="text-bronze" />
            <Tile v={`${c.cancer.distant.diff > 0 ? '+' : ''}${c.cancer.distant.diff.toFixed(1)} pts`} l={`women minus men, interval ${c.cancer.distant.diff_lo.toFixed(1)} to ${c.cancer.distant.diff_hi.toFixed(1)}; ${(c.cancer.cases_women + c.cancer.cases_men).toLocaleString()} cases 2013–2022`} />
            {c.cancer.median_age && <Tile v={`${c.cancer.median_age.women} / ${c.cancer.median_age.men}`} l="median age at diagnosis, women / men, 2018–2022" />}
          </div>
        </section>
      )}
      {c.ed_label && (
        <section className="graphic-card p-5 sm:p-7 mt-6">
          <div className="flex items-baseline justify-between gap-4"><h2 className="display text-xl font-medium">What the visit was called</h2><Link to="/chapters/sent-home-with-a-label" className="text-xs text-berry underline underline-offset-2">Chapter 5</Link></div>
          <div className="mt-3 overflow-x-auto">
            <p className="text-[13px] text-ink-2 mb-2">Adult non-injury visits where the main complaint was <b>{c.ed_label.complaint.toLowerCase()}</b>, 2018–2022, {c.ed_label.n.toLocaleString()} sampled visits.</p>
            <table className="w-full border-collapse text-[13px] sm:text-[14px]">
              <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Of those visits…</th><th className="py-2 pr-3 text-right font-bold text-rose">Women</th><th className="py-2 pr-3 text-right font-bold text-bronze">Men</th><th className="py-2 text-right font-bold">Gap</th></tr></thead>
              <tbody>
                <Row label="tests ordered, on average" c={c.ed_label.metrics.tests_count} unit="" /><Row label="got any imaging" c={c.ed_label.metrics.anyimage} /><Row label="left with a symptom code, not a diagnosis" c={c.ed_label.metrics.symptom_dx} /><Row label="had an anxiety or stress code attached" c={c.ed_label.metrics.anxiety_any} /><Row label="were admitted" c={c.ed_label.metrics.admitted} /><Row label="had been in the same ED in the last 72 hours" c={c.ed_label.metrics.seen72} />
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p className="mt-8 text-sm text-ink-2 text-center">Every figure here links to its chapter and its source. Download the full tables on the <Link to="/data" className="text-berry underline underline-offset-2">data page</Link>.</p>
    </div>
  )
}
