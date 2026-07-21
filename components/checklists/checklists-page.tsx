'use client'

import { useChecklistsStore } from '@/lib/store/use-checklists-store'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AddChecklistDialog } from './checklists-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function ChecklistCard({
  checklist,
  onDelete,
}: {
  checklist: import('@/lib/types').Checklist
  onDelete: (id: string) => void
}) {
  const addItem = useChecklistsStore((s) => s.addItem)
  const toggleItem = useChecklistsStore((s) => s.toggleItem)
  const deleteItem = useChecklistsStore((s) => s.deleteItem)

  const [newItemText, setNewItemText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const checked = checklist.items.filter((i) => i.checked).length
  const total = checklist.items.length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0

  const handleAdd = () => {
    const text = newItemText.trim()
    if (!text) return
    addItem(checklist.id, text)
    setNewItemText('')
    inputRef.current?.focus()
  }

  return (
    <Card
      glass
      className="overflow-hidden"
      style={{
        borderTopColor: checklist.color,
        borderTopWidth: 3,
      }}
    >
      <CardHeader className="flex-row items-center justify-between pb-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: checklist.color + '18' }}
          >
            <ListChecks size={18} style={{ color: checklist.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{checklist.title}</CardTitle>
            </div>
            {total > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {checked}/{total} concluídos
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span
              className="text-xs font-bold tabular-nums"
              style={{
                color: progress === 100 ? '#7bb686' : 'var(--muted-foreground)',
              }}
            >
              {progress}%
            </span>
          )}
          <button
            onClick={() => onDelete(checklist.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir checklist"
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
                backgroundColor: progress === 100 ? '#7bb686' : checklist.color,
              }}
            />
          </div>
        </div>
      )}

      <CardContent className="pt-3 space-y-0.5">
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <button
              onClick={() => toggleItem(checklist.id, item.id)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {item.checked ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Circle size={18} />
              )}
            </button>
            <span
              className={cn(
                'text-sm flex-1',
                item.checked && 'line-through text-muted-foreground',
              )}
            >
              {item.text}
            </span>
            <button
              onClick={() => deleteItem(checklist.id, item.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <Circle size={18} className="shrink-0 text-muted-foreground/30" />
          <input
            ref={inputRef}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Adicionar item..."
            className="h-8 w-full border-0 bg-transparent px-0 text-sm rounded-none shadow-none outline-none placeholder:text-muted-foreground/40"
          />
          <button
            onClick={handleAdd}
            disabled={!newItemText.trim()}
            className="shrink-0 rounded-lg p-1 text-muted-foreground/40 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChecklistsPage() {
  const checklists = useChecklistsStore((s) => s.checklists)
  const deleteChecklist = useChecklistsStore((s) => s.deleteChecklist)

  const [addOpen, setAddOpen] = useState(false)

  const totalItems = checklists.reduce((acc, c) => acc + c.items.length, 0)
  const checkedItems = checklists.reduce(
    (acc, c) => acc + c.items.filter((i) => i.checked).length,
    0,
  )

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#5b8dbf18' }}
            >
              <ListChecks size={22} style={{ color: '#5b8dbf' }} />
            </span>
            Checklists
          </h1>
          <p className="text-muted-foreground mt-2">
            Listas de verificação para não esquecer nenhum passo.
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
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Novo checklist
          </Button>
        </div>
      </div>

      {checklists.length > 0 ? (
        <div className="space-y-4">
          {checklists.map((cl) => (
            <ChecklistCard key={cl.id} checklist={cl} onDelete={deleteChecklist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ListChecks size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum checklist ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Criar primeiro checklist
          </Button>
        </div>
      )}

      <AddChecklistDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
