import SourceList from '../components/SourceList'

const H = ({ children }: { children: string }) => <h2 className="display text-3xl font-medium mt-14 mb-4 pt-8 border-t border-hairline/70">{children}</h2>
const P = ({ children }: { children: React.ReactNode }) => <p className="text-[17px] text-ink leading-[1.75] mt-3">{children}</p>

export default function Methods() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 prose-step fade-up">
      <header className="text-center pb-6">
        <p className="eyebrow">Methods</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">How every number <span className="italic font-medium text-berry">was made</span>.</h1>
      </header>
      <P>Every chart on this site is generated from a public dataset by a script in our repository. This page explains what each chapter measures, how, and where it can mislead. If you find an error, open an issue; we will correct the page and note the change here.</P>

      <H>Chapter 1: Tested on men, prescribed to women</H>
      <h3 className="eyebrow mt-8">Trial enrollment by sex</h3>
      <P>The FDA publishes a Drug Trials Snapshot for each new molecular entity and original biologic it approves, beginning with 2015 approvals. We collected every snapshot page linked from the FDA's live index and from the Internet Archive's January 2023 capture of the index, which still lists the 2015–2022 pages the FDA has since removed from the live site. Each page states the number of male and female participants in the efficacy population, either in a sentence ("N (x%) male patients and N (y%) female patients") or in one or more baseline-demographics tables. Our parser reads the sentence where present; otherwise it reads the Female and Male rows of each baseline-demographics table, using the Total column where there is one and summing the arms where there is not. When the same trial is reported for two populations (safety and efficacy) the larger is used; distinct trials are summed. We publish only the female share; the participant count behind it is kept in the data file but can double-count overlapping populations on a few pages, so it is not shown on the charts. Where an archived page could not be retrieved from the Internet Archive or could not be parsed, we fall back to the figure in the independently compiled dataset of Carmeli and colleagues (2023), and flag that drug's enrollment source in the published data file. For the drugs both cover, we cross-checked our own parsed figures against theirs; the comparison is printed by the pipeline's check script.</P>
      <h3 className="eyebrow mt-8">Adverse-event reports by sex</h3>
      <P>We query the openFDA drug adverse event endpoint, which serves the FDA Adverse Event Reporting System (FAERS), for each drug by brand name, counting reports by patient sex. Reports with unknown sex are excluded from the denominator. Drugs with fewer than 100 sex-recorded reports are excluded from the scatter and the table because small counts make the share unstable. The query, counts, and retrieval date for every drug are stored in the repository.</P>
      <h3 className="eyebrow mt-8">The gap</h3>
      <P>For each drug we compute the female share of adverse-event reports minus the female share of pivotal-trial participants, in percentage points. We call a drug part of the "Ambien corner" when its trial was less than half women and the gap is 15 points or more. Both thresholds are choices; the chart's legend states them and the pipeline exposes them as parameters, so a reader who prefers 10 or 20 points can rerun it.</P>
      <h3 className="eyebrow mt-8">What the gap is not</h3>
      <P>It is not a harm rate. FAERS is a voluntary reporting system with no denominator: a drug taken mostly by women will generate mostly female reports whatever its safety profile. Women also report adverse events at higher rates than men across drugs. Reports can be duplicated, and openFDA links reports to drugs by name matching, which misses some. The gap identifies drugs where the post-market signal is tilted toward women relative to the evidence collected before approval. It is a prioritisation tool, not a finding of harm.</P>
      <h3 className="eyebrow mt-8">Reports per user</h3>
      <P>To adjust report shares for who takes each drug we use the Medical Expenditure Panel Survey (MEPS) Household Component, the federal survey of a national sample of households that records every prescription fill and the person's sex. We pool the Prescribed Medicines files for 2018 to 2024, join each fill to the person's sex in that year's Full Year Consolidated file, and count the persons with at least one fill of each drug, weighted with the person weight. Fills are matched to our drugs by the reported name, the same way the FAERS query was made: by brand name, or by generic name when every fill of that molecule in the survey is recorded under that brand or the generic name itself. A share is published only for drugs with at least 30 unweighted person-years of users.</P>
      <P>The ratio shown is the female-to-male ratio of adverse-event reports divided by the female-to-male ratio of users. It is reports per user, women relative to men. The 95% interval around each ratio comes from the binomial sampling error of the survey's share of users who are women, using the unweighted person-year count; the FAERS counts are large enough that their sampling error is ignored. It removes the largest confounder of the raw report share, but it is still built on voluntary reports and still cannot see dose, duration or severity. The survey is small for specialty drugs, so most biologics and cancer drugs have no ratio; that is a coverage limit, not evidence of anything.</P>
      <h3 className="eyebrow mt-8">Zolpidem figures</h3>
      <P>Dose changes, pharmacokinetic percentages and the 63% usage share come from the FDA's January 2013 Drug Safety Communication and its accompanying questions-and-answers page. Zolpidem's FAERS counts come from openFDA using the generic name.</P>
      <h3 className="eyebrow mt-8">Therapeutic area</h3>
      <P>The snapshots do not state a therapeutic area. We assign one with keyword rules applied to the FDA's own one-sentence description of what the drug is for. The rules are in the pipeline and the assignment is shown in every tooltip, so misclassifications are visible rather than hidden.</P>

      <H>Reproducing the analysis</H>
      <P>Clone the repository, create a Python environment from <code>pipeline/requirements.txt</code>, and run the three scripts in order: fetch snapshots, fetch FAERS counts, build the chapter. All HTTP responses are cached, so a rerun is fast and offline. The site reads the resulting JSON files from <code>site/public/data</code>.</P>

      <H>Sources</H>
      <SourceList />
    </div>
  )
}
