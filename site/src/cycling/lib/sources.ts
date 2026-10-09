export type Source = { id: string; n: number; text: string; url: string }

const LIST: Omit<Source, 'n'>[] = [
  { id: 'pritschet2020', text: 'Pritschet L, Santander T, Taylor CM, et al. Functional reorganization of brain networks across the human menstrual cycle. NeuroImage 2020;220:117091.', url: 'https://doi.org/10.1016/j.neuroimage.2020.117091' },
  { id: 'taylor2020', text: 'Taylor CM, Pritschet L, Olsen RK, et al. Progesterone shapes medial temporal lobe volume across the human menstrual cycle. NeuroImage 2020;220:117125.', url: 'https://doi.org/10.1016/j.neuroimage.2020.117125' },
  { id: 'openneuro', text: '28andMe. OpenNeuro dataset ds002674, v1.0.5, CC0. Ann S. Bowers Women\'s Brain Health Initiative, UC Santa Barbara.', url: 'https://openneuro.org/datasets/ds002674' },
  { id: 'my28brains', text: 'Myers A, Taylor C, Jacobs E, Miolane N. Geodesic regression characterizes 3D shape changes in the female brain during menstruation. ICCV Workshops 2023. Hormone table reproduced from the open my28brains repository.', url: 'https://github.com/geometric-intelligence/my28brains' },
  { id: 'unest', text: 'Yu X, Yang Q, Zhou Y, et al. UNesT: Local spatial representation learning with hierarchical transformer for efficient medical segmentation. Medical Image Analysis 2023. Deployed as the MONAI model-zoo bundle wholeBrainSeg_Large_UNEST_segmentation (Apache-2.0).', url: 'https://github.com/Project-MONAI/model-zoo/tree/dev/models/wholeBrainSeg_Large_UNEST_segmentation' },
  { id: 'mni305', text: 'Evans AC, Collins DL, Mills SR, et al. 3D statistical neuroanatomical models from 305 MRI volumes. IEEE NSS/MIC 1993. Template via TemplateFlow (tpl-MNI305).', url: 'https://www.templateflow.org/' },
  { id: 'ants', text: 'Avants BB, Tustison NJ, Song G, et al. A reproducible evaluation of ANTs similarity metric performance in brain image registration. NeuroImage 2011;54:2033. N4: Tustison NJ et al., IEEE TMI 2010.', url: 'https://github.com/ANTsX/ANTsPy' },
  { id: 'mueller2021', text: 'Mueller JM, Pritschet L, Santander T, et al. Dynamic community detection reveals transient reorganization of functional brain networks across a female menstrual cycle. Network Neuroscience 2021;5:125.', url: 'https://doi.org/10.1162/netn_a_00169' },
  { id: 'heller2025', text: 'Heller C, Güllmar D, Colic L, et al. Hormonal milieu influences whole-brain structural dynamics across the menstrual cycle using dense sampling in multiple individuals. Nature Neuroscience 2025;28:2588.', url: 'https://doi.org/10.1038/s41593-025-02066-2' },
  { id: 'niivue', text: 'NiiVue: a WebGL2 medical image viewer. Hanayik T, Rorden C, et al.', url: 'https://github.com/niivue/niivue' },
  { id: 'jacobslab', text: 'Jacobs Lab, UC Santa Barbara. 28andMe project page.', url: 'https://jacobs.psych.ucsb.edu/research/28-and-me' },
  { id: 'monai', text: 'Cardoso MJ, et al. MONAI: An open-source framework for deep learning in healthcare. 2022.', url: 'https://monai.io/' },
]

export const SOURCES: Source[] = LIST.map((s, i) => ({ ...s, n: i + 1 }))
export const src = (id: string) => SOURCES.find(s => s.id === id)!
