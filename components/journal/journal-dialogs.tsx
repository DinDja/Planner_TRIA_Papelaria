'use client'

import { useJournalStore } from '@/lib/store/use-journal-store'
import type { JournalEntry, JournalMood, Stroke } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Angry, Frown, Hand, Meh, Pencil, Smile, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { HandwritingCanvas, DrawingPreview } from './handwriting-canvas'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const MOOD_OPTIONS: { value: JournalMood; label: string; icon: typeof Smile; color: string }[] = [
  { value: 'great', label: 'Excelente', icon: Sparkles, color: '#7bb686' },
  { value: 'good', label: 'Bom', icon: Smile, color: '#5b8dbf' },
  { value: 'neutral', label: 'Neutro', icon: Meh, color: '#f0b429' },
  { value: 'bad', label: 'Ruim', icon: Frown, color: '#e8a0a0' },
  { value: 'tough', label: 'Difícil', icon: Angry, color: '#e05b6d' },
]

const todayISO = (): string => {
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
  value: JournalMood | undefined
  onChange: (m: JournalMood | undefined) => void
}) {
  return (
    <div className="flex gap-2">
      {MOOD_OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? undefined : opt.value)}
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

export function AddEntryDialog({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: string
}) {
  const addEntry = useJournalStore((s) => s.addEntry)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayISO())
  const [mood, setMood] = useState<JournalMood | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [drawing, setDrawing] = useState<Stroke[]>([])

  const reset = () => {
    setTitle('')
    setContent('')
    setDate(defaultDate ?? todayISO())
    setMood(undefined)
    setTags([])
    setTagInput('')
    setDrawing([])
  }

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para a entrada', variant: 'error' })
      return
    }
    if (!content.trim()) {
      toast({ title: 'Escreva algo no conteúdo', variant: 'error' })
      return
    }
    addEntry({ title: title.trim(), content: content.trim(), date, mood, tags, drawing: drawing.length > 0 ? drawing : undefined })
    toast({ title: 'Entrada do diário salva!', variant: 'success' })
    reset()
    onClose()
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova entrada" description="Registre seus pensamentos do dia.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meu dia hoje..."
              onKeyDown={(e) => e.key === 'Enter' && e.shiftKey && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Humor (opcional)</label>
            <MoodPicker value={mood} onChange={setMood} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Conteúdo</label>
              {content.trim() && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que aconteceu hoje? Como você se sente?"
              rows={6}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite e pressione Enter"
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl shrink-0"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
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
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="cursor-pointer hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Escrita à mão */}
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg py-1">
              <Hand size={15} />
              Escrita à mão
              {drawing.length > 0 && (
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                  {drawing.length} {drawing.length === 1 ? 'traço' : 'traços'}
                </span>
              )}
            </summary>
            <div className="mt-2">
              <HandwritingCanvas strokes={drawing} onChange={setDrawing} />
            </div>
          </details>

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

export function ViewEntryDialog({
  entry,
  open,
  onClose,
}: {
  entry: JournalEntry | null
  open: boolean
  onClose: () => void
}) {
  const updateEntry = useJournalStore((s) => s.updateEntry)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [mood, setMood] = useState<JournalMood | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [drawing, setDrawing] = useState<Stroke[]>([])

  const handleOpenChange = (o: boolean) => {
    if (!o) { setEditing(false); onClose() }
  }

  const startEdit = () => {
    if (!entry) return
    setTitle(entry.title)
    setContent(entry.content)
    setDate(entry.date)
    setMood(entry.mood)
    setTags(entry.tags)
    setDrawing(entry.drawing ?? [])
    setEditing(true)
  }

  const handleSave = () => {
    if (!entry || !title.trim()) return
    updateEntry(entry.id, {
      title: title.trim(),
      content: content.trim(),
      date,
      mood: mood ?? undefined,
      tags,
      drawing: drawing.length > 0 ? drawing : undefined,
    })
    toast({ title: 'Entrada atualizada!', variant: 'success' })
    setEditing(false)
    onClose()
  }

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  if (!entry) return null

  const moodConfig = entry.mood ? MOOD_OPTIONS.find((m) => m.value === entry.mood) : null
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length
  const charCount = entry.content.length
  const lines = entry.content.split('\n').filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title="" className="max-w-2xl">
        {editing ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Conteúdo</label>
                {content.trim() && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {content.trim().split(/\s+/).length} palavras
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                  placeholder="Nova tag"
                />
                <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={handleAddTag} disabled={!tagInput.trim()}>Adicionar</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium">
                      {t}
                      <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer hover:text-destructive"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Hand size={14} />
                Escrita à mão
              </label>
              <HandwritingCanvas strokes={drawing} onChange={setDrawing} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {moodConfig && (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: moodConfig.color + '18' }}>
                    <moodConfig.icon size={20} style={{ color: moodConfig.color }} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-tight">{entry.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>·</span>
                    <span>{wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}</span>
                    <span>·</span>
                    <span>{charCount} caracteres</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={startEdit}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[10px] font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-muted/30 p-4">
              {lines.map((line, i) => (
                line.trim() ? (
                  line.startsWith('- ') || line.startsWith('* ') ? (
                    <p key={i} className="text-sm text-foreground/80 leading-relaxed flex gap-2 ml-2">
                      <span className="text-muted-foreground/40">•</span>
                      <span>{line.slice(2)}</span>
                    </p>
                  ) : (
                    <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-1">{line}</p>
                  )
                ) : <div key={i} className="h-2" />
              ))}
            </div>

            {entry.drawing && entry.drawing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Hand size={12} />
                  Escrita à mão
                </p>
                <DrawingPreview strokes={entry.drawing} />
              </div>
            )}

            {entry.pinned && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                📌 Fixado no topo
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
