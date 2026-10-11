import { Link } from 'react-router-dom'
import { EXPERIMENTS } from './list'

/** Footer of every experiment page: previous, next, and the index. */
export default function ExperimentNav({ current }: { current: string }) {
  const i = EXPERIMENTS.findIndex(e => e.path === current)
  const prev = EXPERIMENTS[(i - 1 + EXPERIMENTS.length) % EXPERIMENTS.length]
  const next = EXPERIMENTS[(i + 1) % EXPERIMENTS.length]
  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 pb-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] items-stretch">
        <Link to={prev.path} className="group rounded-2xl bg-white/50 p-4 transition hover:bg-white/70">
          <p className="eyebrow">← Experiment {prev.n}</p>
          <p className="display mt-1 text-lg font-medium text-ink group-hover:text-berry">{prev.title}</p>
        </Link>
        <Link to="/experiments" className="self-center rounded-full border border-berry/30 px-5 py-2 text-sm font-semibold text-berry transition hover:bg-white/60">All experiments</Link>
        <Link to={next.path} className="group rounded-2xl bg-white/50 p-4 text-right transition hover:bg-white/70">
          <p className="eyebrow">Experiment {next.n} →</p>
          <p className="display mt-1 text-lg font-medium text-ink group-hover:text-berry">{next.title}</p>
        </Link>
      </div>
    </section>
  )
}
