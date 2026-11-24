import { describe, expect, it } from 'vitest'
import type { RecurringTask } from '@/lib/types'
import { recurringOccursOn, toISODate } from '@/lib/routine/occurrences'

const baseTask: RecurringTask = {
  id: 'rec-1',
  title: 'Rotina',
  frequency: 'daily',
  priority: 'medium',
  active: true,
  nextDue: '2026-11-24',
  createdAt: '2026-11-01T12:00:00.000Z',
}

// 24/11/2026 é uma terça-feira (Weekday: Seg=0 … Dom=6 → 1).
const tuesday = new Date(2026, 10, 24, 12)
const wednesday = new Date(2026, 10, 25, 12)

describe('recurringOccursOn', () => {
  it('diária acontece todos os dias', () => {
    expect(recurringOccursOn(baseTask, tuesday)).toBe(true)
    expect(recurringOccursOn(baseTask, wednesday)).toBe(true)
  })

  it('semanal respeita os dias escolhidos', () => {
    const weekly: RecurringTask = { ...baseTask, frequency: 'weekly', weekdays: [1] }
    expect(recurringOccursOn(weekly, tuesday)).toBe(true)
    expect(recurringOccursOn(weekly, wednesday)).toBe(false)
  })

  it('mensal respeita o dia do mês', () => {
    const monthly: RecurringTask = { ...baseTask, frequency: 'monthly', dayOfMonth: 24 }
    expect(recurringOccursOn(monthly, tuesday)).toBe(true)
    expect(recurringOccursOn(monthly, wednesday)).toBe(false)
  })

  it('não acontece antes da criação nem quando inativa', () => {
    expect(recurringOccursOn(baseTask, new Date(2026, 9, 31, 12))).toBe(false)
    expect(recurringOccursOn({ ...baseTask, active: false }, tuesday)).toBe(false)
  })

  it('toISODate preserva a data local', () => {
    expect(toISODate(tuesday)).toBe('2026-11-24')
  })
})
