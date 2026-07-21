'use client'

import { useFinanceStore } from '@/lib/store/use-finance-store'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/types'
import type { Subscription } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0', '#d4b070']

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
  open, onClose, defaultType,
}: {
  open: boolean; onClose: () => void; defaultType?: 'income' | 'expense'
}) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'income' | 'expense'>(defaultType ?? 'expense')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const reset = () => { setTitle(''); setAmount(0); setType(defaultType ?? 'expense'); setCategory(''); setDate(new Date().toISOString().slice(0, 10)) }

  const handleSave = () => {
    if (!title.trim() || amount <= 0 || !category) {
      toast({ title: 'Preencha título, valor e categoria', variant: 'error' }); return
    }
    addTransaction({ title: title.trim(), amount, type, date, category })
    toast({ title: 'Transação adicionada!', variant: 'success' }); reset(); onClose()
  }

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={type === 'income' ? 'Nova receita' : 'Nova despesa'}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} onClick={() => { setType(t); setCategory('') }}
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
  const [name, setName] = useState('')
  const [limit, setLimit] = useState(0)
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState(COLORS[3])

  const handleSave = () => {
    if (!name.trim() || limit <= 0) { toast({ title: 'Preencha nome e limite', variant: 'error' }); return }
    addCard({ name: name.trim(), limit, closingDay, dueDay, color })
    toast({ title: 'Cartão adicionado!', variant: 'success' }); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo cartão de crédito">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Inter..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Limite</label>
            <AmountInput value={limit} onChange={setLimit} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha (dia)</label>
              <Input type="number" min={1} max={31} value={closingDay}
                onChange={(e) => setClosingDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Vence (dia)</label>
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
  const [cardId, setCardId] = useState('')
  const [category, setCategory] = useState('Eletrônicos')

  const installmentAmount = totalInstallments > 0 ? Math.round(totalAmount / totalInstallments) : 0

  const handleSave = () => {
    if (!title.trim() || totalAmount <= 0 || !cardId) {
      toast({ title: 'Preencha título, valor e cartão', variant: 'error' }); return
    }
    addInstallment({ title: title.trim(), totalAmount, installmentAmount, totalInstallments, cardId, category })
    toast({ title: 'Parcelamento adicionado!', variant: 'success' }); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo parcelamento">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Produto</label>
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
