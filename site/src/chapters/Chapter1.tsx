import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import Dumbbell from '../components/charts/Dumbbell'
import Beeswarm from '../components/charts/Beeswarm'
import Scatter, { inGapQuadrant } from '../components/charts/Scatter'
import DataTable from '../components/charts/DataTable'
import Summary from '../components/charts/Summary'
import ChartFrame from '../components/charts/ChartFrame'
import DrugLookup from '../components/DrugLookup'
import RateRatio from '../components/charts/RateRatio'
import type { Chapter1Data } from '../lib/types'

const GAP = 15 // percentage points: female share of reports minus female share of trial participants
const MIN_REPORTS = 100

export default function Chapter1() {
  const [data, setData] = useState<Chapter1Data | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/chapter1.json`).then(r => r.json()).then(setData)
  }, [])

  const withFaers = useMemo(() => (data?.drugs ?? []).filter(d => d.faers_female_pct != null && (d.faers_n ?? 0) >= MIN_REPORTS), [data])
  const quadrant = useMemo(() => withFaers.filter(d => inGapQuadrant(d, GAP)), [withFaers])
  const withRate = useMemo(() => (data?.drugs ?? []).filter(d => d.rate_ratio != null), [data])

  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const s = data.summary
  const z = data.zolpidem
  const zF = (z.female / (z.female + z.male)) * 100
  const snapSrc = `Source: FDA Drug Trials Snapshots, ${s.years[0]}–${s.years[1]} (${s.n_drugs} approvals), parsed by Lucca Labs.`
  const faersSrc = `Sources: FDA Drug Trials Snapshots; FDA Adverse Event Reporting System via openFDA (data through ${data.faers_last_updated ?? 'latest release'}). Drugs with at least ${MIN_REPORTS} reports.`

  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'chart', wide = false): Block => ({ type: 'figure', id, body, size, wide })

  const blocks: Block[] = [
    T('ambien', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">In January 2013, the FDA cut the recommended dose of one of America's most widely used sleeping pills in half. For women only.</p>
      <p>Zolpidem, sold as Ambien, had been on the market for twenty years; in 2011 alone about nine million Americans filled a prescription for it, and 63% of them were women.<Cite id="fda-dsc-2013" /> The agency told manufacturers to halve the recommended dose for women: 10 mg became 5 mg for the immediate-release pill, 12.5 mg became 6.25 mg for the extended-release one. For men, the label was to say only that prescribers should "consider" the lower dose.<Cite id="fda-dsc-2013" /></p>
      <p>The reason was in the blood. In the FDA's pharmacokinetic trials of the 10 mg dose, about 250 men and 250 women, roughly 15% of the women still had zolpidem levels above 50 ng/mL eight hours after taking it, against about 3% of the men. That is the level the FDA says appears capable of impairing driving.<Cite id="fda-dsc-2013" /></p>
    </>),
    F('pk', <Dumbbell rows={data.pk} title="Still impaired the next morning" subtitle="Share of patients with blood zolpidem above 50 ng/mL about 8 hours after dosing" source="Source: FDA Drug Safety Communication, 10 January 2013, pharmacokinetic data submitted by manufacturers." />),
    T('pk-text', <>
      <p>The difference held in every formulation the FDA reported: 33% of women against 25% of men on the 12.5 mg extended-release dose, and 15% against 5% even on the halved 6.25 mg dose.<Cite id="fda-dsc-2013" /></p>
      <p>None of this required a new discovery. Intermezzo, a lower-dose zolpidem product approved in November 2011, already carried a lower recommended dose for women than for men.<Cite id="fda-dsc-2013" /> For the products most people were actually taking, the label caught up fourteen months later.</p>
    </>),
    T('snapshots', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Was Ambien a one-off?</p>
      <p>Since 2015 the FDA has published a "Drug Trials Snapshot" for each novel drug its drug centre approves, listing who was in the pivotal trials by sex, race and age.<Cite id="fda-snapshots" /></p>
      <p>We collected every snapshot, {s.n_drugs} of them across {s.years[0]} to {s.years[1]}, including the ones the FDA has since removed from its live index.<Cite id="fda-snapshots-archive" /> Each dot below is one drug, placed by the share of its trial participants who were women. The median drug was tested on a population that was {s.median_trial_female_pct.toFixed(0)}% women.</p>
    </>),
    F('beeswarm', <Beeswarm drugs={data.drugs} mode="low" title={`Who was in the trial, for ${s.n_drugs} new drugs`} subtitle={`Each dot is one FDA approval. In berry: the ${s.n_under_30} drugs approved on trials under 30% women. Hover for the drug.`} source={snapSrc} />, 'chart', true),
    T('low', <>
      <p>{s.n_under_30} of those drugs were approved on trials where fewer than 30% of participants were women. {s.n_under_40} were under 40%.</p>
      <p>Some of that is legitimate: a prostate cancer drug is tested on men. But hover the dots on the left. Many treat conditions that do not spare women at all.</p>
    </>),
    T('faers', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The other side of the ledger.</p>
      <p>When a drug harms someone after approval, the report goes to the FDA Adverse Event Reporting System, FAERS.<Cite id="openfda-faers" /> Each report records the patient's sex.</p>
      <p>For every drug in the snapshots with at least {MIN_REPORTS} reports ({s.n_with_faers} drugs), we pulled the share of adverse-event reports that came from women, and put it against the share of women who were in the trial.</p>
      <p>On the dotted line, the people reporting harm look like the people who were studied. Above it, more of the harm reports come from women than the trials would predict. The shaded corner is the one that matters: drugs tested on populations that were less than half women, where women nonetheless make up at least {GAP} points more of the adverse-event reports than they did of the trial.</p>
    </>),
    F('scatter', <Scatter drugs={withFaers} mode="quadrant" gapThreshold={GAP} title="Who was studied vs. who reports harm" subtitle="One dot per drug. Dotted line: reports match the trial's sex mix. Shaded: the Ambien corner." source={faersSrc} />, 'tall', true),
    T('quadrant', <>
      <p>{quadrant.length} drugs sit in that corner. The median gap there is +{s.median_gap.toFixed(0)} points.</p>
      <p>This is the Ambien pattern, found {quadrant.length} more times, in drugs approved in the last decade. Here they are. Click a column to sort; click a drug name to open the FDA's own snapshot for it.</p>
    </>),
    F('table', <DataTable drugs={quadrant} title={`${quadrant.length} drugs in the corner`} subtitle="Sorted by gap. Click a name for the FDA snapshot." source={faersSrc} />, 'flow', true),
    T('table-text', <>
      <p>We are not claiming any of these drugs is unsafe for women. We are showing where the evidence base is thinnest exactly where the signal is loudest.</p>
    </>),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this chart cannot say.</p>
      <p>FAERS is voluntary. It records reports, not rates. If more women than men take a drug, more women will report problems with it even if the drug treats both sexes identically. Women also report adverse events more often than men in general: across every report in the database with a recorded sex, {data.faers_overall ? (data.faers_overall.female / (data.faers_overall.female + data.faers_overall.male) * 100).toFixed(0) : '60'}% come from women.<Cite id="openfda-faers" /></p>
      <p>Zolpidem shows the limit cleanly: the FDA estimated that 63% of its patients were women,<Cite id="fda-dsc-2013" /> and women account for {zF.toFixed(0)}% of its {(z.female + z.male).toLocaleString()} sex-recorded reports. The reporting gap there is almost entirely usage. What proved the sex difference was blood-level data, not reports.</p>
    </>),
    F('zolpidem', (
      <ChartFrame title="Zolpidem: reports track usage" subtitle="Why the gap is a flag, not a verdict" source="Sources: FDA Drug Safety Communication 2013 (usage); openFDA FAERS (reports).">
        <div className="grid sm:grid-cols-2 gap-4 py-2">
          <div className="rounded-2xl bg-blush-2/60 p-6"><div className="display text-6xl font-light text-bronze leading-none">63%</div><p className="mt-3 text-sm text-ink-2">of zolpidem patients were women (FDA estimate)</p></div>
          <div className="rounded-2xl bg-blush-2/60 p-6"><div className="display text-6xl font-light text-berry leading-none">{zF.toFixed(0)}%</div><p className="mt-3 text-sm text-ink-2">of zolpidem adverse-event reports are from women</p></div>
        </div>
      </ChartFrame>
    ), 'flow'),
    T('adjusted', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Adjusting for who actually takes it.</p>
      <p>The missing piece is a denominator: how many women and men take each drug. The federal Medical Expenditure Panel Survey asks a national sample of households about every prescription they fill, and records each person's sex.<Cite id="meps" /> We pooled seven years of it, 2018 to 2024, and counted the people who filled each of our drugs at least once.</p>
      <p>That turns the share of reports into something closer to a rate. If women are 53% of a drug's users and 65% of its adverse-event reports, they are filing about 1.6 times as many reports per user as men. On the chart, 1× means women and men report at the same rate per user.</p>
      <p>The survey is a sample of about 30,000 people a year, so it only sees drugs that enough people take. That leaves {s.n_with_rate} of our drugs with at least {30} surveyed users. Specialty biologics and cancer drugs mostly fall out, which is a limit of the data, not a finding.</p>
    </>),
    F('rate', <RateRatio drugs={withRate} title="Reports per user, women relative to men" subtitle={`${s.n_with_rate} drugs with enough surveyed users. Hover for the shares behind each ratio.`} source="Sources: openFDA FAERS reports by sex; MEPS Household Component prescribed-medicines and consolidated files 2018–2024, person-weighted. Reporting is voluntary; this is reports per user, not harm per user." />, 'flow', true),
    T('adjusted-2', <>
      <p>{s.n_rate_over_1_5} of the {s.n_with_rate} drugs clear 1.5×: women file at least half again as many reports per user as men. {s.n_rate_under_1 > 0 ? `${s.n_rate_under_1} go the other way.` : 'None go the other way.'} The median is {s.median_rate_ratio?.toFixed(1)}×.</p>
      <p>Zolpidem is the control. The survey puts women at {data.zolpidem_meps ? data.zolpidem_meps.female_pct.toFixed(0) : '63'}% of its users, almost exactly the FDA's 63% from 2011.<Cite id="fda-dsc-2013" /> Set against {zF.toFixed(0)}% of reports, women file {data.zolpidem_meps ? data.zolpidem_meps.rate_ratio.toFixed(1) : '1.0'}× as many reports per user as men. The drug whose dose was halved for women does not stand out on this chart at all, which is the point: the harm was in the blood levels, and the reports never flagged it.</p>
      <p>The whiskers matter. For a drug with forty surveyed users the share of women is only known to within ten points, and a ratio built on a 94% share swings a long way with that. Read the whisker, not the dot, for the small ones.</p>
      <p>Even per user, a high ratio is still not proof of harm. Women report more readily than men across all drugs, and the survey does not know doses or duration. What the ratio removes is the biggest confounder, who takes the drug. What is left is worth a trial.</p>
    </>),
    T('close', <>
      <p>So read the gap as a flag, not a verdict. The flag says: this drug was approved with little evidence about women, and the post-market signal is tilted toward them. That is where someone should look.</p>
      <p>Every number on this page is reproducible from public FDA data with the code in our repository. The <Link to="/methods">methods page</Link> explains each step, including the choices we made and what would change them.</p>
    </>),
    F('summary', <Summary title="Chapter 1 in four numbers" source={faersSrc} items={[
      { value: String(s.n_drugs), label: `new drugs with a published trial snapshot, ${s.years[0]}–${s.years[1]}` },
      { value: `${s.median_trial_female_pct.toFixed(0)}%`, label: 'women in the median pivotal trial' },
      { value: String(s.n_under_30), label: 'drugs approved on trials under 30% women' },
      { value: String(quadrant.length), label: 'drugs in the Ambien corner' },
    ]} />, 'flow'),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>Start with the drugs you actually take. If one was approved since 2015, it is in the box below: how many women were in the trials that approved it, and what the post-market reports look like. Any other drug can be checked live against the FDA's adverse-event reports.</p>
    </>),
    F('lookup', <DrugLookup drugs={data.drugs} minReports={MIN_REPORTS} />, 'flow'),
    T('for-you-2', <>
      <p>A low share of women in the trial does not mean a drug is unsafe for you. It means the evidence is thinner, and that is worth a conversation. Three questions carry most of the weight:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li><span className="font-semibold">Was the dose studied in women?</span> Zolpidem's problem was not the drug, it was the dose. Some labels now carry sex-specific dosing; many drugs clear differently in women and men without it being on the label.</li>
        <li><span className="font-semibold">Did the trial report results by sex?</span> Every FDA snapshot has a section headed "Were there any differences in how well the drug worked" and another for side effects. If it says differences could not be determined, that is an answer too.</li>
        <li><span className="font-semibold">Is there a lower dose, and a reason not to start there?</span> The FDA's own advice after Ambien, for insomnia drugs, was that patients should take the lowest dose capable of treating them.<Cite id="fda-dsc-2013" /></li>
      </ul>
      <p>And if something goes wrong on a drug, report it. FAERS exists because patients and clinicians file reports through the FDA's <a href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program" target="_blank" rel="noreferrer">MedWatch</a> programme, and the share of those reports that come from women is one of the few post-market signals anyone has.<Cite id="openfda-faers" /> Every chart on this page was built from reports somebody took the time to file.</p>
      <p>None of this is medical advice. Bring the numbers to your doctor, not a conclusion.</p>
    </>),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 1</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">Tested on men, <span className="italic font-medium text-berry">prescribed to women</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Every new drug the FDA has approved since 2015, scored on who was in the trial against who reports the side effects.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · data through {data.faers_last_updated ?? data.generated} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['fda-dsc-2013', 'fda-qa-2013', 'fda-snapshots', 'fda-snapshots-archive', 'openfda-faers', 'meps', 'carmeli-2023']} />
      </section>
    </article>
  )
}
