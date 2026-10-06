import { useSources } from '../lib/useSources'

/** Inline numbered citation. `id` must match an entry in sources.json. */
export default function Cite({ id }: { id: string }) {
  const { index } = useSources()
  const n = index[id]
  return (
    <sup className="cite ml-0.5">
      <a href={`#src-${id}`} title={id}>[{n ?? '?'}]</a>
    </sup>
  )
}
