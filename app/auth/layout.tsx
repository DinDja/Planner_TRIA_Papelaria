import type { Metadata } from 'next'
import { AuthDecorativePanel } from '@/components/auth/auth-decorative-panel'

export const metadata: Metadata = {
  title: 'PlannerHub — Entrar',
  description: 'Acesse sua conta PlannerHub ou crie uma nova conta.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 lg:h-dvh lg:sticky lg:top-0">
        <AuthDecorativePanel />
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  )
}
