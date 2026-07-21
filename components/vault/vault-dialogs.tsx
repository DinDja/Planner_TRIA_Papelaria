'use client'

import { usePasswordsStore } from '@/lib/store/use-passwords-store'
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
          {value === c && <Check size={12} strokeWidth={3} className="text-white drop-shadow-sm" />}
        </button>
      ))}
    </div>
  )
}

export function AddPasswordDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addEntry = usePasswordsStore((s) => s.addEntry)
  const getAllCategories = usePasswordsStore((s) => s.getAllCategories)
  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)])
  const existingCategories = getAllCategories()

  const reset = () => {
    setTitle('')
    setUsername('')
    setPassword('')
    setUrl('')
    setCategory('')
    setNotes('')
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Digite um título', variant: 'error' })
      return
    }
    if (!password.trim()) {
      toast({ title: 'Digite a senha', variant: 'error' })
      return
    }
    addEntry({
      title: title.trim(),
      username: username.trim() || undefined,
      password: password.trim(),
      url: url.trim() || undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      color,
    })
    toast({ title: 'Senha salva!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova senha" description="Salve suas credenciais com segurança.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Email, Banco..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Categoria</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Email, Streaming"
                list="pwd-categories"
              />
              <datalist id="pwd-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Usuário</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="email@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">URL (opcional)</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
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
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
