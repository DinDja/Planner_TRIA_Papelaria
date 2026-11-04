import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/auth/theme-toggle'

export const metadata: Metadata = {
  title: 'Tria Papelaria — Entrar',
  description: 'Acesse sua conta Tria Papelaria ou crie uma nova conta.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh">
      <Link
        href="/"
        className="absolute left-5 top-5 z-50 inline-flex min-h-9 items-center rounded-sm border border-border/50 bg-background/50 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voltar à página inicial
      </Link>

      {/* Switch de tema — canto superior direito, acima de tudo */}
      <ThemeToggle className="absolute right-5 top-5 z-50" />

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  )
}
