'use client'

import { useQuotesStore } from '@/lib/store/use-quotes-store'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const COLORS = ['#d1bdb8', '#b76f06', '#6a634d', '#ddd6c6']

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
          {value === c && <Check size={12} strokeWidth={3} className="text-white drop-shadow-sm" />}
        </button>
      ))}
    </div>
  )
}

export function AddQuoteDialog({
  open,
  onClose,
  editId,
}: {
  open: boolean
  onClose: () => void
  editId?: string
}) {
  const addQuote = useQuotesStore((s) => s.addQuote)
  const updateQuote = useQuotesStore((s) => s.updateQuote)
  const existing = useQuotesStore((s) => editId ? s.quotes.find((q) => q.id === editId) : undefined)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)])

  useEffect(() => {
    if (!open) return
    if (existing) {
      setText(existing.text)
      setAuthor(existing.author ?? '')
      setTags(existing.tags)
      setTagInput('')
      setColor(existing.color)
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const reset = () => {
    setText('')
    setAuthor('')
    setTags([])
    setTagInput('')
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  const handleCreate = () => {
    if (!text.trim()) {
      toast({ title: 'Digite uma frase', variant: 'error' })
      return
    }
    const data = {
      text: text.trim(),
      author: author.trim() || undefined,
      tags,
      color,
    }
    if (editId) {
      updateQuote(editId, data)
      toast({ title: 'Frase atualizada!', variant: 'success' })
    } else {
      addQuote(data)
      toast({ title: 'Frase salva!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar frase' : 'Nova frase'} description="Salve uma frase que te inspira.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Frase</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite a frase..."
              rows={3}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Autor (opcional)</label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ex: Albert Einstein"
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
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
