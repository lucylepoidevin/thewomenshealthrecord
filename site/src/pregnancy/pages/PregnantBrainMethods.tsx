import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'

const steps = [
  { n: 1, title: 'Fetch', body: 'The T1-weighted MPRAGE scan (0.8 mm, Siemens Prisma, 64-channel coil) and its sidecar for each of the 27 sessions were pulled from the public OpenNeuro bucket for ds005299 (v1.0.0). The diffusion and high-resolution hippocampal scans were left on the server.' },
  { n: 2, title: 'Correct and align', body: 'N4 bias-field correction, then a 12-parameter affine to the MNI305 template with ANTsPy. No non-linear warp, so the brain keeps its own shape; the forward affine is kept per session.' },
  { n: 3, title: 'Segment', body: 'The MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (133 labels) was run with its published inference configuration, changing only device and paths. Same model, same settings as the cycling brain, so the two experiments can be read against each other.' },
  { n: 4, title: 'Measure', body: 'Each label map was pulled back into its own session\'s native space by inverting the affine with nearest-neighbour interpolation and voxels were counted there. The affine\'s scale factor varied by 0.7% (standard deviation) across the 27 sessions, 2.8% between its extremes.' },
  { n: 5, title: 'Compare', body: 'Every region is reported as percent change from the mean of the four pre-conception scans (sessions 1-4, weeks -3 to 1.5). Because the scanner changed at session 7 (week 9), the page also offers that session as the reference, and reports the next-day retest pair (sessions 26 and 27, one on each scanner) as the size of a pure site difference. Trimester means, the lowest pregnancy value, early-postpartum (to week 52) and two-year (week 90+) means, and Spearman correlations with same-visit estradiol and progesterone are computed over the scans that had an assay.' },
  { n: 6, title: 'Publish', body: 'Aligned scans and label maps downsampled to 1.5 mm and 8-bit, about 1.3 MB per session, drawn by NiiVue with a lookup table that is transparent except for the chosen structure.' },
]

export default function PregnantBrainMethods() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 2</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Methods: brain through pregnancy</h1>
      <p className="mt-6 text-lg text-ink-2 leading-relaxed">The same six-step pipeline as the cycling brain, pointed at a different dataset, with one extra step for the comparison. Code lives next to the site.</p>
      <ol className="mt-10 space-y-8">
        {steps.map(s => (
          <li key={s.n} className="flex gap-5">
            <span className="display mt-0.5 w-8 shrink-0 text-2xl font-light text-berry tabular-nums">{s.n}</span>
            <div><h2 className="display text-2xl font-medium">{s.title}</h2><p className="mt-2 text-ink-2 leading-relaxed">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">Limitations</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">n = 1.</strong> One participant, one pregnancy, conceived by IVF. A case description, not a population estimate.</li>
        <li><strong className="text-ink">Two scanners.</strong> Sessions 1-6 in Santa Barbara, 7-26 in Irvine, 27 back in Santa Barbara as a retest. The site change falls in the first trimester. We expose it rather than model it away.</li>
        <li><strong className="text-ink">Gaps in the assays.</strong> Hormones were not measured at every visit; the curves show only the visits that had them.</li>
        <li><strong className="text-ink">Different method from the paper.</strong> The paper used surface-based cortical measures and diffusion imaging; we used a whole-brain volumetric model. Absolute numbers differ; the direction of the main findings agrees.</li>
        <li><strong className="text-ink">Research tool.</strong> The model's authors state it is not for diagnostic use. Neither is this page.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Reproduce</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd pipeline
.venv/bin/python fetch_mbp.py        # 27 T1w scans from OpenNeuro, ~470 MB
.venv/bin/python preprocess.py       # N4 + affine to MNI305
.venv/bin/python segment.py          # UNesT 133-label segmentation
.venv/bin/python measure.py          # native-space volumes per label per session
.venv/bin/python export_web.py       # public/data/pregnancy/{pregnancy.json, brain/*}`}</code></pre>
      <h2 className="display mt-14 text-2xl font-medium">Sources</h2>
      <div className="mt-4"><SourceList /></div>
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/pregnancy-brain" className="text-berry underline underline-offset-2">the experiment</Link>.</p>
    </div>
  )
}
