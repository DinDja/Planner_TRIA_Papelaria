'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { Command, Menu, Search, Sun } from 'lucide-react'
import { useTheme } from '../providers/theme-provider'

interface TopBarProps {
  onToggleSidebar: () => void
  onOpenCommand: () => void
}

export function TopBar({ onToggleSidebar, onOpenCommand }: TopBarProps) {
  const { theme } = useTheme()

  return (
    <header className="h-14 shrink-0 flex items-center gap-4 px-4 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="md:hidden rounded-xl -ml-1"
      >
        <Menu size={18} />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenCommand}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-4 py-2 text-sm text-muted-foreground hover:border-border hover:text-foreground transition-all"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Command size={12} />K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" className="rounded-xl" onClick={onOpenCommand}>
          <Command size={16} />
        </Button>
      </div>
    </header>
  )
}
