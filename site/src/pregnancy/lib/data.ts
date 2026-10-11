import { useEffect, useState } from 'react'
import * as d3 from 'd3'

export type Session = {
  session: number
  week: number
  trimester: 'pre' | 'first' | 'second' | 'third' | 'post'
  site: string
  date: string
  retest_of: number | null
  hormones: { estradiol: number | null; progesterone: number | null; lh: number | null }
  mood: Record<string, number | null>
  volumes: Record<string, number>
  has_scan: boolean
  affine_scale?: number
}
export type Region = { name: string; labels: number[]; group: string; center_mm?: number[] }
export type Pt = { session: number; week: number; pct: number }
export type RegionStats = {
  baseline: number; n_baseline: number; baseline_cv_pct: number | null
  min_pregnancy?: Pt; max_pregnancy?: Pt; third_trimester_pct?: number; two_years_pct?: number; early_postpartum_pct?: number
  retest_diff_pct?: number
  rho_estradiol?: number; p_estradiol?: number; n_estradiol?: number
  rho_progesterone?: number; p_progesterone?: number; n_progesterone?: number
}
export type Pregnancy = {
  subject: string
  baseline_sessions: number[]
  hormone_units: Record<string, string>
  regions: Record<string, Region>
  labels: Record<string, string>
  sessions: Session[]
  stats: Record<string, RegionStats>
}

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/pregnancy/`
export const brainUrl = (session: number, kind: 't1' | 'labels') => `${DATA}brain/ses-${String(session).padStart(2, '0')}_${kind}.nii.gz`

export function usePregnancy() {
  const [data, setData] = useState<Pregnancy | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch(`${DATA}pregnancy.json`).then(r => r.json()).then(setData).catch(e => setError(String(e))) }, [])
  return { data, error }
}

/** Stages along the timeline, in gestation weeks from conception. */
export type Stage = { key: string; name: string; short: string; from: number; to: number; note: string }
export const STAGES: Stage[] = [
  { key: 'pre', name: 'Before conception', short: 'Before', from: -5, to: 2, note: 'Four baseline scans. Conception was by IVF, so the clock is exact.' },
  { key: 'first', name: 'First trimester', short: 'T1', from: 2, to: 13, note: 'Weeks 2 to 13. Hormones begin their climb.' },
  { key: 'second', name: 'Second trimester', short: 'T2', from: 13, to: 27, note: 'Weeks 13 to 27. Estradiol passes 4,000 pg/mL, progesterone 50 ng/mL.' },
  { key: 'third', name: 'Third trimester', short: 'T3', from: 27, to: 40, note: 'Weeks 27 to 40. Both hormones at their lifetime peak.' },
  { key: 'post', name: 'After birth', short: 'After', from: 40, to: 170, note: 'Birth around week 40, then scans out to two years and eight months.' },
]
export const stageOf = (week: number) => STAGES.find(s => week >= s.from && week < s.to) ?? STAGES[STAGES.length - 1]
export const trimesterName: Record<Session['trimester'], string> = { pre: 'before conception', first: 'first trimester', second: 'second trimester', third: 'third trimester', post: 'postpartum' }

/**
 * Pregnancy spans 45 weeks and has 19 scans; the two years after it have 8.
 * A single linear axis would crush the pregnancy into a corner, so the axis
 * is piecewise: conception to birth gets ~62% of the width, the rest the tail.
 */
export function weekScale(x0: number, x1: number) {
  const breakWeek = 41, breakFrac = 0.62
  const xb = x0 + (x1 - x0) * breakFrac
  const a = d3.scaleLinear().domain([-5, breakWeek]).range([x0, xb])
  const b = d3.scaleLinear().domain([breakWeek, 166]).range([xb, x1])
  const f = (w: number) => (w <= breakWeek ? a(w) : b(w))
  f.invert = (px: number) => (px <= xb ? a.invert(px) : b.invert(px))
  f.breakX = xb
  f.breakWeek = breakWeek
  return f
}

/** Weeks since conception → a human label. */
export function weekLabel(w: number) {
  if (w < 0) return `${Math.abs(w)} wk before conception`
  if (w <= 41) return `week ${w} of pregnancy`
  const m = Math.round((w - 40) / 4.345)
  return m >= 24 ? `${(m / 12).toFixed(1).replace('.0', '')} years after birth` : `${m} months after birth`
}

export const HORMONE_META = {
  estradiol: { name: 'Estradiol', color: 'var(--c-estradiol)', unit: 'pg/mL' },
  progesterone: { name: 'Progesterone', color: 'var(--c-progesterone)', unit: 'ng/mL' },
} as const

export const fmt = {
  cm3: (mm3: number) => (mm3 / 1000).toFixed(mm3 < 10000 ? 2 : 1),
  pct: (v: number, d = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}%`,
  r: (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2),
  p: (v: number) => (v < 0.001 ? 'p < 0.001' : `p = ${v.toFixed(v < 0.01 ? 3 : 2)}`),
  n: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 2 : 0 }),
}

/** % change of a session's region volume against the chosen reference. */
export function pctFrom(ref: number, s: Session, key: string) { return (s.volumes[key] / ref - 1) * 100 }
