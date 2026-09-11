'use client'

import { useJournalStore } from '@/lib/store/use-journal-store'
import { EMOTION_CONFIG, ENTRY_COLORS, TIME_OF_DAY_CONFIG, type JournalEmotion, type JournalEntry, type MoodSnapshot } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Feather, Hand, Pencil, Pin, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DrawingPreview } from './handwriting-canvas'
import { Button } from '../ui/button'
import { Badge, Input } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import { toast } from '../ui/toaster'

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {ENTRY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'size-7 rounded-full border-2 transition-all cursor-pointer',
            value === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
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
  const [color, setColor] = useState(ENTRY_COLORS[0])

  const reset = () => {
    setTitle('')
    setContent('')
    setDate(defaultDate ?? todayISO())
    setColor(ENTRY_COLORS[Math.floor(Math.random() * ENTRY_COLORS.length)])
  }

  const handleClose = () => { reset(); onClose() }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Dê um título à sua entrada', variant: 'error' })
      return
    }
    if (!content.trim()) {
      toast({ title: 'Escreva algo antes de salvar', variant: 'error' })
      return
    }

    const mood: MoodSnapshot = { emotions: [], energy: 3 }
    addEntry({ title: title.trim(), content: content.trim(), date, mood, color })
    toast({ title: 'Entrada salva com carinho!', variant: 'success' })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reflexões do fim de tarde"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Escrita</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva livremente..."
              rows={9}
              className="flex w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 whitespace-pre-wrap break-words"
              autoFocus={false}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">Salvar entrada</Button>
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
  const deleteEntry = useJournalStore((s) => s.deleteEntry)
  const togglePin = useJournalStore((s) => s.togglePin)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('')

  const handleOpenChange = (o: boolean) => {
    if (!o) { setEditing(false); onClose() }
  }

  const startEdit = () => {
    if (!entry) return
    setTitle(entry.title)
    setContent(entry.content)
    setColor(entry.color)
    setEditing(true)
  }

  const handleSave = () => {
    if (!entry) return
    updateEntry(entry.id, { title: title.trim(), content: content.trim(), color })
    toast({ title: 'Entrada atualizada!', variant: 'success' })
    setEditing(false)
    onClose()
  }

  const handleDelete = () => {
    if (!entry) return
    deleteEntry(entry.id)
    toast({ title: 'Entrada removida', variant: 'success' })
    onClose()
  }

  const handlePin = () => {
    if (!entry) return
    togglePin(entry.id)
  }

  if (!entry) return null

  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length
  const lines = entry.content.split('\n').filter(Boolean)
  const timeConfig = TIME_OF_DAY_CONFIG[entry.timeOfDay]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Conteúdo</label>
                <span className="text-[10px] text-muted-foreground">{wordCount} palavras</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={9}
                className="flex w-full resize-y whitespace-pre-wrap break-words rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl shadow-md" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className="size-12 rounded-xl shrink-0 flex items-center justify-center text-xl"
                  style={{ backgroundColor: entry.color + '25' }}
                >
                  {timeConfig.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold leading-tight">{entry.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{timeConfig.label}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{wordCount} palavras</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handlePin}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors cursor-pointer',
                    entry.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  <Pin size={15} className={entry.pinned ? 'fill-primary' : ''} />
                </button>
                <button
                  onClick={startEdit}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Mood */}
            <div className="flex flex-wrap items-center gap-2">
              {entry.mood.emotions.map((e) => (
                <EmotionBadge key={e} emotion={e} size="lg" />
              ))}
              <EnergyIndicatorSimple level={entry.mood.energy} />
            </div>

            {entry.mood.note && (
              <p className="text-sm text-muted-foreground/80 italic bg-muted/30 rounded-xl p-3">
                "{entry.mood.note}"
              </p>
            )}

            {/* Prompt */}
            {entry.prompt && (
              <div className="rounded-xl bg-gradient-to-r from-primary/5 to-transparent p-3 border-l-4" style={{ borderColor: entry.color }}>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Feather size={10} />
                  Reflexão do dia
                </p>
                <p className="text-sm italic">"{entry.prompt}"</p>
              </div>
            )}

            {/* Content */}
            <div className="rounded-xl bg-muted/20 p-4">
              {lines.map((line, i) => (
                line.trim() ? (
                  <p key={i} className="text-sm text-foreground/85 leading-relaxed mb-1">{line}</p>
                ) : <div key={i} className="h-2" />
              ))}
            </div>

            {/* Drawing */}
            {entry.drawing && entry.drawing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Hand size={12} />
                  Escrita à mão
                </p>
                <DrawingPreview strokes={entry.drawing} />
              </div>
            )}

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <Badge key={t} variant="outline">#{t}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EmotionBadge({ emotion, size = 'sm' }: { emotion: JournalEmotion; size?: 'sm' | 'lg' }) {
  const config = EMOTION_CONFIG[emotion]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
      )}
      style={{ backgroundColor: config.color + '25', color: config.color }}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  )
}

function EnergyIndicatorSimple({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <span className="text-[10px] text-muted-foreground">energia</span>
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className="w-1.5 rounded-full"
          style={{
            height: `${6 + bar * 2}px`,
            backgroundColor: bar <= level
              ? level <= 2 ? '#d1bdb8' : level <= 3 ? '#b76f06' : '#6a634d'
              : 'var(--muted)',
          }}
        />
      ))}
    </div>
  )
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
