'use client'

import { getListKindMeta, LIST_KINDS } from '@/lib/lists'
import type { PresetCombo, PresetItem } from '@/lib/lists'
import { useListsStore } from '@/lib/store/use-lists-store'
import type { ShoppingListKind } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, Package } from 'lucide-react'
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
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ShoppingListKind>('custom')
  const [color, setColor] = useState(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])

  const handleSelectKind = (nextKind: ShoppingListKind) => {
    setKind(nextKind)
    const meta = getListKindMeta(nextKind)
    if (meta.defaultColor) setColor(meta.defaultColor)
  }

  const reset = () => {
    setName('')
    setKind('custom')
    setColor(LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)])
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para a lista', variant: 'error' })
      return
    }
    addList({ name: name.trim(), color, kind })
    toast({ title: 'Lista criada!', variant: 'success' })
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
  const addPresetFromList = useListsStore((s) => s.addPresetFromList)
  const presets = useListsStore((s) => s.presets)
  const deletePreset = useListsStore((s) => s.deletePreset)
  const getAllCategories = useListsStore((s) => s.getAllCategories)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [dosage, setDosage] = useState('')
  const [packed, setPacked] = useState(false)
  const [notes, setNotes] = useState('')
  const [pendingMalaSelection, setPendingMalaSelection] = useState<{
    label: string
    items: PresetItem[]
  } | null>(null)

  const kindMeta = getListKindMeta(list?.kind)
  const isFarmacia = kindMeta.kind === 'farmacia'
  const isMala = kindMeta.kind === 'mala'
  const isUserPresetCategory = kindMeta.kind === 'supermercado' || kindMeta.kind === 'mala'
  const userPresets = presets.filter((preset) => preset.kind === kindMeta.kind)
  const existingCategories = getAllCategories()
  const categorySuggestions = [...new Set([...kindMeta.presetCategories, ...existingCategories])]

  const presetGroups = new Map<string, PresetItem[]>()
  kindMeta.presetItems.forEach((p) => {
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
  }

  const handleAddPreset = (preset: PresetItem) => {
    if (isMala) {
      setPendingMalaSelection({ label: preset.name, items: [preset] })
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
      const missing = combo.items.filter((p) => !existingNames.has(p.name.trim().toLowerCase()))
      if (missing.length > 0) setPendingMalaSelection({ label: combo.label, items: missing })
      return
    }
    const missing = combo.items.filter((p) => !existingNames.has(p.name.trim().toLowerCase()))
    if (missing.length === 0) return
    missing.forEach((p) =>
      addItem(listId, {
        name: p.name,
        quantity: p.quantity,
        category: p.category,
        dosage: isFarmacia ? p.dosage : undefined,
      }),
    )
    toast({
      title: `${combo.label}: ${missing.length} itens adicionados!`,
      variant: 'success',
    })
  }

  const handleAddUserPreset = (presetId: string) => {
    const preset = userPresets.find((item) => item.id === presetId)
    if (!preset) return
    const existingNames = new Set((list?.items ?? []).map((item) => item.name.trim().toLowerCase()))
    const missing = preset.items.filter((item) => !existingNames.has(item.name.trim().toLowerCase()))
    if (missing.length === 0) {
      toast({ title: 'Todos os produtos já estão nesta lista.', variant: 'error' })
      return
    }
    missing.forEach((item) =>
      addItem(listId, {
        ...item,
        packed: isMala ? false : undefined,
      }),
    )
    toast({ title: `${missing.length} produtos adicionados à lista!`, variant: 'success' })
  }

  const handleSaveAsPreset = () => {
    if (!list || list.items.length === 0) {
      toast({ title: 'Adicione produtos antes de salvar a lista pronta.', variant: 'error' })
      return
    }
    addPresetFromList(listId)
    toast({ title: 'Lista salva como pronta para usar!', variant: 'success' })
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
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo item" description={kindMeta.description}>
        <div className="flex flex-col gap-4">
          {!isUserPresetCategory && (presetGroups.size > 0 || kindMeta.combos.length > 0) && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Prontos para Usar
              </p>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border/50 p-2.5 space-y-3">
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
                      Sugestões avulsas — toque para adicionar
                    </p>
                    {[...presetGroups.entries()].map(([cat, presets]) => (
                      <div key={cat}>
                        <p className="text-[10px] text-muted-foreground/70 mb-1">{cat}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {presets.map((p) => {
                            const added = existingNames.has(p.name.trim().toLowerCase())
                            return (
                              <button
                                key={p.name}
                                type="button"
                                disabled={added}
                                onClick={() => handleAddPreset(p)}
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-xs transition-all cursor-pointer',
                                  added
                                    ? 'border-transparent bg-muted/50 text-muted-foreground/50 line-through cursor-default'
                                    : 'border-border/60 text-foreground hover:border-primary/50 hover:bg-primary/5',
                                )}
                              >
                                {p.name}
                                {p.quantity && (
                                  <span className="text-muted-foreground/60 ml-1">{p.quantity}</span>
                                )}
                              </button>
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
          {isUserPresetCategory && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <div className="mb-2">
                <p className="text-sm font-medium">Prontos para Usar</p>
                <p className="text-[11px] text-muted-foreground">
                  Monte uma lista uma vez e reutilize quando precisar.
                </p>
              </div>
              {userPresets.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {userPresets.map((preset) => (
                    <div key={preset.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddUserPreset(preset.id)}
                        className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-left text-xs transition-all cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="truncate font-medium">{preset.name}</span>
                        <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                          {preset.items.length} itens
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePreset(preset.id)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {userPresets.length === 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Ainda não há listas salvas. Adicione produtos e salve a sua primeira lista pronta.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsPreset}
                disabled={!list || list.items.length === 0}
                className="w-full rounded-xl text-xs"
              >
                Salvar lista atual como pronta
              </Button>
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

      <Dialog
      open={pendingMalaSelection !== null}
      onOpenChange={(open) => !open && setPendingMalaSelection(null)}
    >
      <DialogContent title="Já colocou na mala?" description={pendingMalaSelection?.label}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Escolha uma opção para registrar o que falta antes da viagem.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                pendingMalaSelection?.items.forEach((item) =>
                  addItem(listId, {
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category,
                    dosage: item.dosage,
                    packed: true,
                  }),
                )
                setPendingMalaSelection(null)
                toast({ title: 'Item marcado como colocado na mala!', variant: 'success' })
              }}
              className="rounded-xl"
            >
              Sim
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                pendingMalaSelection?.items.forEach((item) =>
                  addItem(listId, {
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category,
                    dosage: item.dosage,
                    packed: false,
                  }),
                )
                setPendingMalaSelection(null)
                toast({ title: 'Item adicionado à lista para lembrar depois.', variant: 'success' })
              }}
              className="rounded-xl"
            >
              Não
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
