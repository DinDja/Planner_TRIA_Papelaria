import type { RecurringTask, Weekday } from '@/lib/types'

/** YYYY-MM-DD local (sem conversão de fuso). */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Verifica se uma tarefa recorrente acontece na data informada.
 * A data de criação é o limite inferior: não projetamos ocorrências
 * anteriores ao cadastro da rotina.
 */
export function recurringOccursOn(task: RecurringTask, date: Date): boolean {
  if (!task.active) return false
  const createdAt = new Date(task.createdAt)
  if (!Number.isNaN(createdAt.getTime()) && toISODate(date) < toISODate(createdAt)) return false

  if (task.frequency === 'daily') return true
  if (task.frequency === 'weekly') {
    const weekday = ((date.getDay() + 6) % 7) as Weekday
    return (task.weekdays ?? []).includes(weekday)
  }
  return date.getDate() === task.dayOfMonth
}
