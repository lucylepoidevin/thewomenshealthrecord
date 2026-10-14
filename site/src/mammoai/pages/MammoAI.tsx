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
        <h2 className="display text-3xl font-medium mb-4">What was read</h2>
        <p>
          The FDA keeps a public list of every medical device it has authorised that uses artificial intelligence.<Cite id="ai_list" sources={S} /> From the version of {data.ai_list_retrieved},
          every entry whose job is to read 2D mammograms or tomosynthesis was kept: software that marks suspicious findings, software that sorts worklists, software that grades breast density,
          one that finds arterial calcification and one that predicts five-year risk. Breast ultrasound, MRI and pathology tools were left out. Two mammography CAD approvals from before
          the list begins, in 1998 and 2002, were added. That is {s.n} authorisations from {s.companies} companies.
        </p>
        <p>
          For each, the public document the FDA releases with the decision was read in full: a 510(k) summary, a De Novo decision summary or a PMA summary of safety and effectiveness.<Cite id="summaries" sources={S} /> Each
          was coded against one schema: what the test set was, how big, from how many sites in which countries, on which manufacturers' machines, and whether the patients' age, race or
          ethnicity and breast density were reported, with a verbatim quote behind every value.<Cite id="schema" sources={S} /> {data.devices.length - described.length} documents describe no test at all, either because
          the company filed a statement instead of a summary, because the clearance refers back to an earlier one, or because it covers a software change with no new clinical data, so the shares below are of the {described.length} that describe a test, whether or not they give its size.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Who the test patients were</h2>
        <p>
          Of the {described.length} summaries that describe a test, {pct(d => d.race_reported)} percent say anything about the race or ethnicity of the patients in it, and{' '}
          {pct(d => d.density_reported)} percent give their breast density. Age is stated in {pct(d => d.age_reported)} percent. The country the images came from is named in{' '}
          {pct(d => d.test_countries.length > 0)} percent, and the United States in {pct(d => d.us_in_test)} percent.
        </p>
        <p>
          The change over time is the main finding. Before 2024, {before24.filter(d => d.race_reported).length} of {before24.length} summaries reported race; from 2024 on, {since24.filter(d => d.race_reported).length} of{' '}
          {since24.length} do. Density goes from {before24.filter(d => d.density_reported).length} of {before24.length} to {since24.filter(d => d.density_reported).length} of {since24.length}. The devices did not change in 2024; the documents did. In January 2025 the FDA published draft guidance for AI-enabled device submissions that asks companies for "evidence to evaluate whether a device
          benefits all relevant demographic groups (e.g., race, ethnicity, sex, and age) similarly", which came after the change in the summaries had begun.<Cite id="fr2025" sources={S} />
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
        <h2 className="display text-3xl font-medium mb-4">How big, and on whose machines</h2>
        <p>
          Where a test set size is given, the median is {fmtN(s.median_size)} exams, cases or patients, with a range from a few hundred to {fmtN(biggest!.test_exams!)} ({biggest!.device}, {biggest!.company}).
          Reader studies, in which radiologists read with and without the software, are small: more than half use 240 cases, and they are cancer-enriched: the share of cancers in them is far above the
          handful per thousand in screening.
        </p>
        <p>
          Hologic is named in {s.vendors['Hologic'] ?? 0} of the {s.n} documents, as the machines the test images came from or as the systems the software supports; GE in {s.vendors['GE'] ?? 0}, Siemens in{' '}
          {s.vendors['Siemens'] ?? 0}, Fujifilm in {s.vendors['Fujifilm'] ?? 0}, Philips in {s.vendors['Philips'] ?? 0}. {s.hologic_only} documents name Hologic alone. Among countries, the United States is named in{' '}
          {s.countries['United States'] ?? 0}, and {Object.keys(s.countries).length - 1} other countries appear at least once. {data.devices.filter(d => d.training_data_described).length} of the {s.n} documents say anything about
          where the training data came from.
        </p>
        <p>
          When race is reported, the categories are uneven and often small, and "unknown" is common. The De Novo decision for the risk model is the exception: 77,511 screening exams from five
          named US sites, with race, ethnicity, age and density tabulated for both the exams and the cancers. It is the most complete of the sixty.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">All {s.n} authorisations</p>
        <h3 className="display text-xl font-medium mb-1">Click a row for the quotes behind it</h3>
        <p className="text-xs text-ink-3 mb-3">"Not stated" means the public document does not say. Test set is the pivotal test the clearance rests on; where two studies are described the larger standalone test is shown and the other is in the notes.</p>
        <DeviceTable devices={data.devices} />
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What this can and cannot say</h2>
        <p>
          A 510(k) summary is what the company chose to publish, within what the FDA requires. It is not the full submission, and a summary that is silent about race does not mean the
          company never looked. What this page measures is what the public record lets anyone check, which for most of these devices is: a few hundred to a few thousand images, mostly
          Hologic, mostly undated, country usually unstated before 2020, patients' race unstated before 2024.
        </p>
        <p>
          The coding is published with every quote so it can be disputed line by line. {s.text_quality['partly garbled'] ?? 0} documents lost table structure in text extraction and were read from the
          page images; {(s.text_quality['tables lost'] ?? 0)} had numbers that could not be recovered. Details on the <Link to="/mammography-ai/methods">methods page</Link>; the full table with quotes
          on the <Link to="/mammography-ai/data">data page</Link>.
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
          Every FDA-authorised AI that reads mammograms, and what its public summary says about the test patients: how many, from where, on which machines, and whether their age, race and
          breast density were reported at all.
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
          <p className="rule pt-4 text-[15px] text-ink-2">{s.n} authorisations read. Of the {described.length} that describe a test, {pct(d => d.race_reported)} percent report the race or ethnicity of the test patients and {pct(d => d.density_reported)} percent their breast density. {s.vendors['Hologic'] ?? 0} name Hologic.</p>
        </section>
      )}
      <div className="mt-12"><Story blocks={blocks} /></div>
      <ExperimentNav current="/mammography-ai" />
    </div>
  )
}
