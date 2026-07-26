import type { SyndromeInput, WeightConfig } from '../types'
import { PRESETS, type Preset } from '../data/presets'

interface Props {
  syndrome: SyndromeInput
  weights: WeightConfig
  lockBase: boolean
  onSyndromeChange: (s: SyndromeInput) => void
  onWeightsChange: (w: WeightConfig) => void
  onLockBaseChange: (v: boolean) => void
  onApplyPreset: (p: Preset) => void
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  leftHint,
  rightHint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  leftHint?: string
  rightHint?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-stone-800">{label}</span>
        <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-amber-900">{value}</span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(leftHint || rightHint) && (
        <div className="mt-0.5 flex justify-between text-xs text-stone-500">
          <span>{leftHint}</span>
          <span>{rightHint}</span>
        </div>
      )}
    </div>
  )
}

export function InputPanel({
  syndrome,
  weights,
  lockBase,
  onSyndromeChange,
  onWeightsChange,
  onLockBaseChange,
  onApplyPreset,
}: Props) {
  const set = <K extends keyof SyndromeInput>(key: K, v: SyndromeInput[K]) =>
    onSyndromeChange({ ...syndrome, [key]: v })

  const setW = <K extends keyof WeightConfig>(key: K, v: WeightConfig[K]) =>
    onWeightsChange({ ...weights, [key]: v })

  return (
    <aside className="flex h-full flex-col overflow-auto rounded-xl border border-amber-200/80 bg-white/90 p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-amber-950">证候参数</h2>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">预设模板</p>
        <div className="flex flex-col gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left transition hover:border-amber-400 hover:bg-amber-50"
            >
              <div className="text-sm font-medium text-stone-800">{p.name}</div>
              <div className="text-xs text-stone-500">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={lockBase}
            onChange={(e) => onLockBaseChange(e.target.checked)}
          />
          <span>
            <span className="font-medium text-amber-950">锁定基础方</span>
            <span className="block text-xs text-stone-600">竹沥 + 陈皮 + 红曲 必入方，模型补齐配伍</span>
          </span>
        </label>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">痰与脾胃</p>
      <Slider
        label="痰浊程度"
        value={syndrome.phlegmSeverity}
        min={0}
        max={10}
        step={0.5}
        leftHint="轻"
        rightHint="重"
        onChange={(v) => set('phlegmSeverity', v)}
      />
      <Slider
        label="痰性寒热"
        value={syndrome.phlegmColdHot}
        min={-3}
        max={3}
        step={0.5}
        leftHint="寒痰"
        rightHint="热痰"
        onChange={(v) => set('phlegmColdHot', v)}
      />
      <Slider
        label="痰性湿燥"
        value={syndrome.phlegmDampDry}
        min={-3}
        max={3}
        step={0.5}
        leftHint="湿痰"
        rightHint="燥痰"
        onChange={(v) => set('phlegmDampDry', v)}
      />
      <Slider
        label="脾胃虚弱"
        value={syndrome.spleenWeakness}
        min={0}
        max={10}
        step={0.5}
        leftHint="健"
        rightHint="虚"
        onChange={(v) => set('spleenWeakness', v)}
      />
      <Slider
        label="整体寒热"
        value={syndrome.bodyColdHot}
        min={-3}
        max={3}
        step={0.5}
        leftHint="偏寒"
        rightHint="偏热"
        onChange={(v) => set('bodyColdHot', v)}
      />

      <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-wide text-stone-500">代谢侧重</p>
      <Slider
        label="血脂异常"
        value={syndrome.focusLipid}
        min={0}
        max={10}
        step={0.5}
        onChange={(v) => set('focusLipid', v)}
      />
      <Slider
        label="血糖异常"
        value={syndrome.focusGlucose}
        min={0}
        max={10}
        step={0.5}
        onChange={(v) => set('focusGlucose', v)}
      />
      <Slider
        label="肥胖/痰浊"
        value={syndrome.focusObesity}
        min={0}
        max={10}
        step={0.5}
        onChange={(v) => set('focusObesity', v)}
      />

      <p className="mb-2 mt-2 text-xs font-medium uppercase tracking-wide text-stone-500">评分权重</p>
      <Slider
        label="化痰匹配 w1"
        value={weights.phlegm}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => setW('phlegm', v)}
      />
      <Slider
        label="脾胃调理 w2"
        value={weights.spleen}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => setW('spleen', v)}
      />
      <Slider
        label="寒热校正 w3"
        value={weights.nature}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => setW('nature', v)}
      />
      <Slider
        label="代谢针对 w4"
        value={weights.metabolic}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => setW('metabolic', v)}
      />
    </aside>
  )
}
