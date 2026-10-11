export type Source = { id: string; n: number; text: string; url: string }
const LIST: Omit<Source, 'n'>[] = [
  { id: 'murata2024', text: 'Murata EM, Pritschet L, Grotzinger H, Taylor CM, Jacobs EG. Circadian rhythms tied to changes in brain morphology in a densely sampled male. Journal of Neuroscience 2024.', url: 'https://doi.org/10.1523/JNEUROSCI.0573-24.2024' },
  { id: 'grotzinger2024', text: 'Grotzinger H, Pritschet L, Shapturenka P, Santander T, Murata EM, Jacobs EG. Diurnal fluctuations in steroid hormones tied to variation in intrinsic functional connectivity in a densely sampled male. Journal of Neuroscience 2024.', url: 'https://doi.org/10.1523/JNEUROSCI.1856-23.2024' },
  { id: 'openneuro', text: '28andHe. OpenNeuro dataset ds005115, CC0. Ann S. Bowers Women\'s Brain Health Initiative, UC Santa Barbara.', url: 'https://openneuro.org/datasets/ds005115' },
  { id: 'cycling', text: 'The Women\'s Health Record, Experiment 1: The cycling brain (28andMe, the same lab\'s 30-day menstrual-cycle study, same scanner, same pipeline).', url: 'https://lucylepoidevin.github.io/thewomenshealthrecord/#/cycling-brain' },
  { id: 'pritschet2020', text: 'Pritschet L, Santander T, Taylor CM, et al. Functional reorganization of brain networks across the human menstrual cycle. NeuroImage 2020;220:117091.', url: 'https://doi.org/10.1016/j.neuroimage.2020.117091' },
  { id: 'nakamura2015', text: 'Nakamura K, Brown RA, Narayanan S, Collins DL, Arnold DL. Diurnal fluctuations in brain volume: statistical analyses of MRI from large populations. NeuroImage 2015;118:126–132.', url: 'https://doi.org/10.1016/j.neuroimage.2015.05.077' },
  { id: 'unest', text: 'Yu X, Yang Q, Zhou Y, et al. UNesT: Local spatial representation learning with hierarchical transformer for efficient medical segmentation. Medical Image Analysis 2023. Deployed as the MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (Apache-2.0).', url: 'https://github.com/Project-MONAI/model-zoo/tree/dev/models/wholeBrainSeg_Large_UNEST_segmentation' },
  { id: 'mni305', text: 'Evans AC, Collins DL, Mills SR, et al. 3D statistical neuroanatomical models from 305 MRI volumes. IEEE NSS/MIC 1993. Template via TemplateFlow (tpl-MNI305).', url: 'https://www.templateflow.org/' },
  { id: 'ants', text: 'Avants BB, Tustison NJ, Song G, et al. A reproducible evaluation of ANTs similarity metric performance in brain image registration. NeuroImage 2011;54:2033.', url: 'https://github.com/ANTsX/ANTsPy' },
  { id: 'niivue', text: 'NiiVue: a WebGL2 medical image viewer. Hanayik T, Rorden C, et al.', url: 'https://github.com/niivue/niivue' },
]
export const SOURCES: Source[] = LIST.map((s, i) => ({ ...s, n: i + 1 }))
export const src = (id: string) => SOURCES.find(s => s.id === id)!
