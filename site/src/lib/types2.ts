export type Est = { est: number; lo: number; hi: number; n: number }
export type Cmp = { women: Est; men: Est; diff: number; diff_lo: number; diff_hi: number }
export type AgeAdj = { women: { est: number; lo: number; hi: number }; men: { est: number; lo: number; hi: number }; diff: number }
export type Group = {
  id: string
  label: string
  n: number
  n_women: number
  n_men: number
  weighted_visits_per_year: number
  metrics: Record<string, Cmp | null>
  age_adjusted: Record<string, AgeAdj>
  dx_mix?: Record<string, Cmp | null>
  ihd_dx_by_age?: Record<string, Cmp | null>
}
export type Chapter2Data = {
  generated: string
  years: [number, number]
  n_adult_visits: number
  weighted_adult_visits_per_year_m: number
  groups: Group[]
  heart_attack: { n: number; n_women: number; n_men: number; weighted_per_year_k: number; metrics: Record<string, Cmp | null>; under_65: Record<string, Cmp | null> }
  all_pain: { n: number; n_women: number; n_men: number; metrics: Record<string, Cmp | null>; age_adjusted: Record<string, AgeAdj>; within_triage: Record<string, Cmp | null> }
  by_score: { score: number; opioid_ed: Cmp; analgesic_ed: Cmp }[]
  by_score_urgent: { score: number; urgent: Cmp }[]
  explorer: { complaint: string; age: string; n_women: number; n_men: number; metrics: Record<string, Cmp | null> }[]
  levers: Record<string, Record<string, Cmp | null>>
  all_visits: { opioid_ed: Cmp; wait_mean: Cmp }
}
