import { useCallback, useMemo, useState } from 'react'
import BrainViewer, { type View } from './BrainViewer'
import HormoneChart from './charts/HormoneChart'
import VolumeChart from './charts/VolumeChart'
import DaySlider from './DaySlider'
import RegionPicker from './RegionPicker'
import { fmt, type Cycle } from '../lib/data'

const VIEWS: { key: View; label: string }[] = [
  { key: 'coronal', label: 'Coronal' }, { key: 'axial', label: 'Axial' }, { key: 'sagittal', label: 'Sagittal' }, { key: 'multi', label: 'All three' },
]

/** The interactive heart of the page: brain on the left, curves on the right, one slider under both. */
export default function Viewer({ cycle }: { cycle: Cycle }) {
  const [day, setDayRaw] = useState(1)
  const [regionKey, setRegionKey] = useState('hippocampus')
  const [view, setView] = useState<View>('coronal')
  const [loading, setLoading] = useState(false)
  const setDay = useCallback((d: number) => setDayRaw(d), [])
  const region = cycle.regions[regionKey]
  const highlight = useMemo(() => region.labels, [region])
  const stats = cycle.stats[regionKey]
  const cur = cycle.days[day - 1]

  return (
    <section id="viewer" className="mx-auto max-w-6xl px-4">
      <div className="graphic-card p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* brain */}
          <div className="flex flex-col gap-3">
            <div className="brain-stage aspect-square sm:aspect-[4/3.6] lg:aspect-auto lg:h-[520px]">
              <BrainViewer day={day} highlight={highlight} labelNames={cycle.labels} center={region.center_mm} view={view} onLoading={setLoading} />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1 text-[11px] font-semibold tracking-wide text-[rgba(251,238,242,0.9)]">
                <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 backdrop-blur">Day {day} · T1w MRI</span>
                {loading && <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 backdrop-blur text-rose">loading scan…</span>}
              </div>
              <div className="absolute bottom-3 left-3 flex gap-1">
                {VIEWS.map(v => (
                  <button key={v.key} type="button" onClick={() => setView(v.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur transition ${view === v.key ? 'bg-rose text-[#fff]' : 'bg-[rgba(0,0,0,0.45)] text-[rgba(251,238,242,0.85)] hover:bg-[rgba(0,0,0,0.7)]'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 text-[11px] font-semibold text-[rgba(251,238,242,0.9)] backdrop-blur">
                <span className="inline-block h-2.5 w-2.5 rounded-sm align-middle mr-1.5" style={{ background: '#E05A8A' }} />{region.name}
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <RegionPicker regions={cycle.regions} value={regionKey} onChange={setRegionKey} />
              {stats && cur?.has_scan && (
                <div className="text-right text-xs text-ink-2 leading-relaxed">
                  <div><span className="font-semibold text-ink">{fmt.cm3(cur.volumes[regionKey])} cm³</span> today · mean {fmt.cm3(stats.mean)} cm³</div>
                  <div>day-to-day spread (CV) {stats.cv_pct.toFixed(1)}% · range {stats.range_pct.toFixed(1)}%</div>
                </div>
              )}
            </div>
          </div>
          {/* curves */}
          <div className="flex flex-col gap-2">
            <HormoneChart days={cycle.days} day={day} onDay={setDay} />
            <VolumeChart days={cycle.days} day={day} onDay={setDay} regionKey={regionKey} regionName={region.name} stats={stats} />
          </div>
        </div>
        <div className="mt-5 border-t border-hairline/70 pt-5">
          <DaySlider day={day} onDay={setDay} days={cycle.days} />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">
        Drag the slider, press play, or scrub across either chart. One person, one month. Educational, not clinical.
      </p>
    </section>
  )
}
