'use client'

import type { TaskPriority, Weekday } from '@/lib/types'

// ─── Prioridades ──────────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#e05b6d',
  medium: '#f0b429',
  low: '#5b8dbf',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

// ─── Dias da semana (Weekday: 0=Seg … 6=Dom) ──────────────────────────────────

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'Seg',
  1: 'Ter',
  2: 'Qua',
  3: 'Qui',
  4: 'Sex',
  5: 'Sáb',
  6: 'Dom',
}

export const WEEKDAY_LONG: Record<Weekday, string> = {
  0: 'Segunda',
  1: 'Terça',
  2: 'Quarta',
  3: 'Quinta',
  4: 'Sexta',
  5: 'Sábado',
  6: 'Domingo',
}

/** Hoje no formato YYYY-MM-DD (local) */
export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Dia da semana de hoje no formato Weekday (Seg=0..Dom=6) */
export function todayWeekday(): Weekday {
  return ((new Date().getDay() + 6) % 7) as Weekday
}

/** Formata YYYY-MM-DD para exibição curta, ex: "21 jul" */
export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d
    .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

/** Diferença em dias entre hoje e a data (negativo = passado) */
export function daysFromToday(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/** Rótulo amigável para data relativa */
export function relativeDateLabel(iso: string): string {
  const diff = daysFromToday(iso)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  if (diff < -1) return `${-diff} dias atrás`
  return `em ${diff} dias`
}
