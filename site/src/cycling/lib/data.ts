import { useEffect, useState } from 'react'

export type HormoneKey = 'estradiol' | 'progesterone' | 'lh' | 'fsh' | 'testosterone' | 'dheas' | 'shbg'

export type Day = {
  day: number
  cycle_day: number
  hormones: Record<HormoneKey, number | null>
  volumes: Record<string, number>
  has_scan: boolean
  affine_scale?: number
}

export type Region = { name: string; labels: number[]; group: string; center_mm?: number[] }

export type RegionStats = {
  n: number; mean: number; sd: number; cv_pct: number; min_day: number; max_day: number; range_pct: number
  r_estradiol?: number; p_estradiol?: number; r_progesterone?: number; p_progesterone?: number
  r_lh?: number; p_lh?: number; r_fsh?: number; p_fsh?: number
  rho_estradiol?: number; prho_estradiol?: number; rho_progesterone?: number; prho_progesterone?: number
}

export type Cycle = {
  subject: string
  hormone_units: Record<HormoneKey, string>
  regions: Record<string, Region>
  labels: Record<string, string>
  days: Day[]
  stats: Record<string, RegionStats>
}

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/cycling/`
export const brainUrl = (day: number, kind: 't1' | 'labels') => `${DATA}brain/ses-${String(day).padStart(2, '0')}_${kind}.nii.gz`

export function useCycle() {
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${DATA}cycle.json`).then(r => r.json()).then(setCycle).catch(e => setError(String(e)))
  }, [])
  return { cycle, error }
}

/**
 * Phase of the cycle on each study day. The study began on cycle day 21,
 * menses arrived on study day 11, the LH surge fell on study day 23.
 * Boundaries follow the lab's own cycle-day labels and the hormone curves.
 */
export type Phase = { key: string; name: string; short: string; from: number; to: number; note: string }
export const PHASES: Phase[] = [
  { key: 'late-luteal', name: 'Late luteal', short: 'Luteal', from: 1, to: 10, note: 'Progesterone high, then falling as the corpus luteum fades.' },
  { key: 'menstrual', name: 'Menstrual', short: 'Period', from: 11, to: 15, note: 'Both ovarian hormones at their floor. Her period began on day 11.' },
  { key: 'follicular', name: 'Follicular', short: 'Follicular', from: 16, to: 22, note: 'Estradiol climbs as a follicle matures.' },
  { key: 'ovulatory', name: 'Ovulatory', short: 'Ovulation', from: 23, to: 25, note: 'Estradiol peaks and LH surges on day 23: ovulation.' },
  { key: 'luteal', name: 'Early luteal', short: 'Luteal', from: 26, to: 30, note: 'Progesterone rises steeply from the new corpus luteum.' },
]
export const phaseOf = (day: number) => PHASES.find(p => day >= p.from && day <= p.to) ?? PHASES[0]

export const HORMONE_META: Record<'estradiol' | 'progesterone' | 'lh' | 'fsh', { name: string; color: string; unit: string }> = {
  estradiol: { name: 'Estradiol', color: 'var(--c-estradiol)', unit: 'pg/mL' },
  progesterone: { name: 'Progesterone', color: 'var(--c-progesterone)', unit: 'ng/mL' },
  lh: { name: 'LH', color: 'var(--c-lh)', unit: 'mIU/mL' },
  fsh: { name: 'FSH', color: 'var(--c-fsh)', unit: 'mIU/mL' },
}

export const fmt = {
  int: (v: number) => Math.round(v).toLocaleString('en-US'),
  cm3: (mm3: number) => (mm3 / 1000).toFixed(mm3 < 10000 ? 2 : 1),
  pct: (v: number, d = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}%`,
  r: (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2),
  p: (v: number) => (v < 0.001 ? 'p < 0.001' : `p = ${v.toFixed(v < 0.01 ? 3 : 2)}`),
}
