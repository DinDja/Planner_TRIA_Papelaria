import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FavoriteQuote } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const QUOTE_COLORS = ['#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#f5c8a0']

const seedQuotes: FavoriteQuote[] = [
  {
    id: `q-seed-1`,
    text: 'A única maneira de fazer um excelente trabalho é amar o que você faz.',
    author: 'Steve Jobs',
    tags: ['trabalho', 'inspiração'],
    color: '#5b8dbf',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-2`,
    text: 'A vida é o que acontece enquanto você está ocupado fazendo outros planos.',
    author: 'John Lennon',
    tags: ['vida', 'reflexão'],
    color: '#f0b429',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-3`,
    text: 'Não espere por oportunidades. Crie-as.',
    author: 'George Bernard Shaw',
    tags: ['motivação', 'ação'],
    color: '#7bb686',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-4`,
    text: 'O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.',
    author: 'Winston Churchill',
    tags: ['sucesso', 'resiliência'],
    color: '#e8a0a0',
    createdAt: nowISO(),
  },
  {
    id: `q-seed-5`,
    text: 'Acredite que você pode, e você já está no meio do caminho.',
    author: 'Theodore Roosevelt',
    tags: ['motivação', 'autoconfiança'],
    color: '#c9b6e4',
    createdAt: nowISO(),
  },
]

interface QuotesState {
  quotes: FavoriteQuote[]

  addQuote: (data: { text: string; author?: string; tags?: string[]; color?: string }) => void
  deleteQuote: (id: string) => void
  getRandomQuote: () => FavoriteQuote | undefined
  getAllTags: () => string[]
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      quotes: seedQuotes,

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
