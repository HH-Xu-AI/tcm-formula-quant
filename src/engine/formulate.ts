import type {
  FormType,
  FormulaItem,
  FormulaResult,
  Herb,
  Role,
  ScoredHerb,
  SyndromeInput,
  WeightConfig,
} from '../types'
import { FORM_LABELS, ROLE_LABELS } from '../types'

/** 将痰寒热滑块(-3~3)映射到寒痰/热痰权重 */
function phlegmColdHotWeights(v: number): { cold: number; hot: number } {
  const t = Math.max(-3, Math.min(3, v))
  return {
    cold: Math.max(0, (3 - t) / 6),
    hot: Math.max(0, (3 + t) / 6),
  }
}

/** 将痰湿燥滑块(-3~3)映射到湿痰/燥痰权重，负偏湿、正偏燥 */
function phlegmDampDryWeights(v: number): { damp: number; dry: number } {
  const t = Math.max(-3, Math.min(3, v))
  return {
    damp: Math.max(0, (3 - t) / 6),
    dry: Math.max(0, (3 + t) / 6),
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** 寒热互补：患者偏热时偏好寒凉药，反之亦然 */
function natureMatch(herbNature: number, bodyColdHot: number): number {
  // bodyColdHot: -3寒 ~ +3热；目标是药性与之互补（热证用寒药）
  const desired = -bodyColdHot // 热证欲寒药
  const diff = Math.abs(herbNature - desired)
  // diff 0→1.0, diff 6→0
  return clamp01(1 - diff / 6)
}

function phlegmMatch(herb: Herb, input: SyndromeInput): number {
  const ch = phlegmColdHotWeights(input.phlegmColdHot)
  const dd = phlegmDampDryWeights(input.phlegmDampDry)
  const adapt =
    herb.phlegmAdapt.cold * ch.cold +
    herb.phlegmAdapt.hot * ch.hot +
    herb.phlegmAdapt.damp * dd.damp +
    herb.phlegmAdapt.dry * dd.dry
  // adapt 约 0~10，再乘化痰力度，归一化到约 0~10
  const raw = (herb.phlegmForce / 10) * adapt
  const severityBoost = 0.5 + (input.phlegmSeverity / 10) * 0.5
  return Math.min(10, raw * severityBoost)
}

function spleenMatch(herb: Herb, input: SyndromeInput): number {
  const need = input.spleenWeakness / 10
  return herb.spleenStomach * (0.3 + 0.7 * need)
}

function metabolicMatch(herb: Herb, input: SyndromeInput): number {
  const wLipid = input.focusLipid / 10
  const wGlucose = input.focusGlucose / 10
  const wObesity = input.focusObesity / 10
  const sum = wLipid + wGlucose + wObesity || 1
  return (
    (herb.metabolic.lipid * wLipid +
      herb.metabolic.glucose * wGlucose +
      herb.metabolic.turbidity * wObesity) /
    sum
  )
}

export function scoreHerb(
  herb: Herb,
  input: SyndromeInput,
  weights: WeightConfig,
): ScoredHerb {
  const phlegm = phlegmMatch(herb, input)
  const spleen = spleenMatch(herb, input)
  const nature = natureMatch(herb.nature, input.bodyColdHot) * 10
  const metabolic = metabolicMatch(herb, input)

  const wSum = weights.phlegm + weights.spleen + weights.nature + weights.metabolic || 1
  const score =
    (weights.phlegm * phlegm +
      weights.spleen * spleen +
      weights.nature * nature +
      weights.metabolic * metabolic) /
    wSum

  return {
    herb,
    score,
    breakdown: { phlegm, spleen, nature, metabolic },
  }
}

function hasIncompatibility(a: Herb, b: Herb): boolean {
  return (
    a.incompatibilities.includes(b.id) ||
    b.incompatibilities.includes(a.id) ||
    a.incompatibilities.includes(b.name) ||
    b.incompatibilities.includes(a.name)
  )
}

/** 同族药互斥，避免半夏/姜半夏/法半夏等同方并出 */
const HERB_FAMILIES: string[][] = [
  ['banxia', 'jiangbanxia', 'fabanxia'],
  ['baizhu', 'jiaobaizhu'],
  ['zhebeimu', 'chuanbeimu'],
]

function familyOf(id: string): string[] | null {
  return HERB_FAMILIES.find((f) => f.includes(id)) ?? null
}

function sameFamilyConflict(herb: Herb, selected: Herb[]): boolean {
  const fam = familyOf(herb.id)
  if (!fam) return false
  return selected.some((s) => fam.includes(s.id))
}

function isCompatibleWithSet(herb: Herb, selected: Herb[]): boolean {
  if (sameFamilyConflict(herb, selected)) return false
  return selected.every((s) => !hasIncompatibility(herb, s))
}

function weightedNature(items: { herb: Herb; dose: number }[]): number {
  let sum = 0
  let w = 0
  for (const it of items) {
    const weight = it.dose || 1
    sum += it.herb.nature * weight
    w += weight
  }
  return w ? sum / w : 0
}

/** 剂量：按角色与证候程度在常用范围内取值 */
function suggestDose(herb: Herb, role: Role, input: SyndromeInput): number {
  const { min, max } = herb.dosage
  const roleFactor: Record<Role, number> = {
    jun: 0.85,
    chen: 0.7,
    zuo: 0.55,
    shi: 0.4,
  }
  const severity = (input.phlegmSeverity + input.spleenWeakness) / 20
  const t = Math.min(1, roleFactor[role] * (0.6 + 0.4 * severity))
  const dose = min + (max - min) * t
  // 液体（ml）保留整数，固体常见 0.5/1 步进
  if (herb.dosage.unit === 'ml') return Math.round(dose)
  return Math.round(dose * 2) / 2
}

function assignRoles(
  scored: ScoredHerb[],
  locked: ScoredHerb[],
  input: SyndromeInput,
): FormulaItem[] {
  // 目标：君1-2、臣2-3、佐2-3、使1，总 6-10 味
  const selected: ScoredHerb[] = []
  const warnings: string[] = []

  // 先放入锁定药
  for (const s of locked) {
    if (isCompatibleWithSet(s.herb, selected.map((x) => x.herb))) {
      selected.push(s)
    } else {
      warnings.push(`锁定药「${s.herb.name}」与已选药存在配伍禁忌，已跳过冲突处理`)
    }
  }

  // 再按得分补齐，避免重复与禁忌
  for (const s of scored) {
    if (selected.some((x) => x.herb.id === s.herb.id)) continue
    if (!isCompatibleWithSet(s.herb, selected.map((x) => x.herb))) continue
    selected.push(s)
    if (selected.length >= 9) break
  }

  // 至少 6 味：若不够继续放宽（跳过禁忌检查以外的低分药）
  if (selected.length < 6) {
    for (const s of scored) {
      if (selected.some((x) => x.herb.id === s.herb.id)) continue
      if (!isCompatibleWithSet(s.herb, selected.map((x) => x.herb))) continue
      selected.push(s)
      if (selected.length >= 6) break
    }
  }

  // 按得分排序后分配角色
  const ordered = [...selected].sort((a, b) => b.score - a.score)
  const n = ordered.length
  const junCount = n >= 8 ? 2 : 1
  const chenCount = n >= 9 ? 3 : 2

  const roles: Role[] = new Array(n).fill('zuo')
  const lockedIds = new Set(locked.map((s) => s.herb.id))
  const used = new Set<number>()

  const pickIndex = (pred: (s: ScoredHerb, i: number) => boolean, fallback = true): number => {
    for (let i = 0; i < n; i++) {
      if (used.has(i)) continue
      if (pred(ordered[i], i)) return i
    }
    if (!fallback) return -1
    for (let i = 0; i < n; i++) {
      if (!used.has(i)) return i
    }
    return -1
  }

  // 君：优先锁定药中得分最高者，再补高分化痰药
  for (let k = 0; k < junCount; k++) {
    let idx = pickIndex((s) => lockedIds.has(s.herb.id), false)
    if (idx < 0) idx = pickIndex(() => true)
    if (idx >= 0) {
      roles[idx] = 'jun'
      used.add(idx)
    }
  }

  // 臣：剩余锁定药 + 高分药
  for (let k = 0; k < chenCount; k++) {
    let idx = pickIndex((s) => lockedIds.has(s.herb.id), false)
    if (idx < 0) idx = pickIndex(() => true)
    if (idx >= 0) {
      roles[idx] = 'chen'
      used.add(idx)
    }
  }

  // 使：优先甘草，否则取剩余中得分最低者
  {
    let shiIdx = pickIndex((s) => s.herb.id === 'gancao', false)
    if (shiIdx < 0) {
      for (let i = n - 1; i >= 0; i--) {
        if (!used.has(i)) {
          shiIdx = i
          break
        }
      }
    }
    if (shiIdx >= 0) {
      roles[shiIdx] = 'shi'
      used.add(shiIdx)
    }
  }

  // 其余为佐
  for (let i = 0; i < n; i++) {
    if (!used.has(i)) roles[i] = 'zuo'
  }

  const items: FormulaItem[] = ordered.map((s, i) => {
    const role = roles[i] ?? 'zuo'
    const dose = suggestDose(s.herb, role, input)
    const reason = buildReason(s, role)
    return { herb: s.herb, role, dose, score: s.score, reason }
  })

  // 寒热平衡微调：若全方过偏，尝试替换/已包含的寒热药通过剂量微调
  const targetNature = -input.bodyColdHot * 0.6
  let balance = weightedNature(items)
  if (Math.abs(balance - targetNature) > 1.2) {
    // 对偏离方向的药微调剂量
    for (const it of items) {
      if (balance > targetNature + 0.5 && it.herb.nature > 0) {
        it.dose = Math.max(it.herb.dosage.min, it.dose * 0.85)
      } else if (balance < targetNature - 0.5 && it.herb.nature < 0) {
        it.dose = Math.max(it.herb.dosage.min, it.dose * 0.85)
      } else if (balance > targetNature + 0.5 && it.herb.nature < 0) {
        it.dose = Math.min(it.herb.dosage.max, it.dose * 1.1)
      } else if (balance < targetNature - 0.5 && it.herb.nature > 0) {
        it.dose = Math.min(it.herb.dosage.max, it.dose * 1.1)
      }
      if (it.herb.dosage.unit !== 'ml') {
        it.dose = Math.round(it.dose * 2) / 2
      } else {
        it.dose = Math.round(it.dose)
      }
    }
    balance = weightedNature(items)
  }

  void warnings
  return items
}

function buildReason(s: ScoredHerb, role: Role): string {
  const parts: string[] = []
  const b = s.breakdown
  const ranked = [
    { k: '化痰', v: b.phlegm },
    { k: '脾胃', v: b.spleen },
    { k: '寒热', v: b.nature },
    { k: '代谢', v: b.metabolic },
  ].sort((a, b) => b.v - a.v)

  parts.push(`综合分 ${s.score.toFixed(1)}`)
  parts.push(`主贡献：${ranked[0].k}(${ranked[0].v.toFixed(1)})、${ranked[1].k}(${ranked[1].v.toFixed(1)})`)
  if (s.herb.note) parts.push(s.herb.note.split('；')[0] || s.herb.note)
  parts.push(`任${ROLE_LABELS[role]}药`)
  return parts.join('；')
}

function recommendForm(items: FormulaItem[], input: SyndromeInput): {
  recommendedForm: FormType
  formScores: Record<FormType, number>
} {
  const forms: FormType[] = ['decoction', 'granule', 'pill', 'paste']
  const formScores = {} as Record<FormType, number>

  for (const f of forms) {
    const vals = items.map((it) => it.herb.formSuit[f])
    // 取几何平均，短板明显拉低
    const geo = Math.exp(vals.reduce((a, v) => a + Math.log(Math.max(0.5, v)), 0) / vals.length)
    formScores[f] = geo
  }

  // 长期调理（痰不极重、脾胃弱）偏向丸/颗粒
  const chronic = input.phlegmSeverity < 8 && input.spleenWeakness >= 5
  if (chronic) {
    formScores.pill *= 1.15
    formScores.granule *= 1.1
    formScores.paste *= 1.08
  }
  // 有竹沥等低丸散适宜性时已自然拉低

  let recommendedForm: FormType = 'decoction'
  let best = -1
  for (const f of forms) {
    if (formScores[f] > best) {
      best = formScores[f]
      recommendedForm = f
    }
  }
  return { recommendedForm, formScores }
}

function buildExplanation(
  items: FormulaItem[],
  input: SyndromeInput,
  natureBalance: number,
  form: FormType,
): string {
  const byRole = (r: Role) => items.filter((i) => i.role === r)
  const nameList = (arr: FormulaItem[]) => arr.map((i) => `${i.herb.name}${i.dose}${i.herb.dosage.unit}`).join('、')

  const phlegmDesc =
    input.phlegmColdHot > 0.5 ? '热痰偏盛' : input.phlegmColdHot < -0.5 ? '寒痰偏盛' : '痰浊寒热不显'
  const dampDesc = input.phlegmDampDry < -0.5 ? '兼湿痰' : input.phlegmDampDry > 0.5 ? '兼燥痰' : '湿燥大致平衡'
  const spleenDesc = input.spleenWeakness >= 6 ? '脾胃虚弱明显，当标本兼顾' : '脾胃尚可，以化痰降浊为主'

  const lines: string[] = []
  lines.push(
    `本方针对代谢综合征之痰浊核心病机，证见${phlegmDesc}、${dampDesc}；${spleenDesc}。`,
  )
  lines.push(
    `组方共 ${items.length} 味：君药 ${nameList(byRole('jun')) || '无'}；臣药 ${nameList(byRole('chen')) || '无'}；佐药 ${nameList(byRole('zuo')) || '无'}；使药 ${nameList(byRole('shi')) || '无'}。`,
  )
  lines.push(
    `全方药性加权均值约 ${natureBalance.toFixed(2)}（-3大寒~+3大热），与患者寒热倾向相校正；建议剂型为「${FORM_LABELS[form]}」。`,
  )

  for (const it of items) {
    lines.push(`【${ROLE_LABELS[it.role]}】${it.herb.name}：${it.reason}`)
  }
  return lines.join('\n')
}

function collectWarnings(items: FormulaItem[]): string[] {
  const warnings: string[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (hasIncompatibility(items[i].herb, items[j].herb)) {
        warnings.push(`配伍警示：${items[i].herb.name} 与 ${items[j].herb.name} 存在禁忌，请复核`)
      }
    }
  }
  for (const it of items) {
    if (it.herb.toxic) warnings.push(`毒性提醒：${it.herb.name} 有毒/宜制用，注意炮制与剂量`)
  }
  const hasZhuli = items.some((i) => i.herb.id === 'zhuli')
  if (hasZhuli) {
    warnings.push('竹沥不宜入丸散，若选丸剂/颗粒请改为冲服或改用天竺黄等替代')
  }
  return warnings
}

export function formulate(
  herbs: Herb[],
  input: SyndromeInput,
  weights: WeightConfig,
  lockedIds: string[] = [],
): FormulaResult {
  const scored = herbs
    .map((h) => scoreHerb(h, input, weights))
    .sort((a, b) => b.score - a.score)

  const locked = lockedIds
    .map((id) => scored.find((s) => s.herb.id === id))
    .filter((x): x is ScoredHerb => !!x)

  // 寒热目标：尽量让候选池在筛选时有多样性
  // 若锁定基础方，保证其优先进入
  const items = assignRoles(scored, locked, input)
  const natureTarget = -input.bodyColdHot * 0.6
  const natureBalance = weightedNature(items)
  const { recommendedForm, formScores } = recommendForm(items, input)
  const explanation = buildExplanation(items, input, natureBalance, recommendedForm)
  const warnings = collectWarnings(items)

  return {
    items,
    natureBalance,
    natureTarget,
    recommendedForm,
    formScores,
    explanation,
    warnings,
  }
}
