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
  { n: 4, slug: 'who-gets-studied', title: 'Who gets studied', dek: '56,591 trials and 21 million people: the share of women in each disease\'s trials against the share of women in the disease, what the fine print excludes, and how few trials ever say what they found in women.', status: 'live' },
  { n: 5, slug: 'sent-home-with-a-label', title: 'Where the diagnosis gap lives', dek: 'The story says she is sent home undiagnosed, under-tested and told it is anxiety. We looked in 20,808 emergency visits and 4.3 million cancer cases. The gap is real. It is not where the story puts it.', status: 'live' },
  { n: 6, slug: 'male-default', title: 'The male default body', dek: 'The animals drugs are tested on, the trials that follow, and the label you are handed: three places where the male body is still the standard, measured.', status: 'live' },
]
