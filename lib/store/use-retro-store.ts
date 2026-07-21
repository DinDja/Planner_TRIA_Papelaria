import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RetroAction, RetrospectiveEntry, RetrospectiveMood, RetrospectiveType } from '../types'

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

const weekRange = (): { start: string; end: string } => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (dt: Date) => {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return { start: fmt(monday), end: fmt(sunday) }
}

const monthStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const seedEntries: RetrospectiveEntry[] = [
  {
    id: 'retro-seed-1',
    type: 'daily',
    date: today,
    mood: 'good',
    wentWell: ['Concluí a revisão do projeto', 'Reunião produtiva com o time'],
    toImprove: ['Responder e-mails mais rápido', 'Fazer pausas a cada 1h'],
    actions: [
      { id: `act-${uid()}`, text: 'Separar 30min para e-mails às 10h', done: false, createdAt: nowISO() },
      { id: `act-${uid()}`, text: 'Usar técnica pomodoro', done: true, createdAt: nowISO() },
    ],
    notes: 'Dia produtivo no geral.',
    createdAt: nowISO(),
  },
  {
    id: 'retro-seed-2',
    type: 'weekly',
    date: weekRange().start,
    endDate: weekRange().end,
    mood: 'great',
    wentWell: ['Entreguei a feature X antes do prazo', 'Ajudei colegas com code review'],
    toImprove: ['Documentar decisões técnicas'],
    actions: [
      { id: `act-${uid()}`, text: 'Criar ADR para as decisões da sprint', done: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
  },
  {
    id: 'retro-seed-3',
    type: 'monthly',
    date: `${monthStr()}-01`,
    mood: 'neutral',
    wentWell: ['Organização financeira do mês', 'Nova rotina de exercícios'],
    toImprove: ['Reduzir tempo de tela antes de dormir', 'Ler ao menos 2 livros'],
    actions: [
      { id: `act-${uid()}`, text: 'Comprar um despertador para deixar o celular fora do quarto', done: false, createdAt: nowISO() },
    ],
    notes: 'Mês de transição. Janeiro foi melhor que dezembro.',
    createdAt: nowISO(),
  },
]

interface RetroState {
  entries: RetrospectiveEntry[]

  addEntry: (data: {
    type: RetrospectiveType
    date: string
    endDate?: string
    mood: RetrospectiveMood
    wentWell: string[]
    toImprove: string[]
    notes?: string
  }) => void
  updateEntry: (id: string, patch: Partial<RetrospectiveEntry>) => void
  deleteEntry: (id: string) => void

  addAction: (entryId: string, text: string) => void
  toggleAction: (entryId: string, actionId: string) => void
  deleteAction: (entryId: string, actionId: string) => void

  getEntriesByType: (type: RetrospectiveType) => RetrospectiveEntry[]
  getRecentEntries: (limit?: number) => RetrospectiveEntry[]
}

export const useRetroStore = create<RetroState>()(
  persist(
    (set, get) => ({
      entries: seedEntries,

      addEntry: (data) =>
        set((s) => ({
          entries: [
            {
              id: `retro-${uid()}`,
              ...data,
              actions: [],
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

      addAction: (entryId, text) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  actions: [
                    ...e.actions,
                    { id: `act-${uid()}`, text, done: false, createdAt: nowISO() },
                  ],
                }
              : e,
          ),
        })),

      toggleAction: (entryId, actionId) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  actions: e.actions.map((a) =>
                    a.id === actionId ? { ...a, done: !a.done } : a,
                  ),
                }
              : e,
          ),
        })),

      deleteAction: (entryId, actionId) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === entryId
              ? { ...e, actions: e.actions.filter((a) => a.id !== actionId) }
              : e,
          ),
        })),

      getEntriesByType: (type) => get().entries.filter((e) => e.type === type),

      getRecentEntries: (limit = 10) =>
        [...get().entries]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit),
    }),
    { name: 'plannerhub-retro' },
  ),
)
