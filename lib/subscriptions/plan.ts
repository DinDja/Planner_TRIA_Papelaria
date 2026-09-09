// ─── Catálogo público de planos ─────────────────────────────────────────────

export type PaidPlanId = 'monthly' | 'annual'
export type PlanId = PaidPlanId | 'trial'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'none'

export interface PlanDefinition {
  id: PlanId
  label: string
  /** Preço em centavos (BRL). O teste grátis sempre vale zero. */
  price: number
  /** Período legível exibido na página de planos. */
  period: 'por mês' | 'por ano' | 'por 1 mês'
  description: string
  features: readonly string[]
  savings?: string
  color: string
}

const SHARED_FEATURES = [
  'Acesso a todos os módulos',
  'Acesso a todas as atualizações',
] as const

export const PLANS: Record<PlanId, PlanDefinition> = {
  monthly: {
    id: 'monthly',
    label: 'Mensal',
    price: 3000,
    period: 'por mês',
    description: 'Para organizar no seu ritmo, mês a mês.',
    features: [...SHARED_FEATURES, 'Cancele quando quiser'],
    color: '#8f7667',
  },
  annual: {
    id: 'annual',
    label: 'Anual',
    price: 30000,
    period: 'por ano',
    description: 'Um ano inteiro de Tria, pagando menos.',
    features: [...SHARED_FEATURES, 'Economia de R$ 60 por ano'],
    savings: 'R$ 60 de economia no ano',
    color: '#b76f06',
  },
  trial: {
    id: 'trial',
    label: 'Teste grátis',
    price: 0,
    period: 'por 1 mês',
    description: 'Um mês para experimentar a Tria por inteiro.',
    features: [...SHARED_FEATURES, 'Não precisa de cartão para testar'],
    color: '#6a634d',
  },
}

export const PLAN_ORDER: PlanId[] = ['monthly', 'annual', 'trial']

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === 'monthly' || value === 'annual'
}

/** Formata centavos como moeda BRL. */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Calcula o MRR; anual é diluído em 12 meses e teste não gera receita. */
export function monthlyEquivalent(cents: number, plan: PlanId): number {
  if (plan === 'annual') return Math.round(cents / 12)
  if (plan === 'trial') return 0
  return cents
}
