import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/auth/theme-toggle'

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
    <div className="relative flex min-h-dvh">
      {/* Switch de tema — canto superior direito, acima de tudo */}
      <ThemeToggle className="absolute right-5 top-5 z-50" />

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  )
}
