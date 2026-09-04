'use client'

import { getListKindMeta } from '@/lib/lists'
import { useListsStore } from '@/lib/store/use-lists-store'
import type { ShoppingItem, ShoppingList } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  List,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input as SearchInput } from '../ui/primitives'
import { Dialog, DialogContent, Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { ListKindIcon } from './list-kind-icon'
import { AddItemDialog, AddListDialog } from './lists-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function ListCard({
  list,
  onEdit,
  onDelete,
  onDuplicate,
  onAddItem,
  onToggleItem,
  onSelectItem,
  onDeleteItem,
  onEditItem,
}: {
  list: ShoppingList
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onAddItem: (listId: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onSelectItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
  onEditItem: (listId: string, itemId: string) => void
}) {
  const isMala = getListKindMeta(list.kind).kind === 'mala'
  const checked = list.items.filter((i) => (isMala ? i.packed : i.checked)).length
  const total = list.items.length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0

  const grouped = list.items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <Card
      glass
      className="overflow-hidden"
      style={{
        borderTopColor: list.color,
        borderTopWidth: 3,
      }}
    >
      <CardHeader className="flex-row items-center justify-between pb-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: list.color + '18' }}
          >
            <ListKindIcon kind={list.kind} size={18} color={list.color} />
          </div>
          <div>
            <CardTitle className="text-base">{list.name}</CardTitle>
            {total > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {checked}/{total} itens
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums"
              style={{ color: progress === 100 ? '#6a634d' : 'var(--muted-foreground)' }}
            >
              {progress}%
            </div>
          )}
          <button
            onClick={() => onEdit(list.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            aria-label="Editar lista"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDuplicate(list.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            aria-label="Duplicar lista"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onDelete(list.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir lista"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </CardHeader>

      {total > 0 && (
        <div className="px-5 pt-0">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#6a634d' : list.color,
              }}
            />
          </div>
        </div>
      )}

      <CardContent className="pt-3">
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              {Object.keys(grouped).length > 1 && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {cat}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <button
                      onClick={() => (isMala
                        ? onSelectItem(list.id, item.id)
                        : onToggleItem(list.id, item.id))}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {(isMala ? item.packed : item.checked) ? (
                        <CheckCircle2 size={18} className="text-success" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          'text-sm',
                          (isMala ? item.packed : item.checked) && 'line-through text-muted-foreground',
                        )}
                      >
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          {item.quantity}
                        </span>
                      )}
                      {item.dosage && (
                        <span className="text-xs text-muted-foreground/70 ml-1.5">
                          • {item.dosage}
                        </span>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    {isMala && item.packed && (
                      <span className="shrink-0 text-[10px] font-medium text-success">
                        Na mala
                      </span>
                    )}
                    <button
                      onClick={() => onEditItem(list.id, item.id)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-primary transition-all cursor-pointer"
                      aria-label={`Editar ${item.name}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(list.id, item.id)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => onAddItem(list.id)}
        >
          <Plus size={13} />
          Adicionar item
        </Button>
      </CardContent>
    </Card>
  )
}

export function ListsPage() {
  const lists = useListsStore((s) => s.lists)
  const deleteList = useListsStore((s) => s.deleteList)
  const duplicateList = useListsStore((s) => s.duplicateList)
  const toggleItem = useListsStore((s) => s.toggleItem)
  const updateItem = useListsStore((s) => s.updateItem)
  const deleteItem = useListsStore((s) => s.deleteItem)

  const [tab, setTab] = useState('all')
  const [addListOpen, setAddListOpen] = useState(false)
  const [editListId, setEditListId] = useState<string | undefined>()
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addItemListId, setAddItemListId] = useState<string | null>(null)
  const [editItemId, setEditItemId] = useState<string | undefined>()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [malaSelection, setMalaSelection] = useState<{
    listId: string
    itemId: string
    itemName: string
  } | null>(null)

  const handleAddItem = (listId: string) => {
    setEditItemId(undefined)
    setAddItemListId(listId)
    setAddItemOpen(true)
  }

  const handleEditItem = (listId: string, itemId: string) => {
    setEditItemId(itemId)
    setAddItemListId(listId)
    setAddItemOpen(true)
  }

  const handleDeleteList = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleSelectItem = (listId: string, itemId: string) => {
    const list = lists.find((item) => item.id === listId)
    const item = list?.items.find((entry) => entry.id === itemId)
    if (!list || !item || getListKindMeta(list.kind).kind !== 'mala') return
    setMalaSelection({ listId, itemId, itemName: item.name })
  }

  const answerMalaSelection = (packed: boolean) => {
    if (!malaSelection) return
    updateItem(malaSelection.listId, malaSelection.itemId, { packed })
    setMalaSelection(null)
  }

  const confirmDeleteList = () => {
    if (deleteConfirmId) {
      deleteList(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const listBeingDeleted = deleteConfirmId ? lists.find((l) => l.id === deleteConfirmId) : null

  const totalItems = lists.reduce((acc, l) => acc + l.items.length, 0)
  const checkedItems = lists.reduce(
    (acc, l) => acc + l.items.filter((i) => (getListKindMeta(l.kind).kind === 'mala' ? i.packed : i.checked)).length,
    0,
  )

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#6a634d18' }}
            >
              <List size={22} style={{ color: '#6a634d' }} />
            </span>
            Listas
          </h1>
          <p className="text-muted-foreground mt-2">
            Compras, tarefas e listas personalizadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-3.5 py-2 shadow-sm">
              <CheckCircle2 size={16} className="text-success" />
              <div className="leading-tight">
                <p className="text-sm font-bold tabular-nums">
                  {checkedItems}/{totalItems}
                </p>
                <p className="text-[10px] text-muted-foreground">concluídos</p>
              </div>
            </div>
          )}
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddListOpen(true)}>
            <Plus size={15} />
            Nova lista
          </Button>
        </div>
      </div>

      {lists.length > 0 ? (
        <div className="space-y-4">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onEdit={(id) => { setEditListId(id); setAddListOpen(true) }}
              onDelete={handleDeleteList}
              onDuplicate={duplicateList}
              onAddItem={handleAddItem}
              onToggleItem={toggleItem}
              onSelectItem={handleSelectItem}
              onDeleteItem={deleteItem}
              onEditItem={handleEditItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingCart size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma lista ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddListOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Criar primeira lista
          </Button>
        </div>
      )}

      <AddListDialog
        open={addListOpen}
        editId={editListId}
        onClose={() => { setAddListOpen(false); setEditListId(undefined) }}
      />
      {addItemListId && (
        <AddItemDialog
          open={addItemOpen}
          onClose={() => { setAddItemOpen(false); setAddItemListId(null); setEditItemId(undefined) }}
          listId={addItemListId}
          itemId={editItemId}
        />
      )}

      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent title="Excluir lista" description="Esta ação não pode ser desfeita.">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir a lista{' '}
              <strong className="text-foreground">{listBeingDeleted?.name}</strong>
              {listBeingDeleted && listBeingDeleted.items.length > 0 && (
                <> e todos os seus {listBeingDeleted.items.length} itens?</>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteList} className="rounded-xl gap-1.5">
                <Trash2 size={14} />
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={malaSelection !== null} onOpenChange={(open) => !open && setMalaSelection(null)}>
        <DialogContent title="Já colocou na mala?" description={malaSelection?.itemName}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Marque o que já foi colocado ou mantenha o item nesta lista para lembrar depois.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => answerMalaSelection(true)} className="rounded-xl">
                Sim
              </Button>
              <Button variant="outline" onClick={() => answerMalaSelection(false)} className="rounded-xl">
                Não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
