import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/auth-form'

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <AuthForm initialView="esqueci-senha" />
    </Suspense>
  )
}
