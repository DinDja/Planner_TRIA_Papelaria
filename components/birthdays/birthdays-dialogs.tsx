'use client'

import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
import { BIRTHDAY_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

export function AddBirthdayDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addEntry = useBirthdaysStore((s) => s.addEntry)
  const updateEntry = useBirthdaysStore((s) => s.updateEntry)
  const existing = useBirthdaysStore((s) => editId ? s.entries.find((e) => e.id === editId) : undefined)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(BIRTHDAY_COLORS[0])

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setDate(existing.date)
      setNotes(existing.notes ?? '')
      setColor(existing.color)
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const reset = () => {
    setName('')
    setDate('')
    setNotes('')
    setColor(BIRTHDAY_COLORS[0])
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Digite o nome', variant: 'error' })
      return
    }
    if (!date) {
      toast({ title: 'Informe a data de aniversário', variant: 'error' })
      return
    }
    const data = { name: name.trim(), date, notes: notes.trim() || undefined, color }
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
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: presente que ela quer..." />
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
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
