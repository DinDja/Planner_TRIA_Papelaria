'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

export function AuthHomeRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, router, user])

  if (!loading && !user) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Verificando sua sessão</span>
    </div>
  )
}
