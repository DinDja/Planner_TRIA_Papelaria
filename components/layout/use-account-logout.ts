'use client'

import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth/auth-context'

export function useAccountLogout() {
  const { logout } = useAuth()

  return async () => {
    try {
      await logout()
      toast({ title: 'Você saiu da conta', variant: 'default' })
      window.location.replace('/')
    } catch {
      toast({ title: 'Não foi possível sair agora', variant: 'error' })
    }
  }
}
