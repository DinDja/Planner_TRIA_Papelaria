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
