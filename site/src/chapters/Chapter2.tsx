import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import SexCompare from '../components/charts/SexCompare'
import ScoreLines from '../components/charts/ScoreLines'
import Summary from '../components/charts/Summary'
import Explorer from '../components/Explorer'
import type { Chapter2Data, Cmp } from '../lib/types2'

const p = (c: Cmp | null | undefined, who: 'women' | 'men') => (c ? c[who].est.toFixed(0) : '–')

export default function Chapter2() {
  const [data, setData] = useState<Chapter2Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter2.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>

  const G = Object.fromEntries(data.groups.map(g => [g.id, g]))
  const A = data.all_pain.metrics
  const abd = G.abdominal.metrics, chest = G.chest.metrics, head = G.headache.metrics, back = G.back.metrics, flank = G.flank.metrics
  const H = data.heart_attack.metrics
  const L = data.levers
  const chestByAge = (k: string) => data.explorer.filter(c => c.complaint === 'chest' && c.age !== 'all').map(c => ({ label: `Chest pain, age ${c.age}`, sub: `${c.n_women.toLocaleString()} women, ${c.n_men.toLocaleString()} men sampled`, cmp: c.metrics[k]! }))
  const yrs = `${data.years[0]}–${data.years[1]}`
  const src = `Source: NHAMCS emergency department public-use files ${yrs} (NCHS), adults 18+, survey-weighted; analysis by Lucca Labs.`
  const perYear = data.groups.reduce((a, g) => a + g.weighted_visits_per_year, 0).toFixed(0)
  const rows = (key: string, withAll = true) => [
    ...data.groups.map(g => ({ label: g.label, sub: `${g.weighted_visits_per_year.toFixed(1)}M visits a year`, cmp: g.metrics[key]! })).filter(r => r.cmp),
    ...(withAll && A[key] ? [{ label: 'All pain complaints', sub: `${data.all_pain.n.toLocaleString()} sampled visits`, cmp: A[key]! }] : []),
  ]
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The best-known number about women and pain comes from one emergency room, twenty years ago.</p>
      <p>In 2008 a team at a Philadelphia hospital published what they had seen in 981 adults who came in with acute abdominal pain over nine months of 2004 and 2005. Men and women reported the same pain. Women were 11 points less likely to be given an opioid, 7 points less likely to be given anything for it, and waited a median of 16 minutes longer.<Cite id="chen-2008" /> It has been cited thousands of times and repeated in nearly every article about women's pain since.</p>
      <p>It was a good study, and it was one hospital, two decades ago. We wanted the whole country, now, and we wanted more than the painkiller question. From the moment a woman arrives in pain to the moment she leaves, where does the system treat her differently?</p>
    </>),
    T('data', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Twenty thousand visits.</p>
      <p>The CDC does not record every emergency visit in the country. Each year it picks a sample of hospitals, and within them a sample of visits, and records each one in detail: the patient's sex and age, why they came, the pain score they reported, how they arrived, how urgently they were triaged, how long they waited, every medication given, every test run, and the diagnosis they left with.<Cite id="nhamcs" /> Each sampled visit then carries a weight: how many visits across the country it stands for. Add the weights up and you get the national picture.</p>
      <p>We pooled five years, {data.years[0]} to {data.years[1]}, and kept the visits where the main reason for coming was pain: abdominal, chest, back, head, limb or flank. That gave us {data.all_pain.n.toLocaleString()} sampled visits to work with, {(data.all_pain.n_women / data.all_pain.n * 100).toFixed(0)}% of them by women. Weighted up, they represent roughly {perYear} million emergency visits for pain every year. Every number in this chapter is one of those weighted estimates, and every chart shows the uncertainty that comes from working with a sample.</p>
    </>),
    T('report', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What women report.</p>
      <p>Start with the patient's own number. On arrival, most emergency departments ask for a pain score from 0 to 10. Across every pain complaint, women rated their pain as severe, 7 or higher, more often than men: {p(A.severe_share, 'women')}% against {p(A.severe_share, 'men')}%. For chest pain the gap is {Math.abs(chest.severe_share!.diff).toFixed(0)} points, for headache {Math.abs(head.severe_share!.diff).toFixed(0)}.</p>
    </>),
    F('severe', <SexCompare rows={rows('severe_share')} title="Arriving in severe pain" subtitle="Share of visits where the patient rated their pain 7 to 10 out of 10, by sex" source={`${src} Pain score recorded for about three-fifths of visits.`} axisLabel="share rating pain 7–10" />),
    T('door', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What the system does at the door.</p>
      <p>Two things happen before any doctor is involved. Someone decides whether to call an ambulance, and a triage nurse assigns an urgency level. On both, women in pain are rated lower. They arrived by ambulance in {p(A.ems, 'women')}% of pain visits against {p(A.ems, 'men')}% for men, and were triaged as urgent, the top two of five levels, in {p(A.urgent, 'women')}% against {p(A.urgent, 'men')}%. Both gaps are statistically clear, and both run opposite to what the patients themselves reported.</p>
      <p>The ambulance decision is mostly the patient's and their family's; the triage decision is the department's. Neither is a diagnosis, and more severe illness in men could explain part of it. But it is the first point where a woman's account of her pain and the system's rating of it diverge, and the direction is consistent.</p>
    </>),
    F('triage', <SexCompare rows={[...rows('urgent', false).map(r => ({ ...r, label: `${r.label}` })), { label: 'All pain complaints', sub: 'triaged urgent (ESI 1–2)', cmp: A.urgent! }, { label: 'All pain complaints', sub: 'arrived by ambulance', cmp: A.ems! }]} title="Rated urgent, and brought by ambulance" subtitle="Share of visits triaged at the two most urgent levels, by complaint; and the ambulance share overall" source={src} axisLabel="share of visits" />),
    T('treat', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What they are given.</p>
      <p>Here the 2008 picture mostly dissolves. Across all pain complaints, women and men were given a painkiller of any kind in the department at the same rate, {p(A.analgesic_ed, 'women')}% and {p(A.analgesic_ed, 'men')}%, and an opioid at the same rate, {p(A.opioid_ed, 'women')}% and {p(A.opioid_ed, 'men')}%. Adjusting for age changes nothing. At the same reported pain score, the lines sit on top of each other.</p>
      <p>Two exceptions survive, and they point in opposite directions. Women with a headache were more likely to be given a painkiller, {p(head.analgesic_ed, 'women')}% against {p(head.analgesic_ed, 'men')}%. And the 2008 finding is still there in exactly the place it was found: among patients with severe abdominal pain, {p(abd.opioid_ed_severe, 'women')}% of women were given an opioid against {p(abd.opioid_ed_severe, 'men')}% of men, a gap of {Math.abs(abd.opioid_ed_severe!.diff).toFixed(0)} points that the confidence interval does not reach across. Women with severe flank pain were also less likely to get any painkiller ({p(flank.analgesic_ed_severe, 'women')}% against {p(flank.analgesic_ed_severe, 'men')}%).</p>
    </>),
    F('score', <ScoreLines points={data.by_score.map(b => ({ score: b.score, cmp: b.analgesic_ed }))} title="At the same reported pain, the same painkillers" subtitle="Share given any analgesic in the ED, by the pain score the patient reported on arrival" source={`${src} Pain score is recorded for about three-fifths of visits.`} yLabel="share given any analgesic in the ED" />, 'chart'),
    F('severe-abd', <SexCompare rows={[{ label: 'Abdominal pain', sub: 'opioid, pain 7–10', cmp: abd.opioid_ed_severe! }, { label: 'Flank, rib or groin', sub: 'any painkiller, pain 7–10', cmp: flank.analgesic_ed_severe! }, { label: 'Headache', sub: 'any painkiller, all visits', cmp: head.analgesic_ed! }, { label: 'All pain complaints', sub: 'opioid, pain 7–10', cmp: A.opioid_ed_severe! }, { label: 'All pain complaints', sub: 'any painkiller, pain 7–10', cmp: A.analgesic_ed_severe! }]} title="Where treatment still differs" subtitle="The gaps that survive: severe abdominal and flank pain against women, headache in their favour" source={src} axisLabel="share of visits" />),
    T('wait', <>
      <p>Waiting time is even. Across pain complaints women waited a mean of {p(A.wait_mean, 'women')} minutes to see a clinician and men {p(A.wait_mean, 'men')}. Women with back pain waited {p(back.wait_mean, 'women')} minutes to men's {p(back.wait_mean, 'men')}, the largest gap, and the interval just reaches zero. Nothing else comes close.</p>
    </>),
    F('wait-fig', <SexCompare rows={rows('wait_mean')} title="Minutes waiting to see a clinician" subtitle="Mean wait from arrival to first contact with a physician, nurse practitioner or physician assistant" source={src} unit=" min" axisLabel="mean minutes to first provider contact" />),
    T('heart', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">When it was a heart attack.</p>
      <p>Chest pain is where the stakes of being rated lower are highest. {G.chest.n.toLocaleString()} sampled chest-pain visits show the same EKG rate for women and men, {p(chest.ekg, 'women')}% and {p(chest.ekg, 'men')}%. But the blood test that detects heart muscle damage, cardiac enzymes, was ordered for {p(chest.cardenz, 'women')}% of women against {p(chest.cardenz, 'men')}% of men, while the clot test used to rule out a lung embolism was ordered more often for women, {p(chest.ddimer, 'women')}% against {p(chest.ddimer, 'men')}%. Women's chest pain was more often worked up as a clot and less often as a heart.</p>
      <p>The sample holds {data.heart_attack.n} visits that ended with a heart attack diagnosis, about {data.heart_attack.weighted_per_year_k.toLocaleString()},000 a year, {data.heart_attack.n_women} of them women. It is a small group and the intervals are wide, so read these as a pattern rather than a precise count. Women having a heart attack arrived by ambulance in {p(H.ems, 'women')}% of cases against {p(H.ems, 'men')}% for men. They were triaged as urgent in {p(H.urgent, 'women')}% of cases against {p(H.urgent, 'men')}%, and at the single most urgent level in {p(H.esi1, 'women')}% against {p(H.esi1, 'men')}%. Cardiac enzymes were ordered for {p(H.cardenz, 'women')}% of women against {p(H.cardenz, 'men')}% of men, a gap of {Math.abs(H.cardenz!.diff).toFixed(0)} points that is statistically clear even in this small group.</p>
    </>),
    F('heart-fig', <SexCompare rows={[
      { label: 'Chief complaint was chest pain', sub: 'heart attack', cmp: H.chief_complaint_chest! },
      { label: 'Arrived by ambulance', sub: 'heart attack', cmp: H.ems! },
      { label: 'Triaged urgent (ESI 1–2)', sub: 'heart attack', cmp: H.urgent! },
      { label: 'Triaged immediate (ESI 1)', sub: 'heart attack', cmp: H.esi1! },
      { label: 'EKG', sub: 'heart attack', cmp: H.ekg! },
      { label: 'Cardiac enzymes', sub: 'heart attack', cmp: H.cardenz! },
      { label: 'Admitted or transferred', sub: 'heart attack', cmp: H.admitted! },
      { label: 'Cardiac enzymes', sub: 'all chest pain', cmp: chest.cardenz! },
      { label: 'D-dimer (clot test)', sub: 'all chest pain', cmp: chest.ddimer! },
    ]} title="The heart attack that is rated lower" subtitle={`${data.heart_attack.n} sampled visits with a heart attack diagnosis (${data.heart_attack.n_women} women, ${data.heart_attack.n_men} men), and all ${G.chest.n.toLocaleString()} chest-pain visits`} source={`${src} Heart attack = ICD-10 I21 or I22 in any diagnosis field.`} axisLabel="share of visits" />),
    T('heart-text', <>
      <p>Part of this is the known problem that women's heart attacks present differently: fewer of the women arrived saying "chest pain" ({p(H.chief_complaint_chest, 'women')}% against {p(H.chief_complaint_chest, 'men')}%), and they were older on average. A triage nurse cannot rate as urgent a symptom the patient does not describe as urgent. But the enzyme gap is the department's own decision, and it is the one that would have found the heart attack sooner.</p>
    </>),
    T('words', <>
      <p>What the patient says changes the picture, and it changes it differently by sex. Among heart attacks where the patient's first complaint was chest pain, women and men were triaged urgent at similar rates, {p(L.mi_urgent_by_complaint.said_chest_pain, 'women')}% and {p(L.mi_urgent_by_complaint.said_chest_pain, 'men')}%. Among heart attacks that arrived as something else, shortness of breath, weakness, nausea, pain elsewhere, men were still triaged urgent {p(L.mi_urgent_by_complaint.other_complaint, 'men')}% of the time. Women were triaged urgent {p(L.mi_urgent_by_complaint.other_complaint, 'women')}% of the time, a {Math.abs(L.mi_urgent_by_complaint.other_complaint!.diff).toFixed(0)}-point gap that is statistically clear even in this small group.</p>
      <p>Read that again. When a man having a heart attack describes it in some other way, the system still catches it. When a woman does, it does not.</p>
    </>),
    F('words-fig', <SexCompare rows={[
      { label: 'Said "chest pain"', sub: 'triaged urgent', cmp: L.mi_urgent_by_complaint.said_chest_pain! },
      { label: 'Said something else', sub: 'triaged urgent', cmp: L.mi_urgent_by_complaint.other_complaint! },
      { label: 'Said "chest pain"', sub: 'cardiac enzymes ordered', cmp: L.mi_cardenz_by_complaint.said_chest_pain! },
      { label: 'Said something else', sub: 'cardiac enzymes ordered', cmp: L.mi_cardenz_by_complaint.other_complaint! },
    ]} title="During a heart attack, what you say" subtitle={`${data.heart_attack.n} sampled heart attacks, split by whether the first-listed reason for the visit was chest pain`} source={`${src} Small samples; read the whiskers.`} axisLabel="share of heart-attack visits" />),
    T('age', <>
      <p>Age matters too, and not in the direction most people expect. The under-triage of women's chest pain is a young women's problem. Between 18 and 44, {p(chestByAge('urgent')[0].cmp, 'women')}% of women with chest pain were triaged urgent against {p(chestByAge('urgent')[0].cmp, 'men')}% of men. By 65 the gap has gone, and women are if anything rated higher.</p>
    </>),
    F('age-fig', <SexCompare rows={chestByAge('urgent')} title="Chest pain, triaged urgent, by age" subtitle="The gap is largest for the youngest women and closes with age" source={src} axisLabel="share triaged urgent (ESI 1–2)" />),
    T('levers', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The two levers a patient holds.</p>
      <p>A patient controls almost nothing in an emergency department, but they control two things: the pain score they give, and how they arrive. The data shows what each one buys.</p>
      <p>The pain score buys painkillers, not urgency. Across all pain visits, the share given any analgesic climbs steadily with the score, from about a third at a reported 0 to about seven in ten at a reported 10, for women and men alike. The share triaged urgent barely moves with the score at all: around {p(data.by_score_urgent.find(b => b.score === 5)?.urgent, 'women')}% at a 5 and {p(data.by_score_urgent.find(b => b.score === 10)?.urgent, 'women')}% at a 10 for women. Triage nurses rate urgency on vital signs and the story, not the number.</p>
      <p>The ambulance buys urgency. Women in pain who walked in were triaged urgent {p(L.urgent_by_ambulance.walk_in, 'women')}% of the time; women who arrived by ambulance, {p(L.urgent_by_ambulance.ambulance, 'women')}%. Among patients in severe pain, the sex gap exists only for walk-ins ({p(L.urgent_severe_by_ambulance.walk_in, 'women')}% against {p(L.urgent_severe_by_ambulance.walk_in, 'men')}%); for ambulance arrivals it is gone ({p(L.urgent_severe_by_ambulance.ambulance, 'women')}% against {p(L.urgent_severe_by_ambulance.ambulance, 'men')}%). Ambulance patients also waited less: {p(L.wait_by_ambulance.ambulance, 'women')} minutes against {p(L.wait_by_ambulance.walk_in, 'women')} for women who walked in. Part of that is that sicker people call ambulances. Part of it is that arriving on a stretcher is a statement the triage system cannot discount.</p>
    </>),
    F('levers-fig', <SexCompare rows={[
      { label: 'Walked in', sub: 'triaged urgent, all pain', cmp: L.urgent_by_ambulance.walk_in! },
      { label: 'Arrived by ambulance', sub: 'triaged urgent, all pain', cmp: L.urgent_by_ambulance.ambulance! },
      { label: 'Walked in', sub: 'triaged urgent, pain 7–10', cmp: L.urgent_severe_by_ambulance.walk_in! },
      { label: 'Arrived by ambulance', sub: 'triaged urgent, pain 7–10', cmp: L.urgent_severe_by_ambulance.ambulance! },
    ]} title="How you arrive" subtitle="Share triaged urgent, by arrival mode, for all pain visits and for severe pain" source={src} axisLabel="share triaged urgent (ESI 1–2)" />),
    F('score-urgent', <ScoreLines points={data.by_score_urgent.filter(b => b.score >= 4).map(b => ({ score: b.score, cmp: b.urgent }))} title="The pain score barely moves triage" subtitle="Share triaged urgent, by the pain score the patient reported, 4 to 10" source={`${src} Scores 0 to 3 are omitted: too few pain visits report them for a stable estimate.`} yLabel="share triaged urgent" />, 'chart'),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>The survey records what the chart says was done, not the clinician's reasoning, the dose, or the time between an order and the drug arriving. The 2008 study measured time to analgesia; the survey measures time to a clinician. Men and women with the same complaint do not have the same mix of underlying conditions, and some of the triage difference may be real differences in how sick people were.</p>
      <p>The pain score is missing for about two visits in five. The heart attack group is small, and a few of its comparisons have intervals that include zero even where the point estimates are far apart; we say which. Psychiatric diagnoses on physical complaints, a gap many expect, are rare (about {p(A.psych_dx, 'women')}% of women's pain visits) and if anything more common for men. Where the data was flat, we have said it was flat.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>First, see what the data says about people like you. Pick an age band and a complaint.</p>
    </>),
    F('explorer', <Explorer cells={data.explorer} source={src} />),
    T('for-you-2', <>
      <p>Then the practical part. The gap opens at the front desk, not in the treatment room. Give your pain score honestly, but know that it mainly decides whether you get a painkiller; what decides urgency is the story you tell and how you arrive.</p>
      <p>If the problem might be your heart, use the words. "Chest pain" or "chest pressure" is what the triage system is built to hear, and the heart-attack data shows it is women, not men, who pay for describing it any other way. Ask whether a troponin, the cardiac enzyme test, has been sent; in the data it was ordered for barely a quarter of women having a heart attack. And if it might be your heart, call the ambulance rather than driving. Women do this less, and arrival by ambulance is the one thing in this data that closes the urgency gap.</p>
      <p>None of this is medical advice. Bring the numbers to your doctor, not a conclusion.</p>
    </>),
    F('summary', <Summary title="Chapter 2 in four numbers" source={src} items={[
      { women: `${p(A.severe_share, 'women')}%`, men: `${p(A.severe_share, 'men')}%`, label: 'arrived with pain rated 7 to 10' },
      { women: `${p(A.urgent, 'women')}%`, men: `${p(A.urgent, 'men')}%`, label: 'triaged urgent on arrival' },
      { women: `${p(abd.opioid_ed_severe, 'women')}%`, men: `${p(abd.opioid_ed_severe, 'men')}%`, label: 'given an opioid for severe abdominal pain' },
      { women: `${p(H.cardenz, 'women')}%`, men: `${p(H.cardenz, 'men')}%`, label: 'had cardiac enzymes ordered during a heart attack' },
    ]} />, 'flow', false),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 2</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">The <span className="italic font-medium text-berry">urgency</span> gap</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Twenty thousand emergency visits for pain and {data.heart_attack.n} heart attacks, {yrs}: women arrive reporting more pain and are rated less urgent, from the ambulance to the blood test.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · data {yrs} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['chen-2008', 'nhamcs', 'nhamcs-doc']} />
      </section>
    </article>
  )
}
