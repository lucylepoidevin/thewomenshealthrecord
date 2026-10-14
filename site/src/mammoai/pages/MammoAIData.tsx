import { Link } from 'react-router-dom'
import DeviceTable from '../components/DeviceTable'
import { SourceList } from '../components/Cite'
import { DATA, useAudit } from '../lib/data'

export default function MammoAIData() {
  const { data } = useAudit()
  if (!data) return <p className="mx-auto max-w-2xl px-4 pt-16 text-center text-sm text-ink-3">Loading…</p>
  const s = data.summary
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 8</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Data: mammography AI</h1>
      <p className="mt-4 text-ink-2 leading-relaxed">All data used by the page: <a className="text-berry underline underline-offset-2" href={`${DATA}audit.json`}>audit.json</a> (every coded record with its quotes and the FDA document link, generated {data.generated}). The coding schema and the raw text of every document are in the project folder.</p>
      <h2 className="display mt-12 text-2xl font-medium">By period</h2>
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Decisions</th><th className="py-1 pr-3 text-right">n</th><th className="py-1 pr-3 text-right">Race reported</th><th className="py-1 pr-3 text-right">Density</th><th className="py-1 pr-3 text-right">Age</th><th className="py-1 pr-3 text-right">Country named</th><th className="py-1 pr-3 text-right">US named</th><th className="py-1 pr-3 text-right">Size stated</th><th className="py-1 pr-3 text-right">Median size</th><th className="py-1 pr-3 text-right">Subgroups</th><th className="py-1 pr-3 text-right">Reader study</th></tr></thead>
          <tbody>{s.by_period.map(p => <tr key={p.period} className="border-t border-hairline/70"><td className="py-1 pr-3">{p.period}</td><td className="py-1 pr-3 text-right tabular-nums">{p.n}</td>{[p.race, p.density, p.age, p.countries, p.us, p.size_stated].map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v == null ? '' : `${v}%`}</td>)}<td className="py-1 pr-3 text-right tabular-nums">{p.median_size ?? ''}</td><td className="py-1 pr-3 text-right tabular-nums">{p.subgroups == null ? '' : `${p.subgroups}%`}</td><td className="py-1 pr-3 text-right tabular-nums">{p.reader_study == null ? '' : `${p.reader_study}%`}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-3">Shares in this table are of all authorisations in the period, including documents that describe no test.</p>
      <h2 className="display mt-12 text-2xl font-medium">Every authorisation ({s.n})</h2>
      <div className="mt-3"><DeviceTable devices={data.devices} /></div>
      <h2 className="display mt-12 text-2xl font-medium">Sources</h2>
      <div className="mt-3"><SourceList sources={data.sources} /></div>
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/mammography-ai" className="text-berry underline underline-offset-2">Experiment 8</Link>.</p>
    </div>
  )
}
