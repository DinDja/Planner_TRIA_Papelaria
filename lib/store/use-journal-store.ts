import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JournalEmotion, JournalEntry, JournalTimeOfDay, MoodSnapshot } from '../types'
import { ENTRY_COLORS, JOURNAL_PROMPTS } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()
const todayISO = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getTimeOfDay = (): JournalTimeOfDay => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

const getRandomPrompt = (): string => {
  const prompts = JOURNAL_PROMPTS
  return prompts[Math.floor(Math.random() * prompts.length)].text
}

const seedEntries: JournalEntry[] = [
  {
    id: `journal-seed-1`,
    title: 'Começando minha jornada',
    content: 'Hoje decidi começar a escrever aqui todos os dias. A ideia é criar um espaço só meu, sem julgamentos, onde posso colocar tudo que sinto e penso.\n\nMeu objetivo com esse diário:\n- Escrever pelo menos 3x por semana\n- Ser honesto comigo mesmo\n- Rastrear meu humor para entender melhor meus padrões',
    date: todayISO(),
    timeOfDay: 'morning',
    mood: { emotions: ['excited', 'hopeful'], energy: 5, note: 'Motivado para começar!' },
    prompt: 'Por que você está grato(a) agora?',
    tags: ['início', 'propósito'],
    color: ENTRY_COLORS[0],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    pinned: true,
  },
  {
    id: `journal-seed-2`,
    title: 'Reflexão do fim do dia',
    content: 'A tarde foi agitada, mas consegui dedicar um tempo para refletir sobre como as coisas estão indo.\n\nO que percebi:\n- Meus níveis de energia variam muito ao longo do dia\n- Quando me permito pausas, minha criatividade flui melhor\n- Preciso trabalhar na paciência comigo mesmo',
    date: todayISO(),
    timeOfDay: 'evening',
    mood: { emotions: ['calm', 'hopeful'], energy: 3 },
    prompt: 'O que você aprendeu hoje?',
    tags: ['reflexão'],
    color: ENTRY_COLORS[3],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface MoodStats {
  emotionCounts: Record<JournalEmotion, number>
  avgEnergy: number
  totalEntries: number
  streak: number
}

interface JournalState {
  entries: JournalEntry[]

  addEntry: (data: {
    title: string
    content: string
    date: string
    timeOfDay?: JournalTimeOfDay
    mood: MoodSnapshot
    prompt?: string
    tags?: string[]
    color?: string
    drawing?: JournalEntry['drawing']
  }) => void
  updateEntry: (id: string, patch: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void
  togglePin: (id: string) => void

  getEntryByDate: (date: string) => JournalEntry | undefined
  searchEntries: (query: string) => JournalEntry[]
  getPinnedEntries: () => JournalEntry[]
  getMoodStats: () => MoodStats
  getEmotionTimeline: (days?: number) => { date: string; emotions: JournalEmotion[]; energy: number }[]
  getPrompt: () => string
  getEntriesGroupedByDate: () => { date: string; entries: JournalEntry[] }[]
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: ({ tags, color, timeOfDay, ...data }) =>
        set((s) => ({
          entries: [
            {
              id: `journal-${uid()}`,
              ...data,
              timeOfDay: timeOfDay ?? getTimeOfDay(),
              tags: tags ?? [],
              color: color ?? ENTRY_COLORS[Math.floor(Math.random() * ENTRY_COLORS.length)],
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

      togglePin: (id) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e,
          ),
        })),

      getEntryByDate: (date) => get().entries.find((e) => e.date === date),

      searchEntries: (query) => {
        const q = query.toLowerCase()
        return get().entries.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.content.toLowerCase().includes(q) ||
            e.mood.note?.toLowerCase().includes(q) ||
            e.tags.some((t) => t.toLowerCase().includes(q)),
        )
      },

      getPinnedEntries: () => get().entries.filter((e) => e.pinned),

      getMoodStats: () => {
        const entries = get().entries
        const emotionCounts: Record<JournalEmotion, number> = {} as Record<JournalEmotion, number>
        let totalEnergy = 0
        let energyCount = 0

        for (const e of entries) {
          for (const emotion of e.mood.emotions) {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
          }
          if (e.mood.energy) {
            totalEnergy += e.mood.energy
            energyCount++
          }
        }

        const dates = [...new Set(entries.map((e) => e.date))].sort().reverse()
        let streak = 0
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        let expected = todayStr
        for (const date of dates) {
          if (date === expected) {
            streak++
            const d = new Date(expected + 'T12:00:00')
            d.setDate(d.getDate() - 1)
            expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          } else if (date < expected) {
            break
          }
        }

        return {
          emotionCounts,
          avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
          totalEntries: entries.length,
          streak,
        }
      },

      getEmotionTimeline: (days = 14) => {
        const result: { date: string; emotions: JournalEmotion[]; energy: number }[] = []
        const today = new Date()

        for (let i = 0; i < days; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const dayEntries = get().entries.filter((e) => e.date === dateStr)

          if (dayEntries.length > 0) {
            const allEmotions: JournalEmotion[] = []
            let totalEnergy = 0
            for (const e of dayEntries) {
              allEmotions.push(...e.mood.emotions)
              totalEnergy += e.mood.energy
            }
            result.push({
              date: dateStr,
              emotions: [...new Set(allEmotions)],
              energy: Math.round(totalEnergy / dayEntries.length),
            })
          }
        }

        return result.reverse()
      },

      getPrompt: () => getRandomPrompt(),

      getEntriesGroupedByDate: () => {
        const groups: { date: string; entries: JournalEntry[] }[] = []
        for (const e of get().entries) {
          const last = groups[groups.length - 1]
          if (last && last.date === e.date) {
            last.entries.push(e)
          } else {
            groups.push({ date: e.date, entries: [e] })
          }
        }
        return groups
      },
    }),
    { name: 'plannerhub-journal' },
  ),
)