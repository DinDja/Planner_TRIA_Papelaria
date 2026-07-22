'use client'

import { useChecklistsStore } from '@/lib/store/use-checklists-store'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  ListChecks,
  PartyPopper,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AddChecklistDialog } from './checklists-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

// Cores festivas para os confetes
const CONFETTI_COLORS = ['#7bb686', '#f0b429', '#5b8dbf', '#e8a0a0', '#c9b6e4', '#e05b6d', '#f5c8a0']

function CelebrationOverlay() {
  // 18 confetes com posições/cores/durações variadas
  const pieces = Array.from({ length: 18 }, (_, i) => {
    const left = (i * 53) % 100
    const delay = (i % 6) * 70
    const duration = 1400 + ((i * 37) % 1100)
    const size = 6 + ((i * 13) % 8)
    const rotate = (i * 53) % 360
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    return { left, delay, duration, size, rotate, color, i }
  })
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute top-[-12px] block"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            borderRadius: p.i % 2 === 0 ? '2px' : '9999px',
            animationName: 'confetti-fall',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationIterationCount: '1',
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
          }}
        />
      ))}
    </div>
  )
}

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
  const [celebrate, setCelebrate] = useState(false)

  const checked = checklist.items.filter((i) => i.checked).length
  const total = checklist.items.length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0
  const allDone = total > 0 && checked === total

  const handleAdd = () => {
    const text = newItemText.trim()
    if (!text) return
    addItem(checklist.id, text)
    setNewItemText('')
    inputRef.current?.focus()
  }

  // Detecta o momento em que o último item é concluído -> dispara celebração
  const prevAllDoneRef = useRef(false)
  useEffect(() => {
    // dispara só na transição de "nem todos" -> "todos concluídos"
    if (allDone && !prevAllDoneRef.current) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 2600)
      prevAllDoneRef.current = true
      return () => clearTimeout(t)
    }
    if (!allDone) {
      prevAllDoneRef.current = false
    }
  }, [allDone])

  const handleToggle = (itemId: string) => {
    toggleItem(checklist.id, itemId)
  }

  return (
    <Card
      glass
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        celebrate && 'animate-[celebrate_0.6s_ease-out]',
        allDone && !celebrate && 'ring-2 ring-emerald-500/30',
      )}
      style={{
        borderTopColor: checklist.color,
        borderTopWidth: 3,
      }}
    >
      {/* Overlay festivo animado ao concluir o checklist */}
      {celebrate && <CelebrationOverlay />}
      <CardHeader className="flex-row items-center justify-between pb-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl transition-all',
                allDone && 'animate-[pop_0.4s_ease-out]',
              )}
              style={{ backgroundColor: allDone ? '#7bb68618' : checklist.color + '18' }}
            >
              {allDone ? (
                <PartyPopper size={18} className="text-emerald-500" />
              ) : (
                <ListChecks size={18} style={{ color: checklist.color }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{checklist.title}</CardTitle>
                {allDone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 animate-[pop_0.4s_ease-out]">
                    <PartyPopper size={10} />
                    Concluído!
                  </span>
                )}
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
              onClick={() => handleToggle(item.id)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label={item.checked ? 'Desmarcar item' : 'Concluir item'}
            >
              <span
                key={item.checked ? 'checked' : 'unchecked'}
                className={cn(
                  'inline-flex items-center justify-center transition-all duration-300',
                  item.checked && 'animate-[pop_0.3s_ease-out]',
                )}
                style={item.checked ? { transformOrigin: 'center' } : undefined}
              >
                {item.checked ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <Circle size={18} />
                )}
              </span>
            </button>
            <span
              className={cn(
                'text-sm flex-1 transition-all duration-300',
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
