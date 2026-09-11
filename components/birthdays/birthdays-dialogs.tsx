'use client'

import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
import { BIRTHDAY_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input, Textarea } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { ReminderButton } from '../notifications/reminder-button'

function formatBirthdayInput(value: string) {
  const [, month, day] = value.split('-')
  return month && day ? `${day}/${month}` : ''
}

function maskBirthdayInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function toStoredBirthdayDate(value: string, year: number) {
  const [day, month] = value.split('/').map(Number)
  const candidate = new Date(2000, month - 1, day)
  if (!day || !month || candidate.getDate() !== day || candidate.getMonth() !== month - 1) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function AddBirthdayDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addEntry = useBirthdaysStore((s) => s.addEntry)
  const updateEntry = useBirthdaysStore((s) => s.updateEntry)
  const existing = useBirthdaysStore((s) => editId ? s.entries.find((e) => e.id === editId) : undefined)
  const [name, setName] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(BIRTHDAY_COLORS[0])
  const [reminderEnabled, setReminderEnabled] = useState(false)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setDateInput(formatBirthdayInput(existing.date))
      setNotes(existing.notes ?? '')
      setColor(existing.color)
      setReminderEnabled(existing.reminderEnabled === true)
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const reset = () => {
    setName('')
    setDateInput('')
    setNotes('')
    setColor(BIRTHDAY_COLORS[0])
    setReminderEnabled(false)
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Digite o nome', variant: 'error' })
      return
    }
    const existingYear = existing?.date.split('-')[0]
    const date = toStoredBirthdayDate(dateInput, Number(existingYear) || new Date().getFullYear())
    if (!date) {
      toast({ title: 'Informe a data de aniversário', variant: 'error' })
      return
    }
    const data = { name: name.trim(), date, notes: notes.trim() || undefined, color, reminderEnabled }
    if (editId) {
      updateEntry(editId, data)
      toast({ title: 'Aniversário atualizado!', variant: 'success' })
    } else {
      addEntry(data)
      toast({ title: 'Aniversário adicionado!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar aniversário' : 'Novo aniversário'} description="Não deixe passar a data de quem você gosta.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria, João..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Data de aniversário</label>
            <Input
              type="text"
              inputMode="numeric"
              value={dateInput}
              onChange={(e) => setDateInput(maskBirthdayInput(e.target.value))}
              placeholder="DD/MM"
              maxLength={5}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {BIRTHDAY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-8 rounded-full transition-all cursor-pointer inline-flex items-center justify-center',
                    color === c ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          <ReminderButton
            enabled={reminderEnabled}
            onEnabledChange={setReminderEnabled}
            description="Avisar anualmente na data do aniversário"
          />
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">
              {editId ? 'Salvar' : 'Criar lembrete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
