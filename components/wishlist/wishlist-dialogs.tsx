'use client'

import { useWishlistStore } from '@/lib/store/use-wishlist-store'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const PRIORITY_OPTIONS = [
  { value: 'high' as const, label: 'Alta', color: '#e05b6d' },
  { value: 'medium' as const, label: 'Média', color: '#f0b429' },
  { value: 'low' as const, label: 'Baixa', color: '#7bb686' },
]

export function AddWishDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addItem = useWishlistStore((s) => s.addItem)
  const getAllCategories = useWishlistStore((s) => s.getAllCategories)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const existingCategories = getAllCategories()

  const reset = () => {
    setName('')
    setUrl('')
    setPrice('')
    setPriority('medium')
    setCategory('')
    setNotes('')
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite o nome do desejo', variant: 'error' })
      return
    }
    addItem({
      name: name.trim(),
      url: url.trim() || undefined,
      price: price ? Math.round(parseFloat(price.replace(',', '.')) * 100) : undefined,
      priority,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Desejo adicionado!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo desejo" description="Adicione algo que você deseja.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kindle, Tênis, Curso..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 299,90"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Categoria</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Tecnologia"
                list="wish-categories"
              />
              <datalist id="wish-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
                    priority === opt.value
                      ? 'border-transparent text-white shadow-md'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                  style={priority === opt.value ? { backgroundColor: opt.color } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Link</label>
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
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
