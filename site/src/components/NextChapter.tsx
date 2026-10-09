import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'

/** Footer link from a chapter to the one after it; the last chapter points back to the record. */
export default function NextChapter({ slug }: { slug: string }) {
  const i = CHAPTERS.findIndex(c => c.slug === slug)
  const next = i >= 0 ? CHAPTERS[i + 1] : undefined
  return (
    <section className="mx-auto max-w-3xl px-4 pt-14 pb-4 text-center">
      {next ? (
        <Link to={`/chapters/${next.slug}`} className="group inline-flex flex-col items-center gap-2 rounded-3xl bg-white/70 px-8 py-6 shadow-[0_1px_0_rgba(139,30,75,0.06),0_30px_60px_-40px_rgba(139,30,75,0.35)] transition hover:bg-white hover:-translate-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">Next · Chapter {next.n}</span>
          <span className="display text-2xl font-medium text-ink group-hover:text-berry transition">{next.title} <span aria-hidden>→</span></span>
        </Link>
      ) : (
        <Link to="/record" className="group inline-flex flex-col items-center gap-2 rounded-3xl bg-white/70 px-8 py-6 shadow-[0_1px_0_rgba(139,30,75,0.06),0_30px_60px_-40px_rgba(139,30,75,0.35)] transition hover:bg-white hover:-translate-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">That is the last chapter</span>
          <span className="display text-2xl font-medium text-ink group-hover:text-berry transition">Look up a condition across all six <span aria-hidden>→</span></span>
        </Link>
      )}
    </section>
  )
}
