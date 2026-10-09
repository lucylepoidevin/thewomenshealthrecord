import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 sm:pt-32 text-center fade-up">
        <p className="eyebrow">A research project by Lucy LePoidevin</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.02]">
          Medicine was built around a <span className="italic font-medium text-berry">male default</span>.
          This is the record of what that costs women.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          Each chapter is an original analysis of public data: FDA trial records, adverse-event reports,
          emergency-room logs, research funding, trial registries, drug labels, the research literature itself. Every number links to its source. Every method is published.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/chapters/tested-on-men" className="inline-flex items-center gap-2 rounded-full bg-berry px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(139,30,75,0.6)] transition hover:bg-rose">Start with Chapter 1 <span aria-hidden>→</span></Link>
          <Link to="/record" className="inline-flex items-center gap-2 rounded-full border border-berry/30 bg-white/60 px-6 py-3 text-sm font-semibold text-berry transition hover:bg-white">Look up a condition</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="display text-2xl font-medium">Chapters</h2>
          <span className="text-xs tracking-wide text-ink-3">Six chapters, each an original analysis</span>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map(c => (
            <li key={c.slug}>
              <Link
                to={`/chapters/${c.slug}`}
                className={`group block h-full rounded-3xl p-6 transition ${c.status === 'live' ? 'bg-white/70 shadow-[0_1px_0_rgba(139,30,75,0.06),0_30px_60px_-40px_rgba(139,30,75,0.35)] hover:bg-white hover:-translate-y-0.5' : 'bg-white/35 hover:bg-white/60'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${c.status === 'live' ? 'bg-berry text-white' : 'bg-blush-2 text-berry'}`}>{c.n}</span>
                  {c.status === 'soon' ? <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">Coming soon</span> : <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-berry">Read now</span>}
                </div>
                <h3 className="display mt-4 text-2xl font-medium leading-snug group-hover:text-berry transition">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{c.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
