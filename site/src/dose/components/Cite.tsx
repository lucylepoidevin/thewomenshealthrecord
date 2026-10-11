import { jumpTo } from '../../cycling/lib/jump'
import { numbered } from '../lib/sources'
import type { DrugsFile } from '../lib/data'

export function Cite({ file, id }: { file: DrugsFile; id: string }) {
  const s = numbered(file.sources).find(x => x.id === id)
  if (!s) return null
  return <sup className="cite"><a href={`#dsrc-${s.n}`} onClick={jumpTo(`dsrc-${s.n}`)} title={s.text}>[{s.n}]</a></sup>
}

export function SourceList({ file }: { file: DrugsFile }) {
  return (
    <ol className="space-y-2 text-sm text-ink-2 leading-relaxed">
      {numbered(file.sources).map(s => (
        <li key={s.id} id={`dsrc-${s.n}`} className="flex gap-3">
          <span className="w-5 shrink-0 text-right font-semibold text-berry">{s.n}</span>
          <span>{s.text} <a href={s.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2 break-all">{s.url.replace(/^https?:\/\//, '').slice(0, 70)}</a></span>
        </li>
      ))}
    </ol>
  )
}
