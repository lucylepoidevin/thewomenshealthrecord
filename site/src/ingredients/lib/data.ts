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
  review: 'On EU List II: currently under evaluation in an EU process because of explicit concern about endocrine disruption. This is not a conclusion.',
  flagged: 'On EU List III: a participating national authority considers it an endocrine disruptor; not confirmed EU-wide.',
  california: "Reported to California's Safe Cosmetics Program, which collects products containing chemicals identified by authoritative bodies as causing cancer, birth defects or other reproductive harm. This reflects the chemical's hazard rather than the amount in the product, and the program states that inclusion does not mean the product has been shown to cause harm.",
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


/** Ingredients that readers commonly expect to see flagged, with the regulatory position where a primary source exists.
 *  Keyed by normalised label name (see match.ts norm). Shown only when the ingredient is read and is on none of the three lists. */
export const NOT_LISTED: Record<string, { note: string; source: string; url: string }> = {
  'phenoxyethanol': {
    note: 'Not on EU List I, II or III and not on Proposition 65. The EU Scientific Committee on Consumer Safety concluded in 2016 that phenoxyethanol is safe for use as a preservative at a maximum concentration of 1.0%, which is the limit in the EU Cosmetics Regulation.',
    source: 'SCCS, Opinion on Phenoxyethanol, SCCS/1575/16, final version of 6 October 2016',
    url: 'https://health.ec.europa.eu/system/files/2021-08/sccs_o_195_0.pdf',
  },
}
