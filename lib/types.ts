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
  | 'brush'
  | 'marker'
  | 'highlighter'
  | 'calligraphy'
  | 'hatch'
  | 'stipple'
  | 'ink'
  | 'eraser'
  | 'fill'
  | 'ruler'
  | 'lasso'
  | 'text'
  | 'sticker'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'pan'
  | 'hand'
  | 'eyedropper'

/** Quelle fonte uma ferramenta de traço usa — `perfect-freehand` variants + estilos sketch. */
export type BrushStyle =
  | 'pen'
  | 'pencil'
  | 'brush'
  | 'marker'
  | 'highlighter'
  | 'calligraphy'
  | 'hatch'
  | 'stipple'
  | 'ink'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
  /** Tilt em graus (-90..90). Opcional — Suporte a canetas digitais. */
  tiltX?: number
  tiltY?: number
  /** Twist em graus (0..359). Opcional — Suporte a rotacao da caneta. */
  twist?: number
  /** Tipo de pointer que produziu o ponto (para blending modes). */
  pointerType?: 'mouse' | 'pen' | 'touch'
}

export interface Stroke {
  id: string
  tool: BrushStyle | 'ruler'
  color: string
  size: number
  opacity: number
  /** Whether the stroke was pressure-sensitive (affects replay/render). */
  pressureSensitive?: boolean
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
  /** Opacidade 0..1 (default 1). */
  opacity?: number
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
  /** Largura da caixa de texto (auto se omitida). */
  width?: number
  /** Rotation in degrees. */
  rotation?: number
  /** Opacidade 0..1. */
  opacity?: number
  locked?: boolean
}

export interface ShapeItem {
  id: string
  kind: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'triangle'
  x: number
  y: number
  width: number
  height: number
  color: string
  /** Rotation in degrees (0..359). */
  rotation?: number
  /** If true: outline only (sem preenchimento). */
  outline?: boolean
  /** Stroke width when outline is true. */
  strokeWidth?: number
  /** Opacidade 0..1. */
  opacity?: number
  locked?: boolean
}

export interface StickyNote {
  id: string
  x: number
  y: number
  text: string
  color: string
  /** Width em px (default 120). */
  width?: number
  /** Height em px (default 120). */
  height?: number
  /** Rotation in degrees. */
  rotation?: number
  /** Opacidade 0..1. */
  opacity?: number
  locked?: boolean
}

/** Tipo discriminado para itens selecionáveis/editáveis do canvas. */
export type CanvasItemKind = 'sticker' | 'shape' | 'note' | 'text'

/** Referência para um item do canvas. */
export interface CanvasItemRef {
  kind: CanvasItemKind
  id: string
}

/** Textura de papel aplicada sobre a página inteira.
 *  Cada preset simula um tipo diferente de caderno — grão da fibra,
 *  espessura do papel, e como a tinta "assenta". */
export type PaperTextureId =
  | 'plain'      // liso — sem textura visível
  | 'cold-press' // prensado a frio: grão médio, comum p/ aquarela
  | 'hot-press'  // prensado a quente: superfície lisa mas sedosa
  | 'watercolor' // grão grosso p/ absorção de pigmentos
  | 'kraft'      // marrom rústico, fibra visível

export interface CanvasData {
  strokes: Stroke[]
  stickers: StickerInstance[]
  texts: TextItem[]
  shapes: ShapeItem[]
  stickyNotes: StickyNote[]
  /** Cor de fundo da página (opcional). */
  bgColor?: string
  /** Textura de papel aplicada (overlay). Padrão: plain. */
  paperTexture?: PaperTextureId
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
  /** HH:mm —horário do dia */
  time?: string
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
  /** HH:mm —horário do dia */
  time?: string
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

export type FinancialAccountRole = 'receiving' | 'payment'

export interface FinancialAccount {
  id: string
  name: string
  roles: FinancialAccountRole[]
  createdAt: string
  updatedAt: string
}

export const INCOME_CATEGORIES = [
  'Aluguel recebido', 'Clientes', 'Comissão', 'Extra', 'Investimentos',
  'Outros', 'Presente', 'Pró-labore', 'Reembolso', 'Salário', 'Vendas',
] as const

export const EXPENSE_CATEGORIES = [
  'Assinaturas', 'Beleza', 'Compras', 'Educação', 'Lazer', 'Mercado',
  'Moradia', 'Outros', 'Pets', 'Presentes', 'Restaurantes',
] as const

export const SUBSCRIPTION_CATEGORIES = [
  'Streaming de filmes e séries', 'Música', 'Jogos', 'Armazenamento em nuvem',
  'Software', 'Educação', 'Notícias', 'Academia', 'Outros',
] as const

/** Recorrência de receitas — ausente = avulsa. */
export const TRANSACTION_RECURRENCE = ['monthly', 'weekly', 'biweekly', 'yearly'] as const
export type TransactionRecurrence = (typeof TRANSACTION_RECURRENCE)[number]

/** Formas de recebimento e pagamento. */
export const PAYMENT_METHODS = [
  'Pix', 'Transferência', 'Dinheiro', 'Débito', 'Crédito', 'Conta bancária', 'Outro',
] as const

/** Bandeiras de cartão. */
export const CARD_BRANDS = [
  'Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex', 'Outros',
] as const

export type TransactionStatus = 'received' | 'paid' | 'pending'

export interface Transaction {
  id: string
  title: string
  amount: number /** em centavos */
  type: TransactionType
  date: string /** YYYY-MM-DD */
  category: string
  /** Recorrência (mensal/semanal/quinzenal/anual). Ausente = avulsa. */
  recurrence?: TransactionRecurrence
  /** Pix, Transferência, Dinheiro, Débito... */
  paymentMethod?: string
  /** Nome da conta, mantido para compatibilidade com registros antigos. */
  account?: string
  /** Conta cadastrada usada nesta movimentação. */
  accountId?: string
  /** received (receita), paid (despesa) ou pending (pendente) */
  status?: TransactionStatus
  notes?: string
  fixedBillId?: string
  createdAt: string
}

export interface FixedBill {
  id: string
  title: string
  amount: number /** em centavos */
  category: string
  paymentMethod?: string
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
  /** Nome amigável p/ exibição — derivado do banco emissor. */
  name: string
  /** Banco emissor (ex: Nubank, Itaú) */
  bank?: string
  /** Bandeira (Visa, Mastercard, Elo...) */
  brand?: string
  /** Últimos 4 dígitos do cartão */
  lastDigits?: string
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
  /** Data da primeira parcela (YYYY-MM-DD) */
  firstInstallment?: string
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

// ─── Módulo de Diário Digital ─────────────────────────────────────────────────

export type JournalEmotion =
  | 'excited' | 'happy' | 'calm' | 'grateful' | 'inspired'
  | 'anxious' | 'sad' | 'tired' | 'frustrated' | 'stressed'
  | 'confused' | 'hopeful'
  | 'neutral'

export type JournalTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export type PromptCategory = 'gratitude' | 'reflection' | 'creativity' | 'goals' | 'emotions' | 'memory' | 'inspiration'

export interface JournalPrompt {
  id: string
  text: string
  category: PromptCategory
}

export interface MoodSnapshot {
  emotions: JournalEmotion[]
  energy: 1 | 2 | 3 | 4 | 5
  note?: string
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  timeOfDay: JournalTimeOfDay
  mood: MoodSnapshot
  prompt?: string
  tags: string[]
  color: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
  drawing?: Stroke[]
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { id: 'p1', text: 'O que te fez sorrir hoje?', category: 'gratitude' },
  { id: 'p2', text: 'Se você pudesse mudar algo no dia de hoje, o que seria?', category: 'reflection' },
  { id: 'p3', text: 'Qual ideia está borbulhando na sua mente?', category: 'creativity' },
  { id: 'p4', text: 'O que você aprendeu hoje?', category: 'reflection' },
  { id: 'p5', text: 'Por que você está grato(a) agora?', category: 'gratitude' },
  { id: 'p6', text: 'Como você quer se sentir amanhã?', category: 'goals' },
  { id: 'p7', text: 'Qual emoção está mais presente em você agora?', category: 'emotions' },
  { id: 'p8', text: 'Descreva seu dia em uma palavra e depois explique.', category: 'reflection' },
  { id: 'p9', text: 'O que te inspirou recentemente?', category: 'inspiration' },
  { id: 'p10', text: 'Lembre-se de um momento feliz desta semana.', category: 'memory' },
  { id: 'p11', text: 'Se o dia de hoje fosse uma música, qual seria?', category: 'creativity' },
  { id: 'p12', text: 'O que você precisa deixar ir?', category: 'emotions' },
]

export const ENTRY_COLORS = [
  '#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4',
  '#e05b6d', '#f7c59f', '#a0c4ff', '#bdb2ff', '#ffc6ff',
]

export const EMOTION_CONFIG: Record<JournalEmotion, { label: string; color: string; emoji: string }> = {
  excited:   { label: 'Animado',    color: '#f7c59f', emoji: '✨' },
  happy:     { label: 'Feliz',      color: '#7bb686', emoji: '😊' },
  calm:      { label: 'Calmo',      color: '#a0c4ff', emoji: '😌' },
  grateful:  { label: 'Grato',      color: '#c9b6e4', emoji: '🙏' },
  inspired:  { label: 'Inspirado',  color: '#f0b429', emoji: '💡' },
  anxious:  { label: 'Ansioso',    color: '#e8a0a0', emoji: '😰' },
  sad:       { label: 'Triste',     color: '#5b8dbf', emoji: '😢' },
  tired:     { label: 'Cansado',    color: '#a0a0a0', emoji: '😴' },
  frustrated:{ label: 'Frustrado',  color: '#e05b6d', emoji: '😤' },
  stressed:  { label: 'Estressado', color: '#e8a0a0', emoji: '😣' },
  confused:  { label: 'Confuso',   color: '#c9b6e4', emoji: '😕' },
  hopeful:   { label: 'Esperançoso',color: '#7bb686', emoji: '🌱' },
  neutral:   { label: 'Neutro',     color: '#a0a0a0', emoji: '😐' },
}

export const TIME_OF_DAY_CONFIG: Record<JournalTimeOfDay, { label: string; icon: string }> = {
  morning:   { label: 'Manhã',    icon: '🌅' },
  afternoon: { label: 'Tarde',    icon: '☀️' },
  evening:   { label: 'Noite',    icon: '🌙' },
  night:     { label: 'Noite',    icon: '🌃' },
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

export type ShoppingListKind = 'supermercado' | 'farmacia' | 'mala' | 'custom'

export interface ShoppingItem {
  id: string
  name: string
  quantity?: string
  category?: string
  checked: boolean
  dosage?: string
  packed?: boolean
  notes?: string
  createdAt: string
}

/** Item "pronto para usar" cadastrado pelo próprio usuário (por tipo de lista) */
export interface UserListPreset {
  id: string
  kind: ShoppingListKind
  name: string
  quantity?: string
  category?: string
  dosage?: string
}

export interface ShoppingList {
  id: string
  name: string
  color: string
  kind?: ShoppingListKind
  items: ShoppingItem[]
  createdAt: string
  updatedAt: string
}

export interface ShoppingListPresetItem {
  name: string
  quantity?: string
  category?: string
  dosage?: string
  notes?: string
}

export interface ShoppingListPreset {
  id: string
  name: string
  kind: 'supermercado' | 'mala'
  items: ShoppingListPresetItem[]
  createdAt: string
  updatedAt: string
}

// ─── Módulo de Wishlist ───────────────────────────────────────────────────────

export interface WishlistItem {
  id: string
  name: string
  store?: string
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
  source?: 'health-onboarding'
  createdAt: string
}

export interface BodyMeasurement {
  id: string
  date: string
  /** cm */
  bust?: number
  /** cm */
  waist?: number
  /** cm */
  abdomen?: number
  /** cm */
  hips?: number
  /** cm */
  arm?: number
  /** cm */
  thigh?: number
  /** cm */
  calf?: number
  notes?: string
  createdAt: string
}

export interface SymptomLog {
  id: string
  date: string
  symptom: string
  /** HH:mm */
  time?: string
  possibleCause?: string
  severity: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  /** Períodos do dia em que deve ser tomado (ex: Manhã, Noite) */
  times?: string[]
  /** ISO date */
  startDate: string
  /** ISO date (opcional) */
  endDate?: string
  /** Motivo/indicação do medicamento */
  reason?: string
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
  /** O que levar para a consulta */
  whatToBring?: string
  /** Perguntas para fazer ao médico */
  questions?: string
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
  /** HH:mm */
  time?: string
  doctor?: string
  laboratory?: string
  /** Endereço do laboratório/clínica */
  address?: string
  result?: string
  fileUrl?: string
  notes?: string
  status: 'pending' | 'done' | 'reviewed'
  color: string
  createdAt: string
}

// ─── Módulo de Aniversários ───────────────────────────────────────────────────

export interface BirthdayRecord {
  id: string
  /** Nome da pessoa */
  name: string
  /** ISO date (YYYY-MM-DD) — dia do aniversário */
  date: string
  notes?: string
  color: string
  createdAt: string
}

export const BIRTHDAY_COLORS = [
  '#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e05b6d', '#d4b070',
]
