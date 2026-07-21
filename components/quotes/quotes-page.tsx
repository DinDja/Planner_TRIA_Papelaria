'use client'

import { useQuotesStore } from '@/lib/store/use-quotes-store'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  Plus,
  Quote,
  Shuffle,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddQuoteDialog } from './quotes-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function QuoteCard({
  quote,
  onDelete,
}: {
  quote: import('@/lib/types').FavoriteQuote
  onDelete: (id: string) => void
}) {
  return (
    <div
      className="group relative rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: quote.color + '12',
        borderLeft: `4px solid ${quote.color}`,
      }}
    >
      <button
        onClick={() => onDelete(quote.id)}
        className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
        aria-label="Excluir frase"
      >
        <Trash2 size={14} />
      </button>

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
    </div>
  )
}

export function QuotesPage() {
  const quotes = useQuotesStore((s) => s.quotes)
  const deleteQuote = useQuotesStore((s) => s.deleteQuote)
  const getRandomQuote = useQuotesStore((s) => s.getRandomQuote)

  const [addOpen, setAddOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const [randomQuote, setRandomQuote] = useState<import('@/lib/types').FavoriteQuote | undefined>(undefined)

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

  const handleRandom = () => {
    setRandomQuote(getRandomQuote())
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#c9b6e418' }}
            >
              <Bookmark size={22} style={{ color: '#c9b6e4' }} />
            </span>
            Frases Favoritas
          </h1>
          <p className="text-muted-foreground mt-2">
            Suas citações e frases favoritas em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={handleRandom}
            disabled={quotes.length === 0}
          >
            <Shuffle size={14} />
            Frase aleatória
          </Button>
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Nova frase
          </Button>
        </div>
      </div>

      {/* Frase aleatória */}
      {randomQuote && (
        <div className={cn('mb-8', enter)}>
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: `linear-gradient(135deg, ${randomQuote.color}18, ${randomQuote.color}08)`,
              border: `1px solid ${randomQuote.color}30`,
            }}
          >
            <Quote size={24} className="mx-auto mb-3" style={{ color: randomQuote.color }} />
            <blockquote className="text-lg font-medium leading-relaxed italic text-foreground/90 mb-3 max-w-2xl mx-auto">
              &ldquo;{randomQuote.text}&rdquo;
            </blockquote>
            {randomQuote.author && (
              <p className="text-sm font-semibold" style={{ color: randomQuote.color }}>
                &mdash; {randomQuote.author}
              </p>
            )}
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((q) => (
            <QuoteCard key={q.id} quote={q} onDelete={deleteQuote} />
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

      <AddQuoteDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
