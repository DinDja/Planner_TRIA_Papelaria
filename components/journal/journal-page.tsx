'use client'

import { useJournalStore } from '@/lib/store/use-journal-store'
import type { JournalEntry, JournalMood } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Angry,
  BookOpen,
  CalendarDays,
  Frown,
  Meh,
  PenLine,
  Pin,
  Plus,
  Search,
  Smile,
  Sparkles,
  Trash2,
  Flame,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Input as SearchInput } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddEntryDialog, ViewEntryDialog } from './journal-dialogs'
import { DrawingPreview } from './handwriting-canvas'
import { toast } from '../ui/toaster'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MOOD_CONFIG: Record<JournalMood, { icon: typeof Smile; label: string; color: string }> = {
  great: { icon: Sparkles, label: 'Excelente', color: '#7bb686' },
  good: { icon: Smile, label: 'Bom', color: '#5b8dbf' },
  neutral: { icon: Meh, label: 'Neutro', color: '#f0b429' },
  bad: { icon: Frown, label: 'Ruim', color: '#e8a0a0' },
  tough: { icon: Angry, label: 'Difícil', color: '#e05b6d' },
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatDateRelative(dateStr: string): string {
  const today = new Date()
  const d = new Date(dateStr + 'T12:00:00')
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff === -1) return 'Amanhã'
  if (diff > 0 && diff < 7) return `Há ${diff} dias`
  return formatDate(dateStr)
}

function calcStreak(entries: JournalEntry[]): number {
  const dates = [...new Set(entries.map((e) => e.date))].sort().reverse()
  if (dates.length === 0) return 0
  let streak = 0
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  let expected = todayStr
  for (const date of dates) {
    if (date === expected) {
      streak++
      const d = new Date(expected + 'T12:00:00')
      d.setDate(d.getDate() - 1)
      expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } else if (date < expected) {
      break
    }
  }
  return streak
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupByMonth(entries: JournalEntry[]) {
  const groups: { label: string; entries: JournalEntry[] }[] = []
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  for (const e of entries) {
    const [y, m] = e.date.split('-')
    const label = `${monthNames[parseInt(m) - 1]} de ${y}`
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.entries.push(e)
    } else {
      groups.push({ label, entries: [e] })
    }
  }
  return groups
}

function useScrollAnimation() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    refs.current[i] = el
  }

  return { setRef }
}

function EntryCard({
  entry,
  onDelete,
  onView,
  index = 0,
}: {
  entry: JournalEntry
  onDelete: (id: string) => void
  onView: (entry: JournalEntry) => void
  index?: number
}) {
  const MoodIcon = entry.mood ? MOOD_CONFIG[entry.mood].icon : null
  const moodColor = entry.mood ? MOOD_CONFIG[entry.mood].color : 'var(--muted-foreground)'

  const lines = entry.content.split('\n').filter(Boolean)
  const preview = lines.slice(0, 2).join('\n')
  const hasMore = lines.length > 2
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both',
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Card
        glass
        hover
        className="group cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
        onClick={() => onView(entry)}
      >
        <CardHeader className="flex-row items-start justify-between gap-3 pb-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {MoodIcon && (
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: moodColor + '18' }}
              >
                <MoodIcon size={18} style={{ color: moodColor }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  {entry.title}
                  {entry.pinned && <Pin size={14} className="text-primary fill-primary" />}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays size={11} />
                  {formatDateRelative(entry.date)}
                </span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{wordCount} palavras</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir entrada"
          >
            <Trash2 size={14} />
          </button>
        </CardHeader>
        <CardContent className="pt-3">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-3">
            {preview}
            {hasMore && <span className="text-muted-foreground/60"> ...</span>}
          </p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {entry.drawing && entry.drawing.length > 0 && (
            <DrawingPreview strokes={entry.drawing} className="mt-2" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function JournalPage() {
  const entries = useJournalStore((s) => s.entries)
  const deleteEntry = useJournalStore((s) => s.deleteEntry)
  const [tab, setTab] = useState('todas')
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)

  const streak = useMemo(() => calcStreak(entries), [entries])

  const totalWords = useMemo(
    () => entries.reduce((acc, e) => acc + e.content.trim().split(/\s+/).filter(Boolean).length, 0),
    [entries],
  )

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1
    }
    return counts
  }, [entries])

  const sortedEntries = useMemo(() => {
    let filtered = [...entries]

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    })

    return filtered
  }, [entries, search])

  const pinned = sortedEntries.filter((e) => e.pinned)
  const unpinned = sortedEntries.filter((e) => !e.pinned)
  const hasTodayEntry = entries.some((e) => e.date === todayISO())
  const allGroups = groupByMonth(unpinned)

  const handleDelete = (id: string) => {
    const entry = entries.find((e) => e.id === id)
    deleteEntry(id)
    if (viewEntry?.id === id) setViewEntry(null)
    toast({
      title: 'Entrada excluída',
      description: entry ? `"${entry.title}" foi movido para a lixeira.` : undefined,
      variant: 'success',
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#e8a0a018' }}
            >
              <BookOpen size={22} style={{ color: '#e8a0a0' }} />
            </span>
            Diário Digital
          </h1>
          <p className="text-muted-foreground mt-2">
            Seu espaço pessoal para registrar pensamentos, reflexões e memórias.
          </p>
        </div>
        <Button
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={15} />
          {hasTodayEntry ? 'Nova entrada' : 'Escrever hoje'}
        </Button>
      </div>

      {/* Stats */}
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6', enter)}>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm">
          <PenLine size={16} className="text-primary shrink-0" />
          <div className="leading-tight">
            <p className="text-lg font-bold tabular-nums">{entries.length}</p>
            <p className="text-[10px] text-muted-foreground">entradas</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm">
          <Flame size={16} className={streak >= 3 ? 'text-orange-500' : 'text-muted-foreground shrink-0'} />
          <div className="leading-tight">
            <p className="text-lg font-bold tabular-nums">{streak}</p>
            <p className="text-[10px] text-muted-foreground">sequência (dias)</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm">
          <BookOpen size={16} className="text-primary shrink-0" />
          <div className="leading-tight">
            <p className="text-lg font-bold tabular-nums">{totalWords}</p>
            <p className="text-[10px] text-muted-foreground">palavras escritas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm">
          <div className="flex -space-x-1 shrink-0">
            {(['great', 'good', 'neutral', 'bad', 'tough'] as const).map((m) => {
              const count = moodCounts[m] || 0
              const max = Math.max(...Object.values(moodCounts), 1)
              const pct = count / max
              return (
                <div
                  key={m}
                  className="size-5 rounded-full border-2 border-card transition-all"
                  style={{
                    backgroundColor: MOOD_CONFIG[m].color + (pct > 0 ? 'cc' : '30'),
                  }}
                  title={`${MOOD_CONFIG[m].label}: ${count}`}
                />
              )
            })}
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold tabular-nums">{Object.values(moodCounts).reduce((a, b) => a + b, 0)}</p>
            <p className="text-[10px] text-muted-foreground">com humor</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={cn('relative mb-6', enter)}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar no diário..."
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <TabList className="mb-4">
          <Tab value="todas">
            Todas
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {entries.length}
            </span>
          </Tab>
          <Tab value={todayISO()}>
            Hoje
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {entries.filter((e) => e.date === todayISO()).length}
            </span>
          </Tab>
        </TabList>

        <TabPanel value="todas">
          {sortedEntries.length > 0 ? (
            <div className="space-y-6">
              {pinned.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Pin size={12} />
                    Fixadas
                  </p>
                  <div className="space-y-3">
                    {pinned.map((e, i) => (
                      <EntryCard key={e.id} entry={e} onDelete={handleDelete} onView={setViewEntry} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {pinned.length > 0 && unpinned.length > 0 && (
                <div className="border-t border-border/30" />
              )}

              {allGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="space-y-3">
                    {group.entries.map((e, i) => (
                      <EntryCard key={e.id} entry={e} onDelete={handleDelete} onView={setViewEntry} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {search
                  ? 'Nenhum resultado encontrado.'
                  : 'Nenhuma entrada ainda. Comece a escrever!'}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-1.5" />
                Primeira entrada
              </Button>
            </div>
          )}
        </TabPanel>

        <TabPanel value={todayISO()}>
          {(() => {
            const todayEntries = sortedEntries.filter((e) => e.date === todayISO())
            return todayEntries.length > 0 ? (
              <div className="space-y-3">
                {todayEntries.map((e, i) => (
                  <EntryCard key={e.id} entry={e} onDelete={handleDelete} onView={setViewEntry} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nada registrado hoje ainda.</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                  <Plus size={14} className="mr-1.5" />
                  Escrever agora
                </Button>
              </div>
            )
          })()}
        </TabPanel>
      </Tabs>

      <AddEntryDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ViewEntryDialog entry={viewEntry} open={!!viewEntry} onClose={() => setViewEntry(null)} />
    </div>
  )
}
