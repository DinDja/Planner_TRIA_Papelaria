import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getListKindMeta } from '../lists'
import type {
  ShoppingItem,
  ShoppingList,
  ShoppingListKind,
  ShoppingListPreset,
} from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const clean = <T extends Record<string, unknown>>(data: T): Partial<T> =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>

const LIST_COLORS = ['#7bb686', '#5b8dbf', '#f0b429', '#e8a0a0', '#c9b6e4', '#f5c8a0']

const seedLists: ShoppingList[] = [
  {
    id: 'list-seed-1',
    name: 'Supermercado',
    color: '#7bb686',
    kind: 'supermercado',
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
    kind: 'farmacia',
    items: [
      { id: `item-${uid()}`, name: 'Vitamina C', quantity: '1 caixa', category: 'Vitaminas e suplementos', dosage: '1x ao dia', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Protetor solar', quantity: 'FPS 50', category: 'Cuidados com a pele', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Curativos', category: 'Primeiros socorros', checked: true, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'list-seed-3',
    name: 'Lista de tarefas',
    color: '#f0b429',
    kind: 'custom',
    items: [
      { id: `item-${uid()}`, name: 'Trocar lâmpada do quarto', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Levar roupa na lavanderia', notes: 'Roupas de cama', checked: true, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Agendar revisão do carro', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Comprar presente do aniversário', notes: 'Ideia: livro ou perfume', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'list-seed-4',
    name: 'Mala de viagem',
    color: '#c9b6e4',
    kind: 'mala',
    items: [
      { id: `item-${uid()}`, name: 'Passaporte e RG', category: 'Documentos', packed: true, checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Cartão de embarque', category: 'Documentos', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Carregador do celular', category: 'Eletrônicos e cabos', packed: true, checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Fone de ouvido', category: 'Eletrônicos e cabos', checked: false, createdAt: nowISO() },
      { id: `item-${uid()}`, name: 'Protetor solar', category: 'Higiene e cosméticos', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface ListsState {
  lists: ShoppingList[]
  presets: ShoppingListPreset[]

  addList: (data: { name: string; color?: string; kind?: ShoppingListKind }) => void
  addPresetFromList: (listId: string) => void
  deletePreset: (id: string) => void
  updateList: (id: string, patch: Partial<ShoppingList>) => void
  deleteList: (id: string) => void

  addItem: (listId: string, data: { name: string; quantity?: string; category?: string; dosage?: string; packed?: boolean; notes?: string }) => void
  toggleItem: (listId: string, itemId: string) => void
  togglePacked: (listId: string, itemId: string) => void
  updateItem: (listId: string, itemId: string, patch: Partial<ShoppingItem>) => void
  deleteItem: (listId: string, itemId: string) => void

  getProgress: (listId: string) => { checked: number; total: number }
  getAllCategories: () => string[]
}

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      presets: [],

      addList: ({ color, kind = 'custom', ...data }) => {
        const meta = getListKindMeta(kind)
        const defaultColor =
          meta.defaultColor ?? LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)]
        return set((s) => ({
          lists: [
            ...s.lists,
            { id: `list-${uid()}`, ...data, kind, color: color ?? defaultColor, items: [], createdAt: nowISO(), updatedAt: nowISO() },
          ],
        }))
      },

      addPresetFromList: (listId) => {
        const list = get().lists.find((item) => item.id === listId)
        if (
          !list ||
          (list.kind !== 'supermercado' && list.kind !== 'mala') ||
          list.items.length === 0
        ) return
        const now = nowISO()
        const preset: ShoppingListPreset = {
          id: `preset-${uid()}`,
          name: list.name,
          kind: list.kind,
          items: list.items.map(({ name, quantity, category, dosage, notes }) =>
            ({ name, quantity, category, dosage, notes }),
          ),
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({
          presets: [...s.presets.filter((item) => item.name !== preset.name), preset],
        }))
      },

      deletePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((item) => item.id !== id) })),

      updateList: (id, patch) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === id ? { ...l, ...clean(patch), updatedAt: nowISO() } : l,
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
                    {
                      ...clean(data),
                      id: `item-${uid()}`,
                      name: data.name,
                      checked: false,
                      createdAt: nowISO(),
                    },
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

      togglePacked: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  updatedAt: nowISO(),
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, packed: !i.packed } : i,
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
                    i.id === itemId ? { ...i, ...clean(patch) } : i,
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
