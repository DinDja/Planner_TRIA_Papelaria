'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { PLANS, monthlyEquivalent } from '@/lib/subscriptions/plan'
import {
  fetchAllSystemUsers,
  subscribeUserManifests,
  subscribeAdminSystemUids,
  subscribeAuditLogs,
  subscribeBillingPayments,
  subscribeCoupons,
  subscribePlans,
  promoteToAdmin,
  promoteToSystemAdmin,
  demoteFromAdmin,
  activateGratuity,
  removeGratuity,
  blockUser,
  unblockUser,
  savePlan,
  deletePlan,
  saveCoupon,
  deleteCoupon,
  type UserManifest,
  type AuditLog,
  type BillingPayment,
  type Coupon,
  type PlanDoc,
  type GratuityPeriod,
} from '@/lib/admin/client'
import type { PlanId } from '@/lib/subscriptions/plan'
import { toast } from '../ui/toaster'
import { Button } from '../ui/button'
import { Input } from '../ui/primitives'
import { Badge } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import {
  ShieldCheck,
  Users,
  Crown,
  Ban,
  PauseCircle,
  CheckCircle2,
  Ticket,
  Pencil,
  Trash2,
} from 'lucide-react'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'
const FONT_MONO = 'var(--font-geist), system-ui, sans-serif'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
const stagger = (i: number) => ({ animationDelay: `${i * 60}ms` })

type Tab = 'visao' | 'assinantes' | 'planos' | 'cupons'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'visao', label: 'Visão', icon: ShieldCheck },
  { id: 'assinantes', label: 'Usuários', icon: Users },
  { id: 'planos', label: 'Planos', icon: Crown },
  { id: 'cupons', label: 'Cupons', icon: Ticket },
]

export function AdminPage() {
  const { user, isAdminSystem } = useAuth()
  const [tab, setTab] = useState<Tab>('visao')
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())

  // Estados separados por area — só subscreve à needed
  const [manifestUsers, setManifestUsers] = useState<UserManifest[]>([])
  const [authUsers, setAuthUsers] = useState<UserManifest[]>([])
  const [adminSystemUids, setAdminSystemUids] = useState<string[]>([])
  const [allUsersLoaded, setAllUsersLoaded] = useState(false)
  const [allUsersError, setAllUsersError] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [auditLogsLoaded, setAuditLogsLoaded] = useState(false)
  const [auditLogsError, setAuditLogsError] = useState(false)
  const [billingPayments, setBillingPayments] = useState<BillingPayment[]>([])
  const [billingPaymentsLoaded, setBillingPaymentsLoaded] = useState(false)
  const [billingPaymentsError, setBillingPaymentsError] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [customPlans, setCustomPlans] = useState<PlanDoc[]>([])

  const users = useMemo(() => {
    const byUid = new Map<string, UserManifest>()
    authUsers.forEach((account) => byUid.set(account.uid, account))
    manifestUsers.forEach((manifest) => {
      const account = byUid.get(manifest.uid)
      if (!account) {
        if (allUsersError) byUid.set(manifest.uid, manifest)
        return
      }
      byUid.set(manifest.uid, {
        ...account,
        ...manifest,
        uid: account.uid,
        email: account.email || manifest.email,
        name: manifest.name || account.name,
        avatar: manifest.avatar || account.avatar,
      })
    })

    return [...byUid.values()].map((account) => ({
      ...account,
      isAdminSystem: adminSystemUids.includes(account.uid),
    })).sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email, 'pt-BR')
      || a.email.localeCompare(b.email, 'pt-BR'),
    )
  }, [allUsersError, authUsers, manifestUsers, adminSystemUids])

  useEffect(() => {
    const unsubs: Array<() => void> = []
    let cancelled = false
    unsubs.push(subscribeUserManifests(setManifestUsers))
    unsubs.push(subscribeAdminSystemUids(setAdminSystemUids))
    setAuthUsers([])
    setAllUsersLoaded(false)
    setAllUsersError(false)
    setAuditLogsLoaded(false)
    setAuditLogsError(false)
    setBillingPayments([])
    setBillingPaymentsLoaded(false)
    setBillingPaymentsError(false)
    if (user) {
      void fetchAllSystemUsers(user)
        .then((items) => {
          if (cancelled) return
          setAuthUsers(items)
          setAllUsersLoaded(true)
        })
        .catch(() => {
          if (cancelled) return
          setAllUsersError(true)
          setAllUsersLoaded(true)
        })
    } else {
      setAllUsersLoaded(true)
    }
    unsubs.push(subscribeAuditLogs(
      (items) => {
        setLogs(items)
        setAuditLogsLoaded(true)
        setAuditLogsError(false)
      },
      () => {
        setAuditLogsLoaded(true)
        setAuditLogsError(true)
      },
    ))
    unsubs.push(subscribeBillingPayments(
      (items) => {
        setBillingPayments(items)
        setBillingPaymentsLoaded(true)
        setBillingPaymentsError(false)
      },
      () => {
        setBillingPaymentsLoaded(true)
        setBillingPaymentsError(true)
      },
    ))
    unsubs.push(subscribeCoupons(setCoupons))
    unsubs.push(subscribePlans(setCustomPlans))
    return () => {
      cancelled = true
      unsubs.forEach((u) => u())
    }
  }, [user])

  useEffect(() => {
    let timeoutId: number
    const scheduleYearCheck = () => {
      const now = new Date()
      const nextYearStart = new Date(now.getFullYear() + 1, 0, 1)
      const untilNextYear = nextYearStart.getTime() - now.getTime()
      const maxTimeout = 24 * 24 * 60 * 60 * 1000
      const delay = untilNextYear > maxTimeout ? maxTimeout : untilNextYear + 100

      timeoutId = window.setTimeout(() => {
        const year = new Date().getFullYear()
        setCalendarYear((current) => current === year ? current : year)
        scheduleYearCheck()
      }, Math.max(1000, delay))
    }

    scheduleYearCheck()
    return () => window.clearTimeout(timeoutId)
  }, [])

  // Métricas honestas (sem mock)
  const activeCount = users.filter((u) => adminSubscriptionState(u) === 'active').length
  const pastDueCount = users.filter((u) => {
    const state = adminSubscriptionState(u)
    return state === 'past_due' || state === 'expired'
  }).length
  const blockedCount = users.filter((u) => u.blocked).length

  const planValues = useMemo(() => {
    const monthlyValue = (user: UserManifest) => {
      if (!user.plan || user.plan === 'trial') return 0
      const price = customPlans.find((plan) => plan.id === user.plan)?.price ?? PLANS[user.plan].price
      return monthlyEquivalent(price, user.plan)
    }

    return {
      active: users.filter((u) => adminSubscriptionState(u) === 'active').reduce((sum, u) => sum + monthlyValue(u), 0),
      pastDue: users.filter((u) => adminSubscriptionState(u) === 'past_due').reduce((sum, u) => sum + monthlyValue(u), 0),
      blocked: users
        .filter((u) => u.blocked && ['active', 'past_due'].includes(adminSubscriptionState(u)))
        .reduce((sum, u) => sum + monthlyValue(u), 0),
    }
  }, [users, customPlans])

  const annualRevenue = useMemo(() => {
    const payments: { date: Date; amount: number; isLegacyManual: boolean }[] = []
    billingPayments.forEach((payment) => {
      const date = new Date(payment.confirmedAt)
      if (!Number.isNaN(date.getTime()) && Number.isFinite(payment.amount) && payment.amount > 0) {
        payments.push({ date, amount: payment.amount, isLegacyManual: false })
      }
    })
    logs.forEach((log) => {
      if (log.action !== 'mark_payment' || (log.plan !== 'monthly' && log.plan !== 'annual')) return
      const date = new Date(log.at)
      if (Number.isNaN(date.getTime())) return
      const amount = typeof log.amount === 'number'
        ? log.amount
        : customPlans.find((plan) => plan.id === log.plan)?.price ?? PLANS[log.plan].price
      if (Number.isFinite(amount) && amount > 0) {
        payments.push({ date, amount, isLegacyManual: typeof log.amount !== 'number' })
      }
    })

    const firstRecordedYear = payments.reduce(
      (earliest, payment) => Math.min(earliest, payment.date.getFullYear()),
      calendarYear,
    )
    const years = Array.from(
      { length: calendarYear - firstRecordedYear + 1 },
      (_, index) => firstRecordedYear + index,
    )

    return years.map((year) => {
      const totals = Array(12).fill(0) as number[]
      let legacyManualPayments = 0
      payments.forEach((payment) => {
        if (payment.date.getFullYear() !== year) return
        const monthIndex = payment.date.getMonth()
        totals[monthIndex] += payment.amount
        if (payment.isLegacyManual) legacyManualPayments += 1
      })

      const months = Array.from({ length: 12 }, (_, monthIndex) => {
        const date = new Date(year, monthIndex, 1)
        return {
          key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
          label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          title: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          amount: totals[monthIndex],
        }
      })

      return {
        year,
        months,
        total: totals.reduce((sum, amount) => sum + amount, 0),
        legacyManualPayments,
      }
    })
  }, [billingPayments, calendarYear, customPlans, logs])

  const currentMonthRevenue = annualRevenue
    .find((year) => year.year === calendarYear)
    ?.months[new Date().getMonth()]?.amount ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
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
          Painel Administrativo
        </h1>

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
            <Stat
              label="Perfis"
              value={String(users.length)}
              detail={`Recebido este mês · ${formatBRLLocal(currentMonthRevenue)}`}
              color="#d1bdb8"
              icon={Users}
              index={0}
            />
            <Stat
              label="Ativas"
              value={String(activeCount)}
              detail={`${formatBRLLocal(planValues.active)} / mês estimado`}
              color="#6a634d"
              icon={CheckCircle2}
              index={1}
            />
            <Stat
              label="Vencidas"
              value={String(pastDueCount)}
              detail={`${formatBRLLocal(planValues.pastDue)} / mês em atraso, estimado`}
              color="#b76f06"
              icon={PauseCircle}
              index={2}
            />
            <Stat
              label="Bloqueadas"
              value={String(blockedCount)}
              detail={`${formatBRLLocal(planValues.blocked)} / mês interrompido, estimado`}
              color="var(--destructive)"
              icon={Ban}
              index={3}
            />
          </div>
          {annualRevenue.map((year) => (
            <MonthlyRevenueChart
              key={year.year}
              year={year.year}
              data={year.months}
              total={year.total}
              legacyManualPayments={year.legacyManualPayments}
              billingPaymentsError={billingPaymentsError}
            />
          ))}
        </div>
      )}

      {tab === 'assinantes' && (
        <AssinantesTab
          users={users}
          billingPayments={billingPayments}
          auditLogs={logs}
          spendDataLoading={!billingPaymentsLoaded || !auditLogsLoaded}
          spendDataError={billingPaymentsError || auditLogsError}
          isLoading={!allUsersLoaded}
          loadError={allUsersError}
          currentUid={user?.uid ?? ''}
          currentIsAdminSystem={isAdminSystem}
          onPromote={(t) => {
            if (!user) return
            if (t.role === 'admin') {
              toast({ title: 'Este usuário já é administrado' })
              return
            }
            return promoteToAdmin(user, t).then(() => toast({ title: 'Promovido a admin' }))
          }}
          onPromoteSystemAdmin={(t) => {
            if (!user || !isAdminSystem) return
            if (t.isAdminSystem) {
              toast({ title: 'Este usuário já é adminSystem' })
              return
            }
            return promoteToSystemAdmin(user, t).then(() => toast({ title: 'Promovido a adminSystem' }))
          }}
          onDemote={(t) => user ? demoteFromAdmin(user, t).then(() => toast({ title: 'Rebaixado para assinante' })) : undefined}
          onActivateGratuity={(t, period) => {
            if (!user) return
            return activateGratuity(user, t, period).then(() => {
              const durationLabel = period.unit === 'indefinite'
                ? 'por tempo indeterminado'
                : `por ${period.amount} ${period.unit === 'hours' ? (period.amount === 1 ? 'hora' : 'horas') : period.unit === 'days' ? (period.amount === 1 ? 'dia' : 'dias') : (period.amount === 1 ? 'mês' : 'meses')}`
              toast({ title: `Gratuidade ativada ${durationLabel}` })
            })
          }}
          onRemoveGratuity={(t) => {
            if (!user) return
            return removeGratuity(user, t).then(() => {
              toast({ title: 'Gratuidade removida; assinatura anterior restaurada.' })
            })
          }}
          onBlock={(t) => user ? blockUser(user, t).then(() => toast({ title: 'Usuário bloqueado', variant: 'error' })) : undefined}
          onUnblock={(t) => user ? unblockUser(user, t).then(() => toast({ title: 'Usuário desbloqueado' })) : undefined}
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

    </div>
  )
}

// ─── Subcomponentes por tab ───────────────────────────────────────────────────

interface RevenueMonth {
  key: string
  label: string
  title: string
  amount: number
}

function MonthlyRevenueChart({
  year,
  data,
  total,
  legacyManualPayments,
  billingPaymentsError,
}: {
  year: number
  data: RevenueMonth[]
  total: number
  legacyManualPayments: number
  billingPaymentsError: boolean
}) {
  const maxAmount = Math.max(...data.map((month) => month.amount), 0)
  const now = new Date()

  return (
    <section
      className={cn('rounded-2xl border border-border/40 bg-card p-5', enter)}
      aria-labelledby={`revenue-chart-title-${year}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/55" style={{ fontFamily: FONT_MONO }}>
            {year}
          </p>

        </div>
        <div className="text-left sm:text-right">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/55" style={{ fontFamily: FONT_MONO }}>
            faturamento
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatBRLLocal(total)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-1">
        <div
          role="list"
          aria-label={`Recebimentos mensais de ${year}`}
          className="grid min-w-[720px] grid-cols-12 gap-2"
        >
          {data.map((month, index) => {
            const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
            const isCurrentMonth = year === now.getFullYear() && index === now.getMonth()

            return (
              <div
                key={month.key}
                role="listitem"
                aria-label={`${month.title}: ${formatBRLLocal(month.amount)}`}
                title={`${month.title}: ${formatBRLLocal(month.amount)}`}
                className="flex min-w-0 flex-col text-center"
              >
                <span className="mb-1 truncate text-[9px] tabular-nums text-muted-foreground">
                  {formatBRLCompact(month.amount)}
                </span>
                <div className="flex h-32 items-end border-b border-border/50">
                  <div
                    aria-hidden="true"
                    className={cn(
                      'w-full rounded-t-[3px] transition-[height] duration-300',
                      isCurrentMonth ? 'bg-primary' : 'bg-primary/55',
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn('mt-2 text-[10px] capitalize', isCurrentMonth ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {billingPaymentsError && (
        <p className="mt-3 text-[11px] text-destructive">
          NÃ£o foi possÃ­vel carregar os comprovantes InfinitePay. Confira a regra de leitura da coleÃ§Ã£o billingPayments no Firestore.
        </p>
      )}
      {legacyManualPayments > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {legacyManualPayments} pagamento(s) manual(is) antigo(s) sem valor salvo usam o preço atual do plano como estimativa.
        </p>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  detail,
  color,
  icon: Icon,
  index,
}: {
  label: string
  value: string
  detail: string
  color: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
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
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{detail}</p>
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
    <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-border/40">
      <table className="w-full min-w-[680px] text-sm">
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
  billingPayments,
  auditLogs,
  spendDataLoading,
  spendDataError,
  isLoading,
  loadError,
  currentUid,
  currentIsAdminSystem,
  onPromote,
  onPromoteSystemAdmin,
  onDemote,
  onActivateGratuity,
  onRemoveGratuity,
  onBlock,
  onUnblock,
}: {
  users: UserManifest[]
  billingPayments: BillingPayment[]
  auditLogs: AuditLog[]
  spendDataLoading: boolean
  spendDataError: boolean
  isLoading: boolean
  loadError: boolean
  currentUid: string
  currentIsAdminSystem: boolean
  onPromote: (t: UserManifest) => void | Promise<void>
  onPromoteSystemAdmin: (t: UserManifest) => void | Promise<void>
  onDemote: (t: UserManifest) => void | Promise<void>
  onActivateGratuity: (t: UserManifest, period: GratuityPeriod) => void | Promise<void>
  onRemoveGratuity: (t: UserManifest) => void | Promise<void>
  onBlock: (t: UserManifest) => void | Promise<void>
  onUnblock: (t: UserManifest) => void | Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [gratuityPickerOpen, setGratuityPickerOpen] = useState(false)
  const [gratuityUnit, setGratuityUnit] = useState<'hours' | 'days' | 'months' | 'indefinite'>('months')
  const [gratuityAmount, setGratuityAmount] = useState('1')
  const [isGrantingGratuity, setIsGrantingGratuity] = useState(false)
  const listUsers = users.filter((u) => u.uid !== currentUid)
  const filtered = listUsers.filter(
    (u) => u.email.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase()),
  )
  const selectedUser = selectedUid ? listUsers.find((u) => u.uid === selectedUid) ?? null : null
  const selectedUserSpend = selectedUser
    ? summarizeUserSpend(selectedUser.uid, billingPayments, auditLogs)
    : null

  const submitGratuity = async () => {
    if (!selectedUser || isGrantingGratuity) return
    const period: GratuityPeriod = gratuityUnit === 'indefinite'
      ? { unit: 'indefinite' }
      : { unit: gratuityUnit, amount: Number(gratuityAmount) }
    if (period.unit !== 'indefinite' && (!Number.isSafeInteger(period.amount) || period.amount < 1)) {
      toast({ title: 'Informe uma duração inteira maior que zero.', variant: 'error' })
      return
    }
    setIsGrantingGratuity(true)
    try {
      await onActivateGratuity(selectedUser, period)
      setGratuityPickerOpen(false)
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Não foi possível ativar a gratuidade.',
        variant: 'error',
      })
    } finally {
      setIsGrantingGratuity(false)
    }
  }

  const submitRemoveGratuity = async () => {
    if (!selectedUser || isGrantingGratuity) return
    setIsGrantingGratuity(true)
    try {
      await onRemoveGratuity(selectedUser)
      setGratuityPickerOpen(false)
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Não foi possível remover a gratuidade.',
        variant: 'error',
      })
    } finally {
      setIsGrantingGratuity(false)
    }
  }

  const rows = filtered.map((u) => [
    <span key="name" className="font-medium truncate">{u.name || 'Nome não informado'}</span>,
    <span key="email" className="text-muted-foreground">{u.email || 'E-mail não informado'}</span>,
    <Badge
      key="status"
      variant="outline"
      className={cn(
        'text-[10px]',
        u.blocked && 'border-destructive/40 text-destructive',
        !u.blocked && ['Pendente', 'Expirado'].includes(userSituation(u)) && 'border-amber-600/40 text-amber-700 dark:text-amber-400',
      )}
    >
      {userSituation(u)}
    </Badge>,
    <Button key="view" size="sm" variant="outline" onClick={() => { setGratuityPickerOpen(false); setSelectedUid(u.uid) }}>
      Visualizar
    </Button>,
  ])

  return (
    <>
      <div className="space-y-4">
        {loadError && (
          <p role="status" className="text-sm text-destructive">
            Não foi possível consultar todas as contas. Exibindo os perfis de assinatura encontrados.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Carregando todos os usuários cadastrados…'
            : <>Todos os usuários cadastrados <span className="tabular-nums">({listUsers.length})</span></>}
        </p>
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <TabelaSimples
          headers={['Nome', 'E-mail', 'Situação', '']}
          rows={rows}
          empty="Nenhum usuário cadastrado ainda."
        />
      </div>

      <Dialog open={selectedUser !== null} onOpenChange={(open) => { if (!open) { setSelectedUid(null); setGratuityPickerOpen(false) } }}>
        {selectedUser && (
          <DialogContent
            title={selectedUser.name || selectedUser.email || 'Usuário sem nome'}
            description={selectedUser.email}
            className="max-w-xl"
          >
            <div className="space-y-5">
              <section className="rounded-2xl border border-border/50 p-4">
                <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Dados da conta</h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
                  <UserDetail label="Situação" value={userSituation(selectedUser)} />
                  <UserDetail label="Perfil" value={selectedUser.isAdminSystem ? 'adminSystem' : selectedUser.role === 'admin' ? 'Administrador' : 'Usuário'} />
                  <UserDetail
                    label="Valor gasto"
                    value={formatUserSpend(selectedUserSpend, spendDataLoading, spendDataError)}
                    detail={formatUserSpendDetail(selectedUserSpend, spendDataLoading, spendDataError)}
                  />
                  <UserDetail label="Desde" value={formatUserDate(selectedUser.since)} />
                  <UserDetail label="Último pagamento" value={formatUserDate(selectedUser.lastPayment)} />
                  <UserDetail label="Acesso até" value={selectedUser.gratuityIndefinite ? 'Indefinido' : formatUserDate(selectedUser.paidUntil)} />
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Opções administrativas</h3>
                {selectedUser.role === 'admin' && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {selectedUser.isAdminSystem ? 'Este usuário já é adminSystem.' : 'Este usuário já é administrado.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedUser.role !== 'admin' && (
                    <Button size="sm" variant="outline" onClick={() => { void onPromote(selectedUser) }}>
                      Tornar administrador
                    </Button>
                  )}
                  {selectedUser.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        selectedUser.uid === currentUid
                        || (selectedUser.isAdminSystem && !currentIsAdminSystem)
                      }
                      title={selectedUser.uid === currentUid
                        ? 'Não é possível remover sua própria permissão administrativa.'
                        : selectedUser.isAdminSystem && !currentIsAdminSystem
                          ? 'Somente um adminSystem pode remover outro adminSystem.'
                          : undefined}
                      onClick={() => { void onDemote(selectedUser) }}
                    >
                      Remover admin
                    </Button>
                  )}
                  {selectedUser.role !== 'admin' && (selectedUser.gratuityActive || selectedUser.gratuityIndefinite ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isGrantingGratuity}
                      onClick={() => { void submitRemoveGratuity() }}
                    >
                      {isGrantingGratuity ? 'Removendo…' : 'Remover gratuidade'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      title="Escolha por quanto tempo o acesso ficará gratuito."
                      onClick={() => setGratuityPickerOpen((open) => !open)}
                    >
                      Ativar gratuidade
                    </Button>
                  ))}
                  {currentIsAdminSystem && !selectedUser.isAdminSystem && selectedUser.uid !== currentUid && (
                    <Button size="sm" variant="outline" onClick={() => { void onPromoteSystemAdmin(selectedUser) }}>
                      Tornar admin System
                    </Button>
                  )}
                  {selectedUser.uid !== currentUid && (selectedUser.blocked ? (
                    <Button size="sm" variant="outline" onClick={() => { void onUnblock(selectedUser) }}>
                      Desbloquear conta
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { void onBlock(selectedUser) }}>
                      Bloquear conta
                    </Button>
                  ))}
                </div>
                {gratuityPickerOpen && selectedUser.role !== 'admin' && (
                  <div className="space-y-3 rounded-xl border border-border/50 p-3">
                    <p className="text-xs font-medium">Duração da gratuidade</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Duração da gratuidade">
                      {([
                        ['hours', 'Horas'],
                        ['days', 'Dias'],
                        ['months', 'Meses'],
                        ['indefinite', 'Indefinido'],
                      ] as const).map(([unit, label]) => (
                        <Button
                          key={unit}
                          type="button"
                          size="sm"
                          disabled={isGrantingGratuity}
                          variant={gratuityUnit === unit ? 'default' : 'outline'}
                          aria-pressed={gratuityUnit === unit}
                          onClick={() => setGratuityUnit(unit)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    {gratuityUnit !== 'indefinite' && (
                      <label className="flex max-w-xs items-center gap-3 text-sm">
                        <span className="shrink-0">Quantidade</span>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          disabled={isGrantingGratuity}
                          value={gratuityAmount}
                          onChange={(event) => setGratuityAmount(event.target.value)}
                          aria-label="Quantidade da gratuidade"
                        />
                      </label>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {gratuityUnit === 'indefinite'
                        ? 'O acesso gratuito não terá data de vencimento.'
                        : 'O período escolhido será somado ao acesso vigente, se houver.'}
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" disabled={isGrantingGratuity} onClick={() => setGratuityPickerOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" disabled={isGrantingGratuity} onClick={() => { void submitGratuity() }}>
                        {isGrantingGratuity ? 'Ativando…' : 'Confirmar gratuidade'}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function UserDetail({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
      {detail && <dd className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</dd>}
    </div>
  )
}

type AdminSubscriptionState = 'active' | 'past_due' | 'cancelled' | 'none' | 'expired' | 'unknown'

function adminSubscriptionState(user: UserManifest): AdminSubscriptionState {
  if (user.status === 'active') {
    if (user.gratuityIndefinite) return 'active'
    if (user.plan !== 'trial' && user.plan !== 'monthly' && user.plan !== 'annual') return 'unknown'
    if (!user.paidUntil) return user.plan === 'trial' ? 'unknown' : 'active'
    const expiration = Date.parse(user.paidUntil)
    if (!Number.isFinite(expiration)) return 'unknown'
    if (expiration > Date.now()) return 'active'
    return user.plan === 'trial' ? 'expired' : 'past_due'
  }
  if (user.status === 'past_due' || user.status === 'cancelled' || user.status === 'none') return user.status
  return 'unknown'
}

function userSituation(user: UserManifest): string {
  if (user.blocked) return 'Bloqueado'
  const state = adminSubscriptionState(user)
  if (state === 'active' && (user.gratuityActive || user.gratuityIndefinite)) return 'Gratuito'
  if (state === 'active') return user.plan === 'trial' ? 'Em teste' : 'Ativo'
  if (state === 'past_due') return 'Pendente'
  if (state === 'expired') return 'Expirado'
  if (state === 'cancelled') return 'Cancelado'
  if (state === 'none') return 'Sem assinatura'
  return 'Não informado'
}

interface UserSpendSummary {
  amount: number
  paymentCount: number
  unpricedPaymentCount: number
}

function summarizeUserSpend(uid: string, billingPayments: BillingPayment[], auditLogs: AuditLog[]): UserSpendSummary {
  const userPayments = billingPayments.filter((payment) => payment.uid === uid)
  const summary: UserSpendSummary = {
    amount: userPayments.reduce((total, payment) => total + payment.amount, 0),
    paymentCount: userPayments.length,
    unpricedPaymentCount: 0,
  }

  auditLogs.forEach((log) => {
    if (
      log.action !== 'mark_payment'
      || log.targetUid !== uid
      || (log.plan !== 'monthly' && log.plan !== 'annual')
    ) return
    if (typeof log.amount === 'number' && Number.isFinite(log.amount) && log.amount >= 0) {
      summary.amount += log.amount
      summary.paymentCount += 1
    } else {
      summary.unpricedPaymentCount += 1
    }
  })

  return summary
}

function formatUserSpend(
  summary: UserSpendSummary | null,
  isLoading: boolean,
  hasError: boolean,
): string {
  if (isLoading) return 'Carregando…'
  if (hasError || !summary) return 'Indisponível'
  if (summary.paymentCount === 0) {
    return summary.unpricedPaymentCount > 0 ? 'Valor não informado' : 'Nenhum pagamento registrado'
  }
  return formatBRLLocal(summary.amount)
}

function formatUserSpendDetail(
  summary: UserSpendSummary | null,
  isLoading: boolean,
  hasError: boolean,
): string | undefined {
  if (isLoading || hasError || !summary || summary.unpricedPaymentCount === 0) return undefined
  if (summary.unpricedPaymentCount === 1) return '1 pagamento sem valor registrado não foi incluído no total.'
  return `${summary.unpricedPaymentCount} pagamentos sem valor registrado não foram incluídos no total.`
}
function formatUserDate(value: string | null | undefined): string {
  if (!value) return 'Não informado'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleDateString('pt-BR')
}

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
        objeto <code className="font-mono">PLANS</code> em <code className="font-mono">lib/subscriptions/plan.ts</code> — por ora só servem para a admin visualizar o catálogo.
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


// Helpers ──────────────────────────────────────────────────────────────────

function formatBRLLocal(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatBRLCompact(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}
