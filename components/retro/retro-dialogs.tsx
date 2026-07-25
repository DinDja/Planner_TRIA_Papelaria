'use client'

import { useRetroStore } from '@/lib/store/use-retro-store'
import type { RetrospectiveMood, RetrospectiveType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { MoodPicker as MoodPickerUI, type MoodId } from '@/components/icons/mood'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const TYPE_LABELS: Record<RetrospectiveType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// `RetrospectiveMood` da base legado tem casal grato para com `MoodId` do novo
// sistema; fazemos o cast aqui para o componente UI funcionar sem migrar tipos.
function MoodPicker({
  value,
  onChange,
}: {
  value: RetrospectiveMood
  onChange: (m: RetrospectiveMood) => void
}) {
  return (
    <MoodPickerUI
      value={value as MoodId}
      onChange={(v) => onChange(v as RetrospectiveMood)}
    />
  )
}

export function AddRetroDialog({
  open,
  onClose,
  defaultType,
}: {
  open: boolean
  onClose: () => void
  defaultType?: RetrospectiveType
}) {
  const addEntry = useRetroStore((s) => s.addEntry)
  const [type, setType] = useState<RetrospectiveType>(defaultType ?? 'daily')
  const [date, setDate] = useState(dayStr())
  const [mood, setMood] = useState<RetrospectiveMood>('good')
  const [wentWell, setWentWell] = useState<string[]>([''])
  const [toImprove, setToImprove] = useState<string[]>([''])
  const [notes, setNotes] = useState('')

  const reset = () => {
    setType(defaultType ?? 'daily')
    setDate(dayStr())
    setMood('good')
    setWentWell([''])
    setToImprove([''])
    setNotes('')
  }

  const handleAddItem = (list: string[], setter: (v: string[]) => void) => {
    setter([...list, ''])
  }

  const handleItemChange = (list: string[], idx: number, val: string, setter: (v: string[]) => void) => {
    const next = [...list]
    next[idx] = val
    setter(next)
  }

  const handleRemoveItem = (list: string[], idx: number, setter: (v: string[]) => void) => {
    if (list.length <= 1) return
    setter(list.filter((_, i) => i !== idx))
  }

  const handleCreate = () => {
    const filteredWell = wentWell.map((s) => s.trim()).filter(Boolean)
    const filteredImprove = toImprove.map((s) => s.trim()).filter(Boolean)

    if (filteredWell.length === 0 && filteredImprove.length === 0) {
      toast({ title: 'Adicione ao menos um item em "O que foi bem" ou "O que melhorar"', variant: 'error' })
      return
    }

    addEntry({
      type,
      date,
      mood,
      wentWell: filteredWell,
      toImprove: filteredImprove,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Retrospectiva registrada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova retrospectiva" description="Reflita sobre seu período.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
                    type === t
                      ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Humor</label>
            <MoodPicker value={mood} onChange={setMood} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">O que foi bem</label>
            <div className="space-y-2">
              {wentWell.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(wentWell, i, e.target.value, setWentWell)}
                    placeholder="Ex: Entreguei a feature X"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveItem(wentWell, i, setWentWell)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-1 rounded-xl text-xs" onClick={() => handleAddItem(wentWell, setWentWell)}>
              + Adicionar item
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">O que melhorar</label>
            <div className="space-y-2">
              {toImprove.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(toImprove, i, e.target.value, setToImprove)}
                    placeholder="Ex: Reduzir tempo de tela"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveItem(toImprove, i, setToImprove)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-1 rounded-xl text-xs" onClick={() => handleAddItem(toImprove, setToImprove)}>
              + Adicionar item
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações gerais..."
              rows={3}
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
