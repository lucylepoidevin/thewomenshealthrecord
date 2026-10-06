export type Chapter = {
  n: number
  slug: string
  title: string
  dek: string
  status: 'live' | 'soon'
}

export const CHAPTERS: Chapter[] = [
  { n: 1, slug: 'tested-on-men', title: 'Tested on men, prescribed to women', dek: 'Every new drug since 2015, scored on who was in the trial versus who reports the side effects.', status: 'live' },
  { n: 2, slug: 'pain-gap', title: 'The pain gap in the emergency room', dek: 'Painkiller rates and wait times by sex for the same complaint, from CDC emergency department records.', status: 'soon' },
  { n: 3, slug: 'funding-vs-burden', title: 'Funding versus burden', dek: 'NIH dollars per disease against how much each disease weighs on women versus men.', status: 'soon' },
  { n: 4, slug: 'trial-representation', title: 'Who gets studied', dek: 'Trial enrollment versus real-world prevalence by sex, disease by disease.', status: 'soon' },
  { n: 5, slug: 'diagnosis-delays', title: 'Years to a diagnosis', dek: 'Endometriosis, autoimmune disease, heart attack: how long women wait compared with men.', status: 'soon' },
  { n: 6, slug: 'male-default', title: 'The male default body', dek: 'Anatomy mapped late, male-only animal studies, and what textbooks show.', status: 'soon' },
]
