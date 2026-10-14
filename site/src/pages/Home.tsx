import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'
import { EXPERIMENTS } from '../experiments/list'

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6">
        <div className="max-w-[42rem]">
          <h1 className="display text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">The Women's Health Record</h1>
          <p className="mt-4 text-[17px] text-ink-2 leading-relaxed">
            Public data on how medicine measures, tests and treats women, re-analysed from the primary sources. Six chapters and eight interactive experiments.
            Every number links to where it came from.
          </p>
          <p className="mt-4 text-sm text-ink-3">
            <Link to={`/chapters/${CHAPTERS[0].slug}`} className="text-berry underline underline-offset-4">Start with chapter 1</Link>
            <span className="mx-2">·</span>
            <Link to="/record" className="text-berry underline underline-offset-4">Look up a condition</Link>
            <span className="mx-2">·</span>
            <Link to="/methods" className="text-berry underline underline-offset-4">Methods</Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <div>
          <h2 className="display text-2xl font-medium">Chapters</h2>
          <ol className="mt-3">
            {CHAPTERS.map(c => (
              <li key={c.slug} className="border-t border-hairline py-4">
                <Link to={`/chapters/${c.slug}`} className="group block">
                  <p className="text-sm text-ink-3">Chapter {c.n}</p>
                  <h3 className="display mt-0.5 text-xl font-medium leading-snug text-ink group-hover:text-berry">{c.title}</h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">{c.dek}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="display text-2xl font-medium"><Link to="/experiments" className="hover:text-berry">Experiments</Link></h2>
          <ol className="mt-3">
            {EXPERIMENTS.map(e => (
              <li key={e.path} className="border-t border-hairline py-4">
                <Link to={e.path} className="group block">
                  <p className="text-sm text-ink-3">Experiment {e.n}</p>
                  <h3 className="display mt-0.5 text-xl font-medium leading-snug text-ink group-hover:text-berry">{e.title}</h3>
                  <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">{e.dek}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
