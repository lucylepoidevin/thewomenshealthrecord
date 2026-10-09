import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { chapterRef } from '../lib/chapters'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import NextChapter from '../components/NextChapter'
import ChartFrame from '../components/charts/ChartFrame'
import Butterfly from '../components/charts/Butterfly'
import StackedBars from '../components/charts/StackedBars'
import Isotype from '../components/charts/Isotype'
import ParityScatter from '../components/charts/ParityScatter'
import StripPlot from '../components/charts/StripPlot'
import type { Cmp, AgeAdj } from '../lib/types2'

type Model = { label: string; note: string; n: number; or: number; lo: number; hi: number; p: number; formula: string }
type Group = { id: string; label: string; n: number; n_women: number; n_men: number; weighted_visits_per_year_k: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj>; by_age: Record<string, Record<string, Cmp | number | null>>; named?: { label: string; cmp: Cmp | null }[]; dx_mix?: Record<string, Cmp | null> }
type Cell = { complaint: string; age: string; n_women: number; n_men: number; metrics: Record<string, Cmp | null> }
type Data = {
  generated: string; years: [number, number]; n_adult_visits: number
  overall: { n: number; n_women: number; n_men: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj> }
  symptoms: { n: number; n_women: number; n_men: number; weighted_visits_per_year_m: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj | null>; by_age: Record<string, Record<string, Cmp | null>>; by_year: { year: number; symptom_dx: Cmp; anxiety_any: Cmp; seen72: Cmp }[]; by_tests: { tests: string; symptom_dx: Cmp; anxiety_any: Cmp }[]; return_by_label: Record<string, Cmp | null> }
  anxiety: { n_cardio: number; baseline_rfv_anxiety: Cmp; baseline_rfv_psych: Cmp; baseline_injury_anxiety_code: Cmp; symptom_visits_anxiety_code: Cmp; symptom_visits_anxiety_code_no_rfv: Cmp; symptom_visits_anxiety_primary: Cmp; symptom_visits_depression_code: Cmp; symptom_visits_psych_code: Cmp; cardio_anxiety_code: Cmp; cardio_anxiety_by_age: Record<string, Cmp>; cardio_anxiety_age_adjusted: AgeAdj; cardio_labelled_anxiety: Record<string, Cmp | number | null>; cardio_not_labelled: Record<string, Cmp | null>; by_complaint: { id: string; label: string; anxiety_any: Cmp; anxiety_no_rfv: Cmp }[] }
  groups: Group[]; explorer: Cell[]; models: Record<string, Model>; models_note: string
  cancer: { sites: { site: string; label: string; cases_women: number; cases_men: number; distant: Cmp; localized: { women: number; men: number }; distant_age_adjusted: { women: number; men: number; diff: number } | null; median_age: { women: number; men: number } | null }[]; n_sites: number; n_women_later_stage: number; n_women_earlier_stage: number; n_women_older_at_dx: number; n_women_younger_at_dx: number; years_stage: string; years_age: string; cases_total: number }
}

const pct = (v: number, d = 0) => `${v.toFixed(d)}%`
const COMPLAINTS: [string, string][] = [['all', 'any of these'], ['chest', 'chest pain'], ['sob', 'shortness of breath'], ['palpitations', 'palpitations'], ['syncope', 'fainting'], ['dizziness', 'dizziness'], ['abdominal', 'abdominal pain'], ['nausea', 'nausea or vomiting'], ['headache', 'a headache'], ['weakness', 'weakness or fatigue'], ['back', 'back pain'], ['flank', 'flank, rib or groin pain'], ['limb', 'neck, hip, leg or joint pain']]
const AGES: [string, string][] = [['all', 'any age'], ['18-44', '18 to 44'], ['45-64', '45 to 64'], ['65+', '65 or older']]
const ROWS: { key: string; label: string; unit: string }[] = [
  { key: 'tests_count', label: 'tests ordered, on average', unit: '' }, { key: 'blood', label: 'get blood tests', unit: '%' }, { key: 'anyimage', label: 'get any imaging', unit: '%' }, { key: 'ct', label: 'get a CT scan', unit: '%' },
  { key: 'urgent', label: 'are triaged urgent', unit: '%' }, { key: 'symptom_dx', label: 'leave with a symptom code, not a diagnosis', unit: '%' }, { key: 'anxiety_any', label: 'have an anxiety or stress code attached', unit: '%' }, { key: 'psych_any', label: 'have any psychiatric code attached', unit: '%' },
  { key: 'admitted', label: 'are admitted, observed or transferred', unit: '%' }, { key: 'seen72', label: 'had been in the same ED in the last 72 hours', unit: '%' }, { key: 'lov_mean', label: 'minutes in the department', unit: ' min' },
]

function Explorer({ cells, source }: { cells: Cell[]; source: string }) {
  const [complaint, setComplaint] = useState('dizziness')
  const [age, setAge] = useState('all')
  const cell = cells.find(c => c.complaint === complaint && c.age === age)
  const sel = 'rounded-full border border-hairline bg-white px-3 py-1.5 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10'
  return (
    <ChartFrame title="Look up a visit like yours" subtitle="Pick the complaint and age band. Women and men in that group, side by side, with the 95% interval." source={source}>
      <p className="text-[15px] text-ink leading-relaxed">Adults aged <select value={age} onChange={e => setAge(e.target.value)} className={sel} aria-label="Age band">{AGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select> who come to the emergency department with <select value={complaint} onChange={e => setComplaint(e.target.value)} className={sel} aria-label="Complaint">{COMPLAINTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></p>
      {cell && (cell.n_women < 30 || cell.n_men < 30) && <p className="mt-4 text-[14px] text-ink-2">Too few sampled visits in this group ({cell.n_women.toLocaleString()} women, {cell.n_men.toLocaleString()} men) for a reliable comparison. Pick a wider age band.</p>}
      {cell && cell.n_women >= 30 && cell.n_men >= 30 && (
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
  const S = data.symptoms, A = data.anxiety, M = data.models, G = data.groups, C = data.cancer
  const g = (id: string) => G.find(x => x.id === id)!
  const src = `Source: NHAMCS emergency department public-use files ${data.years[0]}–${data.years[1]}, adults 18+, non-injury visits, survey-weighted. Analysis by The Women's Health Record.`
  const srcC = `Source: SEER*Explorer data archive, November 2024 submission: stage distribution ${C.years_stage} and median age at diagnosis ${C.years_age}, by sex, all races, 22 registries. Analysis by The Women's Health Record.`
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const sym = S.metrics.symptom_dx!, tests = S.metrics.tests_count!, img = S.metrics.anyimage!, ret = S.metrics.seen72!
  const anx = A.symptom_visits_anxiety_code, rfv = A.baseline_rfv_anxiety, inj = A.baseline_injury_anxiety_code
  const sob = A.by_complaint.find(c => c.id === 'sob')!.anxiety_any
  const lab = A.cardio_labelled_anxiety as Record<string, Cmp>
  const backSym = g('back').metrics.symptom_dx!
  const abd = g('abdominal'), ch = g('chest')
  const mix = (grp: Group, key: string, sex: 'women' | 'men') => grp.dx_mix?.[key]?.[sex].est ?? 0
  const bladder = C.sites.find(x => x.label === 'Bladder')!, liver = C.sites.find(x => x.label === 'Liver')!, lung = C.sites.find(x => x.label === 'Lung')!, colon = C.sites.find(x => x.label === 'Colon and rectum')!, mel = C.sites.find(x => x.label === 'Melanoma')!, oes = C.sites.find(x => x.label === 'Oesophagus')!
  const noTests = S.by_tests[0].symptom_dx, manyTests = S.by_tests[2].symptom_dx
  const aged = C.sites.filter(x => x.median_age).sort((a, b) => (b.median_age!.women - b.median_age!.men) - (a.median_age!.women - a.median_age!.men))

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Everyone knows the story. She goes in with chest pain or dizziness, the tests come back clear, she is told it is probably anxiety, and she goes home without a name for what she has. Months or years later, someone finds what it was.</p>
      <p>It is the most repeated story in women's health, and it is told almost entirely in anecdote. It also makes three separate claims, and they can be tested separately. A diagnosis gap can hide in the room, in what is done and decided during the visit. It can hide in the word written on the chart. Or it can hide in the years, in how long a disease is allowed to run before it is named. American public data can see all three.</p>
      <p>For the room and the word, we used {S.n.toLocaleString()} sampled emergency visits by adults, {data.years[0]} to {data.years[1]}, about {S.weighted_visits_per_year_m} million a year, for the twelve complaints that are hardest to read: chest pain, breathlessness, palpitations, fainting, dizziness, abdominal pain, nausea, headache, weakness, and pain in the back, flank or limbs.<Cite id="nhamcs" /> For the years, we used the one American registry that records when a disease was found and how far it had got: {(C.cases_total / 1e6).toFixed(1)} million cancer cases.<Cite id="seer-stage" /></p>
    </>),

    T('room', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">In the room.</p>
      <p>Every emergency visit ends with a code. Sometimes it is a disease: appendicitis, migraine, pneumonia, a heart attack. Sometimes it is only the symptom the patient arrived with, written in the language of the international classification: "chest pain, unspecified", "dizziness and giddiness". The classification keeps a whole chapter for these, the R codes, and a visit that ends there is a visit where medicine did not find a cause, or did not write one down.<Cite id="nhamcs-icd" /></p>
      <p>If women were being sent home without answers more than men, this is where it would show. It does not. Across the twelve complaints, {pct(sym.women.est)} of women's visits end with a symptom code and {pct(sym.men.est)} of men's. The difference is {sym.diff.toFixed(1)} points and its interval, {sym.diff_lo.toFixed(1)} to {sym.diff_hi.toFixed(1)}, includes zero. Complaint by complaint the two wings of the chart below are the same shape. The one exception is back pain, {pct(backSym.women.est)} against {pct(backSym.men.est)}, a small group with the lowest symptom-code rate of all.</p>
    </>),
    F('symptom', <Butterfly rows={G.map(x => ({ label: x.label, sub: `${x.n.toLocaleString()} visits`, cmp: x.metrics.symptom_dx! }))} title="Who leaves with a symptom code instead of a diagnosis" subtitle="Share of adult visits whose first-listed diagnosis is an R code, by what the patient came in with. Women to the left, men to the right: a symmetrical shape is parity." source={src} axisLabel="share ending in a symptom code" max={85} />),
    T('room-2', <>
      <p>Nor is the symptom code reached faster for women. The survey counts every diagnostic service ordered: women with these complaints get {tests.women.est.toFixed(1)} on average, men {tests.men.est.toFixed(1)}. Imaging is {pct(img.women.est)} against {pct(img.men.est)}, a gap that disappears once age and complaint are held equal. And the tests run the other way from the story: a visit with no tests ends in a symptom code {pct(noTests.women.est)} of the time for women, a visit with four to six tests {pct(manyTests.women.est)} of the time, and the same for men. The symptom code is mostly what is left after the dangerous explanations have been ruled out. Adjusting for age, complaint, year and workup, a woman's odds of leaving with one are {M.symptom_adj_workup.or} times a man's, interval {M.symptom_adj_workup.lo} to {M.symptom_adj_workup.hi}. One thing in the room does differ: {pct(S.metrics.admitted!.women.est)} of women with these complaints are admitted, held for observation or transferred, against {pct(S.metrics.admitted!.men.est)} of men, and the gap survives adjustment for age, complaint, triage and arrival (odds {M.admitted_adj.or}, interval {M.admitted_adj.lo} to {M.admitted_adj.hi}). Whether that is fewer heart attacks among the women or a lower threshold for sending them home, a visit record cannot say; the diagnosis mix below suggests mostly the former.</p>
      <p>What differs is not whether the visit gets a name but which name. Among abdominal-pain visits, {pct(mix(abd, 'Kidney, bladder, reproductive', 'women'))} of women's end in a kidney, bladder or reproductive diagnosis and {pct(mix(abd, 'Pregnancy', 'women'))} in a pregnancy-related one; men's end in a digestive diagnosis more often. Among chest-pain visits, {pct(mix(ch, 'Heart and circulation', 'men'))} of men's end in a heart or circulation diagnosis against {pct(mix(ch, 'Heart and circulation', 'women'))} of women's. That is what the diseases look like, not what the doctors do: the symptom-code share, the part that would show a reluctance to diagnose, is the same for both.</p>
    </>),
    F('called', <StackedBars rows={['chest', 'sob', 'dizziness', 'abdominal', 'headache', 'weakness'].flatMap(id => { const x = g(id); const mx = x.dx_mix ?? {}; return (['women', 'men'] as const).map(sex => ({ label: `${x.label}, ${sex}`, parts: Object.entries(mx).map(([k, v]) => ({ key: k, value: v ? v[sex].est : 0 })) })) })} series={[{ key: 'Symptom code', label: 'Symptom code', color: '#C9B3BC' }, { key: 'Heart and circulation', label: 'Heart and circulation', color: '#8B1E4B' }, { key: 'Lungs and airways', label: 'Lungs and airways', color: '#6B5B95' }, { key: 'Digestive', label: 'Digestive', color: '#D08C60' }, { key: 'Kidney, bladder, reproductive', label: 'Kidney, bladder, reproductive', color: '#5A8F7B' }, { key: 'Pregnancy', label: 'Pregnancy', color: '#E05A8A' }, { key: 'Nervous system', label: 'Nervous system', color: '#B08A4A' }, { key: 'Mental health', label: 'Mental health', color: '#2A1F26' }, { key: 'Infection', label: 'Infection', color: '#9BB7D4' }, { key: 'Muscles and bones', label: 'Muscles and bones', color: '#C2567E' }, { key: 'Other', label: 'Other', color: '#EBD5DC' }]} title="What the visit was called, women and men" subtitle="The chapter of the first-listed diagnosis, as a share of visits for each complaint. The grey block is the symptom code; the rest is a named condition." source={src} axisLabel="share of visits" />),

    T('word', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">On the chart.</p>
      <p>The second claim is about a word. An anxiety or stress-related code is attached to {pct(anx.women.est, 1)} of women's visits for these complaints and {pct(anx.men.est, 1)} of men's. Small numbers, and on their own not quite a statistically clear gap: the raw ratio is {(anx.women.est / anx.men.est).toFixed(1)} and its interval just touches 1. It is the adjustment that sharpens it. With age, complaint, year, tests, imaging, triage and arrival by ambulance held equal, a woman's odds of carrying the code are {M.anxiety_adj.or} times a man's, interval {M.anxiety_adj.lo} to {M.anxiety_adj.hi}: like is being compared with like, and the women come out more often labelled. For the complaints that could be the heart or the lungs, the ratio is {M.anxiety_cardio_adj.or}. For women over 65 with those complaints it is {M.anxiety_cardio_older_adj.or}, on a sample too small for the men's raw share to be quoted.</p>
    </>),
    F('anxiety', <Isotype panels={[{ label: 'women with shortness of breath', count: Math.round(sob.women.est * 10), color: 'var(--c-female)' }, { label: 'men with shortness of breath', count: Math.round(sob.men.est * 10), color: 'var(--c-male)' }, { label: 'women with chest pain', count: Math.round(A.by_complaint.find(c => c.id === 'chest')!.anxiety_any.women.est * 10), color: 'var(--c-female)' }, { label: 'men with chest pain', count: Math.round(A.by_complaint.find(c => c.id === 'chest')!.anxiety_any.men.est * 10), color: 'var(--c-male)' }, { label: 'women, all heart-and-lung complaints', count: Math.round(A.cardio_anxiety_code.women.est * 10), color: 'var(--c-female)' }, { label: 'men, all heart-and-lung complaints', count: Math.round(A.cardio_anxiety_code.men.est * 10), color: 'var(--c-male)' }]} title="Of every 1,000 visits, how many get an anxiety code attached" subtitle={`Each square is one visit. Filled squares carry an anxiety, stress or somatic-symptom code (F40–F48) somewhere in the diagnoses. Chest pain, for comparison, is close: ${Math.round(A.by_complaint.find(c => c.id === 'chest')!.anxiety_any.women.est * 10)} women and ${Math.round(A.by_complaint.find(c => c.id === 'chest')!.anxiety_any.men.est * 10)} men in every 1,000.`} source={src} />),
    T('word-2', <>
      <p>Two checks before calling that bias. First, did the women say they were anxious? The survey records up to three reasons the patient gave for coming. Anxiety or nervousness was one of them in {pct(rfv.women.est, 1)} of women's visits and {pct(rfv.men.est, 1)} of men's, almost the same. Drop every visit where the patient mentioned anxiety or any psychological symptom and a woman's adjusted odds of the label are still {M.anxiety_adj_no_rfv.or} times a man's. The label is not an echo of what the patient said.</p>
      <p>Second, anxiety disorders are genuinely more common in women: {`23.4%`} of women and {`14.3%`} of men in the past year in the national survey behind the government's figures, a ratio of about 1.6.<Cite id="nimh-anxiety" /> On injury visits, where the code can only be a note of an existing condition, it is attached to {pct(inj.women.est, 1)} of women's charts and {pct(inj.men.est, 1)} of men's, a ratio of {(inj.women.est / inj.men.est).toFixed(1)}. So the emergency department attaches "anxiety" to women's chest pain and dizziness at roughly the rate anxiety exists in women. That is the honest reading. The story says the label replaces the search; the record says the label is added, at population rates, to a search that was the same length. Among the heart-and-lung visits that were labelled anxiety, {pct(lab.ekg.women.est)} of women had an electrocardiogram against {pct(lab.ekg.men.est)} of men and {pct(lab.cardenz.women.est)} had cardiac enzymes against {pct(lab.cardenz.men.est)}; the gaps lean one way, but these are a few hundred visits and the intervals overlap.</p>
      <p>The third claim is that she comes straight back. The survey asks, of each visit, whether the patient had been seen in the same department in the previous 72 hours, so a visit flagged that way is a return. {pct(ret.women.est, 1)} of women's visits were returns, against {pct(ret.men.est, 1)} of men's; adjusted, a woman's odds of a visit being a three-day return are {M.return72_adj.or} times a man's. Whatever this measures, it is not the bounce-back the story predicts.</p>
    </>),
    F('models', <StripPlot rows={[['Leaves with a symptom code', 'symptom_raw', 'symptom_adj_workup'], ['Gets any imaging', null, 'imaging_adj'], ['Is admitted, observed or transferred', null, 'admitted_adj'], ['Visit was a return within 72 hours', 'return72_raw', 'return72_adj'], ['Anxiety or stress code attached', 'anxiety_raw', 'anxiety_adj'], ['… patient did not mention anxiety', null, 'anxiety_adj_no_rfv'], ['… heart-and-lung complaints', null, 'anxiety_cardio_adj'], ['… heart-and-lung, aged 65+', null, 'anxiety_cardio_older_adj'], ['Any psychiatric code attached', null, 'psych_adj']].map(([label, rawK, adjK]) => { const a = M[adjK as string], r = rawK ? M[rawK as string] : null; return { label: label as string, sub: `${a.or}× (${a.lo}–${a.hi})`, marks: [...(r ? [{ key: 'raw', value: r.or, tip: <><b>{label}</b><br />Unadjusted odds ratio {r.or} ({r.lo}–{r.hi})</> }] : []), { key: 'adj', value: a.or, tip: <><b>{label}</b><br />Adjusted odds ratio {a.or} ({a.lo}–{a.hi}), p = {a.p}<br /><span className="text-ink-3">{a.formula}</span></> }], tick: { value: 1 }, arrow: r ? [r.or, a.or] as [number, number] : undefined } })} series={[{ key: 'raw', label: 'Before adjustment', color: 'var(--c-muted)' }, { key: 'adj', label: 'Adjusted for age, complaint, year and workup', color: 'var(--c-emphasis)' }]} tickLabel="No difference (1×)" arrowLegend="what adjustment did" title="The three claims about the visit, before and after adjustment" subtitle="Odds for a woman relative to a man. Above 1, more likely for women. The arrow shows how the estimate moved once age, complaint, year, tests, imaging, triage and arrival were held equal." source={`${src} Survey-weighted logistic regressions, errors clustered on sampling units.`} axisLabel="odds ratio, women relative to men" fmt={v => `${v.toFixed(1)}×`} domain={[0.4, 3]} />),

    T('years', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">In the years.</p>
      <p>None of this means women are diagnosed as well as men. It means the single visit is not where the difference is made. The best evidence for a diagnosis gap comes from a country that can follow every person for decades: in Denmark's registry of 6.9 million people over 21 years, women were diagnosed later than men across 770 diseases, by about four years on average.<Cite id="westergaard-2019" /> The United States has no registry like that. It has one for cancer, and cancer records the two things a delay leaves behind: the age at which the disease was found, and how far it had spread by then.</p>
      <p>The first repeats the Danish finding. Of the {C.n_sites} cancers both sexes get, women are older than men at diagnosis in {C.n_women_older_at_dx} and younger in {C.n_women_younger_at_dx}: {colon.median_age!.women - colon.median_age!.men} years older for colon cancer, {liver.median_age!.women - liver.median_age!.men} for liver cancer.<Cite id="seer-age" /></p>
    </>),
    F('age-fig', <StripPlot rows={aged.map(x => ({ label: x.label, sub: `${(x.cases_women + x.cases_men).toLocaleString()} cases`, marks: [{ key: 'men', value: x.median_age!.men, tip: <><b>{x.label}</b><br />Men: median age {x.median_age!.men} at diagnosis</> }, { key: 'women', value: x.median_age!.women, tip: <><b>{x.label}</b><br />Women: median age {x.median_age!.women} at diagnosis</> }], arrow: [x.median_age!.men, x.median_age!.women] as [number, number] }))} series={[{ key: 'men', label: 'Men', color: 'var(--c-male)', shape: 'square' }, { key: 'women', label: 'Women', color: 'var(--c-female)' }]} arrowLegend="from men's age to women's" title="Median age at diagnosis, women and men" subtitle={`${aged.length} cancers both sexes get, ${C.years_age}. The arrow runs from the men's median age to the women's; pointing right means women are older when the cancer is found. Sorted from women oldest relative to men.`} source={srcC} axisLabel="median age at diagnosis" fmt={v => `${v}`} domain={[30, 80]} arrowColor="var(--c-emphasis)" />),
    T('years-2', <>
      <p>But age at diagnosis is mostly the age at which a disease strikes, and that differs by sex for reasons that have nothing to do with doctors: women who smoked started later, melanoma finds men's backs and women's legs at different ages, thyroid disease is a young women's disease. The measure that counts is the second one. If women's cancers were being missed for longer, they would be found further along. They are not. In {C.n_women_earlier_stage} of the {C.n_sites} cancers, women are diagnosed at an earlier stage than men, by a margin the intervals do not cross; in {C.n_women_later_stage} they are diagnosed later. Lung cancer is found after it has spread in {pct(lung.distant.women.est)} of women and {pct(lung.distant.men.est)} of men; oesophageal cancer in {pct(oes.distant.women.est)} against {pct(oes.distant.men.est)}; melanoma in {pct(mel.distant.women.est, 1)} against {pct(mel.distant.men.est, 1)}. Adjusting for age changes none of the signs.</p>
    </>),
    F('cancer-fig', <ParityScatter points={C.sites.map(x => ({ label: x.label, x: x.distant.men.est, y: x.distant.women.est, size: x.cases_women + x.cases_men, show: ['Bladder', 'Liver', 'Lung', 'Melanoma', 'Oesophagus', 'Colon and rectum', 'Hodgkin lymphoma', 'Myeloma', 'Kidney', 'Thyroid', 'Anus'].includes(x.label), tip: <><b>{x.label}</b><br />Diagnosed after spread: women {x.distant.women.est}%, men {x.distant.men.est}%<br />{(x.cases_women + x.cases_men).toLocaleString()} cases{x.median_age ? <><br />Median age at diagnosis: women {x.median_age.women}, men {x.median_age.men}</> : null}</> }))} title="Cancers found after they had spread: women against men" subtitle={`Each bubble is a cancer both sexes get, sized by cases, ${C.years_stage}. On the dotted line, women and men are diagnosed at the same stage. Above it, women are found later; below it, earlier.`} source={srcC} xLabel="men diagnosed at distant stage" yLabel="women diagnosed at distant stage" aboveLabel="found later in women" belowLabel="found later in men" log />),
    T('years-3', <>
      <p>The exceptions are the finding. Bladder cancer is found after it has spread in {pct(bladder.distant.women.est, 1)} of women and {pct(bladder.distant.men.est, 1)} of men, and found while still local in {pct(bladder.localized.women)} against {pct(bladder.localized.men)}. Liver cancer: {pct(liver.distant.women.est, 1)} against {pct(liver.distant.men.est, 1)}. These are the cancers whose first symptom looks like something women are told they have anyway. Bladder cancer announces itself with blood in the urine, and a claims study of 7,649 insured Americans who had that symptom and turned out to have bladder cancer found that women were diagnosed with a urinary infection first 2.3 times as often as men, were less likely to be imaged, and waited an average of 85 days for the cancer diagnosis against 74 for men.<Cite id="cohn-2014" /></p>
      <p>That is the dismissed woman, in a dataset, with a mechanism. She exists. She is not everywhere the story puts her. She is where a woman's symptom has a woman's explanation ready to hand: blood in the urine that is called a urinary infection, dizziness that is called anxiety. Put the three measures together and the shape of the diagnosis gap changes. It is not a general slowness in reading women. It is specific, a handful of symptoms and conditions where the familiar diagnosis arrives before the test. Those can be named, and fixed one at a time. A general bias could not be.</p>
    </>),

    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>If you leave an emergency department with a symptom code, that is usually what the end of a thorough visit looks like, for men as much as for women: the dangerous causes were checked and not found. The useful question is not whether you were given a name but what was ruled out, and what the plan is if it comes back. Ask for both in writing. If "anxiety" is on your discharge sheet beside a physical complaint, you are entitled to ask what was tested before it was written. And if the symptom is blood in your urine, ask for the cystoscopy, not the antibiotic.</p>
    </>),
    F('explorer', <Explorer cells={data.explorer} source={src} />),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">{chapterRef('sent-home-with-a-label')}</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">Where the <span className="italic font-medium text-berry">diagnosis gap</span> lives</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">The story says she is sent home undiagnosed, under-tested and told it is anxiety. We looked in {S.n.toLocaleString()} emergency visits and {(C.cases_total / 1e6).toFixed(1)} million cancer cases. The gap is real. It is not where the story puts it.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">NHAMCS {data.years[0]}–{data.years[1]} · SEER {C.years_stage} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <NextChapter slug='sent-home-with-a-label' />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['nhamcs', 'nhamcs-doc', 'nhamcs-icd', 'nimh-anxiety', 'westergaard-2019', 'seer-stage', 'seer-age', 'cohn-2014']} />
      </section>
    </article>
  )
}
