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
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">About this project</h1>
        <p className="display mx-auto mt-7 max-w-2xl text-xl sm:text-2xl font-light leading-snug text-ink-2">
          Most of what gets said about sex bias in medicine is a handful of statistics repeated until they stop meaning anything.
          This site goes back to the primary data, re-analyses it, and publishes the code.
        </p>
        <p className="mt-6 text-sm tracking-wide text-ink-3">By Lucy Lepoidevin</p>
      </header>

      <Section title="What it is">
        <p>The Women's Health Record is a series of data chapters on where medicine treats women and men differently: who gets studied, who gets dosed, who waits longest, whose diseases get funded.</p>
        <p>Each chapter is an original analysis of a public dataset, published with its full method and a link from every number to its source. Chapters are added one at a time, alongside essays on <a href="https://substack.com/@thewomenshealthrecord" target="_blank" rel="noreferrer">Substack</a>.</p>
      </Section>

      <Section title="How to read it">
        <p>The charts show patterns in the evidence, not verdicts on individual drugs or doctors. Where a number could be misread, the chapter says so in the text rather than in a footnote.</p>
        <p>Nothing here is medical advice. If a chart makes you wonder about a drug you take, bring the chart to your doctor, not a conclusion.</p>
      </Section>

      <Section title="Who">
        <p>The Women's Health Record is written, analysed and built by Lucy Lepoidevin. The data pipelines, the charts and the text are hers; the datasets belong to the public agencies and researchers who collected them, and are credited under every chart.</p>
      </Section>

      <Section title="Sources">
        <p>Only official or peer-reviewed datasets: FDA approval records, adverse-event reports and drug labels; the CDC's emergency department survey and body-measurement reference data; NIH funding data; WHO burden estimates; ClinicalTrials.gov; the National Cancer Institute's SEER registries; and PubMed's index. Every retrieval date is recorded, and every chart can be regenerated from the repository.</p>
      </Section>

    </div>
  )
}
