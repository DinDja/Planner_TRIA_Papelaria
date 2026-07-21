'use client'

import { useMemoriesStore } from '@/lib/store/use-memories-store'
import type { MemoryMood } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Angry,
  Box,
  Frown,
  Meh,
  Plus,
  Smile,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/primitives'
import { AddMemoryDialog } from './memories-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MOOD_CONFIG: Record<MemoryMood, { icon: typeof Smile; label: string; color: string }> = {
  great: { icon: Sparkles, label: 'Incrível', color: '#7bb686' },
  good: { icon: Smile, label: 'Bom', color: '#5b8dbf' },
  neutral: { icon: Meh, label: 'Neutro', color: '#f0b429' },
  bad: { icon: Frown, label: 'Ruim', color: '#e8a0a0' },
  tough: { icon: Angry, label: 'Difícil', color: '#e05b6d' },
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${d} ${months[parseInt(m) - 1]} ${y}`
}

function MemoryCard({
  entry,
  onDelete,
}: {
  entry: import('@/lib/types').MemoryEntry
  onDelete: (id: string) => void
}) {
  const mood = MOOD_CONFIG[entry.mood]
  const MoodIcon = mood.icon

  return (
    <div className="group relative pl-8 pb-8 last:pb-0">
      {/* Linha vertical da timeline */}
      <div
        className="absolute left-[11px] top-3 bottom-0 w-px last:hidden"
        style={{ backgroundColor: entry.color + '40' }}
      />

      {/* Bolha da timeline */}
      <div
        className="absolute left-0 top-1 size-6 rounded-full border-2 flex items-center justify-center"
        style={{
          borderColor: entry.color,
          backgroundColor: entry.color + '18',
        }}
      >
        <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{
          backgroundColor: entry.color + '0a',
          border: `1px solid ${entry.color}20`,
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: mood.color + '18' }}
            >
              <MoodIcon size={16} style={{ color: mood.color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold">{entry.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</span>
                <span className="text-[10px] text-muted-foreground/50">·</span>
                <span className="text-[10px] font-medium" style={{ color: mood.color }}>
                  {mood.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(entry.id)}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir memória"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {entry.description}
        </p>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entry.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function MemoriesPage() {
  const entries = useMemoriesStore((s) => s.entries)
  const deleteEntry = useMemoriesStore((s) => s.deleteEntry)

  const [addOpen, setAddOpen] = useState(false)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    entries.forEach((e) => e.tags.forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [entries])

  const filtered = useMemo(() => {
    let list = [...entries]
    if (tagFilter) {
      list = list.filter((e) => e.tags.includes(tagFilter))
    }
    list.sort((a, b) => b.date.localeCompare(a.date))
    return list
  }, [entries, tagFilter])

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#e8a0a018' }}
            >
              <Box size={22} style={{ color: '#e8a0a0' }} />
            </span>
            Caixa de Memórias
          </h1>
          <p className="text-muted-foreground mt-2">
            Guarde momentos especiais para revisitá-los sempre.
          </p>
        </div>
        <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          Nova memória
        </Button>
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 mb-6', enter)}>
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              !tagFilter
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted',
            )}
          >
            Todas
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                tagFilter === t
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="max-w-2xl">
          {filtered.map((entry) => (
            <MemoryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Box size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {tagFilter ? 'Nenhuma memória com essa tag.' : 'Nenhuma memória guardada ainda.'}
          </p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Registrar primeira memória
          </Button>
        </div>
      )}

      <AddMemoryDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
