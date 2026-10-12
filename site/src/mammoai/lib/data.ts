import { useEffect, useState } from 'react'

export type Role = 'detection' | 'triage' | 'density' | 'other' | 'risk'
export const ROLE_LABEL: Record<Role, string> = { detection: 'Detection and diagnosis', triage: 'Triage', density: 'Breast density', other: 'Other (arterial calcification)', risk: 'Risk prediction' }
export type Device = {
  submission: string; device: string; company: string; role: Role; decision_date: string; year: number; url: string; on_ai_list: boolean; product_code: string
  modality: string; intended_use_short: string; validation_type: string
  test_exams: number | null; test_exams_unit: string; q_test_exams: string; test_cancers: number | null; q_test_cancers: string
  test_sites: number | null; test_sites_text: string; q_test_sites: string; test_countries: string[]; q_test_countries: string; us_in_test: boolean
  test_period: string; q_test_period: string; population: string; q_population: string
  age_reported: boolean; age_summary: string; q_age: string; race_reported: boolean; race_summary: string; q_race: string
  density_reported: boolean; density_summary: string; q_density: string; vendors: string[]; q_vendors: string; readers: number | null; q_readers: string
  training_data_described: boolean; training_summary: string; q_training: string; subgroup_performance_reported: boolean; subgroup_summary: string; q_subgroup: string
  headline_performance: string; q_headline: string; notes: string; text_quality: string
}
export type Period = { period: string; n: number; race: number | null; density: number | null; age: number | null; countries: number | null; us: number | null; size_stated: number | null; median_size: number | null; subgroups: number | null; reader_study: number | null }
export type Source = { text: string; url: string; retrieved: string }
export type AuditFile = {
  generated: string; ai_list_retrieved: string
  summary: { n: number; families: number; companies: number; race: number; density: number; age: number; countries_any: number; us: number; size_stated: number; median_size: number; max_size: number
    first_race_year: number | null; race_since_2024: number | null; race_before_2024: number | null; density_since_2024: number | null; density_before_2024: number | null; hologic_only: number
    vendors: Record<string, number>; countries: Record<string, number>; by_period: Period[]; by_role: Record<string, { n: number; race: number | null; density: number | null }>; text_quality: Record<string, number> }
  devices: Device[]
  sources: Record<string, Source>
}
export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/mammoai/`
export function useAudit() {
  const [data, setData] = useState<AuditFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch(`${DATA}audit.json`).then(r => r.json()).then(setData).catch(e => setError(String(e))) }, [])
  return { data, error }
}
export const ORDER = ['ai_list', 'summaries', 'fr2025', 'schema']
export const fmtN = (n: number) => n.toLocaleString('en-US')
