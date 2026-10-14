const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
    <h2 className="eyebrow pt-1">{title}</h2>
    <div className="text-[17px] leading-[1.75] text-ink space-y-4">{children}</div>
  </section>
)

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-16">
      <header className="pb-8">
        <p className="eyebrow">About</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">About this project</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          A series of analyses of public data on women's health, with the code and sources published alongside each one.
        </p>
      </header>

      <Section title="What it is">
        <p>The Women's Health Record is a series of data chapters and interactive experiments on where medicine treats women and men differently: who is studied, who is dosed, who waits longest, whose diseases are funded, and what the public record holds on breast screening.</p>
        <p>Each chapter is an original analysis of a public dataset, published with its full method and a link from every number to its source. Chapters are added one at a time, alongside essays on <a href="https://substack.com/@thewomenshealthrecord" target="_blank" rel="noreferrer">Substack</a>.</p>
      </Section>

      <Section title="How to read it">
        <p>The charts show patterns in the evidence; they are not verdicts on individual drugs or clinicians. Where a number could be misread, the chapter says so in the text rather than in a footnote.</p>
        <p>Nothing here is medical advice. Readers with questions about a drug they take should discuss the chart with their doctor rather than draw a conclusion from it.</p>
      </Section>

      <Section title="Who">
        <p>The Women's Health Record is written, analysed and built by Lucy LePoidevin. The data pipelines, the charts and the text are hers; the datasets belong to the public agencies and researchers who collected them, and are credited under every chart.</p>
      </Section>

      <Section title="Sources">
        <p>Only official or peer-reviewed datasets. Chapters: FDA approval records, adverse-event reports and drug labels; the CDC's emergency department survey and body-measurement reference data; NIH funding data; WHO burden estimates; ClinicalTrials.gov; the National Cancer Institute's SEER registries; and PubMed's index. Experiments: OpenNeuro MRI datasets from the Jacobs laboratory at UC Santa Barbara; published pharmacokinetic studies and FDA labels; the EU endocrine disruptor lists and California's Proposition 65 list; the FDA's M-SYNTH synthetic mammograms, certified facility list and device authorisation documents; the Breast Cancer Surveillance Consortium's public files; and US Census Bureau population data. Every retrieval date is recorded, and every chart can be regenerated from the repository.</p>
      </Section>

    </div>
  )
}
