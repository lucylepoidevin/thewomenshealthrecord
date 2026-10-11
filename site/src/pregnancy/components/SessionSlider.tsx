import { useEffect, useRef, useState } from 'react'
import { trimesterName, weekLabel, type Session } from '../lib/data'

type Props = { sessions: Session[]; current: number; onSession: (s: number) => void }

/** Steps through the 27 scans in order; the label says where in the arc each one sits. */
export default function SessionSlider({ sessions, current, onSession }: Props) {
  const [playing, setPlaying] = useState(false)
  const idx = Math.max(0, sessions.findIndex(s => s.session === current))
  const idxRef = useRef(idx); idxRef.current = idx
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => onSession(sessions[(idxRef.current + 1) % sessions.length].session), 900)
    return () => clearInterval(id)
  }, [playing, onSession, sessions])
  const s = sessions[idx]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="flex items-baseline gap-3">
          <span className="display text-4xl sm:text-5xl font-light leading-none text-berry tabular-nums">{s.week < 0 ? `${Math.abs(s.week)} wk before` : s.week <= 41 ? `Week ${s.week}` : weekLabel(s.week).replace(' after birth', '').replace(/^(\d)/, '+$1')}</span>
          <span className="text-sm text-ink-2">{s.week < 0 ? 'conception' : s.week <= 41 ? 'of pregnancy' : 'after birth'}</span>
        </div>
        <div className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{trimesterName[s.trimester][0].toUpperCase() + trimesterName[s.trimester].slice(1)}</span>
          <span> · scan {s.session} of {sessions.length} · {s.date}</span>
          {s.retest_of && <span> · next-day retest of scan {s.retest_of} on the other scanner</span>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play through the scans'}
          className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-berry text-[#fff] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] transition hover:bg-rose">
          {playing ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="2" width="3.5" height="10" fill="currentColor" /><rect x="8.5" y="2" width="3.5" height="10" fill="currentColor" /></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 2l9 5-9 5z" fill="currentColor" /></svg>}
        </button>
        <input type="range" min={0} max={sessions.length - 1} step={1} value={idx} onChange={e => { setPlaying(false); onSession(sessions[Number(e.target.value)].session) }} className="day-slider" aria-label="Scan" />
      </div>
    </div>
  )
}
