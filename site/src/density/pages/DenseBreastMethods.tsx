import { Link } from 'react-router-dom'
import { useDensity } from '../lib/data'

export default function DenseBreastMethods() {
  const { data } = useDensity()
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 6</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Methods: breast density</h1>
      <ol className="mt-10 space-y-8">
        {[
          ['Images', 'M-SYNTH (FDA/DIDSR, CC0) is organised by mass contrast (1.0, 1.06, 1.1 times fibroglandular radiodensity), relative dose (20 to 100 percent), breast density, and mass radius (5, 7, 9 mm); each archive holds 300 virtual breasts, odd-numbered ones with a mass, even-numbered without. At this contrast the 9 mm masses exist only for the fatty and scattered phantoms. This page uses contrast 1.06 and the clinical dose: phantoms 1, 3, 5 and 7 (mass) and 2 and 4 (no mass) for every density and size, plus phantoms 1 and 3 at 7 mm and 20 percent dose for the dose pair. The archives are 8 to 9 GB each, so only the DICOM and lesion-location members are fetched, by HTTP range request.'],
          ['Display', 'The DICOMs are VICTRE "for processing" images, 1500 by 3000 pixels at 0.085 mm, bright where attenuation is high. Each is windowed linearly between the 0.5th and 99.8th percentile of the pixels inside the breast, raised to the power 0.9, rotated so the chest wall is on the right, cropped to the breast with a 60-pixel margin, and saved as WebP at 1400 pixels on the long side. No smoothing, sharpening or local contrast. The mass centre from the .loc file (row, column) goes through the same crop and rotation and is stored as a fraction of the image; the drawn circle is 1.6 times the mass radius.'],
          ['Scoring', 'A click counts as found if it lands within 1.5 mass radii plus 2 percent of the image width of the true centre. "No mass here" on a no-mass image counts as correct; a click on a no-mass image is a false alarm. Images are drawn without repeats until every image in the chosen density has been seen. Nothing is stored or sent anywhere; the tally lives in the page until it is closed.'],
          ['Who has dense breasts', 'Computed from the BCSC Risk Estimation Dataset (1996 to 2002, 2,392,998 mammograms aggregated by risk factors): the share of mammograms in each BI-RADS density within each ten-year age band, excluding unknown density. The 2011 to 2021 shares in the text are read from the consortium\'s current benchmark tables, which are published as images, and the national prevalence is from Sprague et al. 2014.'],
          ['Cancers within a year', 'From the same risk file: invasive cancer or DCIS diagnosed within one year of the screening mammogram, per 1,000 mammograms, by density and age band, using the count field as the frequency weight. This is a rate of cancers present, screen-detected or not, so it reads as risk, not as mammography performance.'],
          ['Interval cancers and sensitivity', 'Transcribed from Kerlikowske et al. 2015 (interval cancer per 1,000 by density and age, and by density and five-year risk) and Kerlikowske et al. 2011, Table 3 (digital sensitivity and specificity by density, adjusted to median facility performance). The BCSC Mammography Screening Performance Dataset (2,512,577 exams, 2005 to 2017, with density and true/false positive/negative counts) would let sensitivity by density be computed here directly; it is released through a form with a human check, so it has been requested by hand. When the file is placed in the project\'s data folder the build script computes sensitivity, specificity, recall and cancer detection rate by density from it and the page switches to those figures.'],
          ['Regulatory text', 'The four report statements and the two patient summaries are quoted from the amended 21 CFR 900.12 (final rule of 10 March 2023, effective 10 September 2024). The USPSTF wording is from the April 2024 recommendation statement.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-5"><span className="display mt-0.5 w-8 shrink-0 text-2xl font-light text-berry tabular-nums">{i + 1}</span><div><h2 className="display text-2xl font-medium">{t}</h2><p className="mt-2 text-ink-2 leading-relaxed">{b}</p></div></li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">Limitations</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">Simulations.</strong> The phantoms are statistical models of breast anatomy, not patients, and the dataset's authors say it cannot stand in for real patient examples when judging performance. The masses are round and smooth; real cancers are often neither, and calcifications are absent.</li>
        <li><strong className="text-ink">One view, one screen.</strong> A screening exam has two views per breast read at full resolution. The finder compresses one view to a web image.</li>
        <li><strong className="text-ink">Your score is not a sensitivity.</strong> The tally shows what density does to visibility for an untrained reader on this sample. It does not estimate how often cancers are missed.</li>
        <li><strong className="text-ink">Old denominators.</strong> The public risk file is from 1996 to 2002, under an earlier BI-RADS density definition; its shares differ a little from the 2011 to 2021 tables, and the page shows both with their dates.</li>
        <li><strong className="text-ink">Density is not the whole risk.</strong> The BCSC's own conclusion is that density alone should not decide supplemental screening, and the USPSTF found the evidence for it insufficient.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Reproduce</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd "breast density project/pipeline"
python3 fetch_msynth.py     # range-fetches the sample DICOMs and .loc files into data/raw/msynth
python3 render.py           # windows, crops and rotates them into site/public/data/density/img and writes cases.json
python3 build_density.py    # computes the BCSC figures and writes density.json with every source`}</code></pre>
      {data && <p className="mt-6 text-sm text-ink-3">Table generated {data.generated}; images retrieved {data.msynth.retrieved}.</p>}
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/dense-breast" className="text-berry underline underline-offset-2">the experiment</Link>.</p>
    </div>
  )
}
