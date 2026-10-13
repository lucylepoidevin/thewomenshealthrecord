import { useEffect, useState } from 'react'
import type { Topology } from 'topojson-specification'

export type County = { fips: string; name: string; state: string; women: number; facilities: number; per10k: number | null; nearest_km: number | null }
export type StateRow = { state: string; name: string; women: number; facilities: number; counties: number; counties_without: number; women_without: number; per10k: number }
export type Source = { text: string; url: string; retrieved: string }
export type DesertsFile = {
  generated: string
  national: { facilities_in_file: number; file_date: string; facilities_placed: { address: number; zip: number; unplaced: number }; excluded: { 'outside the 50 states and DC': number; 'by state': Record<string, number> }
    counties: number; women_40_74: number; counties_without: number; women_without: number; women_without_pct: number
    nearest_over_30mi_counties: number; nearest_over_30mi_women: number; nearest_over_60mi_counties: number; nearest_over_60mi_women: number; per10k_national: number; unassigned_county: number }
  states: StateRow[]
  counties: County[]
  sources: Record<string, Source>
}
export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/deserts/`

export function useDeserts() {
  const [data, setData] = useState<DesertsFile | null>(null)
  const [topo, setTopo] = useState<Topology | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${DATA}deserts.json`).then(r => r.json()).then(setData).catch(e => setError(String(e)))
    fetch(`${DATA}us.json`).then(r => r.json()).then(setTopo).catch(e => setError(String(e)))
  }, [])
  return { data, topo, error }
}
export const ORDER = ['mqsa_list', 'mqsa_stats', 'geocoder', 'zcta', 'popest', 'uspstf2024', 'cenpop']
export const fmtN = (n: number) => n.toLocaleString('en-US')
export const MI = 0.621371
export const miles = (v: number) => `${Math.round(v * MI)} miles`
export const mi = (v: number) => `${Math.round(v * MI)} mi`
