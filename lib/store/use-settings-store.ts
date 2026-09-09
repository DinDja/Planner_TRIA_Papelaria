'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FontScale, GradientArea, RadiusPreset, SystemSettings } from '../types'

export const DEFAULT_SETTINGS: SystemSettings = {
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
