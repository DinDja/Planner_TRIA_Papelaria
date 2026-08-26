'use client'

import { useRoutineStore } from '@/lib/store/use-routine-store'
import type { RecurrenceFrequency, RecurringTask, Task, TaskPriority, Weekday } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, CheckCircle2, Circle, Repeat, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  WEEKDAY_SHORT,
  formatDateShort,
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

type TaskFormFrequency = 'once' | RecurrenceFrequency

const TASK_FREQUENCY_LABELS: Record<TaskFormFrequency, string> = {
  once: 'Somente da Data',
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

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
  const addRecurring = useRoutineStore((s) => s.addRecurring)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayStr())
  const [time, setTime] = useState('')
  const [frequency, setFrequency] = useState<TaskFormFrequency>('once')
  const [weekdays, setWeekdays] = useState<Weekday[]>([0, 1, 2, 3, 4])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    )

  const reset = () => {
    setTitle('')
    setDate(defaultDate ?? todayStr())
    setTime('')
    setFrequency('once')
    setWeekdays([0, 1, 2, 3, 4])
    setDayOfMonth(1)
    setNotes('')
    setPriority('medium')
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para a tarefa', variant: 'error' })
      return
    }
    if (frequency === 'weekly' && weekdays.length === 0) {
      toast({ title: 'Escolha ao menos um dia da semana', variant: 'error' })
      return
    }
    const common = {
      title: title.trim(),
      time: time || undefined,
      notes: notes.trim() || undefined,
      priority,
    }
    if (frequency === 'once') {
      addTask({ ...common, date })
      toast({ title: 'Tarefa criada!', variant: 'success' })
    } else {
      addRecurring({
        ...common,
        frequency,
        weekdays: frequency === 'weekly' ? weekdays : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      })
      toast({ title: 'Tarefa recorrente criada!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova tarefa" description="Uma tarefa única ou recorrente.">
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
            <label className="text-sm font-medium mb-2 block">Frequência</label>
            <div className="flex gap-2 flex-wrap">
              {(['once', 'daily', 'weekly', 'monthly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'flex-1 min-w-[90px] rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
                    frequency === f
                      ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {TASK_FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'once' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Hora</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes da tarefa..."
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
              Criar tarefa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TodayTaskRow({ task }: { task: Task }) {
  const toggleTask = useRoutineStore((s) => s.toggleTask)
  const deleteTask = useRoutineStore((s) => s.deleteTask)

  return (
    <div className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40', task.done && 'opacity-60')}>
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        aria-label={task.done ? 'Desmarcar tarefa' : 'Concluir tarefa'}
      >
        {task.done ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', task.done && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {(task.time || task.notes) && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {task.time ? `${task.time}${task.notes ? ' · ' : ''}` : ''}{task.notes}
          </p>
        )}
      </div>
      <span
        className="shrink-0 text-[10px] font-medium"
        style={{ color: PRIORITY_COLORS[task.priority] }}
      >
        {PRIORITY_LABELS[task.priority]}
      </span>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 cursor-pointer"
        aria-label="Excluir tarefa"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function TodayRecurringRow({ task }: { task: RecurringTask }) {
  const completeRecurring = useRoutineStore((s) => s.completeRecurring)
  const deleteRecurring = useRoutineStore((s) => s.deleteRecurring)

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40">
      <button
        type="button"
        onClick={() => completeRecurring(task.id)}
        className="shrink-0 text-muted-foreground transition-colors hover:text-primary cursor-pointer"
        aria-label="Concluir ocorrência da rotina"
      >
        <Circle size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          <Repeat size={11} className="mr-1 inline" />
          Próxima ocorrência: {formatDateShort(task.nextDue)}
          {task.time ? ` · ${task.time}` : ''}
        </p>
      </div>
      <span
        className="shrink-0 text-[10px] font-medium"
        style={{ color: PRIORITY_COLORS[task.priority] }}
      >
        {PRIORITY_LABELS[task.priority]}
      </span>
      <button
        type="button"
        onClick={() => deleteRecurring(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 cursor-pointer"
        aria-label="Excluir recorrência"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function RoutineTodayDialog({
  open,
  onClose,
  onAddTask,
}: {
  open: boolean
  onClose: () => void
  onAddTask: () => void
}) {
  const tasks = useRoutineStore((s) => s.tasks)
  const recurringTasks = useRoutineStore((s) => s.recurringTasks)
  const today = todayStr()
  const todayTasks = tasks.filter((task) => task.date === today)
  const dueRecurring = recurringTasks.filter((task) => task.active && task.nextDue <= today)
  const doneCount = todayTasks.filter((task) => task.done).length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        title="Tarefas de hoje"
        description="Sua rotina para hoje, com tarefas únicas e recorrências."
        className="max-w-xl"
      >
        <div className="flex flex-col gap-5">
          <section>
            <div className="mb-2 flex items-center justify-between px-3">
              <h2 className="text-sm font-medium">Tarefas marcadas</h2>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {doneCount}/{todayTasks.length} feitas
              </span>
            </div>
            <div className="space-y-0.5">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => <TodayTaskRow key={task.id} task={task} />)
              ) : (
                <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa marcada para hoje.
                </p>
              )}
            </div>
          </section>

          <section className="border-t border-border/40 pt-4">
            <div className="mb-2 flex items-center justify-between px-3">
              <h2 className="text-sm font-medium">Recorrências de hoje</h2>
              <span className="text-[11px] tabular-nums text-muted-foreground">{dueRecurring.length}</span>
            </div>
            <div className="space-y-0.5">
              {dueRecurring.length > 0 ? (
                dueRecurring.map((task) => <TodayRecurringRow key={task.id} task={task} />)
              ) : (
                <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                  Nenhuma recorrência pendente hoje.
                </p>
              )}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-border/40 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Fechar
            </Button>
            <Button onClick={onAddTask} className="rounded-xl shadow-md">
              Nova tarefa
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
