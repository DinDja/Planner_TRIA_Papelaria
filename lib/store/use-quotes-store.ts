import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FavoriteQuote } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const QUOTE_COLORS = ['#d1bdb8', '#b76f06', '#6a634d', '#ddd6c6']

const seedQuotes: FavoriteQuote[] = [
  {
    id: `q-seed-1`,
    text: 'A única maneira de fazer um excelente trabalho é amar o que você faz.',
    author: 'Steve Jobs',
    tags: ['trabalho', 'inspiração'],
    color: '#6a634d',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-2`,
    text: 'A vida é o que acontece enquanto você está ocupado fazendo outros planos.',
    author: 'John Lennon',
    tags: ['vida', 'reflexão'],
    color: '#b76f06',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-3`,
    text: 'Não espere por oportunidades. Crie-as.',
    author: 'George Bernard Shaw',
    tags: ['motivação', 'ação'],
    color: '#6a634d',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-4`,
    text: 'O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.',
    author: 'Winston Churchill',
    tags: ['sucesso', 'resiliência'],
    color: '#d1bdb8',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-5`,
    text: 'Acredite que você pode, e você já está no meio do caminho.',
    author: 'Theodore Roosevelt',
    tags: ['motivação', 'autoconfiança'],
    color: '#ddd6c6',
    createdAt: nowISO(),
  },
]

interface QuotesState {
  quotes: FavoriteQuote[]

  addQuote: (data: { text: string; author?: string; tags?: string[]; color?: string }) => void
  updateQuote: (id: string, patch: Partial<FavoriteQuote>) => void
  deleteQuote: (id: string) => void
  getRandomQuote: () => FavoriteQuote | undefined
  getAllTags: () => string[]
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      quotes: [],

      addQuote: ({ color, tags, ...data }) =>
        set((s) => ({
          quotes: [
            {
              id: `q-${uid()}`,
              ...data,
              tags: tags ?? [],
              color: color ?? QUOTE_COLORS[Math.floor(Math.random() * QUOTE_COLORS.length)],
              createdAt: nowISO(),
            },
            ...s.quotes,
          ],
        })),

      updateQuote: (id, patch) =>
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),

      deleteQuote: (id) =>
        set((s) => ({
          quotes: s.quotes.filter((q) => q.id !== id),
        })),

      getRandomQuote: () => {
        const list = get().quotes
        if (list.length === 0) return undefined
        return list[Math.floor(Math.random() * list.length)]
      },

      getAllTags: () => {
        const tags = new Set<string>()
        get().quotes.forEach((q) => q.tags.forEach((t) => tags.add(t)))
        return [...tags].sort()
      },
    }),
    { name: 'plannerhub-quotes' },
  ),
)
