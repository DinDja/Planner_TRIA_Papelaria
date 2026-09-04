'use client'

import { useJournalStore } from '@/lib/store/use-journal-store'
import { EMOTION_CONFIG, ENTRY_COLORS, TIME_OF_DAY_CONFIG, type JournalEmotion, type JournalEntry, type MoodSnapshot, type JournalTimeOfDay } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Feather, Hand, Moon, Pencil, Sparkles, Sun, Trash2, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { HandwritingCanvas, DrawingPreview } from './handwriting-canvas'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge, Input } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import { toast } from '../ui/toaster'

const TIME_OPTIONS: { value: JournalTimeOfDay; label: string; icon: typeof Sun | typeof Moon }[] = [
  { value: 'morning', label: 'Manhã', icon: Sun },
  { value: 'afternoon', label: 'Tarde', icon: Zap },
  { value: 'evening', label: 'Noite', icon: Sparkles },
  { value: 'night', label: 'Noite', icon: Moon },
]

const ALL_EMOTIONS: JournalEmotion[] = [
  'excited', 'happy', 'calm', 'grateful', 'inspired',
  'anxious', 'sad', 'tired', 'frustrated', 'stressed',
  'confused', 'hopeful', 'neutral',
]

function EmotionPicker({
  selected,
  onChange,
}: {
  selected: JournalEmotion[]
  onChange: (emotions: JournalEmotion[]) => void
}) {
  const toggle = (e: JournalEmotion) => {
    if (selected.includes(e)) {
      onChange(selected.filter((x) => x !== e))
    } else if (selected.length < 3) {
      onChange([...selected, e])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_EMOTIONS.map((emotion) => {
        const config = EMOTION_CONFIG[emotion]
        const isSelected = selected.includes(emotion)
        return (
          <button
            key={emotion}
            type="button"
            onClick={() => toggle(emotion)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
              isSelected
                ? 'border-transparent shadow-sm'
                : 'border-border/60 hover:border-border',
            )}
            style={isSelected ? { backgroundColor: config.color, color: '#fff' } : {}}
          >
            <span>{config.emoji}</span>
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

function EnergyPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [1, 2, 3, 4, 5]
  const labels = ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto']

  return (
    <div className="flex items-center gap-2">
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={cn(
            'size-10 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer',
            value === level ? 'border-transparent' : 'border-border/60 hover:border-primary/40',
          )}
          style={value === level ? { backgroundColor: level <= 2 ? '#d1bdb8' : level <= 3 ? '#b76f06' : '#6a634d' } : {}}
          title={labels[level - 1]}
        >
          <div
            className="w-2 rounded-full"
            style={{
              height: `${8 + level * 4}px`,
              backgroundColor: value === level ? '#fff' : 'var(--muted-foreground)',
            }}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-2">{labels[value - 1]}</span>
    </div>
  )
}

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

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const t = input.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    onChange([...tags, t])
    setInput('')
  }

  const remove = (t: string) => onChange(tags.filter((x) => x !== t))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Adicionar tag..."
          className="h-9 rounded-xl"
        />
        <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={add}>Adicionar</Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="outline" className="gap-1 pr-1.5">
              #{t}
              <button onClick={() => remove(t)} className="cursor-pointer hover:text-destructive ml-0.5">
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function AddEntryDialog({
  open,
  onClose,
  defaultDate,
  defaultPrompt,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultPrompt?: string
}) {
  const addEntry = useJournalStore((s) => s.addEntry)

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayISO())
  const [timeOfDay, setTimeOfDay] = useState<JournalTimeOfDay>('morning')
  const [emotions, setEmotions] = useState<JournalEmotion[]>([])
  const [energy, setEnergy] = useState<number>(3)
  const [moodNote, setMoodNote] = useState('')
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [color, setColor] = useState(ENTRY_COLORS[0])
  const [drawing, setDrawing] = useState<JournalEntry['drawing']>([])

  const reset = () => {
    setStep(1)
    setTitle('')
    setContent('')
    setDate(defaultDate ?? todayISO())
    setTimeOfDay('morning')
    setEmotions([])
    setEnergy(3)
    setMoodNote('')
    setPrompt(defaultPrompt ?? '')
    setTags([])
    setColor(ENTRY_COLORS[Math.floor(Math.random() * ENTRY_COLORS.length)])
    setDrawing([])
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

    const mood: MoodSnapshot = {
      emotions,
      energy: energy as 1 | 2 | 3 | 4 | 5,
      note: moodNote.trim() || undefined,
    }

    addEntry({ title: title.trim(), content: content.trim(), date, timeOfDay, mood, prompt: prompt.trim() || undefined, tags, color, drawing: drawing.length > 0 ? drawing : undefined })
    toast({ title: 'Entrada salva com carinho!', variant: 'success' })
    handleClose()
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const steps = [
    { num: 1, label: 'Humor' },
    { num: 2, label: 'Escr' },
    { num: 3, label: 'Detalhe' },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Nova entrada</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {steps.map((s) => (
                <button
                  key={s.num}
                  onClick={() => step > s.num && setStep(s.num)}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-all',
                    step === s.num ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5">
            {steps.map((s) => (
              <div
                key={s.num}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: step >= s.num ? color : 'var(--muted)' }}
              />
            ))}
          </div>

          {/* Step 1: Mood */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  Como você está se sentindo?
                </label>
                <EmotionPicker selected={emotions} onChange={setEmotions} />
                {emotions.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Selecione até 3 emoções</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nível de energia
                </label>
                <EnergyPicker value={energy} onChange={setEnergy} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Algo a mais sobre seu humor?</label>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Ex: Estou ansioso mas empolgado com o projeto novo..."
                  rows={2}
                  className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 resize-none"
                />
              </div>

              <Button className="w-full rounded-xl" style={{ backgroundColor: color }} onClick={() => setStep(2)}>
                Continuar
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          {/* Step 2: Writing */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
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
                <label className="text-sm font-medium mb-1.5 block">Horário do dia</label>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimeOfDay(opt.value)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                        timeOfDay === opt.value
                          ? 'border-transparent text-white'
                          : 'border-border/60 hover:bg-muted',
                      )}
                      style={timeOfDay === opt.value ? { backgroundColor: color } : {}}
                    >
                      <opt.icon size={14} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {prompt && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Feather size={10} />
                    Prompt do dia
                  </p>
                  <p className="text-sm italic">"{prompt}"</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Sua escrita</label>
                  {wordCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">{wordCount} palavras</span>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva livremente... Sem julgamentos, apenas você."
                  rows={8}
                  className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} />
                  Voltar
                </Button>
                <Button className="flex-1 rounded-xl" style={{ backgroundColor: color }} onClick={() => setStep(3)}>
                  Detalhes
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="text-sm font-medium mb-2 block">Cor da entrada</label>
                <ColorPicker value={color} onChange={setColor} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {/* Handwriting */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg py-1">
                  <Hand size={15} />
                  Escrita à mão
                  {drawing && drawing.length > 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {drawing.length} traços
                    </span>
                  )}
                </summary>
                <div className="mt-2">
                  <HandwritingCanvas strokes={drawing ?? []} onChange={setDrawing} />
                </div>
              </details>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} />
                  Voltar
                </Button>
                <Button className="flex-1 rounded-xl shadow-md" style={{ backgroundColor: color }} onClick={handleCreate}>
                  Salvar entrada
                </Button>
              </div>
            </div>
          )}
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
  const [emotions, setEmotions] = useState<JournalEmotion[]>([])
  const [energy, setEnergy] = useState<number>(3)
  const [moodNote, setMoodNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [color, setColor] = useState('')
  const [drawing, setDrawing] = useState<JournalEntry['drawing']>([])

  const handleOpenChange = (o: boolean) => {
    if (!o) { setEditing(false); onClose() }
  }

  const startEdit = () => {
    if (!entry) return
    setTitle(entry.title)
    setContent(entry.content)
    setEmotions(entry.mood.emotions)
    setEnergy(entry.mood.energy)
    setMoodNote(entry.mood.note ?? '')
    setTags(entry.tags)
    setColor(entry.color)
    setDrawing(entry.drawing ?? [])
    setEditing(true)
  }

  const handleSave = () => {
    if (!entry) return
    const mood: MoodSnapshot = {
      emotions,
      energy: energy as 1 | 2 | 3 | 4 | 5,
      note: moodNote.trim() || undefined,
    }
    updateEntry(entry.id, { title: title.trim(), content: content.trim(), mood, tags, color, drawing: drawing?.length ? drawing : undefined })
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
              <label className="text-sm font-medium mb-2 block">Emoções</label>
              <EmotionPicker selected={emotions} onChange={setEmotions} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Energia</label>
              <EnergyPicker value={energy} onChange={setEnergy} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Nota sobre humor</label>
              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                rows={2}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Conteúdo</label>
                <span className="text-[10px] text-muted-foreground">{wordCount} palavras</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                <Hand size={14} />
                Escrita à mão
              </label>
              <HandwritingCanvas strokes={drawing ?? []} onChange={setDrawing} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl shadow-md" style={{ backgroundColor: color }} onClick={handleSave}>
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