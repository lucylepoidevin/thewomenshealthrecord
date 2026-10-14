import { DATA, fmt, useMale } from '../lib/data'

export default function MaleBrainData() {
  const { data } = useMale()
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 3</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Everything the page reads, for download</h1>
      <p className="mt-6 max-w-3xl text-lg text-ink-2 leading-relaxed">The source scans are on OpenNeuro under CC0. The derived files below are ours and are free to reuse with attribution to this page and to the original study.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { href: `${DATA}male.json`, name: 'male.json', note: 'Per-session hormones, mood, region volumes (native mm³), region definitions, morning/evening stats.' },
          { href: `${DATA}participants_ds005115.tsv`, name: 'participants_ds005115.tsv', note: 'The dataset\'s own session table: time of day, serum and saliva hormones, mood scales, steps.' },
          { href: `${DATA}volumes_long.csv`, name: 'volumes_long.csv', note: 'One row per session per label (132 labels × 40 sessions), native and MNI volumes.' },
          { href: `${DATA}brain/`, name: 'brain/ses-XX_t1.nii.gz, ses-XX_labels.nii.gz', note: '1.5 mm, 8-bit, MNI305-aligned scans and label maps for each session.' },
        ].map(f => (
          <li key={f.name} className="rule pt-4">
            <a href={f.href} className="font-semibold text-berry underline underline-offset-2 break-all" download={!f.href.endsWith('/')}>{f.name}</a>
            <p className="mt-1 text-sm text-ink-2">{f.note}</p>
          </li>
        ))}
      </ul>
      {data && (
        <>
          <h2 className="display mt-14 text-2xl font-medium">The month, scan by scan</h2>
          <div className="table-wrap mt-4 rule pt-4">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-[12px] text-ink-3">
                  <th className="py-2 pr-2 font-semibold">Scan</th><th className="py-2 pr-2 font-semibold">Day</th><th className="py-2 pr-2 font-semibold">Time</th>
                  <th className="py-2 pr-2 font-semibold text-right">Testosterone ng/dL</th><th className="py-2 pr-2 font-semibold text-right">Cortisol µg/dL</th><th className="py-2 pr-2 font-semibold text-right">Estradiol pg/mL</th>
                  <th className="py-2 pr-2 font-semibold text-right">Whole brain cm³</th><th className="py-2 pr-2 font-semibold text-right">Cortical GM cm³</th><th className="py-2 font-semibold text-right">Ventricles cm³</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map(s => (
                  <tr key={s.session} className="border-t border-hairline/70 tabular-nums">
                    <td className="py-1.5 pr-2 font-semibold">{s.session}</td><td className="py-1.5 pr-2">{s.day}</td><td className="py-1.5 pr-2">{s.time === 'morning' ? '7 am' : '8 pm'}</td>
                    <td className="py-1.5 pr-2 text-right">{s.hormones.testosterone ?? '–'}</td><td className="py-1.5 pr-2 text-right">{s.hormones.cortisol ?? '–'}</td><td className="py-1.5 pr-2 text-right">{s.hormones.estradiol ?? '–'}</td>
                    <td className="py-1.5 pr-2 text-right">{s.has_scan ? fmt.cm3(s.volumes.total_brain) : '–'}</td><td className="py-1.5 pr-2 text-right">{s.has_scan ? fmt.cm3(s.volumes.cortical_gm) : '–'}</td><td className="py-1.5 text-right">{s.has_scan ? fmt.cm3(s.volumes.lateral_ventricles) : '–'}</td>
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
