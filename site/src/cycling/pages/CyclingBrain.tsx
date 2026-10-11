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
    { label: 'LH surge', value: `${Math.max(...lh)} mIU/mL on day ${peak(lh, 'lh')}`, note: `against a baseline near ${Math.round(lh.sort((a, b) => a - b)[Math.floor(lh.length / 2)])}: ovulation` },
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
        <h2 className="display text-3xl font-medium mb-4">What you are looking at</h2>
        <p>
          In 2018 a 23-year-old woman walked into a scanner at the University of California, Santa Barbara every morning for thirty days in a row.
          Before each scan she gave blood, at ten o'clock, so that her hormones that morning could be measured alongside her brain that morning.
          The study is called 28andMe. It was run by Emily Jacobs's lab, and the scans are public.<Cite id="pritschet2020" /><Cite id="openneuro" />
        </p>
        <p>
          The brain above is hers, one scan per day. The curves are her blood. The slider walks you through the month: she started in the late
          luteal phase, her period arrived on day 11, her LH surge (the trigger for ovulation) came on day 23, and by day 30 progesterone was climbing again.
          Pick a structure and the pink shape shows where it is; the chart under the hormones shows how big it measured that day.
        </p>
        <p>
          Almost no one outside the original lab has put this data in front of the public. That is the point of this page.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the cycle does, hormonally</h2>
        <p>
          Two hormones carry most of the story. <strong>Estradiol</strong>, the main oestrogen, is made by the follicle that is ripening in the ovary.
          It climbs through the follicular phase, peaks the day the egg is released, and falls back. <strong>Progesterone</strong> comes afterwards,
          from the corpus luteum that the empty follicle turns into. If there is no pregnancy, the corpus luteum fades after about two weeks,
          progesterone collapses, and the lining of the womb is shed: a period.
        </p>
        <p>
          Her month shows the whole arc. On day 1 progesterone was already high (she was late luteal). It fell through the first ten days, hit its floor as
          her period began on day 11, and stayed there for two weeks. Estradiol rose from day 18, spiked on day 23 with a surge of luteinising hormone
          (LH, the pituitary's signal to ovulate), and dropped within two days. From day 26, progesterone rose steeply again.<Cite id="my28brains" />
        </p>
        <p>
          The scale of these swings is the part that is easy to forget. Between her quietest and her loudest mornings, estradiol changed about
          twelve-fold and progesterone several-hundred-fold. The brain is full of receptors for both.<Cite id="pritschet2020" />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: <KeyNumbers cycle={cycle} /> },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What changed in her brain, by our measurement</h2>
        <p>
          We ran every one of the thirty scans through the same published segmentation model, which splits a brain into 133 named structures,<Cite id="unest" />
          then measured the size of each structure in each scan. The method is described below and on the <Link to="/cycling-brain/methods">methods page</Link>.
          This is our own measurement, not the lab's, and it will not match theirs exactly.
        </p>
        <FindingsProse cycle={cycle} />
        <p>
          The first thing to take from this is how <em>stable</em> a brain is. Whole-brain volume moved by a third of a percent from day to day.
          Most of that is measurement: the scanner, her head position, how much water she had drunk. A hormone effect on a single structure
          would have to be bigger than that wobble to be seen in one person, and in this month, in most structures, it was not.
        </p>
        <p>
          {cycle.stats.precuneus && cycle.stats.precuneus.p_progesterone != null && cycle.stats.precuneus.p_progesterone < 0.01 ? (
            <>
              One region did stand out. The precuneus, a patch of cortex on the inner face of the parietal lobe, tracked progesterone with
              r = {fmt.r(cycle.stats.precuneus.r_progesterone!)} ({fmt.p(cycle.stats.precuneus.p_progesterone)}): larger on high-progesterone mornings.
              Cerebral white matter leaned the same way (r = {fmt.r(cycle.stats.cerebral_wm.r_progesterone!)}). That is one person, one month,
              and about a hundred comparisons, so hold it loosely. But it does rhyme with the 2025 multi-person study, which found progesterone
              tracking widespread grey-matter volume, including parietal cortex.<Cite id="heller2025" />
            </>
          ) : (
            <>No single region cleared a strict threshold once you account for the number of comparisons.</>
          )}
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: <FindingsTable cycle={cycle} /> },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the original lab found</h2>
        <p>
          The Jacobs lab did not use whole-brain segmentation for their structural paper. They took a separate, much sharper scan of the medial temporal
          lobe each day and traced the hippocampus into its subfields. In that analysis, day-to-day progesterone was associated with volume changes in CA2/3,
          entorhinal, perirhinal and parahippocampal cortex; estradiol was not; and when she took an oral contraceptive the following year, which holds
          progesterone down, the cycle-linked changes disappeared.<Cite id="taylor2020" />
        </p>
        <p>
          Their functional work on the same thirty days found that the brain's resting networks reorganised with the hormones too, most sharply around
          ovulation. On day 23, with estradiol and LH at their peak, the default mode network briefly re-wired.<Cite id="pritschet2020" /><Cite id="mueller2021" />
        </p>
        <p>
          In 2025, a group in Jena pooled 28andMe with three more densely-sampled women and a man and found that patterns of grey-matter volume across the
          whole brain rose and fell with progesterone in typical cycles, and with estradiol in a woman with endometriosis and one on the pill. The man's brain
          changed over the weeks too, but not in step with any hormone.<Cite id="heller2025" />
        </p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What this can and cannot tell you</h2>
        <p>
          <strong>This is one woman.</strong> Thirty scans of one person can show what <em>can</em> happen to a brain across a cycle. They cannot
          tell you what happens to every woman, or to you. Cycles differ, hormones differ, and a single month contains one ovulation.
        </p>
        <p>
          <strong>Correlation is not mechanism.</strong> Progesterone and the precuneus moving together over a month is a pattern, not a cause.
          Hydration, sleep, time of day and scanner drift all move brain volume by amounts similar to anything shown here.
        </p>
        <p>
          <strong>Our numbers are ours.</strong> We used a public model built for research, not a clinical tool, and a different method from the original
          papers. Expect the values to differ from theirs. Where they disagree, trust the paper. Nothing on this page is medical advice.
        </p>
        <p>
          <strong>And still:</strong> for most of the history of neuroscience, the menstrual cycle was treated as noise to exclude rather than a
          variable to study. Females were left out of neuroscience for decades, in animals and in people, on the belief that their hormones made them too variable to study, a belief that the evidence does not
          support.<Cite id="beery2011" /> This page exists because one lab decided the variation was the point.
        </p>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made</h2>
        <p>
          The thirty T1-weighted scans were downloaded from OpenNeuro (dataset ds002674, released CC0).<Cite id="openneuro" /> Each was bias-corrected and
          aligned to the MNI305 template with an affine transform using ANTs,<Cite id="ants" /><Cite id="mni305" /> then segmented into 133 structures with the
          MONAI model-zoo bundle <em>wholeBrainSeg_Large_UNEST_segmentation</em>.<Cite id="unest" /><Cite id="monai" /> Volumes were counted after mapping
          each label map back into the scan's own space, so the template's scaling does not leak into the numbers. The brain viewer is NiiVue.<Cite id="niivue" />
        </p>
        <p>
          The hormone assays were published with the original papers but not deposited with the scans; the table here is reproduced from the Jacobs and
          Miolane labs' open analysis code,<Cite id="my28brains" /> and day 20 has only progesterone. Full details, code and data are on the{' '}
          <Link to="/cycling-brain/methods">methods</Link> and <Link to="/cycling-brain/data">data</Link> pages.
        </p>
        <p>
          Thanks to Emily Jacobs, Laura Pritschet, Caitlin Taylor and the Ann S. Bowers Women's Brain Health Initiative at UC Santa Barbara for making the data public,
          and to Nina Miolane's group for publishing their analysis openly.<Cite id="jacobslab" />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-28 text-center">
        <p className="eyebrow">Experiment 1</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.02]">
          One woman's brain across a menstrual cycle
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          30 daily MRI scans and blood tests from one healthy 23-year-old over a full cycle (28andMe, UC Santa Barbara). Move through the month to see
          her hormone levels and the measured volume of any of 25 brain structures on each day.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
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
