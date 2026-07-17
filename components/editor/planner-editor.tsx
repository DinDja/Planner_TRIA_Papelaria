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
} from '@/lib/types'
import { EMPTY_CANVAS, PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { PAGE_TEMPLATES, drawTemplate, type TemplateColors } from '@/lib/templates'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input, ScrollArea } from '../ui/primitives'
import { Separator } from '../ui/primitives'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tab,
  TabList,
  Tabs,
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
  Image,
  Lasso,
  Layers,
  Link,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Pencil,
  PencilRuler,
  Pen,
  Plus,
  Redo2,
  RotateCw,
  RotateCcw,
  Ruler,
  ScanText,
  Search,
  Square,
  Star,
  StickyNote,
  Table,
  Trash2,
  Type,
  Undo2,
  Upload,
  Video,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType2,
  Music,
  Download,
  Heart,
  PlusCircle,
  GripHorizontal,
  Check,
} from 'lucide-react'

// Stickers panel import (will load from library)
import { STICKERS, ALL_STICKERS, STICKER_CATEGORIES, stickerToDataUrl } from '@/lib/stickers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

/** Convert Vec2[] (perfect-freehand output) to SVG path data */
function vecToSvgPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  return `M ${points[0][0]} ${points[0][1]} L ${points
    .slice(1)
    .map((p) => `${p[0]} ${p[1]}`)
    .join(' ')} Z`
}

function getTemplateColors(isDark: boolean): TemplateColors {
  return {
    paper: isDark ? '#2a2a28' : '#ffffff',
    line: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
    accent: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    text: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
    faint: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
  }
}

import type { ToolType } from '@/lib/types'

const toolbarItems = (): { id: ToolType; icon: typeof Pen; label: string }[] => {
  return [
    { id: 'pen', icon: Pen, label: 'Caneta' },
    { id: 'pencil', icon: Pencil, label: 'Lápis' },
    { id: 'highlighter', icon: Highlighter, label: 'Marca-texto' },
    { id: 'eraser', icon: Eraser, label: 'Borracha' },
    { id: 'lasso', icon: Lasso, label: 'Seleção' },
    { id: 'ruler', icon: Ruler, label: 'Régua' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'sticker', icon: Star, label: 'Sticker' },
    { id: 'pan', icon: MousePointer2, label: 'Mover' },
  ]
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

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

  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [showPagesPanel, setShowPagesPanel] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [stickerSearch, setStickerSearch] = useState('')
  const [stickerCat, setStickerCat] = useState('all')
  const [favoriteStickers, setFavoriteStickers] = useState<Set<string>>(new Set())
  const [showOcrPanel, setShowOcrPanel] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)

  // Ensure pages exist
  const pages = planner.pages.length > 0 ? planner.pages : []
  const currentPage = pages[currentPageIdx] ?? null
  const data: CanvasData = currentPage?.data ?? { ...EMPTY_CANVAS }

  const goToPage = (idx: number) => {
    if (idx >= 0 && idx < pages.length) setCurrentPageIdx(idx)
  }

  const commit = useCallback(
    (newData: CanvasData) => {
      if (!currentPage) return
      editor.pushHistory(currentPage.id, data)
      updatePageData(planner.id, currentPage.id, newData)
    },
    [currentPage, data, planner.id, updatePageData, editor],
  )

  const handleAddPage = () => {
    addPageAction(planner.id, 'blank')
    setCurrentPageIdx(pages.length)
  }

  const handleDeletePage = () => {
    if (!currentPage) return
    if (pages.length <= 1) {
      toast({ title: 'Precisa ter ao menos uma página', variant: 'error' })
      return
    }
    deletePage(planner.id, currentPage.id)
    setCurrentPageIdx(Math.max(0, currentPageIdx - 1))
  }

  const handleChangeTemplate = (tpl: PageTemplateId) => {
    if (!currentPage) return
    updatePageTemplate(planner.id, currentPage.id, tpl)
  }

  const handleUndo = () => {
    if (!currentPage) return
    const prev = editor.undo(currentPage.id)
    if (prev) updatePageData(planner.id, currentPage.id, prev)
  }

  const handleRedo = () => {
    if (!currentPage) return
    const next = editor.redo(currentPage.id)
    if (next) updatePageData(planner.id, currentPage.id, next)
  }

  // ─── Canvas drawing state ───────────────────────────────────────────────────

  const canvasRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([])
  const [rulerStart, setRulerStart] = useState<StrokePoint | null>(null)
  const [rulerEnd, setRulerEnd] = useState<StrokePoint | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; show: boolean } | null>(null)
  const [textValue, setTextValue] = useState('')

  // Render template background on canvas
  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas || !currentPage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = PAGE_WIDTH
    canvas.height = PAGE_HEIGHT
    drawTemplate(ctx, currentPage.template, PAGE_WIDTH, PAGE_HEIGHT, tc)
  }, [currentPage, tc])

  // Pointer event helpers
  const getPageCoords = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0, pressure: 0.5 }
      const scaleX = PAGE_WIDTH / rect.width
      const scaleY = PAGE_HEIGHT / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      }
    },
    [],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === 'pan' || activeTool === 'sticker') return
      if (activeTool === 'text') {
        const pt = getPageCoords(e)
        setTextInput({ x: pt.x, y: pt.y, show: true })
        setTextValue('')
        return
      }
      if (activeTool === 'ruler') {
        const pt = getPageCoords(e)
        setRulerStart(pt)
        setRulerEnd(pt)
        setIsDrawing(true)
        return
      }
      const pt = getPageCoords(e)
      setIsDrawing(true)
      setCurrentPoints([pt])
    },
    [activeTool, getPageCoords],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return
      const pt = getPageCoords(e)
      if (activeTool === 'ruler') {
        setRulerEnd(pt)
        return
      }
      setCurrentPoints((prev) => [...prev, pt])
    },
    [isDrawing, activeTool, getPageCoords],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing && !textInput) return
    if (activeTool === 'ruler' && rulerStart && rulerEnd) {
      const dx = rulerEnd.x - rulerStart.x
      const dy = rulerEnd.y - rulerStart.y
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        setIsDrawing(false)
        setRulerStart(null)
        setRulerEnd(null)
        return
      }
      const stroke: Stroke = {
        id: uid(),
        tool: 'ruler',
        color: editor.rulerColor,
        size: editor.rulerSize,
        opacity: editor.rulerOpacity,
        points: [rulerStart, rulerEnd],
      }
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      newData.strokes = [...newData.strokes, stroke]
      commit(newData)
      setIsDrawing(false)
      setRulerStart(null)
      setRulerEnd(null)
      return
    }
    if (activeTool === 'eraser' && currentPoints.length > 0) {
      // Object eraser: remove strokes that intersect
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      const eraserPath = currentPoints
      const survived = newData.strokes.filter((s) => {
        // Simple: check if any eraser point is near any stroke point
        return !eraserPath.some((ep) =>
          s.points.some((sp) => Math.hypot(ep.x - sp.x, ep.y - sp.y) < editor.eraserSize),
        )
      })
      newData.strokes = survived
      commit(newData)
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }
    if ((activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') && currentPoints.length > 1) {
      const stroke: Stroke = {
        id: uid(),
        tool: activeTool as 'pen' | 'pencil' | 'highlighter',
        color: editor.getToolColor(),
        size: editor.getToolSize(),
        opacity: editor.getToolOpacity(),
        points: [...currentPoints],
      }
      const newData = JSON.parse(JSON.stringify(data)) as CanvasData
      newData.strokes = [...newData.strokes, stroke]
      commit(newData)
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }
    setIsDrawing(false)
    setCurrentPoints([])
  }, [
    isDrawing,
    textInput,
    activeTool,
    currentPoints,
    rulerStart,
    rulerEnd,
    data,
    commit,
    editor,
  ])

  // ─── Filters ────────────────────────────────────────────────────────────────

  const stickers = useMemo(() => {
    let filtered = ALL_STICKERS
    if (stickerCat !== 'all') filtered = filtered.filter((s) => s.category === stickerCat)
    if (stickerSearch)
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(stickerSearch.toLowerCase()))
    return filtered
  }, [stickerCat, stickerSearch])

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        goToPage(currentPageIdx - 1)
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        goToPage(currentPageIdx + 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPageIdx, handleUndo, handleRedo])

  // ─── Sticker drop onto canvas ───────────────────────────────────────────────

  const [droppingStickerId, setDroppingStickerId] = useState<string | null>(null)

  const placeSticker = (stickerId: string, x: number, y: number) => {
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
  }

  // ─── Render strokes as SVG ──────────────────────────────────────────────────

  const renderStrokes = () => {
    const allStrokes = [...data.strokes]
    if (isDrawing && currentPoints.length > 0 && activeTool !== 'eraser' && activeTool !== 'ruler') {
      allStrokes.push({
        id: 'preview',
        tool: activeTool as 'pen' | 'pencil' | 'highlighter',
        color: editor.getToolColor(),
        size: editor.getToolSize(),
        opacity: editor.getToolOpacity(),
        points: currentPoints,
      })
    }
    return allStrokes.map((s) => {
      try {
        const pathD = vecToSvgPath(getStroke(s.points, {
          size: s.tool === 'highlighter' ? s.size * 1.5 : s.size,
          thinning: s.tool === 'pencil' ? 0.8 : s.tool === 'highlighter' ? 0.2 : 0.5,
          smoothing: 0.6,
          streamline: 0.4,
        }))
        return (
          <g key={s.id}>
            {s.tool === 'highlighter' ? (
              <>
                {/* Highlighter: semi-transparent wide path */}
                <path
                  d={pathD}
                  fill={s.color}
                  opacity={s.opacity * 0.7}
                  style={{ mixBlendMode: 'multiply' }}
                />
              </>
            ) : (
              <path d={pathD} fill={s.color} opacity={s.opacity} />
            )}
          </g>
        )
      } catch {
        return null
      }
    })
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
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setterColor?.(c)}
                    className="size-6 rounded-full border-2 transition-all hover:scale-110"
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
                      'flex-1 rounded-lg py-1 text-xs',
                      editor.textFontFamily === f ? 'bg-primary text-primary-foreground' : 'bg-muted',
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
        <span className="text-xs text-muted-foreground">
          Página {currentPageIdx + 1} de {pages.length}
        </span>
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
                  { label: 'Texto', icon: Type },
                  { label: 'Imagem', icon: Image },
                  { label: 'Formas', icon: Square },
                  { label: 'Tabela', icon: Table },
                  { label: 'Nota adesiva', icon: StickyNote },
                  { label: 'Link', icon: Link },
                  { label: 'Áudio', icon: Music },
                  { label: 'Vídeo', icon: Video },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    onClick={() => {
                      setShowInsertMenu(false)
                      toast({ title: `${label}: Em breve!` })
                    }}
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
                {['PDF', 'Imagem', 'Word', 'PowerPoint', 'Excel'].map((f) => (
                  <button
                    key={f}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    onClick={() => {
                      setShowImportMenu(false)
                      toast({ title: `Importar ${f}: Em breve!` })
                    }}
                  >
                    <FileText size={16} className="text-muted-foreground" />
                    {f}
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
                {['PDF', 'PNG', 'JPEG'].map((f) => (
                  <button
                    key={f}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    onClick={() => {
                      setShowExportMenu(false)
                      toast({ title: `Exportar ${f}: Em breve!` })
                    }}
                  >
                    <Download size={16} className="text-muted-foreground" />
                    {f}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* OCR */}
          <Button
            variant={showOcrPanel ? 'default' : 'ghost'}
            size="icon-sm"
            className="rounded-xl"
            onClick={() => setShowOcrPanel(!showOcrPanel)}
          >
            <ScanText size={16} />
          </Button>

          {/* Page nav */}
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => goToPage(currentPageIdx - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={() => goToPage(currentPageIdx + 1)}>
            <ChevronRight size={16} />
          </Button>

          {/* Undo / Redo */}
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={handleUndo}>
            <Undo2 size={16} />
          </Button>
          <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={handleRedo}>
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
                onClick={() => setTool(tool.id)}
              >
                <tool.icon size={16} />
              </TooltipTrigger>
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          ))}
          <div className="mt-auto">
            <ToolSettings />
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-[color:light-dark(#e0ddd6,#141412)]">
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
                      <div className="w-14 h-20 rounded-lg bg-muted border border-border/30 flex items-center justify-center text-[10px] text-muted-foreground overflow-hidden">
                        {page.template === 'blank' ? 'Em branco' : page.template}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{page.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{page.template}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); deletePage(planner.id, page.id) }}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div
            ref={canvasRef}
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              width: PAGE_WIDTH / (1.5 * (editor.zoom || 1)),
              height: PAGE_HEIGHT / (1.5 * (editor.zoom || 1)),
              minWidth: 300,
              minHeight: 400,
              maxWidth: '95vw',
              maxHeight: '95vh',
              touchAction: 'none',
              cursor:
                activeTool === 'eraser' ? 'crosshair' :
                activeTool === 'text' ? 'text' :
                activeTool === 'pan' ? 'grab' :
                'crosshair',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Background template */}
            <canvas
              ref={bgCanvasRef}
              className="absolute inset-0 w-full h-full"
            />
            {/* SVG drawing layer */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {renderStrokes()}
              {renderRulerPreview()}
              {/* Stickers */}
              {data.stickers.map((s) => {
                const def = STICKERS.find((st) => st.id === s.stickerId)
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
                >
                  {t.text}
                </text>
              ))}
            </svg>
            {/* Text input overlay */}
            {textInput?.show && (
              <input
                autoFocus
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textValue.trim()) {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
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
                    commit(newData)
                    setTextInput(null)
                  }
                  if (e.key === 'Escape') setTextInput(null)
                }}
                className="absolute z-10 bg-transparent border-b-2 border-primary text-foreground text-xl outline-none"
                style={{
                  left: textInput.x,
                  top: textInput.y,
                  fontFamily:
                    editor.textFontFamily === 'hand' ? 'var(--font-hand)' :
                    editor.textFontFamily === 'serif' ? 'var(--font-serif)' :
                    'var(--font-sans)',
                  fontSize: editor.textFontSize,
                  color: editor.textColor,
                }}
              />
            )}
          </div>
        </div>

        {/* Side panel: Stickers */}
        <AnimatePresence>
          {showStickerPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-border/40 bg-background overflow-hidden"
            >
              <div className="w-[300px] p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Stickers</h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowStickerPanel(false)}>
                    <X size={14} />
                  </Button>
                </div>
                <Input
                  placeholder="Buscar stickers..."
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                />
                <div className="flex gap-1.5 my-3 overflow-auto no-scrollbar">
                  {[{ id: 'all', label: 'Todos' }, ...STICKER_CATEGORIES.map((c) => ({ id: c, label: c }))].map(
                    (c) => (
                      <button
                        key={c.id}
                        onClick={() => setStickerCat(c.id)}
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
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
                          'aspect-square rounded-xl border border-border/40 p-2 hover:border-primary/30 hover:bg-muted/40 transition-all flex items-center justify-center',
                          favoriteStickers.has(st.id) && 'border-yellow-500/40',
                        )}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('stickerId', st.id)
                          setDroppingStickerId(st.id)
                        }}
                        onDragEnd={() => setDroppingStickerId(null)}
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
                        <img
                          src={stickerToDataUrl(st)}
                          alt={st.name}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <Separator className="my-3" />
                <p className="text-[10px] text-muted-foreground text-center">
                  Clique para adicionar &bull; Duplo clique para favoritar
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OCR Panel */}
        <AnimatePresence>
          {showOcrPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-border/40 bg-background overflow-hidden"
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
                <p className="text-xs text-muted-foreground mb-4">Converter escrita em texto</p>
                <Button className="w-full rounded-xl mb-3" variant="outline" disabled>
                  Converter página atual
                </Button>
                <Input placeholder="Buscar no conteúdo..." className="mb-3" />
                <div className="mb-3">
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">Idioma</label>
                  <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option>Português</option>
                    <option>Inglês</option>
                    <option>Espanhol</option>
                  </select>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  *Interface ilustrativa. OCR não implementado.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

