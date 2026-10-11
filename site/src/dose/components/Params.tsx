import { citedRows, type Drug, type DrugsFile } from '../lib/data'
import { numbered } from '../lib/sources'

/** "Where this number comes from": every parameter behind the drawn curves, with its citation. */
export default function Params({ file, drug, profiles }: { file: DrugsFile; drug: Drug; profiles: string[] }) {
  const srcs = numbered(file.sources)
  const n = (id: string) => srcs.find(s => s.id === id)?.n ?? '?'
  return (
    <div className="panel">
      <p className="eyebrow mb-3">Where these numbers come from</p>
      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map(pk => (
          <div key={pk}>
            <p className="text-sm font-semibold text-ink mb-1">{drug.profiles[pk].name}</p>
            <table className="w-full text-xs">
              <tbody>
                {citedRows(drug, pk).map(({ label, cited }) => (
                  <tr key={label} className="border-t border-hairline/60 align-top">
                    <td className="py-1.5 pr-2 text-ink-2 whitespace-nowrap">{label}</td>
                    <td className="py-1.5 pr-2 tabular-nums font-semibold text-ink whitespace-nowrap">{cited.value} {cited.unit}</td>
                    <td className="py-1.5 text-ink-2">
                      <a href={`#dsrc-${n(cited.source)}`} className="font-semibold text-berry">[{n(cited.source)}]</a>
                      {cited.note && <span> {cited.note}</span>}
                      {cited.derived && cited.derived !== 'assumption' && <span className="text-ink-3"> · derived: {cited.derived}</span>}
                      {cited.derived === 'assumption' && <span className="text-berry font-semibold"> · assumption</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {drug.reference_lines.map(r => <p key={r.label} className="mt-3 text-xs text-ink-2">Reference line, {r.value} {drug.unit}: {r.label} <a href={`#dsrc-${n(r.source)}`} className="font-semibold text-berry">[{n(r.source)}]</a></p>)}
      {drug.notes?.map(t => <p key={t} className="mt-2 text-xs text-ink-2">{t}</p>)}
      <p className="mt-3 text-xs text-ink-3">{drug.regimen.note} {drug.weight_note ?? ''}</p>
    </div>
  )
}
