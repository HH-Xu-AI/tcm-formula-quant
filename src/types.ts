export type PhlegmType = 'cold' | 'hot' | 'damp' | 'dry'

export type FormType = 'decoction' | 'granule' | 'pill' | 'paste'

export type Role = 'jun' | 'chen' | 'zuo' | 'shi'

export interface DosageRange {
  min: number
  max: number
  unit: string
}

export interface FormSuitability {
  decoction: number
  granule: number
  pill: number
  paste: number
}

export interface PhlegmAdapt {
  cold: number
  hot: number
  damp: number
  dry: number
}

export interface MetabolicScore {
  lipid: number
  glucose: number
  turbidity: number
}

export interface Herb {
  id: string
  name: string
  pinyin: string
  category: string
  phlegmForce: number
  phlegmAdapt: PhlegmAdapt
  nature: number
  spleenStomach: number
  metabolic: MetabolicScore
  dosage: DosageRange
  toxic: boolean
  note: string
  incompatibilities: string[]
  formSuit: FormSuitability
}

export interface SyndromeInput {
  phlegmSeverity: number
  phlegmColdHot: number
  phlegmDampDry: number
  spleenWeakness: number
  bodyColdHot: number
  focusLipid: number
  focusGlucose: number
  focusObesity: number
}

export interface WeightConfig {
  phlegm: number
  spleen: number
  nature: number
  metabolic: number
}

export interface ScoredHerb {
  herb: Herb
  score: number
  breakdown: {
    phlegm: number
    spleen: number
    nature: number
    metabolic: number
  }
}

export interface FormulaItem {
  herb: Herb
  role: Role
  dose: number
  score: number
  reason: string
}

export interface FormulaResult {
  items: FormulaItem[]
  natureBalance: number
  natureTarget: number
  recommendedForm: FormType
  formScores: Record<FormType, number>
  explanation: string
  warnings: string[]
}

export const ROLE_LABELS: Record<Role, string> = {
  jun: '君',
  chen: '臣',
  zuo: '佐',
  shi: '使',
}

export const FORM_LABELS: Record<FormType, string> = {
  decoction: '汤剂',
  granule: '颗粒剂',
  pill: '丸剂',
  paste: '膏方',
}

export const DEFAULT_SYNDROME: SyndromeInput = {
  phlegmSeverity: 7,
  phlegmColdHot: 1,
  phlegmDampDry: -1,
  spleenWeakness: 6,
  bodyColdHot: 0.5,
  focusLipid: 8,
  focusGlucose: 5,
  focusObesity: 7,
}

export const DEFAULT_WEIGHTS: WeightConfig = {
  phlegm: 0.4,
  spleen: 0.2,
  nature: 0.15,
  metabolic: 0.25,
}

export const BASE_LOCK_IDS = ['zhuli', 'chenpi', 'hongqu']
