// ─── Definição dos planos ────────────────────────────────────────────────────
// Não há plano gratuito. Tudo é pago: mensal ou anual.

export type PlanId = 'monthly' | 'annual'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'none'

export interface PlanDefinition {
  id: PlanId
  label: string
  /** Preço em centavos (BRL). */
  price: number
  /** Período legível. */
  period: 'por mês' | 'por ano'
  /** Descrição curta. */
  description: string
  /** Economia legível (somente para anual). */
  savings?: string
  color: string
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  monthly: {
    id: 'monthly',
    label: 'Premium Mensal',
    price: 1990,
    period: 'por mês',
    description: 'Leve a organização a sério, mês a mês.',
    color: '#c9b6e4',
  },
  annual: {
    id: 'annual',
    label: 'Premium Anual',
    price: 14990,
    period: 'por ano',
    description: 'Compromisso anual com economia real.',
    savings: 'Economize R$ 89,80/ano',
    color: '#f0b429',
  },
}

export const PLAN_ORDER: PlanId[] = ['monthly', 'annual']

/** Formata centavos como moeda BRL. */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Calcula o MRR (receita mensal recorrente) de uma assinatura.
 * Plano anual é diluído por 12 meses.
 */
export function monthlyEquivalent(cents: number, plan: PlanId): number {
  if (plan === 'annual') return Math.round(cents / 12)
  return cents
}
