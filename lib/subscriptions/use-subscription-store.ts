'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/auth/roles'
import type { PlanId, SubscriptionStatus } from './plan'
import { isFutureIso } from './period'

/**
 * Estado da assinatura da usuária atual.
 *
 * A administradora (dona do negócio) tem `role: 'admin'` e acesso automático
 * a tudo — sem cobrança. As assinantes comuns precisam de `plan` ativo.
 *
 * Persistido em localStorage (cache offline) e sincronizado com Firestore
 * pelo StoreSyncProvider via root-doc field `subscription`.
 */

export interface Subscription {
  /** Role no sistema. */
  role: Role
  /** Plano atual (mensal/anual/teste). `null` se ainda não assinou. */
  plan: PlanId | null
  /** Status da cobrança. */
  status: SubscriptionStatus
  /** ISO date de início da assinatura atual. */
  since: string | null
  /** ISO date do último pagamento confirmado. */
  lastPayment: string | null
  /** ISO date até quando o período contratado permanece disponível. */
  paidUntil: string | null
  /** Primeiro início do teste. Mantido para impedir um segundo uso. */
  trialStartedAt: string | null
  /** ISO date em que a usuária pediu o cancelamento. */
  cancelledAt: string | null
}

interface SubscriptionState extends Subscription {
  setSubscription: (s: Partial<Subscription>) => void
  reset: () => void
}

const EMPTY: Subscription = {
  role: 'subscriber',
  plan: null,
  status: 'none',
  since: null,
  lastPayment: null,
  paidUntil: null,
  trialStartedAt: null,
  cancelledAt: null,
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...EMPTY,

      setSubscription: (patch) => set((s) => ({ ...s, ...patch })),

      reset: () => set(EMPTY),
    }),
    { name: 'tria-papelaria-subscription' },
  ),
)

// ─── Helpers de acesso ───────────────────────────────────────────────────────

/**
 * Verifica se a usuária atual tem acesso liberado (assinatura ativa OU admin).
 */
export function hasAccess(sub: Subscription): boolean {
  if (sub.role === 'admin') return true
  if (!sub.plan || (sub.status !== 'active' && sub.status !== 'cancelled')) return false

  // Assinaturas antigas/manualizadas podem não ter validade salva.
  if (sub.plan !== 'trial' && sub.status === 'active' && !sub.paidUntil) return true
  return isFutureIso(sub.paidUntil)
}

/**
 * Verifica se é admin.
 */
export function isAdmin(sub: Subscription): boolean {
  return sub.role === 'admin'
}

/**
 * Selo legível do status da assinatura.
 */
export function statusLabel(sub: Subscription): string {
  if (sub.role === 'admin') return 'Dona'
  if (sub.status === 'active' && sub.plan === 'trial') return 'Teste grátis'
  if (sub.status === 'active') return 'Ativa'
  if (sub.status === 'cancelled' && isFutureIso(sub.paidUntil)) return 'Cancelada · acesso vigente'
  if (sub.status === 'past_due') return 'Pagamento vencido'
  if (sub.status === 'cancelled') return 'Cancelada'
  return 'Sem assinatura'
}
