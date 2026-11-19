'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/lib/auth/roles'
import type { PlanId, SubscriptionStatus } from './plan'
import { isFutureIso } from './period'

/**
 * Estado da assinatura da usuária atual.
 *
 * O papel `admin` espelha o vínculo Firebase em `admin/{uid}` e libera acesso
 * sem cobrança. Assinantes comuns precisam de `plan` ativo.
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
  /** Indica se o acesso atual foi concedido gratuitamente pela administração. */
  gratuityActive?: boolean
  gratuityIndefinite?: boolean
}

/** Dados de cobrança; o papel nunca vem daqui. */
export type SubscriptionPlanState = Omit<Subscription, 'role'>

interface SubscriptionState extends Subscription {
  /** UID cuja assinatura já foi confirmada pelo snapshot do Firestore. */
  hydratedUid: string | null
  /** Atualiza apenas os dados de cobrança (o papel é gerido pelo admin/{uid}). */
  setSubscription: (s: Partial<SubscriptionPlanState>) => void
  /** Define o papel com base no vínculo administrativo. */
  setRole: (role: Role) => void
  /** Aplica a assinatura remota inteira e libera o gate para este UID. */
  syncFromRemote: (uid: string, value: unknown) => void
  /** Libera o gate usando o cache quando o Firestore não responde. */
  markHydrated: (uid: string) => void
  reset: () => void
}

const EMPTY_PLAN_STATE: SubscriptionPlanState = {
  plan: null,
  status: 'none',
  since: null,
  lastPayment: null,
  paidUntil: null,
  trialStartedAt: null,
  cancelledAt: null,
  gratuityActive: false,
  gratuityIndefinite: false,
}

const EMPTY: Subscription = {
  role: 'subscriber',
  ...EMPTY_PLAN_STATE,
}

const PLAN_STATE_KEYS = Object.keys(EMPTY_PLAN_STATE) as Array<keyof SubscriptionPlanState>

function asIsoString(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null
}

/**
 * Normaliza `users/{uid}.subscription` para o formato da store.
 * Campos ausentes ou inválidos voltam ao padrão — isso impede que um cache
 * antigo de plano pago sobreviva a uma conta sem assinatura.
 */
export function normalizeRemoteSubscription(value: unknown): SubscriptionPlanState {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const plan = raw.plan === 'monthly' || raw.plan === 'annual' || raw.plan === 'trial'
    ? raw.plan
    : null
  const status = raw.status === 'active' || raw.status === 'past_due' || raw.status === 'cancelled'
    ? raw.status
    : 'none'

  return {
    plan,
    status,
    since: asIsoString(raw.since),
    lastPayment: asIsoString(raw.lastPayment),
    paidUntil: asIsoString(raw.paidUntil),
    trialStartedAt: asIsoString(raw.trialStartedAt),
    cancelledAt: asIsoString(raw.cancelledAt),
    gratuityActive: raw.gratuityActive === true,
    gratuityIndefinite: raw.gratuityIndefinite === true,
  }
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...EMPTY,
      hydratedUid: null,

      setSubscription: (patch) => set((s) => ({ ...s, ...patch })),

      setRole: (role) => set({ role }),

      syncFromRemote: (uid, value) => set((state) => {
        const next = normalizeRemoteSubscription(value)
        const changed = PLAN_STATE_KEYS.some((key) => state[key] !== next[key])
        if (!changed) return state.hydratedUid === uid ? {} : { hydratedUid: uid }
        return { ...next, hydratedUid: uid }
      }),

      markHydrated: (uid) => set((state) => (
        state.hydratedUid === uid ? {} : { hydratedUid: uid }
      )),

      reset: () => set({ ...EMPTY, hydratedUid: null }),
    }),
    {
      name: 'tria-papelaria-subscription',
      partialize: (s) => ({
        role: s.role,
        plan: s.plan,
        status: s.status,
        since: s.since,
        lastPayment: s.lastPayment,
        paidUntil: s.paidUntil,
        trialStartedAt: s.trialStartedAt,
        cancelledAt: s.cancelledAt,
        gratuityActive: s.gratuityActive,
        gratuityIndefinite: s.gratuityIndefinite,
      }),
    },
  ),
)

// ─── Helpers de acesso ───────────────────────────────────────────────────────

/**
 * Verifica se a usuária atual tem acesso liberado (assinatura ativa OU admin).
 */
export function hasAccess(sub: Subscription): boolean {
  if (sub.role === 'admin') return true
  if (!sub.plan || (sub.status !== 'active' && sub.status !== 'cancelled')) return false
  if (sub.status === 'active' && sub.gratuityIndefinite === true) return true

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
  if (sub.status === 'active' && sub.gratuityActive === true) return 'Gratuidade'
  if (sub.status === 'active' && sub.gratuityIndefinite === true) return 'Gratuidade'
  if (sub.status === 'active' && sub.plan === 'trial') return 'Teste grátis'
  if (sub.status === 'active') return 'Ativa'
  if (sub.status === 'cancelled' && isFutureIso(sub.paidUntil)) return 'Cancelada · acesso vigente'
  if (sub.status === 'past_due') return 'Pagamento vencido'
  if (sub.status === 'cancelled') return 'Cancelada'
  return 'Sem assinatura'
}
