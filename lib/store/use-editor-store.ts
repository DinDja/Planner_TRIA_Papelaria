import { create } from 'zustand'
import type { CanvasData, ToolType, BrushStyle } from '../types'

interface EditorState {
  // Tool
  activeTool: ToolType
  setActiveTool: (t: ToolType) => void

  // Tool colors (per tool)
  penColor: string
  penSize: number
  penOpacity: number
  pencilColor: string
  pencilSize: number
  pencilOpacity: number
  brushColor: string
  brushSize: number
  brushOpacity: number
  markerColor: string
  markerSize: number
  markerOpacity: number
  highlighterColor: string
  highlighterSize: number
  highlighterOpacity: number
  rulerColor: string
  rulerSize: number
  rulerOpacity: number
  textColor: string
  textFontSize: number
  textFontFamily: 'sans' | 'serif' | 'hand'
  shapeColor: string
  shapeOutline: boolean
  shapeStrokeWidth: number
  fillColor: string
  eraserSize: number

  setPenColor: (c: string) => void
  setPenSize: (n: number) => void
  setPenOpacity: (n: number) => void
  setPencilColor: (c: string) => void
  setPencilSize: (n: number) => void
  setPencilOpacity: (n: number) => void
  setBrushColor: (c: string) => void
  setBrushSize: (n: number) => void
  setBrushOpacity: (n: number) => void
  setMarkerColor: (c: string) => void
  setMarkerSize: (n: number) => void
  setMarkerOpacity: (n: number) => void
  setHighlighterColor: (c: string) => void
  setHighlighterSize: (n: number) => void
  setHighlighterOpacity: (n: number) => void
  setRulerColor: (c: string) => void
  setRulerSize: (n: number) => void
  setRulerOpacity: (n: number) => void
  setTextColor: (c: string) => void
  setTextFontSize: (n: number) => void
  setTextFontFamily: (f: 'sans' | 'serif' | 'hand') => void
  setShapeColor: (c: string) => void
  setShapeOutline: (b: boolean) => void
  setShapeStrokeWidth: (n: number) => void
  setFillColor: (c: string) => void
  setEraserSize: (n: number) => void

  /** Ultima cor usada (qualquer tool). Para o eyedropper e paleta recente. */
  lastColors: string[]
  /** Adiciona cor ao historico de recentes (max 8, sem duplicar). */
  pushLastColor: (c: string) => void
  /** Reseta historico de recentes. */
  clearLastColors: () => void

  /** Se verdadeiro, traços sao pressure-sensitive usando a pressao real do pointer. */
  pressureSensitive: boolean
  setPressureSensitive: (b: boolean) => void

  /** Snap-to-grid ao arrastar shapes / stickers. */
  snappingEnabled: boolean
  setSnappingEnabled: (b: boolean) => void
  /** Tamanho do grid de snap em px (espaco logico do canvas). */
  snapGridSize: number
  setSnapGridSize: (n: number) => void

  /** Mostrar guias de alinhamento (linhas tracejadas). */
  alignmentGuides: boolean
  setAlignmentGuides: (b: boolean) => void

  /** Clipboard interno do editor (Ctrl+C/V/X). Armazena itens copiados. */
  clipboard: {
    stickers: import('../types').StickerInstance[]
    shapes: import('../types').ShapeItem[]
    stickyNotes: import('../types').StickyNote[]
    texts: import('../types').TextItem[]
  } | null
  setClipboard: (c: EditorState['clipboard']) => void

  // Derived: current tool's color/size/opacity
  getToolColor: () => string
  getToolSize: () => number
  getToolOpacity: () => number

  // View
  zoom: number
  panX: number
  panY: number
  pageRotation: number
  setZoom: (z: number) => void
  zoomIn: () => void
  zoomOut: () => void
  fitToScreen: () => void
  setPan: (x: number, y: number) => void
  setPageRotation: (deg: number) => void
  toggleRotation: () => void

  // Ruler state
  rulerAngle: number
  setRulerAngle: (a: number) => void

  // History per page (undo / redo)
  // Keyed by pageId
  undoStack: Record<string, CanvasData[]>
  redoStack: Record<string, CanvasData[]>
  pushHistory: (pageId: string, data: CanvasData) => void
  undo: (pageId: string, current: CanvasData) => CanvasData | null
  redo: (pageId: string, current: CanvasData) => CanvasData | null
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  activeTool: 'pen',

  penColor: '#1a1a1a',
  penSize: 3,
  penOpacity: 1,
  pencilColor: '#555555',
  pencilSize: 2,
  pencilOpacity: 0.8,
  brushColor: '#1a1a1a',
  brushSize: 6,
  brushOpacity: 1,
  markerColor: '#1a1a1a',
  markerSize: 5,
  markerOpacity: 1,
  highlighterColor: '#f0b429',
  highlighterSize: 8,
  highlighterOpacity: 0.4,
  rulerColor: '#1a1a1a',
  rulerSize: 2,
  rulerOpacity: 1,
  textColor: '#1a1a1a',
  textFontSize: 18,
  textFontFamily: 'sans',
  shapeColor: '#e05b6d',
  shapeOutline: false,
  shapeStrokeWidth: 3,
  fillColor: '#7bb686',
  eraserSize: 20,

  setActiveTool: (t) => set({ activeTool: t }),

  setPenColor: (c) => set({ penColor: c }),
  setPenSize: (n) => set({ penSize: n }),
  setPenOpacity: (n) => set({ penOpacity: n }),
  setPencilColor: (c) => set({ pencilColor: c }),
  setPencilSize: (n) => set({ pencilSize: n }),
  setPencilOpacity: (n) => set({ pencilOpacity: n }),
  setBrushColor: (c) => set({ brushColor: c }),
  setBrushSize: (n) => set({ brushSize: n }),
  setBrushOpacity: (n) => set({ brushOpacity: n }),
  setMarkerColor: (c) => set({ markerColor: c }),
  setMarkerSize: (n) => set({ markerSize: n }),
  setMarkerOpacity: (n) => set({ markerOpacity: n }),
  setHighlighterColor: (c) => set({ highlighterColor: c }),
  setHighlighterSize: (n) => set({ highlighterSize: n }),
  setHighlighterOpacity: (n) => set({ highlighterOpacity: n }),
  setRulerColor: (c) => set({ rulerColor: c }),
  setRulerSize: (n) => set({ rulerSize: n }),
  setRulerOpacity: (n) => set({ rulerOpacity: n }),
  setTextColor: (c) => set({ textColor: c }),
  setTextFontSize: (n) => set({ textFontSize: n }),
  setTextFontFamily: (f) => set({ textFontFamily: f }),
  setShapeColor: (c) => set({ shapeColor: c }),
  setShapeOutline: (b) => set({ shapeOutline: b }),
  setShapeStrokeWidth: (n) => set({ shapeStrokeWidth: n }),
  setFillColor: (c) => set({ fillColor: c }),
  setEraserSize: (n) => set({ eraserSize: n }),

  lastColors: [],
  pushLastColor: (c) =>
    set((s) => {
      const next = [c, ...s.lastColors.filter((x) => x !== c)]
      return { lastColors: next.slice(0, 8) }
    }),
  clearLastColors: () => set({ lastColors: [] }),

  pressureSensitive: true,
  setPressureSensitive: (b) => set({ pressureSensitive: b }),

  snappingEnabled: false,
  setSnappingEnabled: (b) => set({ snappingEnabled: b }),
  snapGridSize: 8,
  setSnapGridSize: (n) => set({ snapGridSize: Math.max(2, n) }),

  alignmentGuides: true,
  setAlignmentGuides: (b) => set({ alignmentGuides: b }),

  clipboard: null,
  setClipboard: (c) => set({ clipboard: c }),

  getToolColor: () => {
    const s = get()
    switch (s.activeTool) {
      case 'pen':
        return s.penColor
      case 'pencil':
        return s.pencilColor
      case 'brush':
        return s.brushColor
      case 'marker':
        return s.markerColor
      case 'highlighter':
        return s.highlighterColor
      case 'ruler':
        return s.rulerColor
      case 'text':
        return s.textColor
      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'arrow':
        return s.shapeColor
      case 'fill':
        return s.fillColor
      case 'eyedropper':
        return s.penColor
      default:
        return '#000000'
    }
  },

  getToolSize: () => {
    const s = get()
    switch (s.activeTool) {
      case 'pen':
        return s.penSize
      case 'pencil':
        return s.pencilSize
      case 'brush':
        return s.brushSize
      case 'marker':
        return s.markerSize
      case 'highlighter':
        return s.highlighterSize
      case 'ruler':
        return s.rulerSize
      case 'eraser':
        return s.eraserSize
      default:
        return 3
    }
  },

  getToolOpacity: () => {
    const s = get()
    switch (s.activeTool) {
      case 'pen':
        return s.penOpacity
      case 'pencil':
        return s.pencilOpacity
      case 'brush':
        return s.brushOpacity
      case 'marker':
        return s.markerOpacity
      case 'highlighter':
        return s.highlighterOpacity
      case 'ruler':
        return s.rulerOpacity
      default:
        return 1
    }
  },

  zoom: 1,
  panX: 0,
  panY: 0,
  pageRotation: 0,
  setZoom: (z) => set({ zoom: Math.min(4, Math.max(0.2, z)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(4, s.zoom * 1.15) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.2, s.zoom / 1.15) })),
  fitToScreen: () => set({ zoom: 1, panX: 0, panY: 0 }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setPageRotation: (deg) => set({ pageRotation: deg }),
  toggleRotation: () =>
    set((s) => ({
      pageRotation: (s.pageRotation + 90) % 360,
    })),

  rulerAngle: 0,
  setRulerAngle: (a) => set({ rulerAngle: a }),

  undoStack: {},
  redoStack: {},

  pushHistory: (pageId, data) =>
    set((s) => {
      const stack = s.undoStack[pageId] ?? []
      return {
        undoStack: { ...s.undoStack, [pageId]: [...stack.slice(-50), data] },
        redoStack: { ...s.redoStack, [pageId]: [] },
      }
    }),

  undo: (pageId, current) => {
    const s = get()
    const stack = s.undoStack[pageId] ?? []
    if (stack.length === 0) return null
    const prev = stack[stack.length - 1]
    const redo = s.redoStack[pageId] ?? []
    set({
      undoStack: {
        ...s.undoStack,
        [pageId]: stack.slice(0, -1),
      },
      redoStack: { ...s.redoStack, [pageId]: [...redo, current] },
    })
    return prev
  },

  redo: (pageId, current) => {
    const s = get()
    const stack = s.redoStack[pageId] ?? []
    if (stack.length === 0) return null
    const next = stack[stack.length - 1]
    const undo = s.undoStack[pageId] ?? []
    set({
      redoStack: {
        ...s.redoStack,
        [pageId]: stack.slice(0, -1),
      },
      undoStack: { ...s.undoStack, [pageId]: [...undo, current] },
    })
    return next
  },
}))

/** Mapeia ToolType -> BrushStyle (para perfect-freehand). Tools que nao
 *  produzem tracos (lasso, text, pan, etc.) retornam null. */
export function toolToBrushStyle(tool: ToolType): BrushStyle | null {
  switch (tool) {
    case 'pen':
      return 'pen'
    case 'pencil':
      return 'pencil'
    case 'brush':
      return 'brush'
    case 'marker':
      return 'marker'
    case 'highlighter':
      return 'highlighter'
    default:
      return null
  }
}

/** Parametros perfect-freehand por estilo de pincel. */
export function brushStyleOptions(
  style: BrushStyle,
  baseSize: number,
): { size: number; thinning: number; smoothing: number; streamline: number; simulatePressure: boolean } {
  switch (style) {
    case 'pen':
      return { size: baseSize, thinning: 0.5, smoothing: 0.6, streamline: 0.4, simulatePressure: true }
    case 'pencil':
      return { size: baseSize, thinning: 0.8, smoothing: 0.5, streamline: 0.3, simulatePressure: true }
    case 'brush':
      return { size: baseSize * 1.8, thinning: 1.2, smoothing: 0.7, streamline: 0.5, simulatePressure: true }
    case 'marker':
      return { size: baseSize, thinning: 0.1, smoothing: 0.85, streamline: 0.7, simulatePressure: false }
    case 'highlighter':
      return { size: baseSize * 1.5, thinning: 0.2, smoothing: 0.6, streamline: 0.4, simulatePressure: false }
  }
}

