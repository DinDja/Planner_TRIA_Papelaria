'use client'

import { useFinanceStore } from '@/lib/store/use-finance-store'
import { cn } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Gift,
  PiggyBank,
  Plus,
  Repeat,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
      aria-label="Excluir">
      <Trash2 size={14} />
    </button>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export function FinancePage() {
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
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalEditId, setGoalEditId] = useState<string | undefined>()
  const [boxOpen, setBoxOpen] = useState(false)
  const [boxEditId, setBoxEditId] = useState<string | undefined>()

  // Derivados do Resumo
  const currMonth = currentMonthStr()
  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currMonth))
    .reduce((acc, t) => acc + t.amount, 0)
  const monthExpense = transactions
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

  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

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
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#f0b42918' }}>
              <Wallet size={22} style={{ color: '#f0b429' }} />
            </span>
            Finanças
          </h1>
          <p className="text-muted-foreground mt-2">
            {transactions.length} transações · {cards.length} cartões · {goals.length} metas
          </p>
        </div>
        <Button
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => {
            if (tab === 'transacoes') setAddTxOpen(true)
            else if (tab === 'contas') setAddBillOpen(true)
            else if (tab === 'assinaturas') setAddSubOpen(true)
            else if (tab === 'cartoes') setAddCardOpen(true)
            else if (tab === 'parcelamentos') setAddInstOpen(true)
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
          {tab === 'parcelamentos' && 'Novo parcelamento'}
          {tab === 'metas' && 'Nova meta'}
          {tab === 'caixinhas' && 'Nova caixinha'}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <TabList className="flex-nowrap overflow-x-auto scrollbar-thin max-w-full">
            <Tab value="resumo">Resumo</Tab>
            <Tab value="transacoes">Transações</Tab>
            <Tab value="contas">Contas Fixas</Tab>
            <Tab value="assinaturas">Assinaturas</Tab>
            <Tab value="cartoes">Cartões</Tab>
            <Tab value="parcelamentos">Parcelamentos</Tab>
            <Tab value="metas">Metas</Tab>
            <Tab value="caixinhas">Caixinhas</Tab>
          </TabList>
        </div>

        {/* ── Resumo ───────────────────────────────────────────── */}
        <TabPanel value="resumo">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Receitas do mês', value: monthIncome, icon: TrendingUp, color: '#7bb686' },
              { label: 'Despesas do mês', value: monthExpense, icon: TrendingDown, color: '#e05b6d' },
              { label: 'Saldo', value: monthIncome - monthExpense, icon: Banknote, color: monthIncome - monthExpense >= 0 ? '#5b8dbf' : '#e05b6d' },
              { label: 'Em caixinhas', value: totalBoxes, icon: PiggyBank, color: '#f0b429' },
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
                      style={{ backgroundColor: '#e05b6d18', color: '#e05b6d' }}>
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
                  <Target size={16} className="text-emerald-500" />
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
              <span className="text-[11px] text-muted-foreground tabular-nums">{transactions.length} registros</span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {sortedTx.length > 0 ? sortedTx.map((t) => (
                <div key={t.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: (t.type === 'income' ? '#7bb686' : '#e05b6d') + '18' }}>
                    {t.type === 'income' ? <ArrowUpRight size={15} style={{ color: '#7bb686' }} /> : <ArrowDownRight size={15} style={{ color: '#e05b6d' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground">{t.category} · {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={cn('text-sm font-semibold tabular-nums', t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                    {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                  </span>
                  <DeleteButton onClick={() => deleteTransaction(t.id)} />
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
                    style={{ backgroundColor: '#e05b6d18', color: '#e05b6d' }}>
                    {b.dayOfMonth}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', !b.active && 'line-through text-muted-foreground')}>{b.title}</p>
                    <p className="text-[11px] text-muted-foreground">{b.category} · dia {b.dayOfMonth}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatBRL(b.amount)}</span>
                  <Switch checked={b.active} onCheckedChange={() => useFinanceStore.getState().updateFixedBill(b.id, { active: !b.active })} />
                  <DeleteButton onClick={() => deleteFixedBill(b.id)} />
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
                    style={{ backgroundColor: '#c9b6e418' }}>
                    <Gift size={15} style={{ color: '#c9b6e4' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', !s.active && 'line-through text-muted-foreground')}>{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.category} · {s.billingCycle === 'monthly' ? 'Mensal' : s.billingCycle === 'yearly' ? 'Anual' : 'Semanal'}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatBRL(s.amount)}</span>
                  <Switch checked={s.active} onCheckedChange={() => toggleSubscription(s.id)} />
                  <DeleteButton onClick={() => deleteSubscription(s.id)} />
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
                      <p className="text-[11px] text-muted-foreground">fecha dia {c.closingDay} · vence dia {c.dueDay}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums">
                        <span className="font-semibold">{formatBRL(used)}</span>
                        <span className="text-muted-foreground"> / {formatBRL(c.limit)}</span>
                      </p>
                      <div className="h-1.5 w-20 rounded-full bg-muted/80 mt-1 ml-auto overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 80 ? '#e05b6d' : c.color }} />
                      </div>
                    </div>
                    <DeleteButton onClick={() => deleteCard(c.id)} />
                  </div>
                )
              }) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum cartão cadastrado.</p>
              )}
            </div>
          </Card>

          {/* Parcelas ativas num card */}
          {installments.filter((i) => cards.some((c) => c.id === i.cardId)).length > 0 && (
            <Card glass className="mt-4">
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base">Parcelas em aberto</CardTitle>
              </CardHeader>
              <div className="px-3 py-3 space-y-0.5">
                {installments.filter((i) => cards.some((c) => c.id === i.cardId)).map((inst) => {
                  const card = cards.find((c) => c.id === inst.cardId)
                  return (
                    <div key={inst.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tabular-nums" style={{ backgroundColor: (card?.color ?? '#5b8dbf') + '18', color: card?.color }}>
                        {inst.currentInstallment}/{inst.totalInstallments}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inst.title}</p>
                        <p className="text-[11px] text-muted-foreground">{card?.name} · {formatBRL(inst.installmentAmount)}/mês</p>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatBRL(inst.installmentAmount * (inst.totalInstallments - inst.currentInstallment + 1))} restante</span>
                      <DeleteButton onClick={() => deleteInstallment(inst.id)} />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </TabPanel>

        {/* ── Parcelamentos ──────────────────────────────────── */}
        <TabPanel value="parcelamentos">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Parcelamentos</CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">{installments.length}</span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {installments.length > 0 ? installments.map((inst) => {
                const card = cards.find((c) => c.id === inst.cardId)
                return (
                  <div key={inst.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tabular-nums" style={{ backgroundColor: (card?.color ?? '#5b8dbf') + '18', color: card?.color }}>
                      {inst.currentInstallment}/{inst.totalInstallments}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inst.title}</p>
                      <p className="text-[11px] text-muted-foreground">{card?.name ?? 'Sem cartão'} · {inst.category} · {formatBRL(inst.installmentAmount)}/mês</p>
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
                      <DeleteButton onClick={() => deleteInstallment(inst.id)} />
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
                <Target size={16} className="text-emerald-500" />
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
                    <ChevronRight size={15} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
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
                <Card key={b.id} glass hover className="cursor-pointer" onClick={() => openEditBox(b.id)}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: b.color + '18' }}>
                        <PiggyBank size={16} style={{ color: b.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.name}</p>
                        {b.deadline && <p className="text-[10px] text-muted-foreground">prazo: {new Date(b.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                      </div>
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
      <AddTransactionDialog open={addTxOpen} onClose={() => setAddTxOpen(false)} />
      <AddFixedBillDialog open={addBillOpen} onClose={() => setAddBillOpen(false)} />
      <AddSubscriptionDialog open={addSubOpen} onClose={() => setAddSubOpen(false)} />
      <AddCardDialog open={addCardOpen} onClose={() => setAddCardOpen(false)} />
      <AddInstallmentDialog open={addInstOpen} onClose={() => setAddInstOpen(false)} />
      <GoalDialog open={goalOpen} onClose={() => { setGoalOpen(false); setGoalEditId(undefined) }} editId={goalEditId} />
      <SavingsBoxDialog open={boxOpen} onClose={() => { setBoxOpen(false); setBoxEditId(undefined) }} editId={boxEditId} />
    </div>
  )
}
