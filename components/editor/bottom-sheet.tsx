'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Altura máxima do sheet (default 70vh). */
  maxHeight?: string
  children: React.ReactNode
  /** Se verdadeiro, renderiza em modo "desktop side panel" em telas md+. */
  desktopSidePanel?: boolean
}

/**
 * Bottom sheet reutilizável: em mobile (<md) sobe de baixo; em desktop (md+)
 * vira um painel lateral direito. Pensado para stickers, OCR e pages.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  maxHeight = '70vh',
  children,
  desktopSidePanel = true,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
          <motion.div
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border/40 bg-background shadow-2xl',
              'flex flex-col',
              desktopSidePanel &&
                'md:relative md:inset-auto md:border-t-0 md:border-l md:rounded-none md:shadow-none md:h-auto md:flex md:flex-col',
            )}
            style={{ maxHeight }}
          >
            {/* Drag handle mobile */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-4 pt-2 pb-2">
                <h3 className="text-sm font-semibold">{title}</h3>
                <Button variant="ghost" size="icon-xs" className="rounded-lg" onClick={onClose}>
                  <X size={14} />
                </Button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
