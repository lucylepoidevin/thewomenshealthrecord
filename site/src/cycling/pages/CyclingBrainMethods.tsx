import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'

const steps = [
  { n: 1, title: 'Fetch', body: 'The T1-weighted MPRAGE scan (0.8 mm isotropic, Siemens 3 T Prisma, 64-channel coil) and its sidecar for each of the 30 sessions of Study 1 were pulled from the public OpenNeuro S3 bucket for ds002674 (v1.0.5). Nothing else was downloaded: the resting-state runs are a gigabyte each and not needed here.' },
  { n: 2, title: 'Correct and align', body: 'Each scan was N4 bias-field corrected, then registered to the MNI305 T1 template (TemplateFlow tpl-MNI305, 1 mm) with a 12-parameter affine using ANTsPy. No non-linear warp was applied: the model expects affine-aligned MNI305 input, and a deformable warp would erase the shape differences we want to measure. The forward affine matrix for each day was kept.' },
  { n: 3, title: 'Segment', body: 'The MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (UNesT, 133 labels, Apache-2.0) was run on each aligned scan with its published inference configuration: non-zero intensity normalisation, 96³ sliding-window inference with 0.7 overlap, argmax over 133 classes. Only the device (Apple GPU) and output paths were changed. The model was trained on OASIS and CANDI scans aligned the same way.' },
  { n: 4, title: 'Measure', body: 'Each day\'s label map was pulled back into that day\'s native 0.8 mm space by inverting its affine with nearest-neighbour interpolation, and voxels were counted per label there. Counting in template space would scale every brain to the template and mix registration into the volumes. As a check, the MNI-space count multiplied by the affine\'s determinant agrees with the native count to within resampling error, and the determinant itself varied by only 0.2% across the month.' },
  { n: 5, title: 'Summarise', body: 'Regions shown on the page are sums of left and right labels (and, for cortex, white matter and cerebellum, sums over several). For each region: mean, standard deviation, coefficient of variation, range, and same-day Pearson and Spearman correlations with estradiol, progesterone, LH and FSH across the 30 days. These are descriptive. With roughly a hundred region-by-hormone pairs in a single person, several will pass p < 0.05 by chance.' },
  { n: 6, title: 'Publish', body: 'Aligned scans and label maps were downsampled to 1.5 mm and 8-bit for the browser (about 1.3 MB per day). The viewer is NiiVue; the day\'s label map is painted with a lookup table that is transparent everywhere except the chosen structure, so switching region costs nothing.' },
]

export default function Methods() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">How the cycling brain was measured</h1>
      <p className="mt-6 text-lg text-ink-2 leading-relaxed">
        Every number on the main page comes from a six-step pipeline that you can run yourself. The code lives next to the site in the project repository.
      </p>

      <ol className="mt-10 space-y-8">
        {steps.map(s => (
          <li key={s.n} className="flex gap-5">
            <span className="display mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry text-white text-sm font-bold">{s.n}</span>
            <div>
              <h2 className="display text-2xl font-medium">{s.title}</h2>
              <p className="mt-2 text-ink-2 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="display mt-14 text-2xl font-medium">The hormone table</h2>
      <p className="mt-3 text-ink-2 leading-relaxed">
        Serum estradiol, progesterone, testosterone, DHEA-S, LH, FSH and SHBG were drawn daily at 10 am and assayed at the Brigham and Women's Hospital
        Research Assay Core; the values appear in the 2020 NeuroImage papers. They were not deposited on OpenNeuro with the scans. The table used here
        was transcribed from the output of an open analysis notebook published by the Jacobs and Miolane labs (my28brains, 2023). One day, day 20, has
        only progesterone in that notebook; the other assays for that day are left blank rather than guessed. Before this is cited anywhere, the table
        should be confirmed against the paper's supplement or with the lab.
      </p>

      <h2 className="display mt-14 text-2xl font-medium">What to be careful about</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">n = 1.</strong> One participant, one natural cycle. Everything here is a case description.</li>
        <li><strong className="text-ink">Different method from the papers.</strong> Taylor et al. segmented hippocampal subfields on a dedicated high-resolution T2 scan with ASHS. We used a whole-brain T1 model. Expect different absolute volumes and, possibly, different conclusions.</li>
        <li><strong className="text-ink">Measurement noise is the same size as the effects.</strong> Whole-brain volume varied by 0.3% day to day, the hippocampus by 0.6%. Hydration, sleep and head position can do that on their own.</li>
        <li><strong className="text-ink">The model is a research tool.</strong> Its authors state it is an example, not for diagnostic use. So is this page.</li>
        <li><strong className="text-ink">Multiple comparisons.</strong> Correlations are reported uncorrected. Anything flagged on the main page should be read as a lead to check in the next dataset, not a finding.</li>
      </ul>

      <h2 className="display mt-14 text-2xl font-medium">Run it</h2>
      <pre className="mt-3 overflow-x-auto rounded-2xl bg-white/70 p-5 text-sm leading-relaxed text-ink"><code>{`cd pipeline
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python fetch_28andme.py      # 30 T1w scans from OpenNeuro, ~540 MB
.venv/bin/python preprocess.py         # N4 + affine to MNI305, ~6 s per scan
.venv/bin/python segment.py            # UNesT 133-label segmentation, ~20 s per scan on an Apple GPU
.venv/bin/python measure.py            # native-space volumes per label per day
.venv/bin/python export_web.py         # site/public/data/{cycle.json, brain/*}`}</code></pre>

      <h2 className="display mt-14 text-2xl font-medium">Sources</h2>
      <div className="mt-4"><SourceList /></div>

      <p className="mt-12 text-sm text-ink-3">
        Back to <Link to="/cycling-brain" className="text-berry underline underline-offset-2">the cycling brain</Link>.
      </p>
    </div>
  )
}
