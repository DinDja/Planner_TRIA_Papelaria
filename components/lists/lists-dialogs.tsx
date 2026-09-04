'use client'

import { getListKindMeta, LIST_KINDS } from '@/lib/lists'
import { useListsStore } from '@/lib/store/use-lists-store'
import type { ShoppingListKind } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { ListKindIcon } from './list-kind-icon'

const LIST_COLORS = ['#d1bdb8', '#b76f06', '#6a634d', '#ddd6c6']

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
  editId,
}: {
  open: boolean
  onClose: () => void
  editId?: string
}) {
  const addList = useListsStore((s) => s.addList)
  const updateList = useListsStore((s) => s.updateList)
  const addItem = useListsStore((s) => s.addItem)
  const existing = useListsStore((s) => editId ? s.lists.find((l) => l.id === editId) : undefined)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ShoppingListKind>('custom')
  const [color, setColor] = useState(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])

  // Lista personalizada: itens definidos já na criação ("lista pré-pronta")
  const [draftItems, setDraftItems] = useState<string[]>([])
  const [draftItemName, setDraftItemName] = useState('')

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setKind(existing.kind ?? 'custom')
      setColor(existing.color)
      setDraftItems([])
      setDraftItemName('')
    } else if (!editId) {
      reset()
    }
  }, [open, editId, existing])

  const isCustomKind = kind === 'custom'

  const handleAddDraftItem = () => {
    const value = draftItemName.trim()
    if (!value) return
    if (draftItems.some((i) => i.toLowerCase() === value.toLowerCase())) {
      toast({ title: 'Esse item já foi adicionado', variant: 'error' })
      return
    }
    setDraftItems((prev) => [...prev, value])
    setDraftItemName('')
  }

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSelectKind = (nextKind: ShoppingListKind) => {
    setKind(nextKind)
    const meta = getListKindMeta(nextKind)
    if (meta.defaultColor) setColor(meta.defaultColor)
  }

  const reset = () => {
    setName('')
    setKind('custom')
    setColor(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])
    setDraftItems([])
    setDraftItemName('')
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para a lista', variant: 'error' })
      return
    }
    // Se o usuário digitou um item e não tocou em "Adicionar", inclui mesmo assim
    const finalDraftItems =
      isCustomKind && draftItemName.trim() ? [...draftItems, draftItemName.trim()] : draftItems
    if (editId) {
      updateList(editId, { name: name.trim(), color, kind })
      toast({ title: 'Lista atualizada!', variant: 'success' })
      reset()
      onClose()
      return
    }
    const listId = addList({ name: name.trim(), color, kind })
    finalDraftItems.forEach((itemName) => addItem(listId, { name: itemName }))
    toast({
      title: finalDraftItems.length > 0
        ? `Lista criada com ${finalDraftItems.length} itens!`
        : 'Lista criada!',
      variant: 'success',
    })
    reset()
    onClose()
  }

  return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar lista' : 'Nova lista'} description="Compras, tarefas, viagem ou o que precisar.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de lista</label>
            <div className="grid grid-cols-2 gap-2">
              {LIST_KINDS.map((meta) => {
                const active = kind === meta.kind
                return (
                  <button
                    key={meta.kind}
                    type="button"
                    onClick={() => handleSelectKind(meta.kind)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all cursor-pointer',
                      active
                        ? 'border-foreground/50 bg-muted/40 ring-2 ring-foreground/10'
                        : 'border-border/60 hover:border-foreground/30 hover:bg-muted/20',
                    )}
                  >
                    <ListKindIcon kind={meta.kind} size={16} color={meta.defaultColor} />
                    <span className="text-sm font-medium leading-tight">{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {meta.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Compra da semana, Testes de sangue..."
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
              {editId ? 'Salvar alterações' : 'Criar lista'}
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
  itemId,
}: {
  open: boolean
  onClose: () => void
  listId: string
  itemId?: string
}) {
  const list = useListsStore((s) => s.lists.find((l) => l.id === listId))
  const addItem = useListsStore((s) => s.addItem)
  const updateItem = useListsStore((s) => s.updateItem)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [dosage, setDosage] = useState('')
  const [packed, setPacked] = useState(false)
  const [notes, setNotes] = useState('')

  const existingItem = list?.items.find((item) => item.id === itemId)

  useEffect(() => {
    if (!open) return
    if (existingItem) {
      setName(existingItem.name)
      setQuantity(existingItem.quantity ?? '')
      setCategory(existingItem.category ?? '')
      setDosage(existingItem.dosage ?? '')
      setPacked(existingItem.packed ?? false)
      setNotes(existingItem.notes ?? '')
    } else if (!itemId) {
      reset()
    }
  }, [open, itemId, existingItem])

  const kindMeta = getListKindMeta(list?.kind)
  const isFarmacia = kindMeta.kind === 'farmacia'
  const isMala = kindMeta.kind === 'mala'
  // Categorias já usadas nesta lista (não de todas as listas do usuário)
  const listCategories = new Set(
    (list?.items ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)),
  )
  const categorySuggestions = [...new Set([...kindMeta.presetCategories, ...listCategories])]
    .sort((a, b) => {
      const aOutros = a.toLowerCase() === 'outros'
      const bOutros = b.toLowerCase() === 'outros'
      if (aOutros && !bOutros) return 1
      if (!aOutros && bOutros) return -1
      return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    })

  const reset = () => {
    setName('')
    setQuantity('')
    setCategory('')
    setDosage('')
    setPacked(false)
    setNotes('')
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite o nome do item', variant: 'error' })
      return
    }
    const data = {
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      category: category.trim() || undefined,
      dosage: isFarmacia ? dosage.trim() || undefined : undefined,
      packed: isMala ? packed : undefined,
      notes: notes.trim() || undefined,
    }
    if (itemId) {
      updateItem(listId, itemId, data)
      toast({ title: 'Item atualizado!', variant: 'success' })
    } else {
      addItem(listId, data)
      toast({ title: 'Item adicionado!', variant: 'success' })
    }
    reset()
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={itemId ? 'Editar item' : 'Novo item'} description={kindMeta.description}>
        <div className="flex flex-col gap-4">
          <div className="border-t border-border/50 pt-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Item personalizado
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Categoria</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="item-categories"
                  />
                  <datalist id="item-categories">
                    {categorySuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              {isFarmacia && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dosagem</label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
              )}
              {isMala && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Já colocou na mala?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-pressed={packed}
                      onClick={() => setPacked(true)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer',
                        packed
                          ? 'border-success/50 bg-success/10 text-success'
                          : 'border-border/60 text-muted-foreground hover:border-foreground/30',
                      )}
                    >
                      {packed && <Check size={14} strokeWidth={2.5} />}
                      Sim
                    </button>
                    <button
                      type="button"
                      aria-pressed={!packed}
                      onClick={() => setPacked(false)}
                      className={cn(
                        'flex min-w-16 items-center justify-center rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer',
                        !packed
                          ? 'border-foreground/50 bg-muted/60 text-foreground'
                          : 'border-border/60 text-muted-foreground hover:border-foreground/30',
                      )}
                    >
                      Não
                    </button>
                  </div>
                </div>
              )}
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
                  {itemId ? 'Salvar alterações' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
