'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { hasAccess, useSubscriptionStore } from '@/lib/subscriptions/use-subscription-store'

/** Telas que continuam acessíveis sem assinatura: comprar e pedir ajuda. */
const ALWAYS_ALLOWED_PATHS = new Set(['/plans', '/conta'])

/**
 * Se o Firestore demorar ou estiver offline, usa o cache local após este
 * intervalo em vez de deixar a tela presa no carregamento.
 */
const HYDRATION_FALLBACK_MS = 4_000

/**
 * Bloqueia todos os módulos para contas sem assinatura ativa.
 * Administradoras passam direto (o papel vem de `admin/{uid}`).
 */
export function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, adminLoading } = useAuth()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const subscription = useSubscriptionStore()
  const [fallback, setFallback] = useState<{ uid: string; ready: boolean } | null>(null)

  const exempt = ALWAYS_ALLOWED_PATHS.has(pathname)
  const hydrated = Boolean(user) && subscription.hydratedUid === user?.uid
  const fallbackReady = Boolean(user && fallback && fallback.uid === user.uid && fallback.ready)
  const ready = !loading && !adminLoading && (hydrated || fallbackReady)
  const canAccess = ready && (isAdmin || hasAccess(subscription))

  useEffect(() => {
    if (exempt || !user || loading || adminLoading || hydrated) return
    const uid = user.uid
    const timer = window.setTimeout(() => setFallback({ uid, ready: true }), HYDRATION_FALLBACK_MS)
    return () => window.clearTimeout(timer)
  }, [exempt, user, loading, adminLoading, hydrated])

  useEffect(() => {
    if (exempt || !ready || !user || canAccess) return
    router.replace('/plans')
  }, [exempt, ready, user, canAccess, router])

  if (exempt) return <>{children}</>

  if (loading || adminLoading || (user && !ready)) {
    return <AccessPending />
  }

  if (!user) return null

  if (!canAccess) {
    return (
      <AccessPending message="Sua conta ainda não tem um plano ativo. Abrindo os planos…" />
    )
  }

  return <>{children}</>
}

function AccessPending({ message }: { message?: string }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? 'Verificando seu acesso…'}
      </p>
    </div>
  )
}
