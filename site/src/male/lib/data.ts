import { useEffect, useState } from 'react'

export type Time = 'morning' | 'evening'
export type Session = {
  session: number; day: number; time: Time
  hormones: Record<'cortisol' | 'estradiol' | 'testosterone' | 'free_testosterone' | 'cortisol_saliva' | 'testosterone_saliva', number | null>
  mood: Record<string, number | null>
  volumes: Record<string, number>; has_scan: boolean; affine_scale?: number
}
export type Region = { name: string; labels: number[]; group: string; center_mm?: number[] }
export type RegionStats = {
  n: number; mean: number; cv_pct: number; range_pct: number
  am_n?: number; am_mean?: number; am_cv_pct?: number; am_mean_pct?: number
  pm_n?: number; pm_mean?: number; pm_cv_pct?: number; pm_mean_pct?: number
  ampm_n?: number; ampm_mean_pct?: number; ampm_sd_pct?: number; ampm_p?: number; ampm_n_down?: number
  rho_testosterone?: number; p_testosterone?: number; rho_cortisol?: number; p_cortisol?: number; rho_estradiol?: number; p_estradiol?: number
  rho_testosterone_am?: number; p_testosterone_am?: number; rho_cortisol_am?: number; p_cortisol_am?: number
}
export type HormoneSummary = { am_median: number; pm_median: number; am_n: number; pm_n: number; min: number; max: number }
export type Male = {
  subject: string; hormone_units: Record<string, string>
  hormone_summary: Record<'testosterone' | 'cortisol' | 'estradiol', HormoneSummary>
  regions: Record<string, Region>; labels: Record<string, string>; sessions: Session[]; stats: Record<string, RegionStats>
}
/** The cycling brain's stats, loaded for the side-by-side. */
export type HerStats = Record<string, { n: number; mean: number; cv_pct: number; range_pct: number; r_progesterone?: number; p_progesterone?: number; r_estradiol?: number; p_estradiol?: number }>

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/male/`
export const brainUrl = (session: number, kind: 't1' | 'labels') => `${DATA}brain/ses-${String(session).padStart(2, '0')}_${kind}.nii.gz`

export function useMale() {
  const [data, setData] = useState<Male | null>(null)
  const [her, setHer] = useState<HerStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${DATA}male.json`).then(r => r.json()).then(setData).catch(e => setError(String(e)))
    fetch(`${BASE}data/cycling/cycle.json`).then(r => r.json()).then(c => setHer(c.stats)).catch(() => setHer(null))
  }, [])
  return { data, her, error }
}

/** The three blocks of the month. */
export type Block = { key: string; name: string; short: string; from: number; to: number; note: string }
export const BLOCKS: Block[] = [
  { key: 'am', name: 'Mornings', short: 'Mornings · 7 am', from: 1, to: 10, note: 'Days 1 to 10: one scan a day at 7 am, hormones at their daily peak.' },
  { key: 'both', name: 'Morning and evening', short: 'Both · 7 am + 8 pm', from: 11, to: 20, note: 'Days 11 to 20: two scans a day, 7 am and 8 pm. The direct morning-to-evening comparison.' },
  { key: 'pm', name: 'Evenings', short: 'Evenings · 8 pm', from: 21, to: 30, note: 'Days 21 to 30: one scan a day at 8 pm, hormones at their daily low.' },
]
export const blockOf = (day: number) => BLOCKS.find(b => day >= b.from && day <= b.to) ?? BLOCKS[0]

export const HORMONE_META = {
  testosterone: { name: 'Testosterone', color: 'var(--c-progesterone)', unit: 'ng/dL' },
  cortisol: { name: 'Cortisol', color: 'var(--c-lh)', unit: 'µg/dL' },
  estradiol: { name: 'Estradiol', color: 'var(--c-estradiol)', unit: 'pg/mL' },
} as const

export const fmt = {
  cm3: (mm3: number) => (mm3 / 1000).toFixed(mm3 < 10000 ? 2 : 1),
  pct: (v: number, d = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}%`,
  r: (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2),
  p: (v: number) => (v < 0.001 ? 'p < 0.001' : `p = ${v.toFixed(v < 0.01 ? 3 : 2)}`),
  n: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 2 : 0 }),
}
/** x position of a session on the day axis: mornings sit a little left of the day tick, evenings a little right. */
export const dayX = (s: { day: number; time: Time }) => s.day + (s.time === 'morning' ? -0.22 : 0.22)
