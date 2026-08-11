'use client'

import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
import type { BirthdayRecord } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Cake, Gift, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { AddBirthdayDialog } from './birthdays-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
const MODULE_COLOR = '#e8a0a0'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const startOfToday = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function nextOccurrence(dateStr: string): Date {
  const d = new Date(dateStr + 'T12:00:00')
  const today = startOfToday()
  const candidate = new Date(today.getFullYear(), d.getMonth(), d.getDate())
  if (candidate < today) candidate.setFullYear(today.getFullYear() + 1)
  return candidate
}

const formatShort = (when: Date) =>
  when.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
      aria-label="Excluir"
    >
      <Trash2 size={14} />
    </button>
  )
}

export function BirthdaysPage() {
  const entries = useBirthdaysStore((s) => s.entries)
  const deleteEntry = useBirthdaysStore((s) => s.deleteEntry)
  const [addOpen, setAddOpen] = useState(false)

  const next = useMemo(() => {
    if (entries.length === 0) return null
    const today = startOfToday()
    const best = entries
      .map((e) => ({ e, when: nextOccurrence(e.date) }))
      .sort((a, b) => a.when.getTime() - b.when.getTime())[0]
    const days = Math.round((best.when.getTime() - today.getTime()) / 86400000)
    return { ...best, days }
  }, [entries])

  const groups = useMemo(() => {
    const today = startOfToday()
    const sorted = [...entries]
      .map((e) => ({ e, when: nextOccurrence(e.date) }))
      .sort((a, b) => a.when.getTime() - b.when.getTime())
    const map = new Map<string, { label: string; items: { e: BirthdayRecord; when: Date }[] }>()
    for (const item of sorted) {
      const key = `${item.when.getMonth()}-${item.when.getFullYear()}`
      const sameYear = item.when.getFullYear() === today.getFullYear()
      const base = item.when.toLocaleDateString('pt-BR', { month: 'long' })
      const label = sameYear ? capitalize(base) : `${capitalize(base)} ${item.when.getFullYear()}`
      const existing = map.get(key)
      if (existing) existing.items.push(item)
      else map.set(key, { label, items: [item] })
    }
    return [...map.values()]
  }, [entries])

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: MODULE_COLOR + '18' }}>
              <Cake size={22} style={{ color: MODULE_COLOR }} />
            </span>
            Aniversários
          </h1>
          <p className="text-muted-foreground mt-2">
            Nunca mais perca uma data importante.
          </p>
        </div>
        <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          Nova data
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Gift size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum aniversário cadastrado ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar aniversário
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {next && (
            <Card glass className={cn(enter)}>
              <CardContent className="flex items-center gap-4 pt-5">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: next.e.color + '18' }}
                >
                  <Cake size={22} style={{ color: next.e.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Próximo</p>
                  <p className="text-lg font-semibold truncate">{next.e.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold tabular-nums">
                    {next.days === 0 ? 'Hoje!' : `${next.days} dia${next.days === 1 ? '' : 's'}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatShort(next.when)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {groups.map((group) => (
            <div key={group.label}>
              <Card glass className={cn('overflow-hidden', enter)}>
                <CardHeader className="flex-row items-center justify-between pb-0">
                  <CardTitle className="text-base">{group.label}</CardTitle>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{group.items.length}</span>
                </CardHeader>
                <div className="px-3 py-3 space-y-0.5">
                  {group.items.map(({ e, when }) => (
                    <div key={e.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: e.color + '18' }}>
                        <Cake size={15} style={{ color: e.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {e.name}
                          {next && next.e.id === e.id && next.days === 0 && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Hoje</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatShort(when)}
                          {e.notes ? ` · ${e.notes}` : ''}
                        </p>
                      </div>
                      <DeleteButton onClick={() => deleteEntry(e.id)} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <AddBirthdayDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}