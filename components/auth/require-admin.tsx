'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useSubscriptionStore, isAdmin } from '@/lib/subscriptions/use-subscription-store'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Guarda de rota para administradoras (dona do negócio).
 * Redireciona assinantes comuns para o dashboard e mostra loading
 * enquanto a role ainda não foi derivada do onAuthStateChanged.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth()
  const sub = useSubscriptionStore()
  const router = useRouter()
  const pathname = usePathname()

  const isAdminRole = role === 'admin' || isAdmin(sub)

  useEffect(() => {
    if (loading) return
    if (!user) {
      const dest = encodeURIComponent(pathname || '/')
      router.replace(`/auth/login?next=${dest}`)
      return
    }
    if (!isAdminRole) {
      router.replace('/dashboard')
    }
  }, [user, loading, isAdminRole, router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  if (!isAdminRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center px-6">
        <ShieldAlert size={28} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-sm">
          Esta área é restrita à administração do PlannerHub.
        </p>
        <Button variant="link" onClick={() => router.replace('/dashboard')} className="mt-1">
          Voltar ao dashboard
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
