export type Chapter = {
  n: number
  slug: string
  title: string
  dek: string
  status: 'live' | 'soon'
}

export const CHAPTERS: Chapter[] = [
  { n: 1, slug: 'who-gets-studied', title: 'Women\'s share of clinical trial participants, by disease', dek: '56,591 trials and 21 million people: the share of women in each disease\'s trials against the share of women in the disease, what the eligibility criteria exclude, and how few trials report what they found in women.', status: 'live' },
  { n: 2, slug: 'male-default', title: 'Male-only animal studies, trials and drug labels', dek: 'The animals drugs are tested on, the trials that follow, and the label itself: how often each is male by default.', status: 'live' },
  { n: 3, slug: 'pain-gap', title: 'Pain, triage and waiting in the emergency department, by sex', dek: 'Twenty thousand emergency visits for pain and 377 heart attacks, 2018–2022: women arrive reporting more pain, and the system rates them lower in specific presentations: severe abdominal pain, young women\'s chest pain, and the heart attack.', status: 'live' },
  { n: 4, slug: 'funding-vs-burden', title: 'NIH funding against disease burden, by sex', dek: '67 diseases, their NIH budgets and the healthy years they cost Americans: where funding tracks burden, where it does not, and which conditions are never measured.', status: 'live' },
  { n: 5, slug: 'tested-on-men', title: 'Women in drug trials against women in adverse-event reports', dek: 'Every new drug since 2015, scored on the share of women in its trials against the share of women among those reporting its side effects.', status: 'live' },
  { n: 6, slug: 'sent-home-with-a-label', title: 'Emergency diagnoses and cancer stage at diagnosis, by sex', dek: '20,808 emergency visits and 4.3 million cancer cases: where women are diagnosed later or tested less than men, and where they are not.', status: 'live' },
]

export const chapterNo = (slug: string) => CHAPTERS.findIndex(c => c.slug === slug) + 1
export const chapterRef = (slug: string) => `Chapter ${chapterNo(slug)}`
