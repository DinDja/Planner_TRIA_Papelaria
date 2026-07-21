'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ToolType } from '@/lib/types'

export interface RadialItem {
  id: ToolType | 'more' | 'undo' | 'redo' | 'settings'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  active?: boolean
}

interface RadialMenuProps {
  open: boolean
  items: RadialItem[]
  onSelect: (id: RadialItem['id']) => void
  onClose: () => void
  radius?: number
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Radial/pie menu para mobile. Exibe itens em disposição circular no centro da tela.
 * Abre via botão dedicado. Só fecha se clicar no backdrop ou selecionar item.
 */
export function RadialMenu({ open, items, onSelect, onClose, radius = 100, triggerRef }: RadialMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = useCallback((e: React.PointerEvent) => {
    // Fecha apenas se clicou no backdrop, não em item
    const target = e.target as HTMLElement
    if (target.hasAttribute('data-radial-backdrop')) {
      onClose()
    }
  }, [onClose])

  if (!open) return null

  const angleStep = (2 * Math.PI) / items.length

  return (
    <>
      {/* Backdrop com pointer-events para fechar ao tocar fora */}
      <div
        data-radial-backdrop
        className="fixed inset-0 z-[155] bg-black/40 backdrop-blur-sm"
        onPointerDown={handleBackdropClick}
      />

      {/* Container radial absoluto no centro da tela */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[160] pointer-events-none flex items-center justify-center"
      >
        {/* Centro visual (botão trigger virtual - só decorativo) */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 350 }}
          className="relative pointer-events-auto"
          style={{ width: radius * 2 + 48, height: radius * 2 + 48 }}
        >
          {/* Centro */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-popover border border-border/50 shadow-lg flex items-center justify-center">
            <span className="text-[9px] font-semibold text-muted-foreground">tools</span>
          </div>

          {/* Items em anel */}
          {items.map((item, i) => {
            const angle = -Math.PI / 2 + i * angleStep
            const ix = Math.cos(angle) * radius + radius + 24
            const iy = Math.sin(angle) * radius + radius + 24
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', damping: 18, stiffness: 400 }}
                className={cn(
                  'absolute size-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-110',
                  'bg-popover border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30',
                  item.active && 'bg-primary text-primary-foreground border-primary',
                )}
                style={{ left: ix - 24, top: iy - 24 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(item.id)
                }}
              >
                <Icon size={18} />
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </>
  )
}