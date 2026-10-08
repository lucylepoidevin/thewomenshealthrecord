import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import Lollipop from '../components/charts/Lollipop'
import MultiLine from '../components/charts/MultiLine'
import ChartFrame from '../components/charts/ChartFrame'

type Share = { trials: number; participants: number; female_pct: number | null }
type Disease = {
  disease: string; sex_specific: boolean; trials: number; trials_sex_counted: number; participants: number; female_pct: number | null; female_pct_open: number | null; trials_open: number; female_only_trials: number; male_only_trials: number
  burden_female_pct: number | null; dalys_k: number | null; skew: string | null; funding_m: number | null
  by_sponsor: Record<string, Share>; by_period: Record<string, Share>; by_phase: Record<string, Share>
  excl_preg_pct: number; excl_lact_pct: number; contra_pct: number; wocbp_pct: number; pregtest_pct: number; max_age_pct: number; max_age_le75_pct: number; max_age_le65_pct: number; outcome_by_sex: number; sample_nct: string[]
  ratio?: number; ratio_open?: number | null; gap_pts?: number; trials_per_100k_dalys?: number; participants_per_1k_dalys?: number; by_sponsor_ratio?: Record<string, number | null>; by_period_ratio?: Record<string, number | null>; expected_trials?: number; trials_ratio_to_expected?: number; rank?: number
}
type Trend = { year: number; trials: number; female_pct: number; industry_female_pct: number | null; nih_female_pct: number | null; other_female_pct: number | null; median_trial_female_pct: number; excl_preg_pct: number; contra_pct: number; wocbp_pct: number; excl_lact_pct: number; max_age_pct: number; outcome_by_sex_pct: number }
type Excl = { trials: number; excl_preg_pct: number | null; contra_pct: number | null; wocbp_pct: number | null; excl_lact_pct: number | null; pregtest_pct?: number | null; max_age_pct?: number | null; max_age_le75_pct?: number | null }
type Data = {
  generated: string
  summary: { trials_total: number; trials_us: number; trials_with_sex: number; participants_us: number; female_pct_us_open: number; n_diseases: number; n_under: number; n_over: number; median_ratio_female_skew: number | null; median_ratio_male_skew: number | null; median_ratio_balanced: number; excl_preg_pct_us: number; contra_pct_us: number; wocbp_pct_us: number; excl_lact_pct_us: number; max_age_pct_us: number; female_only_trials_us: number; male_only_trials_us: number; male_only_nonsexspecific_us: number; female_only_nonsexspecific_us: number; share_hist: number[] }
  diseases: Disease[]; sex_specific: Disease[]; uncounted: { condition: string; trials: number; participants: number; female_pct: number | null; sex_specific: boolean }[]; trend: Trend[]
  exclusions: { by_phase: Record<string, Excl>; by_sponsor: Record<string, Excl>; drug_trials: Excl; non_drug_trials: Excl; older_diseases: Record<string, Excl> }
  by_sex_reporting: { trials: number; n: number; pct: number; by_sponsor: Record<string, { trials: number; n: number; pct: number }>; nih_since_2016: { trials: number; n: number; pct: number }; phase3_drug: { trials: number; n: number; pct: number } }
  sponsor_overall: Record<string, Share>; sponsor_pairs: { disease: string; industry: number | null; nih: number | null; other: number | null; burden: number | null; n_industry: number; n_nih: number; n_other: number }[]
}
const col = (s: string | null) => (s === 'female' ? 'var(--c-female)' : s === 'male' ? 'var(--c-male)' : 'var(--c-muted)')
const m = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)} million` : n.toLocaleString()

function DiseaseTable({ diseases, source }: { diseases: Disease[]; source: string }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'ratio' | 'trials' | 'disease'>('ratio')
  const rows = useMemo(() => diseases.filter(d => d.disease.toLowerCase().includes(q.toLowerCase())).sort((a, b) => sort === 'ratio' ? (a.ratio ?? 9) - (b.ratio ?? 9) : sort === 'trials' ? b.trials - a.trials : a.disease.localeCompare(b.disease)), [diseases, q, sort])
  return (
    <ChartFrame title="Every disease, every number" subtitle="US trials with posted results. Women's share of participants against women's share of US burden; what the eligibility text excludes." source={source}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a disease" aria-label="Find a disease" className="rounded-full border border-hairline bg-white px-4 py-2 text-[14px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10" />
        <span className="text-[12px] text-ink-3">Sort by</span>
        {(['ratio', 'trials', 'disease'] as const).map(k => <button key={k} onClick={() => setSort(k)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${sort === k ? 'bg-berry text-white' : 'bg-blush-2/70 text-ink-2 hover:bg-blush-2'}`}>{k === 'ratio' ? 'women vs burden' : k === 'trials' ? 'number of trials' : 'name'}</button>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] sm:text-[13px]">
          <thead><tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Disease</th><th className="py-2 pr-3 text-right font-bold">Trials</th><th className="py-2 pr-3 text-right font-bold">Participants</th><th className="py-2 pr-3 text-right font-bold text-rose">Women in trials</th><th className="py-2 pr-3 text-right font-bold">Women in burden</th><th className="py-2 pr-3 text-right font-bold">Ratio</th><th className="py-2 pr-3 text-right font-bold">Industry / other</th><th className="py-2 pr-3 text-right font-bold">Exclude pregnant</th><th className="py-2 pr-3 text-right font-bold">Require contraception</th><th className="py-2 text-right font-bold">Upper age limit</th></tr></thead>
          <tbody>{rows.map(d => (
            <tr key={d.disease} className="border-t border-hairline/60">
              <td className="py-2 pr-3"><span className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle" style={{ background: col(d.skew) }} />{d.disease}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{d.trials.toLocaleString()}</td><td className="py-2 pr-3 text-right tabular-nums">{d.participants.toLocaleString()}</td>
              <td className="py-2 pr-3 text-right tabular-nums font-semibold">{d.female_pct?.toFixed(0)}%</td><td className="py-2 pr-3 text-right tabular-nums">{d.burden_female_pct != null ? `${d.burden_female_pct.toFixed(0)}%` : '–'}</td>
              <td className={`py-2 pr-3 text-right tabular-nums ${d.ratio != null && d.ratio < 0.9 ? 'font-bold text-berry' : ''}`}>{d.ratio != null ? `${d.ratio.toFixed(2)}×` : '–'}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{d.by_sponsor.Industry.female_pct != null ? `${d.by_sponsor.Industry.female_pct.toFixed(0)}%` : '–'} / {d.by_sponsor['Universities, hospitals, other'].female_pct != null ? `${d.by_sponsor['Universities, hospitals, other'].female_pct.toFixed(0)}%` : '–'}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{d.excl_preg_pct.toFixed(0)}%</td><td className="py-2 pr-3 text-right tabular-nums">{d.contra_pct.toFixed(0)}%</td><td className="py-2 text-right tabular-nums">{d.max_age_pct.toFixed(0)}%</td>
            </tr>
          ))}</tbody>
        </table>
        <p className="mt-2 text-[11px] text-ink-3">Dot colour: rose mostly women, bronze mostly men, grey mixed (by burden). Ratio in bold: women under 90% of their burden share. Sex-specific diseases have no ratio.</p>
      </div>
    </ChartFrame>
  )
}

export default function Chapter4() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter4.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const S = data.summary, D = data.diseases, R = data.by_sex_reporting, X = data.exclusions, tr = data.trend
  const get = (n: string) => D.find(d => d.disease === n)!
  const stroke = get('Stroke'), schiz = get('Schizophrenia'), copd = get('COPD'), alz = get("Alzheimer's and other dementias"), chd = get('Coronary heart disease'), dep = get('Depression')
  const src = `Source: ClinicalTrials.gov, interventional studies with posted results and at least one US site (${S.trials_us.toLocaleString()} trials); WHO Global Health Estimates 2021, US DALYs by sex. Analysis by Lucca Labs.`
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const first = tr[0]
  const va = data.sponsor_overall['Other US government']
  const older = X.older_diseases
  const pairs = data.sponsor_pairs.filter(p => p.industry != null && p.other != null && p.burden != null).sort((a, b) => (a.industry! - a.burden!) - (b.industry! - b.burden!))
  const pct = (v: number | null | undefined, d = 0) => v == null ? '–' : `${v.toFixed(d)}%`

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Since 2008, every trial that could change American medicine has had to post its results in public, including how many of its participants were women.</p>
      <p>Chapter 1 scored the drugs: who was in the pivotal trials of each new medicine. This chapter scores the diseases. ClinicalTrials.gov now holds results for {S.trials_total.toLocaleString()} interventional trials, {S.trials_us.toLocaleString()} of them with a site in the United States, together enrolling {m(S.participants_us)} people whose sex was counted.<Cite id="ctgov" /> We matched each trial's conditions to the {S.n_diseases} diseases whose burden on American women and men the World Health Organization estimates,<Cite id="who-ghe" /> and asked the question a 2021 study asked of the years 2000 to 2020,<Cite id="steinberg-2021" /> with five more years of trials and a different set of tools: for each disease, is the share of women in the trials the share of women in the disease?</p>
      <p>Then we read the fine print. Every trial publishes its eligibility criteria, the rules for who may enrol. We read all {S.trials_us.toLocaleString()} of them for the words that have kept women out of research since 1977: pregnancy, breastfeeding, contraception, "childbearing potential".<Cite id="fda-1993" /> And we counted the trials that, having enrolled women, reported a single result separately for them.</p>
    </>),
    T('ratio', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The share of women in the trial, against the share of women in the disease.</p>
      <p>Across trials open to both sexes, women are {pct(S.female_pct_us_open, 1)} of participants, up from {pct(first.female_pct, 1)} among trials that began in {first.year}. In aggregate the problem looks solved. Disease by disease it is not, and the direction of the remaining gaps is not what the aggregate suggests. The chart ranks every disease by the ratio of women's share of participants to women's share of burden. One is parity.</p>
    </>),
    F('ratio-fig', <Lollipop rows={D.map(d => ({ label: d.disease, sub: `${d.trials.toLocaleString()} trials · ${d.female_pct?.toFixed(0)}% women in trials, ${d.burden_female_pct?.toFixed(0)}% of burden`, value: d.ratio!, color: col(d.skew), tip: <><b>{d.disease}</b><br />{d.participants.toLocaleString()} participants, {d.female_pct?.toFixed(1)}% women<br />{d.burden_female_pct?.toFixed(1)}% of US healthy years lost are women's<br />Industry trials {pct(d.by_sponsor.Industry.female_pct)} women · other sponsors {pct(d.by_sponsor['Universities, hospitals, other'].female_pct)}</> }))} title="Women in the trials, relative to women in the disease" subtitle={`${D.length} diseases, ranked. Women's share of US trial participants divided by women's share of US burden. 1× is parity.`} source={src} axisLabel="participation ÷ burden (log scale)" fmt={v => `${v}×`} log reference={{ value: 1, label: 'parity' }} legend={[{ label: 'Mostly women', color: 'var(--c-female)' }, { label: 'Mostly men', color: 'var(--c-male)' }, { label: 'Mixed', color: 'var(--c-muted)' }]} />, 'tall'),
    T('ratio-text', <>
      <p>Read the bottom of the chart. Stroke, where women carry {stroke.burden_female_pct?.toFixed(0)}% of the burden, enrols {stroke.female_pct?.toFixed(0)}% women across {stroke.trials} trials: a ratio of {stroke.ratio}. Schizophrenia, {schiz.ratio}. COPD, {copd.ratio}. Coronary heart disease, {chd.ratio}. Alzheimer's, the disease with the largest female majority on the chart, {alz.ratio}. Depression, which falls {dep.burden_female_pct?.toFixed(0)}% on women, {dep.ratio}. These are the biggest killers and disablers of older women, and they are the diseases where the trials still look most unlike the patients.</p>
      <p>Now read the top. The diseases where women are enrolled furthest beyond their burden are the diseases of men: suicide and self-harm, oesophageal cancer, cirrhosis, alcohol and drug use disorders, hepatitis B. The typical mostly-men disease enrols women at {S.median_ratio_male_skew}× their burden; the typical mostly-women disease at {S.median_ratio_female_skew}×. The 2021 study saw the same asymmetry and it has not moved. Trial populations are not drifting towards the patients. They are drifting towards an even split, which over-represents women where men are sick and under-represents them where women are.</p>
    </>),
    T('sponsor', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Same disease, different sponsor.</p>
      <p>Who runs the trial matters more than what the trial is for. For the diseases with enough trials of each kind to compare, industry-sponsored trials enrol fewer women than trials run by universities and hospitals, in the same disease, in the same years. For stroke, industry trials are {pct(stroke.by_sponsor.Industry.female_pct)} women and academic trials {pct(stroke.by_sponsor['Universities, hospitals, other'].female_pct)}, against a burden that is {pct(stroke.burden_female_pct)} women's. For COPD, {pct(copd.by_sponsor.Industry.female_pct)} against {pct(copd.by_sponsor['Universities, hospitals, other'].female_pct)}. The drugs that reach the market are tested in the trials on the left of each pair.</p>
      <p>One sponsor stands apart. Trials run by other federal agencies, almost all the Department of Veterans Affairs, are {pct(va.female_pct, 1)} women across {m(va.participants)} participants. That is the veteran population, and it is a reminder that a large body of American evidence on heart disease, diabetes and mental health was produced in a population that is nine-tenths men.</p>
    </>),
    F('sponsor-fig', (
      <ChartFrame title="Industry against academic trials, same disease" subtitle="Women's share of participants by sponsor, for diseases with at least ten trials of each kind. Sorted by how far industry falls short of the burden." source={src}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] sm:text-[14px]">
            <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Disease</th><th className="py-2 pr-3 text-right font-bold">Industry trials</th><th className="py-2 pr-3 text-right font-bold">Academic trials</th><th className="py-2 pr-3 text-right font-bold">NIH trials</th><th className="py-2 text-right font-bold">Women in burden</th></tr></thead>
            <tbody>{pairs.map(p => (
              <tr key={p.disease} className="border-t border-hairline/60"><td className="py-2 pr-3 text-ink">{p.disease}</td><td className={`py-2 pr-3 text-right tabular-nums ${p.industry! < p.burden! - 5 ? 'font-bold text-berry' : ''}`}>{pct(p.industry)}<span className="text-ink-3 text-[11px]"> ({p.n_industry})</span></td><td className="py-2 pr-3 text-right tabular-nums">{pct(p.other)}<span className="text-ink-3 text-[11px]"> ({p.n_other})</span></td><td className="py-2 pr-3 text-right tabular-nums">{p.n_nih >= 5 ? pct(p.nih) : '–'}<span className="text-ink-3 text-[11px]"> ({p.n_nih})</span></td><td className="py-2 text-right tabular-nums">{pct(p.burden)}</td></tr>
            ))}</tbody>
          </table>
          <p className="mt-2 text-[11px] text-ink-3">Number of trials in brackets. Bold: industry trials more than five points below the burden share.</p>
        </div>
      </ChartFrame>
    )),
    T('excl', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The fine print.</p>
      <p>In 1977 the FDA told drug companies to keep women who could become pregnant out of early trials. In 1993 it reversed that guidance.<Cite id="fda-1993" /> The eligibility criteria show what reversal looks like thirty years on. Of the {S.trials_us.toLocaleString()} US trials, {pct(S.excl_preg_pct_us)} exclude pregnant women, {pct(S.excl_lact_pct_us)} exclude breastfeeding women, {pct(S.contra_pct_us)} require contraception, and {pct(S.wocbp_pct_us)} single out "women of childbearing potential" for extra conditions. Among drug trials the figures are {pct(X.drug_trials.excl_preg_pct)}, {pct(X.drug_trials.excl_lact_pct)}, {pct(X.drug_trials.contra_pct)} and {pct(X.drug_trials.wocbp_pct)}.</p>
      <p>Some of that is caution a reasonable person would want. Some of it is reflex. {pct(older["Alzheimer's and other dementias"].contra_pct)} of Alzheimer's drug trials require contraception. {pct(older["Macular degeneration"].contra_pct)} of macular degeneration trials do, for a disease of the over-seventies. {pct(older["Parkinson's disease"].contra_pct)} of Parkinson's trials. The clause is pasted in before anyone asks who the patients are.</p>
      <p>And there is the other exclusion, the one that bites hardest on women because women live longer and carry more of the burden of old age. {pct(S.max_age_pct_us)} of US trials set an upper age limit. For Alzheimer's it is {pct(older["Alzheimer's and other dementias"].max_age_pct)}; for osteoarthritis {pct(older.Osteoarthritis.max_age_pct)}; for stroke {pct(older.Stroke.max_age_pct)}. A disease of eighty-year-old women, studied with a door that closes at a birthday.</p>
    </>),
    F('excl-fig', <MultiLine series={[{ label: 'Exclude pregnant women', color: 'var(--c-female)', points: tr.map(t => ({ x: t.year, y: t.excl_preg_pct })) }, { label: 'Exclude breastfeeding women', color: 'var(--c-rose, #C2567E)', points: tr.map(t => ({ x: t.year, y: t.excl_lact_pct })) }, { label: 'Require contraception', color: 'var(--c-male)', points: tr.map(t => ({ x: t.year, y: t.contra_pct })) }, { label: '"Childbearing potential" clause', color: 'var(--c-muted)', points: tr.map(t => ({ x: t.year, y: t.wocbp_pct })) }, { label: 'Upper age limit', color: 'var(--c-ink, #2A1F26)', points: tr.map(t => ({ x: t.year, y: t.max_age_pct })) }]} title="What the eligibility text excludes, by the year the trial began" subtitle="Share of US trials with posted results whose criteria contain each exclusion" source={`${src} Rules for each phrase are on the methods page; the mix of trial types changes over time, so read the lines as a description, not a trend in policy.`} yLabel="share of trials" fmt={v => `${v.toFixed(0)}%`} />, 'chart'),
    T('report', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Enrolled, counted, and then averaged away.</p>
      <p>Here is the number this chapter exists for. Of {R.trials.toLocaleString()} US trials with posted results, {R.n} report any outcome separately for women and men. That is {R.pct}%. Among phase 3 drug trials, the ones that decide what gets approved and at what dose, it is {R.phase3_drug.n} of {R.phase3_drug.trials.toLocaleString()}. Industry: {R.by_sponsor.Industry.n} of {R.by_sponsor.Industry.trials.toLocaleString()}. NIH-funded trials that began after the 2016 policy requiring sex to be considered as a biological variable: {R.nih_since_2016.n} of {R.nih_since_2016.trials}.<Cite id="nih-sabv" /></p>
      <p>Every one of these trials counted its women at the door. Almost none of them tell you whether the drug worked differently for them, or hurt them differently, once they were inside. The data exist, in the sponsors' files. The registry asks for the total. Chapter 1 showed that women report more adverse events than their trial share would predict for drug after drug. This is the reason nobody can say, from the trial, whether that was foreseeable: the trial was never reported in a way that could have shown it.</p>
    </>),
    T('uncounted', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The conditions with trials but no burden.</p>
      <p>Chapter 3 found a list of conditions NIH funds that the World Health Organization has never measured, nearly all of them women's. They cannot be put on this chapter's chart either, but their trials can be counted. Fibromyalgia has {data.uncounted.find(u => u.condition === 'Fibromyalgia')?.trials} US trials with results, {pct(data.uncounted.find(u => u.condition === 'Fibromyalgia')?.female_pct)} women. Lupus, {data.uncounted.find(u => u.condition === 'Lupus')?.trials}. Chronic fatigue syndrome, {data.uncounted.find(u => u.condition === 'ME/CFS')?.trials}. Postural tachycardia syndrome, {data.uncounted.find(u => u.condition === 'POTS')?.trials}. For comparison, there are {get('Hepatitis C').trials} for hepatitis C.</p>
    </>),
    F('uncounted-fig', <Lollipop rows={[...data.uncounted].sort((a, b) => b.trials - a.trials).map(u => ({ label: u.condition, sub: u.female_pct != null ? `${u.female_pct.toFixed(0)}% women` : undefined, value: u.trials, color: 'var(--c-female)' }))} title="Trials with results for the conditions nobody measures" subtitle="US interventional trials with posted results, conditions with no WHO burden estimate" source={src} axisLabel="trials with posted results" fmt={v => v.toFixed(0)} />),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>A trial's conditions are matched to diseases through the registry's own medical subject headings, which is good for common diseases and rough at the edges; every match is in the data file. Trials with results are the trials that finished and complied; the registry also holds many that did not. Burden is a national figure and trials recruit where sites are. The exclusion counts come from reading text with rules, which miss some phrasings and catch some that are not exclusions; the rules are published and the counts move by a few points when they change. "Reports a result by sex" is detected from the names of the groups a result is reported for, so a trial that buried a sex analysis in a free-text description would be missed; we doubt there are many.</p>
      <p>What the data say firmly: women are under-enrolled in the diseases that kill and disable older women, industry trials are further from the patients than academic ones for the same disease, old reflexes about pregnancy are written into trials for diseases of the old, and almost no trial tells you what it found in women.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>Every number above is on ClinicalTrials.gov for any trial you are asked to join or any drug you are offered: who was enrolled, who was excluded, and whether results were reported by sex. Look your disease up below. If you are over 65 and the trials that tested your treatment stopped at 75, that is worth knowing. If you are a woman with stroke or heart disease, the evidence base is a third women; ask your clinician what is known about dosing and side effects in women specifically, because the answer, for most drugs, is in a file nobody has opened.</p>
    </>),
    F('table', <DiseaseTable diseases={[...D, ...data.sex_specific]} source={src} />),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 4</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">Who gets <span className="italic font-medium text-berry">studied</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">{S.trials_us.toLocaleString()} trials, {m(S.participants_us)} people: the share of women in each disease's trials against the share of women in the disease, what the fine print excludes, and how few trials ever say what they found in women.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · ClinicalTrials.gov, retrieved {data.generated} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['ctgov', 'who-ghe', 'steinberg-2021', 'fda-1993', 'nih-sabv']} />
      </section>
    </article>
  )
}
