'use client'

import { useListsStore } from '@/lib/store/use-lists-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const LIST_COLORS = ['#7bb686', '#5b8dbf', '#f0b429', '#e8a0a0', '#c9b6e4', '#f5c8a0']

function ColorPicker({
  value,
  onChange,
  colors,
}: {
  value: string
  onChange: (c: string) => void
  colors: string[]
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

export function AddListDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addList = useListsStore((s) => s.addList)
  const [name, setName] = useState('')
  const [color, setColor] = useState(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])

  const reset = () => {
    setName('')
    setColor(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para a lista', variant: 'error' })
      return
    }
    addList({ name: name.trim(), color })
    toast({ title: 'Lista criada!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova lista" description="Lista de compras, tarefas ou o que precisar.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supermercado, Farmácia..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <ColorPicker value={color} onChange={setColor} colors={LIST_COLORS} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Criar lista
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddItemDialog({
  open,
  onClose,
  listId,
}: {
  open: boolean
  onClose: () => void
  listId: string
}) {
  const addItem = useListsStore((s) => s.addItem)
  const getAllCategories = useListsStore((s) => s.getAllCategories)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const existingCategories = getAllCategories()

  const reset = () => {
    setName('')
    setQuantity('')
    setCategory('')
    setNotes('')
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite o nome do item', variant: 'error' })
      return
    }
    addItem(listId, {
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Item adicionado!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo item" description="Adicione um item à lista.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arroz, Leite..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Quantidade</label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 2kg, 6 un..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Categoria</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Grãos"
                list="item-categories"
              />
              <datalist id="item-categories">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
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
