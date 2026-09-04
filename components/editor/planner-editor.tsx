'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useEditorStore } from '@/lib/store/use-editor-store'
import type {
  CanvasData,
  CanvasItemRef,
  PageTemplateId,
  Planner,
  PlannerPage,
  Stroke,
  StrokePoint,
  StickerInstance,
  TextItem,
  ShapeItem,
} from '@/lib/types'
import { EMPTY_CANVAS, PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { PAGE_TEMPLATES, drawTemplate, getTemplateColors, type TemplateColors } from '@/lib/templates'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { useHandwritingOcr } from './hooks/use-handwriting-ocr'
import { TemplateThumbnail } from '../planner-template-thumbnail'
import { Button } from '../ui/button'
import { Input, ScrollArea } from '../ui/primitives'
import { Separator } from '../ui/primitives'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/overlays'
import { toast } from '../ui/toaster'
import { useTheme } from '../providers/theme-provider'
import {
  ALargeSmall,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eraser,
  Grid3X3,
  Highlighter,
  Lasso,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Paintbrush,
  PaintBucket,
  Pipette,
  Pencil,
  Pen,
  Plus,
  Redo2,
  RotateCw,
  RotateCcw,
  Ruler,
  ScanText,
  Square,
  Circle,
  ArrowRight,
  Star,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  Upload,
  Unlock,
  X,
  FileText,
  Download,
  PlusCircle,
  Check,
  BringToFront,
  SendToBack,
  Hand,
  Magnet,
  Settings,
  CircleDot,
  MoreVertical,
  Feather,
  Rows3,
  Grip,
  Droplet,
} from 'lucide-react'
import { ALL_STICKERS, STICKER_CATEGORIES, stickerToDataUrl } from '@/lib/stickers'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCanvasPointer } from './hooks/use-canvas-pointer'
import { useTouchGestures } from './hooks/use-touch-gestures'
import { ContextMenu, type ContextMenuAction } from './context-menu'
import { BottomSheet } from './bottom-sheet'
import { RadialMenu, type RadialItem } from './radial-menu'
import { ColorPalette } from './color-palette'
import { SelectionOverlay } from './selection-overlay'
import { FloatingDock } from './floating-dock'
import { CanvasToolControls } from './canvas-tool-controls'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { BrushStyle } from '@/lib/types'
import { brushStyleOptions, toolToBrushStyle } from '@/lib/store/use-editor-store'

// ─── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

function vecToSvgPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  return `M ${points[0][0]} ${points[0][1]} L ${points
    .slice(1)
    .map((p) => `${p[0]} ${p[1]}`)
    .join(' ')} Z`
}

import type { ToolType } from '@/lib/types'
import type { PaperTextureId } from '@/lib/types'

// ─── Paper texture preset ────────────────────────────────────────────────────
//
// Toda mudança de textura afeta a sensação táctil do caderno inteiro.
// Mapeamos cada id p/ sua utilidade CSS e um nome humano curto.
const PAPER_TEXTURES: { id: PaperTextureId; label: string; hint: string }[] = [
  { id: 'plain', label: 'Liso', hint: 'Papel sem textura' },
  { id: 'cold-press', label: 'Prensado a frio', hint: 'Grão médio — papel de aquarela clássico' },
  { id: 'hot-press', label: 'Prensado a quente', hint: 'Fibra fina — superfície lisa sedosa' },
  { id: 'watercolor', label: 'Aquarela', hint: 'Grão grosso — absorve pigmento' },
  { id: 'kraft', label: 'Kraft', hint: 'Marrom rústico — fibra visível' },
]

const PAPER_TEXTURE_CLASS: Record<PaperTextureId, string> = {
  plain: '',
  'cold-press': 'paper-cold-press',
  'hot-press': 'paper-hot-press',
  watercolor: 'paper-watercolor',
  kraft: 'paper-kraft',
}

const toolbarItems = (): { id: ToolType; icon: typeof Pen; label: string; shortcut: string }[] => [
  { id: 'pen', icon: Pen, label: 'Caneta', shortcut: '1' },
  { id: 'pencil', icon: Pencil, label: 'Lápis', shortcut: '2' },
  { id: 'brush', icon: Paintbrush, label: 'Pincel', shortcut: '3' },
  { id: 'marker', icon: PaintBucket, label: 'Marcador', shortcut: '4' },
  { id: 'highlighter', icon: Highlighter, label: 'Marca-texto', shortcut: '5' },
  { id: 'calligraphy', icon: Feather, label: 'Caligrafia', shortcut: 'Q' },
  { id: 'hatch', icon: Rows3, label: 'Hachura', shortcut: 'W' },
  { id: 'stipple', icon: Grip, label: 'Pontilhado', shortcut: 'E' },
  { id: 'ink', icon: Droplet, label: 'Nanquim', shortcut: 'T' },
  { id: 'eraser', icon: Eraser, label: 'Borracha', shortcut: '6' },
  { id: 'fill', icon: PaintBucket, label: 'Balde', shortcut: '7' },
  { id: 'lasso', icon: Lasso, label: 'Seleção', shortcut: '8' },
  { id: 'ruler', icon: Ruler, label: 'Régua', shortcut: '9' },
  { id: 'text', icon: Type, label: 'Texto', shortcut: '0' },
  { id: 'sticker', icon: Star, label: 'Sticker', shortcut: 'S' },
  { id: 'rectangle', icon: Square, label: 'Retângulo', shortcut: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Círculo', shortcut: 'C' },
  { id: 'line', icon: Minus, label: 'Linha', shortcut: 'L' },
  { id: 'arrow', icon: ArrowRight, label: 'Seta', shortcut: 'A' },
  { id: 'hand', icon: Hand, label: 'Mover', shortcut: 'H' },
  { id: 'eyedropper', icon: Pipette, label: 'Conta-gotas', shortcut: 'I' },
]

/** Itens primários exibidos na dock mobile (máximo 6 por largura). */
/** Ferramentas de pincel primárias — show 9 brushes com preview real, sempre visíveis na dock.
 *  Concepts-style: o usuário vê a forma de cada pincel, escolhe em 1 toque. */
const MOBILE_PRIMARY_TOOLS: ToolType[] = [
  'pen', 'pencil', 'brush', 'marker', 'highlighter',
  'calligraphy', 'hatch', 'stipple', 'ink',
]

/** Tools auxiliares acessíveis via botão "mais" na dock. */
const MOBILE_SECONDARY_TOOLS: ToolType[] = [
  'eraser', 'lasso', 'text', 'sticker',
  'rectangle', 'ellipse', 'line', 'arrow',
  'ruler', 'fill', 'hand', 'eyedropper',
]

/** Mapeamento estático nome→ícone p/ ferramentas auxiliares (sem preview). */
const TOOL_ICON: Record<ToolType, typeof Pen> = {
  pen: Pen, pencil: Pencil, brush: Paintbrush, marker: PaintBucket,
  highlighter: Highlighter, eraser: Eraser, fill: PaintBucket,
  ruler: Ruler, lasso: Lasso, text: Type, sticker: Star,
  rectangle: Square, ellipse: Circle, line: Minus, arrow: ArrowRight,
  hand: Hand, pan: Hand, eyedropper: Pipette,
  calligraphy: Feather, hatch: Rows3, stipple: Grip, ink: Droplet,
}

const TOOL_LABEL: Record<ToolType, string> = {
  pen: 'Caneta', pencil: 'Lápis', brush: 'Pincel', marker: 'Marcador',
  highlighter: 'Marca-texto', eraser: 'Borracha', fill: 'Balde',
  ruler: 'Régua', lasso: 'Seleção', text: 'Texto', sticker: 'Sticker',
  rectangle: 'Retângulo', ellipse: 'Círculo', line: 'Linha', arrow: 'Seta',
  hand: 'Mover', pan: 'Mover', eyedropper: 'Conta-gotas',
  calligraphy: 'Caligrafia', hatch: 'Hachura', stipple: 'Pontilhado', ink: 'Nanquim',
}

/** Tools que renderizam pincel — usam preview de traço em vez de ícone Lucide. */
const STROKE_TOOLS: ToolType[] = [
  'pen', 'pencil', 'brush', 'marker', 'highlighter',
  'calligraphy', 'hatch', 'stipple', 'ink',
]

// ─── Memoized SVG components ────────────────────────────────────────────────

const StrokePath = memo(function StrokePath({ s }: { s: Stroke }) {
  try {
    const brush = (s.tool === 'ruler'
      ? 'pen'
      : toolToBrushStyle(s.tool as ToolType)) as BrushStyle | null
    if (!brush) return null

    // ─── Brush substantivo: calligraphy / ink → perfect-freehand ───
    if (brush === 'pen' || brush === 'pencil' || brush === 'brush' ||
        brush === 'marker' || brush === 'highlighter' ||
        brush === 'calligraphy' || brush === 'ink') {
      const usePressure = s.pressureSensitive && (brush === 'pen' || brush === 'brush' ||
        brush === 'pencil' || brush === 'calligraphy' || brush === 'ink')
      const strokeInput = usePressure
        ? s.points
        : s.points.map((p) => ({ x: p.x, y: p.y }))

      const opts = brushStyleOptions(brush, s.size)
      const pathD = vecToSvgPath(getStroke(strokeInput, {
        size: opts.size,
        thinning: opts.thinning,
        smoothing: opts.smoothing,
        streamline: opts.streamline,
        simulatePressure: !usePressure && brush !== 'marker' && brush !== 'highlighter',
      }))

      const isHighlighter = brush === 'highlighter'
      const fillOpacity = isHighlighter ? s.opacity * 0.7 : s.opacity

      return (
        <path
          d={pathD}
          fill={s.color}
          opacity={fillOpacity}
          style={isHighlighter ? { mixBlendMode: 'multiply' as const } : undefined}
        />
      )
    }

    // ─── Hatch: linhas paralelas perpendiculares ao flow do traço ───
    if (brush === 'hatch') {
      return <HatchStroke s={s} />
    }

    // ─── Stipple: pontos aleatórios ao longo do path, densidade = pressão ──
    if (brush === 'stipple') {
      return <StippleStroke s={s} />
    }

    return null
  } catch {
    return null
  }
})

/** Hatch: ao longo do stroke, desenha linhas perpendiculares com
 *  espaçamento regular. Densidade aumenta c/ a pressão. Simula nanquim
 *  riscado estilo cross-hatching. */
const HatchStroke = memo(function HatchStroke({ s }: { s: Stroke }) {
  if (s.points.length < 2) return null
  const dotSize = s.size
  const spacing = Math.max(3, dotSize * 1.6)
  const hatchLen = dotSize * 1.5

  const lines: { x1: number; y1: number; x2: number; y2: number; o: number }[] = []
  let totalDist = 0
  let nextMark = 0
  for (let i = 1; i < s.points.length; i++) {
    const p0 = s.points[i - 1]
    const p1 = s.points[i]
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const segLen = Math.hypot(dx, dy)
    if (segLen === 0) continue
    const nx = dx / segLen
    const ny = dy / segLen
    const perpX = -ny
    const perpY = nx
    while (totalDist + segLen >= nextMark) {
      const t = (nextMark - (totalDist - segLen)) / segLen
      const tt = Math.max(0, Math.min(1, t))
      const cx = p0.x + dx * tt
      const cy = p0.y + dy * tt
      const op = (0.6 + (s.points[i].pressure ?? 0.5) * 0.4) * s.opacity
      lines.push({
        x1: cx - perpX * hatchLen / 2,
        y1: cy - perpY * hatchLen / 2,
        x2: cx + perpX * hatchLen / 2,
        y2: cy + perpY * hatchLen / 2,
        o: op,
      })
      nextMark += spacing
    }
    totalDist += segLen
  }

  return (
    <g stroke={s.color} strokeWidth={Math.max(0.6, dotSize * 0.35)} strokeLinecap="round">
      {lines.map((ln, i) => (
        <line key={i} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} opacity={ln.o} />
      ))}
    </g>
  )
})

/** Stipple: pontos aleatórios a cada intervalo, tamanho da pressão.
 *  Pseudo-aleatório determinístico p/ estável entre renders. */
const StippleStroke = memo(function StippleStroke({ s }: { s: Stroke }) {
  if (s.points.length < 2) return null
  const baseSize = s.size
  const interval = Math.max(2, baseSize * 0.8)

  let seed = 0
  for (const p of s.points) seed += Math.round(p.x) * 7 + Math.round(p.y) * 13
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  const dots: { cx: number; cy: number; r: number; o: number }[] = []
  let totalDist = 0
  let nextMark = 0
  for (let i = 1; i < s.points.length; i++) {
    const p0 = s.points[i - 1]
    const p1 = s.points[i]
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const segLen = Math.hypot(dx, dy)
    if (segLen === 0) continue
    while (totalDist + segLen >= nextMark) {
      const t = (nextMark - (totalDist - segLen)) / segLen
      const tt = Math.max(0, Math.min(1, t))
      const cx = p0.x + dx * tt + (rand() - 0.5) * baseSize * 0.6
      const cy = p0.y + dy * tt + (rand() - 0.5) * baseSize * 0.6
      const pressure = s.points[i].pressure ?? 0.5
      const r = Math.max(0.3, baseSize * 0.25 * (0.6 + pressure * 0.8))
      const o = (0.5 + pressure * 0.5) * s.opacity
      dots.push({ cx, cy, r, o })
      nextMark += interval * (1.1 - pressure * 0.5)
    }
    totalDist += segLen
  }

  return (
    <g fill={s.color}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} opacity={d.o} />
      ))}
    </g>
  )
})

const ShapeRenderer = memo(function ShapeRenderer({ shape }: { shape: ShapeItem }) {
  const common = { opacity: 0.92 }
  const x = shape.x
  const y = shape.y
  const w = shape.width
  const h = shape.height
  const cx = x + w / 2
  const cy = y + h / 2
  const c = shape.color
  const outline = shape.outline ?? false
  const sw = shape.strokeWidth ?? 3

  const rect = outline ? (
    <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke={c} strokeWidth={sw} {...common} />
  ) : (
    <rect x={x} y={y} width={w} height={h} rx={8} fill={c} {...common} />
  )

  const ellipse = outline ? (
    <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill="none" stroke={c} strokeWidth={sw} {...common} />
  ) : (
    <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={c} {...common} />
  )

  const triangle = outline ? (
    <polygon points={`${cx},${y} ${x + w},${y + h} ${x},${y + h}`} fill="none" stroke={c} strokeWidth={sw} {...common} />
  ) : (
    <polygon points={`${cx},${y} ${x + w},${y + h} ${x},${y + h}`} fill={c} {...common} />
  )

  switch (shape.kind) {
    case 'rectangle':
      return rect
    case 'ellipse':
      return ellipse
    case 'triangle':
      return triangle
    case 'line': {
      const yc = cy
      const lineW = outline ? sw : Math.max(2, Math.min(6, h / 8))
      return <line x1={x} y1={yc} x2={x + w} y2={yc} stroke={c} strokeWidth={lineW} strokeLinecap="round" {...common} />
    }
    case 'arrow': {
      const yc = cy
      const x1 = x
      const x2 = x + w
      const headLen = Math.min(24, w * 0.35)
      const headW = Math.max(6, Math.min(12, h * 0.3))
      const angle = Math.atan2(0, 1) // horizontal
      const hx1 = x2 - headLen * Math.cos(angle) + headW * Math.sin(angle)
      const hy1 = yc - headLen * Math.sin(angle) - headW * Math.cos(angle)
      const hx2 = x2
      const hy2 = yc
      const hx3 = x2 - headLen * Math.cos(angle) - headW * Math.sin(angle)
      const hy3 = yc - headLen * Math.sin(angle) + headW * Math.cos(angle)
      const arrowSw = outline ? sw : Math.max(2.5, Math.min(5, h * 0.12))
      return (
        <g>
          <line x1={x1} y1={yc} x2={x2 - headLen} y2={yc} stroke={c} strokeWidth={arrowSw} strokeLinecap="round" {...common} />
          <polygon points={`${hx1},${hy1} ${hx2},${hy2} ${hx3},${hy3}`} fill={c} {...common} />
        </g>
      )
    }
  }
})

// ─── Tool settings popover ────────────────────────────────────────────────────
// Componente extraído do PlannerEditor para ser estável entre renders,
// evitando que o Popover interno desmonte a cada mudança no editor store.

type EditorState = ReturnType<typeof useEditorStore.getState>

const SHAPE_TOOLS: ToolType[] = ['rectangle', 'ellipse', 'line', 'arrow']

/** Mapeia a tool ativa p/ setters/valores de size e opacity (CanvasToolControls). */
function pickSizeSetter(editor: EditorState, tool: ToolType): ((n: number) => void) | null {
  switch (tool) {
    case 'pen': return editor.setPenSize
    case 'pencil': return editor.setPencilSize
    case 'brush': return editor.setBrushSize
    case 'marker': return editor.setMarkerSize
    case 'highlighter': return editor.setHighlighterSize
    case 'calligraphy': return editor.setCalligraphySize
    case 'hatch': return editor.setHatchSize
    case 'stipple': return editor.setStippleSize
    case 'ink': return editor.setInkSize
    case 'ruler': return editor.setRulerSize
    case 'eraser': return editor.setEraserSize
    case 'rectangle':
    case 'ellipse':
    case 'line':
    case 'arrow': return editor.setShapeStrokeWidth
    default: return null
  }
}

function pickOpacitySetter(editor: EditorState, tool: ToolType): ((n: number) => void) | null {
  switch (tool) {
    case 'pen': return editor.setPenOpacity
    case 'pencil': return editor.setPencilOpacity
    case 'brush': return editor.setBrushOpacity
    case 'marker': return editor.setMarkerOpacity
    case 'highlighter': return editor.setHighlighterOpacity
    case 'calligraphy': return editor.setCalligraphyOpacity
    case 'hatch': return editor.setHatchOpacity
    case 'stipple': return editor.setStippleOpacity
    case 'ink': return editor.setInkOpacity
    case 'ruler': return editor.setRulerOpacity
    default: return null
  }
}

function pickCurrentSize(editor: EditorState, tool: ToolType): number {
  switch (tool) {
    case 'pen': return editor.penSize
    case 'pencil': return editor.pencilSize
    case 'brush': return editor.brushSize
    case 'marker': return editor.markerSize
    case 'highlighter': return editor.highlighterSize
    case 'calligraphy': return editor.calligraphySize
    case 'hatch': return editor.hatchSize
    case 'stipple': return editor.stippleSize
    case 'ink': return editor.inkSize
    case 'ruler': return editor.rulerSize
    case 'eraser': return editor.eraserSize
    case 'rectangle':
    case 'ellipse':
    case 'line':
    case 'arrow': return editor.shapeStrokeWidth
    default: return 3
  }
}

function pickCurrentOpacity(editor: EditorState, tool: ToolType): number {
  switch (tool) {
    case 'pen': return editor.penOpacity
    case 'pencil': return editor.pencilOpacity
    case 'brush': return editor.brushOpacity
    case 'marker': return editor.markerOpacity
    case 'highlighter': return editor.highlighterOpacity
    case 'calligraphy': return editor.calligraphyOpacity
    case 'hatch': return editor.hatchOpacity
    case 'stipple': return editor.stippleOpacity
    case 'ink': return editor.inkOpacity
    case 'ruler': return editor.rulerOpacity
    default: return 1
  }
}

function useToolSettingsEditor() {
  return useEditorStore()
}

function ToolSettings({
  triggerFromRadial,
  mobile,
  setShowToolSettingsFromRadial,
}: {
  triggerFromRadial?: boolean
  mobile?: boolean
  setShowToolSettingsFromRadial: (v: boolean) => void
}) {
  const editor = useToolSettingsEditor()
  const activeTool = editor.activeTool
  const setTool = editor.setActiveTool
  const [localOpen, setLocalOpen] = useState(false)

  const color = editor.getToolColor()
  const size = editor.getToolSize()
  const opacity = editor.getToolOpacity()

  const setterColor =
    activeTool === 'pen' ? editor.setPenColor :
    activeTool === 'pencil' ? editor.setPencilColor :
    activeTool === 'brush' ? editor.setBrushColor :
    activeTool === 'marker' ? editor.setMarkerColor :
    activeTool === 'highlighter' ? editor.setHighlighterColor :
    activeTool === 'calligraphy' ? editor.setCalligraphyColor :
    activeTool === 'hatch' ? editor.setHatchColor :
    activeTool === 'stipple' ? editor.setStippleColor :
    activeTool === 'ink' ? editor.setInkColor :
    activeTool === 'ruler' ? editor.setRulerColor :
    activeTool === 'text' ? editor.setTextColor :
    SHAPE_TOOLS.includes(activeTool) ? editor.setShapeColor :
    activeTool === 'fill' ? editor.setFillColor :
    null

  const setterSize =
    activeTool === 'pen' ? editor.setPenSize :
    activeTool === 'pencil' ? editor.setPencilSize :
    activeTool === 'brush' ? editor.setBrushSize :
    activeTool === 'marker' ? editor.setMarkerSize :
    activeTool === 'highlighter' ? editor.setHighlighterSize :
    activeTool === 'calligraphy' ? editor.setCalligraphySize :
    activeTool === 'hatch' ? editor.setHatchSize :
    activeTool === 'stipple' ? editor.setStippleSize :
    activeTool === 'ink' ? editor.setInkSize :
    activeTool === 'ruler' ? editor.setRulerSize :
    activeTool === 'eraser' ? editor.setEraserSize : null

  const setterOpacity =
    activeTool === 'pen' ? editor.setPenOpacity :
    activeTool === 'pencil' ? editor.setPencilOpacity :
    activeTool === 'brush' ? editor.setBrushOpacity :
    activeTool === 'marker' ? editor.setMarkerOpacity :
    activeTool === 'highlighter' ? editor.setHighlighterOpacity :
    activeTool === 'calligraphy' ? editor.setCalligraphyOpacity :
    activeTool === 'hatch' ? editor.setHatchOpacity :
    activeTool === 'stipple' ? editor.setStippleOpacity :
    activeTool === 'ink' ? editor.setInkOpacity :
    activeTool === 'ruler' ? editor.setRulerOpacity : null

  // Slider espessura max depende do brush
  const sizeMax =
    activeTool === 'highlighter' ? 30 :
    activeTool === 'brush' ? 24 :
    activeTool === 'stipple' ? 20 :
    activeTool === 'eraser' ? 80 : 12

  const isShapeTool = SHAPE_TOOLS.includes(activeTool)

  const close = useCallback(() => {
    setShowToolSettingsFromRadial(false)
    setLocalOpen(false)
  }, [setShowToolSettingsFromRadial])

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold">Configurações</p>
        {!mobile && (
          <button
            onClick={close}
            aria-label="Fechar configurações"
            className="size-6 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {setterColor && (
        <div className="mb-3">
          <ColorPalette
            color={color}
            recent={editor.lastColors}
            onPick={(c) => { setterColor(c); editor.pushLastColor(c) }}
            onEyedropper={() => {
              setTool('eyedropper')
              if (mobile) setShowToolSettingsFromRadial(false)
            }}
            onClearRecent={() => editor.clearLastColors()}
          />
        </div>
      )}
      {setterSize && (
        <>
          <p className="text-[11px] text-muted-foreground mb-1.5">
            Espessura: <span className="font-bold text-foreground">{size}px</span>
          </p>
          <input
            type="range"
            min={0.5}
            max={sizeMax}
            step={0.5}
            value={size}
            onChange={(e) => setterSize?.(Number(e.target.value))}
            className="w-full mb-3"
          />
        </>
      )}
      {setterOpacity && (
        <>
          <p className="text-[11px] text-muted-foreground mb-1.5">
            Opacidade: <span className="font-bold text-foreground">{Math.round(opacity * 100)}%</span>
          </p>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setterOpacity?.(Number(e.target.value))}
            className="w-full"
          />
        </>
      )}
      {(activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'brush' || activeTool === 'calligraphy' || activeTool === 'ink') && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={editor.pressureSensitive}
            onChange={(e) => editor.setPressureSensitive(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[11px]">Sensível à pressão</span>
        </label>
      )}
      {isShapeTool && (
        <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editor.shapeOutline}
              onChange={(e) => editor.setShapeOutline(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-[11px]">Apenas contorno</span>
          </label>
          {editor.shapeOutline && (
            <>
              <p className="text-[11px] text-muted-foreground">
                Espessura do contorno: <span className="font-bold text-foreground">{editor.shapeStrokeWidth}px</span>
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={editor.shapeStrokeWidth}
                onChange={(e) => editor.setShapeStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
            </>
          )}
        </div>
      )}
      <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editor.snappingEnabled}
            onChange={(e) => editor.setSnappingEnabled(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[11px] flex items-center gap-1">
            <Magnet size={11} /> Snap ao grid
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editor.alignmentGuides}
            onChange={(e) => editor.setAlignmentGuides(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[11px]">Guias de alinhamento</span>
        </label>
      </div>
      {activeTool === 'text' && (
        <>
          <p className="text-[11px] text-muted-foreground mb-1.5">Tamanho da fonte</p>
          <input
            type="range"
            min={10}
            max={48}
            step={1}
            value={editor.textFontSize}
            onChange={(e) => editor.setTextFontSize(Number(e.target.value))}
            className="w-full mb-3"
          />
          <p className="text-[11px] text-muted-foreground mb-1.5">Fonte</p>
          <div className="flex gap-1">
            {(['sans', 'serif', 'hand'] as const).map((f) => (
              <button
                key={f}
                onClick={() => editor.setTextFontFamily(f)}
                className={cn(
                  'flex-1 rounded-lg py-1 text-xs transition-colors cursor-pointer',
                  editor.textFontFamily === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70',
                )}
              >
                {f === 'hand' ? 'Mão' : f === 'serif' ? 'Serif' : 'Sans'}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )

  if (mobile) {
    return (
      <BottomSheet
        open={!!triggerFromRadial}
        onClose={() => setShowToolSettingsFromRadial(false)}
        title="Configurações"
        maxHeight="70vh"
        desktopSidePanel={false}
      >
        <div className="p-4">
          {content}
        </div>
      </BottomSheet>
    )
  }

  return (
    <Popover
      open={localOpen || !!triggerFromRadial}
      onOpenChange={(open) => {
        setLocalOpen(open)
        if (!open) setShowToolSettingsFromRadial(false)
      }}
    >
      <PopoverTrigger className="rounded-xl p-1.5 hover:bg-muted transition-colors">
        <div className="size-4 rounded-full border border-border" style={{ backgroundColor: color }} />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 max-h-[80vh] overflow-auto">
        {content}
      </PopoverContent>
    </Popover>
  )
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export function PlannerEditor({ planner }: { planner: Planner }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tc = useMemo(() => getTemplateColors(isDark), [isDark])
  const router = useRouter()
  const isMobile = useIsMobile()

  const updatePageData = useAppStore((s) => s.updatePageData)
  const updatePageTemplate = useAppStore((s) => s.updatePageTemplate)
  const deletePage = useAppStore((s) => s.deletePage)
  const addPageAction = useAppStore((s) => s.addPage)

  const editor = useEditorStore()
  const activeTool = editor.activeTool
  const setTool = editor.setActiveTool

  // ─── FloatingDock: metadados c/ preview real de pincel ───
  const primaryMetas = useMemo(() =>
    MOBILE_PRIMARY_TOOLS.map((id) => ({
      id,
      icon: TOOL_ICON[id],
      label: TOOL_LABEL[id],
      color: editor.getToolColorFor(id),
      size: editor.getToolSizeFor(id),
      opacity: editor.getToolOpacityFor(id),
      hasStrokePreview: STROKE_TOOLS.includes(id),
    })),
    [editor],
  )
  const secondaryMetas = useMemo(() =>
    MOBILE_SECONDARY_TOOLS.map((id) => ({
      id,
      label: TOOL_LABEL[id],
      icon: TOOL_ICON[id],
    })),
    [],
  )

  const zoom = editor.zoom || 1
  const displayWidth = (PAGE_WIDTH * zoom) / 1.5
  const displayHeight = (PAGE_HEIGHT * zoom) / 1.5
  const displayScale = displayWidth / PAGE_WIDTH

  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [showPagesPanel, setShowPagesPanel] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [stickerSearch, setStickerSearch] = useState('')
  const [stickerCat, setStickerCat] = useState<'all' | 'favorites' | string>('all')
  const [favoriteStickers, setFavoriteStickers] = useState<Set<string>>(new Set())
  const [showOcrPanel, setShowOcrPanel] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showMobileTopMenu, setShowMobileTopMenu] = useState(false)
  const [showTemplateSheet, setShowTemplateSheet] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [radialMenuOpen, setRadialMenuOpen] = useState(false)
  const [radialMenu, setRadialMenu] = useState<{ x: number; y: number } | null>(null)
  const [showToolSettingsFromRadial, setShowToolSettingsFromRadial] = useState(false)
  /** Quando verdadeiro, o FloatingDock recolhe totalmente.
   *  Verdade quando desenhando OU quando um pointer está no canvas.
   *  Resetado depois de 600ms inativo p/ sempre voltar à vista. */
  const [pointerInCanvas, setPointerInCanvas] = useState(false)
  const pointerInCanvasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{
    x: number
    y: number
    target: { type: 'sticker' | 'shape' | 'note' | 'text'; id: string; locked?: boolean } | null
  } | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const noteEditCancelRef = useRef(false)

  // Client-only dynamic import for LottiePlayer (uses `document` at module eval)
  const LottiePlayer = dynamic(() => import('@lottiefiles/react-lottie-player').then((m) => m.Player), {
    ssr: false,
  })

  // Eraser cursor ref
  const eraserCursorRef = useRef<HTMLDivElement>(null)

  const pages = planner.pages.length > 0 ? planner.pages : []
  const currentPage = pages[currentPageIdx] ?? null
  const data: CanvasData = currentPage?.data ?? { ...EMPTY_CANVAS }

  const goToPage = (idx: number) => {
    if (idx >= 0 && idx < pages.length) setCurrentPageIdx(idx)
  }

  const handleAddPage = () => {
    addPageAction(planner.id, 'blank')
    setCurrentPageIdx(pages.length)
  }

  const handleDeletePageAt = (idx: number) => {
    const page = pages[idx]
    if (!page) return
    if (pages.length <= 1) {
      toast({ title: 'Precisa ter ao menos uma página', variant: 'error' })
      return
    }
    deletePage(planner.id, page.id)
    if (idx <= currentPageIdx) setCurrentPageIdx(Math.max(0, currentPageIdx - 1))
  }

  const handleChangeTemplate = (tpl: PageTemplateId) => {
    if (!currentPage) return
    updatePageTemplate(planner.id, currentPage.id, tpl)
  }

  // Texture de papel — só reescreve o data.paperTexture, sem tocar mais nada.
  const handleSetPaperTexture = (tex: PaperTextureId) => {
    if (!currentPage) return
    const newData: CanvasData = { ...data, paperTexture: tex }
    // Kraft sobrepuja bgColor se não definido (tem seu próprio tom marrom).
    if (tex === 'kraft' && !data.bgColor) newData.bgColor = undefined
    updatePageData(planner.id, currentPage.id, newData)
  }

  // Undo/Redo with current data
  const handleUndo = () => {
    if (!currentPage) return
    const prev = editor.undo(currentPage.id, data)
    if (prev) updatePageData(planner.id, currentPage.id, prev)
  }

  const handleRedo = () => {
    if (!currentPage) return
    const next = editor.redo(currentPage.id, data)
    if (next) updatePageData(planner.id, currentPage.id, next)
  }

  // ─── Touch gestures (Etapa 5) ──────────────────────────────────────────────
  //
  // Alternar pen ↔ eraser com duplo-toque é a troca mais requisitada em
  // canvas mobile (Procreate, Concepts, GoodNotes). Guardamos "última
  // ferramenta" para restaurar quando o usuário sair da borracha —
  // mesma convenção das referências citadas.
  const lastToolBeforeEraserRef = useRef<ToolType | null>(null)

  const togglePenEraser = useCallback(() => {
    const cur = useEditorStore.getState().activeTool
    if (cur === 'eraser') {
      const prev = lastToolBeforeEraserRef.current ?? 'pen'
      useEditorStore.getState().setActiveTool(prev)
    } else {
      lastToolBeforeEraserRef.current = cur
      useEditorStore.getState().setActiveTool('eraser')
    }
  }, [])

  // ─── Canvas refs & pointer hook ────────────────────────────────────────────

  const canvasRef = useRef<HTMLDivElement>(null)
  const radialTriggerRef = useRef<HTMLButtonElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const {
    isDrawing,
    currentPoints,
    rulerStart,
    rulerEnd,
    shapeDraft,
    textInput,
    textValue,
    setTextValue,
    selectedItems,
    setSelectedItems,
    selectItem,
    getSelectionBounds,
    getItemBounds,
    transformSession,
    selectedStickerId,
    selectedShapeId,
    selectedNoteId,
    selectedTextId,
    isPanning,
    guides,
    clearSelection,
    getPageCoords,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleDoubleClick,
    setTextInput,
    commit,
    beginMove,
    beginResize,
    beginRotate,
    pickColorAt,
    floodFill,
  } = useCanvasPointer({
    plannerId: planner.id,
    currentPageId: currentPage?.id ?? null,
    data,
    canvasRef,
  })

  // ─── Touch gestures (Etapa 5) ─ multimão ────────────────────────────────────
  //
  // Long-press touch → apaga traços cujo centróide caia numa área ~32px
  // ao redor do toque (feedback imediato: a mão não precisa sair do canvas).
  const handleLongPressErase = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas || !currentPage) return
    const rect = canvas.getBoundingClientRect()
    const px = (x - rect.left) * (PAGE_WIDTH / rect.width)
    const py = (y - rect.top) * (PAGE_HEIGHT / rect.height)
    const R = 32
    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
    let touched = false
    newData.strokes = newData.strokes.filter((s) => {
      if (s.points.length === 0) return false
      let cx = 0
      let cy = 0
      for (const p of s.points) { cx += p.x; cy += p.y }
      cx /= s.points.length
      cy /= s.points.length
      const hit = Math.hypot(cx - px, cy - py) < R
      if (hit) touched = true
      return !hit
    })
    if (touched) {
      commit(newData)
      toast({ title: 'Traço removido', description: 'Toque longo' })
    }
  }, [canvasRef, currentPage, data, commit])

  // 2 dedos → undo; 3 dedos → redo. Procreate-style: a mão não precisa
  // acertar um botão na barra superior.
  useTouchGestures({
    onTwoFingerTap: handleUndo,
    onThreeFingerTap: handleRedo,
    onDoubleTap: togglePenEraser,
    onPenDoubleTap: togglePenEraser,
    onLongPress: handleLongPressErase,
  })

  // ─── OCR ────────────────────────────────────────────────────────────────────

  const insertOcrText = useCallback(
    (text: string) => {
      if (!currentPage || !text.trim()) return
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      newData.texts = [
        ...newData.texts,
        {
          id: uid(),
          x: PAGE_WIDTH / 2 - 120,
          y: PAGE_HEIGHT / 2 - 20,
          text: text.trim(),
          color: editor.textColor,
          fontSize: editor.textFontSize,
          fontFamily: editor.textFontFamily,
        },
      ]
      commit(newData)
      toast({ title: 'Texto inserido', description: 'Toque para editar ou arrastar' })
    },
    [currentPage, data, editor.textColor, editor.textFontSize, editor.textFontFamily, commit],
  )

  const ocr = useHandwritingOcr({ lang: 'por' })

  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas || !currentPage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = PAGE_WIDTH
    canvas.height = PAGE_HEIGHT
    drawTemplate(ctx, currentPage.template, PAGE_WIDTH, PAGE_HEIGHT, tc)
  }, [currentPage, tc])

  // Ctrl+wheel zoom
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) editor.zoomIn()
        else editor.zoomOut()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [editor])

  // Autosave indicator
  useEffect(() => {
    setAutoSaveStatus('saving')
    const timer = setTimeout(() => setAutoSaveStatus('saved'), 300)
    return () => clearTimeout(timer)
  }, [data])

  // ─── Filters ────────────────────────────────────────────────────────────────

  const stickers = useMemo(() => {
    let filtered = ALL_STICKERS
    if (stickerCat === 'favorites') {
      filtered = filtered.filter((s) => favoriteStickers.has(s.id))
    } else if (stickerCat !== 'all') {
      filtered = filtered.filter((s) => s.category === stickerCat)
    }
    if (stickerSearch) {
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(stickerSearch.toLowerCase()))
    }
    return filtered
  }, [stickerCat, stickerSearch, favoriteStickers])

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (typing) {
        if (e.key === 'Escape') (target as HTMLInputElement).blur?.()
        return
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }

      // Page navigation (Alt+arrows)
      if (e.key === 'ArrowLeft' && e.altKey) {
        goToPage(currentPageIdx - 1)
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        goToPage(currentPageIdx + 1)
      }

      // Tool shortcuts 1-9
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const num = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].indexOf(e.key)
        if (num >= 0) {
          e.preventDefault()
          const tool = toolbarItems()[num]?.id
          if (tool) {
            setTool(tool)
            if (tool === 'sticker') setShowStickerPanel(true)
          }
        }
      }

      // Zoom shortcuts
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        editor.zoomIn()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        editor.zoomOut()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        editor.fitToScreen()
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItems.length > 0) {
          e.preventDefault()
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          const ids = selectedItems
          newData.stickers = newData.stickers.filter(s => !ids.some(i => i.kind === 'sticker' && i.id === s.id))
          newData.shapes = newData.shapes.filter(s => !ids.some(i => i.kind === 'shape' && i.id === s.id))
          newData.stickyNotes = newData.stickyNotes.filter(n => !ids.some(i => i.kind === 'note' && i.id === n.id))
          newData.texts = newData.texts.filter(t => !ids.some(i => i.kind === 'text' && i.id === t.id))
          commit(newData)
          clearSelection()
        }
      }

      // Ctrl+A select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        const all: CanvasItemRef[] = [
          ...data.stickers.map(s => ({ kind: 'sticker' as const, id: s.id })),
          ...data.shapes.map(s => ({ kind: 'shape' as const, id: s.id })),
          ...data.stickyNotes.map(n => ({ kind: 'note' as const, id: n.id })),
          ...data.texts.map(t => ({ kind: 'text' as const, id: t.id })),
        ]
        setSelectedItems(all)
      }

      // Escape - clear selection / close panels
      if (e.key === 'Escape') {
        clearSelection()
        setTextInput(null)
        setEditingNoteId(null)
      }

      // Ctrl+D duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedItems.length === 0) return
        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
        for (const ref of selectedItems) {
          if (ref.kind === 'sticker') {
            const orig = newData.stickers.find(s => s.id === ref.id)
            if (orig) newData.stickers.push({ ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 })
          } else if (ref.kind === 'shape') {
            const orig = newData.shapes.find(s => s.id === ref.id)
            if (orig) newData.shapes.push({ ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 })
          } else if (ref.kind === 'note') {
            const orig = newData.stickyNotes.find(n => n.id === ref.id)
            if (orig) newData.stickyNotes.push({ ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 })
          } else if (ref.kind === 'text') {
            const orig = newData.texts.find(t => t.id === ref.id)
            if (orig) newData.texts.push({ ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 })
          }
        }
        commit(newData)
        toast({ title: 'Duplicado' })
      }

      // Ctrl+C copy
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedItems.length > 0) {
        e.preventDefault()
        const clip = {
          stickers: data.stickers.filter(s => selectedItems.some(i => i.kind === 'sticker' && i.id === s.id)),
          shapes: data.shapes.filter(s => selectedItems.some(i => i.kind === 'shape' && i.id === s.id)),
          stickyNotes: data.stickyNotes.filter(n => selectedItems.some(i => i.kind === 'note' && i.id === n.id)),
          texts: data.texts.filter(t => selectedItems.some(i => i.kind === 'text' && i.id === t.id)),
        }
        editor.setClipboard(JSON.parse(JSON.stringify(clip)))
        toast({ title: `${selectedItems.length} item(s) copiados` })
      }

      // Ctrl+X cut
      if ((e.metaKey || e.ctrlKey) && e.key === 'x' && selectedItems.length > 0) {
        e.preventDefault()
        const clip = {
          stickers: data.stickers.filter(s => selectedItems.some(i => i.kind === 'sticker' && i.id === s.id)),
          shapes: data.shapes.filter(s => selectedItems.some(i => i.kind === 'shape' && i.id === s.id)),
          stickyNotes: data.stickyNotes.filter(n => selectedItems.some(i => i.kind === 'note' && i.id === n.id)),
          texts: data.texts.filter(t => selectedItems.some(i => i.kind === 'text' && i.id === t.id)),
        }
        editor.setClipboard(JSON.parse(JSON.stringify(clip)))
        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
        const ids = selectedItems
        newData.stickers = newData.stickers.filter(s => !ids.some(i => i.kind === 'sticker' && i.id === s.id))
        newData.shapes = newData.shapes.filter(s => !ids.some(i => i.kind === 'shape' && i.id === s.id))
        newData.stickyNotes = newData.stickyNotes.filter(n => !ids.some(i => i.kind === 'note' && i.id === n.id))
        newData.texts = newData.texts.filter(t => !ids.some(i => i.kind === 'text' && i.id === t.id))
        commit(newData)
        clearSelection()
        toast({ title: 'Recortado' })
      }

      // Ctrl+V paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && editor.clipboard) {
        e.preventDefault()
        const clip = editor.clipboard
        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
        const OFFSET = 24
        const newRefs: CanvasItemRef[] = []
        for (const s of clip.stickers) {
          const newId = uid()
          newData.stickers.push({ ...s, id: newId, x: s.x + OFFSET, y: s.y + OFFSET })
          newRefs.push({ kind: 'sticker', id: newId })
        }
        for (const s of clip.shapes) {
          const newId = uid()
          newData.shapes.push({ ...s, id: newId, x: s.x + OFFSET, y: s.y + OFFSET })
          newRefs.push({ kind: 'shape', id: newId })
        }
        for (const n of clip.stickyNotes) {
          const newId = uid()
          newData.stickyNotes.push({ ...n, id: newId, x: n.x + OFFSET, y: n.y + OFFSET })
          newRefs.push({ kind: 'note', id: newId })
        }
        for (const t of clip.texts) {
          const newId = uid()
          newData.texts.push({ ...t, id: newId, x: t.x + OFFSET, y: t.y + OFFSET })
          newRefs.push({ kind: 'text', id: newId })
        }
        commit(newData)
        setSelectedItems(newRefs)
        toast({ title: 'Colado' })
      }

      // Nudge with arrows (when selection exists)
      if (!e.altKey && !e.metaKey && !e.ctrlKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedItems.length > 0) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          let dx = 0, dy = 0
          if (e.key === 'ArrowUp') dy = -step
          if (e.key === 'ArrowDown') dy = step
          if (e.key === 'ArrowLeft') dx = -step
          if (e.key === 'ArrowRight') dx = step

          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          for (const ref of selectedItems) {
            if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, x: s.x + dx, y: s.y + dy } : s)
            else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, x: s.x + dx, y: s.y + dy } : s)
            else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, x: n.x + dx, y: n.y + dy } : n)
            else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, x: t.x + dx, y: t.y + dy } : t)
          }
          commit(newData)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentPageIdx, data, handleUndo, handleRedo,
    selectedItems, setSelectedItems,
    commit, clearSelection, setTextInput, editor, setTool,
  ])

  // ─── Sticker drop onto canvas ──────────────────────────────────────────────

  const placeSticker = useCallback((stickerId: string, x: number, y: number) => {
    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
    const inst: StickerInstance = {
      id: uid(),
      stickerId,
      x,
      y,
      width: 80,
      height: 80,
      rotation: 0,
    }
    newData.stickers = [...newData.stickers, inst]
    commit(newData)
  }, [commit, data])

  // ─── Context menu ──────────────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pt = getPageCoords(e as unknown as React.PointerEvent)
    // Hit test order: notes (top), texts, stickers, shapes (bottom)
    for (const n of [...data.stickyNotes].reverse()) {
      if (pt.x >= n.x && pt.x <= n.x + 120 && pt.y >= n.y && pt.y <= n.y + 120) {
        setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'note', id: n.id } })
        return
      }
    }
    for (const t of [...data.texts].reverse()) {
      const w = Math.max(20, t.text.length * t.fontSize * 0.58)
      const h = t.fontSize * 1.3
      if (pt.x >= t.x && pt.x <= t.x + w && pt.y >= t.y && pt.y <= t.y + h) {
        setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'text', id: t.id } })
        return
      }
    }
    for (const s of [...data.stickers].reverse()) {
      if (pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height) {
        setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'sticker', id: s.id, locked: s.locked } })
        return
      }
    }
    for (const s of [...data.shapes].reverse()) {
      if (pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height) {
        setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'shape', id: s.id } })
        return
      }
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, target: null })
  }, [data, getPageCoords])

  const buildCtxMenuActions = useCallback((): ContextMenuAction[] => {
    const actions: ContextMenuAction[] = []

    if (!ctxMenu?.target) {
      actions.push(
        { id: 'add-sticky-note', label: 'Nova nota adesiva', icon: StickyNote, onClick: () => {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.stickyNotes = [...newData.stickyNotes, {
            id: uid(), x: 200, y: 200 + Math.random() * 200, text: '', color: '#b76f06',
          }]
          commit(newData)
          toast({ title: 'Nota adesiva adicionada' })
        }},
        { id: 'add-shape', label: 'Novo retângulo', icon: Square, onClick: () => {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.shapes = [...newData.shapes, {
            id: uid(), kind: 'rectangle', x: 200, y: 200, width: 120, height: 80, color: '#d1bdb8',
          }]
          commit(newData)
          toast({ title: 'Forma adicionada' })
        }},
      )
      return actions
    }

    const { target } = ctxMenu

    const duplicate = () => {
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      if (target.type === 'sticker') {
        const orig = newData.stickers.find((s) => s.id === target.id)
        if (!orig) return
        newData.stickers = [...newData.stickers, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
      } else if (target.type === 'shape') {
        const orig = newData.shapes.find((s) => s.id === target.id)
        if (!orig) return
        newData.shapes = [...newData.shapes, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
      } else if (target.type === 'note') {
        const orig = newData.stickyNotes.find((n) => n.id === target.id)
        if (!orig) return
        newData.stickyNotes = [...newData.stickyNotes, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
      } else if (target.type === 'text') {
        const orig = newData.texts.find((t) => t.id === target.id)
        if (!orig) return
        newData.texts = [...newData.texts, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
      }
      commit(newData)
    }

    const remove = () => {
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      if (target.type === 'sticker') newData.stickers = newData.stickers.filter((s) => s.id !== target.id)
      else if (target.type === 'shape') newData.shapes = newData.shapes.filter((s) => s.id !== target.id)
      else if (target.type === 'note') newData.stickyNotes = newData.stickyNotes.filter((n) => n.id !== target.id)
      else if (target.type === 'text') newData.texts = newData.texts.filter((t) => t.id !== target.id)
      commit(newData)
      clearSelection()
    }

    const editNote = () => {
      if (target.type === 'note') setEditingNoteId(target.id)
    }

    const editText = () => {
      if (target.type === 'text') {
        const t = data.texts.find((x) => x.id === target.id)
        if (t) {
          setTextInput({ x: t.x, y: t.y, show: true, editingId: t.id })
          setTextValue(t.text)
        }
      }
    }

    actions.push(
      { id: 'duplicate', label: 'Duplicar', icon: Copy, shortcut: 'Ctrl+D', onClick: duplicate },
      { id: 'delete', label: 'Excluir', icon: Trash2, shortcut: 'Del', onClick: remove },
    )

    if (target.type === 'sticker') {
      const toggleLock = () => {
        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
        newData.stickers = newData.stickers.map((s) =>
          s.id === target.id ? { ...s, locked: !s.locked } : s,
        )
        commit(newData)
      }
      const rotate = (deg: number) => () => {
        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
        newData.stickers = newData.stickers.map((s) =>
          s.id === target.id ? { ...s, rotation: ((s.rotation + deg) % 360 + 360) % 360 } : s,
        )
        commit(newData)
      }
      actions.push(
        { id: 'toggle-lock', label: target.locked ? 'Desbloquear' : 'Bloquear', icon: target.locked ? Unlock : Lock, onClick: toggleLock },
        { id: '__separator1__', label: '', icon: Copy, onClick: () => {} },
        { id: 'rotate-cw', label: 'Girar 90°', icon: RotateCw, onClick: rotate(90) },
        { id: 'rotate-ccw', label: 'Girar -90°', icon: RotateCcw, onClick: rotate(-90) },
      )
    } else if (target.type === 'note') {
      actions.push(
        { id: 'edit-note', label: 'Editar nota', icon: Pencil, onClick: editNote },
        { id: '__separator1__', label: '', icon: Copy, onClick: () => {} },
      )
    } else if (target.type === 'text') {
      actions.push(
        { id: 'edit-text', label: 'Editar texto', icon: Pencil, onClick: editText },
        { id: '__separator1__', label: '', icon: Copy, onClick: () => {} },
      )
    }

    const bringFront = () => {
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      if (target.type === 'sticker') {
        const idx = newData.stickers.findIndex((s) => s.id === target.id)
        if (idx < 0) return
        const [item] = newData.stickers.splice(idx, 1)
        newData.stickers.push(item)
      } else if (target.type === 'shape') {
        const idx = newData.shapes.findIndex((s) => s.id === target.id)
        if (idx < 0) return
        const [item] = newData.shapes.splice(idx, 1)
        newData.shapes.push(item)
      } else if (target.type === 'note') {
        const idx = newData.stickyNotes.findIndex((n) => n.id === target.id)
        if (idx < 0) return
        const [item] = newData.stickyNotes.splice(idx, 1)
        newData.stickyNotes.push(item)
      }
      commit(newData)
    }

    const sendBack = () => {
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      if (target.type === 'sticker') {
        const idx = newData.stickers.findIndex((s) => s.id === target.id)
        if (idx < 0) return
        const [item] = newData.stickers.splice(idx, 1)
        newData.stickers.unshift(item)
      } else if (target.type === 'shape') {
        const idx = newData.shapes.findIndex((s) => s.id === target.id)
        if (idx < 0) return
        const [item] = newData.shapes.splice(idx, 1)
        newData.shapes.unshift(item)
      } else if (target.type === 'note') {
        const idx = newData.stickyNotes.findIndex((n) => n.id === target.id)
        if (idx < 0) return
        const [item] = newData.stickyNotes.splice(idx, 1)
        newData.stickyNotes.unshift(item)
      }
      commit(newData)
    }

    actions.push(
      { id: '__separator2__', label: '', icon: Copy, onClick: () => {} },
      { id: 'bring-front', label: 'Trazer p/ frente', icon: BringToFront, onClick: bringFront },
      { id: 'send-back', label: 'Enviar p/ trás', icon: SendToBack, onClick: sendBack },
    )

    return actions
  }, [ctxMenu, data, commit, clearSelection, setTextInput, setTextValue])

  const ctxLabel = ctxMenu?.target
    ? (ctxMenu.target.type === 'sticker' ? 'Sticker' :
       ctxMenu.target.type === 'shape' ? 'Forma' :
       ctxMenu.target.type === 'note' ? 'Nota adesiva' : 'Texto')
    : undefined

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderStrokes = () => {
    const allStrokes = [...data.strokes]
    if (isDrawing && currentPoints.length > 0 && activeTool !== 'eraser' && activeTool !== 'ruler' && activeTool !== 'lasso' && !shapeDraft) {
      const brush = toolToBrushStyle(activeTool)
      if (brush) {
        allStrokes.push({
          id: 'preview',
          tool: brush,
          color: editor.getToolColor(),
          size: editor.getToolSize(),
          opacity: editor.getToolOpacity(),
          pressureSensitive: editor.pressureSensitive && (brush === 'pen' || brush === 'brush' || brush === 'pencil' || brush === 'calligraphy' || brush === 'ink'),
          points: currentPoints,
        })
      }
    }
    return allStrokes.map((s) => <StrokePath key={s.id} s={s} />)
  }

  const renderShapeDraft = () => {
    if (!shapeDraft) return null
    const x = Math.min(shapeDraft.startX, shapeDraft.endX)
    const y = Math.min(shapeDraft.startY, shapeDraft.endY)
    const w = Math.abs(shapeDraft.endX - shapeDraft.startX)
    const h = Math.abs(shapeDraft.endY - shapeDraft.startY)
    const preview: ShapeItem = {
      id: 'draft',
      kind: shapeDraft.kind,
      x,
      y,
      width: Math.max(2, w),
      height: shapeDraft.kind === 'line' ? Math.max(2, h) : Math.max(2, h),
      color: editor.shapeColor,
      outline: editor.shapeOutline,
      strokeWidth: editor.shapeStrokeWidth,
    }
    return <ShapeRenderer shape={preview} />
  }

  const renderRulerPreview = () => {
    if (activeTool === 'ruler' && rulerStart && rulerEnd) {
      const s: Stroke = {
        id: 'preview-ruler',
        tool: 'ruler',
        color: editor.rulerColor,
        size: editor.rulerSize,
        opacity: editor.rulerOpacity,
        points: [rulerStart, rulerEnd],
      }
      try {
        const pathD = vecToSvgPath(getStroke(s.points, { size: s.size, thinning: 0.2, smoothing: 0.8, streamline: 0.6 }))
        return <path d={pathD} fill={s.color} opacity={s.opacity} />
      } catch {
        return null
      }
    }
    return null
  }

  const renderGuides = () => {
    if (!editor.alignmentGuides) return null
    return (
      <g stroke="var(--primary)" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} pointerEvents="none">
        {guides.x.map((x) => (
          <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={PAGE_HEIGHT} />
        ))}
        {guides.y.map((y) => (
          <line key={`gy-${y}`} x1={0} y1={y} x2={PAGE_WIDTH} y2={y} />
        ))}
      </g>
    )
  }

  const renderLassoPreview = () => {
    if (activeTool === 'lasso' && isDrawing && currentPoints.length > 1) {
      return (
        <path
          d={`M ${currentPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.8}
          className="text-primary"
        />
      )
    }
    return null
  }

  // ToolSettings agora é um componente próprio (declarado fora deste componente),
  // para evitar que o Popover interno desmonte a cada re-render.

  // ─── Text input commit handler ──────────────────────────────────────────────

  const commitTextInput = useCallback(() => {
    if (!textInput?.show || !textValue.trim()) {
      setTextInput(null)
      setTextValue('')
      return
    }
    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
    if (textInput.editingId) {
      newData.texts = newData.texts.map((t) =>
        t.id === textInput.editingId
          ? { ...t, text: textValue, color: editor.textColor, fontSize: editor.textFontSize, fontFamily: editor.textFontFamily }
          : t,
      )
    } else {
      newData.texts = [
        ...newData.texts,
        {
          id: uid(),
          x: textInput.x,
          y: textInput.y,
          text: textValue,
          color: editor.textColor,
          fontSize: editor.textFontSize,
          fontFamily: editor.textFontFamily,
        },
      ]
    }
    commit(newData)
    setTextInput(null)
    setTextValue('')
  }, [textInput, textValue, data, editor.textColor, editor.textFontSize, editor.textFontFamily, commit, setTextInput, setTextValue])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[100dvh] flex-col bg-[color:light-dark(#ddd6c6,#211f1a)]">
      {/* Top bar (mobile-first) */}
      <div className="flex items-center gap-2 h-12 md:h-14 px-2 md:px-3 border-b border-border/40 bg-background/80 backdrop-blur-lg shrink-0">
        <Button variant="ghost" size="icon-sm" className="rounded-xl shrink-0" onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>

        {/* Title / rename */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate max-w-[120px] md:max-w-[200px]">{planner.name}</span>
          <input
            value={currentPage?.title ?? ''}
            onChange={(e) => {
              if (!currentPage) return
              useAppStore.getState().updatePlanner(planner.id, {
                pages: pages.map((p) => (p.id === currentPage.id ? { ...p, title: e.target.value } : p)),
              })
            }}
            className="hidden md:block text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1 max-w-[140px] text-muted-foreground"
          />
        </div>

        <div className="hidden md:block w-px h-5 bg-border mx-1" />

        {/* Autosave indicator (desktop) */}
        <span className={cn(
          'hidden md:block text-[10px] transition-opacity duration-500',
          autoSaveStatus === 'saving' ? 'opacity-100 text-warning' : 'opacity-50 text-muted-foreground'
        )}>
          {autoSaveStatus === 'saving' ? 'Salvando…' : 'Salvo ✓'}
        </span>

        <div className="flex-1" />

        {/* Page navigator dropdown */}
        <Popover>
          <PopoverTrigger className="text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 cursor-pointer shrink-0">
            <span className="md:hidden">{currentPageIdx + 1}/{pages.length}</span>
            <span className="hidden md:inline">Página {currentPageIdx + 1} de {pages.length}</span>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold">Ir para página</span>
              <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={handleAddPage}>
                <Plus size={12} />
              </Button>
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-0.5">
                {pages.map((page, i) => (
                  <button
                    key={page.id}
                    onClick={() => { goToPage(i); setShowPagesPanel(false) }}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-1.5 text-left transition-colors',
                      i === currentPageIdx
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground/80',
                    )}
                  >
                    <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-5">
                      {i + 1}
                    </span>
                    <span className="text-xs truncate flex-1">{page.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{page.template}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1">
          {/* Duplicate page */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => {
              if (!currentPage) return
              const newPage: PlannerPage = {
                id: `pg-${uid()}`,
                title: `${currentPage.title} (cópia)`,
                template: currentPage.template,
                data: JSON.parse(JSON.stringify(currentPage.data)),
              }
              useAppStore.getState().updatePlanner(planner.id, {
                pages: [...pages.slice(0, currentPageIdx + 1), newPage, ...pages.slice(currentPageIdx + 1)],
              })
              toast({ title: 'Página duplicada' })
            }}
          >
            <Copy size={14} />
          </Button>

          {/* Template selector */}
          <Popover>
            <PopoverTrigger className="rounded-xl p-1 px-2 text-[11px] hover:bg-muted transition-colors flex items-center gap-1">
              <Grid3X3 size={14} />
              <span className="capitalize">{currentPage?.template ?? 'blank'}</span>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-3.5">
              <p className="text-xs font-semibold mb-2.5">Template da página</p>
              <ScrollArea className="max-h-[320px] -mr-1 pr-1">
                <div className="grid grid-cols-3 gap-2">
                  {(['blank', 'grid', 'dotted', 'lined', 'cornell', 'daily', 'weekly', 'monthly', 'kanban', 'checklist', 'habit', 'meal', 'finance', 'calendar'] as PageTemplateId[]).map((tpl) => {
                    const isActive = currentPage?.template === tpl
                    return (
                      <button
                        key={tpl}
                        onClick={() => handleChangeTemplate(tpl)}
                        className="group flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <span
                          className={cn(
                            'block w-full overflow-hidden rounded-[5px] transition-all duration-200 aspect-[820/1160]',
                            isActive
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover shadow-md'
                              : 'ring-1 ring-border/60 shadow-sm group-hover:ring-primary/40 group-hover:shadow-md group-hover:-translate-y-0.5',
                          )}
                        >
                          {tpl === 'blank' ? (
                            <span className="block size-full bg-[color:light-dark(#ffffff,#2a2a28)]" />
                          ) : (
                            <TemplateThumbnail template={tpl} width={90} className="block w-full" />
                          )}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium capitalize transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {PAGE_TEMPLATES.find((t) => t.id === tpl)?.name ?? tpl}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
              {/* Textura do papel — presets de caderno. Trocar afeta o
                  caráter táctil da página inteira (aquarela, kraft, etc.). */}
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs font-semibold mb-1.5">Textura do papel</p>
                <div className="flex flex-wrap gap-1.5">
                  {PAPER_TEXTURES.map((tex) => {
                    const active = (data.paperTexture ?? 'plain') === tex.id
                    return (
                      <button
                        key={tex.id}
                        onClick={() => handleSetPaperTexture(tex.id)}
                        title={tex.hint}
                        className={cn(
                          'group relative overflow-hidden rounded-lg border transition-all cursor-pointer',
                          'w-12 h-12 shrink-0',
                          'flex items-end justify-start p-1',
                          active
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border/60 hover:border-foreground/40',
                          PAPER_TEXTURE_CLASS[tex.id],
                        )}
                        style={
                          tex.id === 'plain'
                            ? { backgroundColor: 'var(--paper)' }
                            : undefined
                        }
                      >
                        <span
                          className={cn(
                            'text-[9px] font-medium leading-none',
                            tex.id === 'kraft'
                              ? 'text-white'
                              : 'text-muted-foreground',
                          )}
                        >
                          {tex.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={showInsertMenu} onOpenChange={setShowInsertMenu}>
            <PopoverTrigger className="rounded-xl p-1.5 hover:bg-muted transition-colors">
              <PlusCircle size={16} />
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="flex flex-col gap-0.5">
                {[
                  { label: 'Nota adesiva', icon: StickyNote, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.stickyNotes = [...newData.stickyNotes, {
                      id: uid(), x: 200, y: 200 + Math.random() * 200, text: '', color: '#b76f06',
                    }]
                    commit(newData)
                    toast({ title: 'Nota adesiva adicionada' })
                  } },
                  { label: 'Retângulo', icon: Square, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'rectangle', x: 200, y: 200, width: 120, height: 80, color: '#d1bdb8',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Círculo', icon: Minimize2, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'ellipse', x: 200, y: 200, width: 100, height: 100, color: '#6a634d',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Triângulo', icon: ALargeSmall, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'triangle', x: 200, y: 200, width: 100, height: 100, color: '#6a634d',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Seta', icon: ArrowLeft, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'arrow', x: 200, y: 200, width: 120, height: 60, color: '#b76f06',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Linha', icon: Minus, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'line', x: 200, y: 200, width: 120, height: 2, color: '#1a1a1a',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                    onClick={action}
                  >
                    <Icon size={16} className="text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Import */}
          <Popover open={showImportMenu} onOpenChange={setShowImportMenu}>
            <PopoverTrigger className="rounded-xl p-1.5 hover:bg-muted transition-colors">
              <Upload size={16} />
            </PopoverTrigger>
            <PopoverContent className="w-44">
              <div className="flex flex-col gap-0.5">
                {[
                  { label: 'PNG / JPEG', action: () => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                        newData.stickers = [...newData.stickers, {
                          id: uid(), stickerId: '__custom__', customSvg: reader.result as string,
                          x: 200, y: 200, width: 120, height: 120, rotation: 0,
                        }]
                        commit(newData)
                        toast({ title: 'Imagem importada!' })
                      }
                      reader.readAsDataURL(file)
                    }
                    input.click()
                    setShowImportMenu(false)
                  } },
                  { label: 'SVG', action: () => { setShowImportMenu(false); toast({ title: 'SVG: Em breve!' }) } },
                  { label: 'PDF', action: () => { setShowImportMenu(false); toast({ title: 'PDF: Em breve!' }) } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                    onClick={action}
                  >
                    <FileText size={16} className="text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Export */}
          <Popover open={showExportMenu} onOpenChange={setShowExportMenu}>
            <PopoverTrigger className="rounded-xl p-1.5 hover:bg-muted transition-colors">
              <Download size={16} />
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="flex flex-col gap-0.5">
                {[
                  { label: 'PNG', action: async () => {
                    setShowExportMenu(false)
                    try {
                      const svgEl = canvasRef.current?.querySelector('svg') as SVGSVGElement
                      const bgCanvas = bgCanvasRef.current
                      if (!svgEl || !bgCanvas) return
                      const exportCanvas = document.createElement('canvas')
                      exportCanvas.width = PAGE_WIDTH
                      exportCanvas.height = PAGE_HEIGHT
                      const ctx = exportCanvas.getContext('2d')
                      if (!ctx) return
                      ctx.drawImage(bgCanvas, 0, 0)
                      const svgData = new XMLSerializer().serializeToString(svgEl)
                      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const img = new window.Image()
                      img.onload = () => {
                        ctx.drawImage(img, 0, 0)
                        URL.revokeObjectURL(url)
                        exportCanvas.toBlob((pngBlob) => {
                          if (!pngBlob) return
                          const downloadUrl = URL.createObjectURL(pngBlob)
                          const a = document.createElement('a')
                          a.href = downloadUrl
                          a.download = `${planner.name}-p${currentPageIdx + 1}.png`
                          a.click()
                          URL.revokeObjectURL(downloadUrl)
                          toast({ title: 'Exportado como PNG!' })
                        }, 'image/png')
                      }
                      img.src = url
                    } catch {
                      toast({ title: 'Erro ao exportar PNG', variant: 'error' })
                    }
                  } },
                  { label: 'PDF', action: () => { setShowExportMenu(false); toast({ title: 'PDF: Em breve!' }) } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                    onClick={action}
                  >
                    <Download size={16} className="text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Zoom controls */}
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => editor.zoomOut()}>
            <Minus size={14} />
          </Button>
          <span className="text-[11px] text-muted-foreground w-8 text-center">{Math.round(editor.zoom * 100)}%</span>
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => editor.zoomIn()}>
            <Plus size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => editor.fitToScreen()}>
            <Maximize2 size={14} />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Page nav */}
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => goToPage(currentPageIdx - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => goToPage(currentPageIdx + 1)}>
            <ChevronRight size={16} />
          </Button>

          {/* Undo / Redo */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={handleUndo}
            disabled={!(currentPage && (editor.undoStack[currentPage.id]?.length ?? 0) > 0)}
          >
            <Undo2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={handleRedo}
            disabled={!(currentPage && (editor.redoStack[currentPage.id]?.length ?? 0) > 0)}
          >
            <Redo2 size={16} />
          </Button>
        </div>

        {/* Mobile actions menu */}
        <Popover open={showMobileTopMenu} onOpenChange={setShowMobileTopMenu}>
          <PopoverTrigger className="md:hidden rounded-xl p-1.5 hover:bg-muted transition-colors shrink-0">
            <MoreVertical size={18} />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="flex flex-col gap-0.5">
              {/* Page rename */}
              <div className="px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-1">Nome da página</p>
                <input
                  value={currentPage?.title ?? ''}
                  onChange={(e) => {
                    if (!currentPage) return
                    useAppStore.getState().updatePlanner(planner.id, {
                      pages: pages.map((p) => (p.id === currentPage.id ? { ...p, title: e.target.value } : p)),
                    })
                  }}
                  className="w-full text-xs bg-muted rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="h-px bg-border/40 my-1" />
              {/* Duplicate page */}
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={() => {
                  setShowMobileTopMenu(false)
                  if (!currentPage) return
                  const newPage: PlannerPage = {
                    id: `pg-${uid()}`,
                    title: `${currentPage.title} (cópia)`,
                    template: currentPage.template,
                    data: JSON.parse(JSON.stringify(currentPage.data)),
                  }
                  useAppStore.getState().updatePlanner(planner.id, {
                    pages: [...pages.slice(0, currentPageIdx + 1), newPage, ...pages.slice(currentPageIdx + 1)],
                  })
                  toast({ title: 'Página duplicada' })
                }}
              >
                <Copy size={16} className="text-muted-foreground" />
                Duplicar página
              </button>
              {/* Template */}
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={() => {
                  setShowMobileTopMenu(false)
                  setShowTemplateSheet(true)
                }}
              >
                <Grid3X3 size={16} className="text-muted-foreground" />
                Template: <span className="capitalize">{currentPage?.template ?? 'blank'}</span>
              </button>
              <div className="h-px bg-border/40 my-1" />
              {/* Insert */}
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={() => {
                  setShowMobileTopMenu(false)
                  setShowInsertMenu(true)
                }}
              >
                <PlusCircle size={16} className="text-muted-foreground" />
                Inserir forma / nota
              </button>
              {/* Import */}
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={() => {
                  setShowMobileTopMenu(false)
                  setShowImportMenu(true)
                }}
              >
                <Upload size={16} className="text-muted-foreground" />
                Importar imagem
              </button>
              {/* Export */}
              <button
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left cursor-pointer"
                onClick={() => {
                  setShowMobileTopMenu(false)
                  setShowExportMenu(true)
                }}
              >
                <Download size={16} className="text-muted-foreground" />
                Exportar
              </button>
              <div className="h-px bg-border/40 my-1" />
              {/* Zoom */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm">Zoom</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={() => editor.zoomOut()}>
                    <Minus size={12} />
                  </Button>
                  <span className="text-[11px] text-muted-foreground w-8 text-center">{Math.round(editor.zoom * 100)}%</span>
                  <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={() => editor.zoomIn()}>
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
              {/* Page nav */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm">Páginas</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={() => goToPage(currentPageIdx - 1)}>
                    <ChevronLeft size={12} />
                  </Button>
                  <span className="text-[11px] text-muted-foreground w-10 text-center">{currentPageIdx + 1} / {pages.length}</span>
                  <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={() => goToPage(currentPageIdx + 1)}>
                    <ChevronRight size={12} />
                  </Button>
                </div>
              </div>
              {/* Undo / Redo */}
              <div className="flex items-center gap-1 px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => { setShowMobileTopMenu(false); handleUndo() }}
                  disabled={!(currentPage && (editor.undoStack[currentPage.id]?.length ?? 0) > 0)}
                >
                  <Undo2 size={14} className="mr-1.5" /> Desfazer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => { setShowMobileTopMenu(false); handleRedo() }}
                  disabled={!(currentPage && (editor.redoStack[currentPage.id]?.length ?? 0) > 0)}
                >
                  <Redo2 size={14} className="mr-1.5" /> Refazer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Layers toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl shrink-0"
          onClick={() => setShowPagesPanel(!showPagesPanel)}
        >
          <Layers size={16} />
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Toolbar dock (desktop only) */}
        <div className="hidden md:flex w-12 shrink-0 flex-col items-center gap-1 py-3 border-r border-border/40 bg-background/60">
          {toolbarItems().map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger
                className={cn(
                  'size-9 rounded-xl transition-all inline-flex items-center justify-center',
                  activeTool === tool.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  setTool(tool.id)
                  if (tool.id === 'sticker') setShowStickerPanel(true)
                }}
              >
                <tool.icon size={16} />
              </TooltipTrigger>
              <TooltipContent>{tool.label} ({tool.shortcut})</TooltipContent>
            </Tooltip>
          ))}
          {/* OCR button */}
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'size-9 rounded-xl transition-all inline-flex items-center justify-center',
                'hover:bg-muted text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setShowOcrPanel(true)}
            >
              <ScanText size={16} />
            </TooltipTrigger>
            <TooltipContent>OCR — Reconhecer escrita</TooltipContent>
          </Tooltip>
          <div className="mt-auto">
            {!isMobile && <ToolSettings triggerFromRadial={showToolSettingsFromRadial} setShowToolSettingsFromRadial={setShowToolSettingsFromRadial} />}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden desk-bg" ref={canvasContainerRef}>
          {/* Eraser cursor (fixed position, updated imperatively) */}
          {activeTool === 'eraser' && (
            <div
              ref={eraserCursorRef}
              className="fixed z-50 pointer-events-none rounded-full border-2 border-dashed border-foreground/60 bg-foreground/5 opacity-0 transition-opacity"
              style={{
                width: editor.eraserSize * 2 * displayScale,
                height: editor.eraserSize * 2 * displayScale,
              }}
            />
          )}

          {showPagesPanel && (
            <div className="absolute left-3 top-3 bottom-3 z-20 w-52 glass rounded-3xl border border-border/40 shadow-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Páginas</h3>
                <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={handleAddPage}>
                  <Plus size={14} />
                </Button>
              </div>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {pages.map((page, i) => (
                    <div
                      key={page.id}
                      onClick={() => { setCurrentPageIdx(i); setShowPagesPanel(false) }}
                      className={cn(
                        'flex items-center gap-2 rounded-xl p-2 cursor-pointer transition-colors group',
                        i === currentPageIdx ? 'bg-primary/15 ring-1 ring-primary/30' : 'hover:bg-muted/60',
                      )}
                    >
                      <div className="w-14 h-20 relative rounded-lg bg-muted border border-border/30 overflow-hidden flex-shrink-0">
                        {page.template === 'blank' ? (
                          <div className="absolute inset-0 bg-[color:light-dark(#ffffff,#2a2a28)]" />
                        ) : (
                          <TemplateThumbnail template={page.template} width={56} className="absolute inset-0 w-full h-full" />
                        )}
                        {/* Stroke preview */}
                        <svg
                          viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
                          className="absolute inset-0 size-full"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          {page.data.strokes.map((s) => (
                            <polyline
                              key={s.id}
                              points={s.points.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill="none"
                              stroke={s.color}
                              strokeWidth={Math.max(2, s.size)}
                              opacity={s.opacity}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          {page.data.shapes.map((s) => (
                            <rect
                              key={s.id}
                              x={s.x}
                              y={s.y}
                              width={s.width}
                              height={s.height}
                              fill={s.color}
                              opacity={0.8}
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{page.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{page.template}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); handleDeletePageAt(i) }}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="absolute inset-0 overflow-auto scrollbar-thin">
            <div className="min-w-full min-h-full flex items-center justify-center p-4 md:p-12">
              <div
                className="relative shrink-0"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(${editor.panX}px, ${editor.panY}px)`,
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[10px] rotate-[1.2deg] translate-x-2.5 translate-y-3 shadow-paper-sheet"
                  style={{ backgroundColor: isDark ? '#211f1a' : '#ddd6c6' }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[10px] rotate-[-0.8deg] -translate-x-2 translate-y-1.5 shadow-paper-sheet"
                  style={{ backgroundColor: isDark ? '#29261f' : '#eee8dc' }}
                />

                <div
                  ref={canvasRef}
                  className={cn(
                    'relative overflow-hidden rounded-[6px] shadow-paper ring-1 ring-black/[0.07] dark:ring-white/[0.08] bg-[color:light-dark(#ffffff,#2a2a28)]',
                    PAPER_TEXTURE_CLASS[data.paperTexture ?? 'plain'],
                  )}
                  style={{
                    width: '100%',
                    height: '100%',
                    touchAction: 'none',
                    backgroundColor: data.bgColor ?? undefined,
                    cursor:
                      activeTool === 'eraser' ? 'none' :
                      activeTool === 'text' ? 'text' :
                      activeTool === 'pan' || activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') :
                      activeTool === 'eyedropper' ? 'crosshair' :
                      activeTool === 'fill' ? 'cell' :
                      activeTool === 'sticker' ? 'move' :
                      activeTool === 'lasso' ? 'crosshair' :
                      (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line' || activeTool === 'arrow') ? 'crosshair' :
                      'crosshair',
                  }}
                  onContextMenu={handleContextMenu}
                  onPointerDown={(e) => {
                    handlePointerDown(e)
                    if (pointerInCanvasTimerRef.current) clearTimeout(pointerInCanvasTimerRef.current)
                    setPointerInCanvas(true)
                  }}
                  onPointerMove={(e) => {
                    handlePointerMove(e)
                    if (activeTool === 'eraser' && eraserCursorRef.current) {
                      const el = eraserCursorRef.current
                      el.style.opacity = '1'
                      el.style.display = 'block'
                      el.style.left = `${e.clientX - el.offsetWidth / 2}px`
                      el.style.top = `${e.clientY - el.offsetHeight / 2}px`
                    }
                  }}
                  onPointerUp={(e) => {
                    handlePointerUp(e)
                    if (pointerInCanvasTimerRef.current) clearTimeout(pointerInCanvasTimerRef.current)
                    pointerInCanvasTimerRef.current = setTimeout(() => setPointerInCanvas(false), 600)
                  }}
                  onPointerCancel={(e) => {
                    handlePointerCancel(e)
                    if (pointerInCanvasTimerRef.current) clearTimeout(pointerInCanvasTimerRef.current)
                    pointerInCanvasTimerRef.current = setTimeout(() => setPointerInCanvas(false), 400)
                  }}
                  onPointerLeave={(e) => {
                    handlePointerCancel(e)
                    if (eraserCursorRef.current) eraserCursorRef.current.style.opacity = '0'
                    if (pointerInCanvasTimerRef.current) clearTimeout(pointerInCanvasTimerRef.current)
                    pointerInCanvasTimerRef.current = setTimeout(() => setPointerInCanvas(false), 400)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const stickerId = e.dataTransfer.getData('stickerId')
                    if (!stickerId) return
                    const coords = getPageCoords(e as unknown as React.PointerEvent)
                    placeSticker(stickerId, coords.x - 40, coords.y - 40)
                    toast({ title: 'Sticker adicionado!' })
                  }}
                  onDoubleClick={handleDoubleClick}
                >
                  <canvas
                    ref={bgCanvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Strokes + preview */}
                    {renderStrokes()}
                    {renderRulerPreview()}
                    {renderLassoPreview()}
                    {renderShapeDraft()}
                    {renderGuides()}

                    {/* Shapes */}
                    {data.shapes.map((shape) => <ShapeRenderer key={shape.id} shape={shape} />)}

                    {/* Stickers (non-lottie) */}
                    {data.stickers
                      .filter((s) => {
                        const def = ALL_STICKERS.find((st) => st.id === s.stickerId)
                        return def && !def.lottieUrl
                      })
                      .map((s) => {
                        const def = ALL_STICKERS.find((st) => st.id === s.stickerId)
                        if (!def) return null
                        return (
                          <image
                            key={s.id}
                            href={s.customSvg ?? stickerToDataUrl(def)}
                            x={s.x}
                            y={s.y}
                            width={s.width}
                            height={s.height}
                            transform={`rotate(${s.rotation}, ${s.x + s.width / 2}, ${s.y + s.height / 2})`}
                            opacity={(s.opacity ?? 1) * (s.locked ? 0.7 : 1)}
                          />
                        )
                      })}

                    {/* Texts */}
                    {data.texts.map((t) => (
                      <text
                        key={t.id}
                        x={t.x}
                        y={t.y + t.fontSize}
                        fill={t.color}
                        fontSize={t.fontSize}
                        fontFamily={
                          t.fontFamily === 'hand' ? 'var(--font-hand)' :
                          t.fontFamily === 'serif' ? 'var(--font-serif)' :
                          'var(--font-sans)'
                        }
                        opacity={(t.opacity ?? 1) * (t.locked ? 0.7 : 1)}
                        transform={t.rotation ? `rotate(${t.rotation}, ${t.x}, ${t.y})` : undefined}
                        style={{ pointerEvents: 'auto' }}
                        onDoubleClick={() => {
                          setTextInput({ x: t.x, y: t.y, show: true, editingId: t.id })
                          setTextValue(t.text)
                        }}
                      >
                        {t.text}
                      </text>
                    ))}
                  </svg>

                  {/* Lottie stickers (HTML overlay) */}
                  {data.stickers
                    .filter((s) => {
                      const def = ALL_STICKERS.find((st) => st.id === s.stickerId)
                      return def && def.lottieUrl
                    })
                    .map((s) => {
                      const def = ALL_STICKERS.find((st) => st.id === s.stickerId)
                      if (!def?.lottieUrl) return null
                      return (
                        <div
                          key={s.id}
                          className="absolute"
                          style={{
                            left: s.x * displayScale,
                            top: s.y * displayScale,
                            width: s.width * displayScale,
                            height: s.height * displayScale,
                            transform: `rotate(${s.rotation}deg)`,
                            transformOrigin: 'center center',
                            opacity: s.locked ? 0.7 : 1,
                            pointerEvents: 'none',
                          }}
                        >
                          <LottiePlayer src={def.lottieUrl} style={{ width: '100%', height: '100%' }} loop autoplay />
                        </div>
                      )
                    })}

                  {/* Sticky notes (HTML overlay) */}
                  {data.stickyNotes.map((n) => {
                    const noteW = (n.width ?? 120) * displayScale
                    const noteH = (n.height ?? 120) * displayScale
                    return (
                      <div
                        key={n.id}
                        className="absolute pointer-events-none select-none"
                        style={{
                          left: n.x * displayScale,
                          top: n.y * displayScale,
                          width: noteW,
                          height: noteH,
                          transform: n.rotation ? `rotate(${n.rotation}deg)` : undefined,
                          transformOrigin: 'center center',
                          opacity: (n.opacity ?? 1) * (n.locked ? 0.7 : 1),
                        }}
                        onDoubleClick={() => setEditingNoteId(n.id)}
                      >
                        <div
                          className="relative size-full rounded-[3px] shadow-[0_6px_16px_rgba(0,0,0,0.18)] p-[8%] overflow-hidden"
                          style={{ background: `linear-gradient(160deg, ${n.color}, ${n.color}dd)` }}
                        >
                          {!editingNoteId && !n.text && (
                            <p className="text-[13px] leading-snug italic opacity-40" style={{ fontFamily: 'var(--font-hand)', fontSize: 15 * displayScale }}>
                              Duplo clique para editar
                            </p>
                          )}
                          <p
                            className="whitespace-pre-wrap break-words leading-snug"
                            style={{ fontFamily: 'var(--font-hand)', fontSize: 15 * displayScale, color: 'rgba(0,0,0,0.72)' }}
                          >
                            {n.text}
                          </p>
                          {/* Folded corner */}
                          <div className="absolute bottom-0 right-0 size-[18%] bg-black/10" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                        </div>
                      </div>
                    )
                  })}

                  {/* Text input overlay (desktop inline) */}
                  {textInput?.show && !isMobile && (
                    <input
                      ref={(el) => { el?.focus() }}
                      autoFocus
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey) && textValue.trim()) {
                          commitTextInput()
                        }
                        if (e.key === 'Escape') {
                          setTextValue('')
                          setTextInput(null)
                        }
                      }}
                      onBlur={commitTextInput}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute z-10 bg-transparent border-b-2 border-primary text-foreground outline-none min-w-20"
                      style={{
                        left: textInput.x * displayScale,
                        top: textInput.y * displayScale,
                        fontFamily:
                          editor.textFontFamily === 'hand' ? 'var(--font-hand)' :
                          editor.textFontFamily === 'serif' ? 'var(--font-serif)' :
                          'var(--font-sans)',
                        fontSize: editor.textFontSize * displayScale,
                        color: editor.textColor,
                      }}
                    />
                  )}

                  {/* Note editing overlay */}
                  {editingNoteId && (() => {
                    const editingNote = data.stickyNotes.find(n => n.id === editingNoteId)
                    if (!editingNote) return null
                    const noteW = (editingNote.width ?? 120) * displayScale
                    const noteH = (editingNote.height ?? 120) * displayScale
                    return (
                      <div
                        className="absolute z-20 pointer-events-auto"
                        style={{
                          left: editingNote.x * displayScale,
                          top: editingNote.y * displayScale,
                          width: noteW,
                          height: noteH,
                          transform: editingNote.rotation ? `rotate(${editingNote.rotation}deg)` : undefined,
                          transformOrigin: 'center center',
                        }}
                      >
                        <textarea
                          autoFocus
                          defaultValue={editingNote.text}
                          onBlur={(e) => {
                            if (!noteEditCancelRef.current) {
                              const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                              newData.stickyNotes = newData.stickyNotes.map((n) =>
                                n.id === editingNoteId ? { ...n, text: e.target.value } : n,
                              )
                              commit(newData)
                            }
                            noteEditCancelRef.current = false
                            setEditingNoteId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              noteEditCancelRef.current = true
                              ;(e.target as HTMLTextAreaElement).blur()
                            }
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              ;(e.target as HTMLTextAreaElement).blur()
                            }
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="w-full h-full bg-transparent border-none outline-none resize-none p-2"
                          style={{
                            fontFamily: 'var(--font-hand)',
                            fontSize: 15 * displayScale,
                            color: 'rgba(0,0,0,0.72)',
                            lineHeight: 1.4,
                          }}
                        />
                      </div>
                    )
                  })()}

                  {/* Selection overlay (Canva-level) */}
                  {selectedItems.length > 0 && (() => {
                    const bounds = getSelectionBounds()
                    if (!bounds) return null
                    const primaryRef = selectedItems[0]
                    const primaryItem = primaryRef.kind === 'sticker' ? data.stickers.find(s => s.id === primaryRef.id)
                      : primaryRef.kind === 'shape' ? data.shapes.find(s => s.id === primaryRef.id)
                      : primaryRef.kind === 'note' ? data.stickyNotes.find(n => n.id === primaryRef.id)
                      : data.texts.find(t => t.id === primaryRef.id)
                    const primaryLocked = primaryItem?.locked ?? false
                    const multiSelect = selectedItems.length > 1

                    // ─── Ações em lote ou singulares ───
                    const deleteSelected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      const ids = selectedItems
                      newData.stickers = newData.stickers.filter(s => !ids.some(i => i.kind === 'sticker' && i.id === s.id))
                      newData.shapes = newData.shapes.filter(s => !ids.some(i => i.kind === 'shape' && i.id === s.id))
                      newData.stickyNotes = newData.stickyNotes.filter(n => !ids.some(i => i.kind === 'note' && i.id === n.id))
                      newData.texts = newData.texts.filter(t => !ids.some(i => i.kind === 'text' && i.id === t.id))
                      commit(newData)
                      clearSelection()
                    }

                    const duplicateSelected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      const OFFSET = 20
                      for (const ref of selectedItems) {
                        if (ref.kind === 'sticker') {
                          const orig = newData.stickers.find(s => s.id === ref.id)
                          if (orig) newData.stickers.push({ ...orig, id: uid(), x: orig.x + OFFSET, y: orig.y + OFFSET })
                        } else if (ref.kind === 'shape') {
                          const orig = newData.shapes.find(s => s.id === ref.id)
                          if (orig) newData.shapes.push({ ...orig, id: uid(), x: orig.x + OFFSET, y: orig.y + OFFSET })
                        } else if (ref.kind === 'note') {
                          const orig = newData.stickyNotes.find(n => n.id === ref.id)
                          if (orig) newData.stickyNotes.push({ ...orig, id: uid(), x: orig.x + OFFSET, y: orig.y + OFFSET })
                        } else if (ref.kind === 'text') {
                          const orig = newData.texts.find(t => t.id === ref.id)
                          if (orig) newData.texts.push({ ...orig, id: uid(), x: orig.x + OFFSET, y: orig.y + OFFSET })
                        }
                      }
                      commit(newData)
                      toast({ title: `${selectedItems.length} item(s) duplicados` })
                    }

                    const toggleLockSelected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      const newLocked = !primaryLocked
                      for (const ref of selectedItems) {
                        if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, locked: newLocked } : s)
                        else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, locked: newLocked } : s)
                        else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, locked: newLocked } : n)
                        else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, locked: newLocked } : t)
                      }
                      commit(newData)
                      toast({ title: newLocked ? 'Bloqueado' : 'Desbloqueado' })
                    }

                    const bringToFrontSelected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      for (const ref of selectedItems) {
                        if (ref.kind === 'sticker') {
                          const idx = newData.stickers.findIndex(s => s.id === ref.id)
                          if (idx >= 0) { const [it] = newData.stickers.splice(idx, 1); newData.stickers.push(it) }
                        } else if (ref.kind === 'shape') {
                          const idx = newData.shapes.findIndex(s => s.id === ref.id)
                          if (idx >= 0) { const [it] = newData.shapes.splice(idx, 1); newData.shapes.push(it) }
                        } else if (ref.kind === 'note') {
                          const idx = newData.stickyNotes.findIndex(n => n.id === ref.id)
                          if (idx >= 0) { const [it] = newData.stickyNotes.splice(idx, 1); newData.stickyNotes.push(it) }
                        } else if (ref.kind === 'text') {
                          const idx = newData.texts.findIndex(t => t.id === ref.id)
                          if (idx >= 0) { const [it] = newData.texts.splice(idx, 1); newData.texts.push(it) }
                        }
                      }
                      commit(newData)
                    }

                    const sendToBackSelected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      for (const ref of [...selectedItems].reverse()) {
                        if (ref.kind === 'sticker') {
                          const idx = newData.stickers.findIndex(s => s.id === ref.id)
                          if (idx >= 0) { const [it] = newData.stickers.splice(idx, 1); newData.stickers.unshift(it) }
                        } else if (ref.kind === 'shape') {
                          const idx = newData.shapes.findIndex(s => s.id === ref.id)
                          if (idx >= 0) { const [it] = newData.shapes.splice(idx, 1); newData.shapes.unshift(it) }
                        } else if (ref.kind === 'note') {
                          const idx = newData.stickyNotes.findIndex(n => n.id === ref.id)
                          if (idx >= 0) { const [it] = newData.stickyNotes.splice(idx, 1); newData.stickyNotes.unshift(it) }
                        } else if (ref.kind === 'text') {
                          const idx = newData.texts.findIndex(t => t.id === ref.id)
                          if (idx >= 0) { const [it] = newData.texts.splice(idx, 1); newData.texts.unshift(it) }
                        }
                      }
                      commit(newData)
                    }

                    const rotate90Selected = () => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      for (const ref of selectedItems) {
                        if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, rotation: ((s.rotation + 90) % 360 + 360) % 360 } : s)
                        else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, rotation: (((s.rotation ?? 0) + 90) % 360 + 360) % 360 } : s)
                        else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, rotation: (((n.rotation ?? 0) + 90) % 360 + 360) % 360 } : n)
                        else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, rotation: (((t.rotation ?? 0) + 90) % 360 + 360) % 360 } : t)
                      }
                      commit(newData)
                    }

                    const alignSelected = (mode: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
                      if (selectedItems.length < 2) return
                      const b = getSelectionBounds()
                      if (!b) return
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      for (const ref of selectedItems) {
                        const ib = getItemBounds(ref)
                        if (!ib) continue
                        let newX = ib.x
                        let newY = ib.y
                        if (mode === 'left') newX = b.x
                        else if (mode === 'centerH') newX = b.x + (b.width - ib.width) / 2
                        else if (mode === 'right') newX = b.x + b.width - ib.width
                        else if (mode === 'top') newY = b.y
                        else if (mode === 'centerV') newY = b.y + (b.height - ib.height) / 2
                        else if (mode === 'bottom') newY = b.y + b.height - ib.height

                        if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, x: newX, y: newY } : s)
                        else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, x: newX, y: newY } : s)
                        else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, x: newX, y: newY } : n)
                        else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, x: newX, y: newY } : t)
                      }
                      commit(newData)
                      toast({ title: 'Alinhado!' })
                    }

                    const distributeSelected = (axis: 'horizontal' | 'vertical') => {
                      if (selectedItems.length < 3) {
                        toast({ title: 'Distribuir requer 3+ itens' })
                        return
                      }
                      const itemsWithBounds = selectedItems
                        .map(ref => ({ ref, bounds: getItemBounds(ref) }))
                        .filter((x): x is { ref: CanvasItemRef; bounds: NonNullable<ReturnType<typeof getItemBounds>> } => x.bounds !== null)
                        .sort((a, b) => axis === 'horizontal' ? a.bounds.x - b.bounds.x : a.bounds.y - b.bounds.y)

                      if (itemsWithBounds.length < 3) return

                      const b = getSelectionBounds()
                      if (!b) return
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      const totalSpan = axis === 'horizontal' ? b.width : b.height
                      const totalItemSize = itemsWithBounds.reduce((sum, ib) => sum + (axis === 'horizontal' ? ib.bounds.width : ib.bounds.height), 0)
                      const gap = (totalSpan - totalItemSize) / (itemsWithBounds.length - 1)

                      let cursor = axis === 'horizontal' ? b.x : b.y
                      for (const { ref, bounds: ib } of itemsWithBounds) {
                        const newX = axis === 'horizontal' ? cursor : ib.x
                        const newY = axis === 'vertical' ? cursor : ib.y
                        cursor += (axis === 'horizontal' ? ib.width : ib.height) + gap

                        if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, x: newX, y: newY } : s)
                        else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, x: newX, y: newY } : s)
                        else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, x: newX, y: newY } : n)
                        else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, x: newX, y: newY } : t)
                      }
                      commit(newData)
                      toast({ title: 'Distribuído!' })
                    }

                    const setOpacitySelected = (opacity: number) => {
                      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                      for (const ref of selectedItems) {
                        if (ref.kind === 'sticker') newData.stickers = newData.stickers.map(s => s.id === ref.id ? { ...s, opacity } : s)
                        else if (ref.kind === 'shape') newData.shapes = newData.shapes.map(s => s.id === ref.id ? { ...s, opacity } : s)
                        else if (ref.kind === 'note') newData.stickyNotes = newData.stickyNotes.map(n => n.id === ref.id ? { ...n, opacity } : n)
                        else if (ref.kind === 'text') newData.texts = newData.texts.map(t => t.id === ref.id ? { ...t, opacity } : t)
                      }
                      commit(newData)
                    }

                    const primaryOpacity = (primaryItem && 'opacity' in primaryItem && typeof primaryItem.opacity === 'number') ? primaryItem.opacity : 1

                    return (
                      <SelectionOverlay
                        bounds={bounds}
                        displayScale={displayScale}
                        items={selectedItems}
                        multiSelect={multiSelect}
                        primaryLocked={primaryLocked}
                        primaryOpacity={primaryOpacity}
                        onStartResize={(handle, e) => {
                          const pt = getPageCoords(e)
                          beginResize(selectedItems, handle, pt)
                        }}
                        onStartRotate={(e) => {
                          const pt = getPageCoords(e)
                          beginRotate(selectedItems, pt)
                        }}
                        onDelete={deleteSelected}
                        onDuplicate={duplicateSelected}
                        onToggleLock={toggleLockSelected}
                        onBringToFront={bringToFrontSelected}
                        onSendToBack={sendToBackSelected}
                        onRotate90={rotate90Selected}
                        onAlignLeft={() => alignSelected('left')}
                        onAlignCenterH={() => alignSelected('centerH')}
                        onAlignRight={() => alignSelected('right')}
                        onAlignTop={() => alignSelected('top')}
                        onAlignCenterV={() => alignSelected('centerV')}
                        onAlignBottom={() => alignSelected('bottom')}
                        onDistributeH={() => distributeSelected('horizontal')}
                        onDistributeV={() => distributeSelected('vertical')}
                        onOpacityChange={setOpacitySelected}
                        onClose={clearSelection}
                      />
                    )
                  })()}
                  <div className="absolute inset-0 pointer-events-none paper-grain opacity-[0.05] mix-blend-overlay z-10" data-paper-grain />
                  {/* Indicador de lado do caderno (esq/dir) — sutil, como
                      a numeração/curva de costura interna da página. */}
                  {(() => {
                    const isRight = currentPageIdx % 2 === 1
                    return (
                      <div
                        className={cn(
                          'absolute z-20 pointer-events-none select-none top-2.5',
                          isRight ? 'right-3' : 'left-3',
                        )}
                        aria-hidden
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-8 w-px rounded-full bg-gradient-to-b from-border/70 via-border/30 to-transparent"
                          />
                          <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/55 leading-none pt-1">
                            {isRight ? 'Dir' : 'Esq'}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel: Stickers (desktop) / BottomSheet (mobile) */}
        <BottomSheet
          open={showStickerPanel}
          onClose={() => {
            setShowStickerPanel(false)
            if (activeTool === 'sticker') setTool('pen')
          }}
          title="Stickers"
          maxHeight="75vh"
        >
          <div className="w-full md:w-[300px] p-4 h-full flex flex-col overflow-hidden">
            <Input
              placeholder="Buscar stickers..."
              value={stickerSearch}
              onChange={(e) => setStickerSearch(e.target.value)}
            />
            <div className="flex gap-1.5 my-3 overflow-auto no-scrollbar">
              {[{ id: 'all', label: 'Todos' }, { id: 'favorites', label: '★ Favoritos' }, ...STICKER_CATEGORIES.map((c) => ({ id: c, label: c }))].map(
                (c) => (
                  <button
                    key={c.id}
                    onClick={() => setStickerCat(c.id)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                      stickerCat === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {c.label}
                  </button>
                ),
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
                {stickers.map((st) => (
                  <button
                    key={st.id}
                    className={cn(
                      'aspect-square rounded-xl border border-border/40 p-2 hover:border-primary/30 hover:bg-muted/40 transition-all flex items-center justify-center cursor-pointer active:scale-95',
                      favoriteStickers.has(st.id) && 'border-warning/40',
                    )}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('stickerId', st.id)
                    }}
                    onClick={() => {
                      placeSticker(st.id, 200, 200)
                      toast({ title: 'Sticker adicionado!' })
                    }}
                    onDoubleClick={() => {
                      setFavoriteStickers((prev) => {
                        const next = new Set(prev)
                        if (next.has(st.id)) next.delete(st.id)
                        else next.add(st.id)
                        return next
                      })
                    }}
                  >
                    {st.lottieUrl && st.previewSvg ? (
                      <img
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(st.previewSvg)}`}
                        alt={st.name}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <img
                        src={stickerToDataUrl(st)}
                        alt={st.name}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-3" />
            <p className="text-[10px] text-muted-foreground text-center">
              Clique para adicionar &bull; Duplo clique para favoritar &bull; Arraste para o canvas
            </p>
          </div>
        </BottomSheet>

        {/* Context Menu */}
        <ContextMenu
          x={ctxMenu?.x ?? 0}
          y={ctxMenu?.y ?? 0}
          open={!!ctxMenu}
          label={ctxLabel}
          actions={buildCtxMenuActions()}
          onClose={() => setCtxMenu(null)}
        />

        {/* Mobile template sheet */}
        <BottomSheet
          open={showTemplateSheet}
          onClose={() => setShowTemplateSheet(false)}
          title="Template da página"
          maxHeight="70vh"
          desktopSidePanel={false}
        >
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {(['blank', 'grid', 'dotted', 'lined', 'cornell', 'daily', 'weekly', 'monthly', 'kanban', 'checklist', 'habit', 'meal', 'finance', 'calendar'] as PageTemplateId[]).map((tpl) => {
                const isActive = currentPage?.template === tpl
                return (
                  <button
                    key={tpl}
                    onClick={() => {
                      handleChangeTemplate(tpl)
                      setShowTemplateSheet(false)
                    }}
                    className="group flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={cn(
                        'block w-full overflow-hidden rounded-lg transition-all duration-200 aspect-[820/1160]',
                        isActive
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover shadow-md'
                          : 'ring-1 ring-border/60 shadow-sm group-active:ring-primary/40',
                      )}
                    >
                      {tpl === 'blank' ? (
                        <span className="block size-full bg-[color:light-dark(#ffffff,#2a2a28)]" />
                      ) : (
                        <TemplateThumbnail template={tpl} width={90} className="block w-full" />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium capitalize transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {PAGE_TEMPLATES.find((t) => t.id === tpl)?.name ?? tpl}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-border/40">
              <p className="text-xs font-semibold mb-2">Textura do papel</p>
              <div className="flex flex-wrap gap-2">
                {PAPER_TEXTURES.map((tex) => {
                  const active = (data.paperTexture ?? 'plain') === tex.id
                  return (
                    <button
                      key={tex.id}
                      onClick={() => handleSetPaperTexture(tex.id)}
                      title={tex.hint}
                      className={cn(
                        'group relative overflow-hidden rounded-xl border transition-all cursor-pointer',
                        'w-14 h-14 shrink-0',
                        'flex items-end justify-start p-1.5',
                        active
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border/60 active:ring-primary/40',
                        PAPER_TEXTURE_CLASS[tex.id],
                      )}
                      style={
                        tex.id === 'plain'
                          ? { backgroundColor: 'var(--paper)' }
                          : undefined
                      }
                    >
                      <span
                        className={cn(
                          'text-[9px] font-medium leading-none',
                          tex.id === 'kraft'
                            ? 'text-white'
                            : 'text-muted-foreground',
                        )}
                      >
                        {tex.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* Mobile text editor sheet */}
        <BottomSheet
          open={!!(textInput?.show && isMobile)}
          onClose={() => {
            setTextValue('')
            setTextInput(null)
          }}
          title={textInput?.editingId ? 'Editar texto' : 'Novo texto'}
          maxHeight="60vh"
          desktopSidePanel={false}
        >
          <div className="p-4 space-y-4">
            <textarea
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Digite seu texto..."
              className="w-full min-h-[120px] rounded-xl border border-border bg-background p-3 text-foreground outline-none focus:border-primary resize-none"
              style={{
                fontFamily:
                  editor.textFontFamily === 'hand' ? 'var(--font-hand)' :
                  editor.textFontFamily === 'serif' ? 'var(--font-serif)' :
                  'var(--font-sans)',
                fontSize: editor.textFontSize,
                color: editor.textColor,
              }}
            />
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">Cor</p>
                <ColorPalette
                  color={editor.textColor}
                  recent={editor.lastColors}
                  onPick={(c) => { editor.setTextColor(c); editor.pushLastColor(c) }}
                  onEyedropper={() => {
                    setTool('eyedropper')
                    setTextInput(null)
                  }}
                  onClearRecent={() => editor.clearLastColors()}
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Tamanho: <span className="font-bold text-foreground">{editor.textFontSize}px</span>
                </p>
                <input
                  type="range"
                  min={10}
                  max={48}
                  step={1}
                  value={editor.textFontSize}
                  onChange={(e) => editor.setTextFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">Fonte</p>
                <div className="flex gap-2">
                  {(['sans', 'serif', 'hand'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => editor.setTextFontFamily(f)}
                      className={cn(
                        'flex-1 rounded-xl py-2 text-xs transition-colors cursor-pointer',
                        editor.textFontFamily === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70',
                      )}
                    >
                      {f === 'hand' ? 'Mão' : f === 'serif' ? 'Serif' : 'Sans'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setTextValue('')
                  setTextInput(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={!textValue.trim()}
                onClick={commitTextInput}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </BottomSheet>

        {/* Radial menu (mobile tool selector) */}
        <RadialMenu
          open={radialMenuOpen}
          items={
            [
              { id: 'pen', label: 'Caneta', icon: Pen, active: activeTool === 'pen' },
              { id: 'pencil', label: 'Lápis', icon: Pencil, active: activeTool === 'pencil' },
              { id: 'brush', label: 'Pincel', icon: Paintbrush, active: activeTool === 'brush' },
              { id: 'highlighter', label: 'Marca-texto', icon: Highlighter, active: activeTool === 'highlighter' },
              { id: 'eraser', label: 'Borracha', icon: Eraser, active: activeTool === 'eraser' },
              { id: 'lasso', label: 'Seleção', icon: Lasso, active: activeTool === 'lasso' },
              { id: 'text', label: 'Texto', icon: Type, active: activeTool === 'text' },
              { id: 'hand', label: 'Mover', icon: Hand, active: activeTool === 'hand' || activeTool === 'pan' },
              { id: 'settings', label: 'Config', icon: Settings, active: false },
            ] as RadialItem[]
          }
          onSelect={(id) => {
            if (id === 'settings') {
              // Abre o popover de configurações sem fechar o radial
              setShowToolSettingsFromRadial(true)
              return
            }
            setTool(id as ToolType)
            if (id === 'sticker') setShowStickerPanel(true)
            setRadialMenuOpen(false)
          }}
          onClose={() => setRadialMenuOpen(false)}
          triggerRef={radialTriggerRef}
        />

        {/* OCR Panel */}
        <BottomSheet
          open={showOcrPanel}
          onClose={() => setShowOcrPanel(false)}
          title="OCR — Reconhecer escrita"
          maxHeight="75vh"
        >
          <div className="w-full md:w-[300px] p-4 overflow-auto">

                {/* Status / progress */}
                {ocr.status === 'idle' && !ocr.lastResult && (
                  <div className="space-y-3">
                    <Button className="w-full rounded-xl" variant="default" onClick={() => ocr.recognize(data)}>
                      <ScanText size={14} className="mr-2" /> Reconhecer página
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Reconhece traços (pen/pencil/highlighter) da página atual
                    </p>
                  </div>
                )}

                {ocr.status === 'loading' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                      <span className="text-sm font-medium">{ocr.progressText || 'Processando…'}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${ocr.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Reconhecimento 100% no dispositivo — nada sai do seu aparelho
                    </p>
                  </div>
                )}

                {ocr.status === 'error' && (
                  <div className="space-y-2 text-red-600 dark:text-red-400">
                    <p className="text-sm">Erro: {ocr.errorMessage}</p>
                    <Button variant="outline" className="w-full" size="sm" onClick={() => ocr.recognize(data)}>
                      Tentar novamente
                    </Button>
                  </div>
                )}

                {ocr.lastResult && (
                  <div className="space-y-3 border-t border-border/40 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Resultado</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ocr.lastResult.confidence}% confiança
                      </span>
                    </div>
                    <div className="max-h-40 overflow-auto bg-muted/30 rounded p-2 font-mono text-sm">
                      <pre className="whitespace-pre-wrap break-words">{ocr.lastResult.text}</pre>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => {
                          const result = ocr.lastResult
                          if (result) insertOcrText(result.text)
                        }}
                      >
                        Inserir como texto
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const result = ocr.lastResult
                          if (result) navigator.clipboard.writeText(result.text)
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => ocr.recognize(data)}
                    >
                      <RotateCw size={14} className="mr-1" /> Reconhecer novamente
                    </Button>
                  </div>
                )}
              </div>
        </BottomSheet>
      </div>

      {/* CanvasToolControls — slider de espessura/opacidade no canvas */}
      <CanvasToolControls
        tool={activeTool}
        size={pickCurrentSize(editor, activeTool)}
        opacity={pickCurrentOpacity(editor, activeTool)}
        color={editor.getToolColor()}
        suppressed={isDrawing || pointerInCanvas}
        touchPlaced={isMobile}
        onSizeChange={(n) => { pickSizeSetter(editor, activeTool)?.(n) }}
        onOpacityChange={(n) => { pickOpacitySetter(editor, activeTool)?.(n) }}
      />

      {/* FloatingDock — dock mobile contextual estilo Concepts (sempre visivel, c/ preview de pincel) */}
      <FloatingDock
        primary={primaryMetas}
        secondary={secondaryMetas}
        activeTool={activeTool}
        currentColor={editor.getToolColor()}
        suppressed={isDrawing || pointerInCanvas}
        onSelectTool={(t) => {
          setTool(t)
          if (t === 'sticker') setShowStickerPanel(true)
        }}
        onOpenMore={() => setShowMoreMenu(true)}
        onOpenSettings={() => setShowToolSettingsFromRadial(true)}
      />
      <ToolSettings triggerFromRadial={showToolSettingsFromRadial} setShowToolSettingsFromRadial={setShowToolSettingsFromRadial} mobile />

      {/* BottomSheet "mais ferramentas" — aberto pelo FloatingDock em mobile */}
      <BottomSheet
        open={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="Mais ferramentas"
        maxHeight="60vh"
        desktopSidePanel={false}
      >
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {secondaryMetas.map((tool) => {
              const Icon = TOOL_ICON[tool.id]
              return (
                <button
                  key={tool.id}
                  className={cn(
                    'aspect-square rounded-2xl transition-all inline-flex flex-col items-center justify-center gap-1.5',
                    'border border-border/40 active:scale-95 cursor-pointer',
                    activeTool === tool.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  onClick={() => {
                    setTool(tool.id)
                    setShowMoreMenu(false)
                    if (tool.id === 'sticker') setShowStickerPanel(true)
                  }}
                >
                  <Icon size={20} />
                  <span className="text-[10px] leading-none font-medium">{tool.label}</span>
                </button>
              )
            })}
          </div>
          <div className="h-px bg-border/40 my-3" />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="aspect-[2/1] rounded-2xl inline-flex items-center justify-center gap-2 bg-muted/40 text-muted-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
              onClick={() => {
                setShowOcrPanel(true)
                setShowMoreMenu(false)
              }}
            >
              <ScanText size={18} />
              <span className="text-xs font-medium">OCR</span>
            </button>
            <button
              className="aspect-[2/1] rounded-2xl inline-flex items-center justify-center gap-2 bg-muted/40 text-muted-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
              onClick={() => {
                setShowStickerPanel(true)
                setShowMoreMenu(false)
              }}
            >
              <Star size={18} />
              <span className="text-xs font-medium">Stickers</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
