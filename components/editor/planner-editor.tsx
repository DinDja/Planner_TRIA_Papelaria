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
} from '@/lib/types'
import { EMPTY_CANVAS, PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { PAGE_TEMPLATES, drawTemplate, getTemplateColors, type TemplateColors } from '@/lib/templates'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TemplateThumbnail } from '../templates-page/template-thumbnail'
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

import { ALL_STICKERS, STICKER_CATEGORIES, stickerToDataUrl } from '@/lib/stickers'
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player'
import { useCanvasPointer } from './hooks/use-canvas-pointer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

function vecToSvgPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  return `M ${points[0][0]} ${points[0][1]} L ${points
    .slice(1)
    .map((p) => `${p[0]} ${p[1]}`)
    .join(' ')} Z`
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

  const zoom = editor.zoom || 1
  const displayWidth = (PAGE_WIDTH * zoom) / 1.5
  const displayHeight = (PAGE_HEIGHT * zoom) / 1.5
  const displayScale = displayWidth / PAGE_WIDTH

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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved')

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

  // ─── Canvas refs & pointer hook ─────────────────────────────────────────────

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
    resizingHandle,
    clearSelection,
    getPageCoords,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setResizingHandle,
    setTextInput,
    commit,
  } = useCanvasPointer({
    plannerId: planner.id,
    currentPageId: currentPage?.id ?? null,
    data,
    canvasRef,
  })

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

  useEffect(() => {
    setAutoSaveStatus('saving')
    const timer = setTimeout(() => setAutoSaveStatus('saved'), 300)
    return () => clearTimeout(timer)
  }, [data])

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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStickerId) {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.stickers = newData.stickers.filter((s) => s.id !== selectedStickerId)
          commit(newData)
          clearSelection()
        } else if (selectedShapeId) {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.shapes = newData.shapes.filter((s) => s.id !== selectedShapeId)
          commit(newData)
          clearSelection()
        } else if (selectedNoteId) {
          const newData = JSON.parse(JSON.stringify(data)) as CanvasData
          newData.stickyNotes = newData.stickyNotes.filter((n) => n.id !== selectedNoteId)
          commit(newData)
          clearSelection()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPageIdx, handleUndo, handleRedo, selectedStickerId, selectedShapeId, selectedNoteId, data, commit, clearSelection])

  // ─── Sticker drop onto canvas ───────────────────────────────────────────────

  const [droppingStickerId, setDroppingStickerId] = useState<string | null>(null)

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

  // ─── Render strokes as SVG ──────────────────────────────────────────────────

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
                    onClick={() => goToPage(i)}
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
                      id: uid(),
                      x: 200,
                      y: 200 + Math.random() * 200,
                      text: '',
                      color: '#f0b429',
                    }]
                    commit(newData)
                    toast({ title: 'Nota adesiva adicionada' })
                  } },
                  { label: 'Retângulo', icon: Square, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(),
                      kind: 'rectangle',
                      x: 200,
                      y: 200,
                      width: 120,
                      height: 80,
                      color: '#e05b6d',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Círculo', icon: Minimize2, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(),
                      kind: 'ellipse',
                      x: 200,
                      y: 200,
                      width: 100,
                      height: 100,
                      color: '#5b8dbf',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Triângulo', icon: ALargeSmall, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(),
                      kind: 'triangle',
                      x: 200,
                      y: 200,
                      width: 100,
                      height: 100,
                      color: '#7bb686',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Seta', icon: ArrowLeft, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(),
                      kind: 'arrow',
                      x: 200,
                      y: 200,
                      width: 120,
                      height: 60,
                      color: '#f0b429',
                    }]
                    commit(newData)
                    toast({ title: 'Forma adicionada' })
                  } },
                  { label: 'Linha', icon: Minus, action: () => {
                    const newData = JSON.parse(JSON.stringify(data)) as CanvasData
                    newData.shapes = [...newData.shapes, {
                      id: uid(),
                      kind: 'line',
                      x: 200,
                      y: 200,
                      width: 120,
                      height: 2,
                      color: '#1a1a1a',
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
                          id: uid(),
                          stickerId: '__custom__',
                          customSvg: reader.result as string,
                          x: 200,
                          y: 200,
                          width: 120,
                          height: 120,
                          rotation: 0,
                        }]
                        commit(newData)
                        toast({ title: 'Imagem importada!' })
                      }
                      reader.readAsDataURL(file)
                    }
                    input.click()
                    setShowImportMenu(false)
                  } },
                  { label: 'SVG', action: () => {
                    setShowImportMenu(false)
                    toast({ title: 'SVG: Em breve!' })
                  } },
                  { label: 'PDF', action: () => {
                    setShowImportMenu(false)
                    toast({ title: 'PDF: Em breve!' })
                  } },
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
                  { label: 'PDF', action: () => {
                    setShowExportMenu(false)
                    toast({ title: 'PDF: Em breve!' })
                  } },
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
                onClick={() => {
                  setTool(tool.id)
                  if (tool.id === 'sticker') {
                    setShowStickerPanel(true)
                  }
                }}
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
        <div className="flex-1 relative overflow-hidden desk-bg" ref={canvasContainerRef}>
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
                      <div className="w-14 h-20 rounded-lg bg-muted border border-border/30 overflow-hidden flex-shrink-0">
                        {page.template === 'blank' ? (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            Em branco
                          </div>
                        ) : (
                          <TemplateThumbnail template={page.template} width={56} className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{page.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{page.template}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); handleDeletePage() }}
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
            <div className="min-w-full min-h-full flex items-center justify-center p-12">
              <div
                className="relative shrink-0"
                style={{ width: displayWidth, height: displayHeight }}
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
                      activeTool === 'pan' ? 'grab' :
                      'crosshair',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const stickerId = e.dataTransfer.getData('stickerId')
                    if (!stickerId) return
                    const coords = getPageCoords(e as unknown as React.PointerEvent)
                    placeSticker(stickerId, coords.x - 40, coords.y - 40)
                    toast({ title: 'Sticker adicionado!' })
                  }}
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
              {renderStrokes()}
              {renderRulerPreview()}
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
                    <LottiePlayer
                      src={def.lottieUrl}
                      style={{ width: '100%', height: '100%' }}
                      loop
                      autoplay
                    />
                  </div>
                )
              })}
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
              className="shrink-0 border-l border-border/40 bg-background overflow-hidden"
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
                  {[{ id: 'all', label: 'Todos' }, ...STICKER_CATEGORIES.map((c) => ({ id: c, label: c }))].map(
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
                  <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 outline-none">
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