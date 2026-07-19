'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useEditorStore } from '@/lib/store/use-editor-store'
import type {
  CanvasData,
  PageTemplateId,
  Planner,
  PlannerPage,
  Stroke,
  StrokePoint,
  StickerInstance,
  TextItem,
  ShapeItem,
  StickyNote,
} from '@/lib/types'
import { EMPTY_CANVAS, PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { PAGE_TEMPLATES, drawTemplate, getTemplateColors, type TemplateColors } from '@/lib/templates'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { useHandwritingOcr } from './hooks/use-handwriting-ocr'
import { TemplateThumbnail } from '../templates-page/template-thumbnail'
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
  Pencil,
  Pen,
  Plus,
  Redo2,
  RotateCw,
  RotateCcw,
  Ruler,
  ScanText,
  Square,
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
  GripHorizontal,
  Check,
  BringToFront,
  SendToBack,
} from 'lucide-react'

import { ALL_STICKERS, STICKER_CATEGORIES, stickerToDataUrl } from '@/lib/stickers'
import dynamic from 'next/dynamic'
import { useCanvasPointer } from './hooks/use-canvas-pointer'
import { ContextMenu, type ContextMenuAction } from './context-menu'

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

const toolbarItems = (): { id: ToolType; icon: typeof Pen; label: string; shortcut: string }[] => [
  { id: 'pen', icon: Pen, label: 'Caneta', shortcut: '1' },
  { id: 'pencil', icon: Pencil, label: 'Lápis', shortcut: '2' },
  { id: 'highlighter', icon: Highlighter, label: 'Marca-texto', shortcut: '3' },
  { id: 'eraser', icon: Eraser, label: 'Borracha', shortcut: '4' },
  { id: 'lasso', icon: Lasso, label: 'Seleção', shortcut: '5' },
  { id: 'ruler', icon: Ruler, label: 'Régua', shortcut: '6' },
  { id: 'text', icon: Type, label: 'Texto', shortcut: '7' },
  { id: 'sticker', icon: Star, label: 'Sticker', shortcut: '8' },
  { id: 'pan', icon: MousePointer2, label: 'Mover', shortcut: '9' },
]

// ─── Memoized SVG components ────────────────────────────────────────────────

const StrokePath = memo(function StrokePath({ s }: { s: Stroke }) {
  try {
    const pathD = vecToSvgPath(getStroke(s.points, {
      size: s.tool === 'highlighter' ? s.size * 1.5 : s.size,
      thinning: s.tool === 'pencil' ? 0.8 : s.tool === 'highlighter' ? 0.2 : 0.5,
      smoothing: 0.6,
      streamline: 0.4,
    }))
    return (
      <g>
        {s.tool === 'highlighter' ? (
          <path
            d={pathD}
            fill={s.color}
            opacity={s.opacity * 0.7}
            style={{ mixBlendMode: 'multiply' }}
          />
        ) : (
          <path d={pathD} fill={s.color} opacity={s.opacity} />
        )}
      </g>
    )
  } catch {
    return null
  }
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

  switch (shape.kind) {
    case 'rectangle':
      return <rect x={x} y={y} width={w} height={h} rx={8} fill={c} {...common} />
    case 'ellipse':
      return <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={c} {...common} />
    case 'triangle':
      return (
        <polygon
          points={`${cx},${y} ${x + w},${y + h} ${x},${y + h}`}
          fill={c}
          {...common}
        />
      )
    case 'line': {
      const yc = cy
      const sw = Math.max(2, Math.min(6, h / 8))
      return <line x1={x} y1={yc} x2={x + w} y2={yc} stroke={c} strokeWidth={sw} strokeLinecap="round" {...common} />
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
      const sw = Math.max(2.5, Math.min(5, h * 0.12))
      return (
        <g>
          <line x1={x1} y1={yc} x2={x2 - headLen} y2={yc} stroke={c} strokeWidth={sw} strokeLinecap="round" {...common} />
          <polygon points={`${hx1},${hy1} ${hx2},${hy2} ${hx3},${hy3}`} fill={c} {...common} />
        </g>
      )
    }
  }
})

// ─── Main Editor ─────────────────────────────────────────────────────────────

export function PlannerEditor({ planner }: { planner: Planner }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tc = useMemo(() => getTemplateColors(isDark), [isDark])

  const updatePageData = useAppStore((s) => s.updatePageData)
  const updatePageTemplate = useAppStore((s) => s.updatePageTemplate)
  const deletePage = useAppStore((s) => s.deletePage)
  const addPageAction = useAppStore((s) => s.addPage)

  const editor = useEditorStore()
  const activeTool = editor.activeTool
  const setTool = editor.setActiveTool

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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')
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

  // ─── Canvas refs & pointer hook ────────────────────────────────────────────

  const canvasRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const {
    isDrawing,
    currentPoints,
    rulerStart,
    rulerEnd,
    textInput,
    textValue,
    setTextValue,
    draggingItem,
    selectedStickerId,
    selectedShapeId,
    selectedNoteId,
    selectedTextId,
    resizingHandle,
    isPanning,
    clearSelection,
    getPageCoords,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
    setResizingHandle,
    setTextInput,
    commit,
    beginResize,
  } = useCanvasPointer({
    plannerId: planner.id,
    currentPageId: currentPage?.id ?? null,
    data,
    canvasRef,
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
        if (selectedStickerId) {
          e.preventDefault()
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.stickers = newData.stickers.filter((s) => s.id !== selectedStickerId)
          commit(newData)
          clearSelection()
        } else if (selectedShapeId) {
          e.preventDefault()
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.shapes = newData.shapes.filter((s) => s.id !== selectedShapeId)
          commit(newData)
          clearSelection()
        } else if (selectedNoteId) {
          e.preventDefault()
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.stickyNotes = newData.stickyNotes.filter((n) => n.id !== selectedNoteId)
          commit(newData)
          clearSelection()
        } else if (selectedTextId) {
          e.preventDefault()
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.texts = newData.texts.filter((t) => t.id !== selectedTextId)
          commit(newData)
          clearSelection()
        }
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
        if (selectedStickerId) {
          const orig = data.stickers.find((s) => s.id === selectedStickerId)
          if (orig) {
            const newData = JSON.parse(JSON.stringify(data)) as CanvasData
            newData.stickers = [...newData.stickers, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
            commit(newData)
            toast({ title: 'Duplicado' })
          }
        } else if (selectedShapeId) {
          const orig = data.shapes.find((s) => s.id === selectedShapeId)
          if (orig) {
            const newData = JSON.parse(JSON.stringify(data)) as CanvasData
            newData.shapes = [...newData.shapes, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
            commit(newData)
            toast({ title: 'Duplicado' })
          }
        } else if (selectedNoteId) {
          const orig = data.stickyNotes.find((n) => n.id === selectedNoteId)
          if (orig) {
            const newData = JSON.parse(JSON.stringify(data)) as CanvasData
            newData.stickyNotes = [...newData.stickyNotes, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
            commit(newData)
            toast({ title: 'Duplicado' })
          }
        } else if (selectedTextId) {
          const orig = data.texts.find((t) => t.id === selectedTextId)
          if (orig) {
            const newData = JSON.parse(JSON.stringify(data)) as CanvasData
            newData.texts = [...newData.texts, { ...orig, id: uid(), x: orig.x + 20, y: orig.y + 20 }]
            commit(newData)
            toast({ title: 'Duplicado' })
          }
        }
      }

      // Nudge with arrows (when selection exists)
      if (!e.altKey && !e.metaKey && !e.ctrlKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const hasSelection = selectedStickerId || selectedShapeId || selectedNoteId || selectedTextId
        if (hasSelection) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          let dx = 0, dy = 0
          if (e.key === 'ArrowUp') dy = -step
          if (e.key === 'ArrowDown') dy = step
          if (e.key === 'ArrowLeft') dx = -step
          if (e.key === 'ArrowRight') dx = step

          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          if (selectedStickerId) {
            newData.stickers = newData.stickers.map((s) =>
              s.id === selectedStickerId ? { ...s, x: s.x + dx, y: s.y + dy } : s,
            )
          } else if (selectedShapeId) {
            newData.shapes = newData.shapes.map((s) =>
              s.id === selectedShapeId ? { ...s, x: s.x + dx, y: s.y + dy } : s,
            )
          } else if (selectedNoteId) {
            newData.stickyNotes = newData.stickyNotes.map((n) =>
              n.id === selectedNoteId ? { ...n, x: n.x + dx, y: n.y + dy } : n,
            )
          } else if (selectedTextId) {
            newData.texts = newData.texts.map((t) =>
              t.id === selectedTextId ? { ...t, x: t.x + dx, y: t.y + dy } : t,
            )
          }
          commit(newData)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentPageIdx, data, handleUndo, handleRedo,
    selectedStickerId, selectedShapeId, selectedNoteId, selectedTextId,
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
            id: uid(), x: 200, y: 200 + Math.random() * 200, text: '', color: '#f0b429',
          }]
          commit(newData)
          toast({ title: 'Nota adesiva adicionada' })
        }},
        { id: 'add-shape', label: 'Novo retângulo', icon: Square, onClick: () => {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.shapes = [...newData.shapes, {
            id: uid(), kind: 'rectangle', x: 200, y: 200, width: 120, height: 80, color: '#e05b6d',
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
    if (isDrawing && currentPoints.length > 0 && activeTool !== 'eraser' && activeTool !== 'ruler' && activeTool !== 'lasso') {
      allStrokes.push({
        id: 'preview',
        tool: activeTool as 'pen' | 'pencil' | 'highlighter',
        color: editor.getToolColor(),
        size: editor.getToolSize(),
        opacity: editor.getToolOpacity(),
        points: currentPoints,
      })
    }
    return allStrokes.map((s) => <StrokePath key={s.id} s={s} />)
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

  // ─── Tool settings ──────────────────────────────────────────────────────────

  const ToolSettings = () => {
    const color = editor.getToolColor()
    const size = editor.getToolSize()
    const opacity = editor.getToolOpacity()
    const colors = ['#1a1a1a', '#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0', '#d4b070', '#4a4a4a', '#6b5b8a']

    const setterColor =
      activeTool === 'pen' ? editor.setPenColor :
      activeTool === 'pencil' ? editor.setPencilColor :
      activeTool === 'highlighter' ? editor.setHighlighterColor :
      activeTool === 'ruler' ? editor.setRulerColor :
      activeTool === 'text' ? editor.setTextColor : null

    const setterSize =
      activeTool === 'pen' ? editor.setPenSize :
      activeTool === 'pencil' ? editor.setPencilSize :
      activeTool === 'highlighter' ? editor.setHighlighterSize :
      activeTool === 'ruler' ? editor.setRulerSize :
      activeTool === 'eraser' ? editor.setEraserSize : null

    const setterOpacity =
      activeTool === 'pen' ? editor.setPenOpacity :
      activeTool === 'pencil' ? editor.setPencilOpacity :
      activeTool === 'highlighter' ? editor.setHighlighterOpacity :
      activeTool === 'ruler' ? editor.setRulerOpacity : null

    return (
      <Popover>
        <PopoverTrigger className="rounded-xl p-1.5 hover:bg-muted transition-colors">
          <div className="size-4 rounded-full border border-border" style={{ backgroundColor: color }} />
        </PopoverTrigger>
        <PopoverContent className="w-56 p-4">
          <p className="text-xs font-semibold mb-3">Configurações</p>
          {setterColor && (
            <>
              <p className="text-[11px] text-muted-foreground mb-1.5">Cor</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setterColor?.(e.target.value)}
                  className="size-6 rounded cursor-pointer border-0 p-0"
                />
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setterColor?.(c)}
                    className="size-6 rounded-full border-2 transition-all hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: c,
                      borderColor: c === color ? (isDark ? '#fff' : '#333') : 'transparent',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {setterSize && (
            <>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Espessura: <span className="font-bold text-foreground">{size}px</span>
              </p>
              <input
                type="range"
                min={0.5}
                max={activeTool === 'highlighter' ? 30 : 10}
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
        </PopoverContent>
      </Popover>
    )
  }

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
    <div className="flex h-screen flex-col bg-[color:light-dark(#e8e5df,#1a1a18)]">
      {/* Top bar */}
      <div className="flex items-center gap-2 h-12 px-3 border-b border-border/40 bg-background/80 backdrop-blur-lg shrink-0">
        <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => window.history.back()}>
          <ArrowLeft size={18} />
        </Button>
        <span className="text-sm font-semibold truncate max-w-[200px]">{planner.name}</span>
        <div className="w-px h-5 bg-border mx-1" />
        {/* Page rename */}
        <input
          value={currentPage?.title ?? ''}
          onChange={(e) => {
            if (!currentPage) return
            useAppStore.getState().updatePlanner(planner.id, {
              pages: pages.map((p) => (p.id === currentPage.id ? { ...p, title: e.target.value } : p)),
            })
          }}
          className="text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1 max-w-[100px] text-muted-foreground"
        />
        <div className="w-px h-5 bg-border mx-1" />
        {/* Autosave indicator */}
        <span className={cn(
          'text-[10px] transition-opacity duration-500',
          autoSaveStatus === 'saving' ? 'opacity-100 text-amber-500' : 'opacity-50 text-muted-foreground'
        )}>
          {autoSaveStatus === 'saving' ? 'Salvando…' : 'Salvo ✓'}
        </span>
        {/* Page navigator dropdown */}
        <Popover>
          <PopoverTrigger className="text-xs text-muted-foreground ml-1 hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 cursor-pointer">
            Página {currentPageIdx + 1} de {pages.length}
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
          </PopoverContent>
        </Popover>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {/* Insert menu */}
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
                      id: uid(), x: 200, y: 200 + Math.random() * 200, text: '', color: '#f0b429',
                    }]
                    commit(newData)
                    toast({ title: 'Nota adesiva adicionada' })
                  } },
                  { label: 'Retângulo', icon: Square, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'rectangle', x: 200, y: 200, width: 120, height: 80, color: '#e05b6d',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Círculo', icon: Minimize2, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'ellipse', x: 200, y: 200, width: 100, height: 100, color: '#5b8dbf',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Triângulo', icon: ALargeSmall, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'triangle', x: 200, y: 200, width: 100, height: 100, color: '#7bb686',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Seta', icon: ArrowLeft, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(), kind: 'arrow', x: 200, y: 200, width: 120, height: 60, color: '#f0b429',
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

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setShowPagesPanel(!showPagesPanel)}
          >
            <Layers size={16} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Toolbar dock */}
        <div className="w-12 shrink-0 flex flex-col items-center gap-1 py-3 border-r border-border/40 bg-background/60">
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
            <ToolSettings />
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
                display: 'none', // shown via pointermove
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
                  style={{ backgroundColor: isDark ? '#222220' : '#efece5' }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[10px] rotate-[-0.8deg] -translate-x-2 translate-y-1.5 shadow-paper-sheet"
                  style={{ backgroundColor: isDark ? '#252523' : '#f7f5f0' }}
                />

                <div
                  ref={canvasRef}
                  className="relative overflow-hidden rounded-[6px] shadow-paper ring-1 ring-black/[0.07] dark:ring-white/[0.08] bg-[color:light-dark(#ffffff,#2a2a28)]"
                  style={{
                    width: '100%',
                    height: '100%',
                    touchAction: 'none',
                    cursor:
                      activeTool === 'eraser' ? 'crosshair' :
                      activeTool === 'text' ? 'text' :
                      activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') :
                      'crosshair',
                  }}
                  onContextMenu={handleContextMenu}
                  onPointerDown={handlePointerDown}
                  onPointerMove={(e) => {
                    handlePointerMove(e)
                    // Update eraser cursor position
                    if (activeTool === 'eraser' && eraserCursorRef.current) {
                      const el = eraserCursorRef.current
                      el.style.opacity = '1'
                      el.style.display = 'block'
                      el.style.left = `${e.clientX - el.offsetWidth / 2}px`
                      el.style.top = `${e.clientY - el.offsetHeight / 2}px`
                    }
                  }}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={(e) => {
                    handlePointerUp(e)
                    if (eraserCursorRef.current) eraserCursorRef.current.style.opacity = '0'
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
                            opacity={s.locked ? 0.7 : 1}
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
                        style={{ pointerEvents: 'auto' }}
                        onDoubleClick={() => {
                          if (activeTool === 'sticker') {
                            setTextInput({ x: t.x, y: t.y, show: true, editingId: t.id })
                            setTextValue(t.text)
                          }
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
                  {data.stickyNotes.map((n) => (
                    <div
                      key={n.id}
                      className="absolute pointer-events-none select-none"
                      style={{
                        left: n.x * displayScale,
                        top: n.y * displayScale,
                        width: 120 * displayScale,
                        height: 120 * displayScale,
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
                  ))}

                  {/* Text input overlay */}
                  {textInput?.show && (
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
                  {editingNoteId && (
                    <div
                      className="absolute z-20 pointer-events-auto"
                      style={{
                        left: data.stickyNotes.find(n => n.id === editingNoteId)?.x * displayScale ?? 0,
                        top: data.stickyNotes.find(n => n.id === editingNoteId)?.y * displayScale ?? 0,
                        width: 120 * displayScale,
                        height: 120 * displayScale,
                      }}
                    >
                      <textarea
                        autoFocus
                        defaultValue={data.stickyNotes.find(n => n.id === editingNoteId)?.text ?? ''}
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
                  )}

                  {/* Selection outlines + resize handle */}
                  {(selectedStickerId || selectedShapeId || selectedNoteId || selectedTextId) && (() => {
                    const sel = selectedStickerId
                      ? data.stickers.find(s => s.id === selectedStickerId)
                      : selectedShapeId
                        ? data.shapes.find(s => s.id === selectedShapeId)
                        : selectedNoteId
                          ? data.stickyNotes.find(n => n.id === selectedNoteId)
                          : selectedTextId
                            ? data.texts.find(t => t.id === selectedTextId)
                            : null
                    if (!sel) return null
                    const isSticker = !!selectedStickerId
                    const isShape = !!selectedShapeId
                    const isNote = !!selectedNoteId
                    const isText = !!selectedTextId
                    let x = isNote ? sel.x : isText ? sel.x : sel.x
                    let y = isNote ? sel.y : isText ? sel.y : sel.y
                    let w = isNote ? 120 : isText ? Math.max(20, sel.text.length * sel.fontSize * 0.58) : sel.width
                    let h = isNote ? 120 : isText ? sel.fontSize * 1.3 : sel.height
                    return (
                      <>
                        <div
                          className="absolute pointer-events-none border-2 border-dashed border-primary rounded-sm"
                          style={{
                            left: x * displayScale,
                            top: y * displayScale,
                            width: w * displayScale,
                            height: h * displayScale,
                          }}
                        />
                        {(isSticker || isShape) && (
                          <div
                            className="absolute size-3 bg-primary rounded-full border-2 border-white cursor-nwse-resize"
                            style={{
                              left: (x + w) * displayScale - 6,
                              top: (y + h) * displayScale - 6,
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              beginResize({ id: sel.id, type: isSticker ? 'sticker' : 'shape', width: sel.width, height: sel.height }, getPageCoords(e as unknown as React.PointerEvent))
                            }}
                          />
                        )}
                      </>
                    )
                  })()}
                  <div className="absolute inset-0 pointer-events-none paper-grain opacity-[0.05] mix-blend-overlay z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel: Stickers */}
        <AnimatePresence>
          {showStickerPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-border/40 bg-background overflow-hidden fixed md:relative inset-0 z-50 md:z-auto"
            >
              <div className="w-[300px] p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Stickers</h3>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setShowStickerPanel(false)
                      if (activeTool === 'sticker') setTool('pan')
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
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
                  <div className="grid grid-cols-4 gap-2">
                    {stickers.map((st) => (
                      <button
                        key={st.id}
                        className={cn(
                          'aspect-square rounded-xl border border-border/40 p-2 hover:border-primary/30 hover:bg-muted/40 transition-all flex items-center justify-center cursor-pointer',
                          favoriteStickers.has(st.id) && 'border-yellow-500/40',
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Menu */}
        <ContextMenu
          x={ctxMenu?.x ?? 0}
          y={ctxMenu?.y ?? 0}
          open={!!ctxMenu}
          label={ctxLabel}
          actions={buildCtxMenuActions()}
          onClose={() => setCtxMenu(null)}
        />

        {/* OCR Panel */}
        <AnimatePresence>
          {showOcrPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-border/40 bg-background overflow-hidden fixed md:relative inset-0 z-50 md:z-auto"
            >
              <div className="w-[300px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ScanText size={16} /> OCR
                  </h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowOcrPanel(false)}>
                    <X size={14} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Converter escrita manual em texto</p>

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
                      {ocr.progressText || `Carregando modelo (${ocr.progress}%)…`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile toolbar (bottom dock) */}
      <div className="md:hidden flex items-center justify-around px-1 h-14 shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-lg z-30 safe-area-bottom">
        {toolbarItems().map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              className={cn(
                'size-10 rounded-xl transition-all inline-flex items-center justify-center',
                activeTool === tool.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                setTool(tool.id)
                if (tool.id === 'sticker') {
                  setShowStickerPanel(true)
                }
              }}
            >
              <tool.icon size={18} />
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}
        <div className="w-px h-5 bg-border/40 mx-0.5" />
        <button
          className={cn(
            'size-10 rounded-xl transition-all inline-flex items-center justify-center',
            'hover:bg-muted text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setShowOcrPanel(true)}
        >
          <ScanText size={18} />
        </button>
        <ToolSettings />
      </div>
    </div>
  )
}