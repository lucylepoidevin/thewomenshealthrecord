import { Link } from 'react-router-dom'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
    <h2 className="eyebrow pt-1">{title}</h2>
    <div className="text-[17px] leading-[1.75] text-ink space-y-4">{children}</div>
  </section>
)

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 fade-up">
      <header className="text-center pb-12">
        <p className="eyebrow">About</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">A record, not a <span className="italic font-medium text-berry">rallying cry</span>.</h1>
        <p className="display mx-auto mt-7 max-w-2xl text-xl sm:text-2xl font-light leading-snug text-ink-2">
          Most of what gets said about sex bias in medicine is a handful of statistics repeated until they stop meaning anything.
          This site goes back to the primary data, re-analyses it, and publishes the code.
        </p>
      </header>

      <Section title="What it is">
        <p>The Women's Health Record is a series of data chapters on where medicine treats women and men differently: who gets studied, who gets dosed, who waits longest, whose diseases get funded.</p>
        <p>Each chapter is an original analysis of a public dataset, published with its full method and a link from every number to its source. Chapters are added one at a time, alongside essays on Substack.</p>
      </Section>

      <Section title="Who makes it">
        <p>It is written and built by Lucy Lepoidevin and published by Lucca Labs.</p>
        <p>The pipeline, the charts and the data files are open. If you find an error, open an issue on <a href="https://github.com/lucylepoidevin/thewomenshealthrecord" target="_blank" rel="noreferrer">GitHub</a>; corrections are logged on the <Link to="/methods">methods page</Link>.</p>
      </Section>

      <Section title="How to read it">
        <p>The charts show patterns in the evidence, not verdicts on individual drugs or doctors. Where a number could be misread, the chapter says so in the text rather than in a footnote.</p>
        <p>Nothing here is medical advice. If a chart makes you wonder about a drug you take, bring the chart to your doctor, not a conclusion.</p>
      </Section>

      <Section title="Sources">
        <p>Only official or peer-reviewed datasets: FDA approval records and adverse-event reports, CDC surveys, NIH funding data, ClinicalTrials.gov. Every retrieval date is recorded, and every chart can be regenerated from the repository.</p>
      </Section>

      <div className="pt-10 text-center">
        <Link to="/chapters/tested-on-men" className="inline-flex items-center gap-2 rounded-full bg-berry px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(139,30,75,0.6)] transition hover:bg-rose">Read Chapter 1 <span aria-hidden>→</span></Link>
      </div>
    </div>
  )
}
