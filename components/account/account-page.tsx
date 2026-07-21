'use client'

import { useState } from 'react'
import { useProfileStore, AVATAR_OPTIONS } from '@/lib/store/use-profile-store'
import { cn } from '@/lib/utils'
import {
  User,
  HelpCircle,
  BookOpen,
  MessageCircle,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/primitives'
import { Button } from '../ui/button'
import { Separator } from '../ui/primitives'
import { toast } from '../ui/toaster'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const FAQS = [
  { q: 'Como criar um novo planner?', a: 'Clique em "Novo planner" no menu lateral ou use o atalho Ctrl+K para abrir a paleta de comandos.' },
  { q: 'Onde ficam os templates?', a: 'Acesse "Galeria de templates" pelo menu lateral ou pela paleta de comandos.' },
  { q: 'Como faço backup dos meus dados?', a: 'Todos os dados são salvos automaticamente no navegador. Você pode exportar seus planners pela opção "Exportar" no menu de cada planner.' },
  { q: 'Os dados ficam salvos em nuvem?', a: 'Atualmente, todos os dados são armazenados localmente no navegador (localStorage).' },
  { q: 'Como apagar um planner?', a: 'No dashboard, clique no ⋮ (mais opções) do planner e selecione "Excluir".' },
]

function TabButton({ active, label, icon: Icon, onClick }: {
  active: boolean
  label: string
  icon: React.ComponentType<{ size?: number }>
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

export function AccountPage() {
  const [tab, setTab] = useState<'perfil' | 'ajuda'>('perfil')
  const profile = useProfileStore()

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <div className={cn('mb-8', enter)}>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#8b5cf618' }}>
            <User size={22} style={{ color: '#8b5cf6' }} />
          </span>
          Conta e Admin
        </h1>
        <p className="text-muted-foreground mt-1">Seu perfil, ajuda e informações do sistema.</p>
      </div>

      <div className={cn('flex gap-2 mb-6', enter)}>
        <TabButton active={tab === 'perfil'} label="Perfil" icon={User} onClick={() => setTab('perfil')} />
        <TabButton active={tab === 'ajuda'} label="Ajuda" icon={HelpCircle} onClick={() => setTab('ajuda')} />
      </div>

      {tab === 'perfil' && (
        <div className={cn(enter)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User size={18} />
                Seu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Avatar picker */}
              <div>
                <label className="text-sm font-medium mb-2 block">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((a) => (
                    <button
                      key={a}
                      onClick={() => profile.setAvatar(a)}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl text-lg transition-all cursor-pointer',
                        profile.avatar === a
                          ? 'bg-primary/15 ring-2 ring-primary scale-110'
                          : 'bg-muted hover:bg-muted/80',
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-3xl shadow-sm">
                  {profile.avatar}
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile.name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{profile.email || 'Sem e-mail'}</p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome</label>
                <Input
                  placeholder="Seu nome"
                  value={profile.name}
                  onChange={(e) => profile.setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">E-mail</label>
                <Input
                  placeholder="seu@email.com"
                  type="email"
                  value={profile.email}
                  onChange={(e) => profile.setEmail(e.target.value)}
                />
              </div>

              <Button
                variant="default"
                className="rounded-xl self-start"
                onClick={() => toast({ title: 'Perfil salvo', variant: 'success' })}
              >
                Salvar
              </Button>
            </CardContent>
          </Card>

          {/* System info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText size={18} />
                Sobre o Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">PlannerHub</strong> — v1.0.0</p>
              <p>Digital Planner pessoal com canvas editor, módulos de organização e acompanhamento.</p>
              <p className="text-xs mt-2">Todos os dados são armazenados localmente no navegador.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'ajuda' && (
        <div className={cn('flex flex-col gap-4', enter)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle size={18} />
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {FAQS.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-border/50 [&[open]]:border-border">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm font-medium hover:text-foreground rounded-xl group-open:rounded-b-none group-open:border-b border-border/50">
                    {faq.q}
                    <HelpCircle size={14} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen size={18} />
                Recursos e Atalhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {[
                  { keys: 'Ctrl+K', desc: 'Abrir paleta de comandos' },
                  { keys: 'Ctrl+B', desc: 'Alternar sidebar' },
                  { keys: 'Ctrl+Enter', desc: 'Criar novo planner' },
                  { keys: 'Esc', desc: 'Fechar modal / paleta' },
                ].map((s) => (
                  <div key={s.keys} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2">
                    <span className="text-muted-foreground">{s.desc}</span>
                    <kbd className="rounded-lg border border-border/60 bg-background px-2 py-0.5 text-xs font-mono font-medium shadow-sm">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
