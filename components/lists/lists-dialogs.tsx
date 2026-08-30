'use client'

import { getListKindMeta, LIST_KINDS } from '@/lib/lists'
import type { PresetCombo, PresetItem } from '@/lib/lists'
import type { UserListPreset } from '@/lib/types'
import { useListsStore } from '@/lib/store/use-lists-store'
import type { ShoppingListKind } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Package, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { ListKindIcon } from './list-kind-icon'

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
  const addItem = useListsStore((s) => s.addItem)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ShoppingListKind>('custom')
  const [color, setColor] = useState(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])

  // Lista personalizada: itens definidos já na criação ("lista pré-pronta")
  const [draftItems, setDraftItems] = useState<string[]>([])
  const [draftItemName, setDraftItemName] = useState('')

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
    if (isCustomKind && draftItems.length === 0 && !draftItemName.trim()) {
      toast({ title: 'Adicione pelo menos um item à lista personalizada', variant: 'error' })
      return
    }
    // Se o usuário digitou um item e não tocou em "Adicionar", inclui mesmo assim
    const finalDraftItems =
      isCustomKind && draftItemName.trim() ? [...draftItems, draftItemName.trim()] : draftItems
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
      <DialogContent title="Nova lista" description="Compras, tarefas, viagem ou o que precisar.">
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
          {isCustomKind && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">O que vai ter na lista?</label>
              <div className="flex gap-2">
                <Input
                  value={draftItemName}
                  onChange={(e) => setDraftItemName(e.target.value)}
                  placeholder="Ex: Trocar lâmpada, Pagar conta..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDraftItem()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl shrink-0"
                  onClick={handleAddDraftItem}
                >
                  Adicionar
                </Button>
              </div>
              {draftItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {draftItems.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs"
                    >
                      {item}
                      <button
                        type="button"
                        aria-label={`Remover ${item}`}
                        onClick={() => handleRemoveDraftItem(index)}
                        className="inline-flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Esses itens já vêm prontos na sua lista — depois você pode completar ou remover o que quiser.
              </p>
            </div>
          )}
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
  const list = useListsStore((s) => s.lists.find((l) => l.id === listId))
  const addItem = useListsStore((s) => s.addItem)
  const getAllCategories = useListsStore((s) => s.getAllCategories)
  const userPresets = useListsStore((s) => s.userPresets)
  const addPreset = useListsStore((s) => s.addPreset)
  const deletePreset = useListsStore((s) => s.deletePreset)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [dosage, setDosage] = useState('')
  const [packed, setPacked] = useState(false)
  const [notes, setNotes] = useState('')

  // Cadastro de "pronto para usar" (supermercado) e confirmação de mala
  const [presetFormOpen, setPresetFormOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetQuantity, setPresetQuantity] = useState('')
  const [presetCategory, setPresetCategory] = useState('')
  const [pendingPacked, setPendingPacked] = useState<
    { type: 'item'; preset: PresetItem } | { type: 'combo'; combo: PresetCombo } | null
  >(null)

  const kindMeta = getListKindMeta(list?.kind)
  const isFarmacia = kindMeta.kind === 'farmacia'
  const isMala = kindMeta.kind === 'mala'
  const isMercado = kindMeta.kind === 'supermercado'
  const existingCategories = getAllCategories()
  const categorySuggestions = [...new Set([...kindMeta.presetCategories, ...existingCategories])]

  const presetGroups = new Map<string, PresetItem[]>()
  const builtinPresets: PresetItem[] = isMercado
    ? userPresets.filter((p) => p.kind === 'supermercado')
    : kindMeta.presetItems
  builtinPresets.forEach((p) => {
    const cat = p.category ?? 'Outros'
    const arr = presetGroups.get(cat) ?? []
    arr.push(p)
    presetGroups.set(cat, arr)
  })

  const existingNames = new Set((list?.items ?? []).map((i) => i.name.trim().toLowerCase()))

  const reset = () => {
    setName('')
    setQuantity('')
    setCategory('')
    setDosage('')
    setPacked(false)
    setNotes('')
    setPresetFormOpen(false)
    setPresetName('')
    setPresetQuantity('')
    setPresetCategory('')
    setPendingPacked(null)
  }

  const closePendingPacked = () => setPendingPacked(null)

  const commitPackedItem = (item: PresetItem, alreadyPacked = false) => {
    addItem(listId, {
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      dosage: isFarmacia ? item.dosage : undefined,
      packed: isMala ? alreadyPacked : undefined,
    })
    toast({
      title: alreadyPacked
        ? `"${item.name}" já está na mala.`
        : `"${item.name}" adicionado à lista para colocar na mala.`,
      variant: 'success',
    })
    closePendingPacked()
  }

  const commitPackedCombo = (combo: PresetCombo, alreadyPacked = false) => {
    const missing = combo.items.filter((p) => !existingNames.has(p.name.trim().toLowerCase()))
    missing.forEach((p) =>
      addItem(listId, {
        name: p.name,
        quantity: p.quantity,
        category: p.category,
        dosage: isFarmacia ? p.dosage : undefined,
        packed: isMala ? alreadyPacked : undefined,
      }),
    )
    toast({
      title: alreadyPacked
        ? `${combo.label}: itens marcados como já colocados na mala.`
        : `${combo.label}: ${missing.length} itens adicionados!`,
      variant: 'success',
    })
    closePendingPacked()
  }

  const handleAddPreset = (preset: PresetItem) => {
    if (isMala) {
      setPendingPacked({ type: 'item', preset })
      return
    }
    addItem(listId, {
      name: preset.name,
      quantity: preset.quantity,
      category: preset.category,
      dosage: isFarmacia ? preset.dosage : undefined,
    })
    toast({ title: `${preset.name} adicionado à lista!`, variant: 'success' })
  }

  const handleAddCombo = (combo: PresetCombo) => {
    if (isMala) {
      setPendingPacked({ type: 'combo', combo })
      return
    }
    commitPackedCombo(combo)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({ title: 'Digite o nome do item', variant: 'error' })
      return
    }
    addPreset({
      kind: 'supermercado',
      name: presetName.trim(),
      quantity: presetQuantity.trim() || undefined,
      category: presetCategory.trim() || undefined,
    })
    toast({ title: 'Item pronto salvo!', variant: 'success' })
    setPresetName('')
    setPresetQuantity('')
    setPresetCategory('')
    setPresetFormOpen(false)
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
      dosage: isFarmacia ? dosage.trim() || undefined : undefined,
      packed: isMala ? packed : undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Item adicionado!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo item" description={kindMeta.description}>
        <div className="flex flex-col gap-4">
          {(presetGroups.size > 0 || kindMeta.combos.length > 0 || isMercado) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Prontos para usar
                </p>
                {isMercado && (
                  <button
                    type="button"
                    onClick={() => setPresetFormOpen((o) => !o)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <Plus size={12} />
                    Cadastrar item pronto
                  </button>
                )}
              </div>

              {isMercado && presetFormOpen && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 space-y-2 mb-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Cadastrar novo item pronto
                  </p>
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Ex: Detergente Ypê"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={presetQuantity}
                      onChange={(e) => setPresetQuantity(e.target.value)}
                      placeholder="Quantidade (opcional)"
                    />
                    <Input
                      value={presetCategory}
                      onChange={(e) => setPresetCategory(e.target.value)}
                      placeholder="Categoria (opcional)"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setPresetFormOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" className="rounded-lg" onClick={handleSavePreset}>
                      Salvar pronto
                    </Button>
                  </div>
                </div>
              )}

              {pendingPacked && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 mb-3 space-y-1.5">
                  <p className="text-sm font-medium">
                    {pendingPacked.type === 'item'
                      ? `Já colocou "${pendingPacked.preset.name}" na mala?`
                      : `Já colocou tudo de "${pendingPacked.combo.label}" na mala?`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isMala
                      ? 'Se não estiver na mala, adiciono à lista de lembretes.'
                      : 'Confirme antes de adicionar.'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="rounded-lg"
                      variant="default"
                      onClick={() => {
                        if (pendingPacked.type === 'item') commitPackedItem(pendingPacked.preset, false)
                        else commitPackedCombo(pendingPacked.combo, false)
                      }}
                    >
                      Não
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      variant="outline"
                      onClick={() => {
                        if (pendingPacked.type === 'item') commitPackedItem(pendingPacked.preset, true)
                        else commitPackedCombo(pendingPacked.combo, true)
                      }}
                    >
                      Sim
                    </Button>
                  </div>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto rounded-xl border border-border/50 p-2.5 space-y-3">
                {presetGroups.size === 0 && isMercado && (
                  <p className="text-xs text-muted-foreground px-1">
                    Nenhum item pronto cadastrado. Toque em "Cadastrar item pronto" para criar o seu.
                  </p>
                )}
                {kindMeta.combos.length > 0 && (
                  <div className="space-y-1.5">
                    {kindMeta.combos.map((combo) => {
                      const missing = combo.items.filter(
                        (p) => !existingNames.has(p.name.trim().toLowerCase()),
                      ).length
                      const done = missing === 0
                      return (
                        <button
                          key={combo.id}
                          type="button"
                          disabled={done}
                          onClick={() => handleAddCombo(combo)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer',
                            done
                              ? 'border-transparent bg-muted/50 text-muted-foreground/50'
                              : 'border-border/60 hover:border-primary/50 hover:bg-primary/5',
                          )}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Package
                              size={14}
                              className={cn('shrink-0', done ? '' : 'text-muted-foreground')}
                            />
                            <span className="text-xs font-medium truncate">{combo.label}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {done ? 'Tudo já na lista' : `+${missing} itens`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {presetGroups.size > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isMercado ? 'Seus itens prontos — toque para adicionar' : 'Sugestões avulsas — toque para adicionar'}
                    </p>
                    {[...presetGroups.entries()].map(([cat, presets]) => (
                      <div key={cat}>
                        <p className="text-[10px] text-muted-foreground/70 mb-1">{cat}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {presets.map((p) => {
                            const added = existingNames.has(p.name.trim().toLowerCase())
                            const presetId = (p as UserListPreset).id
                            return (
                              <span key={p.name} className="relative inline-flex">
                                <button
                                  type="button"
                                  disabled={added}
                                  onClick={() => handleAddPreset(p)}
                                  className={cn(
                                    'rounded-full border pl-2.5 text-xs transition-all cursor-pointer',
                                    added
                                      ? 'border-transparent bg-muted/50 text-muted-foreground/50 line-through cursor-default'
                                      : 'border-border/60 text-foreground hover:border-primary/50 hover:bg-primary/5',
                                    presetId ? 'pr-1.5 py-1' : 'pr-2.5 py-1',
                                  )}
                                >
                                  {p.name}
                                  {p.quantity && (
                                    <span className="text-muted-foreground/60 ml-1">{p.quantity}</span>
                                  )}
                                </button>
                                {presetId && (
                                  <button
                                    type="button"
                                    title="Remover pronto"
                                    aria-label="Remover pronto"
                                    onClick={() => deletePreset(presetId)}
                                    className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
                    {categorySuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              {isFarmacia && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dosagem / posologia</label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 1 comprimido ao dia"
                  />
                </div>
              )}
              {isMala && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Já colocou na mala?</label>
                  <button
                    type="button"
                    onClick={() => setPacked(!packed)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer',
                      packed
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                        : 'border-border/60 text-muted-foreground hover:border-foreground/30',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-md border transition-colors',
                        packed ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40',
                      )}
                    >
                      {packed && <Check size={11} strokeWidth={3} className="text-white" />}
                    </span>
                    {packed ? 'Está na mala' : 'Ainda não'}
                  </button>
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
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
