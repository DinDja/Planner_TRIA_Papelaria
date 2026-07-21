import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit, HabitFrequency, HabitLog, Weekday } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const today = dayStr()

const seedHabits: Habit[] = [
  { id: 'hab-seed-1', name: 'Beber 2L de água', color: '#5b8dbf', frequency: 'daily', createdAt: nowISO(), archived: false },
  { id: 'hab-seed-2', name: 'Meditar 10 min', color: '#c9b6e4', frequency: 'daily', createdAt: nowISO(), archived: false },
  { id: 'hab-seed-3', name: 'Academia', color: '#7bb686', frequency: 'weekly', weekdays: [0, 1, 3, 4], createdAt: nowISO(), archived: false },
  { id: 'hab-seed-4', name: 'Ler 30 min', color: '#f0b429', frequency: 'daily', createdAt: nowISO(), archived: false },
  { id: 'hab-seed-5', name: 'Review financeira', color: '#e05b6d', frequency: 'monthly', dayOfMonth: 1, createdAt: nowISO(), archived: false },
]

const seedLogs: HabitLog[] = [
  // Últimos 7 dias de cada hábito — alternados para simular
  ...Array.from({ length: 7 }, (_, i) => {
    const date = dayStr(-6 + i)
    const r = Math.random()
    return [
      { id: `log-seed-w-${i}`, habitId: 'hab-seed-1', date, completed: r > 0.3, createdAt: nowISO() },
      { id: `log-seed-m-${i}`, habitId: 'hab-seed-2', date, completed: r > 0.4, createdAt: nowISO() },
      { id: `log-seed-a-${i}`, habitId: 'hab-seed-4', date, completed: r > 0.35, createdAt: nowISO() },
    ]
  }).flat(),
]

interface HabitsState {
  habits: Habit[]
  logs: HabitLog[]

  addHabit: (data: { name: string; description?: string; color?: string; frequency: HabitFrequency; weekdays?: Weekday[]; dayOfMonth?: number }) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  archiveHabit: (id: string) => void
  deleteHabit: (id: string) => void

  /** Toggle completed status for a habit on a specific date */
  toggleLog: (habitId: string, date: string) => void
  /** Check if a habit is completed on a date */
  isCompleted: (habitId: string, date: string) => boolean
  /** Get completion count in date range */
  getCompletionCount: (habitId: string, from: string, to: string) => number
  /** Current streak for a habit (consecutive days backward) */
  getStreak: (habitId: string) => number
  /** All dates a habit was completed (for heatmap) */
  getCompletedDates: (habitId: string, from: string, to: string) => Set<string>
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: seedHabits,
      logs: seedLogs,

      addHabit: ({ color = '#7bb686', ...data }) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: `hab-${uid()}`,
              ...data,
              color,
              createdAt: nowISO(),
              archived: false,
            },
          ],
        })),

      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      archiveHabit: (id) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, archived: !h.archived } : h,
          ),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habitId !== id),
        })),

      toggleLog: (habitId, date) =>
        set((s) => {
          const existing = s.logs.find(
            (l) => l.habitId === habitId && l.date === date,
          )
          if (existing) {
            return {
              logs: s.logs.map((l) =>
                l.id === existing.id ? { ...l, completed: !l.completed } : l,
              ),
            }
          }
          return {
            logs: [
              ...s.logs,
              {
                id: `log-${uid()}`,
                habitId,
                date,
                completed: true,
                createdAt: nowISO(),
              },
            ],
          }
        }),

      isCompleted: (habitId, date) =>
        get().logs.some((l) => l.habitId === habitId && l.date === date && l.completed),

      getCompletionCount: (habitId, from, to) =>
        get().logs.filter(
          (l) =>
            l.habitId === habitId &&
            l.completed &&
            l.date >= from &&
            l.date <= to,
        ).length,

      getStreak: (habitId) => {
        const logs = get().logs.filter((l) => l.habitId === habitId)
        let streak = 0
        const today = new Date()
        // Go backwards from yesterday (today may not be done yet)
        for (let i = 0; i < 365; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const ds = dayStrFromDate(d)
          const log = logs.find((l) => l.date === ds)
          if (log?.completed) {
            streak++
          } else if (i > 0) {
            break
          }
        }
        return streak
      },

      getCompletedDates: (habitId, from, to) =>
        new Set(
          get()
            .logs.filter(
              (l) =>
                l.habitId === habitId && l.completed && l.date >= from && l.date <= to,
            )
            .map((l) => l.date),
        ),
    }),
    { name: 'plannerhub-habits' },
  ),
)

function dayStrFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
