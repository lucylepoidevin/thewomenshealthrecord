import { Link } from 'react-router-dom'
import type { Chapter } from '../lib/chapters'

export default function ComingSoon({ chapter }: { chapter: Chapter }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="display text-berry text-sm font-semibold">Chapter {chapter.n}</p>
      <h1 className="display mt-3 text-4xl font-medium">{chapter.title}</h1>
      <p className="mt-4 text-ink-2 max-w-xl mx-auto leading-relaxed">{chapter.dek}</p>
      <p className="mt-8 text-sm uppercase tracking-widest text-ink-3">In progress</p>
      <Link to="/chapters/tested-on-men" className="inline-block mt-8 rounded-full bg-berry text-white px-5 py-2 text-sm hover:bg-rose">Read Chapter 1 →</Link>
    </div>
  )
}
