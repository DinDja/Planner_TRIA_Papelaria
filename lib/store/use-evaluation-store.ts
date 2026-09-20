import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EvaluationEntry, EvaluationType } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

interface EvaluationState {
  entries: EvaluationEntry[]
  addEntry: (data: {
    type: EvaluationType
    name: string
    rating: EvaluationEntry['rating']
    seasons?: number
    publisher?: string
    observation?: string
  }) => void
  updateEntry: (id: string, patch: Partial<EvaluationEntry>) => void
  deleteEntry: (id: string) => void
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (data) =>
        set((state) => ({
          entries: [
            {
              id: `evaluation-${uid()}`,
              ...data,
              createdAt: nowISO(),
              updatedAt: nowISO(),
            },
            ...state.entries,
          ],
        })),

      updateEntry: (id, patch) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...patch, updatedAt: nowISO() } : entry,
          ),
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
    }),
    { name: 'tria-papelaria-evaluation' },
  ),
)
