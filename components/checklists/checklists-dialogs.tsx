'use client'

import { useChecklistsStore } from '@/lib/store/use-checklists-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0']

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'size-7 rounded-full transition-all duration-200 cursor-pointer inline-flex items-center justify-center',
            value === c
              ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover'
              : 'hover:scale-110 hover:shadow-md',
          )}
          style={{ backgroundColor: c }}
        >
          {value === c && (
            <Check size={12} strokeWidth={3} className="text-white drop-shadow-sm" />
          )}
        </button>
      ))}
    </div>
  )
}

export function AddChecklistDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addChecklist = useChecklistsStore((s) => s.addChecklist)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)])

  const reset = () => {
    setTitle('')
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para o checklist', variant: 'error' })
      return
    }
    addChecklist({ title: title.trim(), color })
    toast({ title: 'Checklist criado!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo checklist" description="Uma lista de verificação para organizar seus passos.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Preparativos para viagem..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar checklist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
