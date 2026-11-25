import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CalendarPlannerWeek {
  notesByDate: Record<string, string[]>
  objectives: string[]
  gratitude: string
}

interface CalendarPlannerState {
  weeks: Record<string, CalendarPlannerWeek>
  setNote: (weekKey: string, date: string, index: number, value: string) => void
  addObjective: (weekKey: string, objective: string) => void
  updateObjective: (weekKey: string, index: number, objective: string) => void
  removeObjective: (weekKey: string, index: number) => void
  setGratitude: (weekKey: string, value: string) => void
}

export const EMPTY_CALENDAR_WEEK: CalendarPlannerWeek = {
  notesByDate: {},
  objectives: [],
  gratitude: '',
}

const getWeek = (weeks: Record<string, CalendarPlannerWeek>, weekKey: string) =>
  weeks[weekKey] ?? EMPTY_CALENDAR_WEEK

export const useCalendarPlannerStore = create<CalendarPlannerState>()(
  persist(
    (set) => ({
      weeks: {},

      setNote: (weekKey, date, index, value) =>
        set((state) => {
          const current = getWeek(state.weeks, weekKey)
          const notes = [...(current.notesByDate[date] ?? ['', '', '', '', ''])]
          notes[index] = value
          return {
            weeks: {
              ...state.weeks,
              [weekKey]: {
                ...current,
                notesByDate: { ...current.notesByDate, [date]: notes },
              },
            },
          }
        }),

      addObjective: (weekKey, objective) =>
        set((state) => {
          const current = getWeek(state.weeks, weekKey)
          const objectives = [...current.objectives.filter((item) => item.trim()), objective]
          return {
            weeks: { ...state.weeks, [weekKey]: { ...current, objectives } },
          }
        }),

      updateObjective: (weekKey, index, objective) =>
        set((state) => {
          const current = getWeek(state.weeks, weekKey)
          const objectives = [...current.objectives]
          objectives[index] = objective
          return {
            weeks: { ...state.weeks, [weekKey]: { ...current, objectives } },
          }
        }),

      removeObjective: (weekKey, index) =>
        set((state) => {
          const current = getWeek(state.weeks, weekKey)
          const objectives = current.objectives.filter((_, objectiveIndex) => objectiveIndex !== index)
          return {
            weeks: { ...state.weeks, [weekKey]: { ...current, objectives } },
          }
        }),

      setGratitude: (weekKey, value) =>
        set((state) => {
          const current = getWeek(state.weeks, weekKey)
          return {
            weeks: { ...state.weeks, [weekKey]: { ...current, gratitude: value } },
          }
        }),
    }),
    { name: 'tria-papelaria-calendar-planner' },
  ),
)
