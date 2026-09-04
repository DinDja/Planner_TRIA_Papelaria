'use client'

import { useTheme } from './theme-provider'
import {
  DEFAULT_SETTINGS,
  FONT_SCALE_VALUES,
  RADIUS_PRESET_VALUES,
  useSettingsStore,
} from '@/lib/store/use-settings-store'
import { useEffect } from 'react'

/**
 * Aplica as configurações do sistema (paleta, gradientes, raio, escala de fonte,
 * etc.) diretamente ao document.documentElement via propriedades CSS.
 * Roda dentro do ThemeProvider para saber o tema atual.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { theme, mounted } = useTheme()
  const settings = useSettingsStore()

  // Evita aplicar antes do montar para evitar flash de tema errado
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    const isDark = theme === 'dark'

    // ── Paleta ───────────────────────────────────────────
    const primary = isDark
      ? 'color-mix(in oklab, var(--brand-mustard) 82%, var(--brand-beige))'
      : 'var(--brand-mustard)'
    const ring = isDark ? 'var(--brand-rose)' : 'var(--brand-mustard)'
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--ring', ring)
    root.style.setProperty('--sidebar-primary', primary)
    root.style.setProperty('--sidebar-ring', ring)
    root.style.setProperty('--sidebar-primary-foreground', isDark
      ? '#241e16'
      : '#211a12')
    root.style.setProperty('--chart-1', 'var(--brand-rose)')

    // ── Raio ─────────────────────────────────────────────
    const radius = RADIUS_PRESET_VALUES[settings.radius]
    root.style.setProperty('--radius', radius)

    // ── Escala de fonte ──────────────────────────────────
    root.style.setProperty('font-size', FONT_SCALE_VALUES[settings.fontScale])

    // ── Toggles globais (data attributes) ────────────────
    root.dataset.glass = settings.glassUI ? 'on' : 'off'
    root.dataset.gradDashboard = settings.gradients.dashboard ? 'on' : 'off'
    root.dataset.gradCovers = settings.gradients.covers ? 'on' : 'off'
    root.dataset.gradCharts = settings.gradients.charts ? 'on' : 'off'
    root.dataset.gradBadges = settings.gradients.badges ? 'on' : 'off'
    root.dataset.paperGrain = settings.paperGrain ? 'on' : 'off'
    root.dataset.deskBg = settings.deskBackground ? 'on' : 'off'
    root.dataset.reduceMotion = settings.reduceMotion ? 'on' : 'off'

    // ── Cores de destaque (paleta swatch) como RGB ───────
    // Úteis para gradientes dinâmicos (`rgb(${primaryRgb})`)
    root.style.setProperty('--primary-rgb', '183 111 6')

    return () => {
      // Reset parcial ao desmontar (raro em SPA)
      const defRadius = RADIUS_PRESET_VALUES[DEFAULT_SETTINGS.radius]
      const defFont = FONT_SCALE_VALUES[DEFAULT_SETTINGS.fontScale]
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--sidebar-primary')
      root.style.removeProperty('--sidebar-ring')
      root.style.removeProperty('--sidebar-primary-foreground')
      root.style.removeProperty('--chart-1')
      root.style.removeProperty('--primary-rgb')
      root.style.removeProperty('--radius')
      root.style.removeProperty('font-size')
      root.style.setProperty('--radius', defRadius)
      root.style.setProperty('font-size', defFont)
    }
  }, [mounted, theme, settings])

  return <>{children}</>
}

// ─── Hooks utilitários ────────────────────────────────────────────────────────

/** Acesso individual a cada flag de gradiente (sem ressubscrições excessivas) */
export function useGradient(area: 'dashboard' | 'covers' | 'charts' | 'badges') {
  return useSettingsStore((s) => s.gradients[area])
}

/** Boolean combinado: gradiente habilitado (alias rápido para dashboard) */
export function useGradientPrimary(area: 'dashboard' | 'covers' | 'charts' | 'badges') {
  const any = useSettingsStore((s) => Object.values(s.gradients).some(Boolean))
  return {
    area,
    enabled: useSettingsStore((s) => s.gradients[area]),
    anyEnabled: any,
  }
}
