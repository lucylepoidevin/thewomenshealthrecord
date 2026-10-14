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
    { label: 'Estradiol', value: `${fmt.n(preE)} → ${fmt.n(maxE.hormones.estradiol!)} pg/mL`, note: `${Math.round(maxE.hormones.estradiol! / preE).toLocaleString()}-fold, peak at week ${maxE.week}. The cycling brain's whole range was 22 to 264.` },
    { label: 'Progesterone', value: `${fmt.n(ss.find(s => s.session === 2)?.hormones.progesterone ?? 0)} → ${fmt.n(maxP.hormones.progesterone!)} ng/mL`, note: `peak at week ${maxP.week}. The cycling brain's peak was 15.5.` },
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
        <h2 className="display text-3xl font-medium mb-4">What you are looking at</h2>
        <p>
          In the summer of 2019 a 38-year-old neuroscientist, one of the study's own authors, lay down in a scanner three weeks before she tried to conceive. She went back
          twenty-six more times: through an IVF conception, every few weeks of the pregnancy, and then across the two years and eight months after her child was born.
          At most visits she gave blood as well. The study is the Maternal Brain Project pilot, from Emily Jacobs's lab at UC Santa Barbara and Elizabeth Chrastil's at UC Irvine,
          and the scans are public.<Cite id="pritschet2024" /><Cite id="openneuro" />
        </p>
        <p>
          Nobody had mapped one brain through a whole pregnancy before. Earlier work compared groups of women before and after; this is the first time the transition itself
          was watched, scan by scan, in one person.
        </p>
        <p>
          The brain above is hers at each visit. The curves are her blood. The slider walks you from before conception to two years after the birth. Pick a structure and the
          pink shape shows where it is; the chart under the hormones shows how much bigger or smaller it measured at that visit than it did before she was pregnant.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What pregnancy does, hormonally</h2>
        <p>
          If you came here from <Link to="/cycling-brain">the cycling brain</Link>, hold its numbers in your head. Across a menstrual cycle, estradiol moved between about 20 and
          260 pg/mL, and progesterone between almost nothing and 15 ng/mL. Those were the largest hormonal swings a non-pregnant body produces.<Cite id="cycling" />
        </p>
        <p>
          Pregnancy makes them look like rounding errors. Here, estradiol climbed past 4,000 pg/mL by the second trimester and past 12,000 by week 36. Progesterone, made first
          by the corpus luteum and then by the placenta, rose to 50 ng/mL by mid-pregnancy and over 100 near term. Both collapse within days of birth: at the first visit after it, week 43, estradiol was 9 pg/mL and progesterone 0.12.<Cite id="openneuro" />
        </p>
        <p>
          The brain is dense with receptors for both hormones. Whatever they do to it across a cycle, pregnancy does for nine months at many times the dose: estradiol at nearly fifty times the cycle's peak, progesterone at seven.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: <KeyNumbers data={data} /> },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What changed in her brain, by our measurement</h2>
        <p>
          We ran all 27 scans through the same pipeline as the cycling brain: alignment to a standard template, a published model that splits the brain into 133 structures,<Cite id="unest" />
          and volumes counted in the scan's own space. Then every structure was compared with its size before conception. The method is on the <Link to="/pregnancy-brain/methods">methods page</Link>;
          these are our numbers, not the lab's.
        </p>
        <FindingsProse data={data} />
        <p>
          In the cycling brain, the lesson was that nothing moved beyond the noise. Here, something does: the whole brain shrinks through pregnancy by an amount the scanner change
          cannot explain, bottoms out in the third trimester or just after the birth, and climbs back over the following two years. The finer claims, which tissue, which region,
          are where our method runs out of resolution and the paper's begins.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: <FindingsTable data={data} /> },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the original study found</h2>
        <p>
          The lab's own analysis, with a different segmentation and with cortical thickness and diffusion imaging we did not use, reported pronounced decreases in grey-matter volume
          and cortical thickness across the brain, about 4% in roughly 80% of the regions measured, in step with the rising hormones, alongside increases in ventricle volume and
          cerebrospinal fluid. White matter went the other way: its microstructural integrity rose by about a tenth, peaking around the end of the second trimester, and fell back
          after the birth. Few regions were untouched, and much of the grey-matter reduction was still present two years later.<Cite id="pritschet2024" />
        </p>
        <p>
          That matches the only earlier evidence, a 2017 study that scanned women before and after a first pregnancy and found grey-matter reductions in the regions used for
          thinking about other people, lasting at least two years, large enough that a computer could tell who had been pregnant from the scans alone.<Cite id="hoekzema2017" />
        </p>
        <p>
          "Reduction" is the measurement, not the verdict. Adolescence prunes grey matter too, and nobody calls it loss. The leading reading is that pregnancy refines circuits the
          way puberty does: a second window of organised change in an adult brain, driven by the same hormones.
        </p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What this can and cannot tell you</h2>
        <p><strong>This is one woman.</strong> One pregnancy, one brain, one set of scanners. It shows what <em>can</em> happen, not what will happen to anyone else.</p>
        <p>
          <strong>The scanner changed at week 9.</strong> The four baseline scans and the first two pregnancy scans were in Santa Barbara; everything from week 9 on was in Irvine, until
          the last visit was repeated on both machines a day apart. We show that repeat as a bracket on every chart and let you re-base the comparison to week 9. The pregnancy
          pattern survives either way, but any single number carries that caveat.
        </p>
        <p>
          <strong>Our method is not theirs.</strong> A whole-brain model on a 1 mm template is coarser than the surface-based tools the paper used. Where the two disagree, trust the paper.
          Nothing here is medical advice.
        </p>
        <p>
          <strong>And still:</strong> well over a hundred million women give birth each year, and until 2024 not one of their brains had been mapped through the whole arc. This is what the
          map looks like. It took a scientist volunteering her own head, twenty-seven times.
        </p>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made</h2>
        <p>
          The 27 T1-weighted scans were downloaded from OpenNeuro (ds005299, CC0).<Cite id="openneuro" /> Each was bias-corrected and affine-aligned to the MNI305 template with
          ANTs,<Cite id="ants" /><Cite id="mni305" /> segmented into 133 structures with the MONAI model-zoo bundle <em>wholeBrainSeg_Large_UNEST_segmentation</em>,<Cite id="unest" /> and
          measured after mapping each label map back into the scan's own space. Hormones, gestation week and scanner site come straight from the dataset's participants table.
          The viewer is NiiVue.<Cite id="niivue" /> Details, code and downloads are on the <Link to="/pregnancy-brain/methods">methods</Link> and <Link to="/pregnancy-brain/data">data</Link> pages.
        </p>
        <p>
          Thanks to Laura Pritschet, Elizabeth Chrastil, Emily Jacobs and the Ann S. Bowers Women's Brain Health Initiative for releasing the data openly.<Cite id="wbhi" />
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
