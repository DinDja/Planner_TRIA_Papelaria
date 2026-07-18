'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Folder,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sun,
  Tag,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from '../providers/theme-provider'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/primitives'
import { Separator } from '../ui/primitives'
import { CommandPalette } from './command-palette'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onOpenCreate: () => void
  onOpenSettings: () => void
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/templates', label: 'Templates', icon: BookOpen },
  { href: '/plans', label: 'Planos', icon: BriefcaseBusiness },
]

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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-14 shrink-0', collapsed && 'justify-center px-2')}>
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15">
          <span className="text-primary font-bold text-sm">P</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-base tracking-tight">PlannerHub</span>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1 hover:bg-muted md:hidden cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <Separator className="mx-3 w-auto" />

      <ScrollArea className="flex-1 py-3">
        {/* Quick Create */}
        {!collapsed && (
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
        )}
        {collapsed && (
          <div className="flex justify-center pb-3">
            <Button
              variant="default"
              size="icon"
              className="size-9 rounded-xl"
              onClick={onOpenCreate}
            >
              <Plus size={16} />
            </Button>
          </div>
        )}

        {/* Nav */}
        <nav className={cn('flex flex-col gap-0.5 px-3', collapsed && 'px-1.5')}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  collapsed && 'justify-center px-0 py-2',
                )}
              >
                <item.icon size={collapsed ? 20 : 18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <>
            {/* Folders */}
            <div className="mt-5 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Folder size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pastas
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div className="size-2.5 rounded-md" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground/60">
                      {planners.filter((p) => p.folderId === f.id).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Urgente', 'Importante', 'Ideia'].map((tag, i) => {
                  const colors = ['#e05b6d', '#f0b429', '#a5c8e4']
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors cursor-pointer hover:brightness-110 hover:opacity-90"
                      style={{
                        backgroundColor: colors[i] + '20',
                        color: colors[i],
                      }}
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Recent Planners shortcut */}
        {!collapsed && (
          <div className="mt-5 px-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Planners recentes
              </span>
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
        )}
      </ScrollArea>

      {/* Bottom */}
      <div className={cn('p-3 flex items-center gap-1', collapsed && 'flex-col')}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={toggle}
          className={cn('rounded-xl flex-1 justify-start gap-2', collapsed && 'flex-none')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && (theme === 'dark' ? 'Modo claro' : 'Modo escuro')}
        </Button>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'icon-sm'}
          onClick={onOpenSettings}
          className="rounded-xl"
          aria-label="Configurações"
        >
          <Settings size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl hidden md:flex"
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen shrink-0 glass border-r border-border/40 transition-all duration-300 z-30',
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
