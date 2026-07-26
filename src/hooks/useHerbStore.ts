import { useEffect, useState } from 'react'
import type { Herb } from '../types'
import defaultHerbs from '../data/herbs.json'

const STORAGE_KEY = 'tcm-formula-herbs-v1'

export function loadHerbs(): Herb[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Herb[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  return defaultHerbs as Herb[]
}

export function saveHerbs(herbs: Herb[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(herbs))
}

export function resetHerbs(): Herb[] {
  localStorage.removeItem(STORAGE_KEY)
  return defaultHerbs as Herb[]
}

export function useHerbStore() {
  const [herbs, setHerbs] = useState<Herb[]>(() => loadHerbs())

  useEffect(() => {
    saveHerbs(herbs)
  }, [herbs])

  const updateHerb = (id: string, patch: Partial<Herb>) => {
    setHerbs((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  const updateHerbNested = (id: string, updater: (h: Herb) => Herb) => {
    setHerbs((prev) => prev.map((h) => (h.id === id ? updater(h) : h)))
  }

  const reset = () => setHerbs(resetHerbs())

  return { herbs, setHerbs, updateHerb, updateHerbNested, reset }
}
