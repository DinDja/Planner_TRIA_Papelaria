'use client'

import { useHabitsStore } from '@/lib/store/use-habits-store'
import type { HabitFrequency, Weekday } from '@/lib/types'
import { cn } from '@/lib/utils'
import { buildHabitReminderTimes } from '@/lib/notifications/reminders'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { ReminderButton } from '../notifications/reminder-button'

const COLORS = ['#d1bdb8', '#b76f06', '#6a634d', '#ddd6c6']
const WEEKDAY_SHORT: Record<Weekday, string> = { 0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom' }
const DEFAULT_HABIT_TIME = '08:00'

export function AddHabitDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addHabit = useHabitsStore((s) => s.addHabit)
  const updateHabit = useHabitsStore((s) => s.updateHabit)
  const existing = useHabitsStore((s) => editId ? s.habits.find((h) => h.id === editId) : undefined)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [weekdays, setWeekdays] = useState<Weekday[]>([0, 1, 2, 3, 4])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [reminderTime, setReminderTime] = useState(DEFAULT_HABIT_TIME)
  const [reminderIntervalHours, setReminderIntervalHours] = useState('1')
  const [color, setColor] = useState(COLORS[2])
  const [reminderEnabled, setReminderEnabled] = useState(false)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setFrequency(existing.frequency)
      setWeekdays(existing.weekdays ?? [0, 1, 2, 3, 4])
      setDayOfMonth(existing.dayOfMonth ?? 1)
      setReminderTime(existing.reminderTime ?? DEFAULT_HABIT_TIME)
      setReminderIntervalHours(String(existing.reminderIntervalHours ?? 1))
      setColor(existing.color)
      setReminderEnabled(existing.reminderEnabled === true)
    } else if (!editId) {
      setName('')
      setFrequency('daily')
      setWeekdays([0, 1, 2, 3, 4])
      setDayOfMonth(1)
      setReminderTime(DEFAULT_HABIT_TIME)
      setReminderIntervalHours('1')
      setColor(COLORS[2])
      setReminderEnabled(false)
    }
  }, [open, editId, existing])

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para o hábito', variant: 'error' })
      return
    }
    if (frequency === 'weekly' && weekdays.length === 0) {
      toast({ title: 'Escolha ao menos um dia da semana', variant: 'error' })
      return
    }
    if (!/^\d{2}:\d{2}$/.test(reminderTime)) {
      toast({ title: 'Informe um horário inicial válido', variant: 'error' })
      return
    }
    const intervalHours = Number(reminderIntervalHours)
    if (!Number.isInteger(intervalHours) || intervalHours < 1 || intervalHours > 24) {
      toast({ title: 'Escolha um intervalo entre 1 e 24 horas', variant: 'error' })
      return
    }
    const data = {
      name: name.trim(),
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      reminderTime,
      reminderIntervalHours: intervalHours,
      reminderEnabled,
      color,
    }
    if (editId) {
      updateHabit(editId, data)
      toast({ title: 'Hábito atualizado!', variant: 'success' })
    } else {
      addHabit(data)
      toast({ title: 'Hábito criado!', variant: 'success' })
    }
    setName('')
    setFrequency('daily')
    setWeekdays([0, 1, 2, 3, 4])
    setDayOfMonth(1)
    setReminderTime(DEFAULT_HABIT_TIME)
    setReminderIntervalHours('1')
    setColor(COLORS[2])
    setReminderEnabled(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar hábito' : 'Novo hábito'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Beber 2L de água" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Frequência</label>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={cn('flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all cursor-pointer',
                      frequency === f ? 'border-primary/50 bg-primary/10 text-primary shadow-sm' : 'border-border/60 text-muted-foreground hover:bg-muted/50')}>
                    {f === 'daily' ? 'Diária' : f === 'weekly' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Dias da semana</label>
              <div className="flex gap-1.5 flex-wrap">
                {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => (
                  <button key={d} type="button" onClick={() => toggleWeekday(d)}
                    className={cn('size-9 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center',
                      weekdays.includes(d) ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground')}>
                    {WEEKDAY_SHORT[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Dia do mês</label>
              <Input type="number" min={1} max={31} value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Horário inicial</label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                aria-label="Horário inicial dos avisos"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Intervalo</label>
              <select
                value={reminderIntervalHours}
                onChange={(e) => setReminderIntervalHours(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label="Intervalo entre os avisos"
              >
                {Array.from({ length: 24 }, (_, index) => {
                  const hours = index + 1
                  return <option key={hours} value={hours}>{`A cada ${hours} ${hours === 1 ? 'hora' : 'horas'}`}</option>
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('size-8 rounded-full transition-all cursor-pointer inline-flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover' : 'hover:scale-110')}
                  style={{ backgroundColor: c }}>
                  {color === c && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            Próximos avisos: {buildHabitReminderTimes(reminderTime, Number(reminderIntervalHours)).join(' · ')}
          </p>

          <ReminderButton
            enabled={reminderEnabled}
            onEnabledChange={setReminderEnabled}
            description="Avisar nos horários definidos para o hábito"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">{editId ? 'Salvar alterações' : 'Criar hábito'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
