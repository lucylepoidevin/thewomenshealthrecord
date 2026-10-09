import { Link } from 'react-router-dom'
import { CHAPTERS, chapterRef, type Chapter } from '../lib/chapters'

export default function ComingSoon({ chapter }: { chapter: Chapter }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="eyebrow">Chapter {chapter.n}</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl font-light">{chapter.title}</h1>
      <p className="mt-4 text-ink-2 max-w-xl mx-auto leading-relaxed">{chapter.dek}</p>
      <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">In progress</p>
      <Link to={`/chapters/${CHAPTERS[0].slug}`} className="inline-block mt-8 rounded-full bg-berry text-white px-5 py-2 text-sm hover:bg-rose">Read {chapterRef(CHAPTERS[0].slug)} →</Link>
    </div>
  )
}
