'use client'

import { getStroke } from 'perfect-freehand'
import { useCallback, useRef, useState } from 'react'
import type { Stroke, StrokePoint } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Eraser, Undo2 } from 'lucide-react'
import { Button } from '../ui/button'

const uid = () => Math.random().toString(36).slice(2, 10)

const COLORS = ['#1e1e2e', '#e05b6d', '#5b8dbf', '#7bb686', '#f0b429', '#c9b6e4', '#e8a0a0']

function vecToSvgPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  return `M ${points[0][0]} ${points[0][1]} L ${points.slice(1).map((p) => `${p[0]} ${p[1]}`).join(' ')} Z`
}

function strokeToPath(s: Stroke): string {
  try {
    const outline = getStroke(s.points, {
      size: 4,
      thinning: 0.5,
      smoothing: 0.6,
      streamline: 0.4,
    })
    return vecToSvgPath(outline)
  } catch {
    return ''
  }
}

export function HandwritingCanvas({
  strokes,
  onChange,
  className,
}: {
  strokes: Stroke[]
  onChange: (strokes: Stroke[]) => void
  className?: string
}) {
  const [color, setColor] = useState('#1e1e2e')
  const [isDrawing, setIsDrawing] = useState(false)
  const currentPoints = useRef<StrokePoint[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const getPos = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const pos = getPos(e)
    currentPoints.current = [{ x: pos.x, y: pos.y, pressure: e.pressure || 0.5 }]
    setIsDrawing(true)
    svgRef.current?.setPointerCapture(e.pointerId)
  }, [getPos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPos(e)
    currentPoints.current.push({ x: pos.x, y: pos.y, pressure: e.pressure || 0.5 })
    setIsDrawing(true)
  }, [isDrawing, getPos])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || currentPoints.current.length < 2) {
      setIsDrawing(false)
      currentPoints.current = []
      return
    }
    e.preventDefault()
    const newStroke: Stroke = {
      id: `h-${uid()}`,
      tool: 'pen',
      color,
      size: 4,
      opacity: 1,
      points: currentPoints.current,
    }
    onChange([...strokes, newStroke])
    currentPoints.current = []
    setIsDrawing(false)
  }, [isDrawing, color, strokes, onChange])

  const clearAll = () => {
    onChange([])
    currentPoints.current = []
  }

  const undo = () => {
    if (strokes.length === 0) return
    onChange(strokes.slice(0, -1))
  }

  const isPanelEmpty = strokes.length === 0 && currentPoints.current.length === 0

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'size-6 rounded-lg border transition-all cursor-pointer',
                color === c ? 'border-foreground scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl size-8"
            onClick={undo}
            disabled={strokes.length === 0}
            aria-label="Desfazer"
          >
            <Undo2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl size-8 text-muted-foreground hover:text-destructive"
            onClick={clearAll}
            disabled={isPanelEmpty}
            aria-label="Limpar tudo"
          >
            <Eraser size={14} />
          </Button>
        </div>
        {strokes.length > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
            {strokes.length} {strokes.length === 1 ? 'traço' : 'traços'}
          </span>
        )}
      </div>

      {/* Drawing surface */}
      <div className="relative rounded-xl border border-border/60 bg-background overflow-hidden touch-none select-none" style={{ minHeight: 180 }}>
        <svg
          ref={svgRef}
          className="size-full"
          style={{ touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { setIsDrawing(false); currentPoints.current = [] }}
        >
          {/* finalized strokes */}
          {strokes.map((s) => {
            const d = strokeToPath(s)
            if (!d) return null
            return (
              <path
                key={s.id}
                d={d}
                fill={s.color}
                stroke="none"
              />
            )
          })}
          {/* live preview */}
          {isDrawing && currentPoints.current.length >= 2 && (
            <path
              d={vecToSvgPath(currentPoints.current.map((p) => [p.x, p.y]))}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />
          )}
        </svg>

        {/* Empty state */}
        {isPanelEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground/40 select-none">
              Escreva ou desenhe aqui
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function DrawingPreview({ strokes, className }: { strokes: Stroke[]; className?: string }) {
  if (!strokes || strokes.length === 0) return null

  // compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of strokes) {
    for (const p of s.points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const pad = 10

  return (
    <div className={cn('rounded-xl border border-border/40 bg-background p-2', className)}>
      <svg
        viewBox={`${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxHeight: 120 }}
      >
        {strokes.map((s) => {
          const d = strokeToPath(s)
          if (!d) return null
          return <path key={s.id} d={d} fill={s.color} stroke="none" />
        })}
      </svg>
    </div>
  )
}
