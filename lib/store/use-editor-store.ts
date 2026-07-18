import { create } from 'zustand'
import type { CanvasData, ToolType } from '../types'
import { EMPTY_CANVAS, PAGE_HEIGHT, PAGE_WIDTH } from '../types'

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
  highlighterColor: string
  highlighterSize: number
  highlighterOpacity: number
  rulerColor: string
  rulerSize: number
  rulerOpacity: number
  textColor: string
  textFontSize: number
  textFontFamily: 'sans' | 'serif' | 'hand'
  eraserSize: number

  setPenColor: (c: string) => void
  setPenSize: (n: number) => void
  setPenOpacity: (n: number) => void
  setPencilColor: (c: string) => void
  setPencilSize: (n: number) => void
  setPencilOpacity: (n: number) => void
  setHighlighterColor: (c: string) => void
  setHighlighterSize: (n: number) => void
  setHighlighterOpacity: (n: number) => void
  setRulerColor: (c: string) => void
  setRulerSize: (n: number) => void
  setRulerOpacity: (n: number) => void
  setTextColor: (c: string) => void
  setTextFontSize: (n: number) => void
  setTextFontFamily: (f: 'sans' | 'serif' | 'hand') => void
  setEraserSize: (n: number) => void

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
  undo: (pageId: string) => CanvasData | null
  redo: (pageId: string) => CanvasData | null
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  activeTool: 'pen',

  penColor: '#1a1a1a',
  penSize: 3,
  penOpacity: 1,
  pencilColor: '#555555',
  pencilSize: 2,
  pencilOpacity: 0.8,
  highlighterColor: '#f0b429',
  highlighterSize: 8,
  highlighterOpacity: 0.4,
  rulerColor: '#1a1a1a',
  rulerSize: 2,
  rulerOpacity: 1,
  textColor: '#1a1a1a',
  textFontSize: 18,
  textFontFamily: 'sans',
  eraserSize: 20,

  setActiveTool: (t) => set({ activeTool: t }),

  setPenColor: (c) => set({ penColor: c }),
  setPenSize: (n) => set({ penSize: n }),
  setPenOpacity: (n) => set({ penOpacity: n }),
  setPencilColor: (c) => set({ pencilColor: c }),
  setPencilSize: (n) => set({ pencilSize: n }),
  setPencilOpacity: (n) => set({ pencilOpacity: n }),
  setHighlighterColor: (c) => set({ highlighterColor: c }),
  setHighlighterSize: (n) => set({ highlighterSize: n }),
  setHighlighterOpacity: (n) => set({ highlighterOpacity: n }),
  setRulerColor: (c) => set({ rulerColor: c }),
  setRulerSize: (n) => set({ rulerSize: n }),
  setRulerOpacity: (n) => set({ rulerOpacity: n }),
  setTextColor: (c) => set({ textColor: c }),
  setTextFontSize: (n) => set({ textFontSize: n }),
  setTextFontFamily: (f) => set({ textFontFamily: f }),
  setEraserSize: (n) => set({ eraserSize: n }),

  getToolColor: () => {
    const s = get()
    switch (s.activeTool) {
      case 'pen':
        return s.penColor
      case 'pencil':
        return s.pencilColor
      case 'highlighter':
        return s.highlighterColor
      case 'ruler':
        return s.rulerColor
      case 'text':
        return s.textColor
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

  undo: (pageId) => {
    const s = get()
    const stack = s.undoStack[pageId] ?? []
    if (stack.length === 0) return null
    const current = stack[stack.length - 1]
    const redo = s.redoStack[pageId] ?? []
    set({
      undoStack: {
        ...s.undoStack,
        [pageId]: stack.slice(0, -1),
      },
      redoStack: { ...s.redoStack, [pageId]: [...redo, current] },
    })
    return stack.length > 1 ? stack[stack.length - 2] : EMPTY_CANVAS
  },

  redo: (pageId) => {
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
      undoStack: { ...s.undoStack, [pageId]: [...undo, next] },
    })
    return next
  },
}))
