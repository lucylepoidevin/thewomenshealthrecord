export default function Corrections() {
  const items = [
    { date: '6 October 2026', chapter: 'Chapter 2', what: 'The first published version read the survey\'s sex variable backwards (NHAMCS codes 1 as female and 2 as male; we had assumed the reverse). Every comparison in that version was reversed. The chapter was withdrawn within minutes of the error being found, rebuilt on the correct coding, and republished the same day with the correction noted on the methods page. No other chapter was affected.' },
    { date: '6 October 2026', chapter: 'Chapter 1', what: 'Three table layouts in the FDA snapshot pages were misread by the first parser (a bare total cell, two-arm tables with no total column, and overlapping safety and efficacy tables). Shares moved by less than two points for the drugs affected; participant counts moved more and are no longer shown on charts. The cross-check against an independent compilation is reported on the methods page.' },
  ]
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 fade-up">
      <header className="text-center pb-10">
        <p className="eyebrow">Corrections</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">What we got wrong</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Every substantive error we find or are told about is listed here, with what changed. A record that hides its corrections is not a record.</p>
      </header>
      {items.map(i => (
        <section key={i.date + i.chapter} className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
          <div><div className="eyebrow">{i.chapter}</div><div className="mt-1 text-sm text-ink-3">{i.date}</div></div>
          <p className="text-[16px] leading-[1.7] text-ink">{i.what}</p>
        </section>
      ))}
      <p className="mt-10 text-sm text-ink-2">Found something? Open an issue on <a className="text-berry underline underline-offset-2" href="https://github.com/lucylepoidevin/thewomenshealthrecord/issues" target="_blank" rel="noreferrer">GitHub</a>.</p>
    </div>
  )
}
