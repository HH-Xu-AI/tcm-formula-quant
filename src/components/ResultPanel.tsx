import type { FormulaResult, Role } from '../types'
import { FORM_LABELS, ROLE_LABELS } from '../types'

interface Props {
  result: FormulaResult | null
}

const ROLE_COLORS: Record<Role, string> = {
  jun: 'border-red-300 bg-red-50',
  chen: 'border-orange-300 bg-orange-50',
  zuo: 'border-emerald-300 bg-emerald-50',
  shi: 'border-sky-300 bg-sky-50',
}

const ROLE_BADGE: Record<Role, string> = {
  jun: 'bg-red-600 text-white',
  chen: 'bg-orange-500 text-white',
  zuo: 'bg-emerald-600 text-white',
  shi: 'bg-sky-600 text-white',
}

function NatureGauge({ value, target }: { value: number; target: number }) {
  // -3 ~ +3 → 0% ~ 100%
  const pct = ((value + 3) / 6) * 100
  const targetPct = ((target + 3) / 6) * 100
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-stone-800">全方寒热平衡</span>
        <span className="font-mono text-stone-600">
          实际 {value.toFixed(2)} / 目标 {target.toFixed(2)}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-stone-200 to-rose-400">
        <div
          className="absolute top-0 h-full w-0.5 bg-stone-800"
          style={{ left: `${pct}%` }}
          title="实际"
        />
        <div
          className="absolute -top-1 h-5 w-0.5 border-l border-dashed border-amber-700"
          style={{ left: `${targetPct}%` }}
          title="目标"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>大寒</span>
        <span>平</span>
        <span>大热</span>
      </div>
    </div>
  )
}

export function ResultPanel({ result }: Props) {
  if (!result) {
    return (
      <section className="flex h-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white/50 p-8 text-stone-500">
        调整左侧参数后将自动生成处方建议
      </section>
    )
  }

  const roles: Role[] = ['jun', 'chen', 'zuo', 'shi']
  const formEntries = (Object.entries(result.formScores) as [keyof typeof FORM_LABELS, number][]).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <section className="flex h-full flex-col gap-4 overflow-auto rounded-xl border border-amber-200/80 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-amber-950">处方建议</h2>
        <div className="rounded-full bg-amber-800 px-3 py-1 text-sm text-amber-50">
          推荐剂型：{FORM_LABELS[result.recommendedForm]}
        </div>
      </div>

      <NatureGauge value={result.natureBalance} target={result.natureTarget} />

      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => {
          const items = result.items.filter((i) => i.role === role)
          if (!items.length) return null
          return (
            <div key={role} className={`rounded-lg border p-3 ${ROLE_COLORS[role]}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${ROLE_BADGE[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-xs text-stone-500">{items.length} 味</span>
              </div>
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.herb.id} className="rounded-md bg-white/80 p-2 shadow-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-stone-900">{it.herb.name}</span>
                      <span className="font-mono text-sm text-amber-800">
                        {it.dose}
                        {it.herb.dosage.unit}
                      </span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-xs text-stone-500">
                      <span>{it.herb.category}</span>
                      <span>得分 {it.score.toFixed(1)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">{it.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
        <h3 className="mb-2 text-sm font-medium text-stone-800">剂型适宜度</h3>
        <div className="space-y-1.5">
          {formEntries.map(([form, score]) => (
            <div key={form} className="flex items-center gap-2 text-sm">
              <span className="w-14 text-stone-600">{FORM_LABELS[form]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-stone-200">
                <div
                  className={`h-full rounded ${form === result.recommendedForm ? 'bg-amber-600' : 'bg-stone-400'}`}
                  style={{ width: `${Math.min(100, (score / 10) * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-xs text-stone-500">{score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <h3 className="mb-1 text-sm font-medium text-amber-900">注意事项</h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-amber-900/90">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-stone-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-medium text-stone-800">方解</h3>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
          {result.explanation}
        </pre>
      </div>
    </section>
  )
}
