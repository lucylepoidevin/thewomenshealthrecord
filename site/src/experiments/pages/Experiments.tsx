import { Link } from 'react-router-dom'
import { EXPERIMENTS } from '../list'
import ThreeBrains from '../ThreeBrains'

/** The index of the experiments: four cards, one shared figure, and what they add up to. */
export default function Experiments() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-10 sm:pt-28 text-center fade-up">
        <p className="eyebrow">Experiments</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl font-light leading-[1.05]">
          The chapters count what medicine does to women.<br />
          <span className="italic font-medium text-berry">The experiments</span> let you watch it happen.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          Four interactive studies built from public data with one published method, each on a single person or a single published number, each honest about what one person can and cannot show.
          Three brains and three hormonal clocks: a day, a month, a pregnancy. Then the dose chart, which is what medicine does with that.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <ol className="grid gap-4 sm:grid-cols-2">
          {EXPERIMENTS.map(e => (
            <li key={e.path}>
              <Link to={e.path} className="group block h-full rounded-3xl bg-white/50 p-6 sm:p-8 transition hover:bg-white/70 hover:-translate-y-0.5">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-berry px-2 text-xs font-bold text-[#180C12]">{e.n}</span>
                <h2 className="display mt-4 text-2xl sm:text-3xl font-medium leading-snug text-ink group-hover:text-berry transition">{e.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{e.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="graphic-card p-4 sm:p-7">
          <p className="eyebrow mb-1">Three brains on one scale</p>
          <h2 className="display text-2xl sm:text-3xl font-medium mb-4">A day, a month, a pregnancy</h2>
          <ThreeBrains />
        </div>
      </section>

      <section className="prose-step mx-auto max-w-[42rem] px-4 py-6 text-[18px] leading-[1.75] text-ink">
        <h2 className="display text-3xl font-medium mb-4">What they add up to</h2>
        <p>
          Put the three brains on the same axis and the scale of each clock is plain. Across a menstrual cycle, with estradiol swinging twelve-fold and progesterone several-hundred-fold, her whole
          brain held within a third of a percent of itself: at this resolution, the cycle is quieter than the scanner. Across his day, the brain shrank by half a percent from morning to evening, every
          day, as testosterone and cortisol fell. Across a pregnancy, with estradiol at fifty times a cycle's peak, it gave up two to three percent, and took two years to get it back.
        </p>
        <p>
          The same hormones on three timescales, and the brain answering on all three, in proportion. That is not a story anyone could tell from a single study, and nobody had put the three public
          datasets through one pipeline before. Each page says what its person cannot stand for. Together they say something the chapters measure from the other side: the hormonal body is not noise
          around a male default, it is a system with its own rhythms, and medicine mostly has not measured it.
        </p>
        <p>
          The fourth experiment is the consequence. When the drugs that <em>have</em> been measured in both sexes are drawn in both bodies, most run higher in hers. The dose chart puts the published
          numbers in your hands; the <Link to="/chapters/tested-on-men">chapter on trials</Link> counts how rarely those numbers exist.
        </p>
        <p className="text-sm text-ink-2">
          All source data is public (OpenNeuro datasets ds002674, ds005299 and ds005115 from the Jacobs lab at UC Santa Barbara; primary pharmacology papers and FDA labels for the dose chart).
          Every number on every page links to its source; every pipeline is published. Nothing here is medical advice.
        </p>
      </section>
    </div>
  )
}
