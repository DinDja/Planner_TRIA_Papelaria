'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useMenuStore } from '@/lib/store/use-menu-store'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import type { ComponentType } from 'react'
import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  Folder,
  Gift,
  Heart,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  List,
  ListChecks,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Quote,
  Settings,
  Shield,
  Sun,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '../providers/theme-provider'
import { Button } from '../ui/button'
import { ScrollArea, Separator } from '../ui/primitives'
import { BrandLogo } from '../brand-logo'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onOpenCreate: () => void
  onOpenSettings: () => void
}

type SidebarIcon = ComponentType<{
  size?: number
  className?: string
  'aria-hidden'?: boolean
}>

/** Ícones Lucide, seguindo o traço e a escala usados pela sidebar original. */
const MODULE_ICONS: Record<string, SidebarIcon> = {
  dashboard: LayoutDashboard,
  diario: BookOpen,
  notas: FileText,
  listas: List,
  checklists: ListChecks,
  wishlist: Heart,
  frases: Quote,
  memorias: Archive,
  cofre: KeyRound,
  saude: HeartPulse,
  calendario: Calendar,
  financas: Wallet,
  aniversarios: Gift,
  habitos: CheckCircle2,
  rotina: CalendarClock,
  plans: BriefcaseBusiness,
  admin: Shield,
  perfil: User,
}

function ModuleIcon({ id, size }: { id: string; size: number }) {
  const Icon = MODULE_ICONS[id] ?? Circle
  return <Icon size={size} aria-hidden />
}

export function AppSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenCreate,
  onOpenSettings,
}: SidebarProps) {
  const { theme, toggle } = useTheme()
  const pathname = usePathname()
  const planners = useAppStore((s) => s.planners)
  const folders = useAppStore((s) => s.folders)
  const tags = useAppStore((s) => s.tags)
  const menuModules = useMenuStore((s) => s.modules)
  const enabledModules = menuModules
    .filter((m) => m.enabled)
    .map((m) => m.id === 'calendario' ? { ...m, label: 'Agenda' } : m)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-2 h-24 shrink-0', collapsed && 'justify-center px-2')}>
        <BrandLogo className="h-20 w-[190px]" imageClassName="w-[380px]" />
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1 hover:bg-muted md:hidden cursor-pointer"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      <Separator className="mx-3 w-auto" />

      <ScrollArea className="flex-1 py-3">
        {/* Quick Create */}
        {!collapsed ? (
          <div className="px-3 pb-3">
            <Button
              variant="default"
              className="w-full justify-start gap-2 rounded-xl h-10 text-sm font-medium"
              onClick={onOpenCreate}
            >
              <Plus size={16} />
              Novo planner
            </Button>
          </div>
        ) : (
          <div className="flex justify-center pb-3">
            <Button
              variant="default"
              size="icon"
              className="size-9 rounded-xl"
              onClick={onOpenCreate}
              aria-label="Novo planner"
            >
              <Plus size={16} />
            </Button>
          </div>
        )}

        {/* Nav — módulos, no mesmo padrão Lucide da sidebar original. */}
        <nav className={cn('flex flex-col gap-0.5 px-3', collapsed && 'px-1.5')}>
          {enabledModules.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-brand-rose/70 text-foreground dark:bg-brand-rose/20 dark:text-brand-beige'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  collapsed && 'justify-center px-0 py-2',
                )}
              >
                <ModuleIcon id={item.id} size={collapsed ? 20 : 18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <>
            {/* Pastas */}
            <div className="mt-6 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Folder size={14} className="text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pastas
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                {folders.map((f) => (
                  <Link
                    key={f.id}
                    href={`/pastas/${f.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div className="size-2.5 rounded-md" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground/60 tabular-nums">
                      {planners.filter((p) => p.folderId === f.id).length}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tags
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/50 px-1">
                    Nenhuma tag ainda
                  </span>
                ) : (
                  tags.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tags/${encodeURIComponent(t.id)}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors cursor-pointer hover:brightness-110"
                      style={{
                        backgroundColor: t.color + '20',
                        color: t.color,
                      }}
                    >
                      {t.name}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Planners recentes */}
            <div className="mt-5 px-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Planners recentes
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                {planners.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/planner/${p.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors truncate"
                  >
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Bottom — ferramentas. Apenas ícones. */}
      <div className={cn('p-3 flex items-center gap-1', collapsed && 'flex-col')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className="rounded-xl"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl hidden md:flex"
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </Button>
        <ToolLink href="/menu" label="Menu" icon={Menu} />
        <ToolLink href="/admin" label="Admin" icon={Shield} />
        <ToolLink href="/lixeira" label="Lixeira" icon={Trash2} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          className="rounded-xl shrink-0"
          aria-label="Configurações"
        >
          <Settings size={16} />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen shrink-0 glass border-r border-border/40 transition-all duration-300 z-30 overflow-hidden',
          collapsed ? 'w-[68px]' : 'w-[260px]',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-border/40 bg-background flex flex-col shadow-2xl md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function ToolLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: SidebarIcon
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center size-8 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={label}
      title={label}
    >
      <Icon size={16} />
    </Link>
  )
}
