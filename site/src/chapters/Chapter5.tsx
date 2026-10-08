import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import SexCompare from '../components/charts/SexCompare'
import Lollipop from '../components/charts/Lollipop'
import ChartFrame from '../components/charts/ChartFrame'
import type { Cmp, AgeAdj } from '../lib/types2'

type Model = { label: string; note: string; n: number; or: number; lo: number; hi: number; p: number; formula: string }
type Group = { id: string; label: string; n: number; n_women: number; n_men: number; weighted_visits_per_year_k: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj>; by_age: Record<string, Record<string, Cmp | number | null>>; named?: { label: string; cmp: Cmp | null }[] }
type Cell = { complaint: string; age: string; n_women: number; n_men: number; metrics: Record<string, Cmp | null> }
type Data = {
  generated: string; years: [number, number]; n_adult_visits: number
  overall: { n: number; n_women: number; n_men: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj> }
  symptoms: { n: number; n_women: number; n_men: number; weighted_visits_per_year_m: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj | null>; by_age: Record<string, Record<string, Cmp | null>>; by_year: { year: number; symptom_dx: Cmp; anxiety_any: Cmp; seen72: Cmp }[]; by_tests: { tests: string; symptom_dx: Cmp; anxiety_any: Cmp }[]; return_by_label: Record<string, Cmp | null> }
  anxiety: { n_cardio: number; baseline_rfv_anxiety: Cmp; baseline_rfv_psych: Cmp; baseline_injury_anxiety_code: Cmp; symptom_visits_anxiety_code: Cmp; symptom_visits_anxiety_code_no_rfv: Cmp; symptom_visits_anxiety_primary: Cmp; symptom_visits_depression_code: Cmp; symptom_visits_psych_code: Cmp; cardio_anxiety_code: Cmp; cardio_anxiety_by_age: Record<string, Cmp>; cardio_anxiety_age_adjusted: AgeAdj; cardio_labelled_anxiety: Record<string, Cmp | number | null>; cardio_not_labelled: Record<string, Cmp | null>; by_complaint: { id: string; label: string; anxiety_any: Cmp; anxiety_no_rfv: Cmp }[] }
  groups: Group[]; explorer: Cell[]; models: Record<string, Model>; models_note: string
}

const pct = (v: number, d = 0) => `${v.toFixed(d)}%`
const COMPLAINTS: [string, string][] = [['all', 'any of these'], ['chest', 'chest pain'], ['sob', 'shortness of breath'], ['palpitations', 'palpitations'], ['syncope', 'fainting'], ['dizziness', 'dizziness'], ['abdominal', 'abdominal pain'], ['nausea', 'nausea or vomiting'], ['headache', 'a headache'], ['weakness', 'weakness or fatigue'], ['back', 'back pain'], ['flank', 'flank, rib or groin pain'], ['limb', 'neck, hip, leg or joint pain']]
const AGES: [string, string][] = [['all', 'any age'], ['18-44', '18 to 44'], ['45-64', '45 to 64'], ['65+', '65 or older']]
const ROWS: { key: string; label: string; unit: string }[] = [
  { key: 'tests_count', label: 'tests ordered, on average', unit: '' }, { key: 'blood', label: 'get blood tests', unit: '%' }, { key: 'anyimage', label: 'get any imaging', unit: '%' }, { key: 'ct', label: 'get a CT scan', unit: '%' },
  { key: 'urgent', label: 'are triaged urgent', unit: '%' }, { key: 'symptom_dx', label: 'leave with a symptom code, not a diagnosis', unit: '%' }, { key: 'anxiety_any', label: 'have an anxiety or stress code attached', unit: '%' }, { key: 'psych_any', label: 'have any psychiatric code attached', unit: '%' },
  { key: 'admitted', label: 'are admitted', unit: '%' }, { key: 'seen72', label: 'had been in the same ED in the last 72 hours', unit: '%' }, { key: 'lov_mean', label: 'minutes in the department', unit: ' min' },
]

function Explorer({ cells, source }: { cells: Cell[]; source: string }) {
  const [complaint, setComplaint] = useState('dizziness')
  const [age, setAge] = useState('all')
  const cell = cells.find(c => c.complaint === complaint && c.age === age)
  const sel = 'rounded-full border border-hairline bg-white px-3 py-1.5 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10'
  return (
    <ChartFrame title="Look up a visit like yours" subtitle="Pick the complaint and age band. Women and men in that group, side by side, with the 95% interval." source={source}>
      <p className="text-[15px] text-ink leading-relaxed">Adults aged <select value={age} onChange={e => setAge(e.target.value)} className={sel} aria-label="Age band">{AGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select> who come to the emergency department with <select value={complaint} onChange={e => setComplaint(e.target.value)} className={sel} aria-label="Complaint">{COMPLAINTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></p>
      {cell && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px] sm:text-[14px]">
            <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Of those visits…</th><th className="py-2 pr-3 text-right font-bold text-rose">Women</th><th className="py-2 pr-3 text-right font-bold text-bronze">Men</th><th className="py-2 text-right font-bold">Gap</th></tr></thead>
            <tbody>{ROWS.map(r => {
              const c = cell.metrics[r.key]; if (!c) return null
              const clear = c.diff_lo > 0 || c.diff_hi < 0
              const f = (v: number) => r.unit === '%' ? `${v.toFixed(0)}%` : r.unit === '' ? v.toFixed(1) : `${v.toFixed(0)}${r.unit}`
              return <tr key={r.key} className="border-t border-hairline/60"><td className="py-2 pr-3 text-ink">{r.label}</td><td className="py-2 pr-3 text-right tabular-nums font-semibold">{f(c.women.est)}<span className="text-ink-3 font-normal text-[11px]"> ({f(c.women.lo)}–{f(c.women.hi)})</span></td><td className="py-2 pr-3 text-right tabular-nums font-semibold">{f(c.men.est)}<span className="text-ink-3 font-normal text-[11px]"> ({f(c.men.lo)}–{f(c.men.hi)})</span></td><td className={`py-2 text-right tabular-nums ${clear ? 'font-bold text-berry' : 'text-ink-3'}`}>{c.diff > 0 ? '+' : ''}{r.unit === '' ? c.diff.toFixed(1) : c.diff.toFixed(0)}{r.unit === '%' ? ' pts' : r.unit}</td></tr>
            })}</tbody>
          </table>
          <p className="mt-2 text-[11px] text-ink-3">{cell.n_women.toLocaleString()} sampled visits by women and {cell.n_men.toLocaleString()} by men, 2018–2022. A gap in bold is one whose 95% interval does not cross zero. Small cells have wide intervals; read them as such.</p>
        </div>
      )}
    </ChartFrame>
  )
}

export default function Chapter5() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter5.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const S = data.symptoms, A = data.anxiety, M = data.models, G = data.groups
  const g = (id: string) => G.find(x => x.id === id)!
  const src = `Source: NHAMCS emergency department public-use files ${data.years[0]}–${data.years[1]}, adults 18+, non-injury visits, survey-weighted. Analysis by Lucca Labs.`
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const sym = S.metrics.symptom_dx!, tests = S.metrics.tests_count!, img = S.metrics.anyimage!, ret = S.metrics.seen72!
  const anx = A.symptom_visits_anxiety_code, rfv = A.baseline_rfv_anxiety, inj = A.baseline_injury_anxiety_code
  const diz = A.by_complaint.find(c => c.id === 'dizziness')!.anxiety_any, sob = A.by_complaint.find(c => c.id === 'sob')!.anxiety_any, chest = A.by_complaint.find(c => c.id === 'chest')!.anxiety_any
  const older = A.cardio_anxiety_by_age['65+']
  const lab = A.cardio_labelled_anxiety as Record<string, Cmp>
  const orRow = (key: string, label: string) => { const m = M[key]; return { label, sub: `n = ${m.n.toLocaleString()}`, value: m.or, lo: m.lo, hi: m.hi, color: m.lo > 1 ? 'var(--c-female)' : m.hi < 1 ? 'var(--c-male)' : 'var(--c-muted)', tip: <><b>{label}</b><br />Odds ratio {m.or} (95% CI {m.lo}–{m.hi}), p = {m.p}<br /><span className="text-ink-3">{m.formula}</span></> } }
  const retFaint = g('syncope').metrics.seen72!
  const backSym = g('back').metrics.symptom_dx!

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Everyone knows the story. She goes in with chest pain or dizziness, the tests come back clear, she is told it is probably anxiety, and she goes home without a name for what she has.</p>
      <p>It is the most repeated story in women's health, and it is told almost entirely in anecdote. So we went looking for her in the national record: {S.n.toLocaleString()} sampled emergency visits by adults, {data.years[0]} to {data.years[1]}, about {S.weighted_visits_per_year_m} million a year, for the twelve complaints that are hardest to read. Chest pain, breathlessness, palpitations, fainting, dizziness, abdominal pain, nausea, headache, weakness, and pain in the back, flank or limbs.<Cite id="nhamcs" /></p>
      <p>For every visit the survey records what the patient came in with, what was ordered, what the chart called it at the end, and whether the patient had been in that same department in the last three days. That is enough to test each part of the story separately. One part survives. Two do not.</p>
    </>),
    T('method', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Part one: she leaves without a diagnosis.</p>
      <p>Every emergency visit ends with a code. Sometimes it is a disease: appendicitis, migraine, pneumonia, a heart attack. Sometimes it is only the symptom the patient arrived with, written in the language of the international classification: "chest pain, unspecified", "abdominal pain, unspecified", "dizziness and giddiness". The classification keeps a whole chapter for these, the R codes, and a visit that ends there is a visit where medicine did not find a cause, or did not write one down.<Cite id="nhamcs-icd" /></p>
      <p>Across the twelve complaints, {pct(sym.women.est)} of women's visits end with a symptom code. So do {pct(sym.men.est)} of men's. The difference is {sym.diff.toFixed(1)} points, and its interval runs from {sym.diff_lo.toFixed(1)} to {sym.diff_hi.toFixed(1)}: it includes zero. Complaint by complaint it is the same picture.</p>
    </>),
    F('symptom', <SexCompare rows={G.map(x => ({ label: x.label, cmp: x.metrics.symptom_dx!, sub: `${x.n.toLocaleString()} visits` }))} title="Who leaves with a symptom code instead of a diagnosis" subtitle="Share of adult visits whose first-listed diagnosis is an R code, by what the patient came in with" source={src} axisLabel="share of visits ending in a symptom code" max={80} />, 'tall'),
    T('symptom-text', <>
      <p>Chest pain ends in "chest pain" seven times in ten, for both sexes. Fainting ends in "fainting" seven times in ten, for both sexes. The only complaint where women are clearly more likely to leave with a symptom code is back pain, {pct(backSym.women.est)} against {pct(backSym.men.est)}, and it is a small group with the lowest symptom-code rate of all.</p>
      <p>Adjusting for age, complaint, year and how much was done during the visit, a woman's odds of leaving with a symptom code are {M.symptom_adj_workup.or} times a man's, with an interval from {M.symptom_adj_workup.lo} to {M.symptom_adj_workup.hi}. That is not a gap. It is the absence of one.</p>
    </>),
    T('tests', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Part two: she is not looked into.</p>
      <p>The second claim is that the symptom code is reached faster for women, with fewer tests. The survey counts every diagnostic service ordered. Women with these complaints get {tests.women.est.toFixed(1)} on average; men get {tests.men.est.toFixed(1)}. {pct(img.women.est)} of women get imaging, against {pct(img.men.est)} of men, a difference that shrinks to nothing once age and complaint are held equal (odds ratio {M.imaging_adj.or}, interval {M.imaging_adj.lo} to {M.imaging_adj.hi}). Blood tests, CT scans, triage level: even, or within a point or two. The explorer at the end lets you check any combination.</p>
      <p>There is a pattern in the tests, but it runs the other way from the story. The more that is ordered, the more likely the visit is to end with a symptom code, for both sexes alike. A visit with no tests ends in a symptom code a quarter of the time; a visit with four or more, half the time. The symptom code is mostly what is left after the dangerous explanations have been ruled out.</p>
    </>),
    F('tests-fig', <SexCompare rows={S.by_tests.map(b => ({ label: b.tests === '0' ? 'No tests ordered' : `${b.tests} tests ordered`, cmp: b.symptom_dx }))} title="The symptom code is what is left after the workup" subtitle="Share of visits ending in a symptom code, by the number of diagnostic services ordered" source={src} axisLabel="share of visits ending in a symptom code" max={70} />, 'chart'),
    T('label', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Part three: she is told it is anxiety.</p>
      <p>This is the part that survives. Among these visits, an anxiety or stress-related code is attached to {pct(anx.women.est, 1)} of women's charts and {pct(anx.men.est, 1)} of men's. Adjusted for age, complaint, year, tests, imaging, triage and arrival by ambulance, the odds are {M.anxiety_adj.or} times higher for a woman (interval {M.anxiety_adj.lo} to {M.anxiety_adj.hi}). For the complaints that could be the heart or the lungs, chest pain, breathlessness, palpitations, fainting and dizziness, the ratio is {M.anxiety_cardio_adj.or}. For women over 65 with those complaints it is {M.anxiety_cardio_older_adj.or}: {pct(older.women.est, 1)} of their visits carry the label, against {pct(older.men.est, 1)} of men's.</p>
      <p>Dizziness is the clearest case: {pct(diz.women.est, 1)} of women's visits, {pct(diz.men.est, 1)} of men's. Shortness of breath: {pct(sob.women.est, 1)} against {pct(sob.men.est, 1)}. Chest pain: {pct(chest.women.est, 1)} against {pct(chest.men.est, 1)}.</p>
    </>),
    F('anxiety', <SexCompare rows={A.by_complaint.map(c => ({ label: c.label, cmp: c.anxiety_any }))} title="Who gets an anxiety code attached" subtitle="Share of visits with an anxiety, stress or somatic-symptom code (F40–F48) anywhere in the diagnoses, by complaint" source={src} axisLabel="share of visits with an anxiety or stress code" max={20} />, 'tall'),
    T('label-2', <>
      <p>Two checks matter before reading that as bias. The first: did women say they were anxious? The survey records up to three reasons the patient gave for coming. Anxiety or nervousness was one of them in {pct(rfv.women.est, 1)} of women's visits and {pct(rfv.men.est, 1)} of men's, almost the same. Drop every visit where the patient mentioned anxiety or any psychological symptom, and the label is still attached to women {M.anxiety_adj_no_rfv.or} times as often (interval {M.anxiety_adj_no_rfv.lo} to {M.anxiety_adj_no_rfv.hi}). The label is not an echo of what the patient said.</p>
      <p>The second: anxiety disorders are genuinely more common in women. In the national survey behind the government's own figures, {`23.4%`} of women and {`14.3%`} of men had an anxiety disorder in the past year, a ratio of about 1.6.<Cite id="nimh-anxiety" /> On injury visits, where the code can only be a note of an existing condition, it is attached to {pct(inj.women.est, 1)} of women's charts and {pct(inj.men.est, 1)} of men's, a ratio of {(inj.women.est / inj.men.est).toFixed(1)}. So the emergency department attaches "anxiety" to women's chest pain and dizziness at roughly the rate anxiety exists in women. That is the honest reading, and it is not the same as the story. The story says the label replaces the search. The record says the label is added, at population rates, to a search that was the same length.</p>
      <p>Whether it then changes what happens next is harder to see. Among the heart-and-lung complaints that were labelled anxiety, {pct(lab.ekg.women.est)} of women had an electrocardiogram against {pct(lab.ekg.men.est)} of men; cardiac enzymes {pct(lab.cardenz.women.est)} against {pct(lab.cardenz.men.est)}; admission {pct(lab.admitted.women.est, 1)} against {pct(lab.admitted.men.est, 1)}. The gaps lean one way, but the groups are a few hundred visits and the intervals overlap. We show them; we do not lean on them.</p>
    </>),
    T('return', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Part four: she comes back.</p>
      <p>If women were being sent home with the wrong answer, more of them should be back within days. The survey asks, for each visit, whether the patient was seen in that same department in the previous 72 hours. Among these complaints, {pct(ret.women.est, 1)} of women's visits were returns, against {pct(ret.men.est, 1)} of men's. Adjusted for age, complaint and year, a woman's odds of being a three-day return are {M.return72_adj.or} times a man's (interval {M.return72_adj.lo} to {M.return72_adj.hi}). For fainting it is {pct(retFaint.women.est, 1)} against {pct(retFaint.men.est, 1)}. Whatever this measures, and it may measure who comes back as much as who was sent home too soon, it is not the bounce-back the story predicts.</p>
    </>),
    F('return-fig', <SexCompare rows={G.map(x => ({ label: x.label, cmp: x.metrics.seen72! })).filter(r => r.cmp)} title="Who was back within 72 hours" subtitle="Share of visits where the patient had been seen in the same emergency department in the previous three days" source={src} axisLabel="share of visits that were 72-hour returns" max={12} />, 'tall'),
    F('models', <Lollipop rows={[orRow('symptom_adj_workup', 'Leaves with a symptom code'), orRow('imaging_adj', 'Gets any imaging'), orRow('admitted_adj', 'Is admitted'), orRow('return72_adj', 'Was back within 72 hours'), orRow('anxiety_adj', 'Anxiety or stress code attached'), orRow('anxiety_adj_no_rfv', '… patient did not mention anxiety'), orRow('anxiety_cardio_adj', '… heart-and-lung complaints'), orRow('anxiety_cardio_older_adj', '… heart-and-lung, aged 65+'), orRow('psych_adj', 'Any psychiatric code attached')]} title="The four parts of the story, adjusted" subtitle="Odds for a woman relative to a man with the same age band, complaint, year and workup. 1 is no difference; whiskers are 95% intervals." source={`${src} Survey-weighted logistic regressions, errors clustered on sampling units.`} axisLabel="odds ratio, women relative to men (log scale)" fmt={v => `${v}×`} log reference={{ value: 1, label: 'no difference' }} legend={[{ label: 'Higher for women', color: 'var(--c-female)' }, { label: 'Lower for women', color: 'var(--c-male)' }, { label: 'Interval crosses 1', color: 'var(--c-muted)' }]} />, 'tall'),
    T('where', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Where the diagnosis gap actually lives.</p>
      <p>None of this means women are diagnosed as well as men. It means the single emergency visit is not where the difference is made. The best evidence for a diagnosis gap comes from a country that can follow every person for decades: in Denmark's registry of 6.9 million people over 21 years, women were diagnosed later than men across 770 diseases, by about four years on average, two and a half for cancers and four and a half for metabolic diseases such as diabetes.<Cite id="westergaard-2019" /> That gap is made of years between visits, of symptoms that are real but not yet severe, of the appointment not booked and the referral not made. A survey of visits sees the visit. It cannot see the years.</p>
      <p>The United States has no public dataset that follows a person from first symptom to diagnosis. That is why the most-told story in women's health is told in anecdote, and why this chapter can test only the parts of it that happen inside one room. Inside that room the record is more even than the story. Outside it, nobody is counting.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>If you leave an emergency department with a symptom code, that is usually what the end of a thorough visit looks like, for men as much as for women: the dangerous causes were checked and not found. The useful question is not whether you were given a name but what was ruled out, and what the plan is if it comes back. Ask for both in writing. And if "anxiety" is on your discharge sheet beside a physical complaint, you are entitled to ask what was tested before it was written, because the record shows the word is added to women's charts at the rate anxiety exists in women, not at the rate it explains their symptoms.</p>
    </>),
    F('explorer', <Explorer cells={data.explorer} source={src} />),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 5</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">Sent home with a <span className="italic font-medium text-berry">label</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">The story says she leaves without a diagnosis, under-tested, told it is anxiety, and comes straight back. We tested each part in {S.n.toLocaleString()} emergency visits. One part is true.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · NHAMCS {data.years[0]}–{data.years[1]} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['nhamcs', 'nhamcs-doc', 'nhamcs-icd', 'nimh-anxiety', 'westergaard-2019']} />
      </section>
    </article>
  )
}
