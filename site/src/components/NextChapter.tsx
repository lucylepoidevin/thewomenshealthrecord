import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'

/** Small right-aligned link to the next chapter, shown before the sources; the last chapter points to the record. */
export default function NextChapter({ slug }: { slug: string }) {
  const i = CHAPTERS.findIndex(c => c.slug === slug)
  const next = i >= 0 ? CHAPTERS[i + 1] : undefined
  const cls = 'inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(139,30,75,0.6)] transition hover:bg-rose'
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 flex justify-end">
      {next ? <Link to={`/chapters/${next.slug}`} className={cls}>Next: {next.title} <span aria-hidden>→</span></Link> : <Link to="/record" className={cls}>Look up a condition <span aria-hidden>→</span></Link>}
    </div>
  )
}
