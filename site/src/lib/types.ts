export type Drug = {
  slug: string
  brand: string
  generic: string | null
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
}

export type Chapter1Data = {
  generated: string
  faers_last_updated: string | null
  zolpidem: { female: number; male: number; unknown: number; total: number }
  pk: { label: string; female: number; male: number }[]
  drugs: Drug[]
  summary: {
    n_drugs: number
    n_with_faers: number
    median_trial_female_pct: number
    n_under_30: number
    n_under_40: number
    n_gap_quadrant: number
    median_gap: number
    years: [number, number]
  }
}
