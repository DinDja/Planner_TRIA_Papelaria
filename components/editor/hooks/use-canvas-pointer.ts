'use client'

import { useCallback, useRef, useState } from 'react'
import { useEditorStore } from '@/lib/store/use-editor-store'
import { useAppStore } from '@/lib/store/use-app-store'
import type { CanvasData, Stroke, StrokePoint } from '@/lib/types'
import { PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { toast } from '@/components/ui/toaster'

const uid = () => Math.random().toString(36).slice(2, 10)

/** Suavização Douglas-Peucker: reduz pontos colineares mantendo a forma */
function simplifyPoints(points: StrokePoint[], epsilon = 0.5): StrokePoint[] {
  if (points.length < 3) return points
  let dmax = 0
  let index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDist(points[i], points[0], points[end])
    if (d > dmax) { dmax = d; index = i }
  }
  if (dmax > epsilon) {
    const left = simplifyPoints(points.slice(0, index + 1), epsilon)
    const right = simplifyPoints(points.slice(index), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[end]]
}

function perpendicularDist(p: StrokePoint, a: StrokePoint, b: StrokePoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return Math.hypot(p.x - projX, p.y - projY)
}

interface UseCanvasPointerOptions {
  plannerId: string
  currentPageId: string | null
  data: CanvasData
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export function useCanvasPointer({
  plannerId,
  currentPageId,
  data,
  canvasRef,
}: UseCanvasPointerOptions) {
  // Refs para evitar stale closures nos handlers
  const dataRef = useRef(data)
  dataRef.current = data
  const pageIdRef = useRef(currentPageId)
  pageIdRef.current = currentPageId

  // ─── Drawing state ───────────────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number; px: number; py: number } | null>(null)
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([])
  const [rulerStart, setRulerStart] = useState<StrokePoint | null>(null)
  const [rulerEnd, setRulerEnd] = useState<StrokePoint | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; show: boolean } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [draggingItem, setDraggingItem] = useState<{
    id: string
    type: 'sticker' | 'shape' | 'note'
    startX: number; startY: number
    pageX: number; pageY: number
  } | null>(null)

  // ─── Selection state ─────────────────────────────────────────────────────────
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [resizingHandle, setResizingHandle] = useState<'br' | null>(null)

  const clearSelection = useCallback(() => {
    setSelectedStickerId(null)
    setSelectedShapeId(null)
    setSelectedNoteId(null)
    setResizingHandle(null)
  }, [])

  // ─── Hit test ────────────────────────────────────────────────────────────────
  const hitTest = useCallback((pageX: number, pageY: number) => {
    const d = dataRef.current
    for (const s of [...d.stickers].reverse()) {
      if (pageX >= s.x && pageX <= s.x + s.width && pageY >= s.y && pageY <= s.y + s.height) return s
    }
    return null
  }, [])

  // ─── Commit (push undo + save) ──────────────────────────────────────────────
  const commit = useCallback((newData: CanvasData) => {
    const pageId = pageIdRef.current
    if (!pageId) return
    const { pushHistory } = useEditorStore.getState()
    pushHistory(pageId, dataRef.current)
    useAppStore.getState().updatePageData(plannerId, pageId, newData)
  }, [plannerId])

  // ─── Coordinate conversion ──────────────────────────────────────────────────
  const getPageCoords = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0, pressure: 0.5 }
    const scaleX = PAGE_WIDTH / rect.width
    const scaleY = PAGE_HEIGHT / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }, [canvasRef])

  // ─── Pointer handlers ────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const { activeTool } = useEditorStore.getState()
    const pt = getPageCoords(e)

    if (activeTool === 'pan') {
      const { panX, panY } = useEditorStore.getState()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, px: panX, py: panY })
      return
    }

    if (activeTool === 'sticker') {
      if (resizingHandle) {
        const d = dataRef.current
        const sticker = d.stickers.find((s) => s.id === selectedStickerId)
        if (sticker) {
          setDraggingItem({ id: sticker.id, type: 'sticker', startX: sticker.width, startY: sticker.height, pageX: pt.x, pageY: pt.y })
        }
        return
      }
      const hit = hitTest(pt.x, pt.y)
      if (hit) {
        clearSelection()
        setSelectedStickerId(hit.id)
        setDraggingItem({ id: hit.id, type: 'sticker', startX: hit.x, startY: hit.y, pageX: pt.x, pageY: pt.y })
        return
      }
      const d = dataRef.current
      for (const s of [...d.shapes].reverse()) {
        if (pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height) {
          setSelectedShapeId(s.id)
          setDraggingItem({ id: s.id, type: 'shape', startX: s.x, startY: s.y, pageX: pt.x, pageY: pt.y })
          return
        }
      }
      for (const n of [...d.stickyNotes].reverse()) {
        if (pt.x >= n.x && pt.x <= n.x + 120 && pt.y >= n.y && pt.y <= n.y + 120) {
          setSelectedNoteId(n.id)
          setDraggingItem({ id: n.id, type: 'note', startX: n.x, startY: n.y, pageX: pt.x, pageY: pt.y })
          return
        }
      }
      clearSelection()
      return
    }

    if (activeTool === 'lasso') {
      setIsDrawing(true)
      setCurrentPoints([pt])
      return
    }

    if (activeTool === 'text') {
      clearSelection()
      setTextInput({ x: pt.x, y: pt.y, show: true })
      setTextValue('')
      return
    }

    if (activeTool === 'ruler') {
      clearSelection()
      setRulerStart(pt)
      setRulerEnd(pt)
      setIsDrawing(true)
      return
    }

    clearSelection()
    setIsDrawing(true)
    setCurrentPoints([pt])
  }, [getPageCoords, hitTest, clearSelection, selectedStickerId, resizingHandle])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning && panStart) {
      const { setPan } = useEditorStore.getState()
      setPan(panStart.px + (e.clientX - panStart.x), panStart.py + (e.clientY - panStart.y))
      return
    }

    if (draggingItem) {
      const pt = getPageCoords(e)
      const dx = pt.x - draggingItem.pageX
      const dy = pt.y - draggingItem.pageY
      const d = dataRef.current
      const pageId = pageIdRef.current
      if (!pageId) return

      if (resizingHandle === 'br') {
        const newData = JSON.parse(JSON.stringify(d)) as CanvasData
        newData.stickers = newData.stickers.map((s) =>
          s.id === draggingItem.id
            ? { ...s, width: Math.max(20, draggingItem.startX + dx), height: Math.max(20, draggingItem.startY + dy) }
            : s,
        )
        useAppStore.getState().updatePageData(plannerId, pageId, newData)
      } else {
        const newData = JSON.parse(JSON.stringify(d)) as CanvasData
        if (draggingItem.type === 'sticker') {
          newData.stickers = newData.stickers.map((s) =>
            s.id === draggingItem.id
              ? { ...s, x: draggingItem.startX + dx, y: draggingItem.startY + dy }
              : s,
          )
        } else if (draggingItem.type === 'shape') {
          newData.shapes = newData.shapes.map((s) =>
            s.id === draggingItem.id
              ? { ...s, x: draggingItem.startX + dx, y: draggingItem.startY + dy }
              : s,
          )
        } else if (draggingItem.type === 'note') {
          newData.stickyNotes = newData.stickyNotes.map((n) =>
            n.id === draggingItem.id
              ? { ...n, x: draggingItem.startX + dx, y: draggingItem.startY + dy }
              : n,
          )
        }
        useAppStore.getState().updatePageData(plannerId, pageId, newData)
      }
      return
    }

    if (!isDrawing) return
    const pt = getPageCoords(e)
    const { activeTool } = useEditorStore.getState()
    if (activeTool === 'ruler') {
      if (e.shiftKey && rulerStart) {
        const dx = pt.x - rulerStart.x
        const dy = pt.y - rulerStart.y
        const length = Math.hypot(dx, dy)
        if (length > 4) {
          const snappedAngle = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          setRulerEnd({
            ...pt,
            x: rulerStart.x + length * Math.cos(snappedAngle),
            y: rulerStart.y + length * Math.sin(snappedAngle),
          })
          return
        }
      }
      setRulerEnd(pt)
      return
    }
    if (activeTool === 'lasso') {
      setCurrentPoints((prev) => [...prev, pt])
      return
    }
    setCurrentPoints((prev) => [...prev, pt])
  }, [isDrawing, isPanning, panStart, draggingItem, getPageCoords, plannerId, resizingHandle])

  const handlePointerUp = useCallback(() => {
    const store = useEditorStore.getState()
    const tool = store.activeTool
    const d = dataRef.current

    if (isPanning) {
      setIsPanning(false)
      setPanStart(null)
      return
    }

    if (draggingItem) {
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      commit(newData)
      setDraggingItem(null)
      return
    }

    if (!isDrawing && !textInput) return

    // ── Lasso ──
    if (tool === 'lasso' && currentPoints.length > 4) {
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      const bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      for (const p of currentPoints) {
        bbox.minX = Math.min(bbox.minX, p.x)
        bbox.minY = Math.min(bbox.minY, p.y)
        bbox.maxX = Math.max(bbox.maxX, p.x)
        bbox.maxY = Math.max(bbox.maxY, p.y)
      }
      const insideStickers = newData.stickers.filter((s) => {
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        return cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY
      })
      const insideShapes = newData.shapes.filter((s) => {
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        return cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY
      })
      if (insideStickers.length > 0) {
        setSelectedStickerId(insideStickers[0].id)
        toast({ title: `${insideStickers.length} sticker(s) selecionados` })
      } else if (insideShapes.length > 0) {
        setSelectedShapeId(insideShapes[0].id)
        toast({ title: `${insideShapes.length} forma(s) selecionadas` })
      } else {
        newData.strokes = newData.strokes.filter((s) => {
          const cx = s.points.reduce((sum, p) => sum + p.x, 0) / s.points.length
          const cy = s.points.reduce((sum, p) => sum + p.y, 0) / s.points.length
          return !(cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY)
        })
        commit(newData)
        toast({ title: 'Strokes removidos na área' })
      }
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    // ── Ruler ──
    if (tool === 'ruler' && rulerStart && rulerEnd) {
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
        color: store.rulerColor,
        size: store.rulerSize,
        opacity: store.rulerOpacity,
        points: simplifyPoints([rulerStart, rulerEnd], 0.3),
      }
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      newData.strokes = [...newData.strokes, stroke]
      commit(newData)
      setIsDrawing(false)
      setRulerStart(null)
      setRulerEnd(null)
      return
    }

    // ── Eraser ──
    if (tool === 'eraser' && currentPoints.length > 0) {
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      const eraserRadius = store.eraserSize
      const eraserPoints = currentPoints
      const splitStrokes: Stroke[] = []

      for (const s of newData.strokes) {
        const segments: StrokePoint[][] = [[]]
        for (const sp of s.points) {
          const hit = eraserPoints.some((ep) => Math.hypot(ep.x - sp.x, ep.y - sp.y) < eraserRadius)
          if (hit) {
            if (segments[segments.length - 1].length > 1) {
              splitStrokes.push({ ...s, id: `${s.id}-${uid()}`, points: [...segments[segments.length - 1]] })
            }
            segments.push([])
          } else {
            segments[segments.length - 1].push(sp)
          }
        }
        if (segments[segments.length - 1].length > 1) {
          splitStrokes.push({ ...s, id: s.id, points: [...segments[segments.length - 1]] })
        } else if (segments.length === 1) {
          splitStrokes.push(s)
        }
      }
      newData.strokes = splitStrokes.filter((s) => s.points.length > 1)
      commit(newData)
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    // ── Pen / Pencil / Highlighter ──
    if ((tool === 'pen' || tool === 'pencil' || tool === 'highlighter') && currentPoints.length > 1) {
      const simplified = simplifyPoints(currentPoints, tool === 'highlighter' ? 0.8 : 0.3)
      if (simplified.length < 2) {
        setIsDrawing(false)
        setCurrentPoints([])
        return
      }
      const stroke: Stroke = {
        id: uid(),
        tool: tool as 'pen' | 'pencil' | 'highlighter',
        color: store.getToolColor(),
        size: store.getToolSize(),
        opacity: store.getToolOpacity(),
        points: simplified,
      }
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      newData.strokes = [...newData.strokes, stroke]
      commit(newData)
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    setIsDrawing(false)
    setCurrentPoints([])
  }, [
    isDrawing, isPanning, panStart, draggingItem, textInput,
    currentPoints, rulerStart, rulerEnd, commit,
  ])

  return {
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
  } as const
}
