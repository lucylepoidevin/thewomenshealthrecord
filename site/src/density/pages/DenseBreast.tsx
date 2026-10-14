import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import ExperimentNav from '../../experiments/ExperimentNav'
import { jumpTo } from '../../cycling/lib/jump'
import Finder from '../components/Finder'
import DosePair from '../components/DosePair'
import DensityBars from '../components/charts/DensityBars'
import Cite, { SourceList } from '../components/Cite'
import { DENSITIES, LETTER, fmtN, useDensity } from '../lib/data'

const pct = (a: number, b: number) => (100 * a / b).toFixed(1)

export default function DenseBreast() {
  const { data, error } = useDensity()
  const S = data?.sources ?? {}
  const st = data?.stats
  const dm = st?.bcsc_bench.dm
  const blocks: Block[] = data && st && dm ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The four density categories</h2>
        <p>
          A mammogram is an X-ray image. Fat attenuates X-rays little and appears dark; fibrous and glandular tissue attenuates them more and appears white. A tumour also appears white. The radiologist assigns each
          breast to one of four categories according to the proportion of the image that appears white, and since September 2024 every mammography report in the United States has been required to state the category, in the regulation's own
          words:<Cite id="fda_rule" sources={S} />
        </p>
        <ol className="my-5 space-y-2 text-base">
          {st.fda.statements.map((s, i) => <li key={s} className="flex gap-3"><span className="display w-6 shrink-0 text-berry font-medium">{LETTER[DENSITIES[i]]}</span><span>{s}</span></li>)}
        </ol>
        <p>
          Across {fmtN(dm.exams)} digital screening mammograms in the Breast Cancer Surveillance Consortium from 2011 to 2021, {pct(dm.by_density[2].exams + dm.by_density[3].exams, dm.exams - dm.unknown[0])} percent were
          read as heterogeneously or extremely dense, the two categories the regulation designates as "dense".<Cite id="bcsc_bench" sources={S} /> A national estimate derived from the same registries placed the prevalence at{' '}
          {st.sprague2014.dense_40_74_pct} percent of women aged 40 to 74, about {st.sprague2014.women_40_74_millions} million women, and {st.sprague2014.age_40_44_pct} percent of those aged 40 to 44.<Cite id="sprague2014" sources={S} /> Density
          declines with age and with body weight: {st.sprague2014.normal_bmi_pct} percent of women of normal weight have dense breasts, compared with {st.sprague2014.obese_pct} percent of women with obesity.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">Who has dense breasts</p>
        <h3 className="display text-xl font-medium mb-1">Share of screening mammograms in each density category, by age</h3>
        <p className="text-xs text-ink-3 mb-3">Computed here from the BCSC risk estimation dataset: {fmtN(st.bcsc_risk.with_density)} mammograms of women aged 40 to 79 with a recorded density, {st.bcsc_risk.years}.<Cite id="bcsc_risk" sources={S} /></p>
        <DensityBars rows={st.bcsc_risk.by_age.map(r => ({ label: r.age, v: r.share }))} unit="% of mammograms" fmt={v => `${v}%`} />
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Masking: interval cancers by density</h2>
        <p>
          A mass in a fatty breast appears against a dark background; the same mass in a dense breast is surrounded by tissue of similar brightness. In the images above, the 7 mm mass that is
          readily visible in the fatty breast is difficult to locate in the extremely dense one. The images are FDA simulations generated from virtual breasts with a mass of known size at a known location, which
          allows the same lesion to be displayed at four densities.<Cite id="msynth" sources={S} /><Cite id="victre" sources={S} />
        </p>
        <p>
          The most direct clinical measure of cancers not detected at screening is the interval cancer rate: cancers diagnosed within a year of a mammogram that was read as normal. In {fmtN(st.interval.exams)} digital
          screening mammograms, the rate increased with density in every age band, from {st.interval.by_age[0].v[0]} per thousand in fatty breasts at 40 to 49 to {st.interval.by_age[3].v[3]} per thousand in
          extremely dense breasts at 70 to 74.<Cite id="kerlikowske2015" sources={S} />
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">Cancers the mammogram did not show</p>
        <h3 className="display text-xl font-medium mb-1">Interval cancers per 1,000 screening mammograms, by density and age</h3>
        <p className="text-xs text-ink-3 mb-3">{st.interval.note} The dashed line is that threshold. Kerlikowske et al. 2015, {st.interval.years}.<Cite id="kerlikowske2015" sources={S} /></p>
        <DensityBars rows={st.interval.by_age.map(r => ({ label: r.age, v: r.v }))} unit="per 1,000" threshold={st.interval.threshold} />
      </>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <p>
          Sensitivity, the proportion of cancers present that the mammogram detected, shows the same pattern less precisely, because the denominator depends on cancers being ascertained later. A BCSC table that reports
          it by density for digital mammography, from 2000 to 2006, gives {st.sens2011.rows[0].sens} percent in fatty breasts and {st.sens2011.rows[3].sens} percent in extremely dense ones, with confidence intervals
          twenty to thirty points wide in the small categories.<Cite id="kerlikowske2011" sources={S} /> Overall, digital screening mammography in the consortium detects {dm.sensitivity} percent of cancers, and tomosynthesis{' '}
          {st.bcsc_bench.dbt.sensitivity} percent.<Cite id="bcsc_bench" sources={S} /> The BCSC has released a 2.5-million-exam file from which sensitivity by density could be computed directly; it has been requested through the consortium's form, and
          the methods page describes how it will be incorporated when received.
        </p>
        <p>
          Dose has the smaller effect in these images. The pair below shows the same virtual breast with the same 7 mm mass at the clinical dose and at one fifth of it: the low-dose image is noisier,
          but in these images the visibility of the mass is governed by density rather than by dose.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">Dose</p>
        <h3 className="display text-xl font-medium mb-3">The same breast at the clinical dose and at one fifth of it</h3>
        <DosePair file={data} />
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Risk: cancer rates by density</h2>
        <p>
          The second clause of the mandated sentence, "also raises the risk of developing breast cancer", describes an association distinct from the masking effect. Counting cancers diagnosed within a year of a screening
          mammogram in the consortium's public risk file, {fmtN(st.bcsc_risk.exams)} exams from {st.bcsc_risk.years}, the rate per thousand rises from{' '}
          {st.bcsc_risk.by_density[0].per1000} in fatty breasts to {st.bcsc_risk.by_density[2].per1000} in heterogeneously dense ones, and remains at approximately that level in the extremely dense category, which is small and
          younger on average.<Cite id="bcsc_risk" sources={S} /> Within each age band the gradient is steeper.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f4', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">Cancers found within a year</p>
        <h3 className="display text-xl font-medium mb-1">Breast cancers per 1,000 screening mammograms, by density and age</h3>
        <p className="text-xs text-ink-3 mb-3">Computed here from the BCSC risk estimation dataset ({st.bcsc_risk.years}); {st.bcsc_risk.note}<Cite id="bcsc_risk" sources={S} /></p>
        <DensityBars rows={st.bcsc_risk.by_age.map(r => ({ label: r.age, v: r.per1000 }))} unit="per 1,000" />
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <p>
          Density is one risk factor among several, and the consortium concluded that it should not determine supplemental screening on its own: about half of women with dense breasts have a
          low to average five-year risk, and their interval cancer rates remained below one per thousand.<Cite id="kerlikowske2015" sources={S} /> The US Preventive Services Task Force, in April 2024, found the
          evidence insufficient to determine whether supplemental ultrasound or MRI benefits women whose only risk indicator is density.<Cite id="uspstf2024" sources={S} /> The density category in a report is, as the mandated text states, a prompt for discussion with a clinician rather than a determination of risk.
        </p>
        <h2 className="display text-3xl font-medium mb-4 mt-10">The mandated report wording</h2>
        <p>
          The federal rule requires that every patient receive one of two paragraphs, verbatim.<Cite id="fda_rule" sources={S} /> It took effect on 10 September 2024, after years in which state laws varied in their wording and some states required no notification.<Cite id="fda_press" sources={S} />
        </p>
        <div className="my-5 space-y-4 text-base">
          <blockquote className="border-l-2 border-hairline pl-4 text-ink-2"><span className="eyebrow block mb-1">Not dense (A or B)</span>{st.fda.lay_not_dense}</blockquote>
          <blockquote className="border-l-2 border-berry pl-4"><span className="eyebrow block mb-1">Dense (C or D)</span>{st.fda.lay_dense}</blockquote>
        </div>
      </>
    ) },
    { type: 'text', id: 't6', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Method</h2>
        <p>
          The images are from M-SYNTH, a public domain dataset released by the FDA's imaging division in 2023: virtual breasts in the four density categories, some containing a single round mass of 5,
          7 or 9 mm, imaged by Monte Carlo X-ray simulation of a real mammography system.<Cite id="msynth" sources={S} /> A script retrieved a fixed sample of {data.msynth.cases.length} images, retained the lesion
          coordinates supplied with the dataset, windowed and cropped them for display, and wrote one table. No image was retouched. The BCSC figures are computed from the consortium's public
          risk file or transcribed from its benchmark tables, and every published figure is linked to its source paper. Details are given on the <Link to="/dense-breast/methods">methods page</Link>; the case table and
          every statistic are on the <Link to="/dense-breast/data">data page</Link>.
        </p>
        <p className="text-sm text-ink-2">
          Limitations: the images are simulations, with one view per breast, round masses only and no calcifications, viewed compressed on an ordinary screen by a reader who is not a radiologist. The
          finder demonstrates the effect of density on an image. It cannot estimate how often a radiologist would miss a real cancer, and it does not constitute screening advice.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f5', size: 'flow', body: (
      <>
        <h3 className="display text-xl font-medium mb-4">Sources</h3>
        <SourceList sources={S} />
      </>
    ) },
  ] : []
  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 6</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">Breast density, and what a mammogram can miss</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          Synthetic mammograms from the FDA at four breast densities, some with a mass and some without. The reader may attempt to locate the mass; the screening data that follow describe interval cancer
          and cancer rates by density category.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#finder" onClick={jumpTo('finder')} className="btn btn-solid">Try to find the mass</a>
          <Link to="/dense-breast/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the images…</p>}
      {data && <Finder file={data} />}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/dense-breast" />
    </div>
  )
}
