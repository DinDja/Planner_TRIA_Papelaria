'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Pipette, RotateCcw, Palette } from 'lucide-react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/overlays'
import { ColorWheel } from './color-wheel'

interface ColorPaletteProps {
  /** Cor atual selecionada. */
  color: string
  /** Cores "recentes" (últimas usadas). */
  recent: string[]
  /** Cores fixas da paleta. */
  fixed?: string[]
  onPick: (c: string) => void
  onEyedropper?: () => void
  onClearRecent?: () => void
  /** Modo compacto: mostra apenas recentes + 4 fixas. */
  compact?: boolean
  className?: string
}

const DEFAULT_FIXED = [
  '#1a1a1a', '#4a4a4a', '#e05b6d', '#f0b429', '#7bb686', '#5b8dbf',
  '#c9b6e4', '#e8a0a0', '#d4b070', '#6b5b8a', '#0f766e', '#b45309',
]

/**
 * Paleta de cores unificada do editor. Mostra:
 *  - Cores recentes (últimas 8)
 *  - Paleta fixa padrão
 *  - Botão eyedropper para capturar cor do canvas
 *  - Botão "avançado" que abre a ColorWheel (roda HSL profissional)
 * Touch-friendly: swatches de 32px em mobile.
 */
export function ColorPalette({
  color,
  recent,
  fixed = DEFAULT_FIXED,
  onPick,
  onEyedropper,
  onClearRecent,
  compact = false,
  className,
}: ColorPaletteProps) {
  const [wheelOpen, setWheelOpen] = useState(false)
  const fixedToShow = compact ? fixed.slice(0, 8) : fixed

  return (
    <div className={cn('space-y-3', className)}>
      {/* Recentes */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-muted-foreground">Recentes</p>
            {onClearRecent && (
              <button
                onClick={onClearRecent}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <RotateCcw size={10} />
                limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((c) => (
              <button
                key={`recent-${c}`}
                onClick={() => onPick(c)}
                className={cn(
                  'size-8 md:size-7 rounded-full border-2 transition-all cursor-pointer active:scale-95',
                  c === color
                    ? 'border-foreground ring-2 ring-foreground/30 scale-110'
                    : 'border-border/40 hover:scale-105',
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fixas */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Paleta</p>
        <div className="flex flex-wrap gap-2">
          {fixedToShow.map((c) => (
            <button
              key={c}
              onClick={() => onPick(c)}
              className={cn(
                'size-8 md:size-7 rounded-full border-2 transition-all cursor-pointer active:scale-95',
                c === color
                  ? 'border-foreground ring-2 ring-foreground/30 scale-110'
                  : 'border-border/40 hover:scale-105',
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          {/* Color wheel — botão "avançado". Mantém escolha rápida nas
              swatches, abre a roda HSL só quando o usuário precisa de
              uma cor exata fora dos presets. */}
          <Popover open={wheelOpen} onOpenChange={setWheelOpen}>
            <PopoverTrigger
              className={cn(
                'size-8 md:size-7 rounded-full border-2 border-dashed border-border/60 cursor-pointer',
                'inline-flex items-center justify-center hover:border-foreground/60 active:scale-95 transition-all',
                'bg-[conic-gradient(from_0deg,red,orange,yellow,lime,cyan,blue,magenta,red)]',
              )}
            >
              <Palette size={12} className="text-white mix-blend-difference" />
            </PopoverTrigger>
            <PopoverContent className="w-[230px] p-3" align="center">
              <ColorWheel color={color} onChange={onPick} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Eyedropper */}
      {onEyedropper && (
        <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={onEyedropper}>
          <Pipette size={13} className="mr-1.5" />
          Conta-gotas
        </Button>
      )}
    </div>
  )
}
