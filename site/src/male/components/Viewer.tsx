import { useCallback, useMemo, useState } from 'react'
import BrainViewer, { type View } from '../../experiments/BrainViewer'
import RegionPicker from '../../experiments/RegionPicker'
import HormoneDays from './charts/HormoneDays'
import VolumeDays from './charts/VolumeDays'
import SessionSlider from './SessionSlider'
import { brainUrl, fmt, type Male } from '../lib/data'

const VIEWS: { key: View; label: string }[] = [
  { key: 'coronal', label: 'Coronal' }, { key: 'axial', label: 'Axial' }, { key: 'sagittal', label: 'Sagittal' }, { key: 'multi', label: 'All three' },
]
const ORDER = ['whole brain', 'fluid', 'medial temporal lobe', 'subcortical', 'cortex', 'temporal']

export default function Viewer({ data }: { data: Male }) {
  const scanned = useMemo(() => data.sessions.filter(s => s.has_scan), [data])
  const [current, setCurrentRaw] = useState(scanned[0]?.session ?? 1)
  const [regionKey, setRegionKey] = useState('total_brain')
  const [view, setView] = useState<View>('axial')
  const [loading, setLoading] = useState(false)
  const setCurrent = useCallback((s: number) => setCurrentRaw(s), [])
  const region = data.regions[regionKey]
  const stats = data.stats[regionKey]
  const cur = data.sessions.find(s => s.session === current)!
  const image = useMemo(() => ({ t1: brainUrl(current, 't1'), labels: brainUrl(current, 'labels') }), [current])
  const prefetch = useMemo(() => {
    const i = scanned.findIndex(s => s.session === current)
    return [i + 1, i - 1, i + 2, i - 2, ...scanned.map((_, k) => k)].filter(k => k >= 0 && k < scanned.length).map(k => ({ t1: brainUrl(scanned[k].session, 't1'), labels: brainUrl(scanned[k].session, 'labels') }))
  }, [scanned, current])

  return (
    <section id="viewer" className="mx-auto max-w-6xl px-4">
      <div className="graphic-card p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-3">
            <div className="brain-stage aspect-square sm:aspect-[4/3.6] lg:aspect-auto lg:h-[520px]">
              <BrainViewer image={image} prefetch={prefetch} highlight={region.labels} labelNames={data.labels} center={region.center_mm} view={view} onLoading={setLoading} />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1 text-[11px] font-semibold tracking-wide text-[rgba(251,238,242,0.9)]">
                <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 backdrop-blur">Day {cur.day} · {cur.time === 'morning' ? '7 am' : '8 pm'} · T1w MRI</span>
                {loading && <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 backdrop-blur text-rose">loading scan…</span>}
              </div>
              <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 text-[11px] font-semibold text-[rgba(251,238,242,0.9)] backdrop-blur">
                <span className="inline-block h-2.5 w-2.5 rounded-sm align-middle mr-1.5" style={{ background: '#E05A8A' }} />{region.name}
              </div>
              <div className="absolute bottom-3 left-3 flex gap-1">
                {VIEWS.map(v => (
                  <button key={v.key} type="button" onClick={() => setView(v.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur transition ${view === v.key ? 'bg-rose text-[#fff]' : 'bg-[rgba(0,0,0,0.45)] text-[rgba(251,238,242,0.85)] hover:bg-[rgba(0,0,0,0.7)]'}`}>{v.label}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <RegionPicker regions={data.regions} value={regionKey} onChange={setRegionKey} order={ORDER} />
              {stats && cur.has_scan && (
                <div className="text-right text-xs text-ink-2 leading-relaxed">
                  <div><span className="font-semibold text-ink">{fmt.cm3(cur.volumes[regionKey])} cm³</span> this scan · mean {fmt.cm3(stats.mean)} cm³</div>
                  <div>spread over 40 scans {stats.cv_pct.toFixed(2)}% · mornings only {stats.am_cv_pct?.toFixed(2)}%{stats.ampm_mean_pct != null && <> · 7 am → 8 pm <span className="font-semibold text-berry">{fmt.pct(stats.ampm_mean_pct, 2)}</span></>}</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <HormoneDays sessions={data.sessions} current={current} onSession={setCurrent} />
            <VolumeDays sessions={data.sessions} current={current} onSession={setCurrent} regionKey={regionKey} regionName={region.name} stats={stats} />
          </div>
        </div>
        <div className="mt-5 border-t border-hairline/70 pt-5"><SessionSlider sessions={scanned} current={current} onSession={setCurrent} /></div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">Drag the slider, press play, or scrub across either chart. One person, 40 scans, one month. Educational, not clinical.</p>
    </section>
  )
}
