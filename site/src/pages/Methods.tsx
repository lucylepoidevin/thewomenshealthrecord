import SourceList from '../components/SourceList'

const H = ({ children }: { children: string }) => <h2 className="display text-2xl font-medium mt-10 mb-3">{children}</h2>
const P = ({ children }: { children: React.ReactNode }) => <p className="text-ink-2 leading-relaxed mt-3">{children}</p>

export default function Methods() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-step">
      <h1 className="display text-4xl font-medium">Methods</h1>
      <P>Every chart on this site is generated from a public dataset by a script in our repository. This page explains what each chapter measures, how, and where it can mislead. If you find an error, open an issue; we will correct the page and note the change here.</P>

      <H>Chapter 1: Tested on men, prescribed to women</H>
      <h3 className="font-semibold mt-6">Trial enrollment by sex</h3>
      <P>The FDA publishes a Drug Trials Snapshot for each new molecular entity and original biologic it approves, beginning with 2015 approvals. We collected every snapshot page linked from the FDA's live index and from the Internet Archive's January 2023 capture of the index, which still lists the 2015–2022 pages the FDA has since removed from the live site. Each page states the number of male and female participants in the efficacy population, either in a sentence ("N (x%) male patients and N (y%) female patients") or in one or more baseline-demographics tables. Our parser reads the sentence where present; otherwise it sums the Female and Male totals across the demographics tables. Where an archived page could not be retrieved from the Internet Archive or could not be parsed, we fall back to the figure in the independently compiled dataset of Carmeli and colleagues (2023), and flag that drug's enrollment source in the published data file. For the drugs both cover, we cross-checked our own parsed figures against theirs; the comparison is printed by the pipeline's check script.</P>
      <h3 className="font-semibold mt-6">Adverse-event reports by sex</h3>
      <P>We query the openFDA drug adverse event endpoint, which serves the FDA Adverse Event Reporting System (FAERS), for each drug by brand name, counting reports by patient sex. Reports with unknown sex are excluded from the denominator. Drugs with fewer than 100 sex-recorded reports are excluded from the scatter and the table because small counts make the share unstable. The query, counts, and retrieval date for every drug are stored in the repository.</P>
      <h3 className="font-semibold mt-6">The gap</h3>
      <P>For each drug we compute the female share of adverse-event reports minus the female share of pivotal-trial participants, in percentage points. We call a drug part of the "Ambien corner" when its trial was less than half women and the gap is 15 points or more. Both thresholds are choices; the chart's legend states them and the pipeline exposes them as parameters, so a reader who prefers 10 or 20 points can rerun it.</P>
      <h3 className="font-semibold mt-6">What the gap is not</h3>
      <P>It is not a harm rate. FAERS is a voluntary reporting system with no denominator: a drug taken mostly by women will generate mostly female reports whatever its safety profile. Women also report adverse events at higher rates than men across drugs. Reports can be duplicated, and openFDA links reports to drugs by name matching, which misses some. The gap identifies drugs where the post-market signal is tilted toward women relative to the evidence collected before approval. It is a prioritisation tool, not a finding of harm.</P>
      <h3 className="font-semibold mt-6">Planned improvement</h3>
      <P>The right denominator is prescription share by sex. The Medical Expenditure Panel Survey publishes prescription microdata with sex; joining it would turn report shares into reporting rates per user. That is scheduled for a later revision of this chapter.</P>
      <h3 className="font-semibold mt-6">Zolpidem figures</h3>
      <P>Dose changes, pharmacokinetic percentages and the 63% usage share come from the FDA's January 2013 Drug Safety Communication and its accompanying questions-and-answers page. Zolpidem's FAERS counts come from openFDA using the generic name.</P>
      <h3 className="font-semibold mt-6">Therapeutic area</h3>
      <P>The snapshots do not state a therapeutic area. We assign one with keyword rules applied to the FDA's own one-sentence description of what the drug is for. The rules are in the pipeline and the assignment is shown in every tooltip, so misclassifications are visible rather than hidden.</P>

      <H>Reproducing the analysis</H>
      <P>Clone the repository, create a Python environment from <code>pipeline/requirements.txt</code>, and run the three scripts in order: fetch snapshots, fetch FAERS counts, build the chapter. All HTTP responses are cached, so a rerun is fast and offline. The site reads the resulting JSON files from <code>site/public/data</code>.</P>

      <H>Sources</H>
      <SourceList />
    </div>
  )
}
