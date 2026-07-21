import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ShoppingItem, ShoppingList } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const LIST_COLORS = ['#7bb686', '#5b8dbf', '#f0b429', '#e8a0a0', '#c9b6e4', '#f5c8a0']

const seedLists: ShoppingList[] = [
  {
    id: 'list-seed-1',
    name: 'Supermercado',
    color: '#7bb686',
    items: [
      { id: `item-${uid()}`, name: 'Arroz', quantity: '5kg', category: 'Grãos', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Feijão', quantity: '2kg', category: 'Grãos', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Leite', quantity: '6 unidades', category: 'Laticínios', checked: true, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Ovos', quantity: '12', category: 'Laticínios', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Pão de forma', quantity: '1', category: 'Padaria', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Frango', quantity: '2kg', category: 'Carnes', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Banana', quantity: '1 cacho', category: 'Frutas', checked: true, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Maçã', quantity: '1kg', category: 'Frutas', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'list-seed-2',
    name: 'Farmácia',
    color: '#5b8dbf',
    items: [
      { id: `item-${uid()}`, name: 'Vitamina C', quantity: '1 caixa', category: 'Suplementos', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Protetor solar', quantity: 'FPS 50', category: 'Cuidados', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Curativos', checked: true, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'list-seed-3',
    name: 'Lista de tarefas',
    color: '#f0b429',
    items: [
      { id: `item-${uid()}`, name: 'Trocar lâmpada do quarto', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Levar roupa na lavanderia', notes: 'Roupas de cama', checked: true, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Agendar revisão do carro', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Comprar presente do aniversário', notes: 'Ideia: livro ou perfume', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface ListsState {
  lists: ShoppingList[]

  addList: (data: { name: string; color?: string }) => void
  updateList: (id: string, patch: Partial<ShoppingList>) => void
  deleteList: (id: string) => void

  addItem: (listId: string, data: { name: string; quantity?: string; category?: string; notes?: string }) => void
  toggleItem: (listId: string, itemId: string) => void
  updateItem: (listId: string, itemId: string, patch: Partial<ShoppingItem>) => void
  deleteItem: (listId: string, itemId: string) => void

  getProgress: (listId: string) => { checked: number; total: number }
  getAllCategories: () => string[]
}

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: seedLists,

      addList: ({ color = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)], ...data }) =>
        set((s) => ({
          lists: [
            ...s.lists,
            { id: `list-${uid()}`, ...data, color, items: [], createdAt: nowISO(), updatedAt: nowISO() },
          ],
        })),

      updateList: (id, patch) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: nowISO() } : l,
          ),
        })),

      deleteList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
        })),

      addItem: (listId, data) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  updatedAt: nowISO(),
                  items: [
                    ...l.items,
                    { id: `item-${uid()}`, ...data, checked: false, createdAt: nowISO() },
                  ],
                }
              : l,
          ),
        })),

      toggleItem: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  updatedAt: nowISO(),
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i,
                  ),
                }
              : l,
          ),
        })),

      updateItem: (listId, itemId, patch) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  updatedAt: nowISO(),
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, ...patch } : i,
                  ),
                }
              : l,
          ),
        })),

      deleteItem: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  updatedAt: nowISO(),
                  items: l.items.filter((i) => i.id !== itemId),
                }
              : l,
          ),
        })),

      getProgress: (listId) => {
        const list = get().lists.find((l) => l.id === listId)
        if (!list) return { checked: 0, total: 0 }
        const checked = list.items.filter((i) => i.checked).length
        return { checked, total: list.items.length }
      },

      getAllCategories: () => {
        const cats = new Set<string>()
        get().lists.forEach((l) => l.items.forEach((i) => i.category && cats.add(i.category)))
        return [...cats].sort()
      },
    }),
    { name: 'plannerhub-lists' },
  ),
)
