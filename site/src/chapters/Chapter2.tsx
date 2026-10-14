import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { chapterRef } from '../lib/chapters'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import NextChapter from '../components/NextChapter'
import SexCompare from '../components/charts/SexCompare'
import ScoreLines from '../components/charts/ScoreLines'
import Butterfly from '../components/charts/Butterfly'
import Dumbbell from '../components/charts/Dumbbell'
import Isotype from '../components/charts/Isotype'
import StripPlot from '../components/charts/StripPlot'
import Heatmap from '../components/charts/Heatmap'
import SlopeChart from '../components/charts/SlopeChart'
import Explorer from '../components/Explorer'
import type { Chapter2Data, Cmp } from '../lib/types2'

const p = (c: Cmp | null | undefined, who: 'women' | 'men') => (c ? c[who].est.toFixed(0) : '–')

export default function Chapter2() {
  const [data, setData] = useState<Chapter2Data | null>(null)
  const [models, setModels] = useState<Record<string, { label: string; note: string; n: number; or: number; lo: number; hi: number; p: number }> | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/chapter2.json`).then(r => r.json()).then(setData)
    fetch(`${import.meta.env.BASE_URL}data/chapter2_models.json`).then(r => r.json()).then(j => setModels(j.models))
  }, [])
  if (!data || !models) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const M = models
  const orf = (k: string) => `${M[k].or.toFixed(2)} (95% interval ${M[k].lo.toFixed(2)} to ${M[k].hi.toFixed(2)})`

  const G = Object.fromEntries(data.groups.map(g => [g.id, g]))
  const A = data.all_pain.metrics
  const abd = G.abdominal.metrics, chest = G.chest.metrics, head = G.headache.metrics, back = G.back.metrics, flank = G.flank.metrics
  const H = data.heart_attack.metrics
  const L = data.levers
  const chestByAge = (k: string) => data.explorer.filter(c => c.complaint === 'chest' && c.age !== 'all').map(c => ({ label: `Chest pain, age ${c.age}`, sub: `${c.n_women.toLocaleString()} women, ${c.n_men.toLocaleString()} men sampled`, cmp: c.metrics[k]! }))
  const yrs = `${data.years[0]}–${data.years[1]}`
  const src = `Source: NHAMCS emergency department public-use files ${yrs} (NCHS), adults 18+, survey-weighted; analysis by The Women's Health Record.`
  const perYear = data.groups.reduce((a, g) => a + g.weighted_visits_per_year, 0).toFixed(0)
  const rows = (key: string, withAll = true) => [
    ...data.groups.map(g => ({ label: g.label, sub: `${g.weighted_visits_per_year.toFixed(1)}M visits a year`, cmp: g.metrics[key]! })).filter(r => r.cmp),
    ...(withAll && A[key] ? [{ label: 'All pain complaints', sub: `${data.all_pain.n.toLocaleString()} sampled visits`, cmp: A[key]! }] : []),
  ]
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The most widely cited estimate of sex differences in emergency pain treatment comes from a single emergency department, twenty years ago.</p>
      <p>In 2008 a team at a Philadelphia hospital published what they had seen in 981 adults who came in with acute abdominal pain over nine months of 2004 and 2005. Men and women reported the same level of pain. Women were 11 points less likely to be given an opioid, 7 points less likely to be given anything for it, and waited a median of 16 minutes longer.<Cite id="chen-2008" /> It has been cited thousands of times and has been repeated in nearly every article on women's pain since.</p>
      <p>The study was well designed, but it covered one hospital two decades ago. We sought a national, contemporary sample and a wider set of outcomes than analgesia alone, covering each stage from arrival to discharge at which women in pain might be treated differently from men.</p>
    </>),
    T('data', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The sample.</p>
      <p>The CDC does not record every emergency visit in the country. Each year it picks a sample of hospitals, and within them a sample of visits, and records each one in detail: the patient's sex and age, why they came, the pain score they reported, how they arrived, how urgently they were triaged, how long they waited, every medication given, every test run, and the diagnosis they left with.<Cite id="nhamcs" /> Each sampled visit then carries a weight: how many visits across the country it stands for. Summing the weights yields national estimates.</p>
      <p>We pooled five years, {data.years[0]} to {data.years[1]}, and kept the visits where the main reason for coming was pain: abdominal, chest, back, head, limb or flank. This yielded {data.all_pain.n.toLocaleString()} sampled visits, {(data.all_pain.n_women / data.all_pain.n * 100).toFixed(0)}% of them by women. Weighted, they represent roughly {perYear} million emergency visits for pain every year. Every number in this chapter is one of those weighted estimates, and every chart shows the uncertainty that comes from working with a sample.</p>
    </>),
    T('report', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Reported pain.</p>
      <p>We begin with the patient's own pain rating. On arrival, most emergency departments ask for a pain score from 0 to 10. Across every pain complaint, women rated their pain as severe, 7 or higher, more often than men: {p(A.severe_share, 'women')}% against {p(A.severe_share, 'men')}%. For chest pain the gap is {Math.abs(chest.severe_share!.diff).toFixed(0)} points, for headache {Math.abs(head.severe_share!.diff).toFixed(0)}.</p>
    </>),
    F('severe', <Butterfly rows={rows('severe_share')} title="Share of visits with pain rated 7 to 10" subtitle="Share of visits where the patient rated their pain 7 to 10 out of 10. Women to the left, men to the right; a symmetrical shape is parity." source={`${src} Pain score recorded for about seven in ten visits.`} axisLabel="share rating pain 7–10" max={80} />),
    T('door', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Triage.</p>
      <p>Two decisions precede any contact with a physician. Someone decides whether to call an ambulance, and a triage nurse assigns an urgency level. On both measures, women in pain are rated lower. They arrived by ambulance in {p(A.ems, 'women')}% of pain visits against {p(A.ems, 'men')}% for men, and were triaged as urgent, the top two of five levels, in {p(A.urgent, 'women')}% against {p(A.urgent, 'men')}%. Both gaps are statistically clear, and both run in the opposite direction to the patients' own pain ratings.</p>
      <p>The ambulance decision is mostly the patient's and their family's; the triage decision is the department's. Neither is a diagnosis, and part of the raw gap is what men and women come in with: chest pain, which is triaged urgent more than anything else, is a larger share of men's pain visits. We therefore fitted a model that holds the complaint, the age band and the year constant, then added the reported pain score, then arrival by ambulance. The raw gap, women's odds of an urgent rating {M.urgent_raw.or.toFixed(2)} times men's, shrinks to {M.urgent_adj.or.toFixed(2)} once complaint and age are held constant, and to {M.urgent_adj_full.or.toFixed(2)} with pain score and ambulance in the model, where the interval includes 1. Most of the overall urgency gap is attributable to case mix; the remainder is a difference of about a tenth that the data cannot distinguish from no difference.</p>
      <p>This is the appropriate reading of the overall figure. The gaps that persist after adjustment are specific to particular complaints and are described below.</p>
    </>),
    F('triage', <Dumbbell rows={[...rows('urgent', false).map(r => ({ label: r.label, female: r.cmp.women.est, male: r.cmp.men.est })), { label: 'All pain: triaged urgent', female: A.urgent!.women.est, male: A.urgent!.men.est }, { label: 'All pain: arrived by ambulance', female: A.ems!.women.est, male: A.ems!.men.est }]} title="Share triaged urgent, and ambulance arrivals" subtitle="Share of visits triaged at the two most urgent levels, by complaint; and the ambulance share overall. Each bar joins the women's and men's values." source={`${src} Intervals for every value are in the data file and the explorer below.`} max={45} />),
    T('treat', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Medication.</p>
      <p>Here the 2008 finding is largely not reproduced. Across all pain complaints, women and men were given a painkiller of any kind in the department at the same rate, {p(A.analgesic_ed, 'women')}% and {p(A.analgesic_ed, 'men')}%, and an opioid at the same rate, {p(A.opioid_ed, 'women')}% and {p(A.opioid_ed, 'men')}%. Adjusting for age does not alter this. At the same reported pain score, the shares for women and men coincide.</p>
      <p>Two exceptions persist, in opposite directions. Women with a headache were more likely to be given a painkiller, {p(head.analgesic_ed, 'women')}% against {p(head.analgesic_ed, 'men')}%. The 2008 finding persists in the setting in which it was originally observed: among patients with severe abdominal pain, {p(abd.opioid_ed_severe, 'women')}% of women were given an opioid against {p(abd.opioid_ed_severe, 'men')}% of men, a gap of {Math.abs(abd.opioid_ed_severe!.diff).toFixed(0)} points whose confidence interval excludes zero. Women with severe flank pain were also less likely to get any painkiller ({p(flank.analgesic_ed_severe, 'women')}% against {p(flank.analgesic_ed_severe, 'men')}%).</p>
    </>),
    F('score', <ScoreLines points={data.by_score.map(b => ({ score: b.score, cmp: b.analgesic_ed }))} title="Share given an analgesic, by reported pain score" subtitle="Share given any analgesic in the ED, by the pain score the patient reported on arrival" source={`${src} Pain score is recorded for about seven in ten visits.`} yLabel="share given any analgesic in the ED" />, 'chart'),
    F('severe-abd', <Isotype panels={[{ label: 'women, severe abdominal pain', sub: 'given an opioid', count: Math.round(abd.opioid_ed_severe!.women.est * 10), color: 'var(--c-female)' }, { label: 'men, severe abdominal pain', sub: 'given an opioid', count: Math.round(abd.opioid_ed_severe!.men.est * 10), color: 'var(--c-male)' }, { label: 'women, severe flank, rib or groin pain', sub: 'given any painkiller', count: Math.round(flank.analgesic_ed_severe!.women.est * 10), color: 'var(--c-female)' }, { label: 'men, severe flank, rib or groin pain', sub: 'given any painkiller', count: Math.round(flank.analgesic_ed_severe!.men.est * 10), color: 'var(--c-male)' }, { label: 'women, headache', sub: 'given any painkiller', count: Math.round(head.analgesic_ed!.women.est * 10), color: 'var(--c-female)' }, { label: 'men, headache', sub: 'given any painkiller', count: Math.round(head.analgesic_ed!.men.est * 10), color: 'var(--c-male)' }]} title="Medication given per 1,000 visits, by complaint and sex" subtitle="Each square is one visit. Filled squares were given the medication. The gaps that persist: women given less for severe abdominal and flank pain, more for headache." source={src} />),
    T('wait', <>
      <p>Waiting time showed no sex difference. Across pain complaints women waited a mean of {p(A.wait_mean, 'women')} minutes to see a clinician and men {p(A.wait_mean, 'men')}. Women with back pain waited {p(back.wait_mean, 'women')} minutes to men's {p(back.wait_mean, 'men')}, the largest gap, and the interval just reaches zero. No other complaint shows a comparable gap.</p>
    </>),
    T('admit', <>
      <p>Admission differed by sex. Men with chest pain were admitted, held for observation or transferred in {p(chest.admitted, 'men')}% of visits against {p(chest.admitted, 'women')}% of women's, and the same direction holds for abdominal pain ({p(abd.admitted, 'women')}% against {p(abd.admitted, 'men')}%) and headache ({p(head.admitted, 'women')}% against {p(head.admitted, 'men')}%). Part of this reflects diagnosis: a larger share of men's chest pain is cardiac. Whether the remainder reflects a lower threshold for discharging women cannot be determined from a visit record, but the gap is present in every complaint.</p>
    </>),
    F('wait-fig', <StripPlot rows={rows('wait_mean').map(r => ({ label: r.label, sub: r.sub, marks: [{ key: 'women', value: r.cmp.women.est, tip: <><b>{r.label}</b><br />Women: {r.cmp.women.est.toFixed(0)} min ({r.cmp.women.lo.toFixed(0)}–{r.cmp.women.hi.toFixed(0)})</> }, { key: 'men', value: r.cmp.men.est, tip: <><b>{r.label}</b><br />Men: {r.cmp.men.est.toFixed(0)} min ({r.cmp.men.lo.toFixed(0)}–{r.cmp.men.hi.toFixed(0)})</> }] }))} series={[{ key: 'women', label: 'Women', color: 'var(--c-female)' }, { key: 'men', label: 'Men', color: 'var(--c-male)' }]} title="Minutes waiting to see a clinician" subtitle="Mean wait from arrival to first contact with a physician, nurse practitioner or physician assistant" source={src} axisLabel="mean minutes to first provider contact" fmt={v => `${v.toFixed(0)} min`} domain={[0, Math.ceil(Math.max(...rows('wait_mean').flatMap(r => [r.cmp.women.hi, r.cmp.men.hi])) / 10) * 10]} />),
    T('heart', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Heart attacks.</p>
      <p>Chest pain is the complaint for which under-triage carries the greatest consequences. {G.chest.n.toLocaleString()} sampled chest-pain visits show the same EKG rate for women and men, {p(chest.ekg, 'women')}% and {p(chest.ekg, 'men')}%. But the blood test that detects heart muscle damage, cardiac enzymes, was ordered for {p(chest.cardenz, 'women')}% of women against {p(chest.cardenz, 'men')}% of men, while the clot test used to rule out a lung embolism was ordered more often for women, {p(chest.ddimer, 'women')}% against {p(chest.ddimer, 'men')}%. Women's chest pain was more often investigated for pulmonary embolism and less often for cardiac causes.</p>
      <p>The sample holds {data.heart_attack.n} visits that carried a heart attack diagnosis in any of the five diagnosis fields (where it is not the first-listed diagnosis, the first is usually chest pain, heart failure or cardiac arrest: these are acute visits, not follow-ups), about {data.heart_attack.weighted_per_year_k.toLocaleString()},000 a year, {data.heart_attack.n_women} of them women. The group is small and the intervals wide, so these figures should be read as a pattern rather than as precise estimates. Women having a heart attack arrived by ambulance in {p(H.ems, 'women')}% of cases against {p(H.ems, 'men')}% for men. They were triaged as urgent in {p(H.urgent, 'women')}% of cases against {p(H.urgent, 'men')}%. Cardiac enzymes were ordered for {p(H.cardenz, 'women')}% of women against {p(H.cardenz, 'men')}% of men, a gap of {Math.abs(H.cardenz!.diff).toFixed(0)} points that is statistically clear even in this small group.</p>
    </>),
    F('heart-fig', <SexCompare rows={[
      { label: 'Chief complaint was chest pain', sub: 'heart attack', cmp: H.chief_complaint_chest! },
      { label: 'Arrived by ambulance', sub: 'heart attack', cmp: H.ems! },
      { label: 'Triaged urgent (ESI 1–2)', sub: 'heart attack', cmp: H.urgent! },
            { label: 'EKG', sub: 'heart attack', cmp: H.ekg! },
      { label: 'Cardiac enzymes', sub: 'heart attack', cmp: H.cardenz! },
      { label: 'Admitted, observed or transferred', sub: 'heart attack', cmp: H.admitted! },
      { label: 'Cardiac enzymes', sub: 'all chest pain', cmp: chest.cardenz! },
      { label: 'D-dimer (clot test)', sub: 'all chest pain', cmp: chest.ddimer! },
    ]} title="Heart attack visits: triage level by sex" subtitle={`${data.heart_attack.n} sampled visits with a heart attack diagnosis (${data.heart_attack.n_women} women, ${data.heart_attack.n_men} men), and all ${G.chest.n.toLocaleString()} chest-pain visits`} source={`${src} Heart attack = ICD-10 I21 or I22 in any diagnosis field.`} axisLabel="share of visits" />),
    T('heart-text', <>
      <p>Part of this is the known problem that women's heart attacks present differently: fewer of the women arrived saying "chest pain" ({p(H.chief_complaint_chest, 'women')}% against {p(H.chief_complaint_chest, 'men')}%), and they were older on average. A triage nurse cannot assign urgency to a symptom the patient does not describe as urgent. The enzyme gap, however, reflects a decision made within the department, and cardiac enzymes are the test that would have identified the heart attack earlier. It does not depend on how the heart attack is defined: among the {data.heart_attack.primary_only.n} visits where it was the first-listed diagnosis, enzymes were ordered for {p(data.heart_attack.primary_only.cardenz, 'women')}% of women against {p(data.heart_attack.primary_only.cardenz, 'men')}% of men. The survey's enzyme item records fewer tests than practice would suggest even there, so these figures should be read as a difference between women and men rather than as absolute rates.</p>
    </>),
    T('words', <>
      <p>The presenting complaint alters the pattern, and does so differently by sex. Among heart attacks where the patient's first complaint was chest pain, women and men were triaged urgent at similar rates, {p(L.mi_urgent_by_complaint.said_chest_pain, 'women')}% and {p(L.mi_urgent_by_complaint.said_chest_pain, 'men')}%. Among heart attacks that arrived as something else, shortness of breath, weakness, nausea, pain elsewhere, men were still triaged urgent {p(L.mi_urgent_by_complaint.other_complaint, 'men')}% of the time. Women were triaged urgent {p(L.mi_urgent_by_complaint.other_complaint, 'women')}% of the time, a {Math.abs(L.mi_urgent_by_complaint.other_complaint!.diff).toFixed(0)}-point gap that is statistically clear even in this small group.</p>
      <p>That comparison rests on {L.mi_urgent_by_complaint.other_complaint!.women.n + L.mi_urgent_by_complaint.other_complaint!.men.n} sampled visits, its interval only just clears zero, and in the adjusted model it does not. It should be read as the direction in which the data lean rather than an established finding: when a man having a heart attack presents with a complaint other than chest pain, it appears to be recognised more often than when a woman does.</p>
    </>),
    F('words-fig', <Heatmap rows={[{ label: 'Said "chest pain"', sub: 'first-listed reason for visit', values: [L.mi_urgent_by_complaint.said_chest_pain!.women.est, L.mi_urgent_by_complaint.said_chest_pain!.men.est, L.mi_cardenz_by_complaint.said_chest_pain!.women.est, L.mi_cardenz_by_complaint.said_chest_pain!.men.est] }, { label: 'Said something else', sub: 'breathlessness, weakness, nausea, pain elsewhere', values: [L.mi_urgent_by_complaint.other_complaint!.women.est, L.mi_urgent_by_complaint.other_complaint!.men.est, L.mi_cardenz_by_complaint.other_complaint!.women.est, L.mi_cardenz_by_complaint.other_complaint!.men.est] }]} columns={['Women: triaged urgent', 'Men: triaged urgent', 'Women: cardiac enzymes ordered', 'Men: cardiac enzymes ordered']} title="Heart attack visits by presenting complaint" subtitle={`${data.heart_attack.n} sampled heart attacks, split by whether the first-listed reason for the visit was chest pain. Darker is more.`} source={`${src} Small samples; intervals are in the data file.`} />),
    T('age', <>
      <p>Age also matters. The under-triage of women's chest pain is concentrated among younger women. Between 18 and 44, {p(chestByAge('urgent')[0].cmp, 'women')}% of women with chest pain were triaged urgent against {p(chestByAge('urgent')[0].cmp, 'men')}% of men. By 65 the gap is absent, and women are if anything rated more urgent. Holding pain score and arrival mode constant, a woman under 45 with chest pain had {orf('chest_young_urgent_adj')} times a man's odds of an urgent rating.</p>
    </>),
    F('age-fig', <SlopeChart rows={chestByAge('urgent').map((r, i) => ({ label: r.label.replace('Chest pain, age ', 'Age '), left: r.cmp.women.est, right: r.cmp.men.est, color: ['var(--c-emphasis)', 'var(--c-female)', 'var(--c-muted)'][i], weight: 2, tip: <><b>{r.label}</b><br />Women {r.cmp.women.est.toFixed(0)}% ({r.cmp.women.lo.toFixed(0)}–{r.cmp.women.hi.toFixed(0)}) · Men {r.cmp.men.est.toFixed(0)}% ({r.cmp.men.lo.toFixed(0)}–{r.cmp.men.hi.toFixed(0)})</> }))} title="Chest pain, triaged urgent, by age" subtitle="Each line joins the women's share to the men's share in one age band. A line sloping up means men were rated urgent more often; the steepest line is the youngest." source={src} leftLabel="Women" rightLabel="Men" domain={[0, 60]} labels={chestByAge('urgent').map(r => r.label.replace('Chest pain, age ', 'Age '))} />),
    T('levers', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Arrival mode and pain score.</p>
      <p>Two factors recorded in the survey are under the patient's control: the reported pain score and the mode of arrival. The data show the association of each with treatment.</p>
      <p>The pain score is associated with analgesia but not with urgency. Across all pain visits, the share given any analgesic climbs steadily with the score, from about a third at a reported 0 to about seven in ten at a reported 10, for women and men alike. The share triaged urgent barely moves with the score at all: around {p(data.by_score_urgent.find(b => b.score === 5)?.urgent, 'women')}% at a 5 and {p(data.by_score_urgent.find(b => b.score === 10)?.urgent, 'women')}% at a 10 for women. Triage urgency is assigned on vital signs and presenting history rather than on the pain score.</p>
      <p>Arrival by ambulance is associated with urgency. Women in pain who walked in were triaged urgent {p(L.urgent_by_ambulance.walk_in, 'women')}% of the time; women who arrived by ambulance, {p(L.urgent_by_ambulance.ambulance, 'women')}%. Among patients in severe pain, the sex gap exists only for walk-ins ({p(L.urgent_severe_by_ambulance.walk_in, 'women')}% against {p(L.urgent_severe_by_ambulance.walk_in, 'men')}%); for ambulance arrivals it is absent ({p(L.urgent_severe_by_ambulance.ambulance, 'women')}% against {p(L.urgent_severe_by_ambulance.ambulance, 'men')}%). Ambulance patients also waited less: {p(L.wait_by_ambulance.ambulance, 'women')} minutes against {p(L.wait_by_ambulance.walk_in, 'women')} for women who walked in. Part of this is that patients who are more unwell are more likely to arrive by ambulance; part may be that the mode of arrival itself influences the triage rating.</p>
    </>),
    F('levers-fig', <SexCompare rows={[
      { label: 'Walked in', sub: 'triaged urgent, all pain', cmp: L.urgent_by_ambulance.walk_in! },
      { label: 'Arrived by ambulance', sub: 'triaged urgent, all pain', cmp: L.urgent_by_ambulance.ambulance! },
      { label: 'Walked in', sub: 'triaged urgent, pain 7–10', cmp: L.urgent_severe_by_ambulance.walk_in! },
      { label: 'Arrived by ambulance', sub: 'triaged urgent, pain 7–10', cmp: L.urgent_severe_by_ambulance.ambulance! },
    ]} title="Share triaged urgent, by arrival mode" subtitle="Share triaged urgent, by arrival mode, for all pain visits and for severe pain" source={src} axisLabel="share triaged urgent (ESI 1–2)" />),
    F('score-urgent', <ScoreLines points={data.by_score_urgent.map(b => ({ score: b.score, cmp: b.urgent }))} title="Share triaged urgent, by reported pain score" subtitle="Share triaged urgent, by the pain score the patient reported, 0 to 10" source={`${src} A score of 1 is reported by only about 120 sampled visits; its interval is wide.`} yLabel="share triaged urgent" />, 'chart'),
    T('adjusted', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Adjusted odds ratios.</p>
      <p>Every comparison above holds one thing constant at a time. A model can hold several at once. For each gap in this chapter we fitted a survey-weighted logistic regression with the sex of the patient alongside age band, complaint, year and, where it applies, the reported pain score, arrival mode and whether the chief complaint was chest pain. The figure shows women's odds relative to men's: below 1 means women less likely.</p>
    </>),
    F('adjusted-fig', <StripPlot rows={[['Triaged urgent, pain visits', 'urgent_raw', 'urgent_adj_full'], ['Triaged urgent, chest pain', null, 'chest_urgent_adj'], ['Triaged urgent, chest pain under 45', null, 'chest_young_urgent_adj'], ['Triaged urgent, heart attack', null, 'mi_urgent_adj'], ['Cardiac enzymes, heart attack', 'mi_cardenz_raw', 'mi_cardenz_adj'], ['Opioid, severe abdominal pain', null, 'opioid_severe_abd_adj'], ['Any painkiller, headache', null, 'headache_analgesic_adj']].map(([label, rawK, adjK]) => { const a = M[adjK as string], r = rawK ? M[rawK as string] : null; return { label: label as string, sub: `${a.or.toFixed(2)}× (${a.lo.toFixed(2)}–${a.hi.toFixed(2)})`, marks: [...(r ? [{ key: 'raw', value: r.or, tip: <><b>{label}</b><br />Unadjusted {r.or.toFixed(2)} ({r.lo.toFixed(2)}–{r.hi.toFixed(2)})</> }] : []), { key: 'adj', value: a.or, tip: <><b>{label}</b><br />{a.label}: {a.or.toFixed(2)} ({a.lo.toFixed(2)}–{a.hi.toFixed(2)}), p = {a.p}</> }], tick: { value: 1 }, arrow: r ? [r.or, a.or] as [number, number] : undefined } })} series={[{ key: 'raw', label: 'Before adjustment', color: 'var(--c-muted)' }, { key: 'adj', label: 'Adjusted', color: 'var(--c-emphasis)' }]} tickLabel="No difference (1×)" arrowLegend="what adjustment did" title="Adjusted odds ratios" subtitle="Women's odds relative to men's from survey-weighted logistic models; below 1 means women less likely. Where an unadjusted estimate exists, the arrow shows how far adjustment moved it." source={`${src} Full specifications in the models file.`} axisLabel="odds ratio, women relative to men" fmt={v => `${v.toFixed(1)}×`} domain={[0.3, 1.6]} />),
    T('adjusted-text', <>
      <p>Four findings hold once age, complaint and year, and where recorded the pain score and arrival mode, are held constant: women with severe abdominal pain are less likely to get an opioid ({orf('opioid_severe_abd_adj')}), women under 45 with chest pain are less likely to be rated urgent ({orf('chest_young_urgent_adj')}), women with a headache are more likely to be given a painkiller ({orf('headache_analgesic_adj')}), and women having a heart attack have about half the odds of having cardiac enzymes ordered ({orf('mi_cardenz_adj')}), even after adjustment for age and whether the chief complaint was chest pain. The overall urgency gap does not persist: it is largely explained by the mix of presenting complaints.</p>
    </>),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Limitations.</p>
      <p>The survey records what the chart says was done, not the clinician's reasoning, the dose, or the time between an order and the drug arriving. The 2008 study measured time to analgesia; the survey measures time to a clinician. Men and women with the same complaint do not have the same mix of underlying conditions, and some of the triage difference may be real differences in how sick people were.</p>
      <p>The pain score is missing for about three visits in ten. The heart attack group is small, and a few of its comparisons have intervals that include zero even where the point estimates are far apart; we say which. Psychiatric diagnoses on physical complaints, a difference often anticipated, are rare (about {p(A.psych_dx, 'women')}% of women's pain visits) and if anything more common for men. Where the data showed no difference, we have reported no difference.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Implications.</p>
      <p>The explorer below shows the estimates for each age band and complaint. Select an age band and a complaint.</p>
    </>),
    F('explorer', <Explorer cells={data.explorer} source={src} />),
    T('for-you-2', <>
      <p>The sex differences observed arise at triage rather than during treatment. In these data, the reported pain score is associated mainly with whether analgesia is given; urgency is associated with the presenting complaint and the mode of arrival.</p>
      <p>For patients with possible cardiac symptoms, the presenting complaint matters. Triage protocols are designed around "chest pain" or "chest pressure", and in the heart-attack data it was women rather than men whose urgency rating fell when the complaint was described in other terms. Whether a troponin, the cardiac enzyme test, has been ordered is a reasonable question to ask; in the data it was ordered for about a quarter of women having a heart attack. Arrival by ambulance rather than private transport is also relevant: women arrived by ambulance less often, and arrival by ambulance is the one factor in these data associated with closing the urgency gap.</p>
      <p>This analysis is not medical advice. The figures are intended to inform discussion with a clinician rather than to support a conclusion.</p>
    </>),
  ]

  return (
    <article>
      <header className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">{chapterRef('pain-gap')}</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">Pain, triage and waiting in the emergency department, by sex</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">Twenty thousand emergency visits for pain and {data.heart_attack.n} heart attacks, {yrs}: women arrive reporting more pain, and the settings in which they are rated lower are specific: severe abdominal pain, chest pain in young women, and heart attack.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">data {yrs} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <NextChapter slug='pain-gap' />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['chen-2008', 'nhamcs', 'nhamcs-doc']} />
      </section>
    </article>
  )
}
