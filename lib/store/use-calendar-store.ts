import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarEvent } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

/** YYYY-MM-DD a partir de hoje + offset */
const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const seedEvents: CalendarEvent[] = [
  {
    id: 'cal-seed-1',
    title: 'Aula de Cálculo',
    date: dayStr(0),
    startTime: '08:00',
    endTime: '09:30',
    color: '#5b8dbf',
    plannerId: 'pl-2',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-2',
    title: 'Daily Stand-up',
    date: dayStr(0),
    startTime: '10:00',
    endTime: '11:00',
    color: '#c9b6e4',
    plannerId: 'pl-3',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-3',
    title: 'Almoço com equipe',
    date: dayStr(0),
    startTime: '12:30',
    endTime: '13:30',
    color: '#f0b429',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-4',
    title: 'Revisão financeira',
    date: dayStr(1),
    startTime: '14:00',
    endTime: '15:00',
    color: '#7bb686',
    plannerId: 'pl-5',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-5',
    title: 'Treino funcional',
    date: dayStr(2),
    startTime: '16:00',
    endTime: '17:30',
    color: '#e05b6d',
    plannerId: 'pl-4',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-6',
    title: 'Aniversário da Maria',
    date: dayStr(3),
    startTime: '00:00',
    allDay: true,
    color: '#e8a0a0',
    createdAt: nowISO(),
  },
  {
    id: 'cal-seed-7',
    title: 'Entrega relatório mensal',
    date: dayStr(5),
    startTime: '09:00',
    endTime: '18:00',
    color: '#e05b6d',
    notes: 'Enviar para o gerente até as 18h',
    createdAt: nowISO(),
  },
]

interface CalendarState {
  events: CalendarEvent[]

  addEvent: (data: {
    title: string
    date: string
    startTime: string
    endTime?: string
    allDay?: boolean
    color?: string
    notes?: string
    taskId?: string
    plannerId?: string
  }) => void

  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: seedEvents,

      addEvent: ({ color = '#5b8dbf', ...rest }) =>
        set((s) => ({
          events: [
            ...s.events,
            {
              id: `cal-${uid()}`,
              ...rest,
              color,
              createdAt: nowISO(),
            },
          ],
        })),

      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEvent: (id) =>
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'plannerhub-calendar',
    },
  ),
)
