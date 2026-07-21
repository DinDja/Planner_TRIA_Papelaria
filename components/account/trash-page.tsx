'use client'

import { useTrashStore, type TrashItem } from '@/lib/store/use-trash-store'
import { cn } from '@/lib/utils'
import {
  Trash2,
  RotateCcw,
  Trash,
  FileText,
  Bookmark,
  KeyRound,
  HeartPulse,
  ClipboardList,
  Box,
} from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from '../ui/toaster'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MODULE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  checklists: ClipboardList,
  frases: Bookmark,
  memorias: Box,
  cofre: KeyRound,
  saude: HeartPulse,
  wishlist: FileText,
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora há pouco'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function TrashCard({ item, onDelete, onRestore }: {
  item: TrashItem
  onDelete: () => void
  onRestore: () => void
}) {
  const Icon = MODULE_ICONS[item.originalModule] || FileText

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground capitalize">{item.originalModule}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formatTime(item.deletedAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl text-muted-foreground hover:text-green-500"
          onClick={onRestore}
          aria-label="Restaurar"
        >
          <RotateCcw size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Excluir permanentemente"
        >
          <Trash size={15} />
        </Button>
      </div>
    </div>
  )
}

export function TrashPage() {
  const items = useTrashStore((s) => s.items)
  const removeItem = useTrashStore((s) => s.removeItem)
  const clearAll = useTrashStore((s) => s.clearAll)

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <div className={cn('mb-8', enter)}>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#ef444418' }}>
            <Trash2 size={22} style={{ color: '#ef4444' }} />
          </span>
          Lixeira
        </h1>
        <p className="text-muted-foreground mt-1">Itens removidos recentemente.</p>
      </div>

      {items.length === 0 ? (
        <div className={cn('flex flex-col items-center justify-center py-16 text-center', enter)}>
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Trash2 size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">A lixeira está vazia.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Itens excluídos aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          <div className={cn('flex items-center justify-between mb-4', enter)}>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive"
              onClick={() => {
                clearAll()
                toast({ title: 'Lixeira esvaziada', variant: 'success' })
              }}
            >
              <Trash size={14} className="mr-1.5" />
              Esvaziar lixeira
            </Button>
          </div>
          <div className={cn('flex flex-col gap-2', enter)}>
            {items.map((item) => (
              <TrashCard
                key={item.id}
                item={item}
                onDelete={() => removeItem(item.id)}
                onRestore={() => {
                  removeItem(item.id)
                  toast({
                    title: 'Item restaurado',
                    description: `"${item.label}" foi restaurado.`,
                    variant: 'success',
                  })
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
