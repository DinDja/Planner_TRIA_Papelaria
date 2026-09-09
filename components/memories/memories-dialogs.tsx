'use client'

import { useMemoriesStore } from '@/lib/store/use-memories-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const dayStr = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AddMemoryDialog({
  open,
  onClose,
  editId,
}: {
  open: boolean
  onClose: () => void
  editId?: string
}) {
  const addEntry = useMemoriesStore((s) => s.addEntry)
  const updateEntry = useMemoriesStore((s) => s.updateEntry)
  const existing = useMemoriesStore((s) => editId ? s.entries.find((e) => e.id === editId) : undefined)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(dayStr())

  useEffect(() => {
    if (!open) return
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setDate(existing.date)
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const reset = () => {
    setTitle('')
    setDescription('')
    setDate(dayStr())
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Dê um título à memória', variant: 'error' })
      return
    }
    if (!description.trim()) {
      toast({ title: 'Descreva essa memória', variant: 'error' })
      return
    }
    if (editId) {
      updateEntry(editId, {
        title: title.trim(),
        description: description.trim(),
        date,
      })
      toast({ title: 'Memória atualizada!', variant: 'success' })
    } else {
      addEntry({
        title: title.trim(),
        description: description.trim(),
        date,
        mood: 'great',
      })
      toast({ title: 'Memória registrada!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar memória' : 'Nova memória'} description="Registre um momento especial para lembrar sempre.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aquele dia inesquecível..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que aconteceu? Como você se sentiu?"
              rows={4}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
