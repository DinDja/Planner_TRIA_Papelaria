'use client'

import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const EVENT_COLORS = [
  '#e05b6d', '#e8a0a0', '#f0b429', '#7bb686',
  '#5b8dbf', '#a5c8e4', '#c9b6e4', '#d4b070',
]

export function CalendarEventDialog({
  open,
  onClose,
  defaultDate,
  editId,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: string
  editId?: string
}) {
  const events = useCalendarStore((s) => s.events)
  const addEvent = useCalendarStore((s) => s.addEvent)
  const updateEvent = useCalendarStore((s) => s.updateEvent)
  const deleteEvent = useCalendarStore((s) => s.deleteEvent)

  const existing = editId ? events.find((e) => e.id === editId) : null

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState(EVENT_COLORS[4])
  const [notes, setNotes] = useState('')

  // Sincroniza os campos sempre que o modal abre ou muda entre criar/editar
  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setTitle(existing.title ?? '')
      setDate(existing.date ?? '')
      setStartTime(existing.startTime ?? '')
      setEndTime(existing.endTime ?? '')
      setAllDay(existing.allDay ?? false)
      setColor(existing.color ?? EVENT_COLORS[4])
      setNotes(existing.notes ?? '')
    } else {
      setTitle('')
      setDate(defaultDate ?? '')
      setStartTime('')
      setEndTime('')
      setAllDay(false)
      setColor(EVENT_COLORS[4])
      setNotes('')
    }
  }, [open, editId, defaultDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setTitle('')
    setDate(defaultDate ?? '')
    setStartTime('')
    setEndTime('')
    setAllDay(false)
    setColor(EVENT_COLORS[4])
    setNotes('')
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para o evento', variant: 'error' })
      return
    }
    if (!date) {
      toast({ title: 'Selecione uma data', variant: 'error' })
      return
    }

    if (editId && existing) {
      updateEvent(editId, {
        title: title.trim(),
        date,
        startTime,
        endTime: endTime || undefined,
        allDay,
        color,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Evento atualizado!', variant: 'success' })
    } else {
      addEvent({
        title: title.trim(),
        date,
        startTime,
        endTime: endTime || undefined,
        allDay,
        color,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Evento criado!', variant: 'success' })
    }
    reset()
    onClose()
  }

  const handleDelete = () => {
    if (editId) {
      deleteEvent(editId)
      toast({ title: 'Evento excluído', variant: 'success' })
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar evento' : 'Novo evento'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião, Consulta, Aniversário..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Horário / All-day */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllDay(!allDay)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                allDay
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted/50',
              )}
            >
              Dia inteiro
            </button>
            {!allDay && (
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Início</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
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

          {/* Notas */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione detalhes sobre o evento..."
              rows={2}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
            />
          </div>

          <div className={cn('flex gap-2 pt-1', editId ? 'justify-between' : 'justify-end')}>
            {editId && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-xl"
              >
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="rounded-xl shadow-md">
                {editId ? 'Salvar' : 'Criar evento'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
