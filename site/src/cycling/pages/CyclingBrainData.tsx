import { DATA, fmt, useCycle, type HormoneKey } from '../lib/data'

const H: { k: HormoneKey; label: string }[] = [
  { k: 'estradiol', label: 'Estradiol pg/mL' }, { k: 'progesterone', label: 'Progesterone ng/mL' }, { k: 'lh', label: 'LH mIU/mL' }, { k: 'fsh', label: 'FSH mIU/mL' },
  { k: 'testosterone', label: 'Testosterone ng/dL' }, { k: 'dheas', label: 'DHEA-S µg/dL' }, { k: 'shbg', label: 'SHBG nmol/L' },
]

export default function Data() {
  const { cycle } = useCycle()
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">Everything the page reads, for download</h1>
      <p className="mt-6 max-w-3xl text-lg text-ink-2 leading-relaxed">
        The source scans are on OpenNeuro under CC0. The derived files below are ours and are free to reuse with attribution to this page and to the original study.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { href: `${DATA}cycle.json`, name: 'cycle.json', note: 'Per-day hormones, region volumes (native mm³), region definitions, stats.' },
          { href: `${DATA}hormones_study1.csv`, name: 'hormones_study1.csv', note: 'The daily hormone table with cycle-day labels and units.' },
          { href: `${DATA}volumes_long.csv`, name: 'volumes_long.csv', note: 'One row per day per label (132 labels × 30 days), native and MNI volumes.' },
          { href: `${DATA}brain/`, name: 'brain/ses-XX_t1.nii.gz, ses-XX_labels.nii.gz', note: '1.5 mm, 8-bit, MNI305-aligned scans and label maps for each day.' },
        ].map(f => (
          <li key={f.name} className="rounded-2xl bg-white/60 p-5">
            <a href={f.href} className="font-semibold text-berry underline underline-offset-2 break-all" download={!f.href.endsWith('/')}>{f.name}</a>
            <p className="mt-1 text-sm text-ink-2">{f.note}</p>
          </li>
        ))}
      </ul>

      {cycle && (
        <>
          <h2 className="display mt-14 text-2xl font-medium">The month, day by day</h2>
          <div className="table-wrap mt-4 rounded-2xl bg-white/60 p-4">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="py-2 pr-2 font-semibold">Day</th><th className="py-2 pr-2 font-semibold">Cycle day</th>
                  {H.map(h => <th key={h.k} className="py-2 pr-2 font-semibold text-right">{h.label}</th>)}
                  <th className="py-2 pr-2 font-semibold text-right">Hippocampus cm³</th>
                  <th className="py-2 font-semibold text-right">Whole brain cm³</th>
                </tr>
              </thead>
              <tbody>
                {cycle.days.map(d => (
                  <tr key={d.day} className="border-t border-hairline/70 tabular-nums">
                    <td className="py-1.5 pr-2 font-semibold">{d.day}</td><td className="py-1.5 pr-2">{d.cycle_day}</td>
                    {H.map(h => <td key={h.k} className="py-1.5 pr-2 text-right">{d.hormones[h.k] == null ? '–' : d.hormones[h.k]}</td>)}
                    <td className="py-1.5 pr-2 text-right">{d.has_scan ? fmt.cm3(d.volumes.hippocampus) : '–'}</td>
                    <td className="py-1.5 text-right">{d.has_scan ? fmt.cm3(d.volumes.total_brain) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
