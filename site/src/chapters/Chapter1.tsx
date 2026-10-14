import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { chapterRef } from '../lib/chapters'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import NextChapter from '../components/NextChapter'
import Beeswarm from '../components/charts/Beeswarm'
import Scatter, { inGapQuadrant } from '../components/charts/Scatter'
import DataTable from '../components/charts/DataTable'
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

  const withFaers = useMemo(() => (data?.drugs ?? []).filter(d => d.faers_female_pct != null && (d.faers_n ?? 0) >= MIN_REPORTS && !d.sex_specific), [data])
  const quadrant = useMemo(() => withFaers.filter(d => inGapQuadrant(d, GAP)), [withFaers])
  const withRate = useMemo(() => (data?.drugs ?? []).filter(d => d.rate_ratio != null), [data])

  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const s = data.summary
  const z = data.zolpidem
  const zF = (z.female / (z.female + z.male)) * 100
  const snapSrc = `Source: FDA Drug Trials Snapshots, ${s.years[0]}–${s.years[1]} (${s.n_drugs} approvals), parsed by The Women's Health Record.`
  const faersSrc = `Sources: FDA Drug Trials Snapshots; FDA Adverse Event Reporting System via openFDA (data through ${data.faers_last_updated ?? 'latest release'}). Drugs with at least ${MIN_REPORTS} reports.`

  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'chart', wide = false): Block => ({ type: 'figure', id, body, size, wide })

  const blocks: Block[] = [
    T('ambien', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">In January 2013, the FDA halved the recommended dose of one of America's most widely used sleeping pills for women only.</p>
      <p>Zolpidem, sold as Ambien, had been on the market for twenty years; in 2011 alone about nine million Americans filled a prescription for it, and 63% of them were women.<Cite id="fda-dsc-2013" /> The agency told manufacturers to halve the recommended dose for women: 10 mg became 5 mg for the immediate-release pill, 12.5 mg became 6.25 mg for the extended-release one. For men, the label was to say only that prescribers should "consider" the lower dose.<Cite id="fda-dsc-2013" /></p>
      <p>The change rested on blood-concentration data. In the FDA's pharmacokinetic trials of the 10 mg dose, about 250 men and 250 women, roughly 15% of the women still had zolpidem levels above 50 ng/mL eight hours after taking it, against about 3% of the men. That is the level the FDA says appears capable of impairing driving.<Cite id="fda-dsc-2013" /></p>
    </>),
    T('pk-text', <>
      <p>The difference was larger for the extended-release form: 33% of women against 25% of men on the 12.5 mg dose still had levels above the threshold eight hours after dosing.<Cite id="fda-qa-2013" /></p>
      <p>The finding was not new. Intermezzo, a lower-dose zolpidem product approved in November 2011, already carried a lower recommended dose for women than for men.<Cite id="fda-dsc-2013" /> For the more widely used zolpidem products, the labelling change followed fourteen months later.</p>
    </>),
    T('snapshots', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Trial participation by sex, 2015 onward.</p>
      <p>Since 2015 the FDA has published a "Drug Trials Snapshot" for each novel drug its drug centre approves, listing who was in the pivotal trials by sex, race and age.<Cite id="fda-snapshots" /></p>
      <p>We collected every snapshot we could retrieve, {s.n_drugs} drugs across {s.years[0]} to {s.years[1]}, including the ones the FDA has since removed from its live index.<Cite id="fda-snapshots-archive" /> Each dot below is one drug, placed by the share of its trial participants who were women. The median drug was tested on a population that was {s.median_trial_female_pct.toFixed(0)}% women.</p>
    </>),
    F('beeswarm', <Beeswarm drugs={data.drugs} mode="low" title={`Women's share of pivotal trial participants, ${s.n_drugs} new drugs`} subtitle={`Each dot is one FDA approval. In berry: the ${s.n_under_30} drugs approved on trials under 30% women. Hover for the drug.`} source={snapSrc} />, 'chart', true),
    T('low', <>
      <p>{s.n_under_30} of those drugs were approved on trials where fewer than 30% of participants were women. {s.n_under_40} were under 40%.</p>
      <p>Some of this is expected: a prostate cancer drug is tested on men, a Duchenne drug on boys, and those drugs are marked as sex-specific in the data and excluded from every comparison that follows. Hover the dots on the left to identify the remaining drugs; many treat conditions that occur in both sexes.</p>
    </>),
    T('faers', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Adverse-event reports by sex.</p>
      <p>Adverse events that occur after approval are reported to the FDA Adverse Event Reporting System, FAERS.<Cite id="openfda-faers" /> Each report records the patient's sex.</p>
      <p>For every drug in the snapshots that is not sex-specific and has at least {MIN_REPORTS} reports ({s.n_with_faers} drugs), we calculated the share of adverse-event reports that came from women and compared it with the share of women in the trial.</p>
      <p>On the dotted line, the sex distribution of adverse-event reports matches that of the trial population. Above it, the share of reports from women exceeds the share of women in the trial. The shaded region marks drugs tested on populations that were less than half women, where women nonetheless make up at least {GAP} points more of the adverse-event reports than they did of the trial.</p>
    </>),
    F('scatter', <Scatter drugs={withFaers} mode="quadrant" gapThreshold={GAP} title="Women's share of trial participants against women's share of adverse-event reports" subtitle="One dot per drug. Dotted line: reports match the trial's sex mix. Shaded: trials under half women with a reporting gap at or above the threshold." source={faersSrc} />, 'tall', true),
    T('quadrant', <>
      <p>{quadrant.length} drugs fall in that region. The median gap there is +{s.median_gap.toFixed(0)} points.</p>
      <p>This is the pattern observed for zolpidem, a trial with few women and a post-market signal weighted toward them, and it occurs {quadrant.length} times among drugs approved in the last decade. For zolpidem itself, as shown at the end of this chapter, the reporting gap is largely explained by the sex distribution of users; the same may hold for some of these drugs and not for others. The drugs are listed below. Click a column to sort; click a drug name to open the FDA's snapshot for it.</p>
    </>),
    F('table', <DataTable drugs={quadrant} title={`${quadrant.length} drugs with the largest gap`} subtitle="Sorted by gap. Click a name for the FDA snapshot." source={faersSrc} />, 'flow', true),
    T('table-text', <>
      <p>We do not claim that any of these drugs is unsafe for women. The table identifies the drugs for which trial evidence in women is smallest and the post-market reporting signal from women is largest.</p>
    </>),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Limitations of the comparison.</p>
      <p>FAERS reporting is voluntary, and the system records counts of reports rather than rates. If more women than men take a drug, more women will report problems with it even if the drug treats both sexes identically. Women also report adverse events more often than men in general: across every report in the database with a recorded sex, {data.faers_overall ? (data.faers_overall.female / (data.faers_overall.female + data.faers_overall.male) * 100).toFixed(0) : '60'}% come from women.<Cite id="openfda-faers" /></p>
      <p>Zolpidem illustrates this limitation: the FDA estimated that 63% of its patients were women,<Cite id="fda-dsc-2013" /> and women account for {zF.toFixed(0)}% of its {(z.female + z.male).toLocaleString()} sex-recorded reports. The reporting gap for zolpidem is therefore almost entirely attributable to the sex distribution of users; the sex difference was established by pharmacokinetic data rather than by reports.</p>
    </>),
    F('zolpidem', (
      <ChartFrame title="Zolpidem: adverse-event reports and users, by sex" subtitle="Reports follow use; the gap is a screening signal" source="Sources: FDA Drug Safety Communication 2013 (usage); openFDA FAERS (reports).">
        <div className="grid sm:grid-cols-2 gap-4 py-2">
          <div className="rounded-2xl bg-blush-2/60 p-6"><div className="display text-6xl font-light text-bronze leading-none">63%</div><p className="mt-3 text-sm text-ink-2">of zolpidem patients were women (FDA estimate)</p></div>
          <div className="rounded-2xl bg-blush-2/60 p-6"><div className="display text-6xl font-light text-berry leading-none">{zF.toFixed(0)}%</div><p className="mt-3 text-sm text-ink-2">of zolpidem adverse-event reports are from women</p></div>
        </div>
      </ChartFrame>
    ), 'flow'),
    T('adjusted', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Reports per user, by sex.</p>
      <p>The comparison lacks a denominator: the number of women and men who take each drug. The federal Medical Expenditure Panel Survey asks a national sample of households about every prescription they fill, and records each person's sex.<Cite id="meps" /> We pooled seven years of it, 2018 to 2024, and counted the people who filled each of our drugs at least once.</p>
      <p>This converts the share of reports into an approximate rate. If women are 53% of a drug's users and 65% of its adverse-event reports, they are filing about 1.6 times as many reports per user as men. On the chart, 1× means women and men report at the same rate per user.</p>
      <p>The survey is a sample of about 30,000 people a year, so it captures only drugs with sufficient numbers of users. That leaves {s.n_with_rate} of our drugs with at least {30} surveyed users. Specialty biologics and cancer drugs mostly fall out, which is a limitation of the survey data rather than a finding.</p>
    </>),
    F('rate', <RateRatio drugs={withRate} title="Reports per user, women relative to men" subtitle={`${s.n_with_rate} drugs with enough surveyed users. Hover for the shares behind each ratio.`} source="Sources: openFDA FAERS reports by sex; MEPS Household Component prescribed-medicines and consolidated files 2018–2024, person-weighted. Reporting is voluntary; this is reports per user, not harm per user." />, 'flow', true),
    T('adjusted-2', <>
      <p>{s.n_rate_over_1_5} of the {s.n_with_rate} drugs exceed 1.5×: women file at least one and a half times as many reports per user as men. {s.n_rate_under_1 > 0 ? `${s.n_rate_under_1} show the reverse pattern.` : 'None show the reverse pattern.'} The median is {s.median_rate_ratio?.toFixed(1)}×.</p>
      <p>Zolpidem serves as a reference case. The survey puts women at {data.zolpidem_meps ? data.zolpidem_meps.female_pct.toFixed(0) : '63'}% of its users, almost exactly the FDA's 63% from 2011.<Cite id="fda-dsc-2013" /> Set against {zF.toFixed(0)}% of reports, women file {data.zolpidem_meps ? data.zolpidem_meps.rate_ratio.toFixed(1) : '1.0'}× as many reports per user as men. The drug whose dose was halved for women does not stand out on this chart; the sex difference was identified in blood concentrations and was not apparent in the reports.</p>
      <p>The confidence intervals are important. For a drug with forty surveyed users the share of women is known only to within ten points, and a ratio built on a 94% share is highly sensitive to that uncertainty. For drugs with few surveyed users, the interval is more informative than the point estimate.</p>
      <p>Even per user, a high ratio is not evidence of harm. Women report adverse events more readily than men across all drugs, and the survey does not record dose or duration. The ratio removes the largest confounder, the sex distribution of users. The residual signal warrants prospective study.</p>
    </>),
    T('close', <>
      <p>The gap should therefore be read as a screening indicator rather than a conclusion. It identifies drugs approved with limited evidence in women for which the post-market signal is weighted toward women, and these are the drugs for which further investigation is warranted.</p>
      <p>Every number on this page is reproducible from public FDA data with the code in our repository. The <Link to="/methods">methods page</Link> explains each step, including the choices we made and what would change them.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Implications.</p>
      <p>Drugs approved since 2015 can be looked up in the tool below, which shows the share of women in the pivotal trials and the sex distribution of post-market reports. Any other drug can be checked live against the FDA's adverse-event reports.</p>
    </>),
    F('lookup', <DrugLookup drugs={data.drugs} minReports={MIN_REPORTS} />, 'flow'),
    T('for-you-2', <>
      <p>A low share of women in the trial does not indicate that a drug is unsafe for women. It indicates that the evidence base in women is smaller, which may warrant discussion with a prescriber. Three points are most informative:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li><span className="font-semibold">Whether the dose was studied in women.</span> In the case of zolpidem, the issue was the dose rather than the drug itself. Some labels now carry sex-specific dosing; many drugs clear differently in women and men without it being on the label.</li>
        <li><span className="font-semibold">Whether the trial reported results by sex.</span> Every FDA snapshot has a section headed "Were there any differences in how well the drug worked" and another for side effects. A statement that differences could not be determined is itself informative.</li>
        <li><span className="font-semibold">Whether a lower dose exists.</span> The FDA's own advice after Ambien, for insomnia drugs, was that patients should take the lowest dose capable of treating them.<Cite id="fda-dsc-2013" /></li>
      </ul>
      <p>Adverse events should be reported. FAERS depends on reports filed by patients and clinicians through the FDA's <a href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program" target="_blank" rel="noreferrer">MedWatch</a> programme, and the share of those reports that come from women is one of the few available post-market signals.<Cite id="openfda-faers" /> Every chart on this page was built from such reports.</p>
      <p>This analysis is not medical advice. The figures are intended to inform discussion with a clinician rather than to support a conclusion.</p>
    </>),
  ]

  return (
    <article>
      <header className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">{chapterRef('tested-on-men')}</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">Women in drug trials against women in adverse-event reports</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">Every new drug the FDA has approved since 2015, compared on the sex distribution of trial participants against the sex distribution of adverse-event reports.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">data through {data.faers_last_updated ?? data.generated} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <NextChapter slug='tested-on-men' />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['fda-dsc-2013', 'fda-qa-2013', 'fda-snapshots', 'fda-snapshots-archive', 'openfda-faers', 'meps', 'carmeli-2023']} />
      </section>
    </article>
  )
}
