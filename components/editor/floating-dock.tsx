'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, GripHorizontal, Redo2, Undo2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ToolType } from '@/lib/types'

type ToolIcon = React.ComponentType<{ size?: number; className?: string }>
type ToolMeta = { id: ToolType; icon: ToolIcon; label: string }

interface FloatingDockProps {
  /** Ferramentas primárias mostradas no pill expandido (mobile). */
  primary: ToolMeta[]
  /** Demais ferramentas (no "mais"). */
  secondary: ToolMeta[]
  activeTool: ToolType
  currentColor: string
  /** Quando verdadeiro, o dock recolhe totalmente (pointerdown no canvas, desenho ativo). */
  suppressed: boolean
  canUndo: boolean
  canRedo: boolean
  onSelectTool: (t: ToolType) => void
  onOpenMore: () => void
  onOpenSettings: () => void
  onUndo: () => void
  onRedo: () => void
}

/**
 * Dock flutuante contextual. No mobile é um pill recolhível que some
 * completamente enquanto a caneta toca o canvas (suppressed=true).
 * Substitui a dock horizontal poluída do rodapé mobile.
 *
 * Estados de visibilidade:
 *  1. idle/recolhido: pill pequeno c/ tool ativa + cor.
 *  2. expandido: dock completa horizontal. Fecha ao tapping fora.
 *  3. suprimido: opacity 0 + pointer-events none (durante drawing).
 *
 * Decisões:
 *  - Não usa glass/blur decorativo: surface sólido (var(--card)).
 *  - Uma única animação 200ms exponential ease-out expandindo/recolhendo.
 *  - Cor atual como swatch inline (não botão isolado) p/ reduzir targets.
 *  - Undo/Redo no pill expandido (não sempre visível) p/ reduzir poluição.
 */
export function FloatingDock({
  primary,
  secondary,
  activeTool,
  currentColor,
  suppressed,
  canUndo,
  canRedo,
  onSelectTool,
  onOpenMore,
  onOpenSettings,
  onUndo,
  onRedo,
}: FloatingDockProps) {
  const [expanded, setExpanded] = useState(false)

  // Recolhe automaticamente quando suprimido (drawing)
  useEffect(() => {
    if (suppressed) setExpanded(false)
  }, [suppressed])

  const activeToolMeta =
    primary.find((t) => t.id === activeTool) ??
    secondary.find((t) => t.id === activeTool)

  const handlePillTap = useCallback(() => {
    setExpanded((v) => !v)
  }, [])

  const handleToolTap = useCallback(
    (id: ToolType) => {
      onSelectTool(id)
      setExpanded(false)
    },
    [onSelectTool],
  )

  return (
    <div
      className={cn(
        'fixed z-40 left-1/2 -translate-x-1/2',
        'inset-x-3 max-w-[min(100vw-1.5rem,fit-content)] mx-auto',
        // safe area inferior em notched/touch bars
        'bottom-[calc(env(safe-area-inset-bottom)+0.5rem)]',
        'flex justify-center',
        'transition-opacity duration-200 ease-out',
        suppressed ? 'opacity-0 pointer-events-none' : 'opacity-100',
      )}
      role="toolbar"
      aria-label="Ferramentas do editor"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {!expanded ? (
          // ── Pill recolhido ──
          <motion.button
            key="pill"
            layout
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={handlePillTap}
            aria-expanded={false}
            aria-label="Abrir ferramentas"
            className={cn(
              'flex items-center gap-1.5 h-12',
              'rounded-full px-2.5',
              'bg-card/95 backdrop-blur-md shadow-[0_4px_14px_-2px_rgb(0_0_0_/_0.18),0_1px_3px_rgb(0_0_0_/_0.06)]',
              'border border-border/40',
              'active:scale-95 transition-transform',
            )}
          >
            {/* Tool ativa */}
            {activeToolMeta && (
              <activeToolMeta.icon size={18} className="text-foreground" />
            )}
            {/* Swatch de cor atual */}
            <span
              className="size-4 rounded-full border border-black/10 dark:border-white/15 shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.1)]"
              style={{ backgroundColor: currentColor }}
              aria-label={`Cor atual ${currentColor}`}
            />
            {/* Chevron sugerindo expansão */}
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <ChevronUp
                size={14}
                className="transition-transform group-hover/button:scale-110"
              />
            </span>
          </motion.button>
        ) : (
          // ── Dock expandida ──
          <motion.div
            key="dock"
            layout
            initial={{ scale: 0.9, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'flex items-center gap-0.5 flex-wrap justify-center',
              'rounded-2xl px-2 py-1.5',
              'bg-card/95 backdrop-blur-md shadow-[0_8px_28px_-4px_rgb(0_0_0_/_0.22),0_2px_6px_rgb(0_0_0_/_0.08)]',
              'border border-border/40',
            )}
          >
            {/* Ferramentas primárias */}
            {primary.map((tool) => (
              <DockTool
                key={tool.id}
                tool={tool}
                active={tool.id === activeTool}
                onClick={() => handleToolTap(tool.id)}
              />
            ))}

            {/* Separador */}
            <div className="mx-0.5 h-6 w-px bg-border/50" />

            {/* Mais ferramentas */}
            <button
              onClick={onOpenMore}
              aria-label="Mais ferramentas"
              className={cn(
                'size-10 inline-flex items-center justify-center',
                'rounded-xl transition-all active:scale-95',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                'cursor-pointer',
              )}
            >
              <GripHorizontal size={18} />
            </button>

            {/* Separador */}
            <div className="mx-0.5 h-6 w-px bg-border/50" />

            {/* Undo / Redo */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Desfazer"
              className={cn(
                'size-10 inline-flex items-center justify-center',
                'rounded-xl transition-all active:scale-95',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                'disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
                'cursor-pointer disabled:cursor-not-allowed',
              )}
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Refazer"
              className={cn(
                'size-10 inline-flex items-center justify-center',
                'rounded-xl transition-all active:scale-95',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                'disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground',
                'cursor-pointer disabled:cursor-not-allowed',
              )}
            >
              <Redo2 size={18} />
            </button>

            {/* Separador */}
            <div className="mx-0.5 h-6 w-px bg-border/50" />

            {/* Botão de cor / settings (dá p/ tocar no color picker rapidamente) */}
            <button
              onClick={onOpenSettings}
              aria-label="Configurações da ferramenta e cor"
              className={cn(
                'size-10 inline-flex items-center justify-center',
                'rounded-xl transition-all active:scale-95',
                'hover:bg-muted cursor-pointer',
              )}
            >
              <span
                className="size-5 rounded-full border border-border shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)]"
                style={{ backgroundColor: currentColor }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tool button interno ────────────────────────────────────────────

interface DockToolProps {
  tool: ToolMeta
  active: boolean
  onClick: () => void
}

function DockTool({ tool, active, onClick }: DockToolProps) {
  const Icon = tool.icon
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={tool.label}
      title={tool.label}
      className={cn(
        'size-10 inline-flex items-center justify-center',
        'rounded-xl transition-all active:scale-95',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        'cursor-pointer',
      )}
    >
      <Icon size={18} />
    </button>
  )
}
