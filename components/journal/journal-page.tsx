'use client'

import { useJournalStore } from '@/lib/store/use-journal-store'
import { EMOTION_CONFIG, ENTRY_COLORS, TIME_OF_DAY_CONFIG, type JournalEmotion, type JournalEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Feather,
  Flame,
  Hash,
  Heart,
  Moon,
  Pencil,
  Pin,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/primitives'
import { AddEntryDialog, ViewEntryDialog } from './journal-dialogs'
import { DrawingPreview } from './handwriting-canvas'
import { toast } from '../ui/toaster'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  if (diff > 1 && diff < 7) return `Há ${diff} dias`
  if (diff >= 7 && diff < 14) return 'Semana passada'
  return formatDate(dateStr)
}

function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return { text: 'Bom dia', icon: Sun }
  if (h >= 12 && h < 17) return { text: 'Boa tarde', icon: Zap }
  if (h >= 17 && h < 21) return { text: 'Boa noite', icon: Moon }
  return { text: 'Boa noite', icon: Moon }
}

function EmotionBadge({ emotion, size = 'sm' }: { emotion: JournalEmotion; size?: 'sm' | 'lg' }) {
  const config = EMOTION_CONFIG[emotion]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
      )}
      style={{ backgroundColor: config.color + '25', color: config.color }}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  )
}

function EnergyIndicator({ level }: { level: number }) {
  const bars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0.5">
      {bars.map((bar) => (
        <div
          key={bar}
          className={cn(
            'w-1.5 rounded-full transition-all',
            bar <= level ? 'h-3' : 'h-2',
          )}
          style={{
            backgroundColor: bar <= level
              ? level <= 2 ? '#d1bdb8' : level <= 3 ? '#b76f06' : '#6a634d'
              : 'var(--muted)',
          }}
        />
      ))}
    </div>
  )
}

function MoodTimeline({ timeline }: { timeline: { date: string; emotions: JournalEmotion[]; energy: number }[] }) {
  if (timeline.length === 0) return null

  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1">
      {timeline.map((day) => {
        const dominantEmotion = day.emotions[0]
        const color = dominantEmotion ? EMOTION_CONFIG[dominantEmotion].color : 'var(--muted)'
        const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })

        return (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className="w-8 rounded-lg flex items-end justify-center pb-0.5"
              style={{
                backgroundColor: color + '20',
                height: `${28 + day.energy * 8}px`,
              }}
            >
              <span className="text-[8px] text-muted-foreground">
                {day.emotions[0] ? EMOTION_CONFIG[day.emotions[0]].emoji : '·'}
              </span>
            </div>
            <span className="text-[8px] text-muted-foreground capitalize">{dayLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

function EntryCard({ entry, onDelete, onView, index = 0 }: {
  entry: JournalEntry
  onDelete: (id: string) => void
  onView: (entry: JournalEntry) => void
  index?: number
}) {
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length
  const timeConfig = TIME_OF_DAY_CONFIG[entry.timeOfDay]

  return (
    <div
      className={cn('animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both')}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Card
        hover
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.99] overflow-hidden"
        style={{ borderLeftColor: entry.color, borderLeftWidth: '4px' }}
        onClick={() => onView(entry)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: entry.color + '20', color: entry.color }}
                >
                  {timeConfig.icon} {timeConfig.label}
                </span>
                {entry.pinned && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Pin size={10} className="fill-primary" /> fixado
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-foreground leading-tight line-clamp-1">{entry.title}</h3>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                  {entry.mood.emotions.slice(0, 3).map((e) => (
                    <EmotionBadge key={e} emotion={e} />
                  ))}
                </div>
                <EnergyIndicator level={entry.mood.energy} />
              </div>

              {entry.prompt && (
                <p className="text-xs text-muted-foreground/70 mt-2 italic flex items-center gap-1">
                  <Feather size={10} />
                  "{entry.prompt}"
                </p>
              )}

              <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                {entry.content.replace(/\n/g, ' ').trim()}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays size={10} />
                  {formatDateRelative(entry.date)}
                </span>
                <span className="text-[10px] text-muted-foreground">{wordCount} palavras</span>
                {entry.tags.length > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Hash size={10} />
                    {entry.tags.length}
                  </span>
                )}
                {entry.drawing && entry.drawing.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">✏️</span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onView(entry) }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
              aria-label="Editar entrada"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
              aria-label="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }: { icon: typeof Flame; value: number | string; label: string; color: string }) {
  return (
    <Card className="flex-1 min-w-[120px]">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-lg font-bold truncate">{value}</p>
          <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function JournalPage() {
  const entries = useJournalStore((s) => s.entries)
  const deleteEntry = useJournalStore((s) => s.deleteEntry)
  const getMoodStats = useJournalStore((s) => s.getMoodStats)
  const getEmotionTimeline = useJournalStore((s) => s.getEmotionTimeline)
  const getPrompt = useJournalStore((s) => s.getPrompt)

  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)

  const stats = useMemo(() => getMoodStats(), [entries])
  const timeline = useMemo(() => getEmotionTimeline(14), [entries])
  const todayPrompt = useMemo(() => getPrompt(), [])

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  const hasTodayEntry = entries.some((e) => e.date === todayISO())

  const filteredEntries = useMemo(() => {
    let filtered = [...entries]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.mood.note?.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    })
  }, [entries, search])

  const topEmotions = useMemo(() => {
    const counts = stats.emotionCounts
    return Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 4)
      .map(([emotion]) => emotion as JournalEmotion)
  }, [stats])

  const handleDelete = (id: string) => {
    const entry = entries.find((e) => e.id === id)
    deleteEntry(id)
    if (viewEntry?.id === id) setViewEntry(null)
    toast({ title: 'Entrada removida', variant: 'success' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className={cn('flex flex-wrap items-start justify-between gap-4', enter)}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetingIcon size={20} className="text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{greeting.text}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div
                className="size-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d1bdb8 0%, #b76f06 100%)' }}
              >
                <Heart size={22} className="text-white" />
              </div>
              Meu Diário
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {hasTodayEntry
                ? 'Continue registrando seus pensamentos.'
                : 'Que tal escrever algo agora?'}
            </p>
          </div>
          <Button
            className="rounded-xl gap-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #d1bdb8 0%, #b76f06 100%)' }}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} />
            {hasTodayEntry ? 'Nova entrada' : 'Escrever hoje'}
          </Button>
        </div>

        {/* Mood Timeline + Stats */}
        <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', enter)}>
          {/* Timeline */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  Humor dos últimos dias
                </h2>
              </div>
              {timeline.length > 0 ? (
                <MoodTimeline timeline={timeline} />
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Continue escrevendo para ver seu humor aqui
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-3">
            <StatCard icon={Flame} value={stats.streak} label="dias seguidos" color="#d1bdb8" />
            <StatCard icon={Feather} value={stats.totalEntries} label="entradas" color="#6a634d" />

            {topEmotions.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-2">emoções mais frequentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topEmotions.map((e) => (
                      <EmotionBadge key={e} emotion={e} size="lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Today's Prompt */}
        {!hasTodayEntry && (
          <Card className={cn('border-dashed border-2', enter)} style={{ borderColor: '#d1bdb840' }}>
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #d1bdb820, #b76f0620)' }}
              >
                <Sparkles size={20} style={{ color: '#d1bdb8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">PROMPT DO DIA</p>
                <p className="font-medium text-foreground leading-tight">"{todayPrompt}"</p>
              </div>
              <Button size="sm" className="rounded-xl shrink-0" onClick={() => setAddOpen(true)}>
                Responder
                <ChevronRight size={14} />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className={cn('relative', enter)}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no diário..."
            className="flex w-full h-10 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/50"
          />
        </div>

        {/* Entries */}
        <div className={enter}>
          {filteredEntries.length > 0 ? (
            <div className="space-y-3">
              {filteredEntries.map((entry, i) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onView={setViewEntry}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-muted/20">
              <BookOpen size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhum resultado encontrado.' : 'Nenhuma entrada ainda.'}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                  <Plus size={14} className="mr-1.5" />
                  Começar a escrever
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <AddEntryDialog open={addOpen} onClose={() => setAddOpen(false)} defaultPrompt={todayPrompt} />
      <ViewEntryDialog entry={viewEntry} open={!!viewEntry} onClose={() => setViewEntry(null)} />
    </div>
  )
}
