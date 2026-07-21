// ─── Stickers ────────────────────────────────────────────────────────────────

export interface StickerDef {
  id: string
  name: string
  category: string
  svg: string
  /** URL de animação Lottie (.json ou .lottie hospedado em CDN) */
  lottieUrl?: string
  /** Preview estático para o painel (se lottieUrl existir) */
  previewSvg?: string
}

// ─── Canvas ──────────────────────────────────────────────────────────────────

export type ToolType =
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'ruler'
  | 'lasso'
  | 'text'
  | 'sticker'
  | 'pan'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export interface Stroke {
  id: string
  tool: 'pen' | 'pencil' | 'highlighter' | 'ruler'
  color: string
  size: number
  opacity: number
  points: StrokePoint[]
}

export interface StickerInstance {
  id: string
  stickerId: string
  /** SVG custom (upload mock) tem prioridade sobre stickerId da biblioteca */
  customSvg?: string
  /** URL de animação Lottie (CDN) — se presente, renderiza player Lottie em vez de SVG */
  lottieUrl?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  locked?: boolean
}

export interface TextItem {
  id: string
  x: number
  y: number
  text: string
  color: string
  fontSize: number
  fontFamily: 'sans' | 'serif' | 'hand'
}

export interface ShapeItem {
  id: string
  kind: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'triangle'
  x: number
  y: number
  width: number
  height: number
  color: string
}

export interface StickyNote {
  id: string
  x: number
  y: number
  text: string
  color: string
}

export interface CanvasData {
  strokes: Stroke[]
  stickers: StickerInstance[]
  texts: TextItem[]
  shapes: ShapeItem[]
  stickyNotes: StickyNote[]
}

export const EMPTY_CANVAS: CanvasData = {
  strokes: [],
  stickers: [],
  texts: [],
  shapes: [],
  stickyNotes: [],
}

// Dimensões lógicas da página (proporção A4 retrato)
export const PAGE_WIDTH = 820
export const PAGE_HEIGHT = 1160

// ─── Páginas / Templates ─────────────────────────────────────────────────────

export type PageTemplateId =
  | 'blank'
  | 'grid'
  | 'dotted'
  | 'lined'
  | 'cornell'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'kanban'
  | 'checklist'
  | 'habit'
  | 'meal'
  | 'finance'
  | 'calendar'

export interface PlannerPage {
  id: string
  title: string
  template: PageTemplateId
  data: CanvasData
}

// ─── Planners / Organização ──────────────────────────────────────────────────

export type PlannerCategory =
  | 'diario'
  | 'estudos'
  | 'trabalho'
  | 'fitness'
  | 'financas'
  | 'bullet'

export interface Planner {
  id: string
  name: string
  description?: string
  category: PlannerCategory
  color: string
  icon: string // nome de ícone lucide
  favorite: boolean
  folderId: string | null
  tags: string[]
  pages: PlannerPage[]
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  color: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface AgendaEvent {
  id: string
  time: string
  endTime: string
  title: string
  color: string
  plannerId?: string
}

export interface Goal {
  id: string
  title: string
  current: number
  target: number
  unit: string
  color: string
}

export interface DayActivity {
  day: string
  pages: number
  minutes: number
}

// ─── Configurações do Sistema ────────────────────────────────────────────────

/** Identificadores de paletas de cores predefinidas do app */
export type SystemPaletteId =
  | 'amber' // Padrão (default atual, baseado em oklch(0.56 0.1 50))
  | 'rose'
  | 'ocean'
  | 'forest'
  | 'lavender'
  | 'sunset'
  | 'mono'

/** Locais onde gradientes podem ser ativados/desativados */
export type GradientArea = 'dashboard' | 'covers' | 'charts' | 'badges'

export type RadiusPreset = 'sharp' | 'soft' | 'rounded' | 'pill'

export type FontScale = 'sm' | 'base' | 'lg'

export interface SystemSettings {
  /** Paleta de cores do sistema (afeta --primary e derivados) */
  palette: SystemPaletteId
  /** Áreas onde usar gradientes (liga/desliga por local) */
  gradients: Record<GradientArea, boolean>
  /** Raio de borda global */
  radius: RadiusPreset
  /** Escala de fontes */
  fontScale: FontScale
  /** Ativar efeito de papel (grão) no fundo do editor */
  paperGrain: boolean
  /** Ativar glassmorphism nos elementos da UI */
  glassUI: boolean
  /** Ativar textura de "mesa" ao redor do papel no editor */
  deskBackground: boolean
  /** Reduzir animações/movimento */
  reduceMotion: boolean
  /** Confirmar antes de excluir planners/páginas */
  confirmDelete: boolean
  /** Auto-salvar a cada mudança (sempre true por ora; reservado) */
  autoSave: boolean
}

// ─── Módulo de Calendário ─────────────────────────────────────────────────────

/** Evento do calendário —mais rico que AgendaEvent do dashboard */
export interface CalendarEvent {
  id: string
  title: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  startTime: string
  endTime?: string
  allDay?: boolean
  color: string
  notes?: string
  /** Se veio de uma tarefa da Rotina */
  taskId?: string
  plannerId?: string
  createdAt: string
}

// ─── Módulo de Rotina ─────────────────────────────────────────────────────────

/** Prioridades de tarefa */
export type TaskPriority = 'low' | 'medium' | 'high'

/** Frequência de recorrência */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'

/** Dias da semana (Seg=0..Dom=6) —ISO 8601 style */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Tarefa única (avulsa, datada).
 * Diferente de recorrente: existe uma única ocorrência.
 */
export interface Task {
  id: string
  title: string
  notes?: string
  /** ISO date (YYYY-MM-DD) —dia planejado */
  date: string
  priority: TaskPriority
  done: boolean
  createdAt: string
  completedAt?: string
}

/**
 * Tarefa recorrente —gera ocorrências automatizadas.
 * A próxima ocorrência é calculada a partir de `lastDone`/`lastSkipped`.
 */
export interface RecurringTask {
  id: string
  title: string
  notes?: string
  frequency: RecurrenceFrequency
  /** Para weekly: dias da semana em que a tarefa occurring */
  weekdays?: Weekday[]
  /** Dia do mês (1-31) para monthly */
  dayOfMonth?: number
  priority: TaskPriority
  /** ISO date da última conclusão */
  lastDone?: string
  /** Próxima ocorrência calculada (ISO) */
  nextDue: string
  active: boolean
  createdAt: string
}

/**
 * Pendência avulsa —item "inbox" sem data definida.
 * Pode ser convertido em Task ou RecurringTask.
 */
export interface PendingItem {
  id: string
  title: string
  notes?: string
  priority: TaskPriority
  createdAt: string
}

/**
 * Bloco da rotina ideal —fixed slot no dia.
 * Ex: 07:00 Acadinho, 08:00 Café da manhã.
 */
export interface RoutineSlot {
  id: string
  time: string
  endTime?: string
  title: string
  weekdays: Weekday[]
  color?: string
}

// ─── Módulo Financeiro ────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export const INCOME_CATEGORIES = [
  'Salário', 'Freelance', 'Investimentos', 'Vendas', 'Presente', 'Outros',
] as const

export const EXPENSE_CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer',
  'Educação', 'Vestuário', 'Assinaturas', 'Supermercado', 'Outros',
] as const

export interface Transaction {
  id: string
  title: string
  amount: number /** em centavos */
  type: TransactionType
  date: string /** YYYY-MM-DD */
  category: string
  notes?: string
  fixedBillId?: string
  createdAt: string
}

export interface FixedBill {
  id: string
  title: string
  amount: number /** em centavos */
  category: string
  dayOfMonth: number /** 1–31 */
  notes?: string
  active: boolean
  createdAt: string
}

export interface Subscription {
  id: string
  name: string
  amount: number /** em centavos */
  billingCycle: 'monthly' | 'yearly' | 'weekly'
  category: string
  nextBilling: string /** YYYY-MM-DD */
  active: boolean
  notes?: string
  createdAt: string
}

export interface CreditCard {
  id: string
  name: string
  limit: number /** em centavos */
  closingDay: number /** 1–31 */
  dueDay: number /** 1–31 */
  color: string
  createdAt: string
}

export interface Installment {
  id: string
  title: string
  totalAmount: number /** valor total em centavos */
  installmentAmount: number /** valor de cada parcela em centavos */
  totalInstallments: number
  currentInstallment: number
  cardId: string
  category: string
  notes?: string
  createdAt: string
}

export interface FinancialGoal {
  id: string
  title: string
  targetAmount: number /** em centavos */
  currentAmount: number
  deadline?: string /** YYYY-MM-DD */
  color: string
  notes?: string
  icon?: string
  createdAt: string
}

/** Aporte/retirada individual de uma meta */
export interface GoalDeposit {
  id: string
  goalId: string
  amount: number /** positivo = depósito, negativo = retirada */
  date: string /** YYYY-MM-DD */
  notes?: string
  createdAt: string
}

export interface SavingsBox {
  id: string
  name: string
  targetAmount: number /** em centavos */
  currentAmount: number
  color: string
  deadline?: string
  notes?: string
  createdAt: string
}

// ─── Módulo de Hábitos ────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'monthly'

export interface Habit {
  id: string
  name: string
  description?: string
  color: string
  frequency: HabitFrequency
  /** Dias da semana para weekly (Seg=0..Dom=6) */
  weekdays?: Weekday[]
  /** Dia do mês para monthly (1–31) */
  dayOfMonth?: number
  createdAt: string
  archived: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  date: string /** YYYY-MM-DD */
  completed: boolean
  createdAt: string
}

// ─── Módulo de Retrospectiva ──────────────────────────────────────────────────

export type RetrospectiveType = 'daily' | 'weekly' | 'monthly'

export type RetrospectiveMood = 'great' | 'good' | 'neutral' | 'bad' | 'tough'

export interface RetroAction {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export interface RetrospectiveEntry {
  id: string
  type: RetrospectiveType
  /** ISO date (YYYY-MM-DD) — dia inicial do período */
  date: string
  /** ISO date — data final para weekly/monthly */
  endDate?: string
  mood: RetrospectiveMood
  wentWell: string[]
  toImprove: string[]
  actions: RetroAction[]
  notes?: string
  createdAt: string
}

// ─── Módulo de Diário Digital ─────────────────────────────────────────────────

/** Humor/emoção associada a uma entrada do diário */
export type JournalMood = 'great' | 'good' | 'neutral' | 'bad' | 'tough'

export interface JournalEntry {
  id: string
  title: string
  content: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  mood?: JournalMood
  tags: string[]
  createdAt: string
  updatedAt: string
  /** Se verdadeiro, fixa no topo */
  pinned?: boolean
  /** Traços de escrita à mão */
  drawing?: Stroke[]
}

// ─── Módulo de Notas ──────────────────────────────────────────────────────────

export interface NoteFolder {
  id: string
  name: string
  color: string
  icon?: string
}

export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  tags: string[]
  color: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Listas ─────────────────────────────────────────────────────────

export interface ShoppingItem {
  id: string
  name: string
  quantity?: string
  category?: string
  checked: boolean
  notes?: string
  createdAt: string
}

export interface ShoppingList {
  id: string
  name: string
  color: string
  items: ShoppingItem[]
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Wishlist ───────────────────────────────────────────────────────

export interface WishlistItem {
  id: string
  name: string
  url?: string
  price?: number
  priority: 'low' | 'medium' | 'high'
  category?: string
  notes?: string
  purchased: boolean
  purchasedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Checklists ─────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  createdAt: string
}

export interface Checklist {
  id: string
  title: string
  color: string
  items: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Frases Favoritas ───────────────────────────────────────────────

export interface FavoriteQuote {
  id: string
  text: string
  author?: string
  tags: string[]
  color: string
  createdAt: string
}

// ─── Módulo de Cofre de Senhas ────────────────────────────────────────────────

export interface PasswordEntry {
  id: string
  title: string
  username?: string
  password: string
  url?: string
  category?: string
  notes?: string
  color: string
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Caixa de Memórias ──────────────────────────────────────────────

export type MemoryMood = 'great' | 'good' | 'neutral' | 'bad' | 'tough'

export interface MemoryEntry {
  id: string
  title: string
  description: string
  /** ISO date do momento registrado */
  date: string
  mood: MemoryMood
  tags: string[]
  color: string
  createdAt: string
}

// ─── Módulo de Saúde ──────────────────────────────────────────────────────────

export interface WeightRecord {
  id: string
  /** ISO date */
  date: string
  /** Peso em kg */
  weight: number
  notes?: string
  createdAt: string
}

export interface BodyMeasurement {
  id: string
  date: string
  /** cm */
  waist?: number
  /** cm */
  hips?: number
  /** cm */
  chest?: number
  /** cm */
  arm?: number
  /** cm */
  thigh?: number
  notes?: string
  createdAt: string
}

export interface SymptomLog {
  id: string
  date: string
  symptom: string
  severity: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  /** ISO date */
  startDate: string
  /** ISO date (opcional) */
  endDate?: string
  notes?: string
  color: string
  createdAt: string
}

export interface CycleRecord {
  id: string
  /** ISO date de início */
  startDate: string
  /** ISO date de fim */
  endDate?: string
  flow: 'light' | 'medium' | 'heavy'
  symptoms: string[]
  notes?: string
  createdAt: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  color: string
  createdAt: string
}

export interface Appointment {
  id: string
  doctorId?: string
  doctorName: string
  specialty: string
  /** ISO date */
  date: string
  time: string
  location?: string
  notes?: string
  status: 'scheduled' | 'done' | 'cancelled'
  createdAt: string
}

export interface ExamRecord {
  id: string
  name: string
  /** ISO date */
  date: string
  doctor?: string
  laboratory?: string
  result?: string
  fileUrl?: string
  notes?: string
  status: 'pending' | 'done' | 'reviewed'
  color: string
  createdAt: string
}
