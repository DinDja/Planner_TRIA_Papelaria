'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Guarda de rota para administradoras (dona do negócio).
 * Redireciona assinantes comuns para o dashboard e mostra loading
 * enquanto consulta o vínculo admin/{uid} no Firestore.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, adminLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading || adminLoading) return
    if (!user) {
      const dest = encodeURIComponent(pathname || '/')
      router.replace(`/auth/login?next=${dest}`)
      return
    }
    if (!isAdmin) {
      router.replace('/dashboard')
    }
  }, [user, loading, adminLoading, isAdmin, router, pathname])

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:px-6">
        <ShieldAlert size={28} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-sm">
          Esta área é restrita à administração da Tria Papelaria.
        </p>
        <Button variant="link" onClick={() => router.replace('/dashboard')} className="mt-1">
          Voltar ao dashboard
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
