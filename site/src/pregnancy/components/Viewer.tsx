import { useCallback, useMemo, useState } from 'react'
import BrainViewer, { type View } from '../../experiments/BrainViewer'
import RegionPicker from '../../experiments/RegionPicker'
import HormoneTimeline from './charts/HormoneTimeline'
import VolumeTimeline from './charts/VolumeTimeline'
import SessionSlider from './SessionSlider'
import { brainUrl, fmt, pctFrom, type Pregnancy } from '../lib/data'

const VIEWS: { key: View; label: string }[] = [
  { key: 'coronal', label: 'Coronal' }, { key: 'axial', label: 'Axial' }, { key: 'sagittal', label: 'Sagittal' }, { key: 'multi', label: 'All three' },
]
const ORDER = ['whole brain', 'fluid', 'medial temporal lobe', 'subcortical', 'cortex']
export type RefMode = 'pre' | 'week9'

/** Brain on the left, the two-and-a-half-year timeline on the right, one slider under both. */
export default function Viewer({ data }: { data: Pregnancy }) {
  const scanned = useMemo(() => data.sessions.filter(s => s.has_scan), [data])
  const [current, setCurrentRaw] = useState(scanned[0]?.session ?? 1)
  const [regionKey, setRegionKey] = useState('cortical_gm')
  const [view, setView] = useState<View>('axial')
  const [refMode, setRefMode] = useState<RefMode>('pre')
  const [loading, setLoading] = useState(false)
  const setCurrent = useCallback((s: number) => setCurrentRaw(s), [])
  const region = data.regions[regionKey]
  const stats = data.stats[regionKey]
  const cur = data.sessions.find(s => s.session === current)!
  const image = useMemo(() => ({ t1: brainUrl(current, 't1'), labels: brainUrl(current, 'labels') }), [current])
  const prefetch = useMemo(() => {
    const i = scanned.findIndex(s => s.session === current)
    const order = [i + 1, i - 1, i + 2, i - 2, ...scanned.map((_, k) => k)].filter(k => k >= 0 && k < scanned.length)
    return order.map(k => ({ t1: brainUrl(scanned[k].session, 't1'), labels: brainUrl(scanned[k].session, 'labels') }))
  }, [scanned, current])
  // Reference volume: pre-conception mean (sessions 1-4, Santa Barbara scanner) or the
  // first Irvine scan at week 9, which removes the scanner change from the comparison.
  const week9 = data.sessions.find(s => s.session === 7)
  const ref_ = refMode === 'pre' || !week9?.has_scan ? stats?.baseline ?? 1 : week9.volumes[regionKey]
  const refLabel = refMode === 'pre' ? 'before conception' : 'week 9 (same scanner)'

  return (
    <section id="viewer" className="mx-auto max-w-6xl px-4">
      <div className="graphic-card p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-3">
            <div className="brain-stage aspect-square sm:aspect-[4/3.6] lg:aspect-auto lg:h-[560px]">
              <BrainViewer image={image} prefetch={prefetch} highlight={region.labels} labelNames={data.labels} center={region.center_mm} view={view} onLoading={setLoading} />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1 text-[11px] font-semibold tracking-wide text-[rgba(251,238,242,0.9)]">
                <span className="rounded-full bg-[rgba(0,0,0,0.45)] px-2.5 py-1 backdrop-blur">Scan {current} · {cur.site.replace('_retest', '')} · {cur.date}</span>
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
              <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide text-ink-2">
                <span className="eyebrow">Compare with</span>
                <select value={refMode} onChange={e => setRefMode(e.target.value as RefMode)} className="rounded-full border border-berry/30 bg-white/70 px-4 py-2 text-sm font-semibold text-berry outline-none focus:ring-2 focus:ring-rose/40">
                  <option value="pre">Before conception (scans 1–4)</option>
                  <option value="week9">Week 9, first scan on the Irvine scanner</option>
                </select>
              </label>
              {stats && cur.has_scan && (
                <div className="text-right text-xs text-ink-2 leading-relaxed">
                  <div><span className="font-semibold text-ink">{fmt.cm3(cur.volumes[regionKey])} cm³</span> this scan · reference {fmt.cm3(ref_)} cm³</div>
                  <div><span className="font-semibold text-berry">{fmt.pct(pctFrom(ref_, cur, regionKey))}</span> against {refLabel}</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <HormoneTimeline sessions={data.sessions} current={current} onSession={setCurrent} />
            <VolumeTimeline sessions={data.sessions} current={current} onSession={setCurrent} regionKey={regionKey} regionName={region.name} ref_={ref_} refLabel={refLabel} />
          </div>
        </div>
        <div className="mt-5 border-t border-hairline/70 pt-5">
          <SessionSlider sessions={scanned} current={current} onSession={setCurrent} />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">Drag the slider, press play, or scrub across either chart. One person, 27 scans, two scanners. Educational, not clinical.</p>
    </section>
  )
}
