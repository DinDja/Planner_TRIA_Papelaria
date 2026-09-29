'use client'

import { useHabitsStore } from '@/lib/store/use-habits-store'
import type { HabitReminderIntervalUnit, HabitFrequency, Weekday } from '@/lib/types'
import { cn } from '@/lib/utils'
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
const DEFAULT_REFERENCE_MONTH = new Date().getMonth() + 1

export function AddHabitDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addHabit = useHabitsStore((s) => s.addHabit)
  const updateHabit = useHabitsStore((s) => s.updateHabit)
  const existing = useHabitsStore((s) => editId ? s.habits.find((h) => h.id === editId) : undefined)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [weekdays, setWeekdays] = useState<Weekday[]>([])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [referenceMonth, setReferenceMonth] = useState(DEFAULT_REFERENCE_MONTH)
  const [reminderTime, setReminderTime] = useState(DEFAULT_HABIT_TIME)
  const [reminderIntervalValue, setReminderIntervalValue] = useState('0')
  const [reminderIntervalUnit, setReminderIntervalUnit] = useState<HabitReminderIntervalUnit>('hours')
  const [color, setColor] = useState(COLORS[2])
  const [reminderEnabled, setReminderEnabled] = useState(false)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setFrequency(existing.frequency)
      setWeekdays(existing.weekdays ?? [])
      setDayOfMonth(existing.dayOfMonth ?? 1)
      setReferenceMonth(existing.referenceMonth ?? DEFAULT_REFERENCE_MONTH)
      setReminderTime(existing.reminderTime ?? DEFAULT_HABIT_TIME)
      const intervalMinutes = existing.reminderIntervalMinutes
      if (typeof intervalMinutes === 'number' && intervalMinutes >= 0) {
        if (intervalMinutes % 60 === 0) {
          setReminderIntervalValue(String(intervalMinutes / 60))
          setReminderIntervalUnit('hours')
        } else {
          setReminderIntervalValue(String(intervalMinutes))
          setReminderIntervalUnit('minutes')
        }
      } else {
        setReminderIntervalValue(String(existing.reminderIntervalHours ?? 0))
        setReminderIntervalUnit('hours')
      }
      setColor(existing.color)
      setReminderEnabled(existing.reminderEnabled === true)
    } else if (!editId) {
      setName('')
      setFrequency('daily')
      setWeekdays([])
      setDayOfMonth(1)
      setReferenceMonth(DEFAULT_REFERENCE_MONTH)
      setReminderTime(DEFAULT_HABIT_TIME)
      setReminderIntervalValue('0')
      setReminderIntervalUnit('hours')
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
    const intervalValue = Number(reminderIntervalValue)
    const intervalMinutes = reminderIntervalUnit === 'hours' ? intervalValue * 60 : intervalValue
    if (!Number.isSafeInteger(intervalMinutes) || intervalMinutes < 0) {
      toast({ title: 'Informe um intervalo inteiro igual ou maior que zero', variant: 'error' })
      return
    }
    const data = {
      name: name.trim(),
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      referenceMonth: frequency === 'monthly' ? referenceMonth : undefined,
      reminderTime,
      reminderIntervalMinutes: intervalMinutes,
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
    setWeekdays([])
    setDayOfMonth(1)
    setReferenceMonth(DEFAULT_REFERENCE_MONTH)
    setReminderTime(DEFAULT_HABIT_TIME)
    setReminderIntervalValue('0')
    setReminderIntervalUnit('hours')
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
              <label className="text-sm font-medium mb-1.5 block">Data de referência</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="mb-1 block text-xs text-muted-foreground">Dia</span>
                  <Input type="number" min={1} max={31} value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))} />
                </div>
                <div>
                  <span className="mb-1 block text-xs text-muted-foreground">Mês</span>
                  <Input type="number" min={1} max={12} value={referenceMonth}
                    onChange={(e) => setReferenceMonth(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3">
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
              <label className="text-sm font-medium mb-1.5 block">Intervalo dos avisos</label>
              <div className="flex h-9 min-w-0 w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={reminderIntervalValue}
                  onChange={(e) => setReminderIntervalValue(e.target.value)}
                  className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none [appearance:textfield] focus-visible:border-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label={`Intervalo entre os avisos em ${reminderIntervalUnit === 'hours' ? 'horas' : 'minutos'}`}
                />
                <div className="flex shrink-0 border-l border-border/60 bg-muted/30">
                  {(['minutes', 'hours'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setReminderIntervalUnit(unit)}
                      className={cn(
                        'h-full min-w-9 px-2 text-xs font-semibold transition-colors cursor-pointer',
                        reminderIntervalUnit === unit ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {unit === 'hours' ? 'h' : 'min'}
                    </button>
                  ))}
                </div>
              </div>
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
