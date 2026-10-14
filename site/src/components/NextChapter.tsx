import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'

/** Link to the next chapter, shown before the sources; the last chapter points to the record. */
export default function NextChapter({ slug }: { slug: string }) {
  const i = CHAPTERS.findIndex(c => c.slug === slug)
  const next = i >= 0 ? CHAPTERS[i + 1] : undefined
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 text-[15px]">
      {next ? <Link to={`/chapters/${next.slug}`} className="text-berry underline underline-offset-4">Next chapter: {next.title}</Link> : <Link to="/record" className="text-berry underline underline-offset-4">Look up a condition in the record</Link>}
    </div>
  )
}
