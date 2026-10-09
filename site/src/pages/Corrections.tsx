export default function Corrections() {
  const items = [
    { date: '8 October 2026', chapter: 'Chapter 4', what: 'A verification pass the day after publication found three errors in the first version. The count of trials reporting any result by sex was 142; the rule had also counted trials whose outcome groups were women-only or "male and female" cohorts, and the correct count, requiring a female-named and a separate male-named group, is 92 (0.16%). The share of US trials excluding pregnant women was 47%; the rule missed phrasings such as "patient is pregnant" and pregnancy-test requirements, and the corrected share is 54%. The participant total was 22.3 million; 392 trials whose baseline groups overlap had their people counted more than once, and with those set aside the total is 20.9 million. Disease ratios moved by at most 0.02. Three historical statements were tightened at the same time: results posting has been required since 2008 for FDA-regulated drug and device trials, not for every trial; the FDA recommended rather than required the 1977 exclusion, and in 1993 withdrew it while keeping a presumption that pregnant women would be excluded; and the 2021 comparison study worked by medical specialty, not by disease.' },
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
