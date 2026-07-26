import { useMemo, useState } from 'react'
import type { Herb } from '../types'

interface Props {
  herbs: Herb[]
  onUpdate: (id: string, updater: (h: Herb) => Herb) => void
  onReset: () => void
}

type ScoreField =
  | 'phlegmForce'
  | 'spleenStomach'
  | 'nature'
  | 'phlegmAdapt.cold'
  | 'phlegmAdapt.hot'
  | 'phlegmAdapt.damp'
  | 'phlegmAdapt.dry'
  | 'metabolic.lipid'
  | 'metabolic.glucose'
  | 'metabolic.turbidity'

function setNested(herb: Herb, path: ScoreField, value: number): Herb {
  const next = structuredClone(herb)
  if (path === 'phlegmForce') next.phlegmForce = value
  else if (path === 'spleenStomach') next.spleenStomach = value
  else if (path === 'nature') next.nature = value
  else if (path.startsWith('phlegmAdapt.')) {
    const k = path.split('.')[1] as keyof Herb['phlegmAdapt']
    next.phlegmAdapt[k] = value
  } else if (path.startsWith('metabolic.')) {
    const k = path.split('.')[1] as keyof Herb['metabolic']
    next.metabolic[k] = value
  }
  return next
}

function getNested(herb: Herb, path: ScoreField): number {
  if (path === 'phlegmForce') return herb.phlegmForce
  if (path === 'spleenStomach') return herb.spleenStomach
  if (path === 'nature') return herb.nature
  if (path.startsWith('phlegmAdapt.')) {
    const k = path.split('.')[1] as keyof Herb['phlegmAdapt']
    return herb.phlegmAdapt[k]
  }
  const k = path.split('.')[1] as keyof Herb['metabolic']
  return herb.metabolic[k]
}

const EDIT_FIELDS: { path: ScoreField; label: string; min: number; max: number; step: number }[] = [
  { path: 'phlegmForce', label: '化痰力度', min: 0, max: 10, step: 1 },
  { path: 'phlegmAdapt.cold', label: '寒痰适配', min: 0, max: 10, step: 1 },
  { path: 'phlegmAdapt.hot', label: '热痰适配', min: 0, max: 10, step: 1 },
  { path: 'phlegmAdapt.damp', label: '湿痰适配', min: 0, max: 10, step: 1 },
  { path: 'phlegmAdapt.dry', label: '燥痰适配', min: 0, max: 10, step: 1 },
  { path: 'nature', label: '四气', min: -3, max: 3, step: 1 },
  { path: 'spleenStomach', label: '脾胃', min: 0, max: 10, step: 1 },
  { path: 'metabolic.lipid', label: '降脂', min: 0, max: 10, step: 1 },
  { path: 'metabolic.glucose', label: '降糖', min: 0, max: 10, step: 1 },
  { path: 'metabolic.turbidity', label: '化浊', min: 0, max: 10, step: 1 },
]

export function HerbEditor({ herbs, onUpdate, onReset }: Props) {
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(herbs[0]?.id ?? null)

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return herbs
    return herbs.filter(
      (h) =>
        h.name.includes(key) ||
        h.pinyin.toLowerCase().includes(key) ||
        h.category.includes(key) ||
        h.id.includes(key),
    )
  }, [herbs, q])

  const selected = herbs.find((h) => h.id === selectedId) ?? filtered[0] ?? null

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-xl border border-amber-200/80 bg-white/90 shadow-sm">
      <div className="border-b border-amber-100 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-950">药物量化库</h2>
          <button
            type="button"
            onClick={() => {
              if (confirm('确定恢复默认评分？本地修改将丢失。')) onReset()
            }}
            className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
          >
            恢复默认
          </button>
        </div>
        <input
          type="search"
          placeholder="搜索药名 / 拼音 / 分类…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <p className="mt-1 text-xs text-stone-500">共 {herbs.length} 味 · 修改自动保存到本地</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-5">
        <ul className="overflow-auto border-b border-stone-100 lg:col-span-2 lg:border-b-0 lg:border-r">
          {filtered.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                  selected?.id === h.id ? 'bg-amber-100 font-medium' : ''
                }`}
              >
                <span>
                  {h.name}
                  <span className="ml-2 text-xs font-normal text-stone-400">{h.category}</span>
                </span>
                <span className="font-mono text-xs text-amber-800">{h.phlegmForce}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="overflow-auto p-3 lg:col-span-3">
          {!selected ? (
            <p className="text-sm text-stone-500">请选择药物</p>
          ) : (
            <>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-stone-900">
                  {selected.name}{' '}
                  <span className="text-sm font-normal text-stone-500">{selected.pinyin}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {selected.category} · 剂量 {selected.dosage.min}–{selected.dosage.max}
                  {selected.dosage.unit}
                  {selected.toxic ? ' · 有毒宜制' : ''}
                </p>
                <p className="mt-1 text-xs text-stone-600">{selected.note}</p>
              </div>

              <div className="space-y-3">
                {EDIT_FIELDS.map((f) => (
                  <div key={f.path}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="text-stone-700">{f.label}</span>
                      <span className="font-mono text-amber-800">{getNested(selected, f.path)}</span>
                    </div>
                    <input
                      type="range"
                      className="w-full"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={getNested(selected, f.path)}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        onUpdate(selected.id, (h) => setNested(h, f.path, v))
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-stone-600">
                <div className="rounded bg-stone-50 p-2">
                  汤剂适宜 {selected.formSuit.decoction}
                </div>
                <div className="rounded bg-stone-50 p-2">
                  颗粒适宜 {selected.formSuit.granule}
                </div>
                <div className="rounded bg-stone-50 p-2">丸剂适宜 {selected.formSuit.pill}</div>
                <div className="rounded bg-stone-50 p-2">膏方适宜 {selected.formSuit.paste}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
