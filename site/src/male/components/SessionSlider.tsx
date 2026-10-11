import { useEffect, useRef, useState } from 'react'
import { blockOf, type Session } from '../lib/data'

type Props = { sessions: Session[]; current: number; onSession: (s: number) => void }

/** Steps through the 40 scans in time order; the label says which day and whether it was 7 am or 8 pm. */
export default function SessionSlider({ sessions, current, onSession }: Props) {
  const [playing, setPlaying] = useState(false)
  const idx = Math.max(0, sessions.findIndex(s => s.session === current))
  const idxRef = useRef(idx); idxRef.current = idx
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => onSession(sessions[(idxRef.current + 1) % sessions.length].session), 650)
    return () => clearInterval(id)
  }, [playing, onSession, sessions])
  const s = sessions[idx]
  const block = blockOf(s.day)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="flex items-baseline gap-3">
          <span className="display text-4xl sm:text-5xl font-light leading-none text-berry tabular-nums">Day {s.day}</span>
          <span className="text-sm text-ink-2">{s.time === 'morning' ? '7 am' : '8 pm'} · scan {s.session} of 40</span>
        </div>
        <div className="text-sm text-ink-2"><span className="font-semibold text-ink">{block.name}</span><span className="hidden sm:inline"> · {block.note}</span></div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play through the month'}
          className="btn btn-icon shrink-0">
          {playing ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="2" width="3.5" height="10" fill="currentColor" /><rect x="8.5" y="2" width="3.5" height="10" fill="currentColor" /></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 2l9 5-9 5z" fill="currentColor" /></svg>}
        </button>
        <input type="range" min={0} max={sessions.length - 1} step={1} value={idx} onChange={e => { setPlaying(false); onSession(sessions[Number(e.target.value)].session) }} className="day-slider" aria-label="Scan" />
      </div>
    </div>
  )
}
