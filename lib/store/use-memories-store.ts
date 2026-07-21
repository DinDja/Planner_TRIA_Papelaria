import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MemoryEntry, MemoryMood } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const COLORS = ['#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#f5c8a0']

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const seedMemories: MemoryEntry[] = [
  {
    id: `mem-seed-1`,
    title: 'Primeiro dia de sol após semanas de chuva',
    description:
      'Acordei cedo e o sol estava entrando pela janela. Decidi levar o café da manhã na varanda. Os pássaros estavam cantando e o clima estava perfeito. Fiquei lendo um livro por horas e foi um dos dias mais tranquilos do ano.',
    date: dayStr(-15),
    mood: 'great',
    tags: ['natureza', 'gratidão'],
    color: COLORS[2],
    createdAt: nowISO(),
  },
  {
    id: `mem-seed-2`,
    title: 'Jantar em família',
    description:
      'Todos se reuniram em casa para o jantar de domingo. Minha avó fez a receita secreta de lasanha que todo mundo ama. Foi tão bom ver todo mundo junto, rindo e contando histórias. Precisamos fazer isso mais vezes.',
    date: dayStr(-30),
    mood: 'great',
    tags: ['família', 'comida'],
    color: COLORS[0],
    createdAt: nowISO(),
  },
  {
    id: `mem-seed-3`,
    title: 'Conquista: promoção no trabalho',
    description:
      'Depois de meses de dedicação e noites de estudo, fui promovida! O reconhecimento veio em uma reunião que começou com um café da manhã surpresa. Meu chefe destacou meu esforço e o time todo aplaudiu. Senti que todo o esforço valeu a pena.',
    date: dayStr(-45),
    mood: 'great',
    tags: ['trabalho', 'conquista'],
    color: COLORS[3],
    createdAt: nowISO(),
  },
  {
    id: `mem-seed-4`,
    title: 'Passeio no parque',
    description:
      'Domingo ensolarado perfeito. Andamos de bike, fizemos piquenique e tiramos muitas fotos. O pôr do sol estava laranja e rosa — parecia pintura.',
    date: dayStr(-7),
    mood: 'good',
    tags: ['lazer', 'natureza'],
    color: COLORS[5],
    createdAt: nowISO(),
  },
  {
    id: `mem-seed-5`,
    title: 'Dia da formatura',
    description:
      'Finalmente! Depois de 5 anos, o dia chegou. Minha família estava toda na plateia. Quando subi no palco para receber o diploma, me lembrei de todas as noites viradas estudando. Valeu cada segundo.',
    date: dayStr(-90),
    mood: 'great',
    tags: ['conquista', 'educação'],
    color: COLORS[4],
    createdAt: nowISO(),
  },
]

interface MemoriesState {
  entries: MemoryEntry[]

  addEntry: (data: {
    title: string
    description: string
    date: string
    mood: MemoryMood
    tags?: string[]
    color?: string
  }) => void
  deleteEntry: (id: string) => void
  getAllTags: () => string[]
}

export const useMemoriesStore = create<MemoriesState>()(
  persist(
    (set, get) => ({
      entries: seedMemories,

      addEntry: ({ tags, color, ...data }) =>
        set((s) => ({
          entries: [
            {
              id: `mem-${uid()}`,
              ...data,
              tags: tags ?? [],
              color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
              createdAt: nowISO(),
            },
            ...s.entries,
          ],
        })),

      deleteEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),

      getAllTags: () => {
        const tags = new Set<string>()
        get().entries.forEach((e) => e.tags.forEach((t) => tags.add(t)))
        return [...tags].sort()
      },
    }),
    { name: 'plannerhub-memories' },
  ),
)
