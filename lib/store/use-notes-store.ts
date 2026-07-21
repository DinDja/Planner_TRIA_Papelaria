import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note, NoteFolder } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const NOTE_COLORS = ['#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#f5c8a0']

const seedFolders: NoteFolder[] = [
  { id: 'folder-seed-1', name: 'Pessoal', color: '#e8a0a0' },
  { id: 'folder-seed-2', name: 'Trabalho', color: '#5b8dbf' },
  { id: 'folder-seed-3', name: 'Ideias', color: '#f0b429' },
  { id: 'folder-seed-4', name: 'Estudos', color: '#7bb686' },
]

const seedNotes: Note[] = [
  {
    id: 'note-seed-1',
    title: 'Ideias para o próximo projeto',
    content:
      'App de receitas inteligente que sugere pratos baseado nos ingredientes que você tem em casa.\n\nFuncionalidades:\n- Scanner de ingredientes\n- Sugestões por estação\n- Integração com lista de supermercado\n- Modo offline',
    folderId: 'folder-seed-3',
    tags: ['app', 'inovação', 'tech'],
    color: NOTE_COLORS[2],
    pinned: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'note-seed-2',
    title: 'Reunião 15/07 - Planejamento Sprint',
    content:
      'Presentes: João, Maria, Pedro, Ana\n\nPauta:\n1. Review da sprint anterior\n2. Planejamento da próxima sprint\n3. Definição de prioridades\n4. Alinhamento técnico\n\nDecisões:\n- Migrar para a nova API até sexta\n- Code review obrigatório para todos PRs\n- Daily às 9:30',
    folderId: 'folder-seed-2',
    tags: ['reunião', 'sprint', 'trabalho'],
    color: NOTE_COLORS[3],
    pinned: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'note-seed-3',
    title: 'Lista de leitura',
    content:
      '- Os 7 Hábitos das Pessoas Altamente Eficazes\n- Hábitos Atômicos\n- A Coragem de Ser Imperfeito\n- Essencialismo\n- Rápido e Devagar',
    folderId: 'folder-seed-4',
    tags: ['livros', 'desenvolvimento'],
    color: NOTE_COLORS[1],
    pinned: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'note-seed-4',
    title: 'Frase do dia',
    content:
      '"A única maneira de fazer um excelente trabalho é amar o que você faz."\n\n— Steve Jobs',
    folderId: null,
    tags: ['inspiração', 'frases'],
    color: NOTE_COLORS[0],
    pinned: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: 'note-seed-5',
    title: 'Receita: Bolo de Cenoura',
    content:
      'Ingredientes:\n- 3 cenouras médias\n- 3 ovos\n- 1 xícara de óleo\n- 2 xícaras de açúcar\n- 2 xícaras de farinha de trigo\n- 1 colher de fermento\n\nModo de preparo:\n1. Bata cenoura, ovos e óleo no liquidificador\n2. Misture açúcar e farinha\n3. Adicione a mistura líquida\n4. Coloque fermento por último\n5. Asse em forno 180° por 40 min',
    folderId: null,
    tags: ['culinária', 'receitas'],
    color: NOTE_COLORS[5],
    pinned: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

interface NotesState {
  notes: Note[]
  folders: NoteFolder[]

  addNote: (data: {
    title: string
    content: string
    folderId: string | null
    tags?: string[]
    color?: string
  }) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  togglePinNote: (id: string) => void

  addFolder: (data: { name: string; color?: string }) => void
  updateFolder: (id: string, patch: Partial<NoteFolder>) => void
  deleteFolder: (id: string) => void

  searchNotes: (query: string) => Note[]
  getNotesByFolder: (folderId: string | null) => Note[]
  getNotesByTag: (tag: string) => Note[]
  getAllTags: () => string[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: seedNotes,
      folders: seedFolders,

      addNote: ({ tags, color, ...data }) =>
        set((s) => ({
          notes: [
            {
              id: `note-${uid()}`,
              ...data,
              tags: tags ?? [],
              color: color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
              pinned: false,
              createdAt: nowISO(),
              updatedAt: nowISO(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n,
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
        })),

      togglePinNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n,
          ),
        })),

      addFolder: ({ color = '#5b8dbf', ...data }) =>
        set((s) => ({
          folders: [
            ...s.folders,
            { id: `folder-${uid()}`, ...data, color },
          ],
        })),

      updateFolder: (id, patch) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...f, ...patch } : f,
          ),
        })),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.map((n) =>
            n.folderId === id ? { ...n, folderId: null } : n,
          ),
        })),

      searchNotes: (query) => {
        const q = query.toLowerCase()
        return get().notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q)),
        )
      },

      getNotesByFolder: (folderId) =>
        get().notes.filter((n) => n.folderId === folderId),

      getNotesByTag: (tag) =>
        get().notes.filter((n) => n.tags.includes(tag)),

      getAllTags: () => {
        const tags = new Set<string>()
        get().notes.forEach((n) => n.tags.forEach((t) => tags.add(t)))
        return [...tags].sort()
      },
    }),
    { name: 'plannerhub-notes' },
  ),
)
