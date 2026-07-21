import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PasswordEntry } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0']

const seedPasswords: PasswordEntry[] = [
  {
    id: `pwd-seed-1`,
    title: 'Email Pessoal',
    username: 'meuemail@gmail.com',
    password: 'Senha@123',
    url: 'https://gmail.com',
    category: 'Email',
    color: COLORS[3],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `pwd-seed-2`,
    title: 'Banco Online',
    username: 'joao.silva',
    password: 'Banco#456',
    url: 'https://banco.com.br',
    category: 'Finanças',
    color: COLORS[0],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `pwd-seed-3`,
    title: 'Netflix',
    username: 'joao.silva@email.com',
    password: 'Netflix@789',
    url: 'https://netflix.com',
    category: 'Streaming',
    color: COLORS[1],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface PasswordsState {
  entries: PasswordEntry[]
  masterPin: string

  setMasterPin: (pin: string) => void
  verifyMasterPin: (pin: string) => boolean
  isLocked: () => boolean

  addEntry: (data: {
    title: string
    username?: string
    password: string
    url?: string
    category?: string
    notes?: string
    color?: string
  }) => void
  updateEntry: (id: string, patch: Partial<PasswordEntry>) => void
  deleteEntry: (id: string) => void
  getAllCategories: () => string[]
}

export const usePasswordsStore = create<PasswordsState>()(
  persist(
    (set, get) => ({
      entries: seedPasswords,
      masterPin: '',

      setMasterPin: (pin) => set({ masterPin: pin }),

      verifyMasterPin: (pin) => get().masterPin === pin,

      isLocked: () => get().masterPin !== '',

      addEntry: ({ color, ...data }) =>
        set((s) => ({
          entries: [
            {
              id: `pwd-${uid()}`,
              ...data,
              color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
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

      getAllCategories: () => {
        const cats = new Set<string>()
        get().entries.forEach((e) => e.category && cats.add(e.category))
        return [...cats].sort()
      },
    }),
    { name: 'plannerhub-passwords' },
  ),
)
