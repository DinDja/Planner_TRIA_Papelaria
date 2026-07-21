'use client'

import { useMemoriesStore } from '@/lib/store/use-memories-store'
import type { MemoryMood } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Angry, Frown, Meh, Smile, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const MOOD_OPTIONS: { value: MemoryMood; label: string; icon: typeof Smile; color: string }[] = [
  { value: 'great', label: 'Incrível', icon: Sparkles, color: '#7bb686' },
  { value: 'good', label: 'Bom', icon: Smile, color: '#5b8dbf' },
  { value: 'neutral', label: 'Neutro', icon: Meh, color: '#f0b429' },
  { value: 'bad', label: 'Ruim', icon: Frown, color: '#e8a0a0' },
  { value: 'tough', label: 'Difícil', icon: Angry, color: '#e05b6d' },
]

const dayStr = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function MoodPicker({
  value,
  onChange,
}: {
  value: MemoryMood
  onChange: (m: MemoryMood) => void
}) {
  return (
    <div className="flex gap-2">
      {MOOD_OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 rounded-xl border px-2 py-3 text-[10px] font-medium transition-all duration-200 cursor-pointer',
              active
                ? 'border-transparent shadow-md text-white'
                : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
            style={active ? { backgroundColor: opt.color } : undefined}
          >
            <opt.icon
              size={20}
              className={active ? 'text-white' : ''}
              style={!active ? { color: opt.color } : undefined}
            />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function AddMemoryDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addEntry = useMemoriesStore((s) => s.addEntry)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(dayStr())
  const [mood, setMood] = useState<MemoryMood>('great')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const reset = () => {
    setTitle('')
    setDescription('')
    setDate(dayStr())
    setMood('great')
    setTags([])
    setTagInput('')
  }

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
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
    addEntry({ title: title.trim(), description: description.trim(), date, mood, tags })
    toast({ title: 'Memória registrada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova memória" description="Registre um momento especial para lembrar sempre.">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sentimento</label>
              <MoodPicker value={mood} onChange={setMood} />
            </div>
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
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Digite e Enter"
              />
              <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer hover:text-destructive">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
