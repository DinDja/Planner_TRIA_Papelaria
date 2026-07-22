'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore, toolToBrushStyle } from '@/lib/store/use-editor-store'
import { useAppStore } from '@/lib/store/use-app-store'
import type {
  CanvasData,
  Stroke,
  StrokePoint,
  ShapeItem,
  TextItem,
  StickyNote,
  StickerInstance,
  CanvasItemKind,
  CanvasItemRef,
} from '@/lib/types'
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

/** Snap angular para 15 graus (com Shift) ou livre. */
const ROTATION_SNAP_DEG = 15

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface UseCanvasPointerOptions {
  plannerId: string
  currentPageId: string | null
  data: CanvasData
  canvasRef: React.RefObject<HTMLDivElement | null>
}

interface ShapeDraft {
  kind: 'rectangle' | 'ellipse' | 'line' | 'arrow'
  startX: number
  startY: number
  endX: number
  endY: number
}

/** Estado de uma operação de arraste/resize/rotate sobre itens. */
interface TransformSession {
  kind: 'move' | 'resize' | 'rotate'
  /** Itens sendo transformados. */
  items: CanvasItemRef[]
  /** Handle de resize ativo (apenas para kind='resize'). */
  resizeHandle?: ResizeHandle
  /** Ponto inicial em page coords. */
  startX: number
  startY: number
  /** Estado inicial de cada item (capturado no pointerdown). */
  initialStates: Map<string, { x: number; y: number; width?: number; height?: number; fontSize?: number; rotation?: number }>
  /** Centro do bounding box (para rotate). */
  centerX?: number
  centerY?: number
  /** Ângulo inicial (para rotate). */
  startAngle?: number
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
  const dragStartDataRef = useRef<CanvasData | null>(null)
  const penActiveRef = useRef(false)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchBaselineRef = useRef<{ distance: number; zoom: number } | null>(null)
  const autoPanRef = useRef<{ dirX: number; dirY: number; raf: number | null }>({ dirX: 0, dirY: 0, raf: null })

  // ─── Drawing state ───────────────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number; px: number; py: number } | null>(null)
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([])
  const [rulerStart, setRulerStart] = useState<StrokePoint | null>(null)
  const [rulerEnd, setRulerEnd] = useState<StrokePoint | null>(null)
  const [shapeDraft, setShapeDraft] = useState<ShapeDraft | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; show: boolean; editingId?: string } | null>(null)
  const [textValue, setTextValue] = useState('')

  // ─── Unified Selection state (replaces selectedStickerId/ShapeId/NoteId/TextId) ──
  const [selectedItems, setSelectedItems] = useState<CanvasItemRef[]>([])
  const [transformSession, setTransformSession] = useState<TransformSession | null>(null)
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })

  // Legacy single-selection accessors (for backwards compatibility)
  const selectedStickerId = selectedItems.find(i => i.kind === 'sticker')?.id ?? null
  const selectedShapeId = selectedItems.find(i => i.kind === 'shape')?.id ?? null
  const selectedNoteId = selectedItems.find(i => i.kind === 'note')?.id ?? null
  const selectedTextId = selectedItems.find(i => i.kind === 'text')?.id ?? null

  const clearSelection = useCallback(() => {
    setSelectedItems([])
    setTransformSession(null)
    setGuides({ x: [], y: [] })
  }, [])

  /** Seleciona item único (ou adiciona à seleção se shift). */
  const selectItem = useCallback((ref: CanvasItemRef, additive: boolean) => {
    if (additive) {
      setSelectedItems((prev) => {
        const exists = prev.some((i) => i.kind === ref.kind && i.id === ref.id)
        if (exists) return prev.filter((i) => !(i.kind === ref.kind && i.id === ref.id))
        return [...prev, ref]
      })
    } else {
      setSelectedItems([ref])
    }
  }, [])

  // ─── Item accessors ──────────────────────────────────────────────────────
  const getItem = useCallback((ref: CanvasItemRef): StickerInstance | ShapeItem | StickyNote | TextItem | undefined => {
    const d = dataRef.current
    switch (ref.kind) {
      case 'sticker': return d.stickers.find(s => s.id === ref.id)
      case 'shape': return d.shapes.find(s => s.id === ref.id)
      case 'note': return d.stickyNotes.find(n => n.id === ref.id)
      case 'text': return d.texts.find(t => t.id === ref.id)
    }
  }, [])

  /** Get bounding box of any item. */
  const getItemBounds = useCallback((ref: CanvasItemRef): { x: number; y: number; width: number; height: number } | null => {
    const item = getItem(ref)
    if (!item) return null
    switch (ref.kind) {
      case 'sticker': {
        const s = item as StickerInstance
        return { x: s.x, y: s.y, width: s.width, height: s.height }
      }
      case 'shape': {
        const s = item as ShapeItem
        return { x: s.x, y: s.y, width: s.width, height: s.height }
      }
      case 'note': {
        const n = item as StickyNote
        return { x: n.x, y: n.y, width: n.width ?? 120, height: n.height ?? 120 }
      }
      case 'text': {
        const t = item as TextItem
        const w = t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)
        return { x: t.x, y: t.y, width: w, height: t.fontSize * 1.3 }
      }
    }
  }, [getItem])

  /** Compute combined bounding box of multiple items. */
  const getSelectionBounds = useCallback((): { x: number; y: number; width: number; height: number } | null => {
    if (selectedItems.length === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const ref of selectedItems) {
      const b = getItemBounds(ref)
      if (!b) continue
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }
    if (!isFinite(minX)) return null
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, [selectedItems, getItemBounds])

  // ─── Hit test ────────────────────────────────────────────────────────────────
  const hitTestAll = useCallback((pageX: number, pageY: number): CanvasItemRef | null => {
    const d = dataRef.current
    // Notes (top)
    for (const n of [...d.stickyNotes].reverse()) {
      if (n.locked) continue
      const w = n.width ?? 120
      const h = n.height ?? 120
      if (pageX >= n.x && pageX <= n.x + w && pageY >= n.y && pageY <= n.y + h) return { kind: 'note', id: n.id }
    }
    // Texts
    for (const t of [...d.texts].reverse()) {
      if (t.locked) continue
      const w = t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)
      const h = t.fontSize * 1.3
      if (pageX >= t.x && pageX <= t.x + w && pageY >= t.y && pageY <= t.y + h) return { kind: 'text', id: t.id }
    }
    // Stickers
    for (const s of [...d.stickers].reverse()) {
      if (s.locked) continue
      if (pageX >= s.x && pageX <= s.x + s.width && pageY >= s.y && pageY <= s.y + s.height) return { kind: 'sticker', id: s.id }
    }
    // Shapes (bottom)
    for (const s of [...d.shapes].reverse()) {
      if (s.locked) continue
      if (pageX >= s.x && pageX <= s.x + s.width && pageY >= s.y && pageY <= s.y + s.height) return { kind: 'shape', id: s.id }
    }
    return null
  }, [])

  // ─── Commit (push undo + save) ──────────────────────────────────────────────
  const commit = useCallback((newData: CanvasData, prevOverride?: CanvasData) => {
    const pageId = pageIdRef.current
    if (!pageId) return
    const { pushHistory } = useEditorStore.getState()
    pushHistory(pageId, prevOverride ?? dataRef.current)
    useAppStore.getState().updatePageData(plannerId, pageId, newData)
  }, [plannerId])

  // ─── Coordinate conversion ──────────────────────────────────────────────────
  const getPageCoords = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0, pressure: 0.5 }
    const scaleX = PAGE_WIDTH / rect.width
    const scaleY = PAGE_HEIGHT / rect.height
    const evt = e.nativeEvent
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: evt.pressure > 0 ? evt.pressure : 0.5,
      tiltX: evt.tiltX,
      tiltY: evt.tiltY,
      twist: evt.twist,
      pointerType: evt.pointerType as 'mouse' | 'pen' | 'touch',
    }
  }, [canvasRef])

  // ─── Begin transform session ──────────────────────────────────────────────────
  const captureInitialState = useCallback((refs: CanvasItemRef[]): TransformSession['initialStates'] => {
    const map = new Map()
    for (const ref of refs) {
      const item = getItem(ref)
      if (!item) continue
      const key = `${ref.kind}:${ref.id}`
      if (ref.kind === 'sticker') {
        const s = item as StickerInstance
        map.set(key, { x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation })
      } else if (ref.kind === 'shape') {
        const s = item as ShapeItem
        map.set(key, { x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation })
      } else if (ref.kind === 'note') {
        const n = item as StickyNote
        map.set(key, { x: n.x, y: n.y, width: n.width ?? 120, height: n.height ?? 120, rotation: n.rotation })
      } else if (ref.kind === 'text') {
        const t = item as TextItem
        map.set(key, { x: t.x, y: t.y, width: t.width, height: t.fontSize * 1.3, fontSize: t.fontSize, rotation: t.rotation })
      }
    }
    return map
  }, [getItem])

  /** Inicia sessão de move. */
  const beginMove = useCallback((refs: CanvasItemRef[], startPt: { x: number; y: number }) => {
    dragStartDataRef.current = JSON.parse(JSON.stringify(dataRef.current))
    setTransformSession({
      kind: 'move',
      items: refs,
      startX: startPt.x,
      startY: startPt.y,
      initialStates: captureInitialState(refs),
    })
  }, [captureInitialState])

  /** Inicia sessão de resize. */
  const beginResize = useCallback((refs: CanvasItemRef[], handle: ResizeHandle, startPt: { x: number; y: number }) => {
    dragStartDataRef.current = JSON.parse(JSON.stringify(dataRef.current))
    setTransformSession({
      kind: 'resize',
      items: refs,
      resizeHandle: handle,
      startX: startPt.x,
      startY: startPt.y,
      initialStates: captureInitialState(refs),
    })
  }, [captureInitialState])

  /** Inicia sessão de rotate. */
  const beginRotate = useCallback((refs: CanvasItemRef[], startPt: { x: number; y: number }) => {
    dragStartDataRef.current = JSON.parse(JSON.stringify(dataRef.current))
    // Compute center
    const bounds = refs.map(r => getItemBounds(r)).filter(Boolean) as { x: number; y: number; width: number; height: number }[]
    if (bounds.length === 0) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const b of bounds) {
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const startAngle = Math.atan2(startPt.y - cy, startPt.x - cx) * (180 / Math.PI)
    setTransformSession({
      kind: 'rotate',
      items: refs,
      startX: startPt.x,
      startY: startPt.y,
      initialStates: captureInitialState(refs),
      centerX: cx,
      centerY: cy,
      startAngle,
    })
  }, [captureInitialState, getItemBounds])

  // ─── Palm rejection helper ──────────────────────────────────────────────────
  const shouldIgnorePointer = useCallback((e: React.PointerEvent) => {
    const pointerType = (e.nativeEvent.pointerType ?? 'mouse') as string
    if (penActiveRef.current && pointerType === 'touch') return true
    return false
  }, [])

  const notePointerDown = useCallback((e: React.PointerEvent) => {
    const pointerType = (e.nativeEvent.pointerType ?? 'mouse') as string
    if (pointerType === 'pen') penActiveRef.current = true
  }, [])

  const notePointerUp = useCallback((e: React.PointerEvent) => {
    const pointerType = (e.nativeEvent.pointerType ?? 'mouse') as string
    if (pointerType === 'pen') {
      setTimeout(() => { penActiveRef.current = false }, 200)
    }
  }, [])

  // ─── Auto-pan quando caneta atinge borda ────────────────────────────────────
  const EDGE_THRESHOLD = 40

  const updateAutoPan = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let dirX = 0
    let dirY = 0
    if (x < EDGE_THRESHOLD) dirX = -1
    else if (x > rect.width - EDGE_THRESHOLD) dirX = 1
    if (y < EDGE_THRESHOLD) dirY = -1
    else if (y > rect.height - EDGE_THRESHOLD) dirY = 1

    autoPanRef.current.dirX = dirX
    autoPanRef.current.dirY = dirY
  }, [canvasRef])

  const stopAutoPan = useCallback(() => {
    if (autoPanRef.current.raf != null) cancelAnimationFrame(autoPanRef.current.raf)
    autoPanRef.current = { dirX: 0, dirY: 0, raf: null }
  }, [])

  useEffect(() => {
    return () => stopAutoPan()
  }, [stopAutoPan])

  // ─── Snap helpers ───────────────────────────────────────────────────────────
  const snapValue = useCallback((v: number) => {
    const { snappingEnabled, snapGridSize } = useEditorStore.getState()
    if (!snappingEnabled) return v
    return Math.round(v / snapGridSize) * snapGridSize
  }, [])

  const computeGuides = useCallback((moving: { x: number; y: number; width: number; height: number }) => {
    const { alignmentGuides } = useEditorStore.getState()
    if (!alignmentGuides) return { x: [], y: [] }
    const d = dataRef.current
    const candidates: { x: number[]; y: number[] } = { x: [], y: [] }
    const mcx = moving.x + moving.width / 2
    const mcy = moving.y + moving.height / 2

    const check = (px: number, py: number) => {
      if (Math.abs(px - mcx) < 6 && !candidates.x.includes(px)) candidates.x.push(px)
      if (Math.abs(py - mcy) < 6 && !candidates.y.includes(py)) candidates.y.push(py)
    }

    for (const s of d.shapes) check(s.x + s.width / 2, s.y + s.height / 2)
    for (const s of d.stickers) check(s.x + s.width / 2, s.y + s.height / 2)
    for (const n of d.stickyNotes) check(n.x + (n.width ?? 120) / 2, n.y + (n.height ?? 120) / 2)
    for (const t of d.texts) check(t.x + (t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)) / 2, t.y + t.fontSize * 0.65)

    return candidates
  }, [])

  // ─── Flood-fill helper ──────────────────────────────────────────────────────
  const floodFill = useCallback((pageX: number, pageY: number, color: string) => {
    const d = dataRef.current
    const newData = JSON.parse(JSON.stringify(d)) as CanvasData

    // 1) Preenche o fundo de toda a página
    newData.bgColor = color
    let changed = true // fundo sempre muda quando há nova cor

    // 2) Recolore strokes cuja distância do centróide < 90px (efeito "fechado")
    for (const s of newData.strokes) {
      let cx = 0
      let cy = 0
      for (const p of s.points) { cx += p.x; cy += p.y }
      cx /= s.points.length
      cy /= s.points.length
      const dist = Math.hypot(cx - pageX, cy - pageY)
      if (dist < 90) {
        s.color = color
      }
    }

    // 3) Recolore shapes próximos (por centróide)
    for (const s of newData.shapes) {
      const cx = s.x + s.width / 2
      const cy = s.y + s.height / 2
      if (Math.hypot(cx - pageX, cy - pageY) < 90) {
        s.color = color
      }
    }

    // 4) Recolore sticky notes próximos (cor de fundo)
    for (const n of newData.stickyNotes) {
      const w = n.width ?? 120
      const h = n.height ?? 120
      if (pageX >= n.x && pageX <= n.x + w && pageY >= n.y && pageY <= n.y + h) {
        n.color = color
      }
    }

    if (changed) {
      commit(newData)
      toast({ title: 'Página preenchida!' })
    } else {
      toast({ title: 'Nada para preencher', description: 'Toque em uma área fechada' })
    }
  }, [commit])

  // ─── Eyedropper helper ──────────────────────────────────────────────────────
  const pickColorAt = useCallback((pageX: number, pageY: number): string | null => {
    const d = dataRef.current
    for (const s of [...d.stickers].reverse()) {
      if (pageX >= s.x && pageX <= s.x + s.width && pageY >= s.y && pageY <= s.y + s.height) {
        if (s.customSvg) {
          const m = s.customSvg.match(/#([0-9a-f]{6})/i)
          if (m) return `#${m[1]}`
        }
        return '#1a1a1a'
      }
    }
    for (const s of [...d.shapes].reverse()) {
      if (pageX >= s.x && pageX <= s.x + s.width && pageY >= s.y && pageY <= s.y + s.height) return s.color
    }
    for (const s of [...d.strokes].reverse()) {
      let cx = 0
      let cy = 0
      for (const p of s.points) { cx += p.x; cy += p.y }
      cx /= s.points.length
      cy /= s.points.length
      if (Math.hypot(cx - pageX, cy - pageY) < 30) return s.color
    }
    for (const t of [...d.texts].reverse()) {
      const w = t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)
      const h = t.fontSize * 1.3
      if (pageX >= t.x && pageX <= t.x + w && pageY >= t.y && pageY <= t.y + h) return t.color
    }
    return null
  }, [])

  // ─── Pointer handlers ────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointersRef.current.size === 2) {
      stopAutoPan()
      setIsDrawing(false)
      setCurrentPoints([])
      const pts = Array.from(activePointersRef.current.values())
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      pinchBaselineRef.current = {
        distance: Math.hypot(dx, dy),
        zoom: useEditorStore.getState().zoom,
      }
      return
    }
    if (activePointersRef.current.size > 2) return

    if (shouldIgnorePointer(e)) return
    notePointerDown(e)

    const { activeTool } = useEditorStore.getState()
    const pt = getPageCoords(e)

    // Eraser via caneta (barrel button)
    const isEraserBtn = e.nativeEvent.button === 5 || (e.nativeEvent.buttons & 32) !== 0
    if (isEraserBtn && activeTool !== 'eraser') {
      useEditorStore.getState().setActiveTool('eraser')
    }

    if (activeTool === 'pan' || activeTool === 'hand') {
      const { panX, panY } = useEditorStore.getState()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, px: panX, py: panY })
      return
    }

    if (activeTool === 'eyedropper') {
      const color = pickColorAt(pt.x, pt.y)
      if (color) {
        const store = useEditorStore.getState()
        store.pushLastColor(color)
        store.setPenColor(color)
        toast({ title: 'Cor capturada!', description: color })
      } else {
        toast({ title: 'Sem cor nesta area', description: 'Toque em um traço, forma ou texto' })
      }
      return
    }

    if (activeTool === 'fill') {
      floodFill(pt.x, pt.y, useEditorStore.getState().fillColor)
      return
    }

    // Shape-drawing tools (drag to draw)
    if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line' || activeTool === 'arrow') {
      clearSelection()
      setShapeDraft({ kind: activeTool, startX: pt.x, startY: pt.y, endX: pt.x, endY: pt.y })
      setIsDrawing(true)
      return
    }

    // Selection tool (sticker icon) or any tool clicking an existing item
    if (activeTool === 'sticker' || activeTool === 'lasso') {
      const hit = hitTestAll(pt.x, pt.y)
      if (hit) {
        const additive = e.shiftKey
        selectItem(hit, additive)
        // Get items to drag: if hit is already in selection, drag whole selection; else just hit
        const isInSelection = selectedItems.some(i => i.kind === hit.kind && i.id === hit.id)
        const refsToMove = additive
          ? [hit]
          : isInSelection
            ? selectedItems
            : [hit]
        beginMove(refsToMove, pt)
        return
      }
      // Clicked empty area
      if (activeTool === 'lasso') {
        setIsDrawing(true)
        setCurrentPoints([pt])
      } else {
        clearSelection()
      }
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

    // Drawing tools (pen/pencil/brush/marker/highlighter/eraser)
    clearSelection()
    setIsDrawing(true)
    setCurrentPoints([pt])
  }, [getPageCoords, hitTestAll, clearSelection, shouldIgnorePointer, notePointerDown, floodFill, pickColorAt, stopAutoPan, selectItem, selectedItems, beginMove])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    if (activePointersRef.current.size === 2 && pinchBaselineRef.current) {
      const pts = Array.from(activePointersRef.current.values())
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      const dist = Math.hypot(dx, dy)
      const scale = dist / Math.max(1, pinchBaselineRef.current.distance)
      const { setZoom } = useEditorStore.getState()
      setZoom(pinchBaselineRef.current.zoom * scale)
      return
    }

    if (isPanning && panStart) {
      const { setPan } = useEditorStore.getState()
      setPan(panStart.px + (e.clientX - panStart.x), panStart.py + (e.clientY - panStart.y))
      return
    }

    // ── Transform session (move / resize / rotate) ──
    if (transformSession) {
      const pt = getPageCoords(e)
      const pageId = pageIdRef.current
      if (!pageId) return

      const d = dataRef.current
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      const { snappingEnabled } = useEditorStore.getState()

      if (transformSession.kind === 'move') {
        let dx = pt.x - transformSession.startX
        let dy = pt.y - transformSession.startY
        // Apply snapping based on primary item's new position
        const firstKey = `${transformSession.items[0].kind}:${transformSession.items[0].id}`
        const firstInit = transformSession.initialStates.get(firstKey)
        if (firstInit && snappingEnabled) {
          const nx = snapValue(firstInit.x + dx)
          const ny = snapValue(firstInit.y + dy)
          dx = nx - firstInit.x
          dy = ny - firstInit.y
        }

        for (const ref of transformSession.items) {
          const key = `${ref.kind}:${ref.id}`
          const init = transformSession.initialStates.get(key)
          if (!init) continue
          const nx = init.x + dx
          const ny = init.y + dy

          if (ref.kind === 'sticker') {
            newData.stickers = newData.stickers.map((s) => s.id === ref.id ? { ...s, x: nx, y: ny } : s)
          } else if (ref.kind === 'shape') {
            newData.shapes = newData.shapes.map((s) => s.id === ref.id ? { ...s, x: nx, y: ny } : s)
          } else if (ref.kind === 'note') {
            newData.stickyNotes = newData.stickyNotes.map((n) => n.id === ref.id ? { ...n, x: nx, y: ny } : n)
          } else if (ref.kind === 'text') {
            newData.texts = newData.texts.map((t) => t.id === ref.id ? { ...t, x: nx, y: ny } : t)
          }
        }

        // Compute guides based on first item's new position
        if (firstInit) {
          const b = getItemBounds(transformSession.items[0])
          if (b) {
            setGuides(computeGuides({ x: firstInit.x + dx, y: firstInit.y + dy, width: b.width, height: b.height }))
          }
        }

        useAppStore.getState().updatePageData(plannerId, pageId, newData)
      } else if (transformSession.kind === 'resize' && transformSession.resizeHandle) {
        const handle = transformSession.resizeHandle
        let dx = pt.x - transformSession.startX
        let dy = pt.y - transformSession.startY

        for (const ref of transformSession.items) {
          const key = `${ref.kind}:${ref.id}`
          const init = transformSession.initialStates.get(key)
          if (!init || init.width === undefined || init.height === undefined) continue

          let newX = init.x
          let newY = init.y
          let newW = init.width
          let newH = init.height

          // Horizontal
          if (handle.includes('w')) {
            newX = init.x + dx
            newW = Math.max(10, init.width - dx)
          } else if (handle.includes('e')) {
            newW = Math.max(10, init.width + dx)
          }
          // Vertical
          if (handle.includes('n')) {
            newY = init.y + dy
            newH = Math.max(10, init.height - dy)
          } else if (handle.includes('s')) {
            newH = Math.max(10, init.height + dy)
          }

          // Proportional resize with Shift (corner handles)
          if (e.shiftKey && handle.length === 2) {
            const ratio = init.width / init.height
            if (newW / newH > ratio) newW = newH * ratio
            else newH = newW / ratio
          }

          if (ref.kind === 'sticker') {
            newData.stickers = newData.stickers.map((s) => s.id === ref.id ? { ...s, x: newX, y: newY, width: newW, height: newH } : s)
          } else if (ref.kind === 'shape') {
            newData.shapes = newData.shapes.map((s) => s.id === ref.id ? { ...s, x: newX, y: newY, width: newW, height: newH } : s)
          } else if (ref.kind === 'note') {
            newData.stickyNotes = newData.stickyNotes.map((n) => n.id === ref.id ? { ...n, x: newX, y: newY, width: newW, height: newH } : n)
          } else if (ref.kind === 'text') {
            // Resize text = change fontSize proportionally
            const heightRatio = newH / (init.height ?? 1)
            const newFontSize = Math.max(8, Math.min(200, (init.fontSize ?? 18) * heightRatio))
            newData.texts = newData.texts.map((t) => t.id === ref.id ? { ...t, x: newX, y: newY, fontSize: newFontSize, width: newW } : t)
          }
        }

        useAppStore.getState().updatePageData(plannerId, pageId, newData)
      } else if (transformSession.kind === 'rotate') {
        const cx = transformSession.centerX ?? 0
        const cy = transformSession.centerY ?? 0
        const currentAngle = Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI)
        let delta = currentAngle - (transformSession.startAngle ?? 0)

        // Snap to 15° increments with Shift
        if (e.shiftKey) {
          delta = Math.round(delta / ROTATION_SNAP_DEG) * ROTATION_SNAP_DEG
        }

        for (const ref of transformSession.items) {
          const key = `${ref.kind}:${ref.id}`
          const init = transformSession.initialStates.get(key)
          if (!init) continue
          const newRot = ((init.rotation ?? 0) + delta) % 360

          if (ref.kind === 'sticker') {
            newData.stickers = newData.stickers.map((s) => s.id === ref.id ? { ...s, rotation: newRot } : s)
          } else if (ref.kind === 'shape') {
            newData.shapes = newData.shapes.map((s) => s.id === ref.id ? { ...s, rotation: newRot } : s)
          } else if (ref.kind === 'note') {
            newData.stickyNotes = newData.stickyNotes.map((n) => n.id === ref.id ? { ...n, rotation: newRot } : n)
          } else if (ref.kind === 'text') {
            newData.texts = newData.texts.map((t) => t.id === ref.id ? { ...t, rotation: newRot } : t)
          }
        }

        useAppStore.getState().updatePageData(plannerId, pageId, newData)
      }
      return
    }

    if (!isDrawing) return
    const pt = getPageCoords(e)
    const { activeTool } = useEditorStore.getState()

    if (shapeDraft) {
      setShapeDraft({ ...shapeDraft, endX: pt.x, endY: pt.y })
      return
    }

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

    updateAutoPan(e)
    setCurrentPoints((prev) => [...prev, pt])
  }, [isDrawing, isPanning, panStart, transformSession, shapeDraft, getPageCoords, plannerId, snapValue, computeGuides, updateAutoPan, rulerStart, getItemBounds])

  const handlePointerUp = useCallback((e?: React.PointerEvent) => {
    if (e) {
      activePointersRef.current.delete(e.pointerId)
      if (activePointersRef.current.size < 2) pinchBaselineRef.current = null
      notePointerUp(e)
    }
    stopAutoPan()
    setGuides({ x: [], y: [] })

    const store = useEditorStore.getState()
    const tool = store.activeTool
    const d = dataRef.current

    if (isPanning) {
      setIsPanning(false)
      setPanStart(null)
      return
    }

    // End transform session — commit
    if (transformSession) {
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      commit(newData, dragStartDataRef.current ?? undefined)
      setTransformSession(null)
      dragStartDataRef.current = null
      return
    }

    if (shapeDraft) {
      const w = Math.abs(shapeDraft.endX - shapeDraft.startX)
      const h = Math.abs(shapeDraft.endY - shapeDraft.startY)
      if (w < 4 && h < 4) {
        setIsDrawing(false)
        setShapeDraft(null)
        return
      }
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      const x = Math.min(shapeDraft.startX, shapeDraft.endX)
      const y = Math.min(shapeDraft.startY, shapeDraft.endY)
      const finalH = shapeDraft.kind === 'line' ? Math.max(2, h) : h
      const finalW = shapeDraft.kind === 'line' ? Math.max(20, w) : w
      newData.shapes = [
        ...newData.shapes,
        {
          id: uid(),
          kind: shapeDraft.kind,
          x, y,
          width: finalW,
          height: finalH,
          color: store.shapeColor,
          outline: store.shapeOutline,
          strokeWidth: store.shapeStrokeWidth,
        },
      ]
      commit(newData)
      store.pushLastColor(store.shapeColor)
      setIsDrawing(false)
      setShapeDraft(null)
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
      const inside: CanvasItemRef[] = []
      for (const s of newData.stickers) {
        if (s.locked) continue
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        if (cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY) inside.push({ kind: 'sticker', id: s.id })
      }
      for (const s of newData.shapes) {
        if (s.locked) continue
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        if (cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY) inside.push({ kind: 'shape', id: s.id })
      }
      for (const n of newData.stickyNotes) {
        if (n.locked) continue
        const w = n.width ?? 120
        const h = n.height ?? 120
        const cx = n.x + w / 2
        const cy = n.y + h / 2
        if (cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY) inside.push({ kind: 'note', id: n.id })
      }
      for (const t of newData.texts) {
        if (t.locked) continue
        const w = t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)
        const h = t.fontSize * 1.3
        const cx = t.x + w / 2
        const cy = t.y + h / 2
        if (cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY) inside.push({ kind: 'text', id: t.id })
      }

      if (inside.length > 0) {
        setSelectedItems(inside)
        toast({ title: `${inside.length} item(s) selecionados` })
      } else {
        newData.strokes = newData.strokes.filter((s) => {
          const cx = s.points.reduce((sum, p) => sum + p.x, 0) / s.points.length
          const cy = s.points.reduce((sum, p) => sum + p.y, 0) / s.points.length
          return !(cx >= bbox.minX && cx <= bbox.maxX && cy >= bbox.minY && cy <= bbox.maxY)
        })
        commit(newData)
        toast({ title: 'Traços removidos na área' })
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
        pressureSensitive: false,
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
      const eraserRadius = Math.max(8, store.eraserSize)
      const eraserPoints = currentPoints

      // Helper de hit-test de um ponto contra os pontos da borracha
      const hitsAny = (px: number, py: number, pad = 0) =>
        eraserPoints.some((ep) => Math.hypot(ep.x - px, ep.y - py) < eraserRadius + pad)

      // 1) Apaga stickers cuja área contém um ponto da borracha
      newData.stickers = newData.stickers.filter((s) => {
        const cx = s.x + s.width / 2
        const cy = s.y + s.width / 2 // aproximação: tratar como ~quadrado
        // remove se o centróide for atingido
        return !hitsAny(cx, cy, s.width / 2)
      })

      // 2) Apaga shapes cujo centróide for atingido
      newData.shapes = newData.shapes.filter((s) => {
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        return !hitsAny(cx, cy, Math.max(s.width, s.height) / 2)
      })

      // 3) Apaga sticky notes atingidos
      newData.stickyNotes = newData.stickyNotes.filter((n) => {
        const w = n.width ?? 120
        const h = n.height ?? 120
        const cx = n.x + w / 2
        const cy = n.y + h / 2
        return !hitsAny(cx, cy, Math.max(w, h) / 2)
      })

      // 4) Apaga textos atingidos
      newData.texts = newData.texts.filter((t) => {
        const w = t.width ?? Math.max(20, t.text.length * t.fontSize * 0.58)
        const h = t.fontSize * 1.3
        const cx = t.x + w / 2
        const cy = t.y + h / 2
        return !hitsAny(cx, cy, Math.max(w, h) / 2)
      })

      // 5) Divide/remove strokes atingidos (lógica original melhorada)
      const splitStrokes: Stroke[] = []
      for (const s of newData.strokes) {
        const segments: StrokePoint[][] = [[]]
        for (const sp of s.points) {
          const hit = hitsAny(sp.x, sp.y)
          if (hit) {
            if (segments[segments.length - 1].length > 1) {
              splitStrokes.push({ ...s, id: `${s.id}-${uid()}`, points: [...segments[segments.length - 1]] })
            }
            segments.push([])
          } else {
            segments[segments.length - 1].push(sp)
          }
        }
        // O segmento final (não-atingido) preserva o id original
        if (segments[segments.length - 1].length > 1) {
          splitStrokes.push({ ...s, points: [...segments[segments.length - 1]] })
        } else if (segments.length === 1) {
          // nunca atingido — preserva integralmente
          splitStrokes.push(s)
        }
      }
      newData.strokes = splitStrokes.filter((s) => s.points.length > 1)

      commit(newData)
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    // ── Pen / Pencil / Brush / Marker / Highlighter ──
    const brushStyle = toolToBrushStyle(tool)
    if (brushStyle && currentPoints.length > 1) {
      const epsilon = brushStyle === 'highlighter' ? 0.8 : brushStyle === 'brush' ? 0.5 : 0.3
      const simplified = simplifyPoints(currentPoints, epsilon)
      if (simplified.length < 2) {
        setIsDrawing(false)
        setCurrentPoints([])
        return
      }
      const stroke: Stroke = {
        id: uid(),
        tool: brushStyle,
        color: store.getToolColor(),
        size: store.getToolSize(),
        opacity: store.getToolOpacity(),
        pressureSensitive: store.pressureSensitive,
        points: simplified,
      }
      const newData = JSON.parse(JSON.stringify(d)) as CanvasData
      newData.strokes = [...newData.strokes, stroke]
      commit(newData)
      store.pushLastColor(store.getToolColor())
      setIsDrawing(false)
      setCurrentPoints([])
      return
    }

    setIsDrawing(false)
    setCurrentPoints([])
  }, [
    isDrawing, isPanning, panStart, transformSession, textInput, shapeDraft,
    currentPoints, rulerStart, rulerEnd, commit, stopAutoPan, notePointerUp,
  ])

  const handlePointerCancel = useCallback((e?: React.PointerEvent) => {
    if (e) {
      activePointersRef.current.delete(e.pointerId)
      if (activePointersRef.current.size < 2) pinchBaselineRef.current = null
      notePointerUp(e)
    }
    stopAutoPan()
    setGuides({ x: [], y: [] })
    setIsDrawing(false)
    setCurrentPoints([])
    setRulerStart(null)
    setRulerEnd(null)
    setShapeDraft(null)
    setIsPanning(false)
    setPanStart(null)
    setTransformSession(null)
  }, [stopAutoPan, notePointerUp])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const pt = getPageCoords(e as unknown as React.PointerEvent)
    const hit = hitTestAll(pt.x, pt.y)
    if (hit?.kind === 'text') {
      const d = dataRef.current
      const textItem = d.texts.find(t => t.id === hit.id)
      if (textItem) {
        setTextInput({ x: textItem.x, y: textItem.y, show: true, editingId: textItem.id })
        setTextValue(textItem.text)
      }
    }
  }, [getPageCoords, hitTestAll])

  return {
    isDrawing,
    currentPoints,
    rulerStart,
    rulerEnd,
    shapeDraft,
    textInput,
    textValue,
    setTextValue,
    // New unified selection API
    selectedItems,
    setSelectedItems,
    selectItem,
    getSelectionBounds,
    getItemBounds,
    transformSession,
    // Legacy single-selection (compat)
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
    // Transform starters
    beginMove,
    beginResize,
    beginRotate,
    pickColorAt,
    floodFill,
  } as const
}
