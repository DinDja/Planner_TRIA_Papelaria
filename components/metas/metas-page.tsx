'use client'

import { useFinanceStore } from '@/lib/store/use-finance-store'
import { cn } from '@/lib/utils'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { GoalDialog } from '../finance/finance-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const formatBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

// ─── Dialog de aporte rápido ──────────────────────────────────────────────────

function DepositDialog({
  open,
  onClose,
  goalId,
  goalTitle,
}: {
  open: boolean
  onClose: () => void
  goalId: string
  goalTitle: string
}) {
  const addGoalDeposit = useFinanceStore((s) => s.addGoalDeposit)
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Reset sempre que o dialog reabre / troca de meta
  useEffect(() => {
    if (open) {
      setType('deposit')
      setAmount('')
      setNotes('')
    }
  }, [open, goalId])

  const parsedAmount = Math.round((Number(amount.replace(',', '.')) || 0) * 100)
  const signed = type === 'withdraw' ? -parsedAmount : parsedAmount

  const handleDeposit = () => {
    if (parsedAmount <= 0) {
      toast({ title: 'Digite um valor válido', variant: 'error' })
      return
    }
    addGoalDeposit({ goalId, amount: signed, notes: notes.trim() || undefined })
    toast({
      title: type === 'withdraw' ? 'Retirada registrada!' : 'Aporte registrado!',
      variant: 'success',
    })
    setAmount('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={goalTitle} description="Registrar aporte ou retirada">
        <div className="flex flex-col gap-4">
          {/* Seleção de tipo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de movimentação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer',
                  type === 'deposit'
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 shadow-sm'
                    : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                )}
              >
                <ArrowUp size={16} />
                Aporte
              </button>
              <button
                type="button"
                onClick={() => setType('withdraw')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer',
                  type === 'withdraw'
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 shadow-sm'
                    : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                )}
              >
                <ArrowDown size={16} />
                Retirada
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // Permite dígitos, vírgula e ponto
                  const v = e.target.value.replace(/[^\d.,]/g, '')
                  setAmount(v)
                }}
                placeholder="0,00"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleDeposit()}
                className="flex h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === 'deposit' ? 'Ex: Depósito do mês...' : 'Ex: Resgate emergência...'}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleDeposit}
              className="rounded-xl shadow-md"
              style={{ backgroundColor: type === 'withdraw' ? '#e05b6d' : '#7bb686' }}
            >
              {type === 'withdraw' ? 'Registrar retirada' : 'Adicionar aporte'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card de meta expandido ───────────────────────────────────────────────────

function GoalCard({
  goal,
  onDeposit,
  onEdit,
  onDelete,
}: {
  goal: { id: string; title: string; targetAmount: number; currentAmount: number; deadline?: string; color: string }
  onDeposit: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const daysLeft = goal.deadline
    ? Math.round((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86400000)
    : null

  return (
    <Card
      glass
      hover
      className="cursor-pointer group relative overflow-hidden"
      onClick={() => onEdit(goal.id)}
    >
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: goal.color + '18' }}
          >
            <Target size={18} style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate">{goal.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatBRL(goal.currentAmount)} de {formatBRL(goal.targetAmount)}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.id) }}
            className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="h-3 rounded-full bg-muted/80 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
              boxShadow: `0 1px 8px -2px ${goal.color}80`,
            }}
          >
            {pct > 15 && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3">
            <span className="font-bold tabular-nums" style={{ color: goal.color }}>
              {pct}%
            </span>
            <span className="text-muted-foreground">
              faltam {formatBRL(Math.max(0, remaining))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {daysLeft !== null && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  daysLeft < 0 ? 'text-destructive border-destructive/40' : daysLeft < 30 ? 'text-amber-600 border-amber-600/40' : '',
                )}
              >
                <Calendar size={9} className="mr-1" />
                {daysLeft < 0 ? `${-daysLeft} dias atrasado` : daysLeft === 0 ? 'hoje' : `${daysLeft} dias`}
              </Badge>
            )}
            <Button
              variant="default"
              size="xs"
              className="rounded-xl gap-1 text-[10px] h-7 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onDeposit(goal.id) }}
            >
              <Plus size={11} />
              Aporte
            </Button>
          </div>
        </div>

        {/* Aportes recentes (mini indicador) */}
        {pct > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <TrendingUp size={11} />
              <span>
                {goal.currentAmount >= goal.targetAmount
                  ? 'Meta concluída! 🎉'
                  : `${formatBRL(Math.max(0, remaining))} restantes`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Timeline de aportes ──────────────────────────────────────────────────────

function DepositTimeline({ goalId }: { goalId: string }) {
  const getGoalDeposits = useFinanceStore((s) => s.getGoalDeposits)
  const deposits = getGoalDeposits(goalId)

  if (deposits.length === 0) return null

  const sorted = [...deposits].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-1">
      {sorted.slice(0, 5).map((dep) => (
        <div key={dep.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg',
              dep.amount > 0 ? 'bg-emerald-500/15' : 'bg-destructive/15',
            )}
          >
            {dep.amount > 0 ? (
              <ArrowUp size={12} className="text-emerald-600" />
            ) : (
              <ArrowDown size={12} className="text-destructive" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium">
              {dep.notes || (dep.amount > 0 ? 'Aporte' : 'Retirada')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tabular-nums">
              {dep.amount > 0 ? '+' : ''}
              {formatBRL(dep.amount)}
            </p>
            <p className="text-[9px] text-muted-foreground tabular-nums">
              {new Date(dep.date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function MetasPage() {
  const goals = useFinanceStore((s) => s.goals)
  const savingsBoxes = useFinanceStore((s) => s.savingsBoxes)
  const deleteGoal = useFinanceStore((s) => s.deleteGoal)

  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalEditId, setGoalEditId] = useState<string | undefined>()
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0)
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length
  const boxTotal = savingsBoxes.reduce((acc, b) => acc + b.currentAmount, 0)

  const sortedGoals = useMemo(
    () =>
      [...goals].sort((a, b) => {
        // Concluídas por último
        const aDone = a.currentAmount >= a.targetAmount ? 1 : 0
        const bDone = b.currentAmount >= b.targetAmount ? 1 : 0
        if (aDone !== bDone) return aDone - bDone
        // Maior progresso primeiro
        const aPct = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0
        const bPct = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0
        return bPct - aPct
      }),
    [goals],
  )

  const openNewGoal = () => {
    setGoalEditId(undefined)
    setGoalDialogOpen(true)
  }

  const openEditGoal = (id: string) => {
    setGoalEditId(id)
    setGoalDialogOpen(true)
  }

  const handleDeposit = (id: string) => {
    setDepositGoalId(id)
  }

  const selectedGoal = depositGoalId ? goals.find((g) => g.id === depositGoalId) : null

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#7bb68618' }}
            >
              <Target size={22} style={{ color: '#7bb686' }} />
            </span>
            Metas Financeiras
          </h1>
          <p className="text-muted-foreground mt-2 capitalize">
            {completed} de {goals.length} metas concluídas
          </p>
        </div>
        <Button className="rounded-xl gap-1.5 shadow-md" onClick={openNewGoal}>
          <Plus size={15} />
          Nova meta
        </Button>
      </div>

      {/* Overview cards */}
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mb-8', enter)}>
        {[
          { label: 'Total guardado', value: totalSaved, icon: Wallet, color: '#7bb686' },
          { label: 'Meta total', value: totalTarget, icon: TrendingUp, color: '#f0b429' },
          { label: 'Progresso geral', value: `${overallPct}%`, icon: Target, color: '#5b8dbf' },
          { label: 'Em caixinhas', value: boxTotal, icon: Wallet, color: '#c9b6e4' },
        ].map((s) => (
          <Card key={s.label} glass hover className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums">
                  {typeof s.value === 'number' ? formatBRL(s.value) : s.value}
                </p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.color + '18' }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Barra de progresso geral */}
      <Card glass className={cn('mb-8', enter)}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Progresso geral</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: '#7bb686' }}>
              {overallPct}%
            </p>
          </div>
          <div className="h-4 rounded-full bg-muted/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
              style={{
                width: `${Math.min(overallPct, 100)}%`,
                background: 'linear-gradient(90deg, #7bb686, #5b8dbf)',
                boxShadow: '0 1px 10px -2px #7bb68680',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {formatBRL(totalSaved)} de {formatBRL(totalTarget)} · faltam{' '}
            {formatBRL(Math.max(0, totalTarget - totalSaved))}
          </p>
        </CardContent>
      </Card>

      {/* Grid de Metas */}
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', enter)}>
        {sortedGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onDeposit={handleDeposit}
            onEdit={openEditGoal}
            onDelete={(id) => {
              deleteGoal(id)
              toast({ title: 'Meta excluída', variant: 'success' })
            }}
          />
        ))}

        {goals.length === 0 && (
          <div className="col-span-full">
            <Card glass>
              <p className="text-sm text-muted-foreground text-center py-12">
                Nenhuma meta financeira ainda. Crie sua primeira meta!
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GoalDialog
        open={goalDialogOpen}
        onClose={() => {
          setGoalDialogOpen(false)
          setGoalEditId(undefined)
        }}
        editId={goalEditId}
      />

      {selectedGoal && (
        <DepositDialog
          open={depositGoalId !== null}
          onClose={() => setDepositGoalId(null)}
          goalId={selectedGoal.id}
          goalTitle={selectedGoal.title}
        />
      )}
    </div>
  )
}
