'use client'

import { useFinanceStore } from '@/lib/store/use-finance-store'
import type { FinancialAccount } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Gift,
  PiggyBank,
  Pencil,
  Plus,
  Repeat,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Switch } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import {
  AddCardDialog,
  AddFixedBillDialog,
  AddInstallmentDialog,
  AddSubscriptionDialog,
  AddTransactionDialog,
  AccountsManagerDialog,
  FinanceAccountsSetup,
  GoalDialog,
  SavingsBoxDialog,
} from './finance-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const formatBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const currentMonthStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Componentes de linha compartilhados ──────────────────────────────────────

function DeleteButton({ onClick, onEdit }: { onClick: () => void; onEdit?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {onEdit && (
        <button onClick={(event) => { event.stopPropagation(); onEdit() }}
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          aria-label="Editar">
          <Pencil size={14} />
        </button>
      )}
      <button onClick={(event) => { event.stopPropagation(); onClick() }}
        className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
        aria-label="Excluir">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

function accountRolesLabel(account: FinancialAccount) {
  return account.roles.length === 2
    ? 'recebe e paga'
    : account.roles[0] === 'receiving'
      ? 'recebimento'
      : 'pagamento'
}

function accountInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) ?? '??').toUpperCase()
}

function LegacyAccountSwitcher({
  accounts,
  selectedAccountId,
  onSelect,
  onManage,
}: {
  accounts: FinancialAccount[]
  selectedAccountId: string
  onSelect: (id: string) => void
  onManage: () => void
}) {
  const selected = accounts.find((account) => account.id === selectedAccountId)

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conta em foco</p>
          <select
            value={selectedAccountId}
            onChange={(event) => onSelect(event.target.value)}
            className="mt-0.5 max-w-full bg-transparent text-sm font-medium outline-none"
            aria-label="Selecionar conta em foco"
          >
            <option value="all">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {accountRolesLabel(account)}
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{accountRolesLabel(selected)}</span>
        )}
      </div>
      <button type="button" onClick={onManage} className="self-start text-xs font-medium text-primary hover:underline sm:self-auto">
        Gerenciar contas
      </button>
    </div>
  )
}

function AccountSwitcher({
  accounts,
  selectedAccountId,
  onSelect,
  onManage,
}: {
  accounts: FinancialAccount[]
  selectedAccountId: string
  onSelect: (id: string) => void
  onManage: () => void
}) {
  const isOverviewSelected = selectedAccountId === 'all'

  return (
    <section className="mb-6 border-b border-border/60 pb-5" aria-labelledby="account-switcher-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conta em foco</p>
          <h2 id="account-switcher-title" className="mt-1 text-base font-semibold tracking-tight">Onde você está lançando?</h2>
          <p className="mt-1 text-xs text-muted-foreground">Escolha uma conta para filtrar o resumo e as movimentações.</p>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Gerenciar contas
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Contas financeiras">
        <button
          type="button"
          aria-pressed={isOverviewSelected}
          onClick={() => onSelect('all')}
          className={cn(
            'group flex min-h-[74px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            isOverviewSelected
              ? 'border-primary/60 bg-primary/[0.07] shadow-sm'
              : 'border-border/60 bg-background/40 hover:border-primary/30 hover:bg-muted/40',
          )}
        >
          <span className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold transition-colors',
            isOverviewSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground',
          )}>
            <Wallet size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">Visão geral</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Todas as contas</span>
          </span>
          {isOverviewSelected && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Ativa</span>}
        </button>

        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId

          return (
            <button
              key={account.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(account.id)}
              className={cn(
                'group flex min-h-[74px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isSelected
                  ? 'border-primary/60 bg-primary/[0.07] shadow-sm'
                  : 'border-border/60 bg-background/40 hover:border-primary/30 hover:bg-muted/40',
              )}
            >
              <span className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground',
              )}>
                {accountInitials(account.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{account.name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{accountRolesLabel(account)}</span>
              </span>
              {isSelected && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Ativa</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function FinancePage() {
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const fixedBills = useFinanceStore((s) => s.fixedBills)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const cards = useFinanceStore((s) => s.cards)
  const installments = useFinanceStore((s) => s.installments)
  const goals = useFinanceStore((s) => s.goals)
  const savingsBoxes = useFinanceStore((s) => s.savingsBoxes)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const deleteFixedBill = useFinanceStore((s) => s.deleteFixedBill)
  const deleteSubscription = useFinanceStore((s) => s.deleteSubscription)
  const toggleSubscription = useFinanceStore((s) => s.toggleSubscription)
  const deleteCard = useFinanceStore((s) => s.deleteCard)
  const advanceInstallment = useFinanceStore((s) => s.advanceInstallment)
  const deleteInstallment = useFinanceStore((s) => s.deleteInstallment)
  const deleteGoal = useFinanceStore((s) => s.deleteGoal)
  const deleteBox = useFinanceStore((s) => s.deleteBox)

  const [tab, setTab] = useState('resumo')
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addBillOpen, setAddBillOpen] = useState(false)
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [addInstOpen, setAddInstOpen] = useState(false)
  const [editTransactionId, setEditTransactionId] = useState<string | undefined>()
  const [editBillId, setEditBillId] = useState<string | undefined>()
  const [editSubscriptionId, setEditSubscriptionId] = useState<string | undefined>()
  const [editCardId, setEditCardId] = useState<string | undefined>()
  const [editInstallmentId, setEditInstallmentId] = useState<string | undefined>()
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalEditId, setGoalEditId] = useState<string | undefined>()
  const [boxOpen, setBoxOpen] = useState(false)
  const [boxEditId, setBoxEditId] = useState<string | undefined>()
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('all')

  useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId('all')
    } else if (selectedAccountId !== 'all' && !accounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId('all')
    }
  }, [accounts, selectedAccountId])

  if (accounts.length === 0) {
    return <FinanceAccountsSetup onComplete={(ids) => setSelectedAccountId(ids[0] ?? 'all')} />
  }

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId)
  const visibleTransactions = selectedAccountId === 'all' || !selectedAccount
    ? transactions
    : transactions.filter((transaction) =>
        transaction.accountId === selectedAccountId ||
        (!transaction.accountId && transaction.account === selectedAccount.name),
      )

  // Derivados do Resumo
  const currMonth = currentMonthStr()
  const monthIncome = visibleTransactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currMonth))
    .reduce((acc, t) => acc + t.amount, 0)
  const monthExpense = visibleTransactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currMonth))
    .reduce((acc, t) => acc + t.amount, 0)
  const totalBoxes = savingsBoxes.reduce((acc, b) => acc + b.currentAmount, 0)
  const activeSubsTotal = subscriptions
    .filter((s) => s.active)
    .reduce((acc, s) => acc + s.amount, 0)

  const today = new Date().getDate()
  const pendingBills = fixedBills
    .filter((b) => b.active && b.dayOfMonth >= today)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
    .slice(0, 5)

  const sortedTx = [...visibleTransactions].sort((a, b) => b.date.localeCompare(a.date))

  const openNewGoal = () => { setGoalEditId(undefined); setGoalOpen(true) }
  const openEditGoal = (id: string) => { setGoalEditId(id); setGoalOpen(true) }
  const openNewBox = () => { setBoxEditId(undefined); setBoxOpen(true) }
  const openEditBox = (id: string) => { setBoxEditId(id); setBoxOpen(true) }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#b76f0618' }}>
              <Wallet size={22} style={{ color: '#b76f06' }} />
            </span>
            Finanças
          </h1>
          <p className="text-muted-foreground mt-2">
            {visibleTransactions.length} transações · {cards.length} cartões · {goals.length} metas
          </p>
        </div>
        <Button
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => {
            if (tab === 'transacoes') setAddTxOpen(true)
            else if (tab === 'contas') setAddBillOpen(true)
            else if (tab === 'assinaturas') setAddSubOpen(true)
            else if (tab === 'cartoes') setAddCardOpen(true)
            else if (tab === 'metas') openNewGoal()
            else if (tab === 'caixinhas') openNewBox()
            else setAddTxOpen(true)
          }}
        >
          <Plus size={15} />
          {tab === 'resumo' && 'Nova transação'}
          {tab === 'transacoes' && 'Nova transação'}
          {tab === 'contas' && 'Nova conta fixa'}
          {tab === 'assinaturas' && 'Nova assinatura'}
          {tab === 'cartoes' && 'Novo cartão'}
          {tab === 'metas' && 'Nova meta'}
          {tab === 'caixinhas' && 'Nova caixinha'}
        </Button>
      </div>

      <AccountSwitcher
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelect={setSelectedAccountId}
        onManage={() => setAccountsOpen(true)}
      />

      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <TabList className="flex-nowrap overflow-x-auto scrollbar-thin max-w-full">
            <Tab value="resumo">Resumo</Tab>
            <Tab value="transacoes">Transações</Tab>
            <Tab value="contas">Contas Fixas</Tab>
            <Tab value="assinaturas">Assinaturas</Tab>
            <Tab value="cartoes">Cartões</Tab>
            <Tab value="metas">Metas</Tab>
            <Tab value="caixinhas">Caixinhas</Tab>
          </TabList>
        </div>

        {/* ── Resumo ───────────────────────────────────────────── */}
        <TabPanel value="resumo">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Receitas do mês', value: monthIncome, icon: TrendingUp, color: '#6a634d' },
              { label: 'Despesas do mês', value: monthExpense, icon: TrendingDown, color: '#d1bdb8' },
              { label: 'Saldo', value: monthIncome - monthExpense, icon: Banknote, color: monthIncome - monthExpense >= 0 ? '#6a634d' : '#d1bdb8' },
              { label: 'Em caixinhas', value: totalBoxes, icon: PiggyBank, color: '#b76f06' },
            ].map((s) => (
              <Card key={s.label} glass hover className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-0.5 tabular-nums">{formatBRL(s.value)}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: s.color + '18' }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximas contas */}
            <Card glass>
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat size={16} className="text-primary" />
                  Próximas contas fixas
                </CardTitle>
              </CardHeader>
              <div className="px-3 py-3 space-y-0.5">
                {pendingBills.length > 0 ? pendingBills.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold tabular-nums"
                      style={{ backgroundColor: '#d1bdb818', color: '#d1bdb8' }}>
                      {b.dayOfMonth}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.title}</p>
                      <p className="text-[11px] text-muted-foreground">dia {b.dayOfMonth}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatBRL(b.amount)}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta a vencer.</p>
                )}
              </div>
            </Card>

            {/* Metas em andamento */}
            <Card glass>
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target size={16} className="text-success" />
                  Metas em andamento
                </CardTitle>
              </CardHeader>
              <div className="px-5 py-3 space-y-3.5">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.round((g.currentAmount / g.targetAmount) * 100)
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">{g.title}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          <span className="font-semibold text-foreground">{formatBRL(g.currentAmount)}</span>
                          /{formatBRL(g.targetAmount)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: g.color, boxShadow: `0 1px 6px -1px ${g.color}80` }} />
                      </div>
                    </div>
                  )
                })}
                {goals.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Nenhuma meta ainda.</p>}
              </div>
            </Card>
          </div>
        </TabPanel>

        {/* ── Transações ─────────────────────────────────────── */}
        <TabPanel value="transacoes">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Todas as transações</CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">{visibleTransactions.length} registros</span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {sortedTx.length > 0 ? sortedTx.map((t) => (
                <div key={t.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: (t.type === 'income' ? '#6a634d' : '#d1bdb8') + '18' }}>
                    {t.type === 'income' ? <ArrowUpRight size={15} style={{ color: '#6a634d' }} /> : <ArrowDownRight size={15} style={{ color: '#d1bdb8' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] text-muted-foreground">
                        {t.category}
                        {t.paymentMethod ? ` · ${t.paymentMethod}` : ''}
                        {t.account ? ` · ${t.type === 'income' ? 'recebimento' : 'pagamento'}: ${t.account}` : ''}
                        {' · '}{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                      {t.status === 'pending' && (
                        <span className="text-[10px] font-semibold text-warning dark:text-warning uppercase tracking-wide">Pendente</span>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-sm font-semibold tabular-nums', t.type === 'income' ? 'text-success dark:text-success' : '')}>
                    {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                  </span>
                  <DeleteButton onEdit={() => { setEditTransactionId(t.id); setAddTxOpen(true) }} onClick={() => deleteTransaction(t.id)} />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação ainda.</p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Contas Fixas ───────────────────────────────────── */}
        <TabPanel value="contas">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Contas fixas</CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">{fixedBills.filter((b) => b.active).length} ativas</span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {fixedBills.length > 0 ? fixedBills.map((b) => (
                <div key={b.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold tabular-nums"
                    style={{ backgroundColor: '#d1bdb818', color: '#d1bdb8' }}>
                    {b.dayOfMonth}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', !b.active && 'line-through text-muted-foreground')}>{b.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.category} · dia {b.dayOfMonth}{b.paymentMethod ? ` · ${b.paymentMethod}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatBRL(b.amount)}</span>
                  <Switch checked={b.active} onCheckedChange={() => useFinanceStore.getState().updateFixedBill(b.id, { active: !b.active })} />
                  <DeleteButton onEdit={() => { setEditBillId(b.id); setAddBillOpen(true) }} onClick={() => deleteFixedBill(b.id)} />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta fixa cadastrada.</p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Assinaturas ────────────────────────────────────── */}
        <TabPanel value="assinaturas">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat size={16} className="text-primary" />
                Assinaturas
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatBRL(activeSubsTotal)}/mês
              </span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {subscriptions.length > 0 ? subscriptions.map((s) => (
                <div key={s.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#ddd6c618' }}>
                    <Gift size={15} style={{ color: '#ddd6c6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', !s.active && 'line-through text-muted-foreground')}>{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.category} · {s.billingCycle === 'monthly' ? 'Mensal' : s.billingCycle === 'yearly' ? 'Anual' : 'Semanal'}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatBRL(s.amount)}</span>
                  <Switch checked={s.active} onCheckedChange={() => toggleSubscription(s.id)} />
                  <DeleteButton onEdit={() => { setEditSubscriptionId(s.id); setAddSubOpen(true) }} onClick={() => deleteSubscription(s.id)} />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma assinatura.</p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Cartões ────────────────────────────────────────── */}
        <TabPanel value="cartoes">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Cartões de crédito
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">{cards.length}</span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {cards.length > 0 ? cards.map((c) => {
                const used = installments.filter((i) => i.cardId === c.id).reduce((acc, i) => acc + i.installmentAmount, 0)
                const pct = c.limit > 0 ? Math.round((used / c.limit) * 100) : 0
                return (
                  <div key={c.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: c.color + '18' }}>
                      <CreditCard size={15} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.brand}{c.brand ? ' · ' : ''}{c.lastDigits ? `•••• ${c.lastDigits} · ` : ''}fecha dia {c.closingDay} · vence dia {c.dueDay}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums">
                        <span className="font-semibold">{formatBRL(used)}</span>
                        {c.limit > 0 && <span className="text-muted-foreground"> / {formatBRL(c.limit)}</span>}
                      </p>
                      {c.limit > 0 && (
                        <div className="h-1.5 w-20 rounded-full bg-muted/80 mt-1 ml-auto overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 80 ? '#d1bdb8' : c.color }} />
                        </div>
                      )}
                    </div>
                    <DeleteButton onEdit={() => { setEditCardId(c.id); setAddCardOpen(true) }} onClick={() => deleteCard(c.id)} />
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum cartão cadastrado.</p>
              )}
            </div>
          </Card>

          {/* Parcelamentos por cartão */}
          <Card glass className="mt-4">
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat size={16} className="text-primary" />
                Parcelamentos
              </CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl gap-1 text-xs" onClick={() => setAddInstOpen(true)}>
                <Plus size={13} />
                Novo parcelamento
              </Button>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {installments.length > 0 ? installments.map((inst) => {
                const card = cards.find((c) => c.id === inst.cardId)
                return (
                  <div key={inst.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tabular-nums" style={{ backgroundColor: (card?.color ?? '#6a634d') + '18', color: card?.color }}>
                      {inst.currentInstallment}/{inst.totalInstallments}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inst.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {card?.name ?? 'Sem cartão'} · {inst.category} · {formatBRL(inst.installmentAmount)}/mês
                        {inst.firstInstallment ? ` · desde ${new Date(inst.firstInstallment + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">{formatBRL(inst.totalAmount)}</span>
                      {inst.currentInstallment < inst.totalInstallments && (
                        <button onClick={() => advanceInstallment(inst.id)}
                          className="rounded-lg border border-border/60 px-2 py-1 text-[10px] font-medium hover:bg-muted transition-colors cursor-pointer"
                          aria-label="Avançar parcela">
                          +1
                        </button>
                      )}
                      <DeleteButton onEdit={() => { setEditInstallmentId(inst.id); setAddInstOpen(true) }} onClick={() => deleteInstallment(inst.id)} />
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum parcelamento.</p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Metas ──────────────────────────────────────────── */}
        <TabPanel value="metas">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-success" />
                Metas financeiras
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">{goals.length}</span>
            </CardHeader>
            <div className="px-5 py-3 space-y-4">
              {goals.length > 0 ? goals.map((g) => {
                const pct = Math.round((g.currentAmount / g.targetAmount) * 100)
                return (
                  <div key={g.id} className="group flex items-center gap-4 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => openEditGoal(g.id)}>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: g.color + '18' }}>
                      <Target size={16} style={{ color: g.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{g.title}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          <span className="font-semibold text-foreground">{formatBRL(g.currentAmount)}</span> / {formatBRL(g.targetAmount)}
                        </p>
                      </div>
                      <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: g.color, boxShadow: `0 1px 6px -1px ${g.color}80` }} />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-semibold text-muted-foreground">{pct}% concluído</span>
                        {g.deadline && <span className="text-[10px] text-muted-foreground">prazo: {new Date(g.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <DeleteButton onEdit={() => openEditGoal(g.id)} onClick={() => deleteGoal(g.id)} />
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma meta criada.</p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Caixinhas ──────────────────────────────────────── */}
        <TabPanel value="caixinhas">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsBoxes.length > 0 ? savingsBoxes.map((b) => {
              const pct = Math.round((b.currentAmount / b.targetAmount) * 100)
              return (
                <Card key={b.id} glass hover className="group cursor-pointer" onClick={() => openEditBox(b.id)}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: b.color + '18' }}>
                        <PiggyBank size={16} style={{ color: b.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.name}</p>
                        {b.deadline && <p className="text-[10px] text-muted-foreground">prazo: {new Date(b.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                      </div>
                      <DeleteButton onEdit={() => openEditBox(b.id)} onClick={() => deleteBox(b.id)} />
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-2xl font-bold tabular-nums">{formatBRL(b.currentAmount)}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">meta {formatBRL(b.targetAmount)}</p>
                    </div>
                    <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: b.color, boxShadow: `0 1px 6px -1px ${b.color}80` }} />
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1.5">{pct}% concluído</p>
                  </CardContent>
                </Card>
              )
            }) : (
              <div className="col-span-full">
                <Card glass>
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhuma caixinha criada.</p>
                </Card>
              </div>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {/* Dialogs */}
      <AddTransactionDialog
        open={addTxOpen}
        editId={editTransactionId}
        onClose={() => { setAddTxOpen(false); setEditTransactionId(undefined) }}
        defaultAccountId={selectedAccountId === 'all' ? undefined : selectedAccountId}
      />
      <AccountsManagerDialog open={accountsOpen} onClose={() => setAccountsOpen(false)} />
      <AddFixedBillDialog open={addBillOpen} editId={editBillId} onClose={() => { setAddBillOpen(false); setEditBillId(undefined) }} />
      <AddSubscriptionDialog open={addSubOpen} editId={editSubscriptionId} onClose={() => { setAddSubOpen(false); setEditSubscriptionId(undefined) }} />
      <AddCardDialog open={addCardOpen} editId={editCardId} onClose={() => { setAddCardOpen(false); setEditCardId(undefined) }} />
      <AddInstallmentDialog open={addInstOpen} editId={editInstallmentId} onClose={() => { setAddInstOpen(false); setEditInstallmentId(undefined) }} />
      <GoalDialog open={goalOpen} onClose={() => { setGoalOpen(false); setGoalEditId(undefined) }} editId={goalEditId} />
      <SavingsBoxDialog open={boxOpen} onClose={() => { setBoxOpen(false); setBoxEditId(undefined) }} editId={boxEditId} />
    </div>
  )
}
