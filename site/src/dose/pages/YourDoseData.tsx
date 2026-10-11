import { DATA, useDrugs, citedRows } from '../lib/data'
import { numbered } from '../lib/sources'

export default function YourDoseData() {
  const { data } = useDrugs()
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 4</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">The parameter table, for download</h1>
      <p className="mt-6 max-w-3xl text-lg text-ink-2 leading-relaxed">One JSON file holds every number the simulator uses, its unit, its source and, where derived, the arithmetic. Free to reuse with attribution to this page and to the original studies.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <li className="rule pt-4"><a href={`${DATA}drugs.json`} download className="font-semibold text-berry underline underline-offset-2">drugs.json</a><p className="mt-1 text-sm text-ink-2">Drugs, regimens, profiles by sex and hormonal state, parameters with citations, sources.{data && ` Generated ${data.generated}.`}</p></li>
      </ul>
      {data && data.drugs.map(d => (
        <div key={d.key} className="mt-10">
          <h2 className="display text-2xl font-medium">{d.name}</h2>
          <p className="text-sm text-ink-2 mt-1">{d.regimen.label}</p>
          <div className="table-wrap mt-3 rounded-2xl bg-white/60 p-4">
            <table className="w-full text-xs sm:text-sm">
              <thead><tr className="text-left text-[10px] uppercase tracking-[0.14em] text-ink-3"><th className="py-2 pr-3 font-semibold">Profile</th><th className="py-2 pr-3 font-semibold">Parameter</th><th className="py-2 pr-3 font-semibold text-right">Value</th><th className="py-2 pr-3 font-semibold">Source</th><th className="py-2 font-semibold">Note</th></tr></thead>
              <tbody>
                {Object.keys(d.profiles).flatMap(pk => citedRows(d, pk).map(({ label, cited }) => (
                  <tr key={pk + label} className="border-t border-hairline/70 align-top">
                    <td className="py-1.5 pr-3 font-semibold text-ink">{d.profiles[pk].name}</td><td className="py-1.5 pr-3">{label}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{cited.value} {cited.unit}</td>
                    <td className="py-1.5 pr-3 text-berry">[{numbered(data.sources).find(s => s.id === cited.source)?.n}]</td>
                    <td className="py-1.5 text-ink-2">{cited.note}{cited.derived ? ` · ${cited.derived}` : ''}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
