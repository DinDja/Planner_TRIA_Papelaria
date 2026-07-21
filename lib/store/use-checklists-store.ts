import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Checklist, ChecklistItem } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0']

const seedChecklists: Checklist[] = [
  {
    id: 'cl-seed-1',
    title: 'Mudança para o novo apê',
    color: '#5b8dbf',
    items: [
      { id: `cli-${uid()}`, text: 'Contatar empresa de mudança', checked: true, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Comprar caixas de papelão', checked: true, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Empacotar louça e copos', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Desligar serviços do antigo endereço', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Transferir conta de luz e água', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Limpar o novo apê antes de levar móveis', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'cl-seed-2',
    title: 'Setup do home office',
    color: '#7bb686',
    items: [
      { id: `cli-${uid()}`, text: 'Comprar mesa ergonômica', checked: true, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Ajustar altura do monitor', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Testar iluminação do ambiente', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Organizar cabos', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'cl-seed-3',
    title: 'Preparativos para a viagem',
    color: '#f0b429',
    items: [
      { id: `cli-${uid()}`, text: 'Separar documentos (RG, passaporte)', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Comprar chip internacional', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Fazer seguro viagem', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Separar roupas de acordo com o clima', checked: false, createdAt: nowISO() },
      { id: `cli-${uid()}`, text: 'Carregar power bank e cabos', checked: false, createdAt: nowISO() },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface ChecklistsState {
  checklists: Checklist[]

  addChecklist: (data: { title: string; color?: string }) => void
  updateChecklist: (id: string, patch: Partial<Checklist>) => void
  deleteChecklist: (id: string) => void

  addItem: (checklistId: string, text: string) => void
  toggleItem: (checklistId: string, itemId: string) => void
  deleteItem: (checklistId: string, itemId: string) => void
  reorderItems: (checklistId: string, fromIdx: number, toIdx: number) => void

  getProgress: (checklistId: string) => { checked: number; total: number }
}

export const useChecklistsStore = create<ChecklistsState>()(
  persist(
    (set, get) => ({
      checklists: seedChecklists,

      addChecklist: ({ color = COLORS[Math.floor(Math.random() * COLORS.length)], ...data }) =>
        set((s) => ({
          checklists: [
            ...s.checklists,
            { id: `cl-${uid()}`, ...data, color, items: [], createdAt: nowISO(), updatedAt: nowISO() },
          ],
        })),

      updateChecklist: (id, patch) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c,
          ),
        })),

      deleteChecklist: (id) =>
        set((s) => ({
          checklists: s.checklists.filter((c) => c.id !== id),
        })),

      addItem: (checklistId, text) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  updatedAt: nowISO(),
                  items: [
                    ...c.items,
                    { id: `cli-${uid()}`, text, checked: false, createdAt: nowISO() },
                  ],
                }
              : c,
          ),
        })),

      toggleItem: (checklistId, itemId) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  updatedAt: nowISO(),
                  items: c.items.map((i) =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i,
                  ),
                }
              : c,
          ),
        })),

      deleteItem: (checklistId, itemId) =>
        set((s) => ({
          checklists: s.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  updatedAt: nowISO(),
                  items: c.items.filter((i) => i.id !== itemId),
                }
              : c,
          ),
        })),

      reorderItems: (checklistId, fromIdx, toIdx) =>
        set((s) => ({
          checklists: s.checklists.map((c) => {
            if (c.id !== checklistId) return c
            const items = [...c.items]
            const [moved] = items.splice(fromIdx, 1)
            items.splice(toIdx, 0, moved)
            return { ...c, items, updatedAt: nowISO() }
          }),
        })),

      getProgress: (checklistId) => {
        const cl = get().checklists.find((c) => c.id === checklistId)
        if (!cl) return { checked: 0, total: 0 }
        return { checked: cl.items.filter((i) => i.checked).length, total: cl.items.length }
      },
    }),
    { name: 'plannerhub-checklists' },
  ),
)
