import { useEffect, useState } from 'react'

export type Density = 'fatty' | 'scattered' | 'hetero' | 'dense'
export const DENSITIES: Density[] = ['fatty', 'scattered', 'hetero', 'dense']
export const LETTER: Record<Density, string> = { fatty: 'A', scattered: 'B', hetero: 'C', dense: 'D' }
export const SHORT: Record<Density, string> = { fatty: 'Fatty', scattered: 'Scattered', hetero: 'Heterogeneously dense', dense: 'Extremely dense' }

export type Case = { id: string; density: Density; size_mm: number; dose: number; lesion: { x: number; y: number } | null; w: number; h: number; radius_frac: number | null; phantom: number; member: string }
export type AgeRow = { age: string; exams: number; per1000: number[]; share: number[] }
export type Source = { text: string; url: string; retrieved: string }
export type DensityFile = {
  generated: string
  msynth: { retrieved: string; contrast: string; px_mm: number; labels: Record<Density, string>; cases: Case[] }
  stats: {
    bcsc_risk: { years: string; exams: number; with_density: number; by_density: { density: Density; exams: number; cancers: number; per1000: number }[]; by_age: AgeRow[]; note: string }
    bcsc_bench: { years: string; note: string; dm: Bench; dbt: Bench }
    interval: { years: string; exams: number; women: number; threshold: number; note: string; by_age: { age: string; v: (number | null)[] }[]; by_risk: { risk: string; v: (number | null)[] }[]; share: number[]; conclusion: string }
    sens2011: { years: string; note: string; rows: { density: Density; n: number; sens: number; lo: number; hi: number; spec: number }[] }
    sprague2014: { dense_40_74_pct: number; ci: number[]; women_40_74_millions: number; age_40_44_pct: number; normal_bmi_pct: number; obese_pct: number; years: string; mammograms: number }
    fda: { effective: string; published: string; statements: string[]; lay_not_dense: string; lay_dense: string; press_half: string }
    uspstf: { date: string; grade_b: string; dense_i: string }
    screening_performance: null | { note: string }
  }
  sources: Record<string, Source>
}
export type Bench = { exams: number; cancers: number; by_density: { density: Density; exams: number; cancers: number }[]; unknown: number[]; sensitivity: number; specificity: number; recall: number; cdr: number }

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/density/`
export const img = (c: Case) => `${DATA}img/${c.id}.webp`

export function useDensity() {
  const [data, setData] = useState<DensityFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch(`${DATA}density.json`).then(r => r.json()).then(setData).catch(e => setError(String(e))) }, [])
  return { data, error }
}

/** Source numbering follows first use on the page. */
export const ORDER = ['fda_rule', 'bcsc_bench', 'sprague2014', 'bcsc_risk', 'msynth', 'victre', 'kerlikowske2015', 'kerlikowske2011', 'uspstf2024', 'fda_press']
export function srcNumber(id: string, sources: Record<string, Source>) {
  const ids = [...ORDER.filter(i => sources[i]), ...Object.keys(sources).filter(i => !ORDER.includes(i))]
  return ids.indexOf(id) + 1
}
export const fmtN = (n: number) => n.toLocaleString('en-US')
