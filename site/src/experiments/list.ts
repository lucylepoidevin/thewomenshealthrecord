/** The experiments, in order. Drives the nav chips, the dark theme, the home cards and the index page. */
export type Experiment = { n: number; path: string; label: string; title: string; dek: string; short: string }
export const EXPERIMENTS: Experiment[] = [
  { n: 1, path: '/cycling-brain', label: 'The cycling brain', title: 'The cycling brain', short: 'Her month',
    dek: 'Thirty consecutive mornings across a menstrual cycle, hormones drawn alongside. Drag through the month and watch her brain, with any of 23 structures measured each day.' },
  { n: 2, path: '/pregnancy-brain', label: 'The pregnant brain', title: 'The pregnant brain', short: 'Her pregnancy',
    dek: 'Twenty-seven scans from three weeks before conception to two years after the birth. Watch a brain change through pregnancy, every structure measured against its pre-pregnancy size.' },
  { n: 3, path: '/male-brain', label: "A man's month", title: "A man's month", short: 'His month',
    dek: 'The companion study: forty scans in thirty days at 7 am and 8 pm, on the same scanner, with testosterone and cortisol alongside. His brain keeps a daily rhythm; her month sits beside it.' },
  { n: 4, path: '/your-dose', label: 'Your dose', title: 'Your body, your dose', short: 'The dose',
    dek: "Same pill, different body. Acetaminophen, caffeine and a common heart drug drawn over a day in a woman's body and a man's, from the published sex-specific numbers. On the pill, pregnant, any weight." },
]
