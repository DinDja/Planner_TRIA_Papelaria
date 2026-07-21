'use client'

import type { CanvasItemRef } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  BringToFront,
  Columns3,
  Copy,
  Lock,
  RotateCw,
  Rows3,
  SendToBack,
  Trash2,
  Unlock,
  X,
} from 'lucide-react'

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface SelectionOverlayProps {
  bounds: { x: number; y: number; width: number; height: number }
  displayScale: number
  items: CanvasItemRef[]
  showRotate?: boolean
  opacity?: number
  onStartResize: (handle: ResizeHandle, e: React.PointerEvent) => void
  onStartRotate?: (e: React.PointerEvent) => void
  onDelete?: () => void
  onDuplicate?: () => void
  onToggleLock?: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
  onAlignLeft?: () => void
  onAlignCenterH?: () => void
  onAlignRight?: () => void
  onAlignTop?: () => void
  onAlignCenterV?: () => void
  onAlignBottom?: () => void
  onDistributeH?: () => void
  onDistributeV?: () => void
  onRotate90?: () => void
  onClose?: () => void
  onOpacityChange?: (opacity: number) => void
  multiSelect?: boolean
  primaryLocked?: boolean
  /** Valor atual de opacidade (0..1) do item primário. */
  primaryOpacity?: number
}

const HANDLE_SIZE = 12
const ROTATE_HANDLE_DISTANCE = 28

/**
 * SelectionOverlay nível Canva:
 * - Bounding box em primary com traço sólido
 * - 8 handles de resize (cantos maiores, meios menores)
 * - Handle de rotate acima do centro superior
 * - Toolbar flutuante com ações rápidas
 * - Suporte a multi-seleção (align/distribute)
 */
export function SelectionOverlay({
  bounds,
  displayScale,
  items,
  showRotate = true,
  opacity = 1,
  onStartResize,
  onStartRotate,
  onDelete,
  onDuplicate,
  onToggleLock,
  onBringToFront,
  onSendToBack,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  onRotate90,
  onClose,
  onOpacityChange,
  multiSelect = false,
  primaryLocked = false,
  primaryOpacity = 1,
}: SelectionOverlayProps) {
  const x = bounds.x * displayScale
  const y = bounds.y * displayScale
  const w = bounds.width * displayScale
  const h = bounds.height * displayScale

  // 8 resize handles positioned around bounding box
  const handles: { id: ResizeHandle; left: number; top: number; cursor: string; size: number }[] = [
    { id: 'nw', left: x - HANDLE_SIZE / 2, top: y - HANDLE_SIZE / 2, cursor: 'nwse-resize', size: HANDLE_SIZE },
    { id: 'n',  left: x + w / 2 - HANDLE_SIZE / 2, top: y - HANDLE_SIZE / 2, cursor: 'ns-resize', size: HANDLE_SIZE - 2 },
    { id: 'ne', left: x + w - HANDLE_SIZE / 2, top: y - HANDLE_SIZE / 2, cursor: 'nesw-resize', size: HANDLE_SIZE },
    { id: 'e',  left: x + w - HANDLE_SIZE / 2, top: y + h / 2 - HANDLE_SIZE / 2, cursor: 'ew-resize', size: HANDLE_SIZE - 2 },
    { id: 'se', left: x + w - HANDLE_SIZE / 2, top: y + h - HANDLE_SIZE / 2, cursor: 'nwse-resize', size: HANDLE_SIZE },
    { id: 's',  left: x + w / 2 - HANDLE_SIZE / 2, top: y + h - HANDLE_SIZE / 2, cursor: 'ns-resize', size: HANDLE_SIZE - 2 },
    { id: 'sw', left: x - HANDLE_SIZE / 2, top: y + h - HANDLE_SIZE / 2, cursor: 'nesw-resize', size: HANDLE_SIZE },
    { id: 'w',  left: x - HANDLE_SIZE / 2, top: y + h / 2 - HANDLE_SIZE / 2, cursor: 'ew-resize', size: HANDLE_SIZE - 2 },
  ]

  // Rotate handle (above center-top)
  const rotateX = x + w / 2
  const rotateY = y - ROTATE_HANDLE_DISTANCE

  return (
    <>
      {/* Bounding box */}
      <div
        className="absolute pointer-events-none border-2 border-primary rounded-[2px]"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          opacity,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
        }}
      />

      {/* Resize handles */}
      {!primaryLocked && handles.map((hd) => (
        <div
          key={hd.id}
          className={cn(
            'absolute bg-white border-2 border-primary rounded-[2px] shadow-sm transition-transform hover:scale-125 z-10',
          )}
          style={{
            left: hd.left,
            top: hd.top,
            width: hd.size,
            height: hd.size,
            cursor: hd.cursor,
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            onStartResize(hd.id, e)
          }}
        />
      ))}

      {/* Rotate handle */}
      {!primaryLocked && showRotate && onStartRotate && (
        <>
          {/* Line connecting bbox to rotate handle */}
          <div
            className="absolute pointer-events-none bg-primary"
            style={{
              left: rotateX - 0.5,
              top: rotateY + HANDLE_SIZE / 2,
              width: 1,
              height: ROTATE_HANDLE_DISTANCE - HANDLE_SIZE / 2,
            }}
          />
          <div
            className="absolute size-4 bg-primary rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing z-10 transition-transform hover:scale-110"
            style={{
              left: rotateX - HANDLE_SIZE / 2,
              top: rotateY - HANDLE_SIZE / 2,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onStartRotate(e)
            }}
          >
            <RotateCw size={10} className="text-white absolute inset-0 m-auto" />
          </div>
        </>
      )}

      {/* Floating toolbar above the selection */}
      <div
        className="absolute z-20 flex items-center gap-0.5 px-1 py-1 rounded-xl bg-popover border border-border/50 shadow-lg pointer-events-auto"
        style={{
          left: Math.max(4, x),
          top: Math.max(4, rotateY - 44),
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {onDelete && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={onDelete}
            title="Excluir (Del)"
          >
            <Trash2 size={13} />
          </button>
        )}
        {onDuplicate && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onDuplicate}
            title="Duplicar (Ctrl+D)"
          >
            <Copy size={13} />
          </button>
        )}
        {onToggleLock && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onToggleLock}
            title={primaryLocked ? 'Desbloquear' : 'Bloquear'}
          >
            {primaryLocked ? <Unlock size={13} /> : <Lock size={13} />}
          </button>
        )}
        <div className="w-px h-4 bg-border/60 mx-0.5" />
        {onBringToFront && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onBringToFront}
            title="Trazer p/ frente"
          >
            <BringToFront size={13} />
          </button>
        )}
        {onSendToBack && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onSendToBack}
            title="Enviar p/ trás"
          >
            <SendToBack size={13} />
          </button>
        )}
        {onRotate90 && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
            onClick={onRotate90}
            title="Girar 90°"
          >
            <RotateCw size={13} />
          </button>
        )}
        {multiSelect && (
          <>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            {onAlignLeft && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignLeft}
                title="Alinhar à esquerda"
              >
                <AlignStartVertical size={13} />
              </button>
            )}
            {onAlignCenterH && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignCenterH}
                title="Alinhar centro horizontal"
              >
                <AlignCenterVertical size={13} />
              </button>
            )}
            {onAlignRight && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignRight}
                title="Alinhar à direita"
              >
                <AlignEndVertical size={13} />
              </button>
            )}
            {onAlignTop && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignTop}
                title="Alinhar ao topo"
              >
                <AlignStartHorizontal size={13} />
              </button>
            )}
            {onAlignCenterV && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignCenterV}
                title="Alinhar centro vertical"
              >
                <AlignCenterHorizontal size={13} />
              </button>
            )}
            {onAlignBottom && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onAlignBottom}
                title="Alinhar à base"
              >
                <AlignEndHorizontal size={13} />
              </button>
            )}
            {onDistributeH && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onDistributeH}
                title="Distribuir horizontalmente"
              >
                <Columns3 size={13} />
              </button>
            )}
            {onDistributeV && (
              <button
                className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors"
                onClick={onDistributeV}
                title="Distribuir verticalmente"
              >
                <Rows3 size={13} />
              </button>
            )}
          </>
        )}
        {!primaryLocked && onOpacityChange && !multiSelect && (
          <>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            <div className="flex items-center gap-1 px-1.5" title="Opacidade">
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={primaryOpacity}
                onChange={(e) => onOpacityChange(Number(e.target.value))}
                className="w-14 h-1 accent-primary"
                onPointerDown={(e) => e.stopPropagation()}
              />
              <span className="text-[9px] text-muted-foreground w-6 text-right tabular-nums">
                {Math.round(primaryOpacity * 100)}%
              </span>
            </div>
          </>
        )}
        {onClose && (
          <button
            className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-muted transition-colors ml-0.5"
            onClick={onClose}
            title="Fechar seleção (Esc)"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </>
  )
}
