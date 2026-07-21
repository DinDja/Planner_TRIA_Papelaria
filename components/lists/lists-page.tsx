'use client'

import { useListsStore } from '@/lib/store/use-lists-store'
import type { ShoppingItem, ShoppingList } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Check,
  CheckCircle2,
  Circle,
  List,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input as SearchInput } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddItemDialog, AddListDialog } from './lists-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function ListCard({
  list,
  onDelete,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}: {
  list: ShoppingList
  onDelete: (id: string) => void
  onAddItem: (listId: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
}) {
  const checked = list.items.filter((i) => i.checked).length
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
            <ShoppingCart size={18} style={{ color: list.color }} />
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
              style={{ color: progress === 100 ? '#7bb686' : 'var(--muted-foreground)' }}
            >
              {progress}%
            </div>
          )}
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
                backgroundColor: progress === 100 ? '#7bb686' : list.color,
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
                      onClick={() => onToggleItem(list.id, item.id)}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {item.checked ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          'text-sm',
                          item.checked && 'line-through text-muted-foreground',
                        )}
                      >
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          {item.quantity}
                        </span>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                          {item.notes}
                        </p>
                      )}
                    </div>
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
  const toggleItem = useListsStore((s) => s.toggleItem)
  const deleteItem = useListsStore((s) => s.deleteItem)

  const [tab, setTab] = useState('all')
  const [addListOpen, setAddListOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addItemListId, setAddItemListId] = useState<string | null>(null)

  const handleAddItem = (listId: string) => {
    setAddItemListId(listId)
    setAddItemOpen(true)
  }

  const totalItems = lists.reduce((acc, l) => acc + l.items.length, 0)
  const checkedItems = lists.reduce((acc, l) => acc + l.items.filter((i) => i.checked).length, 0)

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#7bb68618' }}
            >
              <List size={22} style={{ color: '#7bb686' }} />
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
              <CheckCircle2 size={16} className="text-emerald-500" />
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
              onDelete={deleteList}
              onAddItem={handleAddItem}
              onToggleItem={toggleItem}
              onDeleteItem={deleteItem}
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

      <AddListDialog open={addListOpen} onClose={() => setAddListOpen(false)} />
      {addItemListId && (
        <AddItemDialog
          open={addItemOpen}
          onClose={() => { setAddItemOpen(false); setAddItemListId(null) }}
          listId={addItemListId}
        />
      )}
    </div>
  )
}
