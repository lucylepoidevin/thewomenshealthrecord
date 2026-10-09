import { useEffect, useRef, useState } from 'react'
import { phaseOf, type Day } from '../lib/data'

type Props = { day: number; onDay: (d: number) => void; days: Day[] }

/** The one control that drives everything: study day 1 to 30, with a play button. */
export default function DaySlider({ day, onDay, days }: Props) {
  const [playing, setPlaying] = useState(false)
  const dayRef = useRef(day)
  dayRef.current = day
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => onDay(dayRef.current >= 30 ? 1 : dayRef.current + 1), 650)
    return () => clearInterval(id)
  }, [playing, onDay])
  const d = days.find(x => x.day === day)
  const phase = phaseOf(day)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="flex items-baseline gap-3">
          <span className="display text-4xl sm:text-5xl font-light leading-none text-berry tabular-nums">Day {day}</span>
          <span className="text-sm text-ink-2">of 30</span>
        </div>
        <div className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{phase.name}</span>
          {d && <span> · cycle day {d.cycle_day}</span>}
          <span className="hidden sm:inline"> · {phase.note}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause' : 'Play through the month'}
          className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-berry text-white shadow-[0_12px_30px_-12px_rgba(139,30,75,0.6)] transition hover:bg-rose"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="2" width="3.5" height="10" fill="currentColor" /><rect x="8.5" y="2" width="3.5" height="10" fill="currentColor" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 2l9 5-9 5z" fill="currentColor" /></svg>
          )}
        </button>
        <input
          type="range" min={1} max={30} step={1} value={day}
          onChange={e => { setPlaying(false); onDay(Number(e.target.value)) }}
          className="day-slider"
          aria-label="Study day"
        />
      </div>
    </div>
  )
}
