import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import SexCompare from '../components/charts/SexCompare'
import ScoreLines from '../components/charts/ScoreLines'
import Summary from '../components/charts/Summary'
import type { Chapter2Data, Cmp } from '../lib/types2'

const pct = (c: Cmp | null | undefined, who: 'women' | 'men') => (c ? c[who].est.toFixed(0) : '–')
const sig = (c: Cmp | null | undefined) => !!c && (c.diff_lo > 0 || c.diff_hi < 0)

export default function Chapter2() {
  const [data, setData] = useState<Chapter2Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter2.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>

  const G = Object.fromEntries(data.groups.map(g => [g.id, g]))
  const A = data.all_pain.metrics
  const abd = G.abdominal.metrics, chest = G.chest.metrics, head = G.headache.metrics
  const src = `Source: NHAMCS emergency department public-use files ${data.years[0]}–${data.years[1]} (NCHS), adults 18+, survey-weighted; analysis by Lucca Labs.`
  const rowsAll = (key: string) => [
    ...data.groups.map(g => ({ label: g.label, sub: `${g.weighted_visits_per_year.toFixed(1)}M visits a year`, cmp: g.metrics[key]! })).filter(r => r.cmp),
    { label: 'All pain complaints', sub: `${data.all_pain.n.toLocaleString()} sampled visits`, cmp: A[key]! },
  ]
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'chart', wide = false): Block => ({ type: 'figure', id, body, size, wide })

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The best-known number about women and pain comes from one emergency room, twenty years ago.</p>
      <p>In 2008 a team at a Philadelphia hospital published what they had seen in 981 adults who came in with acute abdominal pain over nine months of 2004 and 2005. Men and women reported the same pain. Women were 11 points less likely to be given an opioid, 7 points less likely to be given anything for the pain, and waited a median of 16 minutes longer for it.<Cite id="chen-2008" /> The paper has been cited thousands of times and repeated in nearly every article about women's pain since.</p>
      <p>It was a good study. It was also one hospital, two decades ago. We wanted to know what the same question looks like across the whole country now.</p>
    </>),
    T('data', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Re-measuring it, nationally.</p>
      <p>Every year the CDC samples emergency department visits from hospitals across the United States and records, for each one, the patient's sex and age, why they came, the pain score they reported, how long they waited to see a clinician, every medication given or prescribed, and what tests were run.<Cite id="nhamcs" /> We pooled the {data.years[1] - data.years[0] + 1} most recent years, {data.years[0]} to {data.years[1]}: {data.n_adult_visits.toLocaleString()} sampled adult visits, standing for about {data.weighted_adult_visits_per_year_m} million a year.</p>
      <p>We kept the visits where the main reason for coming was pain: abdominal, chest, back, head, limb or flank. That is {data.all_pain.n.toLocaleString()} sampled visits, about {data.groups.reduce((a, g) => a + g.weighted_visits_per_year, 0).toFixed(0)} million a year. Then we asked the 2008 question of each: was an opioid given in the department, and did that differ by sex?</p>
    </>),
    F('opioid', <SexCompare rows={rowsAll('opioid_ed')} title="Given an opioid in the emergency department" subtitle="Share of adult visits for each pain complaint, by patient sex" source={src} axisLabel="share of visits given an opioid in the ED" />, 'flow', true),
    T('opioid-text', <>
      <p>The gap is not there. Across all pain complaints, {pct(A.opioid_ed, 'women')}% of women and {pct(A.opioid_ed, 'men')}% of men were given an opioid in the department. Adjusting for age moves it by less than a point. Within each triage level it is the same. No complaint shows a significant difference in either direction.</p>
      <p>The 2008 objection would be that women and men might report different pain. So we compared them at the same reported score.</p>
    </>),
    F('score', <ScoreLines points={data.by_score.map(b => ({ score: b.score, cmp: b.opioid_ed }))} title="At the same reported pain, the same treatment" subtitle="Share given an opioid in the ED, by the pain score the patient reported on arrival" source={`${src} Pain score is recorded for about three-fifths of visits.`} yLabel="share given an opioid in the ED" />, 'chart', true),
    T('score-text', <>
      <p>The lines sit on top of each other. At a reported 10 out of 10, {data.by_score.find(b => b.score === 10)?.opioid_ed.women.est.toFixed(0)}% of women and {data.by_score.find(b => b.score === 10)?.opioid_ed.men.est.toFixed(0)}% of men were given an opioid. Whatever was true in one Philadelphia department in 2004, it is not what American emergency departments were doing between {data.years[0]} and {data.years[1]}.</p>
      <p>Opioids are not the only painkiller, though, and the differences that do survive are in the other kinds.</p>
    </>),
    F('analgesic', <SexCompare rows={rowsAll('analgesic_ed')} title="Given any painkiller in the emergency department" subtitle="Opioid or not: NSAIDs, acetaminophen, combinations. Share of adult visits, by patient sex" source={src} axisLabel="share of visits given any analgesic in the ED" />, 'flow', true),
    T('analgesic-text', <>
      <p>Headache is the exception. Women who came in with a headache or migraine were given any painkiller in {pct(head.analgesic_ed, 'women')}% of visits, men in {pct(head.analgesic_ed, 'men')}%. That {Math.abs(head.analgesic_ed!.diff).toFixed(0)}-point gap is {sig(head.analgesic_ed) ? 'statistically clear' : 'not statistically clear'}, and it is the only complaint where women were treated less. Women with headache were also more likely to get a head CT, {pct(head.cthead, 'women')}% against {pct(head.cthead, 'men')}%, which hints at a department treating the visit as a diagnostic problem rather than a pain problem.</p>
      <p>In the other direction, women with severe abdominal pain, 7 or more out of 10, were given an opioid in {pct(abd.opioid_ed_severe, 'women')}% of visits against {pct(abd.opioid_ed_severe, 'men')}% for men, a difference of {abd.opioid_ed_severe!.diff.toFixed(0)} points that does not include zero. The 2008 finding, measured today, points the other way.</p>
    </>),
    F('wait', <SexCompare rows={rowsAll('wait_mean')} title="Minutes waiting to see a clinician" subtitle="Mean wait from arrival to first contact with a physician, nurse practitioner or physician assistant" source={src} unit=" min" axisLabel="mean minutes to first provider contact" />, 'flow', true),
    T('wait-text', <>
      <p>Waiting is the same story. Across pain complaints women waited a mean of {pct(A.wait_mean, 'women')} minutes and men {pct(A.wait_mean, 'men')}. For chest pain women waited {pct(chest.wait_mean, 'women')} minutes to men's {pct(chest.wait_mean, 'men')}, a difference the confidence interval cannot separate from zero. Nowhere is the difference significant.</p>
      <p>If anything, the department's first judgement runs the other way: among pain visits, women were triaged as urgent more often than men ({pct(A.urgent, 'women')}% against {pct(A.urgent, 'men')}%) and arrived by ambulance more often ({pct(A.ems, 'women')}% against {pct(A.ems, 'men')}%). Both differences are statistically clear.</p>
    </>),
    F('workup', <SexCompare rows={[
      { label: 'EKG', sub: 'chest pain', cmp: chest.ekg! },
      { label: 'Cardiac monitoring', sub: 'chest pain', cmp: chest.cardmon! },
      { label: 'Admitted', sub: 'chest pain', cmp: chest.admitted! },
      { label: 'CT of the abdomen', sub: 'abdominal pain', cmp: abd.ctab! },
      { label: 'CT of the head', sub: 'headache', cmp: head.cthead! },
      { label: 'Triaged urgent', sub: 'all pain complaints', cmp: A.urgent! },
      { label: 'Arrived by ambulance', sub: 'all pain complaints', cmp: A.ems! },
    ]} title="What the department did next" subtitle="Tests, triage and admission, by patient sex" source={src} axisLabel="share of visits" />, 'flow', true),
    T('workup-text', <>
      <p>Chest pain is where the stakes of a missed diagnosis are highest and where sex differences in heart attacks are best documented. Here the record is even: {pct(chest.ekg, 'women')}% of women and {pct(chest.ekg, 'men')}% of men with chest pain got an EKG, and cardiac monitoring and admission match too. Women with abdominal pain were more likely to get a CT scan, {pct(abd.ctab, 'women')}% to {pct(abd.ctab, 'men')}%, which fits the wider range of things abdominal pain can be in women.</p>
    </>),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>The survey records what the chart says was done. It does not record the dose, how long the patient waited for the medication once it was ordered, or whether anyone believed them. The 2008 study measured time to analgesia; the survey only measures time to a clinician. "Same complaint" is not the same condition, and women and men with abdominal pain do not have the same mix of diagnoses.</p>
      <p>The pain score is missing for about two visits in five, and women in these visits reported severe pain less often than men ({pct(A.severe_share, 'women')}% against {pct(A.severe_share, 'men')}%), which could mean less pain, different reporting, or different recording. We compared like with like where we could and said so where we could not.</p>
      <p>And a national average can hide a local gap. The 2008 result may have been real in that department in that year. What this chapter shows is that it is not the national picture now, and that where the national data does show a sex difference, it is mostly women getting more: more urgency at triage, more imaging, and for severe abdominal pain, more opioids.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>If you are a woman going to an emergency department in pain, the national odds of being treated differently because of your sex are, on this evidence, close to even. That is worth knowing, because the fear of being dismissed is itself a reason people delay going.</p>
      <p>The one place the data says to push is headache. Ask directly for pain treatment, and ask what the plan is while the diagnosis is being worked out. And whatever the complaint, the pain score you give is recorded and used: it is the single number most tied to what happens next in these charts.</p>
      <p>None of this is medical advice. Bring the numbers to your doctor, not a conclusion.</p>
    </>),
    F('summary', <Summary source={src} items={[
      { value: data.all_pain.n.toLocaleString(), label: `sampled ED visits for pain, ${data.years[0]}–${data.years[1]}, about ${data.groups.reduce((a, g) => a + g.weighted_visits_per_year, 0).toFixed(0)}M a year` },
      { value: `${pct(A.opioid_ed, 'women')}% / ${pct(A.opioid_ed, 'men')}%`, label: 'women / men given an opioid in the ED' },
      { value: `${pct(A.wait_mean, 'women')} / ${pct(A.wait_mean, 'men')} min`, label: 'mean wait to a clinician, women / men' },
      { value: `${head.analgesic_ed!.diff.toFixed(0)} pts`, label: 'the one gap against women: any painkiller for headache' },
    ]} />, 'flow'),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 2</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">The pain gap, <span className="italic font-medium text-berry">re-measured</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Twenty thousand emergency visits for pain, {data.years[0]} to {data.years[1]}: who was given an opioid, who was given anything, and who waited.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · data {data.years[0]}–{data.years[1]} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['chen-2008', 'nhamcs', 'nhamcs-doc']} />
      </section>
    </article>
  )
}
