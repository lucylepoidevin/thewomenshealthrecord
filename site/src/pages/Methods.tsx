import SourceList from '../components/SourceList'
import { useEffect, useState } from 'react'

const H = ({ children }: { children: string }) => <h2 className="display text-3xl font-medium mt-14 mb-4 pt-8 border-t border-hairline/70">{children}</h2>
const P = ({ children }: { children: React.ReactNode }) => <p className="text-[17px] text-ink leading-[1.75] mt-3">{children}</p>

type Variant = { label: string; n: number; n_female: number; n_male: number; median_ratio: Record<string, number | null>; share_underfunded: Record<string, number | null>; female_shortfall_m: number; migraine_ratio: number | null }
function Sensitivity() {
  const [rows, setRows] = useState<Variant[]>([])
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter3_sensitivity.json`).then(r => r.json()).then(setRows) }, [])
  if (!rows.length) return null
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Variant</th><th className="py-2 pr-3 text-right font-bold">Diseases</th><th className="py-2 pr-3 text-right font-bold">Median ratio, women / men</th><th className="py-2 pr-3 text-right font-bold">Below line, women / men</th><th className="py-2 pr-3 text-right font-bold">Shortfall</th><th className="py-2 text-right font-bold">Migraine</th></tr></thead>
        <tbody>{rows.map(v => (
          <tr key={v.label} className="border-t border-hairline/60"><td className="py-2 pr-3 text-ink">{v.label}</td><td className="py-2 pr-3 text-right tabular-nums">{v.n}</td><td className="py-2 pr-3 text-right tabular-nums">{v.median_ratio.female?.toFixed(2)} / {v.median_ratio.male?.toFixed(2)}</td><td className="py-2 pr-3 text-right tabular-nums">{v.share_underfunded.female}% / {v.share_underfunded.male}%</td><td className="py-2 pr-3 text-right tabular-nums">${v.female_shortfall_m}M</td><td className="py-2 text-right tabular-nums">{v.migraine_ratio?.toFixed(2)}×</td></tr>
        ))}</tbody>
      </table>
    </div>
  )
}

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

      <H>Chapter 2: The urgency gap</H>
      <P>Data are the National Hospital Ambulatory Medical Care Survey (NHAMCS) emergency department public-use files for 2018 through 2022, from the National Center for Health Statistics. Each record is a sampled visit with the patient's sex and age, up to five reasons for visit, the triage pain score, waiting time to first contact with a physician, nurse practitioner or physician assistant, up to thirty medications with their therapeutic classes and whether each was given in the department or prescribed at discharge, triage level, arrival by ambulance, tests ordered, and disposition. We pooled the five years and kept visits by adults aged 18 and over.</P>
      <h3 className="eyebrow mt-8">Definitions</h3>
      <P>Pain complaints are defined by the first-listed reason for visit: abdominal pain (codes 1545.0–1545.3), chest pain (1050.0–1050.3), back pain (1905.0, 1905.1, 1910.0, 1910.1), headache or migraine (1210.0, 2365.0), neck, hip, leg or joint pain (1900.1, 1915.1, 1920.1, 1925.1, 1930.1, 1935.1) and flank, rib or groin pain (1055.0–1055.3). An opioid is any medication whose therapeutic class is narcotic analgesics (Multum 060) or narcotic analgesic combinations (191); any analgesic is Multum 058 through 063 or 191. "Given in the ED" uses the survey's given-or-prescribed item. Severe pain is a reported score of 7 to 10. Urgent triage is emergency severity index 1 or 2, and immediate is level 1. A heart attack visit is any visit with ICD-10 code I21 or I22 in any of the five diagnosis fields; its chief complaint is the first-listed reason for visit. Cardiac enzymes, D-dimer, EKG, imaging and CT are the survey's own test checkboxes. Arrival mode is the survey's arrival-by-ambulance item (walk-in means any other arrival). The explorer's age bands are 18–44, 45–64 and 65 and over; its cells with fewer than a few hundred sampled visits carry wide intervals, which are shown. Sex is the survey's SEX item, coded 1 for female and 2 for male; our first build of this chapter read it the other way round and was withdrawn the same day, and every figure here is from the corrected run.</P>
      <h3 className="eyebrow mt-8">Estimation</h3>
      <P>All shares and means are weighted with the visit weight and their standard errors come from Taylor linearization over the survey's masked strata and primary sampling units, following NCHS guidance for pooling years. Differences between women and men treat the two domains as independent. Age adjustment is direct standardization of each sex's rate to the pooled age distribution of that complaint in three bands (18–44, 45–64, 65+). Wait time excludes visits where it was not recorded; the pain-score analysis uses only the three-fifths of visits with a recorded score. We report means for wait time because the survey design does not give a clean standard error for the median; medians are in the data file.</P>
      <h3 className="eyebrow mt-8">Adjusted models</h3>
      <P>For each gap we fit a logistic regression of the outcome on patient sex with age band (18–44, 45–64, 65+), complaint group, survey year and, where stated, the reported pain score, arrival by ambulance and whether the chief complaint was chest pain. Visits are weighted by the visit weight normalised to a mean of one, and standard errors are clustered on stratum by primary sampling unit, which approximates the survey design. Odds ratios are for women relative to men. The full specifications and results are in the chapter's models file.</P>
      <h3 className="eyebrow mt-8">What it cannot see</h3>
      <P>The survey records what was documented, not dose, time from order to administration, or the clinician's reasoning. Sex is recorded as male or female. The 2008 comparison study measured time to analgesia in one department; the survey measures time to a clinician nationally, so the two are compared in direction, not in minutes.</P>

      <H>Chapter 3: The research dollar</H>
      <P>Funding is NIH's Estimates of Funding for Various Research, Condition, and Disease Categories (RCDC), pulled from the report.nih.gov API, in millions of dollars by fiscal year. Burden is the WHO Global Health Estimates: disability-adjusted life years (DALYs) by cause and sex for the United States, from the all-ages sheet of the country files for 2010, 2015, 2019, 2021 and 2023, with years lived with disability from the matching YLD file. The main analysis uses FY2024 funding against 2021 burden, the latest pairing available when the chapter was built.</P>
      <h3 className="eyebrow mt-8">Matching</h3>
      <P>Each NIH category was matched by hand to one or more WHO causes with the same definition. Most matches are one to one. Documented exceptions: hepatitis B and C include the cirrhosis and liver cancer WHO attributes to each virus; lymphoma pairs with Hodgkin plus non-Hodgkin; back and neck pain sums two NIH categories; five gynaecological NIH categories (endometriosis, fibroids, PCOS, vulvodynia, pelvic inflammatory disease) are summed against WHO's single gynaecological-diseases cause; vision loss sums five WHO causes. Diseases with fewer than 15,000 US DALYs are excluded because a dollars-per-DALY figure is unstable for them. Every match is listed in the chapter's data file.</P>
      <h3 className="eyebrow mt-8">Expected funding</h3>
      <P>Following the 2021 study, we fit a power law of funding on burden across all matched diseases (log funding = a + b log DALYs, ordinary least squares) and call the fitted value "expected" funding for that burden. A disease's ratio to expected is its actual funding divided by that. A disease is "mostly women" when at least 60% of its DALYs fall on women, "mostly men" at 60% or more on men. The shortfall is the sum, over mostly-women diseases below the line, of expected minus actual funding. The trend repeats the fit for each burden year with that fiscal year's funding.</P>
      <h3 className="eyebrow mt-8">Sensitivity</h3>
      <P>The table shows how the headline numbers move under other reasonable choices. The aggregate medians are fragile: dropping the two globally funded diseases, or moving the threshold, changes which sex's median sits higher. The disease-level findings are not: migraine's ratio stays between 0.14 and 0.16 in every variant, and the share of mostly-women diseases below the line stays at half or more.</P>
      <Sensitivity />
      <h3 className="eyebrow mt-8">What it cannot see</h3>
      <P>NIH categories overlap, so dollars are not additive across diseases, and some categories are broader than the WHO cause they are matched to. NIH funds some diseases for their global burden, which the US DALY figure does not capture; HIV and tuberculosis are the clearest cases and are shown rather than dropped. Conditions with no WHO cause cannot be placed on the chart; the chapter lists them separately with their funding.</P>

      <H>Reproducing the analysis</H>
      <P>Clone the repository, create a Python environment from <code>pipeline/requirements.txt</code>, and run the scripts in order: fetch snapshots, fetch FAERS counts, fetch MEPS users, build chapter 1; then build chapter 2 from the NHAMCS files and chapter 3 from the NIH and WHO files. All HTTP responses are cached, so a rerun is fast and offline. The site reads the resulting JSON files from <code>site/public/data</code>.</P>

      <H>Sources</H>
      <SourceList />
    </div>
  )
}
