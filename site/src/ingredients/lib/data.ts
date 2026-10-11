import { useEffect, useState } from 'react'

export type Grade = 'confirmed' | 'review' | 'flagged' | 'california'
export type GradeRow = { grade: Grade; list: string; status: string | null; year: string | null; field: string | null; health: boolean; env: boolean; source: string; listed_name: string }
export type Ingredient = { id: string; name: string; inci_hint: string | null; cas: string[]; top_grade: Grade; grades: GradeRow[]; aliases?: string[]; synonyms: string[] }
export type Source = { text: string; url: string; retrieved: string }
export type IngredientsFile = { generated: string; sources: Record<string, Source>; grade_names: Record<Grade, string>; ingredients: Ingredient[]; explainers?: Record<string, string> }

export const BASE = import.meta.env.BASE_URL
export const DATA = `${BASE}data/ingredients/`
export const GRADE_ORDER: Grade[] = ['confirmed', 'review', 'flagged', 'california']
export const GRADE_HELP: Record<Grade, string> = {
  confirmed: 'On EU List I: identified as an endocrine disruptor at EU level after a full evaluation under REACH, the biocides or the pesticides regulation.',
  review: 'On EU List II: currently under evaluation in an EU process because of explicit concern about endocrine disruption. Not a conclusion.',
  flagged: 'On EU List III: a participating national authority considers it an endocrine disruptor; not confirmed EU-wide.',
  california: "Reported to California's Safe Cosmetics Program, which collects products containing chemicals identified by authoritative bodies as causing cancer, birth defects or other reproductive harm. This reflects the chemical's hazard, not the amount in the product, and the program says inclusion does not mean the product has been shown to cause harm.",
}

export function useIngredients() {
  const [data, setData] = useState<IngredientsFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch(`${DATA}ingredients.json`).then(r => r.json()).then(setData).catch(e => setError(String(e))) }, [])
  return { data, error }
}

/** The plain-language note for an ingredient, keyed by any of its CAS numbers. */
export function explainerFor(file: IngredientsFile, ing: Ingredient) {
  for (const c of [ing.id, ...ing.cas]) { const e = file.explainers?.[c]; if (e) return e }
  return undefined
}
