'use client'

import { useWishlistStore } from '@/lib/store/use-wishlist-store'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  ExternalLink,
  Gift,
  Heart,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Input as SearchInput } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddWishDialog } from './wishlist-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const PRIORITY_CONFIG = {
  high: { label: 'Alta', color: '#e05b6d' },
  medium: { label: 'Média', color: '#f0b429' },
  low: { label: 'Baixa', color: '#7bb686' },
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function WishCard({
  item,
  onToggle,
  onDelete,
}: {
  item: import('@/lib/types').WishlistItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const priority = PRIORITY_CONFIG[item.priority]

  return (
    <Card
      glass
      hover
      className={cn(
        'group relative overflow-hidden transition-all',
        item.purchased && 'opacity-70',
      )}
      style={{
        borderTopColor: item.purchased ? '#7bb686' : priority.color,
        borderTopWidth: 3,
      }}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 pb-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
            )}
            style={{
              backgroundColor: (item.purchased ? '#7bb686' : priority.color) + '18',
            }}
          >
            {item.purchased ? (
              <ShoppingBag size={18} style={{ color: '#7bb686' }} />
            ) : (
              <Gift size={18} style={{ color: priority.color }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm flex items-center gap-2 leading-snug">
              {item.name}
              {item.purchased && (
                <Badge variant="outline" className="text-[9px] px-1.5 text-emerald-600 border-emerald-300">
                  <CheckCircle2 size={10} className="mr-0.5" />
                  Adquirido
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {item.price != null && (
                <span className="text-xs font-semibold tabular-nums">{formatPrice(item.price)}</span>
              )}
              {item.category && (
                <span className="text-[10px] text-muted-foreground">{item.category}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggle(item.id)}
            className="rounded-lg p-1 text-muted-foreground/40 hover:text-emerald-500 transition-colors cursor-pointer"
            aria-label={item.purchased ? 'Marcar como não adquirido' : 'Marcar como adquirido'}
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded-lg p-1 text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
            aria-label="Excluir desejo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Badge
          variant="dot"
          className="text-[10px] mb-2"
          style={{ color: priority.color }}
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: priority.color }}
          />
          {priority.label}
        </Badge>

        {item.notes && (
          <p className="text-xs text-muted-foreground/80 mb-2">{item.notes}</p>
        )}

        <div className="flex items-center gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              <ExternalLink size={10} />
              Ver link
            </a>
          )}
          {item.purchasedAt && (
            <span className="text-[9px] text-muted-foreground/50 ml-auto">
              Adquirido em {new Date(item.purchasedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function WishlistPage() {
  const items = useWishlistStore((s) => s.items)
  const togglePurchased = useWishlistStore((s) => s.togglePurchased)
  const deleteItem = useWishlistStore((s) => s.deleteItem)

  const [tab, setTab] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach((i) => i.category && cats.add(i.category))
    return [...cats].sort()
  }, [items])

  const totalCost = useMemo(
    () => items.reduce((acc, i) => acc + (i.price ?? 0), 0),
    [items],
  )
  const purchasedCost = useMemo(
    () => items.filter((i) => i.purchased).reduce((acc, i) => acc + (i.price ?? 0), 0),
    [items],
  )

  const filtered = useMemo(() => {
    let list = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q),
      )
    }

    if (tab === 'all') {
      list.sort((a, b) => {
        if (a.purchased && !b.purchased) return 1
        if (!a.purchased && b.purchased) return -1
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      })
    } else if (tab === 'pending') {
      list = list.filter((i) => !i.purchased)
    } else if (tab === 'purchased') {
      list = list.filter((i) => i.purchased)
    } else if (tab.startsWith('cat-')) {
      const cat = tab.replace('cat-', '')
      list = list.filter((i) => i.category === cat)
    }

    return list
  }, [items, search, tab])

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#e05b6d18' }}
            >
              <Heart size={22} style={{ color: '#e05b6d' }} />
            </span>
            Wishlist
          </h1>
          <p className="text-muted-foreground mt-2">
            Seus desejos e objetivos de compra.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-3.5 py-2 shadow-sm bg-card/60',
              )}
              style={{
                borderColor: totalCost === purchasedCost && totalCost > 0
                  ? '#7bb68660'
                  : 'var(--border-color)',
              }}
            >
              <ShoppingBag size={16} className="text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-sm font-bold tabular-nums">
                  {formatPrice(totalCost - purchasedCost)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">restantes</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {items.filter((i) => !i.purchased).length} itens pendentes
                </p>
              </div>
            </div>
          )}
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Novo desejo
          </Button>
        </div>
      </div>

      <div className={cn('relative mb-6', enter)}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar desejos..."
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <TabList className="mb-4">
          <Tab value="all">
            Todos
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {items.length}
            </span>
          </Tab>
          <Tab value="pending">
            Pendentes
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {items.filter((i) => !i.purchased).length}
            </span>
          </Tab>
          <Tab value="purchased">
            Adquiridos
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {items.filter((i) => i.purchased).length}
            </span>
          </Tab>
          {allCategories.map((c) => (
            <Tab key={c} value={`cat-${c}`}>
              {c}
            </Tab>
          ))}
        </TabList>

        <TabPanel value={tab}>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <WishCard
                  key={item.id}
                  item={item}
                  onToggle={togglePurchased}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Gift size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhum desejo encontrado.' : 'Nenhum desejo ainda. O que você deseja?'}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-1.5" />
                Adicionar desejo
              </Button>
            </div>
          )}
        </TabPanel>
      </Tabs>

      <AddWishDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
