'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const FAQS = [
  { q: 'Como criar um novo planner?', a: 'Clique em "Novo planner" no menu lateral ou use o atalho Ctrl+K para abrir a paleta de comandos.' },
  { q: 'Como faço backup dos meus dados?', a: 'Seus dados são sincronizados com a sua conta e mantidos em cache no navegador para uso mais rápido.' },
  { q: 'Os dados ficam salvos em nuvem?', a: 'Sim. A conta usa o Firestore como fonte principal e mantém uma cópia local para funcionamento offline.' },
  { q: 'Como apagar um planner?', a: 'No dashboard, clique no ⋮ (mais opções) do planner e selecione "Excluir".' },
]

export function AccountPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <header className={cn('mb-8', enter)}>
        <h1 className="text-3xl font-bold tracking-tight">Ajuda</h1>
        <p className="text-muted-foreground mt-1">
          Respostas rápidas, atalhos e informações sobre a TRIA.
        </p>
      </header>

      <div className={cn('flex flex-col gap-4', enter)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border/50 [&[open]]:border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl border-border/50 px-4 py-3 text-sm font-medium hover:text-foreground group-open:rounded-b-none group-open:border-b">
                  {faq.q}
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-4 py-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recursos e atalhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              {[
                { keys: 'Ctrl+K', desc: 'Abrir paleta de comandos' },
                { keys: 'Ctrl+B', desc: 'Alternar sidebar' },
                { keys: 'Ctrl+Enter', desc: 'Criar novo planner' },
                { keys: 'Esc', desc: 'Fechar modal / paleta' },
              ].map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2">
                  <span className="text-muted-foreground">{shortcut.desc}</span>
                  <kbd className="rounded-lg border border-border/60 bg-background px-2 py-0.5 text-xs font-mono font-medium shadow-sm">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sobre o sistema</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Tria Papelaria</strong> — v1.0.0</p>
            <p>Planner digital pessoal com editor em canvas e módulos de organização e acompanhamento.</p>
            <p className="text-xs mt-2">Os dados são sincronizados com a conta e mantidos em cache no navegador.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
