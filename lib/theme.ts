import type { SystemPalette } from './types'

export const SYSTEM_PALETTES = [
  { id: 'rose', label: 'Rosa', value: '#d1bdb8', rgb: '209 189 184' },
  { id: 'mustard', label: 'Mostarda', value: '#b76f06', rgb: '183 111 6' },
  { id: 'green', label: 'Verde', value: '#6a634d', rgb: '106 99 77' },
  { id: 'beige', label: 'Bege', value: '#ddd6c6', rgb: '221 214 198' },
] as const satisfies ReadonlyArray<{
  id: SystemPalette
  label: string
  value: string
  rgb: string
}>

export const SYSTEM_PALETTE_MAP = Object.fromEntries(
  SYSTEM_PALETTES.map((palette) => [palette.id, palette]),
) as Record<SystemPalette, (typeof SYSTEM_PALETTES)[number]>

export const DEFAULT_SYSTEM_PALETTE: SystemPalette = 'rose'
