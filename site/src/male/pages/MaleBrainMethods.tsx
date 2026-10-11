import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'

const steps = [
  { n: 1, title: 'Fetch', body: 'The T1-weighted MPRAGE scan (0.8 mm, Siemens Prisma, 64-channel coil) and its sidecar for each of the 40 sessions were pulled from the public OpenNeuro bucket for ds005115. The resting-state, fieldmap, hippocampal T2 and physiology files were left on the server.' },
  { n: 2, title: 'Correct and align', body: 'N4 bias-field correction, then a 12-parameter affine to the MNI305 template with ANTsPy; the forward affine is kept per session.' },
  { n: 3, title: 'Segment', body: 'The MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (133 labels) with its published inference configuration. Same model and settings as the cycling and pregnant brains.' },
  { n: 4, title: 'Measure', body: 'Each label map pulled back into its session\'s native space by inverting the affine with nearest-neighbour interpolation; voxels counted there.' },
  { n: 5, title: 'Compare', body: 'For every region: spread (coefficient of variation) over all 40 scans, over the 20 morning scans and over the 20 evening scans; the paired morning-to-evening change on the ten days with both, with a one-sample t-test on the ten pairs; and Spearman correlations with same-session testosterone, cortisol and estradiol, over all draws and over morning draws only. Her side of the comparison table is the cycling brain\'s own statistics, read straight from that experiment\'s data file.' },
  { n: 6, title: 'Publish', body: 'Aligned scans and label maps downsampled to 1.5 mm and 8-bit, drawn by NiiVue with a lookup table that is transparent except for the chosen structure.' },
]

export default function MaleBrainMethods() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 3</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">How the man's month was measured</h1>
      <p className="mt-6 text-lg text-ink-2 leading-relaxed">The same pipeline as the two experiments before it, with the comparison step built around time of day instead of cycle phase or gestation.</p>
      <ol className="mt-10 space-y-8">
        {steps.map(s => (
          <li key={s.n} className="flex gap-5">
            <span className="display mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry text-[#fff] text-sm font-bold">{s.n}</span>
            <div><h2 className="display text-2xl font-medium">{s.title}</h2><p className="mt-2 text-ink-2 leading-relaxed">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">What to be careful about</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">n = 1, and the comparison is n = 2.</strong> One man, one month; one woman, one month. Suggestive, not a sex difference.</li>
        <li><strong className="text-ink">Time of day carries more than hormones.</strong> Hours upright, food, drink and sleep all move brain water between 7 am and 8 pm. The paired change is real; its cause is not isolated.</li>
        <li><strong className="text-ink">One blood draw a day.</strong> On the ten double days only one of the two sessions has an assay, so hormone-volume correlations have fewer points than scans.</li>
        <li><strong className="text-ink">Blocks are confounded with days.</strong> Mornings came first, evenings last. Anything that drifted over the month (scanner, habits) lands partly in the morning-evening difference. The ten double days, which interleave the two, are the clean test.</li>
        <li><strong className="text-ink">Research tool.</strong> The model's authors state it is not for diagnostic use. Neither is this page.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Run it</h2>
      <pre className="mt-3 overflow-x-auto rounded-2xl bg-white/70 p-5 text-sm leading-relaxed text-ink"><code>{`cd pipeline
.venv/bin/python fetch_28andhe.py     # 40 T1w scans from OpenNeuro, ~700 MB
.venv/bin/python preprocess.py        # N4 + affine to MNI305
.venv/bin/python segment.py           # UNesT 133-label segmentation
.venv/bin/python measure.py           # native-space volumes per label per session
.venv/bin/python export_web.py        # public/data/male/{male.json, brain/*}`}</code></pre>
      <h2 className="display mt-14 text-2xl font-medium">Sources</h2>
      <div className="mt-4"><SourceList /></div>
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/male-brain" className="text-berry underline underline-offset-2">a man's month</Link>.</p>
    </div>
  )
}
