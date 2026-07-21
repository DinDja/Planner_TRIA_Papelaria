import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JournalEntry, JournalMood, Stroke } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()
const todayISO = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const seedEntries: JournalEntry[] = [
  {
    id: `journal-seed-1`,
    title: 'Primeiro dia no PlannerHub',
    content:
      'Comecei a usar o PlannerHub hoje. Configurei minha rotina, adicionei alguns hábitos e organizei as finanças do mês. A interface é muito bonita e intuitiva.\n\nPontos positivos:\n- Design limpo e moderno\n- Fácil de navegar\n- Retrospectiva integrada\n\nQuero ver como vou me adaptar nos próximos dias.',
    date: todayISO(),
    mood: 'great',
    tags: ['produtividade', 'organização'],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    pinned: true,
  },
  {
    id: `journal-seed-2`,
    title: 'Reflexão da semana',
    content:
      'Semana produtiva! Consegui manter a maioria dos hábitos. A retrospectiva semanal me ajudou a ver onde posso melhorar.\n\nPreciso focar em:\n- Responder e-mails mais rápido\n- Fazer pausas regulares\n- Beber mais água',
    date: todayISO(),
    mood: 'good',
    tags: ['reflexão', 'semana'],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `journal-seed-3`,
    title: 'Dia difícil',
    content:
      'Hoje foi um dia complicado. Muitas reuniões e pouco tempo para focar no que realmente importa. Preciso repensar minha agenda.\n\nAmanhã vou tentar:\n- Bloquear 2h de foco profundo pela manhã\n- Agrupar reuniões no período da tarde\n- Não esquecer de almoçar longe do computador',
    date: todayISO(),
    mood: 'bad',
    tags: ['trabalho', 'reflexão'],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface JournalState {
  entries: JournalEntry[]

  addEntry: (data: {
    title: string
    content: string
    date: string
    mood?: JournalMood
    tags?: string[]
    drawing?: Stroke[]
  }) => void
  updateEntry: (id: string, patch: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void

  getEntryByDate: (date: string) => JournalEntry | undefined
  searchEntries: (query: string) => JournalEntry[]
  getPinnedEntries: () => JournalEntry[]
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: seedEntries,

      addEntry: ({ tags, ...data }) =>
        set((s) => ({
          entries: [
            {
              id: `journal-${uid()}`,
              ...data,
              tags: tags ?? [],
              createdAt: nowISO(),
              updatedAt: nowISO(),
            },
            ...s.entries,
          ],
        })),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: nowISO() } : e,
          ),
        })),

      deleteEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),

      getEntryByDate: (date) => get().entries.find((e) => e.date === date),

      searchEntries: (query) => {
        const q = query.toLowerCase()
        return get().entries.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.content.toLowerCase().includes(q) ||
            e.tags.some((t) => t.toLowerCase().includes(q)),
        )
      },

      getPinnedEntries: () => get().entries.filter((e) => e.pinned),
    }),
    { name: 'plannerhub-journal' },
  ),
)
