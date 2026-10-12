import { Link } from 'react-router-dom'
import { useAudit } from '../lib/data'

export default function MammoAIMethods() {
  const { data } = useAudit()
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 8</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">Methods: mammography AI</h1>
      <ol className="mt-10 space-y-8">
        {[
          ['Devices', 'The FDA\'s AI-enabled medical devices list (CSV, retrieved 11 October 2026, 1,615 entries) was filtered to software whose intended use is on 2D mammograms or digital breast tomosynthesis: by product code (QDQ detection/diagnosis, QFM triage, LLZ and QIH density and image processing), by company and by device name, then checked by hand. Breast ultrasound (Koios, QVCAD), optoacoustic imaging, breast MRI, pathology and X-ray hardware were excluded. The two PMA approvals that predate the list, ImageChecker (1998) and Second Look (2002), were added. The list also carries dental and chest devices under the mammography CAD code MYN; those were excluded.'],
          ['Documents', 'For each authorisation the public decision document was downloaded from accessdata.fda.gov: the 510(k) summary, the De Novo decision summary (cdrh_docs/reviews) or the PMA summary of safety and effectiveness. Two clearances (cmAngio V1.0 and V1.6) were filed with a 510(k) statement rather than a summary, so their public file holds only the FDA letter and the indications for use. Text was extracted with pypdf; where tables lost their structure, the page images were read. The 1998 PMA is a scan with no text layer and was read from the page images.'],
          ['Coding', 'Each document was coded against one schema: modality, validation type (standalone, reader study, both, none described), test set size and unit, cancers, sites, countries, period, population (screening, enriched, diagnostic), whether age, race or ethnicity and breast density of the test patients are reported, manufacturers named, readers, what is said about training data, whether performance is reported by subgroup, and headline performance. Every value carries a verbatim quote from the document. "Reported" means categories or numbers are given; a sentence saying the population was "diverse" or "representative" does not count and is kept in the notes.'],
          ['Readers', 'The coding was done by Claude (Anthropic) in batches from the schema, each record written with its quotes, and spot-checked against the source text. Density breakdowns that were summed from a printed confusion matrix rather than stated as totals are flagged in the record. Where a document describes two studies, the pivotal test supporting the clearance is coded and the other is in the notes.'],
          ['Shares', 'Percentages on the page are of the documents that describe a test set (validation type other than "none described"); the number that do not is stated. The timeline shows one dot per authorisation from 2016 and counts the earlier ones in a note.'],
          ['Context', 'The FDA\'s January 2025 draft guidance on AI-enabled device software functions is quoted from its Federal Register notice. The page does not claim it caused the change in reporting; the dates are shown and readers can judge.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-5"><span className="display mt-0.5 w-8 shrink-0 text-2xl font-light text-berry tabular-nums">{i + 1}</span><div><h2 className="display text-2xl font-medium">{t}</h2><p className="mt-2 text-ink-2 leading-relaxed">{b}</p></div></li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">What to be careful about</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">Summaries are not submissions.</strong> The FDA sees far more than it publishes. Silence in a summary is silence in the public record, not proof the company did not look.</li>
        <li><strong className="text-ink">Versions count separately.</strong> A company that cleared five versions of one product appears five times; that is how the public record is structured, and each version is its own row in the table.</li>
        <li><strong className="text-ink">Units differ.</strong> Test sets are counted in exams, cases, images, women or patients as each document does; the unit is kept beside the number and the numbers are not pooled.</li>
        <li><strong className="text-ink">Coding is judgement.</strong> Especially for "describes a test" and for population type. Every record is published with its quotes so a reader can disagree with the code and see why.</li>
        <li><strong className="text-ink">Not a performance review.</strong> The page says nothing about whether these devices work, only what their public documents say about who they were tested on.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Run it</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd "mammography ai project/pipeline"
python3 fetch_summaries.py   # downloads every FDA document in devices.py and extracts its text
# code each data/raw/txt/<submission>.txt into data/coded/<submission>.json following data/coded/_SCHEMA.md
python3 build_audit.py       # aggregates the coded files into site/public/data/mammoai/audit.json`}</code></pre>
      {data && <p className="mt-6 text-sm text-ink-3">Table generated {data.generated}; device list retrieved {data.ai_list_retrieved}.</p>}
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/mammography-ai" className="text-berry underline underline-offset-2">the audit</Link>.</p>
    </div>
  )
}
