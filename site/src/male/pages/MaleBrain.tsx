import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import Viewer from '../components/Viewer'
import Cite, { SourceList } from '../components/Cite'
import { FindingsProse, CompareTable } from '../components/Findings'
import { useMale, fmt, type Male } from '../lib/data'
import { jumpTo } from '../../cycling/lib/jump'
import ExperimentNav from '../../experiments/ExperimentNav'

function KeyNumbers({ data }: { data: Male }) {
  const hs = data.hormone_summary, tb = data.stats.total_brain
  const items = [
    { label: 'Testosterone, 7 am vs 8 pm', value: `${fmt.n(hs.testosterone.am_median)} vs ${fmt.n(hs.testosterone.pm_median)} ng/dL`, note: `medians over ${hs.testosterone.am_n} morning and ${hs.testosterone.pm_n} evening draws` },
    { label: 'Cortisol, 7 am vs 8 pm', value: `${fmt.n(hs.cortisol.am_median)} vs ${fmt.n(hs.cortisol.pm_median)} µg/dL`, note: 'the body\'s wake-up hormone, at its peak and its floor' },
    { label: 'Whole brain, 7 am → 8 pm', value: tb?.ampm_mean_pct != null ? fmt.pct(tb.ampm_mean_pct, 2) : '–', note: tb ? `smaller in the evening on ${tb.ampm_n_down} of ${tb.ampm_n} double days` : '' },
    { label: 'Scans', value: '40 scans in 30 days', note: '0.8 mm T1-weighted MRI, the same Santa Barbara scanner as the cycling brain' },
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

export default function MaleBrain() {
  const { data, her, error } = useMale()
  const blocks: Block[] = data ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What you are looking at</h2>
        <p>
          The same lab that scanned a woman every morning for a month went back and did it for a man. He was 26, healthy, and for thirty days he gave blood and lay in the same Santa Barbara
          scanner: at 7 am for the first ten days, at 7 am and 8 pm for the next ten, and at 8 pm for the last ten. Forty scans. The study is called 28andHe, and it is public.<Cite id="openneuro" /><Cite id="murata2024" />
        </p>
        <p>
          Men have no monthly cycle. What they have, like everyone, is a daily one: testosterone and cortisol peak before dawn and fall through the day. The design here was built to catch
          that rhythm at both ends, which is why the month is split into mornings, both, and evenings.
        </p>
        <p>
          The brain above is his at each visit, morning scans drawn as filled dots and evening scans hollow. Pick a structure, slide through the month, and watch what moves. Then look at the
          table further down, where his month sits next to <Link to="/cycling-brain">hers</Link>.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What a man's hormones do in a day</h2>
        <p>
          Across her cycle, estradiol moved twelve-fold and progesterone several-hundred-fold over a month.<Cite id="cycling" /> His hormones move on a different clock. Testosterone is highest
          on waking and lowest at night; so is cortisol, the hormone that gets the body going in the morning; so, more gently, is the small amount of estradiol a man makes from his testosterone.
          The swing is large, and it repeats every twenty-four hours.
        </p>
        <p>
          That matters for every scan anyone has ever taken. A morning scan and an evening scan are not the same brain state, and until this study nobody had measured, in one person, how much the
          anatomy itself follows the clock.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: <KeyNumbers data={data} /> },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What changed in his brain, by our measurement</h2>
        <p>
          Same pipeline as the two experiments before it: alignment to a standard template, a published model that splits the brain into 133 structures,<Cite id="unest" /> volumes counted in the
          scan's own space. The method is on the <Link to="/male-brain/methods">methods page</Link>; these are our numbers, not the lab's.
        </p>
        <FindingsProse data={data} her={her} />
      </>
    ) },
    ...(her ? [{ type: 'figure' as const, id: 'f2', size: 'flow' as const, body: <CompareTable data={data} her={her} /> }] : []),
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the original lab found</h2>
        <p>
          Their structural paper reports the same shape of result with sharper tools: from morning to evening his total brain volume, grey-matter volume and cortical thickness fell, in step with the fall in
          testosterone, estradiol and cortisol, while cerebrospinal fluid and the ventricles grew. The global change was driven by the occipital and parietal cortex at the back of the head.<Cite id="murata2024" />
        </p>
        <p>
          Their functional paper found his resting networks, the dorsal attention network above all, reorganising with the same hormones, and more strongly than hers had with her cycle.<Cite id="grotzinger2024" />
          Brain volume shrinking through the day is not new in itself: large MRI studies have seen it for years and put it down to hydration and posture.<Cite id="nakamura2015" /> What is new is pinning it, in
          one person, to the hormones that rise and fall on the same clock.
        </p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What this can and cannot tell you</h2>
        <p><strong>This is one man.</strong> One month, one brain. It shows what can happen, not what happens to every man.</p>
        <p>
          <strong>Time of day is not only hormones.</strong> Between 7 am and 8 pm he had also been upright for thirteen hours, eaten, drunk, and worked. All of that moves brain water. The hormones ride the same
          clock, so one month in one person cannot pull them apart.
        </p>
        <p>
          <strong>Her and him is not women and men.</strong> Two people on one scanner is a comparison of two people. It is suggestive, and it is the best like-for-like pair in the public record, but it is not a
          sex difference.
        </p>
        <p>
          <strong>And still:</strong> the point of this experiment was never that men are different. It is that both brains keep time with their hormones. Hers to a month, his to a day. Neuroscience spent
          decades treating the first as noise and the second as nothing. They are the same thing at two speeds.
        </p>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made</h2>
        <p>
          The 40 T1-weighted scans were downloaded from OpenNeuro (ds005115, CC0).<Cite id="openneuro" /> Each was bias-corrected and affine-aligned to the MNI305 template with ANTs,<Cite id="ants" /><Cite id="mni305" />
          segmented with the MONAI model-zoo bundle <em>wholeBrainSeg_Large_UNEST_segmentation</em>,<Cite id="unest" /> and measured after mapping each label map back into the scan's own space.
          Hormones and time of day come from the dataset's participants table. The viewer is NiiVue.<Cite id="niivue" /> Details and downloads: <Link to="/male-brain/methods">methods</Link>, <Link to="/male-brain/data">data</Link>.
        </p>
        <p>Thanks to Elle Murata, Hannah Grotzinger, Laura Pritschet, Emily Jacobs and the Ann S. Bowers Women's Brain Health Initiative for releasing the data openly.</p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-28 text-center">
        <p className="eyebrow">Experiment 3</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.02]">
          Morning and evening.<br />
          <span className="italic font-medium text-berry">A man's month,</span> beside hers.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          The cycling brain's companion study: a 26-year-old man scanned forty times in thirty days, at 7 am and 8 pm, on the same scanner, with his testosterone and cortisol drawn alongside.
          His hormones keep a daily rhythm instead of a monthly one. Drag through the month and watch what that does.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#viewer" onClick={jumpTo('viewer')} className="btn btn-solid">Start on day 1 <span aria-hidden>↓</span></a>
          <Link to="/male-brain/methods" className="btn">How it was made</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the scans…</p>}
      {data && <Viewer data={data} />}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/male-brain" />
    </div>
  )
}
