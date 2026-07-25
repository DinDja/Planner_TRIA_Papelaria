'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Loader2, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [blocked, setBlocked] = useState(false)
  const [checkBlock, setCheckBlock] = useState(true)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then((s) => {
        setBlocked(Boolean(s.exists() && (s.data() as any)?.blocked))
      })
      .catch(() => {})
      .finally(() => setCheckBlock(false))
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      const dest = encodeURIComponent(pathname || '/')
      router.replace(`/auth/login?next=${dest}`)
    }
  }, [user, loading, router, pathname])

  if (loading || (user && checkBlock)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  if (blocked) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center px-6">
        <Ban size={28} className="text-destructive" />
        <p className="text-sm text-muted-foreground max-w-sm">
          Sua conta foi bloqueada pela administração do PlannerHub.
        </p>
        <Button
          variant="link"
          onClick={() => useAuth_signOut(router)}
          className="mt-1"
        >
          Sair da conta
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

function useAuth_signOut(router: ReturnType<typeof useRouter>) {
  return import('firebase/auth').then(({ getAuth, signOut }) => {
    signOut(getAuth()).then(() => router.replace('/auth/login'))
  })
}

