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
        <Link to={prev.path} className="group rule pt-3">
          <p className="eyebrow">← Experiment {prev.n}</p>
          <p className="display mt-1 text-lg font-medium text-ink group-hover:text-berry">{prev.title}</p>
        </Link>
        <Link to="/experiments" className="btn self-center">All experiments</Link>
        <Link to={next.path} className="group rule pt-3 text-right">
          <p className="eyebrow">Experiment {next.n} →</p>
          <p className="display mt-1 text-lg font-medium text-ink group-hover:text-berry">{next.title}</p>
        </Link>
      </div>
    </section>
  )
}
