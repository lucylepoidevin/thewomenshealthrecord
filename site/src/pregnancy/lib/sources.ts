export type Source = { id: string; n: number; text: string; url: string }
const LIST: Omit<Source, 'n'>[] = [
  { id: 'pritschet2024', text: 'Pritschet L, Taylor CM, Cossio D, et al. Neuroanatomical changes observed over the course of a human pregnancy. Nature Neuroscience 2024;27:2253–2260.', url: 'https://doi.org/10.1038/s41593-024-01741-0' },
  { id: 'openneuro', text: 'Maternal Brain Project (pilot). OpenNeuro dataset ds005299, v1.0.0, CC0. Ann S. Bowers Women\'s Brain Health Initiative, UC Santa Barbara, and UC Irvine.', url: 'https://openneuro.org/datasets/ds005299' },
  { id: 'hoekzema2017', text: 'Hoekzema E, Barba-Müller E, Pozzobon C, et al. Pregnancy leads to long-lasting changes in human brain structure. Nature Neuroscience 2017;20:287–296.', url: 'https://doi.org/10.1038/nn.4458' },
  { id: 'unest', text: 'Yu X, Yang Q, Zhou Y, et al. UNesT: Local spatial representation learning with hierarchical transformer for efficient medical segmentation. Medical Image Analysis 2023. Deployed as the MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (Apache-2.0).', url: 'https://github.com/Project-MONAI/model-zoo/tree/dev/models/wholeBrainSeg_Large_UNEST_segmentation' },
  { id: 'mni305', text: 'Evans AC, Collins DL, Mills SR, et al. 3D statistical neuroanatomical models from 305 MRI volumes. IEEE NSS/MIC 1993. Template via TemplateFlow (tpl-MNI305).', url: 'https://www.templateflow.org/' },
  { id: 'ants', text: 'Avants BB, Tustison NJ, Song G, et al. A reproducible evaluation of ANTs similarity metric performance in brain image registration. NeuroImage 2011;54:2033. N4: Tustison NJ et al., IEEE TMI 2010.', url: 'https://github.com/ANTsX/ANTsPy' },
  { id: 'niivue', text: 'NiiVue: a WebGL2 medical image viewer. Hanayik T, Rorden C, et al.', url: 'https://github.com/niivue/niivue' },
  { id: 'wbhi', text: 'Ann S. Bowers Women\'s Brain Health Initiative, UC Santa Barbara. Maternal Brain Project.', url: 'https://wbhi.ucsb.edu/' },
  { id: 'cycling', text: 'The Women\'s Health Record, Experiment 1: One woman\'s brain across a menstrual cycle (28andMe, the same lab\'s 30-day menstrual-cycle study).', url: 'https://lucylepoidevin.github.io/thewomenshealthrecord/#/cycling-brain' },
]
export const SOURCES: Source[] = LIST.map((s, i) => ({ ...s, n: i + 1 }))
export const src = (id: string) => SOURCES.find(s => s.id === id)!
