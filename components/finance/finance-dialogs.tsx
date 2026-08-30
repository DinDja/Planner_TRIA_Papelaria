'use client'

import { useFinanceStore } from '@/lib/store/use-finance-store'
import {
  CARD_BRANDS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_RECURRENCE,
} from '@/lib/types'
import type {
  FinancialAccount,
  FinancialAccountRole,
  Subscription,
  Transaction,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0', '#d4b070']

const selectClass =
  'flex h-9 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20'

const RECURRENCE_LABELS: Record<NonNullable<Transaction['recurrence']>, string> = {
  monthly: 'Mensal',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  yearly: 'Anual',
}

function AmountInput({ value, onChange, ...props }: { value: number; onChange: (v: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const display = value > 0 ? (value / 100).toFixed(2) : ''
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="0,00"
        className="pl-9"
        value={display}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(Number(raw) || 0)
        }}
        {...props}
      />
    </div>
  )
}

// ─── Transaction Dialog ───────────────────────────────────────────────────────

export function AddTransactionDialog({
  open, onClose, defaultType, defaultAccountId,
}: {
  open: boolean; onClose: () => void; defaultType?: 'income' | 'expense'; defaultAccountId?: string
}) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const accounts = useFinanceStore((s) => s.accounts)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'income' | 'expense'>(defaultType ?? 'expense')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [recurrence, setRecurrence] = useState<Transaction['recurrence']>()
  const [paymentMethod, setPaymentMethod] = useState('')
  const [accountId, setAccountId] = useState('')
  const [status, setStatus] = useState<Transaction['status']>(defaultType === 'income' ? 'received' : 'paid')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle(''); setAmount(0); setType(defaultType ?? 'expense'); setCategory('')
    setDate(new Date().toISOString().slice(0, 10)); setRecurrence(undefined)
    setPaymentMethod(''); setAccountId('')
    setStatus(defaultType === 'income' ? 'received' : 'paid'); setNotes('')
  }

  const switchType = (t: 'income' | 'expense') => {
    setType(t)
    setCategory('')
    setAccountId('')
    setStatus(t === 'income' ? 'received' : 'paid')
  }

  useEffect(() => {
    if (!open) return
    const role = type === 'income' ? 'receiving' : 'payment'
    const available = accounts.filter((item) => item.roles.includes(role))
    const preferred = available.find((item) => item.id === defaultAccountId) ?? available[0]
    setAccountId((current) => available.some((item) => item.id === current) ? current : preferred?.id ?? '')
  }, [accounts, defaultAccountId, open, type])

  const handleSave = () => {
    if (!title.trim() || amount <= 0 || !category) {
      toast({ title: 'Preencha título, valor e categoria', variant: 'error' }); return
    }
    const selectedAccount = accounts.find((item) => item.id === accountId)
    if (!selectedAccount) {
      toast({ title: `Selecione a conta de ${type === 'income' ? 'recebimento' : 'pagamento'}.`, variant: 'error' }); return
    }
    addTransaction({
      title: title.trim(),
      amount,
      type,
      date,
      category,
      recurrence: recurrence ?? undefined,
      paymentMethod: paymentMethod || undefined,
      account: selectedAccount.name,
      accountId: selectedAccount.id,
      status,
      notes: notes.trim() || undefined,
    })
    toast({ title: type === 'income' ? 'Receita adicionada!' : 'Despesa adicionada!', variant: 'success' }); reset(); onClose()
  }

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const statusOptions = type === 'income'
    ? [{ value: 'received', label: 'Recebido' }, { value: 'pending', label: 'Pendente' }]
    : [{ value: 'paid', label: 'Pago' }, { value: 'pending', label: 'Pendente' }]
  const accountOptions = accounts.filter((item) => item.roles.includes(type === 'income' ? 'receiving' : 'payment'))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={type === 'income' ? 'Nova receita' : 'Nova despesa'}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} onClick={() => switchType(t)}
                className={cn('flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                  type === t ? 'border-transparent text-white shadow-md' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                )}
                style={type === t ? { backgroundColor: t === 'income' ? '#7bb686' : '#e05b6d' } : undefined}
              >{t === 'income' ? 'Receita' : 'Despesa'}</button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Salário, Supermercado..." autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor</label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    category === c ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}>{c}</button>
              ))}
            </div>
          </div>

          {type === 'income' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Recorrência</label>
                <select
                  className={selectClass}
                  value={recurrence ?? ''}
                  onChange={(e) => setRecurrence(e.target.value ? (e.target.value as Transaction['recurrence']) : undefined)}
                >
                  <option value="">Não se repete</option>
                  {TRANSACTION_RECURRENCE.map((r) => (
                    <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Forma de Recebimento</label>
                <select
                  className={selectClass}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conta de Recebimento</label>
                <select className={selectClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                  <option value="">Selecione a conta</option>
                  {accountOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </>
          )}

          {type === 'expense' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Forma de Pagamento</label>
                <select
                  className={selectClass}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conta de Pagamento</label>
                <select className={selectClass} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                  <option value="">Selecione a conta</option>
                  {accountOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Status</label>
            <select
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as Transaction['status'])}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes (opcional)" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Fixed Bill Dialog ────────────────────────────────────────────────────────

const ACCOUNT_ROLE_LABELS: Record<FinancialAccountRole, string> = {
  receiving: 'Receber dinheiro',
  payment: 'Realizar pagamentos',
}

function AccountRolePicker({
  roles,
  onChange,
}: {
  roles: FinancialAccountRole[]
  onChange: (roles: FinancialAccountRole[]) => void
}) {
  const toggle = (role: FinancialAccountRole) => {
    onChange(
      roles.includes(role)
        ? roles.filter((current) => current !== role)
        : [...roles, role],
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {(['receiving', 'payment'] as const).map((role) => {
        const active = roles.includes(role)
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-left text-xs transition-colors',
              active
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
          >
            {ACCOUNT_ROLE_LABELS[role]}
          </button>
        )
      })}
    </div>
  )
}

export function FinanceAccountsSetup({ onComplete }: { onComplete: (ids: string[]) => void }) {
  const addAccount = useFinanceStore((state) => state.addAccount)
  const [sameAccount, setSameAccount] = useState(true)
  const [sharedName, setSharedName] = useState('')
  const [receivingName, setReceivingName] = useState('')
  const [paymentName, setPaymentName] = useState('')

  const handleSave = () => {
    if (sameAccount) {
      if (!sharedName.trim()) {
        toast({ title: 'Informe a conta que você utiliza.', variant: 'error' })
        return
      }
      const id = addAccount({ name: sharedName.trim(), roles: ['receiving', 'payment'] })
      onComplete([id])
      return
    }

    if (!receivingName.trim() || !paymentName.trim()) {
      toast({ title: 'Informe as contas de recebimento e pagamento.', variant: 'error' })
      return
    }
    const receivingId = addAccount({ name: receivingName.trim(), roles: ['receiving'] })
    const paymentId = addAccount({ name: paymentName.trim(), roles: ['payment'] })
    onComplete([receivingId, paymentId])
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1200px] items-center px-6 py-10 lg:px-8">
      <section className="w-full max-w-2xl border-y border-border/60 py-10 sm:py-14" aria-labelledby="finance-accounts-title">
        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
          configuração inicial de Finanças
        </p>
        <h1 id="finance-accounts-title" className="max-w-xl text-3xl font-semibold tracking-tight">
          Quais contas são utilizadas nas suas movimentações financeiras?
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Informe as contas utilizadas para receber receitas e realizar pagamentos. Dessa forma, cada movimentação será vinculada à conta correspondente.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Como suas contas funcionam">
          <button
            type="button"
            onClick={() => setSameAccount(true)}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs transition-colors',
              sameAccount ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
          >
            Utilizo a mesma conta para recebimentos e pagamentos
          </button>
          <button
            type="button"
            onClick={() => setSameAccount(false)}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs transition-colors',
              !sameAccount ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
          >
            Utilizo contas distintas para recebimentos e pagamentos
          </button>
        </div>

        <div className="mt-6 max-w-lg space-y-4">
          {sameAccount ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Conta de recebimento e pagamento</label>
              <Input
                value={sharedName}
                onChange={(event) => setSharedName(event.target.value)}
                placeholder="Ex: Nubank, Itaú, carteira..."
                autoFocus
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Conta de Recebimento</label>
                <Input
                  value={receivingName}
                  onChange={(event) => setReceivingName(event.target.value)}
                  placeholder="Ex: conta onde recebe salário"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Conta de Pagamento</label>
                <Input
                  value={paymentName}
                  onChange={(event) => setPaymentName(event.target.value)}
                  placeholder="Ex: conta usada para pagar despesas"
                />
              </div>
            </>
          )}
          <Button onClick={handleSave} className="rounded-xl">
            Salvar contas e continuar
          </Button>
        </div>
      </section>
    </div>
  )
}

export function AccountsManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const accounts = useFinanceStore((state) => state.accounts)
  const addAccount = useFinanceStore((state) => state.addAccount)
  const updateAccount = useFinanceStore((state) => state.updateAccount)
  const deleteAccount = useFinanceStore((state) => state.deleteAccount)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [roles, setRoles] = useState<FinancialAccountRole[]>(['receiving', 'payment'])

  const startNew = () => {
    setEditingId(null)
    setName('')
    setRoles(['receiving', 'payment'])
  }

  const startEdit = (account: FinancialAccount) => {
    setEditingId(account.id)
    setName(account.name)
    setRoles(account.roles)
  }

  const saveAccount = () => {
    if (!name.trim()) {
      toast({ title: 'Informe um nome para a conta.', variant: 'error' })
      return
    }
    if (roles.length === 0) {
      toast({ title: 'Escolha se a conta recebe, paga ou faz os dois.', variant: 'error' })
      return
    }
    if (editingId) updateAccount(editingId, { name: name.trim(), roles })
    else addAccount({ name: name.trim(), roles })
    startNew()
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent title="Gerenciar contas" description="Edite os usos de uma conta ou cadastre outra para suas movimentações.">
        <div className="space-y-4">
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {account.roles.length === 2 ? 'Recebimentos e pagamentos' : ACCOUNT_ROLE_LABELS[account.roles[0]]}
                  </p>
                </div>
                <button type="button" onClick={() => startEdit(account)} className="text-xs text-primary hover:underline">
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => window.confirm(`Excluir a conta “${account.name}”?`) && deleteAccount(account.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {editingId ? 'Editar conta' : 'Adicionar conta'}
            </p>
            <div className="space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da conta" />
              <AccountRolePicker roles={roles} onChange={setRoles} />
              <div className="flex justify-end gap-2">
                {editingId && (
                  <Button variant="ghost" onClick={startNew} className="rounded-xl">
                    Cancelar edição
                  </Button>
                )}
                <Button onClick={saveAccount} className="rounded-xl">
                  {editingId ? 'Salvar alterações' : 'Adicionar conta'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddFixedBillDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addFixedBill = useFinanceStore((s) => s.addFixedBill)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState('Moradia')
  const [dayOfMonth, setDayOfMonth] = useState(5)

  const handleSave = () => {
    if (!title.trim() || amount <= 0) { toast({ title: 'Preencha título e valor', variant: 'error' }); return }
    addFixedBill({ title: title.trim(), amount, category, dayOfMonth })
    toast({ title: 'Conta fixa adicionada!', variant: 'success' }); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova conta fixa" description="Despesa que se repete todo mês.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aluguel, Internet..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor</label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dia do mês</label>
              <Input type="number" min={1} max={31} value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    category === c ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Subscription Dialog ──────────────────────────────────────────────────────

export function AddSubscriptionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addSubscription = useFinanceStore((s) => s.addSubscription)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [billingCycle, setBillingCycle] = useState<Subscription['billingCycle']>('monthly')
  const [category, setCategory] = useState('Lazer')

  const handleSave = () => {
    if (!name.trim() || amount <= 0) { toast({ title: 'Preencha nome e valor', variant: 'error' }); return }
    addSubscription({ name: name.trim(), amount, billingCycle, category })
    toast({ title: 'Assinatura adicionada!', variant: 'success' }); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova assinatura" description="Serviço recorrente (Netflix, Spotify, etc).">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Netflix..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor</label>
              <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ciclo</label>
              <div className="flex gap-1">
                {(['monthly', 'yearly', 'weekly'] as const).map((c) => (
                  <button key={c} onClick={() => setBillingCycle(c)}
                    className={cn('flex-1 rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-all cursor-pointer',
                      billingCycle === c ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                    )}>{c === 'monthly' ? 'Mensal' : c === 'yearly' ? 'Anual' : 'Semanal'}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    category === c ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card Dialog ──────────────────────────────────────────────────────────────

export function AddCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCard = useFinanceStore((s) => s.addCard)
  const [bank, setBank] = useState('')
  const [brand, setBrand] = useState<string>(CARD_BRANDS[0])
  const [lastDigits, setLastDigits] = useState('')
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState(COLORS[3])

  const handleSave = () => {
    if (!bank.trim()) { toast({ title: 'Digite o banco', variant: 'error' }); return }
    addCard({ bank: bank.trim(), brand, lastDigits: lastDigits || undefined, closingDay, dueDay, color })
    toast({ title: 'Cartão adicionado!', variant: 'success' })
    setBank(''); setBrand(CARD_BRANDS[0]); setLastDigits(''); setClosingDay(1); setDueDay(10); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo cartão de crédito">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Banco</label>
            <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex: Nubank, Itaú, Inter..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bandeira</label>
              <select
                className={selectClass}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {CARD_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Final</label>
              <Input
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fechamento (dia)</label>
              <Input type="number" min={1} max={31} value={closingDay}
                onChange={(e) => setClosingDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Vencimento (dia)</label>
              <Input type="number" min={1} max={31} value={dueDay}
                onChange={(e) => setDueDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('size-8 rounded-full transition-all cursor-pointer inline-flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover' : 'hover:scale-110',
                  )} style={{ backgroundColor: c }}>
                  {color === c && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Installment Dialog ───────────────────────────────────────────────────────

export function AddInstallmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addInstallment = useFinanceStore((s) => s.addInstallment)
  const cards = useFinanceStore((s) => s.cards)
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalInstallments, setTotalInstallments] = useState(12)
  const [firstInstallment, setFirstInstallment] = useState(new Date().toISOString().slice(0, 10))
  const [cardId, setCardId] = useState('')
  const [category, setCategory] = useState('Compras')

  const installmentAmount = totalInstallments > 0 ? Math.round(totalAmount / totalInstallments) : 0

  const handleSave = () => {
    if (!title.trim() || totalAmount <= 0 || !cardId) {
      toast({ title: 'Preencha descrição, valor e cartão', variant: 'error' }); return
    }
    addInstallment({
      title: title.trim(), totalAmount, installmentAmount, totalInstallments, cardId, category,
      firstInstallment: firstInstallment || undefined,
    })
    toast({ title: 'Parcelamento adicionado!', variant: 'success' }); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo parcelamento">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: iPhone, Curso..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Valor total</label>
              <AmountInput value={totalAmount} onChange={setTotalAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Parcelas</label>
              <Input type="number" min={1} max={120} value={totalInstallments}
                onChange={(e) => setTotalInstallments(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">1ª parcela em</label>
            <Input type="date" value={firstInstallment} onChange={(e) => setFirstInstallment(e.target.value)} />
          </div>
          {installmentAmount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-semibold text-foreground">{totalInstallments}x</span> de{' '}
              <span className="font-semibold text-foreground">R$ {(installmentAmount / 100).toFixed(2)}</span>
            </p>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cartão</label>
            <div className="flex flex-wrap gap-1.5">
              {cards.map((c) => (
                <button key={c.id} onClick={() => setCardId(c.id)}
                  className={cn('rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                    cardId === c.id ? 'border-transparent text-white shadow-md' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )} style={cardId === c.id ? { backgroundColor: c.color } : undefined}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    category === c ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Goal Dialog ──────────────────────────────────────────────────────────────

export function GoalDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const goals = useFinanceStore((s) => s.goals)
  const addGoal = useFinanceStore((s) => s.addGoal)
  const updateGoal = useFinanceStore((s) => s.updateGoal)
  const existing = editId ? goals.find((g) => g.id === editId) : null

  const [title, setTitle] = useState(existing?.title ?? '')
  const [targetAmount, setTargetAmount] = useState(existing?.targetAmount ?? 0)
  const [currentAmount, setCurrentAmount] = useState(existing?.currentAmount ?? 0)
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [color, setColor] = useState(existing?.color ?? COLORS[2])

  const handleSave = () => {
    if (!title.trim() || targetAmount <= 0) { toast({ title: 'Preencha nome e valor da meta', variant: 'error' }); return }
    if (editId) {
      updateGoal(editId, { title: title.trim(), targetAmount, currentAmount, deadline: deadline || undefined, color })
      toast({ title: 'Meta atualizada!', variant: 'success' })
    } else {
      addGoal({ title: title.trim(), targetAmount, currentAmount, deadline: deadline || undefined, color })
      toast({ title: 'Meta criada!', variant: 'success' })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar meta' : 'Nova meta financeira'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome da meta</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reserva de emergência..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Meta</label>
              <AmountInput value={targetAmount} onChange={setTargetAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Guardado</label>
              <AmountInput value={currentAmount} onChange={setCurrentAmount} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Prazo (opcional)</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('size-8 rounded-full transition-all cursor-pointer inline-flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover' : 'hover:scale-110',
                  )} style={{ backgroundColor: c }}>
                  {color === c && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">{editId ? 'Salvar' : 'Criar meta'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Savings Box Dialog ───────────────────────────────────────────────────────

export function SavingsBoxDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const boxes = useFinanceStore((s) => s.savingsBoxes)
  const addBox = useFinanceStore((s) => s.addBox)
  const updateBox = useFinanceStore((s) => s.updateBox)
  const existing = editId ? boxes.find((b) => b.id === editId) : null

  const [name, setName] = useState(existing?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(existing?.targetAmount ?? 0)
  const [currentAmount, setCurrentAmount] = useState(existing?.currentAmount ?? 0)
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [color, setColor] = useState(existing?.color ?? COLORS[2])

  const handleSave = () => {
    if (!name.trim() || targetAmount <= 0) { toast({ title: 'Preencha nome e valor', variant: 'error' }); return }
    if (editId) {
      updateBox(editId, { name: name.trim(), targetAmount, currentAmount, deadline: deadline || undefined, color })
      toast({ title: 'Caixinha atualizada!', variant: 'success' })
    } else {
      addBox({ name: name.trim(), targetAmount, currentAmount, deadline: deadline || undefined, color })
      toast({ title: 'Caixinha criada!', variant: 'success' })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar caixinha' : 'Nova caixinha'} description="Separe dinheiro por finalidade.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem, Natal..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Meta</label>
              <AmountInput value={targetAmount} onChange={setTargetAmount} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Guardado</label>
              <AmountInput value={currentAmount} onChange={setCurrentAmount} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Prazo (opcional)</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('size-8 rounded-full transition-all cursor-pointer inline-flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover' : 'hover:scale-110',
                  )} style={{ backgroundColor: c }}>
                  {color === c && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">{editId ? 'Salvar' : 'Criar caixinha'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
