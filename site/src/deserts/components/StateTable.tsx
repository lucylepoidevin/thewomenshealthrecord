import { useState } from 'react'
import { fmtN, type StateRow } from '../lib/data'

type Key = 'name' | 'women' | 'facilities' | 'per10k' | 'counties_without' | 'women_without'
/** Every state, sortable. */
export default function StateTable({ rows }: { rows: StateRow[] }) {
  const [key, setKey] = useState<Key>('per10k'); const [asc, setAsc] = useState(true)
  const sorted = [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (asc ? 1 : -1))
  const H = ({ k, label, right }: { k: Key; label: string; right?: boolean }) => (
    <th className={`py-1 pr-3 cursor-pointer whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${key === k ? 'text-ink' : 'text-ink-3'}`} onClick={() => { if (key === k) setAsc(a => !a); else { setKey(k); setAsc(k === 'name') } }}>{label}{key === k ? (asc ? ' ↑' : ' ↓') : ''}</th>
  )
  return (
    <div className="table-wrap">
      <table className="w-full text-xs">
        <thead><tr><H k="name" label="State" /><H k="women" label="Women 40 to 74" right /><H k="facilities" label="Facilities" right /><H k="per10k" label="Per 10,000" right /><H k="counties_without" label="Counties with none" right /><H k="women_without" label="Women in them" right /></tr></thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.state} className="border-t border-hairline/70">
              <td className="py-1 pr-3">{r.name}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.women)}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.facilities)}</td>
              <td className="py-1 pr-3 text-right tabular-nums">{r.per10k.toFixed(2)}</td><td className="py-1 pr-3 text-right tabular-nums">{r.counties_without} of {r.counties}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.women_without)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
