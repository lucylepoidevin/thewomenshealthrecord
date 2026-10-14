import { useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import ExperimentNav from '../../experiments/ExperimentNav'
import { jumpTo } from '../../cycling/lib/jump'
import Timeline from '../components/Timeline'
import DeviceTable from '../components/DeviceTable'
import Cite, { SourceList } from '../components/Cite'
import { fmtN, useAudit } from '../lib/data'

type Field = 'race_reported' | 'density_reported' | 'us_in_test' | 'subgroup_performance_reported'

export default function MammoAI() {
  const { data, error } = useAudit()
  const [field, setField] = useState<Field>('race_reported')
  const S = data?.sources ?? {}
  const s = data?.summary
  const described = data ? data.devices.filter(d => d.validation_type !== 'none described') : []
  const pct = (sel: (d: typeof described[number]) => boolean, pool = described) => Math.round(100 * pool.filter(sel).length / Math.max(1, pool.length))
  const since24 = described.filter(d => d.year >= 2024), before24 = described.filter(d => d.year < 2024)
  const biggest = data ? [...data.devices].filter(d => d.test_exams).sort((a, b) => b.test_exams! - a.test_exams!)[0] : null
  const blocks: Block[] = data && s ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Documents and coding</h2>
        <p>
          The FDA maintains a public list of every medical device it has authorised that uses artificial intelligence.<Cite id="ai_list" sources={S} /> From the version of {data.ai_list_retrieved},
          every entry whose intended use is the interpretation of 2D mammograms or tomosynthesis was retained: software that marks suspicious findings, software that prioritises worklists, software that grades breast density,
          one device that detects arterial calcification and one that predicts five-year risk. Breast ultrasound, MRI and pathology tools were excluded. Two mammography CAD approvals that predate
          the list, from 1998 and 2002, were added. The resulting set comprises {s.n} authorisations from {s.companies} companies.
        </p>
        <p>
          For each, the public document the FDA releases with the decision was read in full: a 510(k) summary, a De Novo decision summary or a PMA summary of safety and effectiveness.<Cite id="summaries" sources={S} /> Each
          was coded against a single schema: the nature of the test set, its size, the number of sites and the countries involved, the manufacturers of the imaging equipment, and whether the patients' age, race or
          ethnicity and breast density were reported, with a verbatim quotation supporting every value.<Cite id="schema" sources={S} /> {data.devices.length - described.length} documents describe no test, either because
          the company filed a statement instead of a summary, because the clearance refers back to an earlier one, or because it covers a software change with no new clinical data, so the shares below are of the {described.length} that describe a test, whether or not they state its size.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Reporting of test-patient demographics</h2>
        <p>
          Of the {described.length} summaries that describe a test, {pct(d => d.race_reported)} percent report the race or ethnicity of the patients in it, and{' '}
          {pct(d => d.density_reported)} percent report their breast density. Age is stated in {pct(d => d.age_reported)} percent. The country the images came from is named in{' '}
          {pct(d => d.test_countries.length > 0)} percent, and the United States in {pct(d => d.us_in_test)} percent.
        </p>
        <p>
          The change over time is the principal finding. Before 2024, {before24.filter(d => d.race_reported).length} of {before24.length} summaries reported race; from 2024 onward, {since24.filter(d => d.race_reported).length} of{' '}
          {since24.length} do. Density reporting rises from {before24.filter(d => d.density_reported).length} of {before24.length} to {since24.filter(d => d.density_reported).length} of {since24.length}. The devices' intended uses did not change in 2024; the content of the summaries did. In January 2025 the FDA published draft guidance for AI-enabled device submissions that asks companies for "evidence to evaluate whether a device
          benefits all relevant demographic groups (e.g., race, ethnicity, sex, and age) similarly", which postdates the onset of the change in the summaries.<Cite id="fr2025" sources={S} />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: (
      <div id="timeline-chart">
        <p className="eyebrow mb-1">Every authorisation since 2016</p>
        <h3 className="display text-xl font-medium mb-1">What each FDA summary reports about its test patients</h3>
        <div className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1">
          {([['race_reported', 'Race or ethnicity'], ['density_reported', 'Breast density'], ['us_in_test', 'US sites named'], ['subgroup_performance_reported', 'Performance by subgroup']] as [Field, string][]).map(([k, l]) => <button key={k} type="button" className={`tab ${field === k ? 'is-active' : ''}`} onClick={() => setField(k)}>{l}</button>)}
        </div>
        <Timeline devices={data.devices} field={field} />
      </div>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Test set sizes, vendors and countries</h2>
        <p>
          Where a test set size is stated, the median is {fmtN(s.median_size)} exams, cases or patients, with a range from a few hundred to {fmtN(biggest!.test_exams!)} ({biggest!.device}, {biggest!.company}).
          Reader studies, in which radiologists read with and without the software, are small: more than half use 240 cases, and they are cancer-enriched, with a proportion of cancers far above the
          few per thousand observed in screening.
        </p>
        <p>
          Hologic is named in {s.vendors['Hologic'] ?? 0} of the {s.n} documents, as the machines the test images came from or as the systems the software supports; GE in {s.vendors['GE'] ?? 0}, Siemens in{' '}
          {s.vendors['Siemens'] ?? 0}, Fujifilm in {s.vendors['Fujifilm'] ?? 0}, Philips in {s.vendors['Philips'] ?? 0}. {s.hologic_only} documents name Hologic alone. Among countries, the United States is named in{' '}
          {s.countries['United States'] ?? 0}, and {Object.keys(s.countries).length - 1} other countries appear at least once. {data.devices.filter(d => d.training_data_described).length} of the {s.n} documents give any information about
          the origin of the training data.
        </p>
        <p>
          Where race is reported, the categories are unevenly sized and often small, and "unknown" is common. The De Novo decision for the risk model is the exception: 77,511 screening exams from five
          named US sites, with race, ethnicity, age and density tabulated for both the exams and the cancers. It is the most complete report of the sixty.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">All {s.n} authorisations</p>
        <h3 className="display text-xl font-medium mb-1">All authorisations, with the quotes behind each value</h3>
        <p className="text-xs text-ink-3 mb-3">"Not stated" means the public document does not report the value. The test set is the pivotal test on which the clearance rests; where two studies are described, the larger standalone test is shown and the other is recorded in the notes.</p>
        <DeviceTable devices={data.devices} />
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Limitations</h2>
        <p>
          A 510(k) summary contains what the company chose to publish, within the FDA's requirements. It is not the full submission, and a summary that does not mention race does not establish that the
          company did not examine it. This page measures what the public record allows anyone to verify, which for most of these devices is: a few hundred to a few thousand images, mostly
          from Hologic systems, mostly undated, with the country usually unstated before 2020 and the patients' race unstated before 2024.
        </p>
        <p>
          The coding is published with every quotation so that it can be checked line by line. {s.text_quality['partly garbled'] ?? 0} documents lost table structure in text extraction and were read from the
          page images; {(s.text_quality['tables lost'] ?? 0)} had numbers that could not be recovered. Details are given on the <Link to="/mammography-ai/methods">methods page</Link>; the full table with quotations
          is on the <Link to="/mammography-ai/data">data page</Link>.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList sources={S} /></>) },
  ] : []
  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 8</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">Who the FDA's mammography AI was tested on</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          Every FDA-authorised AI that reads mammograms, and what its public summary reports about the test patients: their number, their origin, the imaging systems named, and whether their age, race and
          breast density were reported.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#timeline" onClick={jumpTo('timeline')} className="btn btn-solid">See the record</a>
          <Link to="/mammography-ai/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading…</p>}
      {data && s && (
        <section id="timeline" className="mx-auto max-w-5xl px-4">
          <p className="rule pt-4 text-[15px] text-ink-2">{s.n} authorisations were reviewed. Of the {described.length} that describe a test, {pct(d => d.race_reported)} percent report the race or ethnicity of the test patients and {pct(d => d.density_reported)} percent report their breast density. {s.vendors['Hologic'] ?? 0} name Hologic.</p>
        </section>
      )}
      <div className="mt-12"><Story blocks={blocks} /></div>
      <ExperimentNav current="/mammography-ai" />
    </div>
  )
}
