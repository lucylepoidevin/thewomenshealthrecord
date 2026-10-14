import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import Viewer from '../components/Viewer'
import Cite, { SourceList } from '../components/Cite'
import { FindingsProse, FindingsTable } from '../components/Findings'
import { usePregnancy, fmt, type Pregnancy } from '../lib/data'
import { jumpTo } from '../../cycling/lib/jump'
import ExperimentNav from '../../experiments/ExperimentNav'

function KeyNumbers({ data }: { data: Pregnancy }) {
  const ss = data.sessions
  const e2 = ss.filter(s => s.hormones.estradiol != null)
  const p4 = ss.filter(s => s.hormones.progesterone != null)
  const maxE = e2.reduce((a, b) => (b.hormones.estradiol! > a.hormones.estradiol! ? b : a))
  const maxP = p4.reduce((a, b) => (b.hormones.progesterone! > a.hormones.progesterone! ? b : a))
  const preE = ss.find(s => s.session === 2)?.hormones.estradiol ?? 0
  const gm = data.stats.total_brain
  const items = [
    { label: 'Estradiol', value: `${fmt.n(preE)} → ${fmt.n(maxE.hormones.estradiol!)} pg/mL`, note: `${Math.round(maxE.hormones.estradiol! / preE).toLocaleString()}-fold, peak at week ${maxE.week}. Experiment 1's whole range was 22 to 264.` },
    { label: 'Progesterone', value: `${fmt.n(ss.find(s => s.session === 2)?.hormones.progesterone ?? 0)} → ${fmt.n(maxP.hormones.progesterone!)} ng/mL`, note: `peak at week ${maxP.week}. Experiment 1's peak was 15.5.` },
    { label: 'Whole brain, third trimester', value: gm ? fmt.pct(gm.third_trimester_pct ?? 0) : '–', note: gm ? `lowest ${fmt.pct(gm.min_pregnancy?.pct ?? 0)} at week ${gm.min_pregnancy?.week}; ${fmt.pct(gm.two_years_pct ?? 0)} two years after birth. Measured against the four scans before conception.` : '' },
    { label: 'Scans', value: '27 scans, 2 years 8 months', note: '0.8 mm T1-weighted MRI on two Siemens Prisma scanners, Santa Barbara then Irvine' },
  ]
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map(it => (
        <div key={it.label} className="rule pt-4">
          <p className="eyebrow">{it.label}</p>
          <p className="display mt-2 text-2xl sm:text-3xl font-medium text-berry leading-tight">{it.value}</p>
          <p className="mt-1 text-sm text-ink-2">{it.note}</p>
        </div>
      ))}
    </div>
  )
}

export default function PregnantBrain() {
  const { data, error } = usePregnancy()
  const blocks: Block[] = data ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The data</h2>
        <p>
          In the summer of 2019 a 38-year-old neuroscientist, one of the study's own authors, was scanned three weeks before attempting to conceive. She was scanned
          twenty-six more times: through an IVF conception, at intervals of a few weeks during the pregnancy, and then across the two years and eight months after the birth.
          Blood was drawn at most visits. The study is the Maternal Brain Project pilot, from Emily Jacobs's lab at UC Santa Barbara and Elizabeth Chrastil's at UC Irvine,
          and the scans are public.<Cite id="pritschet2024" /><Cite id="openneuro" />
        </p>
        <p>
          No previous study had imaged one brain through an entire pregnancy. Earlier work compared groups of women before and after pregnancy; this was the first study to follow
          the transition itself, scan by scan, in one individual.
        </p>
        <p>
          The viewer above shows her brain at each visit, with her serum hormone levels plotted beneath. The slider moves from before conception to two years after the birth. Select a structure
          to highlight its location in pink; the chart under the hormones shows its measured volume at that visit relative to its pre-pregnancy size.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Hormone levels across pregnancy</h2>
        <p>
          For comparison with <Link to="/cycling-brain">Experiment 1, the menstrual cycle</Link>: across a menstrual cycle, estradiol varied between about 20 and
          260 pg/mL, and progesterone between near-undetectable levels and 15 ng/mL. Those are the largest hormonal fluctuations produced outside pregnancy.<Cite id="cycling" />
        </p>
        <p>
          Pregnancy produces far larger changes. Here, estradiol rose above 4,000 pg/mL by the second trimester and above 12,000 by week 36. Progesterone, produced first
          by the corpus luteum and then by the placenta, rose to 50 ng/mL by mid-pregnancy and over 100 near term. Both fall sharply within days of birth: at the first visit after it, week 43, estradiol was 9 pg/mL and progesterone 0.12.<Cite id="openneuro" />
        </p>
        <p>
          Receptors for both hormones are widely distributed in the brain. Pregnancy sustains exposure for nine months at many times the concentrations seen across a cycle: estradiol at nearly fifty times the cycle's peak, progesterone at seven times.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: <KeyNumbers data={data} /> },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Brain volumes across the cycle</h2>
        <p>
          We ran all 27 scans through the same pipeline as Experiment 1: alignment to a standard template, a published model that splits the brain into 133 structures,<Cite id="unest" />
          and volumes counted in the scan's own space. Every structure was then compared with its size before conception. The method is on the <Link to="/pregnancy-brain/methods">methods page</Link>;
          these are our measurements, not the original lab's.
        </p>
        <FindingsProse data={data} />
        <p>
          In Experiment 1, no change exceeded the measurement noise. Here, one does: whole-brain volume decreased through pregnancy by an amount the scanner change
          cannot account for, reached its minimum in the third trimester or shortly after the birth, and recovered over the following two years. Finer questions, which tissue and which region,
          lie beyond the resolution of our method and within that of the published paper.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: <FindingsTable data={data} /> },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Published findings from the same dataset</h2>
        <p>
          The lab's own analysis, with a different segmentation and with cortical thickness and diffusion imaging we did not use, reported pronounced decreases in grey-matter volume
          and cortical thickness across the brain, about 4% in roughly 80% of the regions measured, in step with the rising hormones, alongside increases in ventricle volume and
          cerebrospinal fluid. White matter showed the opposite pattern: its microstructural integrity rose by about a tenth, peaking around the end of the second trimester, and fell back
          after the birth. Few regions were unaffected, and much of the grey-matter reduction was still present two years later.<Cite id="pritschet2024" />
        </p>
        <p>
          This is consistent with the only earlier evidence, a 2017 study that scanned women before and after a first pregnancy and found grey-matter reductions in regions associated with
          social cognition, lasting at least two years, large enough that a classifier could identify who had been pregnant from the scans alone.<Cite id="hoekzema2017" />
        </p>
        <p>
          "Reduction" describes the measurement, not its functional interpretation. Grey-matter volume also decreases during adolescence, where it is understood as pruning rather than loss. The leading
          interpretation is that pregnancy refines neural circuits in a manner analogous to puberty: a second period of organised change in the adult brain, driven by the same hormones.
        </p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Limitations</h2>
        <p><strong>This is one woman.</strong> One pregnancy, one brain, one set of scanners. It shows what <em>can</em> occur, not what will occur in other women.</p>
        <p>
          <strong>The scanner changed at week 9.</strong> The four baseline scans and the first two pregnancy scans were in Santa Barbara; everything from week 9 on was in Irvine, until
          the last visit was repeated on both machines a day apart. That repeat is shown as a bracket on every chart, and the comparison can be re-based to week 9. The pregnancy
          pattern holds under either reference, but any single number carries that caveat.
        </p>
        <p>
          <strong>Our method differs from the paper's.</strong> A whole-brain model on a 1 mm template is coarser than the surface-based tools the paper used. Where the two disagree, the published paper should take precedence.
          Nothing here is medical advice.
        </p>
        <p>
          <strong>Context:</strong> well over a hundred million women give birth each year, and until 2024 none of their brains had been imaged through the whole course of a pregnancy. This dataset
          is the first such record, obtained from a scientist who volunteered as her own participant across twenty-seven sessions.
        </p>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Method</h2>
        <p>
          The 27 T1-weighted scans were downloaded from OpenNeuro (ds005299, CC0).<Cite id="openneuro" /> Each was bias-corrected and affine-aligned to the MNI305 template with
          ANTs,<Cite id="ants" /><Cite id="mni305" /> segmented into 133 structures with the MONAI model-zoo bundle <em>wholeBrainSeg_Large_UNEST_segmentation</em>,<Cite id="unest" /> and
          measured after mapping each label map back into the scan's own space. Hormones, gestation week and scanner site are taken directly from the dataset's participants table.
          The viewer is NiiVue.<Cite id="niivue" /> Details, code and downloads are on the <Link to="/pregnancy-brain/methods">methods</Link> and <Link to="/pregnancy-brain/data">data</Link> pages.
        </p>
        <p>
          We thank Laura Pritschet, Elizabeth Chrastil, Emily Jacobs and the Ann S. Bowers Women's Brain Health Initiative for releasing the data openly.<Cite id="wbhi" />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 2</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">
          One woman's brain through pregnancy
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          27 MRI scans of one woman from three weeks before conception to two years eight months after birth, with hormone levels at most visits
          (Maternal Brain Project pilot). Move through the timeline to see any of 28 brain structures measured against its pre-pregnancy size.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#viewer" onClick={jumpTo('viewer')} className="btn btn-solid">Open the viewer</a>
          <Link to="/pregnancy-brain/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the scans…</p>}
      {data && <Viewer data={data} />}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/pregnancy-brain" />
    </div>
  )
}
