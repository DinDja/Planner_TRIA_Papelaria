import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WishlistItem } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const seedWishlist: WishlistItem[] = [
  {
    id: `wish-seed-1`,
    name: 'Kindle Paperwhite',
    url: 'https://amazon.com/kindle-paperwhite',
    price: 59990,
    priority: 'medium',
    category: 'Tecnologia',
    notes: 'A nova geração com luz ajustável',
    purchased: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `wish-seed-2`,
    name: 'Tênis de corrida',
    url: 'https://nike.com',
    price: 39990,
    priority: 'high',
    category: 'Esporte',
    notes: 'Numeração 42, para corrida de rua',
    purchased: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `wish-seed-3`,
    name: 'Fone de ouvido Bluetooth',
    price: 24990,
    priority: 'low',
    category: 'Tecnologia',
    purchased: true,
    purchasedAt: nowISO(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `wish-seed-4`,
    name: 'Curso de Fotografia',
    url: 'https://udemy.com',
    price: 4990,
    priority: 'medium',
    category: 'Educação',
    notes: 'Fotografia para iniciantes',
    purchased: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: `wish-seed-5`,
    name: 'Viagem para a praia',
    price: 150000,
    priority: 'high',
    category: 'Lazer',
    notes: 'Reservar para o próximo feriado',
    purchased: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface WishlistState {
  items: WishlistItem[]

  addItem: (data: {
    name: string
    url?: string
    price?: number
    priority: 'low' | 'medium' | 'high'
    category?: string
    notes?: string
  }) => void
  updateItem: (id: string, patch: Partial<WishlistItem>) => void
  deleteItem: (id: string) => void
  togglePurchased: (id: string) => void

  getTotalCost: () => number
  getPurchasedCost: () => number
  getItemsByCategory: (category: string) => WishlistItem[]
  getAllCategories: () => string[]
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: seedWishlist,

      addItem: (data) =>
        set((s) => ({
          items: [
            {
              id: `wish-${uid()}`,
              ...data,
              purchased: false,
              createdAt: nowISO(),
              updatedAt: nowISO(),
            },
            ...s.items,
          ],
        })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...patch, updatedAt: nowISO() } : i,
          ),
        })),

      deleteItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),

      togglePurchased: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  purchased: !i.purchased,
                  purchasedAt: !i.purchased ? nowISO() : undefined,
                  updatedAt: nowISO(),
                }
              : i,
          ),
        })),

      getTotalCost: () =>
        get().items.reduce((acc, i) => acc + (i.price ?? 0), 0),

      getPurchasedCost: () =>
        get()
          .items.filter((i) => i.purchased)
          .reduce((acc, i) => acc + (i.price ?? 0), 0),

      getItemsByCategory: (category) =>
        get().items.filter((i) => i.category === category),

      getAllCategories: () => {
        const cats = new Set<string>()
        get().items.forEach((i) => i.category && cats.add(i.category))
        return [...cats].sort()
      },
    }),
    { name: 'plannerhub-wishlist' },
  ),
)
