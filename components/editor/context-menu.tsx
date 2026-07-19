'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface ContextMenuAction {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  shortcut?: string
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  open: boolean
  label?: string
  actions: ContextMenuAction[]
  onClose: () => void
}

export function ContextMenu({ x, y, open, label, actions, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    let left = x
    let top = y
    if (rect.right > window.innerWidth) left = x - rect.width
    if (rect.bottom > window.innerHeight) top = y - rect.height
    ref.current.style.left = `${left}px`
    ref.current.style.top = `${top}px`
  }, [open, x, y])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-44 rounded-2xl border border-border/50 bg-popover p-1.5 shadow-xl glass outline-none animate-in fade-in zoom-in-95 duration-100"
    >
      {label && (
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-1.5 pt-1">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {actions.map((a, i) => {
          if (a.id === '__separator__') {
            return <div key={`sep-${i}`} className="h-px bg-border/60 mx-2 my-1" />
          }
          const Icon = a.icon
          return (
            <button
              key={a.id}
              onClick={() => { a.onClick(); onClose() }}
              disabled={a.disabled}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer',
                a.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-muted',
              )}
            >
              <Icon size={14} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 text-left">{a.label}</span>
              {a.shortcut && (
                <span className="text-[10px] text-muted-foreground/60">{a.shortcut}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
