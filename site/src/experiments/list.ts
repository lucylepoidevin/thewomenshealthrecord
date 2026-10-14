/** The experiments, in order. Drives the nav chips, the dark theme, the home cards and the index page. */
export type Experiment = { n: number; path: string; label: string; title: string; dek: string; short: string }
export const EXPERIMENTS: Experiment[] = [
  { n: 1, path: '/cycling-brain', label: 'Menstrual cycle', title: 'One woman\'s brain across a menstrual cycle', short: 'Menstrual cycle',
    dek: '30 daily MRI scans and blood tests over one cycle (28andMe, UC Santa Barbara). Brain structure volumes and hormone levels measured day by day.' },
  { n: 2, path: '/pregnancy-brain', label: 'Pregnancy', title: 'One woman\'s brain through pregnancy', short: 'Pregnancy',
    dek: '27 MRI scans from three weeks before conception to two years after birth (Maternal Brain Project). Brain structure volumes relative to their pre-pregnancy size.' },
  { n: 3, path: '/male-brain', label: 'Male comparison', title: 'One man\'s brain, morning and evening, for 30 days', short: 'Male comparison',
    dek: '40 MRI scans at 7 am and 8 pm over 30 days (28andHe), with testosterone and cortisol. Processed with the same pipeline as the menstrual cycle study to allow comparison.' },
  { n: 4, path: '/your-dose', label: 'Drug dose', title: 'Drug levels in the blood, by sex and body weight', short: 'Drug dose',
    dek: 'A pharmacokinetic simulator for acetaminophen, caffeine and metoprolol, using published sex-specific parameters. Adjustable for body weight, oral contraception and pregnancy.' },
  { n: 5, path: '/ingredient-check', label: 'Ingredient check', title: 'Cosmetic ingredients against the official hormone-disruptor lists', short: 'Ingredient check',
    dek: 'Paste a product\'s ingredient list. Each ingredient on the EU endocrine disruptor lists or California\'s Proposition 65 list is returned with the list\'s own grade, a note and the source.' },
  { n: 6, path: '/dense-breast', label: 'Breast density', title: 'Breast density, and what a mammogram can miss', short: 'Breast density',
    dek: 'Synthetic mammograms from the FDA at four breast densities, some with a mass and some without. The reader may attempt to locate the mass; the screening data that follow give the prevalence of dense breasts, interval cancer rates and cancer rates by density.' },
  { n: 7, path: '/mammography-access', label: 'Mammography access', title: 'Mammography facilities by county, and the counties with none', short: 'Mammography access',
    dek: 'Every FDA-certified mammography facility placed on a county map and counted against the women aged 40 to 74 who live there, followed by the counties with none and the distance from each to the nearest facility.' },
  { n: 8, path: '/mammography-ai', label: 'Mammography AI', title: 'Who the FDA\'s mammography AI was tested on', short: 'Mammography AI',
    dek: 'Every FDA-authorised AI that reads mammograms, and what its public summary reports about the test patients: their number, their origin, the imaging systems named, and whether age, race and breast density were reported.' },
]
