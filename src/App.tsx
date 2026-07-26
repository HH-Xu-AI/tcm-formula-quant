import { useMemo, useState } from 'react'
import { InputPanel } from './components/InputPanel'
import { ResultPanel } from './components/ResultPanel'
import { HerbEditor } from './components/HerbEditor'
import { formulate } from './engine/formulate'
import { useHerbStore } from './hooks/useHerbStore'
import type { Preset } from './data/presets'
import {
  BASE_LOCK_IDS,
  DEFAULT_SYNDROME,
  DEFAULT_WEIGHTS,
  type SyndromeInput,
  type WeightConfig,
} from './types'

type Tab = 'formula' | 'library'

export default function App() {
  const { herbs, updateHerbNested, reset } = useHerbStore()
  const [tab, setTab] = useState<Tab>('formula')
  const [syndrome, setSyndrome] = useState<SyndromeInput>(DEFAULT_SYNDROME)
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS)
  const [lockBase, setLockBase] = useState(true)

  const result = useMemo(
    () => formulate(herbs, syndrome, weights, lockBase ? BASE_LOCK_IDS : []),
    [herbs, syndrome, weights, lockBase],
  )

  const applyPreset = (p: Preset) => {
    setSyndrome(p.syndrome)
    if (p.weights) setWeights(p.weights)
    setLockBase(p.lockBase)
    setTab('formula')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f5f0e8_0%,#efe6d6_45%,#e8dcc8_100%)]">
      <header className="border-b border-amber-900/10 bg-amber-950 text-amber-50">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-wide md:text-2xl">
              中医新药组方量化模型
            </h1>
            <p className="mt-0.5 text-sm text-amber-200/90">代谢综合征 · 以痰为核心病机</p>
          </div>
          <nav className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('formula')}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === 'formula' ? 'bg-amber-100 text-amber-950' : 'bg-amber-900/50 hover:bg-amber-900'
              }`}
            >
              组方计算
            </button>
            <button
              type="button"
              onClick={() => setTab('library')}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === 'library' ? 'bg-amber-100 text-amber-950' : 'bg-amber-900/50 hover:bg-amber-900'
              }`}
            >
              药物库编辑
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-4">
        {tab === 'formula' ? (
          <div className="grid h-[calc(100vh-7.5rem)] gap-4 lg:grid-cols-[340px_1fr]">
            <InputPanel
              syndrome={syndrome}
              weights={weights}
              lockBase={lockBase}
              onSyndromeChange={setSyndrome}
              onWeightsChange={setWeights}
              onLockBaseChange={setLockBase}
              onApplyPreset={applyPreset}
            />
            <ResultPanel result={result} />
          </div>
        ) : (
          <div className="h-[calc(100vh-7.5rem)]">
            <HerbEditor herbs={herbs} onUpdate={updateHerbNested} onReset={reset} />
          </div>
        )}
      </main>

      <footer className="pb-4 text-center text-xs text-stone-500">
        评分依据《中药学》与药典常识拟定，仅供科研组方探索，不构成临床用药指导
      </footer>
    </div>
  )
}
