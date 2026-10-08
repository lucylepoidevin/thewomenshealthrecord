export type Chapter = {
  n: number
  slug: string
  title: string
  dek: string
  status: 'live' | 'soon'
}

export const CHAPTERS: Chapter[] = [
  { n: 1, slug: 'tested-on-men', title: 'Tested on men, prescribed to women', dek: 'Every new drug since 2015, scored on who was in the trial versus who reports the side effects.', status: 'live' },
  { n: 2, slug: 'pain-gap', title: 'The urgency gap', dek: 'Twenty thousand emergency visits for pain and 377 heart attacks, 2018–2022: women arrive reporting more pain, and the system rates them lower in specific places: severe abdominal pain, young women\'s chest pain, and the heart attack.', status: 'live' },
  { n: 3, slug: 'funding-vs-burden', title: 'The research dollar', dek: '67 diseases, their NIH budgets and the healthy years they cost Americans: where the money follows the burden, where it doesn\'t, and which conditions are never measured.', status: 'live' },
  { n: 4, slug: 'trial-representation', title: 'Who gets studied', dek: 'Trial enrollment versus real-world prevalence by sex, disease by disease.', status: 'soon' },
  { n: 5, slug: 'diagnosis-delays', title: 'Years to a diagnosis', dek: 'Endometriosis, autoimmune disease, heart attack: how long women wait compared with men.', status: 'soon' },
  { n: 6, slug: 'male-default', title: 'The male default body', dek: 'Anatomy mapped late, male-only animal studies, and what textbooks show.', status: 'soon' },
]
