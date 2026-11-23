'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { hasAccess, useSubscriptionStore } from './use-subscription-store'

/**
 * Acesso confirmado pelo servidor: espera o vínculo `admin/{uid}` e o
 * snapshot do documento-raiz (que traz `subscription`) antes de liberar
 * qualquer módulo. Fora do gate, `ready` fica falso e a UI trata como
 * acesso ainda não liberado.
 */
export function useSubscriptionAccess() {
  const { user, isAdmin, adminLoading } = useAuth()
  const subscription = useSubscriptionStore()
  const ready = Boolean(user) && !adminLoading && subscription.hydratedUid === user?.uid

  return {
    subscription,
    ready,
    allowed: ready && (isAdmin || hasAccess(subscription)),
  }
}
