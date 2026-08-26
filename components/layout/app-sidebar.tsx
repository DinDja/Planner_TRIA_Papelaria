'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useMenuStore } from '@/lib/store/use-menu-store'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '../providers/theme-provider'
import { Button } from '../ui/button'
import { ScrollArea, Separator } from '../ui/primitives'
import { CommandPalette } from './command-palette'
import { ModuloIcon } from '@/components/icons/modules'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onOpenCreate: () => void
  onOpenSettings: () => void
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
        <img src="/Logo.svg" alt="PlannerHub" className="h-20 w-auto" />
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

        {/* Nav — módulos. Ícone de `components/icons/modules`, não Lucide. */}
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
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  collapsed && 'justify-center px-0 py-2',
                )}
              >
                <ModuloIcon name={item.id} size={collapsed ? 22 : 18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <>
            {/* Pastas — sem ícone decorativo; tipografia small-caps. */}
            <div className="mt-6 px-3">
              <p className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
                Pastas
              </p>
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

            {/* Tags — sem ícone decorativo. */}
            <div className="mt-5 px-3">
              <p className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
                Tags
              </p>
              <div className="flex flex-wrap gap-2 px-2">
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

            {/* Planners recentes — sem ícone decorativo; não duplica templates. */}
            <div className="mt-5 px-3">
              <p className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
                Planners recentes
              </p>
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

      {/* Bottom — ferramentas. Lucide só para transiente (Menu/Theme/panel). */}
      <div className={cn('p-3 flex items-center gap-0.5', collapsed && 'flex-col gap-1')}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'icon-sm'}
          onClick={toggle}
          className={cn('rounded-xl shrink-0', collapsed && 'size-9')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'icon-sm'}
          onClick={onOpenSettings}
          className={cn('rounded-xl shrink-0', collapsed && 'size-9')}
          aria-label="Configurações"
        >
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            cfg
          </span>
        </Button>

        {/* Ferramentas — não duplicam ícones de módulo. */}
        <ToolLink href="/menu"    label="Menu"     glyph="≡"   collapsed={collapsed} />
        <ToolLink href="/admin"   label="Admin"    glyph="adm"  collapsed={collapsed} />
        <ToolLink href="/lixeira" label="Lixeira"  glyph="excl" collapsed={collapsed} />
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

/**
 * Link de ferramenta no rodapé da sidebar. Quando expandido, mostra rótulo
 * textual; quando recolhido, mostra o glifo abreviado. Não usa ícone de
 * biblioteca — evita duplicar `List` (Listas), `Shield` (já evitado) ou
 * `Trash2` (usado em 20 lugares).
 */
function ToolLink({
  href,
  label,
  glyph,
  collapsed,
}: {
  href: string
  label: string
  glyph: string
  collapsed: boolean
}) {
  if (collapsed) {
    return (
      <Link
        href={href}
        className="flex size-9 items-center justify-center rounded-xl text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={label}
        title={label}
      >
        {glyph}
      </Link>
    )
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center h-8 shrink-0 rounded-xl px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {label}
    </Link>
  )
}
