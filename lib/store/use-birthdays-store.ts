import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BirthdayRecord } from '../types'
import { BIRTHDAY_COLORS } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

interface BirthdaysState {
  entries: BirthdayRecord[]

  addEntry: (data: { name: string; date: string; notes?: string; color?: string }) => void
  updateEntry: (id: string, patch: Partial<BirthdayRecord>) => void
  deleteEntry: (id: string) => void
}

export const useBirthdaysStore = create<BirthdaysState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: ({ color, ...data }) =>
        set((s) => ({
          entries: [
            {
              id: `bday-${uid()}`,
              ...data,
              color: color ?? BIRTHDAY_COLORS[Math.floor(Math.random() * BIRTHDAY_COLORS.length)],
              createdAt: nowISO(),
            },
            ...s.entries,
          ],
        })),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),
    }),
    { name: 'plannerhub-birthdays' },
  ),
)