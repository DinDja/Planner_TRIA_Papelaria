'use client'

import { useWishlistStore } from '@/lib/store/use-wishlist-store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
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
  editId,
}: {
  open: boolean
  onClose: () => void
  editId?: string
}) {
  const addItem = useWishlistStore((s) => s.addItem)
  const updateItem = useWishlistStore((s) => s.updateItem)
  const existing = useWishlistStore((s) => editId ? s.items.find((i) => i.id === editId) : undefined)
  const getAllCategories = useWishlistStore((s) => s.getAllCategories)
  const [name, setName] = useState('')
  const [store, setStore] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const existingCategories = getAllCategories()

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setStore(existing.store ?? '')
      setUrl(existing.url ?? '')
      setPrice(existing.price == null ? '' : String(existing.price / 100))
      setPriority(existing.priority)
      setCategory(existing.category ?? '')
      setNotes(existing.notes ?? '')
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const reset = () => {
    setName('')
    setStore('')
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
    const data = {
      name: name.trim(),
      store: store.trim() || undefined,
      url: url.trim() || undefined,
      price: price ? Math.round(parseFloat(price.replace(',', '.')) * 100) : undefined,
      priority,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateItem(editId, data)
      toast({ title: 'Desejo atualizado!', variant: 'success' })
    } else {
      addItem(data)
      toast({ title: 'Desejo adicionado!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar desejo' : 'Novo desejo'} description="Adicione algo que você deseja.">
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
            <label className="text-sm font-medium mb-1.5 block">Loja</label>
            <Input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Ex: Americanas, loja do bairro..."
            />
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
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              {editId ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
