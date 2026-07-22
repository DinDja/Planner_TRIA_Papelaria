'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  BookHeart,
  Bookmark,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  ClipboardList,
  CornerDownLeft,
  FileText,
  Heart,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  List,
  ListChecks,
  RefreshCw,
  Search,
  Target,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PaletteItem {
  id: string
  label: string
  icon: typeof FileText
  href: string
  color?: string
  section: string
  tag?: string
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/', section: 'Navegação' },
    { id: 'diario', label: 'Diário Digital', icon: BookHeart, href: '/diario', section: 'Navegação' },
    { id: 'notas', label: 'Notas', icon: FileText, href: '/notas', section: 'Navegação' },
    { id: 'listas', label: 'Listas', icon: List, href: '/listas', section: 'Navegação' },
    { id: 'checklists', label: 'Checklists', icon: ListChecks, href: '/checklists', section: 'Navegação' },
    { id: 'frases', label: 'Frases Favoritas', icon: Bookmark, href: '/frases', section: 'Navegação' },
    { id: 'memorias', label: 'Caixa de Memórias', icon: Box, href: '/memorias', section: 'Navegação' },
    { id: 'cofre', label: 'Cofre de Credenciais', icon: KeyRound, href: '/cofre', section: 'Navegação' },
    { id: 'saude', label: 'Saúde', icon: HeartPulse, href: '/saude', section: 'Navegação' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, href: '/wishlist', section: 'Navegação' },
    { id: 'rotina', label: 'Rotina', icon: ClipboardList, href: '/rotina', section: 'Navegação' },
    { id: 'calendario', label: 'Calendário', icon: Calendar, href: '/calendario', section: 'Navegação' },
    { id: 'financas', label: 'Finanças', icon: Wallet, href: '/financas', section: 'Navegação' },
    { id: 'metas', label: 'Metas Financeiras', icon: Target, href: '/metas', section: 'Navegação' },
    { id: 'habitos', label: 'Hábitos', icon: CheckCircle, href: '/habitos', section: 'Navegação' },
    { id: 'menu', label: 'Personalizar Menu', icon: List, href: '/menu', section: 'Navegação' },
    { id: 'retrospectiva', label: 'Retrospectiva', icon: RefreshCw, href: '/retrospectiva', section: 'Navegação' },
    { id: 'templates', label: 'Galeria de templates', icon: BookOpen, href: '/templates', section: 'Navegação' },
    { id: 'plans', label: 'Planos', icon: BriefcaseBusiness, href: '/plans', section: 'Navegação' },
    { id: 'conta', label: 'Conta e Admin', icon: User, href: '/conta', section: 'Sistema' },
    { id: 'lixeira', label: 'Lixeira', icon: Trash2, href: '/lixeira', section: 'Sistema' },
  ]

  const plannerActions: PaletteItem[] = planners.map((p) => ({
    id: p.id,
    label: p.name,
    icon: FileText,
    href: `/planner/${p.id}`,
    color: p.color,
    section: 'Seus planners',
    tag: 'Planner',
  }))

  const allItems: PaletteItem[] = [...baseActions, ...plannerActions]
  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems

  // Agrupa mantendo a ordem das seções
  const sections = filtered.reduce<{ name: string; items: (PaletteItem & { idx: number })[] }[]>(
    (acc, item) => {
      const idx = filtered.indexOf(item)
      const last = acc[acc.length - 1]
      if (last && last.name === item.section) last.items.push({ ...item, idx })
      else acc.push({ name: item.section, items: [{ ...item, idx }] })
      return acc
    },
    [],
  )

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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/45 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
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
          <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-auto scrollbar-thin py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Search size={22} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum resultado para “{query}”.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.name} className="mb-1 last:mb-0">
                <p className="px-5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.name}
                </p>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setSelectedIdx(item.idx)}
                    className={cn(
                      'flex items-center gap-3 w-full px-5 py-2.5 text-sm transition-colors cursor-pointer',
                      item.idx === clampedIdx && 'bg-muted',
                      'hover:bg-muted/60',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-xl shrink-0 transition-colors',
                        !item.color && 'bg-muted text-muted-foreground',
                      )}
                      style={
                        item.color
                          ? { backgroundColor: item.color + '18', color: item.color }
                          : undefined
                      }
                    >
                      <item.icon size={16} />
                    </div>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.tag && (
                      <span className="text-[10px] font-medium text-muted-foreground/80 rounded-full border border-border/60 px-2 py-0.5">
                        {item.tag}
                      </span>
                    )}
                    {item.idx === clampedIdx && (
                      <CornerDownLeft size={13} className="text-muted-foreground/60 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer com dicas */}
        <div className="flex items-center gap-4 border-t border-border/30 px-5 py-2.5 text-[10px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5">
              <ArrowUp size={10} />
            </kbd>
            <kbd className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5">
              <ArrowDown size={10} />
            </kbd>
            navegar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5">
              <CornerDownLeft size={10} />
            </kbd>
            abrir
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-medium">
              esc
            </kbd>
            fechar
          </span>
        </div>
      </motion.div>
    </div>
  )
}
