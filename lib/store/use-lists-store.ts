import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getListKindMeta } from '../lists'
import type { ShoppingItem, ShoppingList, ShoppingListKind, UserListPreset } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const clean = <T extends Record<string, unknown>>(data: T): Partial<T> =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>

const LIST_COLORS = ['#d1bdb8', '#b76f06', '#6a634d', '#ddd6c6']

const seedLists: ShoppingList[] = [
  {
    id: 'list-seed-1',
    name: 'Supermercado',
    color: '#6a634d',
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
    color: '#6a634d',
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
    color: '#b76f06',
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
    color: '#ddd6c6',
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
  /** Itens "prontos para usar" cadastrados pelo usuário (coleção listPresets) */
  userPresets: UserListPreset[]

  addPreset: (data: { kind: ShoppingListKind; name: string; quantity?: string; category?: string; dosage?: string }) => void
  updatePreset: (presetId: string, patch: Partial<Omit<UserListPreset, 'id'>>) => void
  deletePreset: (presetId: string) => void

  addList: (data: { name: string; color?: string; kind?: ShoppingListKind }) => string
  updateList: (id: string, patch: Partial<ShoppingList>) => void
  deleteList: (id: string) => void
  duplicateList: (id: string) => void

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
      userPresets: [],

      addPreset: (data) =>
        set((s) => ({
          userPresets: [...s.userPresets, { ...clean(data), id: `preset-${uid()}` } as UserListPreset],
        })),

      updatePreset: (presetId, patch) =>
        set((s) => ({
          userPresets: s.userPresets.map((preset) => (
            preset.id === presetId ? { ...preset, ...clean(patch) } : preset
          )),
        })),

      deletePreset: (presetId) =>
        set((s) => ({
          userPresets: s.userPresets.filter((p) => p.id !== presetId),
        })),

      addList: ({ color, kind = 'custom', ...data }) => {
        const meta = getListKindMeta(kind)
        const defaultColor =
          meta.defaultColor ?? LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)]
        const id = `list-${uid()}`
        set((s) => ({
          lists: [
            ...s.lists,
            { id, ...data, kind, color: color ?? defaultColor, items: [], createdAt: nowISO(), updatedAt: nowISO() },
          ],
        }))
        return id
      },

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

      duplicateList: (id) =>
        set((s) => {
          const source = s.lists.find((l) => l.id === id)
          if (!source) return s
          const copy: ShoppingList = {
            ...source,
            id: `list-${uid()}`,
            name: `${source.name} (cópia)`,
            items: source.items.map((item) => ({
              ...item,
              id: `item-${uid()}`,
              checked: false,
              packed: false,
              createdAt: nowISO(),
            })),
            createdAt: nowISO(),
            updatedAt: nowISO(),
          }
          return { lists: [...s.lists, copy] }
        }),

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
