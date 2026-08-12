'use client'

import { useMemo } from 'react'
import { getStroke } from 'perfect-freehand'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ToolType } from '@/lib/types'
import { brushStyleOptions, toolToBrushStyle } from '@/lib/store/use-editor-store'

interface CanvasToolControlsProps {
  tool: ToolType
  size: number
  opacity: number
  color: string
  /** Recolhe/desaparece quando suprimido (drawing ativo OU sem tool ajustável). */
  suppressed: boolean
  /** Dispositivo de toque? Quando verdadeiro, posiciona p/ topo-central, evitando colisão c/ dock. */
  touchPlaced?: boolean
  onSizeChange: (n: number) => void
  onOpacityChange: (n: number) => void
}

/** Tools que têm tamanho controlável. */
const SIZE_TOOLS: ToolType[] = [
  'pen',
  'pencil',
  'brush',
  'marker',
  'highlighter',
  'ruler',
  'eraser',
  'rectangle',
  'ellipse',
  'line',
  'arrow',
]

/** Tools que têm opacidade controlável. */
const OPACITY_TOOLS: ToolType[] = [
  'pen',
  'pencil',
  'brush',
  'marker',
  'highlighter',
  'ruler',
]

/** Limites de espessura por tool. */
function sizeRange(tool: ToolType): { min: number; max: number; step: number } {
  switch (tool) {
    case 'highlighter':
      return { min: 1, max: 30, step: 1 }
    case 'brush':
      return { min: 1, max: 24, step: 1 }
    case 'eraser':
      return { min: 4, max: 80, step: 1 }
    case 'rectangle':
    case 'ellipse':
    case 'line':
    case 'arrow':
      return { min: 1, max: 10, step: 0.5 }
    default:
      return { min: 0.5, max: 12, step: 0.5 }
  }
}

/**
 * Slider de espessura/opacidade que aparece sobre o canvas quando
 * ferramentas de traço estão ativas — sketchbook-grade: sem sheet,
 * sem popover, controle direto no canvas com feedback ao vivo.
 *
 *  - Posicionamento: no desktop, canto superior direito da tela; no
 *    mobile, no canto superior esquerdo (longe do FloatingDock).
 *  - Recolhe automaticamente quando a ferramenta não tem ajustes.
 *  - Traço de preview real (perfect-freehand getStroke) mostra o
 *    pincel ao vivo, na cor e espessura atuais.
 *  - Pílulas numéricas (12px / 65%) seguem o slider p/ feedback.
 *  - Sliders sempre horizontais (vertical range quebra hit-test em
 *    Safari/Firefox mobile — mantemos familiares e previsíveis).
 */
export function CanvasToolControls({
  tool,
  size,
  opacity,
  color,
  suppressed,
  touchPlaced = false,
  onSizeChange,
  onOpacityChange,
}: CanvasToolControlsProps) {
  const showSize = SIZE_TOOLS.includes(tool)
  const showOpacity = OPACITY_TOOLS.includes(tool)
  const visible = (showSize || showOpacity) && !suppressed
  const range = useMemo(() => sizeRange(tool), [tool])

  // ─── Traço de preview (perfect-freehand) ──────────────────────
  const previewPath = useMemo(() => {
    const brush = toolToBrushStyle(tool)
    if (!brush) return null
    const opts = brushStyleOptions(brush, size)
    const pts: { x: number; y: number; pressure: number }[] = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const x = t * 56
      const pressure = brush === 'highlighter' || brush === 'marker' ? 0.5 : 0.3 + Math.sin(t * Math.PI) * 0.6
      pts.push({ x, y: 16, pressure })
    }
    try {
      const stroke = getStroke(pts, opts)
      return `M ${stroke.map((p) => `${p[0]} ${p[1]}`).join(' L ')}`
    } catch {
      return null
    }
  }, [tool, size])

  const previewOpacity =
    tool === 'highlighter' ? 0.6 :
    tool === 'marker' ? 1 :
    Math.min(1, opacity * 0.95)
  const previewBlend = tool === 'highlighter'

  const stopAndConsume = (e: React.PointerEvent) => {
    // Impede que pointer events cheguem ao canvas (que dispararia beginDraw)
    e.stopPropagation()
  }
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (Number.isFinite(v)) onSizeChange(v)
  }
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (Number.isFinite(v)) onOpacityChange(v)
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.96 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed z-30 select-none pointer-events-auto',
          touchPlaced
            ? 'left-3 top-3'
            : 'right-3 top-16',
        )}
        onPointerDown={stopAndConsume}
        onPointerMove={stopAndConsume}
        onPointerUp={stopAndConsume}
      >
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2',
            'rounded-2xl bg-card/92 backdrop-blur-md',
            'border border-border/40',
            'shadow-[0_4px_14px_-2px_rgb(0_0_0_/_0.18),0_1px_3px_rgb(0_0_0_/_0.06)]',
          )}
          role="group"
          aria-label="Controles da ferramenta"
        >
          {/* Preview real do traço */}
          {previewPath && (
            <svg width="56" height="32" viewBox="0 0 56 32" className="overflow-visible shrink-0">
              <path
                d={previewPath}
                fill={color}
                opacity={previewOpacity}
                style={previewBlend ? { mixBlendMode: 'multiply' as const } : undefined}
              />
            </svg>
          )}

          {/* Slider de espessura */}
          {showSize && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide hidden md:inline">
                size
              </span>
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={size}
                onChange={handleSizeChange}
                aria-label="Espessura"
                className="w-24 md:w-28 accent-primary cursor-pointer"
                style={{ height: '1.5rem' }}
              />
              <span
                className="inline-flex items-center justify-center shrink-0 min-w-[2.5rem] text-center text-[11px] font-medium tabular-nums"
                style={{ color: 'var(--foreground)' }}
                aria-hidden
              >
                {size}px
              </span>
            </label>
          )}

          {/* Separador */}
          {showSize && showOpacity && (
            <div className="w-px h-6 bg-border/40 shrink-0" />
          )}

          {/* Slider de opacidade */}
          {showOpacity && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide hidden md:inline">
                opac
              </span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={handleOpacityChange}
                aria-label="Opacidade"
                className="w-20 md:w-24 accent-primary cursor-pointer"
                style={{ height: '1.5rem' }}
              />
              <span
                className="inline-flex items-center justify-center shrink-0 min-w-[2.5rem] text-center text-[11px] font-medium tabular-nums"
                style={{ color: 'var(--foreground)' }}
                aria-hidden
              >
                {Math.round(opacity * 100)}%
              </span>
            </label>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
