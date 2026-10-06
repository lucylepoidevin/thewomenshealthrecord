import { useSources } from '../lib/useSources'

export default function SourceList({ only }: { only?: string[] }) {
  const { sources } = useSources()
  const list = only ? sources.filter(s => only.includes(s.id)) : sources
  return (
    <ol className="text-sm text-ink-2 space-y-2">
      {list.map(s => (
        <li key={s.id} id={`src-${s.id}`} className="pl-1">
          <span className="font-medium text-ink">[{sources.indexOf(s) + 1}]</span>{' '}
          <a href={s.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2">{s.title}</a>
          {' '}<span className="text-ink-3">— {s.publisher}{s.retrieved ? `, retrieved ${s.retrieved}` : ''}</span>
          {s.note && <div className="text-ink-3 text-xs mt-0.5">{s.note}</div>}
        </li>
      ))}
    </ol>
  )
}
