import { Link } from 'react-router-dom'
import { EXPERIMENTS } from '../list'
import ThreeBrains from '../ThreeBrains'

/** The index of the experiments: one card each, one shared figure, and what they add up to. */
export default function Experiments() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-8"><div className="max-w-[42rem]">
        <p className="eyebrow">Experiments</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">
          Experiments
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          Three single-person brain imaging datasets from the same lab run through one measurement pipeline, a drug-level simulator built from published
          sex-specific pharmacology, an ingredient checker against the official hormone-disruptor lists, and three mammography studies: the FDA's synthetic mammograms at four
          breast densities, every certified facility on a county map, and what the FDA's summaries say about who mammography AI was tested on. Each page states what its data can and cannot show.
        </p>
      </div></section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <ol className="grid gap-4 sm:grid-cols-2">
          {EXPERIMENTS.map(e => (
            <li key={e.path}>
              <Link to={e.path} className="group block h-full rule pt-5 pb-4">
                <span className="eyebrow">Experiment {e.n}</span>
                <h2 className="display mt-2 text-2xl sm:text-3xl font-medium leading-snug text-ink group-hover:text-berry transition">{e.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{e.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="graphic-card p-4 sm:p-7">
          <p className="eyebrow mb-1">Three brains on one scale</p>
          <h2 className="display text-2xl sm:text-3xl font-medium mb-4">Whole-brain volume across the three studies</h2>
          <ThreeBrains />
        </div>
      </section>

      <section className="prose-step mx-auto max-w-[42rem] px-4 py-6 text-[18px] leading-[1.75] text-ink">
        <h2 className="display text-3xl font-medium mb-4">The three brains on one axis</h2>
        <p>
          Plotted on the same axis, the three brains vary on three different scales. Across a menstrual cycle, with estradiol rising twelve-fold and progesterone several hundred-fold, the woman's whole
          brain stayed within a third of a percent of its mean, which is less than the scan-to-scan noise. Across the man's day, the brain was about half a percent smaller at 8 pm than at 7 am,
          on every day measured. Across a pregnancy, it was two to three percent smaller in the third trimester and took about two years to return.
        </p>
        <p>
          These are three single people, so none of the pages generalises beyond its own subject, and each one says so. What the comparison adds is a common scale: the same model, the same
          pipeline and the same axis for the three public datasets, which had not been run together before.
        </p>
        <p>
          The dose simulator uses the drugs that have been measured in both sexes; for most of them the same dose gives a higher blood level in a woman. The{' '}
          <Link to="/chapters/tested-on-men">chapter comparing women in drug trials with women in adverse-event reports</Link> counts how rarely those measurements exist. The three mammography experiments take the same approach to screening: the FDA's
          own synthetic images, the FDA's facility list, and the FDA's device summaries, read in full.
        </p>
        <p className="text-sm text-ink-2">
          All source data is public (OpenNeuro datasets ds002674, ds005299 and ds005115 from the Jacobs lab at UC Santa Barbara; primary pharmacology papers and FDA labels for Experiment 4).
          Every number on every page links to its source; every pipeline is published. Nothing here is medical advice.
        </p>
      </section>
    </div>
  )
}
