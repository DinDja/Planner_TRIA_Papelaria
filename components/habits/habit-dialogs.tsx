'use client'

import { useHabitsStore } from '@/lib/store/use-habits-store'
import type { HabitFrequency, Weekday } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0', '#d4b070']
const WEEKDAY_SHORT: Record<Weekday, string> = { 0: 'Seg', 1: 'Ter', 2: 'Qua', 3: 'Qui', 4: 'Sex', 5: 'Sáb', 6: 'Dom' }

export function AddHabitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addHabit = useHabitsStore((s) => s.addHabit)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [weekdays, setWeekdays] = useState<Weekday[]>([0, 1, 2, 3, 4])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [color, setColor] = useState(COLORS[2])

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
    addHabit({
      name: name.trim(),
      frequency,
      weekdays: frequency === 'weekly' ? weekdays : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      color,
    })
    toast({ title: 'Hábito criado!', variant: 'success' })
    setName('')
    setFrequency('daily')
    setWeekdays([0, 1, 2, 3, 4])
    setDayOfMonth(1)
    setColor(COLORS[2])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo hábito" description="Defina um hábito para acompanhar diariamente.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Beber 2L de água..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Frequência</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFrequency(f)}
                  className={cn('flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                    frequency === f ? 'border-primary/50 bg-primary/10 text-primary shadow-sm' : 'border-border/60 text-muted-foreground hover:bg-muted/50')}>
                  {f === 'daily' ? 'Diária' : f === 'weekly' ? 'Semanal' : 'Mensal'}
                </button>
              ))}
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

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Criar hábito</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
