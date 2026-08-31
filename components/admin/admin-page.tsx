'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { PLANS } from '@/lib/subscriptions/plan'
import {
  subscribeUserManifests,
  subscribeAuditLogs,
  subscribeCoupons,
  subscribeAnnouncements,
  subscribePlans,
  promoteToAdmin,
  demoteFromAdmin,
  markPayment,
  pauseSubscription,
  cancelSubscription,
  blockUser,
  unblockUser,
  savePlan,
  deletePlan,
  saveCoupon,
  deleteCoupon,
  saveAnnouncement,
  deleteAnnouncement,
  type UserManifest,
  type AuditLog,
  type Coupon,
  type Announcement,
  type PlanDoc,
} from '@/lib/admin/client'
import type { PlanId } from '@/lib/subscriptions/plan'
import { toast } from '../ui/toaster'
import { Button } from '../ui/button'
import { Input } from '../ui/primitives'
import { Badge } from '../ui/primitives'
import {
  ShieldCheck,
  Users,
  Crown,
  Ban,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Megaphone,
  Ticket,
  Scroll,
  CreditCard,
  CircleDollarSign,
  Pencil,
  Trash2,
} from 'lucide-react'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'
const FONT_MONO = 'var(--font-geist), system-ui, sans-serif'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
const stagger = (i: number) => ({ animationDelay: `${i * 60}ms` })

type Tab = 'visao' | 'assinantes' | 'cobranca' | 'planos' | 'cupons' | 'comunicacao' | 'logs'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'visao', label: 'Visão', icon: ShieldCheck },
  { id: 'assinantes', label: 'Assinantes', icon: Users },
  { id: 'cobranca', label: 'Cobrança', icon: CreditCard },
  { id: 'planos', label: 'Planos', icon: Crown },
  { id: 'cupons', label: 'Cupons', icon: Ticket },
  { id: 'comunicacao', label: 'Comunicação', icon: Megaphone },
  { id: 'logs', label: 'Logs', icon: Scroll },
]

export function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('visao')

  // Estados separados por area — só subscreve à needed
  const [users, setUsers] = useState<UserManifest[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [customPlans, setCustomPlans] = useState<PlanDoc[]>([])

  useEffect(() => {
    const unsubs: Array<() => void> = []
    unsubs.push(subscribeUserManifests(setUsers))
    unsubs.push(subscribeAuditLogs(setLogs))
    unsubs.push(subscribeCoupons(setCoupons))
    unsubs.push(subscribeAnnouncements(setAnnouncements))
    unsubs.push(subscribePlans(setCustomPlans))
    return () => unsubs.forEach((u) => u())
  }, [])

  // Métricas honestas (sem mock)
  const activeCount = users.filter((u) => u.status === 'active').length
  const paidCount = users.filter((u) => u.plan !== null && u.status === 'active').length
  const cancelledCount = users.filter((u) => u.status === 'cancelled').length
  const pastDueCount = users.filter((u) => u.status === 'past_due').length
  const admins = users.filter((u) => u.role === 'admin')
  const blockedCount = users.filter((u) => u.blocked).length

  // MRR real — soma das assinaturas ativas
  const mrr = useMemo(() => {
    return users
      .filter((u) => u.plan && u.status === 'active')
      .reduce((acc, u) => {
        const plan = PLANS[u.plan]
        if (!plan) return acc
        return acc + (u.plan === 'annual' ? Math.round(plan.price / 12) : plan.price)
      }, 0)
  }, [users])

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Cabeçalho — sem ícone SaaS genérico */}
      <div className={cn('mb-8', enter)}>
        <p
          className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground/55"
          style={{ fontFamily: FONT_MONO }}
        >
          gestão do sistema
        </p>
        <h1
          className="mt-1 text-balance"
          style={{ fontFamily: FONT_SERIF, fontSize: '2.1rem', lineHeight: 1.1 }}
        >
          Painel de administração
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
          Acesso restrito à administração. Tudo aqui é dado real do Firestore — sem mock.
        </p>
      </div>

      {/* Tabs */}
      <div className={cn('mb-6 flex flex-wrap gap-1', enter)}>
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-all',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo por tab */}
      {tab === 'visao' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="MRR real" value={formatBRLLocal(mrr)} color="#8b5cf6" icon={CircleDollarSign} index={0} />
            <Stat label="Ativas" value={String(activeCount)} color="#10b981" icon={CheckCircle2} index={1} />
            <Stat label="Vencidas" value={String(pastDueCount)} color="#f59e0b" icon={PauseCircle} index={2} />
            <Stat label="Bloqueadas" value={String(blockedCount)} color="#ef4444" icon={Ban} index={3} />
          </div>

          <div className={cn('rounded-2xl border border-border/50 bg-card p-6', enter)} style={stagger(4)}>
            <p
              className="text-[0.6rem] uppercase tracking-[0.26em] text-muted-foreground/45"
              style={{ fontFamily: FONT_MONO }}
            >
              um recado honesto
            </p>
            <p
              className="mt-3 text-balance"
              style={{ fontFamily: FONT_HAND, fontSize: '1.55rem', lineHeight: 1.2 }}
            >
              {users.length === 0
                ? 'Nenhuma usuária no sistema ainda.'
                : `Há ${users.length} ${users.length === 1 ? 'pessoa inscrita' : 'pessoas inscritas'} no PlannerHub.`}
            </p>
            {cancelledCount > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {cancelledCount} {cancelledCount === 1 ? 'cancelou' : 'cancelaram'} — vale olhar.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'assinantes' && (
        <AssinantesTab
          users={users}
          currentUid={user?.uid ?? ''}
          onPromote={(t) => user && promoteToAdmin(user, t).then(() => toast({ title: 'Promovida a admina' }))}
          onDemote={(t) => user && demoteFromAdmin(user, t).then(() => toast({ title: 'Rebaixada para assinante' }))}
          onBlock={(t) => user && blockUser(user, t).then(() => toast({ title: 'Usuária bloqueada', variant: 'error' }))}
          onUnblock={(t) => user && unblockUser(user, t).then(() => toast({ title: 'Usuária desbloqueada' }))}
        />
      )}

      {tab === 'cobranca' && (
        <CobrancaTab
          users={users}
          onMarkPayment={(t, plan, paidUntil) =>
            user && markPayment(user, t, plan, paidUntil).then(() => toast({ title: 'Pagamento registrado' }))
          }
          onPause={(t) => user && pauseSubscription(user, t).then(() => toast({ title: 'Assinatura pausada', variant: 'error' }))}
          onCancel={(t) => user && cancelSubscription(user, t).then(() => toast({ title: 'Assinatura cancelada', variant: 'error' }))}
        />
      )}

      {tab === 'planos' && (
        <PlanosTab
          customPlans={customPlans}
          onSave={(p) => savePlan(p).then(() => toast({ title: 'Plano salvo' }))}
          onDelete={(id) => deletePlan(id).then(() => toast({ title: 'Plano removido', variant: 'error' }))}
        />
      )}

      {tab === 'cupons' && (
        <CuponsTab
          coupons={coupons}
          onSave={(c) => saveCoupon(c).then(() => toast({ title: 'Cupom salvo' }))}
          onDelete={(id) => deleteCoupon(id).then(() => toast({ title: 'Cupom removido', variant: 'error' }))}
        />
      )}

      {tab === 'comunicacao' && (
        <ComunicacaoTab
          announcements={announcements}
          onSave={(a) => saveAnnouncement(a).then(() => toast({ title: 'Anúncio publicado' }))}
          onDelete={(id) => deleteAnnouncement(id).then(() => toast({ title: 'Anúncio removido', variant: 'error' }))}
        />
      )}

      {tab === 'logs' && <LogsTab logs={logs} />}

      {/* Rodapé discreto */}
      <div className={cn('mt-12 border-t border-border/40 pt-4 text-xs text-muted-foreground/55', enter)}>
        {admins.length} {admins.length === 1 ? 'admin' : 'admins'} · {users.length}{' '}
        {users.length === 1 ? 'pessoa' : 'pessoas'} no sistema.
      </div>
    </div>
  )
}

// ─── Subcomponentes por tab ───────────────────────────────────────────────────

function Stat({
  label,
  value,
  color,
  icon: Icon,
  index,
}: {
  label: string
  value: string
  color: string
  icon: React.ComponentType<{ size?: number }>
  index: number
}) {
  return (
    <div className={cn('rounded-2xl border border-border/40 p-4 bg-card', enter)} style={stagger(index)}>
      <div className="flex items-center justify-between">
        <span
          className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/55"
          style={{ fontFamily: FONT_MONO }}
        >
          {label}
        </span>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function TabelaSimples(props: {
  headers: string[]
  rows: React.ReactNode[][]
  empty: string
}) {
  if (props.rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        {props.empty}
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border/40">
            {props.headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  'px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.18em] font-medium text-muted-foreground',
                  i === props.headers.length - 1 && 'text-right',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 bg-card">
          {props.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/20 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={cn('px-4 py-3', ci === row.length - 1 && 'text-right')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Assinantes — listar + promover/demote + bloquear ─────────────────────────

function AssinantesTab({
  users,
  currentUid,
  onPromote,
  onDemote,
  onBlock,
  onUnblock,
}: {
  users: UserManifest[]
  currentUid: string
  onPromote: (t: UserManifest) => void | Promise<void>
  onDemote: (t: UserManifest) => void | Promise<void>
  onBlock: (t: UserManifest) => void | Promise<void>
  onUnblock: (t: UserManifest) => void | Promise<void>
}) {
  const [query, setQuery] = useState('')
  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase()),
  )

  const rows = filtered.map((u) => [
    <div key="u" className="flex items-center gap-3">
      <span className="text-xl">{u.avatar || '🦊'}</span>
      <div className="min-w-0">
        <p className="font-medium truncate">{u.name || '—'}</p>
        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
      </div>
    </div>,
    <Badge
      key="r"
      variant={u.role === 'admin' ? 'default' : 'outline'}
      className="text-[10px]"
    >
      {u.role === 'admin' ? 'Admina' : 'Assinante'}
    </Badge>,
    <Badge
      key="b"
      variant={u.blocked ? 'destructive' : 'outline'}
      className="text-[10px]"
    >
      {u.blocked ? 'Bloqueada' : 'Ativa'}
    </Badge>,
    <div key="a" className="flex justify-end gap-1 flex-wrap">
      {u.role !== 'admin' && (
        <Button size="sm" variant="ghost" onClick={() => onPromote(u)} className="text-xs">
          <Crown size={12} className="mr-1" /> Promover
        </Button>
      )}
      {u.role === 'admin' && u.uid !== currentUid && (
        <Button size="sm" variant="ghost" onClick={() => onDemote(u)} className="text-xs">
          Rebaixar
        </Button>
      )}
      {!u.blocked ? (
        <Button size="sm" variant="ghost" onClick={() => onBlock(u)} className="text-xs text-destructive">
          <Ban size={12} className="mr-1" /> Bloquear
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => onUnblock(u)} className="text-xs">
          <PlayCircle size={12} className="mr-1" /> Desbloquear
        </Button>
      )}
    </div>,
  ])

  return (
    <div className="space-y-4">
      <Input
        placeholder="buscar por nome ou e-mail…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <TabelaSimples
        headers={['Pessoa', 'Role', 'Conta', 'Ações']}
        rows={rows}
        empty="Nenhuma usuária inscrita ainda."
      />
      <p className="text-xs text-muted-foreground/55 max-w-md">
        Para promover a admina, a pessoa precisa já ter feito login ao menos uma
        vez (precisa existir manifest dela no banco).
      </p>
    </div>
  )
}

// ─── Cobrança — marcar pagamento, pausar, cancelar ──────────────────────────────

function CobrancaTab({
  users,
  onMarkPayment,
  onPause,
  onCancel,
}: {
  users: UserManifest[]
  onMarkPayment: (t: UserManifest, plan: PlanId, paidUntil?: string) => void | Promise<void>
  onPause: (t: UserManifest) => void | Promise<void>
  onCancel: (t: UserManifest) => void | Promise<void>
}) {
  const rows = users.map((u) => [
    <div key="u" className="flex items-center gap-3">
      <span className="text-xl">{u.avatar || '🦊'}</span>
      <div>
        <p className="font-medium truncate">{u.name || '—'}</p>
        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
      </div>
    </div>,
    <Badge key="s" variant="outline" className="text-[10px]">{statusLabelLocal(u.status)}</Badge>,
    <span key="l" className="text-[11px] text-muted-foreground">
      {u.lastPayment ? new Date(u.lastPayment).toLocaleDateString('pt-BR') : '—'}
    </span>,
    <div key="a" className="flex justify-end gap-1 flex-wrap">
      <Button size="sm" variant="ghost" onClick={() => onMarkPayment(u, 'monthly')} className="text-xs">
        <CheckCircle2 size={12} className="mr-1" /> Mensal
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onMarkPayment(u, 'annual')} className="text-xs">
        <Crown size={12} className="mr-1" /> Anual
      </Button>
      {u.status !== 'past_due' && u.status !== 'cancelled' && (
        <Button size="sm" variant="ghost" onClick={() => onPause(u)} className="text-xs">
          <PauseCircle size={12} className="mr-1" /> Pausar
        </Button>
      )}
      {u.status !== 'cancelled' && (
        <Button size="sm" variant="ghost" onClick={() => onCancel(u)} className="text-xs text-destructive">
          Cancelar
        </Button>
      )}
    </div>,
  ])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        Modo manual — sem gateway ainda. Marque os pagamentos combinados por fora
        (PIX/transferência). O sistema reflete honestamente o que você registrar.
      </div>
      <TabelaSimples
        headers={['Pessoa', 'Status', 'Último pgto.', 'Ações']}
        rows={rows}
        empty="Nenhuma cobrança registrada ainda."
      />
    </div>
  )
}

// ─── Planos — editar preços/descrições ──────────────────────────────────────────

function PlanosTab({
  customPlans,
  onSave,
  onDelete,
}: {
  customPlans: PlanDoc[]
  onSave: (p: PlanDoc) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  // Merge defaults com customizações da Firestore — admina pode overridear.
  const [drafts, setDrafts] = useState<Record<string, PlanDoc>>({})

  useEffect(() => {
    const next: Record<string, PlanDoc> = {}
    ;(Object.keys(PLANS) as PlanId[]).forEach((id) => {
      const custom = customPlans.find((p) => p.id === id)
      next[id] =
        custom ??
        ({
          ...PLANS[id],
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as PlanDoc)
    })
    setDrafts(next)
  }, [customPlans])

  return (
    <div className="space-y-4">
      {(Object.keys(drafts) as PlanId[]).map((id) => {
        const p = drafts[id]
        return (
          <div key={id} className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{PLANS[id].label}</span>
              <Badge variant={p.active ? 'default' : 'outline'} className="text-[10px]">
                {p.active ? 'Ativo' : 'Pausado'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground">
                Preço (centavos)
                <Input
                  type="number"
                  value={p.price}
                  onChange={(e) => setDrafts((s) => ({ ...s, [id]: { ...s[id], price: Number(e.target.value) } }))}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Descrição
                <Input
                  value={p.description}
                  onChange={(e) => setDrafts((s) => ({ ...s, [id]: { ...s[id], description: e.target.value } }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  onSave({
                    ...p,
                    updatedAt: new Date().toISOString(),
                    active: !p.active,
                  } as PlanDoc)
                }
                variant="ghost"
                className="text-xs"
              >
                {p.active ? 'Pausar' : 'Ativar'}
              </Button>
              <Button
                size="sm"
                onClick={() => onSave({ ...p, updatedAt: new Date().toISOString() } as PlanDoc)}
                className="text-xs"
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(id)}
                className="text-xs text-destructive"
              >
                Apagar
              </Button>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-muted-foreground/55">
        Alterações aqui só são lidas pelo sistema se você também substituir o
        objeto <code className="font-mono">PLANS</code> em <code className="font-mono">lib/subscriptions/plan.ts</code> — por ora só servem para a admina visualizar o catálogo.
      </p>
    </div>
  )
}

// ─── Cupons ───────────────────────────────────────────────────────────────────

function CuponsTab({
  coupons,
  onSave,
  onDelete,
}: {
  coupons: Coupon[]
  onSave: (c: Coupon) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState(10)
  const [editingId, setEditingId] = useState<string | null>(null)

  const create = () => {
    if (!code.trim()) return toast({ title: 'Digite um código', variant: 'error' })
    const current = editingId ? coupons.find((coupon) => coupon.id === editingId) : undefined
    const c: Coupon = {
      id: current?.id ?? code.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      code: code.trim().toUpperCase(),
      kind,
      value,
      active: current?.active ?? true,
      usedCount: current?.usedCount ?? 0,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      expiresAt: current?.expiresAt,
      maxUses: current?.maxUses,
      notes: current?.notes,
    }
    onSave(c)
    setCode('')
    setKind('percent')
    setValue(10)
    setEditingId(null)
  }

  const edit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setCode(coupon.code)
    setKind(coupon.kind)
    setValue(coupon.value)
  }

  const rows = coupons.map((c) => [
    <span key="c" className="font-mono">{c.code}</span>,
    <span key="k" className="text-xs">
      {c.kind === 'percent' ? `${c.value}%` : formatBRLLocal(c.value)}
    </span>,
    <Badge key="a" variant={c.active ? 'default' : 'outline'} className="text-[10px]">
      {c.active ? 'Ativo' : 'Inativo'}
    </Badge>,
    <span key="u" className="text-xs tabular-nums">{c.usedCount}</span>,
    <div key="actions" className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => edit(c)} className="gap-1 text-xs">
        <Pencil size={12} /> Editar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { if (editingId === c.id) setEditingId(null); onDelete(c.id) }} className="gap-1 text-xs text-destructive">
        <Trash2 size={12} /> Apagar
      </Button>
    </div>,
  ])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{editingId ? 'Editar cupom' : 'Novo cupom'}</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="CÓDIGO" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-[160px]" />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'percent' | 'fixed')}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="percent">Percentual</option>
            <option value="fixed">valor fixo</option>
          </select>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="max-w-[100px]"
          />
          {editingId && <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setCode(''); setKind('percent'); setValue(10) }}>Cancelar</Button>}
          <Button size="sm" onClick={create}>{editingId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </div>
      <TabelaSimples headers={['Código', 'Desconto', 'Status', 'Usos', '']} rows={rows} empty="Nenhum cupom criado." />
    </div>
  )
}

// ─── Comunicação — anúncios ─────────────────────────────────────────────────────

function ComunicacaoTab({
  announcements,
  onSave,
  onDelete,
}: {
  announcements: Announcement[]
  onSave: (a: Announcement) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [level, setLevel] = useState<'info' | 'success' | 'warning'>('info')
  const [editingId, setEditingId] = useState<string | null>(null)

  const publish = () => {
    if (!title.trim() || !body.trim()) return toast({ title: 'Preencha título e corpo', variant: 'error' })
    const current = editingId ? announcements.find((announcement) => announcement.id === editingId) : undefined
    const a: Announcement = {
      id: current?.id ?? `${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      level,
      active: current?.active ?? true,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      expiresAt: current?.expiresAt,
    }
    onSave(a)
    setTitle('')
    setBody('')
    setLevel('info')
    setEditingId(null)
  }

  const edit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setBody(announcement.body)
    setLevel(announcement.level)
  }

  const rows = announcements.map((a) => [
    <span key="t" className="font-medium">{a.title}</span>,
    <span key="b" className="text-xs text-muted-foreground truncate max-w-xs">{a.body}</span>,
    <Badge key="l" variant="outline" className="text-[10px]">{a.level}</Badge>,
    <div key="a" className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => edit(a)} className="gap-1 text-xs">
        <Pencil size={12} /> Editar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { if (editingId === a.id) setEditingId(null); onDelete(a.id) }} className="gap-1 text-xs text-destructive">
        <Trash2 size={12} /> Remover
      </Button>
    </div>,
  ])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{editingId ? 'Editar anúncio' : 'Novo anúncio'}</p>
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          placeholder="Mensagem para as usuárias…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
        <div className="flex gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as 'info' | 'success' | 'warning')}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="info">Informação</option>
            <option value="success">Boa notícia</option>
            <option value="warning">Aviso</option>
          </select>
          {editingId && <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setTitle(''); setBody(''); setLevel('info') }}>Cancelar</Button>}
          <Button size="sm" onClick={publish}>{editingId ? 'Salvar' : 'Publicar'}</Button>
        </div>
      </div>
      <TabelaSimples headers={['Título', 'Corpo', 'Nível', '']} rows={rows} empty="Nenhum anúncio publicado." />
    </div>
  )
}

// ─── Logs de auditoria ──────────────────────────────────────────────────────────

function LogsTab({ logs }: { logs: AuditLog[] }) {
  const rows = logs.map((l) => [
    <span key="a" className="font-mono text-[11px]">{l.action}</span>,
    <span key="t" className="text-xs">{l.targetEmail ?? l.targetUid ?? '—'}</span>,
    <span key="b" className="text-[11px] text-muted-foreground">{l.actorEmail}</span>,
    <span key="d" className="text-[11px] text-muted-foreground tabular-nums">
      {new Date(l.at).toLocaleString('pt-BR')}
    </span>,
  ])

  return (
    <TabelaSimples headers={['Ação', 'Alvo', 'Quem', 'Quando']} rows={rows} empty="Sem atividades registradas." />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRLLocal(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusLabelLocal(s: string): string {
  if (s === 'active') return 'Ativa'
  if (s === 'past_due') return 'Vencida'
  if (s === 'cancelled') return 'Cancelada'
  if (s === 'none') return 'Sem plano'
  return s
}
