'use client'

import { useRoutineStore } from '@/lib/store/use-routine-store'
import type { RecurrenceFrequency, TaskPriority, Weekday } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  WEEKDAY_SHORT,
  todayStr,
} from './shared'

// ─── Seletor de prioridade compartilhado ──────────────────────────────────────

function PriorityPicker({
  value,
  onChange,
}: {
  value: TaskPriority
  onChange: (p: TaskPriority) => void
}) {
  return (
    <div className="flex gap-2">
      {(['low', 'medium', 'high'] as const).map((p) => {
        const active = value === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
              active
                ? 'border-transparent text-white shadow-md'
                : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
            style={active ? { backgroundColor: PRIORITY_COLORS[p] } : undefined}
          >
            {PRIORITY_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Dialog: Nova tarefa ──────────────────────────────────────────────────────

export function AddTaskDialog({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: string
}) {
  const addTask = useRoutineStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayStr())
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const reset = () => {
    setTitle('')
    setDate(defaultDate ?? todayStr())
    setPriority('medium')
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para a tarefa', variant: 'error' })
      return
    }
    addTask({ title: title.trim(), date, priority })
    toast({ title: 'Tarefa criada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova tarefa" description="Uma tarefa única, com data definida.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Marcar consulta..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <PriorityPicker value={priority} onChange={setPriority} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar tarefa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Nova tarefa recorrente ───────────────────────────────────────────

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export function AddRecurringDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addRecurring = useRoutineStore((s) => s.addRecurring)
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [weekdays, setWeekdays] = useState<Weekday[]>([0, 1, 2, 3, 4])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    )

  const reset = () => {
    setTitle('')
    setFrequency('daily')
    setWeekdays([0, 1, 2, 3, 4])
    setDayOfMonth(1)
    setPriority('medium')
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título', variant: 'error' })
      return
    }
    if (frequency === 'weekly' && weekdays.length === 0) {
      toast({ title: 'Escolha ao menos um dia da semana', variant: 'error' })
      return
    }
    addRecurring({
      title: title.trim(),
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      priority,
    })
    toast({ title: 'Tarefa recorrente criada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Nova tarefa recorrente"
        description="Repete automaticamente: diária, semanal ou mensal."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Beber 2L de água..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Frequência</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
                    frequency === f
                      ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Dias da semana</label>
              <div className="flex gap-1.5 flex-wrap">
                {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => {
                  const active = weekdays.includes(d)
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleWeekday(d)}
                      className={cn(
                        'size-9 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer inline-flex items-center justify-center',
                        active
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {WEEKDAY_SHORT[d]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dia do mês</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) =>
                  setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <PriorityPicker value={priority} onChange={setPriority} />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar recorrência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Nova pendência ───────────────────────────────────────────────────

export function AddPendingDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addPending = useRoutineStore((s) => s.addPending)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const reset = () => {
    setTitle('')
    setPriority('medium')
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título', variant: 'error' })
      return
    }
    addPending({ title: title.trim(), priority })
    toast({ title: 'Pendência adicionada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Nova pendência"
        description="Item avulso sem data — anote agora, agende depois."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pensar em ideias de viagem..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <PriorityPicker value={priority} onChange={setPriority} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog: Novo bloco da rotina ideal ───────────────────────────────────────

const SLOT_COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0']

export function AddSlotDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addRoutineSlot = useRoutineStore((s) => s.addRoutineSlot)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:30')
  const [weekdays, setWeekdays] = useState<Weekday[]>([0, 1, 2, 3, 4])
  const [color, setColor] = useState(SLOT_COLORS[2])

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    )

  const reset = () => {
    setTitle('')
    setTime('08:00')
    setEndTime('08:30')
    setWeekdays([0, 1, 2, 3, 4])
    setColor(SLOT_COLORS[2])
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título', variant: 'error' })
      return
    }
    if (weekdays.length === 0) {
      toast({ title: 'Escolha ao menos um dia', variant: 'error' })
      return
    }
    addRoutineSlot({
      title: title.trim(),
      time,
      endTime,
      weekdays: [...weekdays].sort(),
      color,
    })
    toast({ title: 'Bloco adicionado à rotina ideal!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Novo bloco de rotina"
        description="Um horário fixo do seu dia ideal, ex: 07:00 Academia."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Academia, Leitura, Café da manhã..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Início</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fim</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Dias da semana</label>
            <div className="flex gap-1.5 flex-wrap">
              {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => {
                const active = weekdays.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWeekday(d)}
                    className={cn(
                      'size-9 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer inline-flex items-center justify-center',
                      active
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {WEEKDAY_SHORT[d]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {SLOT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-8 rounded-full transition-all duration-200 cursor-pointer inline-flex items-center justify-center',
                    color === c
                      ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover'
                      : 'hover:scale-110 hover:shadow-md',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Adicionar bloco
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
