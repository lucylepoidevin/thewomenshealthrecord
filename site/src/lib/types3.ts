export type Disease = {
  disease: string
  nih_categories: string[]
  who_codes: number[]
  note: string
  funding_m: number
  dalys_k: number
  female_share: number
  dollars_per_daly: number
  expected_m: number
  ratio_to_expected: number
  skew: 'female' | 'male' | 'balanced'
  disability_share: number | null
  history: { fy: number; funding_m: number }[]
  rank_by_ratio: number
}
export type Chapter3Data = {
  generated: string
  funding_fy: number
  burden_year: number
  fit: { a: number; b: number }
  min_dalys_k: number
  diseases: Disease[]
  summary: {
    n: number; n_female: number; n_male: number; n_balanced: number
    median_dollars_per_daly: Record<string, number | null>
    median_ratio_to_expected: Record<string, number | null>
    share_underfunded: Record<string, number | null>
    female_shortfall_m: number
    total_funding_m: number
  }
  trend: { year: number; fy: string; n: number; median_dollars_per_daly: Record<string, number | null>; median_ratio_to_expected: Record<string, number | null>; share_underfunded: Record<string, number | null>; female_shortfall_m: number }[]
  uncounted: { category: string; funding_m: number }[]
  comparators: { disease: string; dalys_k: number; funding_m: number; per_daly: number; female_share: number; others: { disease: string; dalys_k: number; funding_m: number; per_daly: number; female_share: number; skew: string }[] }[]
}
