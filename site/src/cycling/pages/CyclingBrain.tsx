import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import Viewer from '../components/Viewer'
import Cite, { SourceList } from '../components/Cite'
import { FindingsProse, FindingsTable } from '../components/Findings'
import { useCycle, fmt } from '../lib/data'
import { jumpTo } from '../lib/jump'
import ExperimentNav from '../../experiments/ExperimentNav'

function KeyNumbers({ cycle }: { cycle: NonNullable<ReturnType<typeof useCycle>['cycle']> }) {
  const d = cycle.days
  const e2 = d.map(x => x.hormones.estradiol).filter((v): v is number => v != null)
  const p4 = d.map(x => x.hormones.progesterone).filter((v): v is number => v != null)
  const lh = d.map(x => x.hormones.lh).filter((v): v is number => v != null)
  const peak = (arr: number[], key: 'estradiol' | 'progesterone' | 'lh') => d.find(x => x.hormones[key] === Math.max(...arr))!.day
  const items = [
    { label: 'Estradiol, lowest to highest morning', value: `${Math.min(...e2)} → ${Math.max(...e2)} pg/mL`, note: `${(Math.max(...e2) / Math.min(...e2)).toFixed(0)}-fold, peak on day ${peak(e2, 'estradiol')}` },
    { label: 'Progesterone, lowest to highest morning', value: `${Math.min(...p4)} → ${Math.max(...p4)} ng/mL`, note: `from essentially undetectable, peak on day ${peak(p4, 'progesterone')}` },
    { label: 'LH surge', value: `${Math.max(...lh)} mIU/mL on day ${peak(lh, 'lh')}`, note: `against a median baseline near ${Math.round(lh.sort((a, b) => a - b)[Math.floor(lh.length / 2)])}, marking ovulation` },
    { label: 'Scans', value: '30 mornings, 30 scans', note: 'blood drawn at 10 am ± 30 min, then a 0.8 mm T1-weighted MRI at 3 T' },
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

export default function Home() {
  const { cycle, error } = useCycle()

  const blocks: Block[] = cycle ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The data</h2>
        <p>
          In 2018 a 23-year-old woman was scanned at the University of California, Santa Barbara every morning for thirty consecutive days.
          Before each scan, at ten o'clock, a blood sample was drawn so that her hormone levels could be measured alongside the same morning's scan.
          The study is called 28andMe. It was run by Emily Jacobs's lab, and the scans are public.<Cite id="pritschet2020" /><Cite id="openneuro" />
        </p>
        <p>
          The viewer above shows her brain, one scan per day, with her serum hormone levels plotted beneath. The slider moves through the month: she began in the late
          luteal phase, menstruation began on day 11, the LH surge (the trigger for ovulation) occurred on day 23, and by day 30 progesterone was rising again.
          Select a structure to highlight its location in pink; the chart under the hormones shows its measured volume on that day.
        </p>
        <p>
          To our knowledge, these data have rarely been presented to the public outside the original lab. This page is intended to do so.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Hormone levels across the cycle</h2>
        <p>
          Two hormones are of principal interest. <strong>Estradiol</strong>, the main oestrogen, is produced by the follicle maturing in the ovary.
          It rises through the follicular phase, peaks on the day the egg is released, and then falls. <strong>Progesterone</strong> follows,
          produced by the corpus luteum that forms from the emptied follicle. In the absence of pregnancy, the corpus luteum regresses after about two weeks,
          progesterone falls sharply, and the endometrium is shed as menstruation.
        </p>
        <p>
          Her month covers the full sequence. On day 1 progesterone was already high (late luteal phase). It fell over the first ten days, reached its minimum as
          menstruation began on day 11, and remained low for two weeks. Estradiol rose from day 18, peaked on day 23 together with a surge of luteinising hormone
          (LH, the pituitary signal for ovulation), and fell within two days. From day 26, progesterone rose steeply again.<Cite id="my28brains" />
        </p>
        <p>
          The magnitude of these changes is notable. Between her lowest and highest mornings, estradiol varied about
          twelve-fold and progesterone several-hundred-fold. Receptors for both hormones are widely distributed in the brain.<Cite id="pritschet2020" />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: <KeyNumbers cycle={cycle} /> },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Brain volumes across the cycle</h2>
        <p>
          We ran every one of the thirty scans through the same published segmentation model, which splits a brain into 133 named structures,<Cite id="unest" />
          then measured the size of each structure in each scan. The method is described below and on the <Link to="/cycling-brain/methods">methods page</Link>.
          These are our own measurements, not the original lab's, and they will not match theirs exactly.
        </p>
        <FindingsProse cycle={cycle} />
        <p>
          The first observation is how <em>stable</em> the measured volumes are. Whole-brain volume varied by a third of a percent from day to day.
          Most of that is measurement variation: the scanner, head position and hydration. For a hormone effect on a single structure
          to be detectable in one person, it would have to exceed that variation, and in this month, in most structures, it did not.
        </p>
        <p>
          {cycle.stats.precuneus && cycle.stats.precuneus.p_progesterone != null && cycle.stats.precuneus.p_progesterone < 0.01 ? (
            <>
              One region was an exception. The precuneus, a region of cortex on the medial surface of the parietal lobe, correlated with progesterone at
              r = {fmt.r(cycle.stats.precuneus.r_progesterone!)} ({fmt.p(cycle.stats.precuneus.p_progesterone)}): it was larger on high-progesterone mornings.
              Cerebral white matter showed a correlation in the same direction (r = {fmt.r(cycle.stats.cerebral_wm.r_progesterone!)}). This is one person, one month,
              and about a hundred comparisons, so the result should be treated with caution. It is, however, consistent with the 2025 multi-person study, which found progesterone
              associated with widespread grey-matter volume, including parietal cortex.<Cite id="heller2025" />
            </>
          ) : (
            <>No single region passed a strict threshold once the number of comparisons was accounted for.</>
          )}
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: <FindingsTable cycle={cycle} /> },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Published findings from the same dataset</h2>
        <p>
          The Jacobs lab did not use whole-brain segmentation for their structural paper. They acquired a separate, higher-resolution scan of the medial temporal
          lobe each day and segmented the hippocampus into its subfields. In that analysis, day-to-day progesterone was associated with volume changes in CA2/3,
          entorhinal, perirhinal and parahippocampal cortex; estradiol was not; and when she took an oral contraceptive the following year, which suppresses
          progesterone, the cycle-linked changes were no longer observed.<Cite id="taylor2020" />
        </p>
        <p>
          Their functional work on the same thirty days found that resting-state networks also reorganised with the hormones, most markedly around
          ovulation. On day 23, with estradiol and LH at their peak, the default mode network showed a transient reorganisation.<Cite id="pritschet2020" /><Cite id="mueller2021" />
        </p>
        <p>
          In 2025, a group in Jena pooled 28andMe with three more densely-sampled women and a man and found that patterns of grey-matter volume across the
          whole brain rose and fell with progesterone in typical cycles, and with estradiol in a woman with endometriosis and one on the pill. The man's brain
          also changed over the weeks, but not in association with any hormone.<Cite id="heller2025" />
        </p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Limitations</h2>
        <p>
          <strong>This is one woman.</strong> Thirty scans of one person can show what <em>can</em> happen to a brain across a cycle. They cannot
          establish what happens in women generally. Cycles differ, hormones differ, and a single month contains one ovulation.
        </p>
        <p>
          <strong>Correlation is not mechanism.</strong> The covariation of progesterone and precuneus volume over a month is an association, not evidence of causation.
          Hydration, sleep, time of day and scanner drift all alter measured brain volume by amounts comparable to those shown here.
        </p>
        <p>
          <strong>Our measurements are independent of the original papers.</strong> We used a publicly available research model, not a clinical tool, and a different method from the original
          papers. The values are expected to differ from theirs. Where they disagree, the published papers should take precedence. Nothing on this page is medical advice.
        </p>
        <p>
          <strong>Context:</strong> for most of the history of neuroscience, the menstrual cycle was treated as a source of variance to be excluded rather than a
          variable to be studied. Females were excluded from neuroscience research for decades, in animals and in humans, on the assumption that their hormones made them too variable to study, an assumption that the evidence does not
          support.<Cite id="beery2011" /> This page draws on a study that treated that variation as its object.
        </p>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Method</h2>
        <p>
          The thirty T1-weighted scans were downloaded from OpenNeuro (dataset ds002674, released CC0).<Cite id="openneuro" /> Each was bias-corrected and
          aligned to the MNI305 template with an affine transform using ANTs,<Cite id="ants" /><Cite id="mni305" /> then segmented into 133 structures with the
          MONAI model-zoo bundle <em>wholeBrainSeg_Large_UNEST_segmentation</em>.<Cite id="unest" /><Cite id="monai" /> Volumes were counted after mapping
          each label map back into the scan's own space, so that the template's scaling does not enter the volumes. The brain viewer is NiiVue.<Cite id="niivue" />
        </p>
        <p>
          The hormone assays were published with the original papers but not deposited with the scans; the table here is reproduced from the Jacobs and
          Miolane labs' open analysis code,<Cite id="my28brains" /> and day 20 has only progesterone. Full details, code and data are on the{' '}
          <Link to="/cycling-brain/methods">methods</Link> and <Link to="/cycling-brain/data">data</Link> pages.
        </p>
        <p>
          We thank Emily Jacobs, Laura Pritschet, Caitlin Taylor and the Ann S. Bowers Women's Brain Health Initiative at UC Santa Barbara for making the data public,
          and Nina Miolane's group for publishing their analysis openly.<Cite id="jacobslab" />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 1</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">
          One woman's brain across a menstrual cycle
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          30 daily MRI scans and blood tests from one healthy 23-year-old over a full cycle (28andMe, UC Santa Barbara). Move through the month to see
          her hormone levels and the measured volume of any of 25 brain structures on each day.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#viewer" onClick={jumpTo('viewer')} className="btn btn-solid">Open the viewer</a>
          <Link to="/cycling-brain/methods" className="btn">Methods</Link>
        </div>
      </section>

      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!cycle && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the month…</p>}
      {cycle && <Viewer cycle={cycle} />}

      <div className="mt-16">
        <Story blocks={blocks} />
      </div>
      <ExperimentNav current="/cycling-brain" />
    </div>
  )
}
