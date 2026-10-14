import { Link } from 'react-router-dom'
import { CHAPTERS } from '../lib/chapters'
import { EXPERIMENTS } from '../experiments/list'

const BASE = import.meta.env.BASE_URL
const thumb = (name: string) => `${BASE}home/${name}.png`

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center">
        <div>
          <h1 className="display text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">The Women's Health Record</h1>
          <p className="mt-4 text-[17px] text-ink-2 leading-relaxed">
            Public data on how medicine measures, tests and treats women, re-analysed from the primary sources. Six chapters and eight interactive experiments,
            by Lucy LePoidevin. Every number links to where it came from.
          </p>
          <p className="mt-4 text-sm text-ink-3">
            <Link to={`/chapters/${CHAPTERS[0].slug}`} className="text-berry underline underline-offset-4">Start with chapter 1</Link>
            <span className="mx-2">·</span>
            <Link to="/record" className="text-berry underline underline-offset-4">Look up a condition</Link>
            <span className="mx-2">·</span>
            <Link to="/methods" className="text-berry underline underline-offset-4">Methods</Link>
          </p>
        </div>
        <Link to="/mammography-access" className="block overflow-hidden rounded-lg border border-hairline bg-[#121014]">
          <img src={thumb('mammography-access')} alt="Every county in the United States coloured by certified mammography facilities per ten thousand women aged 40 to 74" className="block w-full" />
          <p className="px-4 py-2.5 text-[13px] text-[#B9AEB4]">Certified mammography facilities per 10,000 women aged 40 to 74, by county. Experiment 7.</p>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="display text-2xl font-medium">Chapters</h2>
        <ol className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map(c => (
            <li key={c.slug} className="border-t border-hairline pt-4">
              <Link to={`/chapters/${c.slug}`} className="group block">
                <div className="overflow-hidden rounded-md border border-hairline bg-white"><img src={thumb(`ch-${c.slug}`)} alt="" className="block w-full aspect-[16/10] object-cover object-top" /></div>
                <p className="mt-3 text-sm text-ink-3">Chapter {c.n}</p>
                <h3 className="display mt-1 text-xl font-medium leading-snug text-ink group-hover:text-berry">{c.title}</h3>
                <p className="mt-1 text-[14px] text-ink-2 leading-relaxed">{c.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 pb-20">
        <h2 className="display text-2xl font-medium"><Link to="/experiments" className="hover:text-berry">Experiments</Link></h2>
        <p className="mt-1 text-sm text-ink-3">Interactive, built on public data. These pages use the dark colourway.</p>
        <ol className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIMENTS.map(e => (
            <li key={e.path} className="border-t border-hairline pt-4">
              <Link to={e.path} className="group block">
                <div className="overflow-hidden rounded-md border border-hairline bg-[#121014]"><img src={thumb(e.path.slice(1))} alt="" className="block w-full aspect-[16/10] object-cover object-center" /></div>
                <p className="mt-3 text-sm text-ink-3">Experiment {e.n}</p>
                <h3 className="display mt-1 text-lg font-medium leading-snug text-ink group-hover:text-berry">{e.title}</h3>
                <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">{e.short === e.label ? e.dek.split('. ')[0] + '.' : e.dek}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
