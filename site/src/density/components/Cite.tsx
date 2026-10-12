import { jumpTo } from '../../cycling/lib/jump'
import { ORDER, srcNumber, type Source } from '../lib/data'

export default function Cite({ id, sources }: { id: string; sources: Record<string, Source> }) {
  const s = sources[id]
  if (!s) return null
  const n = srcNumber(id, sources)
  return <sup className="cite"><a href={`#dsrc-${n}`} onClick={jumpTo(`dsrc-${n}`)} title={s.text}>[{n}]</a></sup>
}

export function SourceList({ sources }: { sources: Record<string, Source> }) {
  const ids = [...ORDER.filter(i => sources[i]), ...Object.keys(sources).filter(i => !ORDER.includes(i))]
  return (
    <ol className="space-y-2 text-sm text-ink-2 leading-relaxed">
      {ids.map((id, k) => (
        <li key={id} id={`dsrc-${k + 1}`} className="flex gap-3">
          <span className="w-5 shrink-0 text-right font-semibold text-berry">{k + 1}</span>
          <span>{sources[id].text} <a href={sources[id].url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2 break-all">{sources[id].url.replace(/^https?:\/\//, '').slice(0, 72)}</a> Retrieved {sources[id].retrieved}.</span>
        </li>
      ))}
    </ol>
  )
}
