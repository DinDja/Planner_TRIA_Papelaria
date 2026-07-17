import type { PageTemplateId } from './types'

export interface PlannerTemplatePage {
  title: string
  template: PageTemplateId
}

export interface PlannerTemplate {
  id: string
  name: string
  description: string
  category: string
  color: string
  icon: string
  /** Primeira página usada como thumbnail */
  pages: PlannerTemplatePage[]
  premium?: boolean
}

export const PLANNER_TEMPLATE_CATEGORIES = [
  'Todos',
  'Planejamento',
  'Estudos',
  'Business',
  'Saúde',
  'Finanças',
  'Receitas',
  'Wedding Planner',
  'Teacher Planner',
  'Life Planner',
] as const

export const PLANNER_TEMPLATES: PlannerTemplate[] = [
  // ─── Planejamento ──────────────────────────────────────────────────────────
  {
    id: 'tpl-daily',
    name: 'Planner Diário Completo',
    description: 'Página diária com horários, prioridades e notas.',
    category: 'Planejamento',
    color: '#e05b6d',
    icon: 'NotebookPen',
    pages: [
      { title: 'Hoje', template: 'daily' },
      { title: 'Amanhã', template: 'daily' },
      { title: 'Notas', template: 'lined' },
    ],
  },
  {
    id: 'tpl-weekly',
    name: 'Planner Semanal',
    description: 'Semana inteira em uma visão, com espaço para cada dia.',
    category: 'Planejamento',
    color: '#5b8dbf',
    icon: 'Calendar',
    pages: [
      { title: 'Esta semana', template: 'weekly' },
      { title: 'Próxima semana', template: 'weekly' },
      { title: 'Notas', template: 'dotted' },
    ],
  },
  {
    id: 'tpl-monthly',
    name: 'Planner Mensal',
    description: 'Grade mensal com visão de longo prazo.',
    category: 'Planejamento',
    color: '#c9b6e4',
    icon: 'CalendarDays',
    pages: [
      { title: 'Este mês', template: 'monthly' },
      { title: 'Próximo mês', template: 'monthly' },
      { title: 'Objetivos', template: 'grid' },
    ],
  },
  // ─── Estudos ───────────────────────────────────────────────────────────────
  {
    id: 'tpl-cornell',
    name: 'Anotações Cornell',
    description: 'Método Cornell para resumos e revisão ativa.',
    category: 'Estudos',
    color: '#5b8dbf',
    icon: 'GraduationCap',
    pages: [
      { title: 'Aula 1', template: 'cornell' },
      { title: 'Aula 2', template: 'cornell' },
      { title: 'Aula 3', template: 'cornell' },
      { title: 'Revisão', template: 'dotted' },
    ],
  },
  {
    id: 'tpl-study',
    name: 'Planner de Estudos',
    description: 'Semana de estudos + resumos Cornell + checklist.',
    category: 'Estudos',
    color: '#7bb686',
    icon: 'BookOpen',
    pages: [
      { title: 'Semana', template: 'weekly' },
      { title: 'Resumo 1', template: 'cornell' },
      { title: 'Resumo 2', template: 'cornell' },
      { title: 'Exercícios', template: 'checklist' },
    ],
  },
  // ─── Business ──────────────────────────────────────────────────────────────
  {
    id: 'tpl-meeting',
    name: 'Reuniões & Projetos',
    description: 'Kanban para acompanhar projetos + notas de reuniões.',
    category: 'Business',
    color: '#c9b6e4',
    icon: 'BriefcaseBusiness',
    pages: [
      { title: 'Projetos', template: 'kanban' },
      { title: 'Reunião 1', template: 'lined' },
      { title: 'Reunião 2', template: 'lined' },
    ],
  },
  {
    id: 'tpl-tasks',
    name: 'Gestão de Tarefas',
    description: 'Checklist diário + Kanban para organizar prioridades.',
    category: 'Business',
    color: '#f0b429',
    icon: 'CheckSquare',
    pages: [
      { title: 'Hoje', template: 'checklist' },
      { title: 'Esta semana', template: 'checklist' },
      { title: 'Projetos', template: 'kanban' },
    ],
  },
  // ─── Saúde ─────────────────────────────────────────────────────────────────
  {
    id: 'tpl-habit',
    name: 'Habit Tracker Completo',
    description: 'Rastreie hábitos diários por 31 dias.',
    category: 'Saúde',
    color: '#7bb686',
    icon: 'Heart',
    pages: [
      { title: 'Janeiro', template: 'habit' },
      { title: 'Fevereiro', template: 'habit' },
      { title: 'Rotina', template: 'weekly' },
    ],
  },
  {
    id: 'tpl-fitness',
    name: 'Diário Fitness',
    description: 'Registro diário de treinos + refeições + hábitos.',
    category: 'Saúde',
    color: '#e05b6d',
    icon: 'Dumbbell',
    pages: [
      { title: 'Hoje', template: 'daily' },
      { title: 'Refeições', template: 'meal' },
      { title: 'Hábitos', template: 'habit' },
    ],
  },
  // ─── Finanças ──────────────────────────────────────────────────────────────
  {
    id: 'tpl-finance',
    name: 'Controle Financeiro',
    description: 'Entradas, saídas e saldo com resumo visual.',
    category: 'Finanças',
    color: '#f0b429',
    icon: 'Wallet',
    pages: [
      { title: 'Este mês', template: 'finance' },
      { title: 'Próximo mês', template: 'finance' },
      { title: 'Resumo anual', template: 'monthly' },
    ],
  },
  {
    id: 'tpl-budget',
    name: 'Orçamento Mensal',
    description: 'Orçamento + checklist de contas a pagar.',
    category: 'Finanças',
    color: '#5b8dbf',
    icon: 'Calculator',
    pages: [
      { title: 'Orçamento', template: 'finance' },
      { title: 'Contas', template: 'checklist' },
      { title: 'Metas', template: 'grid' },
    ],
  },
  // ─── Receitas ──────────────────────────────────────────────────────────────
  {
    id: 'tpl-meal',
    name: 'Meal Planner Semanal',
    description: 'Planejamento de refeições da semana.',
    category: 'Receitas',
    color: '#7bb686',
    icon: 'UtensilsCrossed',
    pages: [
      { title: 'Esta semana', template: 'meal' },
      { title: 'Lista de compras', template: 'checklist' },
    ],
  },
  {
    id: 'tpl-recipes',
    name: 'Receitas da Família',
    description: 'Caderno de receitas em estilo bullet journal.',
    category: 'Receitas',
    color: '#e8a0a0',
    icon: 'ChefHat',
    pages: [
      { title: 'Receita 1', template: 'dotted' },
      { title: 'Receita 2', template: 'dotted' },
      { title: 'Receita 3', template: 'dotted' },
      { title: 'Receita 4', template: 'dotted' },
    ],
  },
  // ─── Wedding Planner ───────────────────────────────────────────────────────
  {
    id: 'tpl-wedding',
    name: 'Wedding Planner',
    description: 'Organização completa do casamento.',
    category: 'Wedding Planner',
    color: '#e8a0a0',
    icon: 'Heart',
    pages: [
      { title: 'Cronograma', template: 'monthly' },
      { title: 'Tarefas', template: 'checklist' },
      { title: 'Orçamento', template: 'finance' },
      { title: 'Convidados', template: 'lined' },
      { title: 'Ideias', template: 'dotted' },
    ],
    premium: true,
  },
  // ─── Teacher Planner ───────────────────────────────────────────────────────
  {
    id: 'tpl-teacher',
    name: 'Planejamento de Aulas',
    description: 'Semana de aulas + notas de aula + tarefas.',
    category: 'Teacher Planner',
    color: '#5b8dbf',
    icon: 'GraduationCap',
    pages: [
      { title: 'Semana', template: 'weekly' },
      { title: 'Aula 1', template: 'cornell' },
      { title: 'Aula 2', template: 'cornell' },
      { title: 'Pendências', template: 'checklist' },
    ],
    premium: true,
  },
  // ─── Life Planner ──────────────────────────────────────────────────────────
  {
    id: 'tpl-life',
    name: 'Vida Organizada',
    description: 'Diário + semana + hábitos + finanças em um só lugar.',
    category: 'Life Planner',
    color: '#e05b6d',
    icon: 'Sparkles',
    pages: [
      { title: 'Hoje', template: 'daily' },
      { title: 'Esta semana', template: 'weekly' },
      { title: 'Hábitos', template: 'habit' },
      { title: 'Finanças', template: 'finance' },
      { title: 'Notas', template: 'dotted' },
    ],
    premium: true,
  },
]
