import { SOURCES, src } from '../lib/sources'
import { jumpTo } from '../lib/jump'

/** Superscript citation that jumps to the source list. */
export default function Cite({ id }: { id: string }) {
  const s = src(id)
  return <sup className="cite"><a href={`#src-${s.n}`} onClick={jumpTo(`src-${s.n}`)} title={s.text}>[{s.n}]</a></sup>
}

export function SourceList() {
  return (
    <ol className="space-y-2 text-sm text-ink-2 leading-relaxed">
      {SOURCES.map(s => (
        <li key={s.id} id={`src-${s.n}`} className="flex gap-3">
          <span className="w-5 shrink-0 text-right font-semibold text-berry">{s.n}</span>
          <span>{s.text} <a href={s.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2 break-all">{s.url.replace(/^https?:\/\//, '')}</a></span>
        </li>
      ))}
    </ol>
  )
}
