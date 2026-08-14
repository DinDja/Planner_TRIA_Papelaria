'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStroke } from 'perfect-freehand'
import { cn } from '@/lib/utils'
import type { ToolType, BrushStyle } from '@/lib/types'
import { brushStyleOptions, toolToBrushStyle } from '@/lib/store/use-editor-store'

type ToolIcon = React.ComponentType<{ size?: number; className?: string }>

interface ToolMeta {
  id: ToolType
  icon: ToolIcon
  label: string
  /** Cor atual da tool. Se undefined, sem preview colorido. */
  color?: string
  /** Espessura atual da tool. */
  size?: number
  /** Opacidade atual da tool. */
  opacity?: number
  /** Se verdadeiro, mostra preview de traço do pincel em vez do ícone Lucide. */
  hasStrokePreview?: boolean
}

interface FloatingDockProps {
  /** Ferramentas mostradas diretamente na dock (1 toque = seleciona). */
  primary: ToolMeta[]
  /** Demais ferramentas acessíveis via botão "mais" no final. */
  secondary: ToolMeta[]
  activeTool: ToolType
  /** Quando verdadeiro, baixa opacidade (pointerdown no canvas) — mas NÃO some. */
  suppressed: boolean
  onSelectTool: (t: ToolType) => void
  onOpenMore: () => void
  onOpenSettings: () => void
  /** Indica cor atual p/ o botão de settings. */
  currentColor: string
}

/**
 * FloatingDock — barra de ferramentas fixa no rodapé, estilo Concepts App.
 *
 *  - Sempre visível (não recolhe p/ pill único).
 *  - Cada botão mostra um **traço preview real** (perfect-freehand interpolado
 *    na cor/espessura/opacidade atuais da tool) em vez de ícone Lucide.
 *    Isso resolve: "Sem preview do que cada pincel faz".
 *  - Alvos grandes (44px) — padrão de toque a11y.
 *  - **Swipe horizontal** na dock percorre os presets de pincel — atualiza a
 *    ferramenta ativa sem tocar.
 *  - Botão de configurações + acessar "mais ferramentas" isolados no final.
 *  - Quando "suppressed" (drawing ativo): baixa opacidade (40%) mas não some —
 *    você ainda vê qual pincel está ativo e pode tocar p/ trocar sem errar.
 *
 * Posicionamento: canto inferior direito. ~85% dos usuários são destros, a
 * palma fica à esquerda; destros tendem a inclinar a mão c/ a palma cobrindo
 * o canto inferior DIREITO do tablet enquanto desenham na vertical. Para
 * evitar drift da palma no canvas, fixamos a dock à direita mesmo.
 */
export function FloatingDock({
  primary,
  secondary,
  activeTool,
  suppressed,
  onSelectTool,
  onOpenMore,
  onOpenSettings,
  currentColor,
}: FloatingDockProps) {
  const [hovered, setHovered] = useState<ToolType | null>(null)
  /** Índice p/ "arrastar" durante swipe (não usamos, Concepts usa touch início).
   *  Implementamos swipe como: pointerdown + pointermove horizontal >
   *  threshold → avança p/ próxima tool. */
  const swipeStartXRef = useRef<number | null>(null)
  const swipeLastToolIdxRef = useRef<number>(0)

  const handleSwipeStart = useCallback((e: React.PointerEvent) => {
    swipeStartXRef.current = e.clientX
    swipeLastToolIdxRef.current = primary.findIndex((t) => t.id === activeTool)
  }, [primary, activeTool])

  const handleSwipeMove = useCallback((e: React.PointerEvent) => {
    if (swipeStartXRef.current == null) return
    const dx = e.clientX - swipeStartXRef.current
    const STEP = 50 // px por "passo" de troca
    const steps = Math.round(dx / STEP)
    if (steps === 0) return
    const newIdx = (swipeLastToolIdxRef.current + steps) % primary.length
    const wrapped = newIdx < 0 ? newIdx + primary.length : newIdx
    const next = primary[wrapped]
    if (next && next.id !== activeTool) {
      onSelectTool(next.id)
      swipeLastToolIdxRef.current = wrapped
      swipeStartXRef.current = e.clientX
    }
  }, [primary, activeTool, onSelectTool])

  const handleSwipeEnd = useCallback(() => {
    swipeStartXRef.current = null
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      role="toolbar"
      aria-label="Ferramentas do editor"
      className={cn(
        'fixed z-40 right-3',
        'bottom-[calc(env(safe-area-inset-bottom)+0.6rem)]',
        'flex items-center gap-1',
        'rounded-2xl px-1.5 py-1.5',
        'bg-card/95 backdrop-blur-md',
        'border border-border/40',
        'shadow-[0_6px_18px_-4px_rgb(0_0_0_/_0.25),0_2px_6px_rgb(0_0_0_/_0.10)]',
        'transition-opacity duration-200 ease-out',
        'touch-none select-none',
        suppressed ? 'opacity-40' : 'opacity-100',
      )}
      onPointerDown={handleSwipeStart}
      onPointerMove={handleSwipeMove}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={handleSwipeEnd}
    >
      {/* Ferramentas primárias: cada uma c/ preview real do pincel */}
      {primary.map((tool) => (
        <DockTool
          key={tool.id}
          tool={tool}
          active={tool.id === activeTool}
          hovered={hovered === tool.id}
          onHover={(h) => setHovered(h ? tool.id : null)}
          onClick={() => onSelectTool(tool.id)}
        />
      ))}

      {/* Separador visual */}
      <div className="mx-0.5 h-7 w-px bg-border/40 shrink-0" />

      {/* Mais ferramentas */}
      <DockIcon
        active={false}
        onClick={onOpenMore}
        aria-label="Mais ferramentas"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </DockIcon>

      {/* Configuracões: mostra a cor atual */}
      <button
        onClick={onOpenSettings}
        aria-label="Configurações da ferramenta"
        className={cn(
          'size-11 shrink-0 inline-flex items-center justify-center',
          'rounded-xl transition-all active:scale-95',
          'hover:bg-muted',
          'relative',
          'cursor-pointer',
        )}
      >
        <span
          className="size-6 rounded-full border border-border shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.1)]"
          style={{ backgroundColor: currentColor }}
        />
      </button>
    </div>
  )
}

// ─── Tool button interno ──────────────────────────────────────────────────

interface DockToolProps {
  tool: ToolMeta
  active: boolean
  hovered: boolean
  onHover: (h: boolean) => void
  onClick: () => void
}

function DockTool({ tool, active, hovered, onHover, onClick }: DockToolProps) {
  const Icon = tool.icon
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      aria-pressed={active}
      aria-label={tool.label}
      title={tool.label}
      className={cn(
        'relative size-11 shrink-0',
        'inline-flex items-center justify-center',
        'rounded-xl transition-all',
        'active:scale-95 cursor-pointer',
        active
          ? 'bg-primary/12 ring-1 ring-primary/40'
          : 'hover:bg-muted',
      )}
    >
      {/* Render do preview do traço em vez do ícone */}
      {tool.hasStrokePreview ? (
        <BrushPreviewSvg
          tool={tool.id}
          color={tool.color ?? '#1a1a1a'}
          size={tool.size ?? 4}
          opacity={tool.opacity ?? 1}
        />
      ) : (
        <Icon size={20} />
      )}

      {/* Indicador inferior: traço colorido quando ativa */}
      {active && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full"
          style={{ backgroundColor: 'var(--primary)' }}
        />
      )}
    </button>
  )
}

/** Container genérico interno p/ ícones soltos (mais settings). */
function DockIcon({
  active,
  onClick,
  'aria-label': ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  'aria-label'?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'size-11 shrink-0 inline-flex items-center justify-center',
        'rounded-xl transition-all active:scale-95 cursor-pointer',
        active ? 'bg-primary/12 ring-1 ring-primary/40 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// ─── Brush preview SVG (perfect-freehand) ──────────────────────────────

/** Renderiza um traço curvo horizontal no canto usando perfect-freehand,
 *  demonstrando que pincel vai sair: largura, opacidade, mistura. Resolve
 *  "Sem preview do que cada pincel faz". */
const BrushPreviewSvg = ({
  tool,
  color,
  size,
  opacity,
}: {
  tool: ToolType
  color: string
  size: number
  opacity: number
}) => {
  const brush: BrushStyle | null =
    tool === 'ruler' ? 'pen' : toolToBrushStyle(tool)

  // Stipple/hatch: simbolizar visualmente c/ padrão simples
  if (brush === 'stipple') {
    return (
      <svg width="28" height="20" viewBox="0 0 28 20" className="overflow-visible">
        {/* Ponto cluster centralizado */}
        <g fill={color} opacity={Math.min(1, opacity * 0.95)}>
          <circle cx="6" cy="6" r={Math.max(0.6, size * 0.18)} />
          <circle cx="12" cy="11" r={Math.max(0.6, size * 0.2)} />
          <circle cx="8" cy="13" r={Math.max(0.6, size * 0.16)} />
          <circle cx="18" cy="8" r={Math.max(0.6, size * 0.18)} />
          <circle cx="20" cy="14" r={Math.max(0.6, size * 0.22)} />
          <circle cx="14" cy="6" r={Math.max(0.6, size * 0.17)} />
          <circle cx="22" cy="11" r={Math.max(0.6, size * 0.2)} />
        </g>
      </svg>
    )
  }
  if (brush === 'hatch') {
    return (
      <svg width="28" height="20" viewBox="0 0 28 20" className="overflow-visible">
        <g
          stroke={color}
          strokeWidth={Math.max(0.7, size * 0.3)}
          strokeLinecap="round"
          opacity={Math.min(1, opacity * 0.95)}
        >
          <line x1="4" y1="3" x2="10" y2="17" />
          <line x1="10" y1="3" x2="16" y2="17" />
          <line x1="16" y1="3" x2="22" y2="17" />
        </g>
      </svg>
    )
  }
  if (!brush) return null

  // perfect-freehand p/ preview
  const pts: { x: number; y: number; pressure: number }[] = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const x = 2 + t * 24
    const y = 10 + Math.sin(t * Math.PI) * 5
    const pressure = brush === 'highlighter' || brush === 'marker' ? 0.5 : 0.3 + Math.sin(t * Math.PI) * 0.6
    pts.push({ x, y, pressure })
  }

  const opts = brushStyleOptions(brush, Math.min(size, 8))
  const predicted = getStroke(pts, opts)
  const pathD = `M ${predicted.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')}`

  return (
    <svg width="28" height="20" viewBox="0 0 28 20" className="overflow-visible">
      <path
        d={pathD}
        fill={color}
        opacity={brush === 'highlighter' ? 0.6 : Math.min(1, opacity * 0.95)}
        style={brush === 'highlighter' ? { mixBlendMode: 'multiply' as const } : undefined}
      />
    </svg>
  )
}
