'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FontScale, GradientArea, RadiusPreset, SystemPaletteId, SystemSettings } from '../types'

export const DEFAULT_SETTINGS: SystemSettings = {
  palette: 'amber',
  gradients: {
    dashboard: true,
    covers: true,
    charts: true,
    badges: true,
  },
  radius: 'soft',
  fontScale: 'base',
  paperGrain: true,
  glassUI: true,
  deskBackground: true,
  reduceMotion: false,
  confirmDelete: true,
  autoSave: true,
}

// ─── Paletas de cor (em oklch) ────────────────────────────────────────────────
// Cada paleta define apenas a cor de destaque (`primary`) e o `ring`.
// Os demais tokens (background, foreground) continuam usando as cores base do tema
// light/dark definidas em globals.css, garantindo contraste adequado.

export interface PaletteDef {
  id: SystemPaletteId
  label: string
  /** Cores OKLCH para o tema claro: primary, ring */
  light: { primary: string; ring: string }
  /** Cores OKLCH para o tema escuro */
  dark: { primary: string; ring: string }
  /** Cor de amostra (hex) para preview visual na UI */
  swatch: string
  /** Descrição curta */
  description: string
}

export const PALETTES: PaletteDef[] = [
  {
    id: 'amber',
    label: 'Âmbar',
    light: { primary: 'oklch(0.56 0.1 50)', ring: 'oklch(0.56 0.1 50)' },
    dark: { primary: 'oklch(0.74 0.09 55)', ring: 'oklch(0.74 0.09 55)' },
    swatch: '#a8703a',
    description: 'Quente e aconchegante (padrão)',
  },
  {
    id: 'rose',
    label: 'Rosé',
    light: { primary: 'oklch(0.62 0.18 12)', ring: 'oklch(0.62 0.18 12)' },
    dark: { primary: 'oklch(0.76 0.15 15)', ring: 'oklch(0.76 0.15 15)' },
    swatch: '#e05b6d',
    description: 'Rosa suave, caloroso',
  },
  {
    id: 'ocean',
    label: 'Oceano',
    light: { primary: 'oklch(0.55 0.13 250)', ring: 'oklch(0.55 0.13 250)' },
    dark: { primary: 'oklch(0.72 0.12 245)', ring: 'oklch(0.72 0.12 245)' },
    swatch: '#5b8dbf',
    description: 'Azul profundo, foco',
  },
  {
    id: 'forest',
    label: 'Floresta',
    light: { primary: 'oklch(0.6 0.12 145)', ring: 'oklch(0.6 0.12 145)' },
    dark: { primary: 'oklch(0.74 0.13 150)', ring: 'oklch(0.74 0.13 150)' },
    swatch: '#7bb686',
    description: 'Verde natural, calmo',
  },
  {
    id: 'lavender',
    label: 'Lavanda',
    light: { primary: 'oklch(0.58 0.13 295)', ring: 'oklch(0.58 0.13 295)' },
    dark: { primary: 'oklch(0.74 0.12 300)', ring: 'oklch(0.74 0.12 300)' },
    swatch: '#c9b6e4',
    description: 'Roxo suave, criativo',
  },
  {
    id: 'sunset',
    label: 'Pôr do sol',
    light: { primary: 'oklch(0.65 0.18 45)', ring: 'oklch(0.65 0.18 45)' },
    dark: { primary: 'oklch(0.78 0.16 50)', ring: 'oklch(0.78 0.16 50)' },
    swatch: '#f0b429',
    description: 'Amarelo-alaranjado vibrante',
  },
  {
    id: 'mono',
    label: 'Monocromático',
    light: { primary: 'oklch(0.35 0.005 60)', ring: 'oklch(0.35 0.005 60)' },
    dark: { primary: 'oklch(0.88 0.005 70)', ring: 'oklch(0.88 0.005 70)' },
    swatch: '#5a544c',
    description: 'Sóbrio, sem destaque colorido',
  },
]

export const RADIUS_PRESET_VALUES: Record<RadiusPreset, string> = {
  sharp: '0.2rem',
  soft: '0.5rem',
  rounded: '0.75rem',
  pill: '1.25rem',
}

export const FONT_SCALE_VALUES: Record<FontScale, string> = {
  sm: '0.9375rem', // 15px
  base: '1rem', // 16px
  lg: '1.0625rem', // 17px
}

/**
 * Helpers para uso em inline styles quando gradiente de área está desligado.
 * Uso:
 *   background: grad(s.gradients.dashboard,
 *     `linear-gradient(...)`,
 *     fallbackSolid)
 */
export function gradFlag(
  enabled: boolean,
  gradientCss: string,
  fallbackCss: string,
): string {
  return enabled ? gradientCss : fallbackCss
}

interface SettingsState extends SystemSettings {
  setPalette: (p: SystemPaletteId) => void
  setGradient: (area: GradientArea, value: boolean) => void
  setGradients: (value: boolean) => void
  setRadius: (r: RadiusPreset) => void
  setFontScale: (f: FontScale) => void
  setPaperGrain: (v: boolean) => void
  setGlassUI: (v: boolean) => void
  setDeskBackground: (v: boolean) => void
  setReduceMotion: (v: boolean) => void
  setConfirmDelete: (v: boolean) => void
  setAutoSave: (v: boolean) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setPalette: (palette) => set({ palette }),
      setGradient: (area, value) =>
        set((s) => ({ gradients: { ...s.gradients, [area]: value } })),
      setGradients: (value) =>
        set((s) => ({
          gradients: {
            dashboard: value,
            covers: value,
            charts: value,
            badges: value,
          },
        })),
      setRadius: (radius) => set({ radius }),
      setFontScale: (fontScale) => set({ fontScale }),
      setPaperGrain: (paperGrain) => set({ paperGrain }),
      setGlassUI: (glassUI) => set({ glassUI }),
      setDeskBackground: (deskBackground) => set({ deskBackground }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setConfirmDelete: (confirmDelete) => set({ confirmDelete }),
      setAutoSave: (autoSave) => set({ autoSave }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'plannerhub-settings',
    },
  ),
)

export function getPaletteDef(id: SystemPaletteId): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}
