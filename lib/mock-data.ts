import type {
  AgendaEvent,
  DayActivity,
  Folder,
  Goal,
  Planner,
  PlannerCategory,
  PlannerPage,
  Tag,
} from './types'

const uid = () => Math.random().toString(36).slice(2, 10)

const uniquePages = (
  count: number,
  titles: string[],
  baseId: string,
): PlannerPage[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${baseId}-pg-${i}`,
    title: titles[i] ?? `Página ${i + 1}`,
    template: 'blank' as const,
    data: { strokes: [], stickers: [], texts: [], shapes: [], stickyNotes: [] },
  }))

// ─── Folders ─────────────────────────────────────────────────────────────────

export const MOCK_FOLDERS: Folder[] = [
  { id: 'fld-1', name: 'Universidade', color: '#5b8dbf' },
  { id: 'fld-2', name: 'Trabalho', color: '#c9b6e4' },
  { id: 'fld-3', name: 'Pessoal', color: '#f0b429' },
  { id: 'fld-4', name: 'Projetos', color: '#7bb686' },
]

// ─── Tags ────────────────────────────────────────────────────────────────────

export const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Urgente', color: '#e05b6d' },
  { id: 'tag-2', name: 'Importante', color: '#f0b429' },
  { id: 'tag-3', name: 'Ideia', color: '#a5c8e4' },
  { id: 'tag-4', name: 'Depois', color: '#c9b6e4' },
]

// ─── Planners ────────────────────────────────────────────────────────────────

const plannerDefs: {
  name: string
  category: PlannerCategory
  color: string
  icon: string
  folderId: string | null
  tags: string[]
  pageCount: number
}[] = [
  {
    name: 'Diário Pessoal',
    category: 'diario',
    color: '#e05b6d',
    icon: 'NotebookPen',
    folderId: 'fld-3',
    tags: [],
    pageCount: 5,
  },
  {
    name: 'Estudos Matemática',
    category: 'estudos',
    color: '#5b8dbf',
    icon: 'GraduationCap',
    folderId: 'fld-1',
    tags: ['tag-2'],
    pageCount: 12,
  },
  {
    name: 'Work Tasks',
    category: 'trabalho',
    color: '#c9b6e4',
    icon: 'BriefcaseBusiness',
    folderId: 'fld-2',
    tags: ['tag-1'],
    pageCount: 8,
  },
  {
    name: 'Rotina Fitness',
    category: 'fitness',
    color: '#7bb686',
    icon: 'Dumbbell',
    folderId: 'fld-3',
    tags: [],
    pageCount: 4,
  },
  {
    name: 'Controle Financeiro',
    category: 'financas',
    color: '#f0b429',
    icon: 'Wallet',
    folderId: null,
    tags: ['tag-2', 'tag-3'],
    pageCount: 6,
  },
  {
    name: 'Bullet Journal 2026',
    category: 'bullet',
    color: '#e8a0a0',
    icon: 'Pen',
    folderId: 'fld-4',
    tags: ['tag-3'],
    pageCount: 20,
  },
]

export const MOCK_PLANNERS: Planner[] = plannerDefs.map((d, i) => {
  const id = `pl-${i + 1}`
  const now = new Date()
  const createdAt = new Date(now.getTime() - (6 - i) * 7 * 86400000).toISOString()
  return {
    id,
    name: d.name,
    category: d.category,
    color: d.color,
    icon: d.icon,
    favorite: i % 2 === 0,
    folderId: d.folderId,
    tags: d.tags,
    pages: uniquePages(
      d.pageCount,
      d.category === 'diario'
        ? ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
        :         d.category === 'estudos'
          ? ['Funções', 'Limites', 'Derivadas', 'Integrais', 'Álgebra', 'Geometria',
             'Trigonometria', 'Probabilidade', 'Matrizes', 'Logaritmos', 'Revisão', 'Exercícios']
          : ['Página 1'],
      id,
    ),
    createdAt,
    updatedAt: createdAt,
  }
})

// ─── Agenda ──────────────────────────────────────────────────────────────────

export const MOCK_AGENDA: AgendaEvent[] = [
  {
    id: 'evt-1',
    time: '08:00',
    endTime: '09:30',
    title: 'Aula de Cálculo',
    color: '#5b8dbf',
    plannerId: 'pl-2',
  },
  {
    id: 'evt-2',
    time: '10:00',
    endTime: '11:00',
    title: 'Daily Stand-up',
    color: '#c9b6e4',
    plannerId: 'pl-3',
  },
  {
    id: 'evt-3',
    time: '12:30',
    endTime: '13:30',
    title: 'Almoço com equipe',
    color: '#f0b429',
  },
  {
    id: 'evt-4',
    time: '14:00',
    endTime: '15:00',
    title: 'Revisão financeira',
    color: '#7bb686',
    plannerId: 'pl-5',
  },
  {
    id: 'evt-5',
    time: '16:00',
    endTime: '17:30',
    title: 'Treino funcional',
    color: '#e05b6d',
    plannerId: 'pl-4',
  },
]

// ─── Objetivos ───────────────────────────────────────────────────────────────

export const MOCK_GOALS: Goal[] = [
  {
    id: 'gl-1',
    title: 'Estudar 4h por dia',
    current: 18,
    target: 28,
    unit: 'horas/semana',
    color: '#5b8dbf',
  },
  {
    id: 'gl-2',
    title: 'Beber 3L de água',
    current: 16,
    target: 21,
    unit: 'dias',
    color: '#7bb686',
  },
  {
    id: 'gl-3',
    title: 'Economizar R$ 500',
    current: 380,
    target: 500,
    unit: 'R$',
    color: '#f0b429',
  },
  {
    id: 'gl-4',
    title: 'Ler 2 livros',
    current: 1,
    target: 2,
    unit: 'livros',
    color: '#e8a0a0',
  },
]

// ─── Atividade ───────────────────────────────────────────────────────────────

export const MOCK_ACTIVITY: DayActivity[] = [
  { day: 'Seg', pages: 3, minutes: 45 },
  { day: 'Ter', pages: 5, minutes: 82 },
  { day: 'Qua', pages: 2, minutes: 30 },
  { day: 'Qui', pages: 8, minutes: 120 },
  { day: 'Sex', pages: 4, minutes: 60 },
  { day: 'Sáb', pages: 6, minutes: 95 },
  { day: 'Dom', pages: 1, minutes: 15 },
]

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const MOCK_STATS = {
  totalPlanners: 6,
  totalPages: 55,
  totalMinutes: 447,
  currentStreak: 5,
  weeklyPages: 29,
  weeklyMinutes: 447,
  completedTasks: 23,
  totalGoals: 4,
}
