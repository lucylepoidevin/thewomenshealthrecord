import { useEffect, useState } from 'react'
import type { Params } from './pk'

export type Cited = { value: number; unit: string; source: string; note?: string; derived?: string }
export type Profile = {
  name: string; base?: string; ref_weight: number | null
  V_per_kg?: Cited; CL_per_kg?: Cited; V?: Cited; CL?: Cited; ka?: Cited; tlag?: Cited; half_life?: Cited; CL_multiplier?: Cited
}
export type Drug = {
  key: string; name: string; short: string; what: string
  regimen: { dose_mg: number; times: number[]; label: string; note: string }
  unit: string; weight_scaling: boolean; weight_note?: string
  reference_lines: { value: number; label: string; source: string }[]
  shared: Record<string, Cited>; profiles: Record<string, Profile>
  alt_dose?: { profile: string; dose_mg: number; label: string; source: string }
  notes?: string[]
}
export type Source = { text: string; url: string }
export type DrugsFile = { generated: string; model: string; sources: Record<string, Source>; drugs: Drug[] }

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/dose/`

export function useDrugs() {
  const [data, setData] = useState<DrugsFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch(`${DATA}drugs.json`).then(r => r.json()).then(setData).catch(e => setError(String(e))) }, [])
  return { data, error }
}

/** Resolve a profile (following `base`) into model parameters for a given body weight. */
export function paramsFor(drug: Drug, profileKey: string, weightKg: number): Params {
  const prof = drug.profiles[profileKey]
  const base = prof.base ? drug.profiles[prof.base] : prof
  const F = drug.shared.F?.value ?? 1
  const ka = (prof.ka ?? base.ka ?? drug.shared.ka)!.value
  const tlag = (prof.tlag ?? base.tlag)?.value ?? 0
  let V: number, CL: number
  if (drug.weight_scaling) {
    V = base.V_per_kg!.value * weightKg
    CL = base.CL_per_kg!.value * weightKg
  } else {
    V = base.V!.value; CL = base.CL!.value
  }
  if (prof.CL_multiplier) CL *= prof.CL_multiplier.value
  return { F, V, CL, ka, tlag }
}

/** The list of (parameter, cited value) rows to show under the chart for one profile. */
export function citedRows(drug: Drug, profileKey: string): { label: string; cited: Cited }[] {
  const prof = drug.profiles[profileKey]
  const base = prof.base ? drug.profiles[prof.base] : prof
  const rows: { label: string; cited: Cited }[] = []
  const add = (label: string, c?: Cited) => { if (c) rows.push({ label, cited: c }) }
  add('Bioavailability (F)', drug.shared.F)
  add('Volume of distribution', base.V_per_kg ?? base.V)
  add('Clearance', base.CL_per_kg ?? base.CL)
  add('Clearance multiplier', prof.CL_multiplier)
  add('Absorption rate (ka)', prof.ka ?? base.ka ?? drug.shared.ka)
  add('Absorption lag', prof.tlag ?? base.tlag)
  add('Half-life (reported)', prof.half_life ?? base.half_life)
  return rows
}

export const PROFILE_COLOR: Record<string, string> = {
  male: 'var(--c-progesterone)', female: 'var(--c-estradiol)', female_pill: 'var(--c-lh)', female_pregnant: 'var(--c-emphasis)',
}

export const clock = (h: number) => {
  const hh = ((Math.round(h) % 24) + 24) % 24
  return hh === 0 ? '12 am' : hh < 12 ? `${hh} am` : hh === 12 ? '12 pm' : `${hh - 12} pm`
}
export const fmt = {
  conc: (v: number, unit: string) => `${v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v)} ${unit}`,
  pct: (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(0)}%`,
  x: (v: number) => `${v.toFixed(v < 2 ? 2 : 1)}×`,
  h: (v: number) => `${v.toFixed(1)} h`,
}
