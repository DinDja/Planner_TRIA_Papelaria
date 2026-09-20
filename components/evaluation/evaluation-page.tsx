'use client'

import { useEvaluationStore } from '@/lib/store/use-evaluation-store'
import type { EvaluationEntry, EvaluationType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Film,
  List,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Tv,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Input as SearchInput } from '../ui/primitives'
import { Tab, TabList, Tabs } from '../ui/overlays'
import { EvaluationDialog } from './evaluation-dialog'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
type EvaluationFilter = 'all' | EvaluationType

const TYPE_CONFIG: Record<EvaluationType, {
  label: string
  plural: string
  icon: typeof Film
  color: string
}> = {
  filme: { label: 'Filme', plural: 'Filmes', icon: Film, color: '#b76f06' },
  serie: { label: 'Série', plural: 'Séries', icon: Tv, color: '#6a634d' },
  livro: { label: 'Livro', plural: 'Livros', icon: BookOpen, color: '#d1bdb8' },
}

function RatingStars({ rating, small = false }: { rating: EvaluationEntry['rating']; small?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Nota: ${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={small ? 13 : 16}
          className={rating >= value ? 'fill-primary text-primary' : 'text-muted-foreground/25'}
        />
      ))}
    </div>
  )
}

function EvaluationCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: EvaluationEntry
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const config = TYPE_CONFIG[entry.type]
  const TypeIcon = config.icon

  return (
    <Card
      glass
      className="group overflow-hidden"
      style={{ borderTopColor: config.color, borderTopWidth: 3 }}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 pb-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${config.color}18`, color: config.color }}
          >
            <TypeIcon size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate">{entry.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">{config.label}</span>
              {entry.seasons !== undefined && (
                <>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.seasons} {entry.seasons === 1 ? 'temporada' : 'temporadas'}
                  </span>
                </>
              )}
              {entry.publisher && (
                <>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <span className="text-[11px] text-muted-foreground truncate">{entry.publisher}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(entry.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            aria-label={`Editar avaliação de ${entry.name}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label={`Excluir avaliação de ${entry.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <RatingStars rating={entry.rating} />
        {entry.observation && (
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {entry.observation}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function EvaluationPage() {
  const entries = useEvaluationStore((state) => state.entries)
  const deleteEntry = useEvaluationStore((state) => state.deleteEntry)
  const [filter, setFilter] = useState<EvaluationFilter>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

  const counts = useMemo(() => ({
    all: entries.length,
    filme: entries.filter((entry) => entry.type === 'filme').length,
    serie: entries.filter((entry) => entry.type === 'serie').length,
    livro: entries.filter((entry) => entry.type === 'livro').length,
  }), [entries])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...entries]
      .filter((entry) => filter === 'all' || entry.type === filter)
      .filter((entry) => !query || [entry.name, entry.publisher, entry.observation]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [entries, filter, search])

  const openNewEntry = () => {
    setEditId(undefined)
    setDialogOpen(true)
  }

  const openEditEntry = (id: string) => {
    setEditId(id)
    setDialogOpen(true)
  }

  const defaultType: EvaluationType = filter === 'all' ? 'filme' : filter

  return (
    <div className="flex h-full">
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/40 p-4 gap-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Avaliar
        </p>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer',
            filter === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <List size={15} />
          Todas as avaliações
          <span className="ml-auto text-xs text-muted-foreground/60">{counts.all}</span>
        </button>

        <div className="border-t border-border/30 my-2" />
        {(Object.keys(TYPE_CONFIG) as EvaluationType[]).map((type) => {
          const config = TYPE_CONFIG[type]
          const TypeIcon = config.icon
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer',
                filter === type ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <TypeIcon size={15} />
              {config.plural}
              <span className="ml-auto text-xs text-muted-foreground/60">{counts[type]}</span>
            </button>
          )
        })}
      </aside>

      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', enter)}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                <Star size={22} className="text-primary" />
              </span>
              Avaliação
            </h1>
            <p className="text-muted-foreground mt-2">
              Guarde suas notas para filmes, séries e livros.
            </p>
          </div>
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={openNewEntry}>
            <Plus size={15} />
            Nova avaliação
          </Button>
        </div>

        <div className={cn('relative mb-4', enter)}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar avaliações..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="lg:hidden mb-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as EvaluationFilter)}>
            <TabList className="overflow-auto scrollbar-thin">
              <Tab value="all">Todas <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold">{counts.all}</span></Tab>
              {(Object.keys(TYPE_CONFIG) as EvaluationType[]).map((type) => (
                <Tab key={type} value={type}>{TYPE_CONFIG[type].plural} <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold">{counts[type]}</span></Tab>
              ))}
            </TabList>
          </Tabs>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 py-4">
            {filteredEntries.map((entry) => (
              <EvaluationCard key={entry.id} entry={entry} onEdit={openEditEntry} onDelete={deleteEntry} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Star size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Nenhuma avaliação encontrada.' : 'Nenhuma avaliação registrada ainda.'}
            </p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={openNewEntry}>
              <Plus size={14} className="mr-1.5" />
              Registrar primeira avaliação
            </Button>
          </div>
        )}
      </div>

      <EvaluationDialog
        open={dialogOpen}
        editId={editId}
        defaultType={defaultType}
        onClose={() => { setDialogOpen(false); setEditId(undefined) }}
      />
    </div>
  )
}
