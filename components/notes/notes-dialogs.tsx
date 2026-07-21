'use client'

import { useNotesStore } from '@/lib/store/use-notes-store'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const NOTE_COLORS = ['#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#f5c8a0']
const FOLDER_COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0', '#34a853', '#1a73e8']

function ColorPicker({
  value,
  onChange,
  colors = NOTE_COLORS,
}: {
  value: string
  onChange: (c: string) => void
  colors?: string[]
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c) => (
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

export function AddNoteDialog({
  open,
  onClose,
  defaultFolderId,
}: {
  open: boolean
  onClose: () => void
  defaultFolderId?: string | null
}) {
  const addNote = useNotesStore((s) => s.addNote)
  const folders = useNotesStore((s) => s.folders)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId ?? null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)])

  const reset = () => {
    setTitle('')
    setContent('')
    setFolderId(defaultFolderId ?? null)
    setTags([])
    setTagInput('')
    setColor(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)])
  }

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título para a nota', variant: 'error' })
      return
    }
    addNote({ title: title.trim(), content: content.trim(), folderId, tags, color })
    toast({ title: 'Nota criada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova nota" description="Crie uma nota para não esquecer.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              onKeyDown={(e) => e.key === 'Enter' && e.shiftKey && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui..."
              rows={5}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Pasta</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFolderId(null)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                  folderId === null
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                )}
              >
                Sem pasta
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFolderId(f.id)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
                    folderId === f.id
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: f.color }} />
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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

          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar nota
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddFolderDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addFolder = useNotesStore((s) => s.addFolder)
  const [name, setName] = useState('')
  const [color, setColor] = useState(FOLDER_COLORS[3])

  const reset = () => {
    setName('')
    setColor(FOLDER_COLORS[3])
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para a pasta', variant: 'error' })
      return
    }
    addFolder({ name: name.trim(), color })
    toast({ title: 'Pasta criada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova pasta" description="Organize suas notas em pastas.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pessoal, Trabalho, Estudos..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} colors={FOLDER_COLORS} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar pasta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
