'use client'

import { useMenuStore } from '@/lib/store/use-menu-store'
import { useAuth } from '@/lib/auth/auth-context'
import { useSubscriptionStore } from '@/lib/subscriptions/use-subscription-store'
import { ModuloIcon } from '@/components/icons/modules'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import type { ComponentType } from 'react'
import {
  CircleHelp,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '../providers/theme-provider'
import { Button } from '../ui/button'
import { ScrollArea, Separator } from '../ui/primitives'
import { BrandLogo } from '../brand-logo'
import { useAccountLogout } from './use-account-logout'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onOpenSettings: () => void
}

type SidebarIcon = ComponentType<{
  size?: number
  className?: string
  'aria-hidden'?: boolean
}>

export function AppSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenSettings,
}: SidebarProps) {
  const { theme, toggle } = useTheme()
  const lightFooterActionClass = theme === 'light'
    ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
    : undefined
  const { user, role } = useAuth()
  const handleLogout = useAccountLogout()
  const subscriptionRole = useSubscriptionStore((s) => s.role)
  const pathname = usePathname()
  const menuModules = useMenuStore((s) => s.modules)
  const isAdminUser = Boolean(user) && (role === 'admin' || subscriptionRole === 'admin')
  const adminModule = menuModules.find((m) => m.id === 'admin') ?? {
    id: 'admin' as const,
    href: '/admin',
    label: 'Admin',
    enabled: true,
  }
  const enabledModules = menuModules
    .map((m) => (m.id === 'admin' && isAdminUser ? { ...m, href: '/admin', enabled: true } : m))
    .filter((m) => m.enabled || (m.id === 'admin' && isAdminUser))
    .concat(isAdminUser && !menuModules.some((m) => m.id === 'admin') ? [adminModule] : [])
    .map((m) => m.id === 'calendario' ? { ...m, label: 'Agenda' } : m)
  const closeMobileSidebar = () => setMobileOpen(false)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-2 h-24 shrink-0', collapsed && 'justify-center px-2')}>
        <BrandLogo className="h-16 w-[170px]" imageClassName="w-[300px]" />
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
        {/* Nav — módulos, no mesmo padrão Lucide da sidebar original. */}
        <nav className={cn('flex flex-col gap-0.5 px-3', collapsed && 'px-1.5')}>
          {enabledModules.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeMobileSidebar}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/15 text-primary dark:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  collapsed && 'justify-center px-0 py-2',
                )}
              >
                <ModuloIcon name={item.id} size={collapsed ? 20 : 18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

      </ScrollArea>

      {/* Bottom — ferramentas. Apenas ícones. */}
      <div className={cn('p-3 flex items-center gap-1', collapsed && 'flex-col')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          className={cn('rounded-xl', lightFooterActionClass)}
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          className={cn('rounded-xl hidden md:flex', lightFooterActionClass)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </Button>
        <ToolLink href="/menu" label="Menu" icon={Menu} onClick={closeMobileSidebar} />
        <ToolLink href="/conta" label="Ajuda" icon={CircleHelp} onClick={closeMobileSidebar} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            closeMobileSidebar()
            onOpenSettings()
          }}
          title="Abrir configurações"
          className={cn('rounded-xl shrink-0', lightFooterActionClass)}
          aria-label="Configurações"
        >
          <Settings size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            closeMobileSidebar()
            void handleLogout()
          }}
          title="Sair da conta"
          className={cn(
            'rounded-xl shrink-0',
            lightFooterActionClass,
            theme === 'dark' && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
          )}
          aria-label="Sair da conta"
        >
          <LogOut size={16} />
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
  onClick,
}: {
  href: string
  label: string
  icon: SidebarIcon
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      data-sidebar-tool
      className="inline-flex items-center justify-center size-7 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon size={16} />
    </Link>
  )
}
