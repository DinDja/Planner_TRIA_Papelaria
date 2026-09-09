import type { PlanId } from './plan'

/** Soma meses sem transformar 31 de janeiro em uma data de março. */
export function addMonthsClamped(value: Date, months: number): Date {
  const result = new Date(value)
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    0,
  )).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

export function getPlanPeriodEnd(plan: PlanId, startsAt = new Date()): Date {
  return addMonthsClamped(startsAt, plan === 'annual' ? 12 : 1)
}

export function isFutureIso(value: string | null | undefined, now = new Date()): boolean {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > now.getTime()
}
