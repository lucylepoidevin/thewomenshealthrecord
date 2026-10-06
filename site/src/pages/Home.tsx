import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.2em] text-berry font-semibold">A Lucca Labs research project</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05] max-w-4xl">
          Medicine was built around a <span className="italic font-medium text-berry">male default</span>.
          This is the record of what that costs women.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-2 leading-relaxed">
          Each chapter is an original analysis of public data: FDA trial records, adverse-event reports,
          emergency-room logs, research funding. Every number links to its source. Every method is published.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="display text-2xl font-medium mb-6">Chapters</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {CHAPTERS.map(c => (
            <li key={c.slug}>
              <Link
                to={`/chapters/${c.slug}`}
                className={`block h-full rounded-2xl border p-6 transition ${c.status === 'live' ? 'border-rose/60 bg-white/70 hover:bg-white hover:shadow-[0_8px_30px_rgba(139,30,75,0.10)]' : 'border-hairline bg-blush-2/40 hover:bg-blush-2/70'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="display text-berry text-sm font-semibold">Chapter {c.n}</span>
                  {c.status === 'soon' && <span className="text-[11px] uppercase tracking-wider text-ink-3">Coming soon</span>}
                </div>
                <h3 className="display mt-2 text-2xl font-medium leading-snug">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{c.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
