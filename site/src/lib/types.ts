export type Drug = {
  slug: string
  brand: string
  generic: string | null
  sex_specific?: 'male' | 'female' | null
  year: number | null
  indication: string | null
  category: string
  trial_n: number
  trial_female_pct: number
  faers_n: number | null
  faers_female_pct: number | null
  faers_serious_n: number | null
  faers_serious_female_pct: number | null
  gap: number | null
  snapshot_url: string
  enrollment_source: string
  meps_users_n: number | null
  meps_female_pct: number | null
  rate_ratio: number | null
  rate_ratio_lo: number | null
  rate_ratio_hi: number | null
}

export type Chapter1Data = {
  generated: string
  faers_last_updated: string | null
  zolpidem: { female: number; male: number; unknown: number; total: number }
  faers_overall: { female: number; male: number; unknown: number } | null
  zolpidem_meps: { users_n: number; female_pct: number; rate_ratio: number } | null
  pk: { label: string; female: number; male: number }[]
  drugs: Drug[]
  summary: {
    n_drugs: number
    n_with_faers: number
    median_trial_female_pct: number
    n_under_30: number
    n_under_40: number
    n_gap_quadrant: number
    n_with_rate: number
    n_rate_over_1_5: number
    n_rate_under_1: number
    median_rate_ratio: number | null
    median_gap: number
    years: [number, number]
  }
}
