import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'
import { DATA, MI, fmtN, useDeserts } from '../lib/data'

export default function MammographyAccessData() {
  const { data } = useDeserts()
  const [q, setQ] = useState('')
  if (!data) return <p className="mx-auto max-w-2xl px-4 pt-16 text-center text-sm text-ink-3">Loading…</p>
  const rows = data.counties.filter(c => !q || `${c.name} ${c.state}`.toLowerCase().includes(q.toLowerCase())).slice(0, 400)
  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 7</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Data: mammography access</h1>
      <p className="mt-4 text-ink-2 leading-relaxed">All data used by the page: <a className="text-berry underline underline-offset-2" href={`${DATA}deserts.json`}>deserts.json</a> (every county and state, generated {data.generated}; distances in the file are kilometres) and <a className="text-berry underline underline-offset-2" href={`${DATA}us.json`}>us.json</a> (county and state boundaries, TopoJSON).</p>
      <h2 className="display mt-12 text-2xl font-medium">Counties ({fmtN(data.counties.length)})</h2>
      <input className="ctl mt-3 w-full max-w-sm" placeholder="Search a county or state code" value={q} onChange={e => setQ(e.target.value)} />
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">FIPS</th><th className="py-1 pr-3">County</th><th className="py-1 pr-3">State</th><th className="py-1 pr-3 text-right">Women 40 to 74</th><th className="py-1 pr-3 text-right">Facilities</th><th className="py-1 pr-3 text-right">Per 10,000</th><th className="py-1 pr-3 text-right">Nearest, miles</th></tr></thead>
          <tbody>{rows.map(c => <tr key={c.fips} className="border-t border-hairline/70"><td className="py-1 pr-3 tabular-nums">{c.fips}</td><td className="py-1 pr-3">{c.name}</td><td className="py-1 pr-3">{c.state}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(c.women)}</td><td className="py-1 pr-3 text-right tabular-nums">{c.facilities}</td><td className="py-1 pr-3 text-right tabular-nums">{c.per10k?.toFixed(2) ?? ''}</td><td className="py-1 pr-3 text-right tabular-nums">{c.nearest_km == null ? '' : Math.round(c.nearest_km * MI)}</td></tr>)}</tbody>
        </table>
      </div>
      {rows.length === 400 && <p className="mt-2 text-xs text-ink-3">Showing the first 400; search to narrow, or open the JSON.</p>}
      <h2 className="display mt-12 text-2xl font-medium">Sources</h2>
      <div className="mt-3"><SourceList sources={data.sources} /></div>
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/mammography-access" className="text-berry underline underline-offset-2">Experiment 7</Link>.</p>
    </div>
  )
}
