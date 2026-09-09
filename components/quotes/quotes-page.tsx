'use client'

import { useQuotesStore } from '@/lib/store/use-quotes-store'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  List,
  Plus,
  Pencil,
  Quote,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddQuoteDialog } from './quotes-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function QuoteCard({
  quote,
  onEdit,
  onDelete,
}: {
  quote: import('@/lib/types').FavoriteQuote
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      glass
      className="group relative overflow-hidden"
      style={{
        borderTopColor: quote.color,
        borderTopWidth: 3,
      }}
    >
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(quote.id)}
          className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
          aria-label="Editar frase"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(quote.id)}
          className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          aria-label="Excluir frase"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <CardContent className="pt-0">
      <Quote size={18} className="mb-3" style={{ color: quote.color }} />

      <blockquote className="text-sm leading-relaxed italic text-foreground/85 mb-3">
        &ldquo;{quote.text}&rdquo;
      </blockquote>

      {quote.author && (
        <p className="text-xs font-medium" style={{ color: quote.color }}>
          &mdash; {quote.author}
        </p>
      )}

      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {quote.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
              {t}
            </Badge>
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  )
}

export function QuotesPage() {
  const quotes = useQuotesStore((s) => s.quotes)
  const deleteQuote = useQuotesStore((s) => s.deleteQuote)

  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [tab, setTab] = useState('all')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    quotes.forEach((q) => q.tags.forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [quotes])

  const filtered = useMemo(() => {
    if (tab === 'all') return quotes
    if (tab.startsWith('tag-')) {
      const tag = tab.replace('tag-', '')
      return quotes.filter((q) => q.tags.includes(tag))
    }
    return quotes
  }, [quotes, tab])

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(106, 99, 77, 0.094)' }}
            >
              <List size={22} style={{ color: '#6a634d' }} />
            </span>
            Frases Favoritas
          </h1>
          <p className="text-muted-foreground mt-2">
            Suas citações e frases favoritas em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Nova frase
          </Button>
        </div>
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 mb-6', enter)}>
          <button
            onClick={() => setTab('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
              tab === 'all'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted',
            )}
          >
            Todas
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTab(tab === `tag-${t}` ? 'all' : `tag-${t}`)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                tab === `tag-${t}`
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
        <div className="space-y-4">
          {filtered.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onEdit={(id) => { setEditId(id); setAddOpen(true) }}
              onDelete={deleteQuote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bookmark size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {tab === 'all' ? 'Nenhuma frase salva ainda.' : 'Nenhuma frase com essa tag.'}
          </p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar frase
          </Button>
        </div>
      )}

      <AddQuoteDialog
        open={addOpen}
        editId={editId}
        onClose={() => { setAddOpen(false); setEditId(undefined) }}
      />
    </div>
  )
}
