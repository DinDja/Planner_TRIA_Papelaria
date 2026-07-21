import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TrashItem {
  id: string
  type: string
  label: string
  detail?: string
  deletedAt: number
  originalModule: string
  data: unknown
}

interface TrashState {
  items: TrashItem[]

  addItem: (item: Omit<TrashItem, 'deletedAt'>) => void
  removeItem: (id: string) => void
  clearAll: () => void
}

let counter = 0

export const useTrashStore = create<TrashState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({
          items: [
            { ...item, deletedAt: Date.now(), id: item.id || `trash-${++counter}` },
            ...s.items,
          ].slice(0, 100),
        })),

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),

      clearAll: () => set({ items: [] }),
    }),
    { name: 'plannerhub-trash' },
  ),
)
