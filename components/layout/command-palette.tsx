'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  Command,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PaletteItem {
  id: string
  label: string
  icon: typeof FileText
  href: string
  color?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const planners = useAppStore((s) => s.planners)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const baseActions: PaletteItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'templates', label: 'Galeria de templates', icon: BookOpen, href: '/templates' },
    { id: 'plans', label: 'Planos', icon: BriefcaseBusiness, href: '/plans' },
  ]

  const plannerActions: PaletteItem[] = planners.map((p) => ({
    id: p.id,
    label: p.name,
    icon: FileText,
    href: `/planner/${p.id}`,
    color: p.color,
  }))

  const allItems: PaletteItem[] = [...baseActions, ...plannerActions]
  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems

  const clampedIdx = Math.min(selectedIdx, Math.max(0, filtered.length - 1))

  const navigate = useCallback(
    (href: string) => {
      router.push(href)
      onClose()
    },
    [router, onClose],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[clampedIdx]) navigate(filtered[clampedIdx].href)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else {
          setQuery('')
          setSelectedIdx(0)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative z-[101] w-full max-w-xl glass-strong rounded-3xl border border-border/40 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIdx(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar planners, páginas, templates..."
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[360px] overflow-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={cn(
                  'flex items-center gap-3 w-full px-5 py-2.5 text-sm transition-colors',
                  i === clampedIdx && 'bg-muted',
                  'hover:bg-muted/60',
                )}
              >
                <div
                  className="flex size-8 items-center justify-center rounded-xl shrink-0"
                  style={{
                    backgroundColor: item.color ? item.color + '18' : undefined,
                  }}
                >
                  <item.icon
                    size={16}
                    style={{ color: item.color ?? undefined }}
                  />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {item.id.startsWith('pl-') ? 'Planner' : ''}
                </span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
