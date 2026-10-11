/** The experiments, in order. Drives the nav chips, the dark theme, the home cards and the index page. */
export type Experiment = { n: number; path: string; label: string; title: string; dek: string; short: string }
export const EXPERIMENTS: Experiment[] = [
  { n: 1, path: '/cycling-brain', label: 'Menstrual cycle', title: 'One woman\'s brain across a menstrual cycle', short: 'Menstrual cycle',
    dek: '30 daily MRI scans and blood tests over one cycle (28andMe, UC Santa Barbara). Brain structure volumes and hormone levels, day by day.' },
  { n: 2, path: '/pregnancy-brain', label: 'Pregnancy', title: 'One woman\'s brain through pregnancy', short: 'Pregnancy',
    dek: '27 MRI scans from three weeks before conception to two years after birth (Maternal Brain Project). Brain structure volumes against their pre-pregnancy size.' },
  { n: 3, path: '/male-brain', label: 'Male comparison', title: 'One man\'s brain, morning and evening, for 30 days', short: 'Male comparison',
    dek: '40 MRI scans at 7 am and 8 pm over 30 days (28andHe), with testosterone and cortisol. The same pipeline as the menstrual cycle study, for comparison.' },
  { n: 4, path: '/your-dose', label: 'Drug dose', title: 'Drug levels in the blood, by sex and body weight', short: 'Drug dose',
    dek: 'A pharmacokinetic simulator for acetaminophen, caffeine and metoprolol, using published sex-specific parameters. Adjustable for weight, oral contraception and pregnancy.' },
]
