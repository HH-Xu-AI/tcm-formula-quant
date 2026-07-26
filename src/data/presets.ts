import type { SyndromeInput, WeightConfig } from '../types'
import { DEFAULT_SYNDROME, DEFAULT_WEIGHTS } from '../types'

export interface Preset {
  id: string
  name: string
  desc: string
  syndrome: SyndromeInput
  weights?: WeightConfig
  lockBase: boolean
}

export const PRESETS: Preset[] = [
  {
    id: 'tanre',
    name: '痰热型代谢综合征',
    desc: '痰浊偏热、湿痰明显，血脂升高，脾胃中等',
    syndrome: {
      ...DEFAULT_SYNDROME,
      phlegmSeverity: 8,
      phlegmColdHot: 1.5,
      phlegmDampDry: -1.5,
      spleenWeakness: 5,
      bodyColdHot: 1.2,
      focusLipid: 8,
      focusGlucose: 5,
      focusObesity: 7,
    },
    lockBase: true,
  },
  {
    id: 'tanhanshi',
    name: '寒湿痰浊型',
    desc: '寒痰湿浊、脾虚明显，宜温化燥湿',
    syndrome: {
      ...DEFAULT_SYNDROME,
      phlegmSeverity: 7,
      phlegmColdHot: -1.5,
      phlegmDampDry: -2,
      spleenWeakness: 8,
      bodyColdHot: -1,
      focusLipid: 7,
      focusGlucose: 4,
      focusObesity: 8,
    },
    lockBase: false,
  },
  {
    id: 'pixutan',
    name: '脾虚生痰型',
    desc: '以健脾绝生痰之源为主，兼化痰降浊',
    syndrome: {
      ...DEFAULT_SYNDROME,
      phlegmSeverity: 6,
      phlegmColdHot: 0,
      phlegmDampDry: -1,
      spleenWeakness: 9,
      bodyColdHot: 0,
      focusLipid: 6,
      focusGlucose: 6,
      focusObesity: 7,
    },
    weights: { ...DEFAULT_WEIGHTS, spleen: 0.35, phlegm: 0.3, metabolic: 0.2, nature: 0.15 },
    lockBase: true,
  },
  {
    id: 'gaoxuezhi',
    name: '高脂痰浊型',
    desc: '突出降脂化浊，红曲、山楂类权重高',
    syndrome: {
      ...DEFAULT_SYNDROME,
      phlegmSeverity: 7,
      phlegmColdHot: 0.5,
      phlegmDampDry: -1,
      spleenWeakness: 5,
      bodyColdHot: 0.3,
      focusLipid: 10,
      focusGlucose: 3,
      focusObesity: 8,
    },
    weights: { ...DEFAULT_WEIGHTS, metabolic: 0.35, phlegm: 0.35, spleen: 0.15, nature: 0.15 },
    lockBase: true,
  },
]
