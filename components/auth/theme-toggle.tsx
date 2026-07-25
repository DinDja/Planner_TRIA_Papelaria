'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle, mounted } = useTheme()

  if (!mounted) {
    // Placeholder do mesmo tamanho — evita hydration mismatch.
    return <div className={cn('size-9', className)} aria-hidden />
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'flex size-9 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60 cursor-pointer',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
