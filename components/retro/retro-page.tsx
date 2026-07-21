'use client'

import { useRetroStore } from '@/lib/store/use-retro-store'
import type { RetrospectiveEntry, RetrospectiveType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Angry,
  CheckCircle2,
  Circle,
  Frown,
  Meh,
  Plus,
  RefreshCw,
  Smile,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddRetroDialog } from './retro-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MOOD_CONFIG = {
  great: { icon: Sparkles, label: 'Excelente', color: '#7bb686' },
  good: { icon: Smile, label: 'Bom', color: '#5b8dbf' },
  neutral: { icon: Meh, label: 'Neutro', color: '#f0b429' },
  bad: { icon: Frown, label: 'Ruim', color: '#e8a0a0' },
  tough: { icon: Angry, label: 'Difícil', color: '#e05b6d' },
} as const

const TYPE_LABELS: Record<RetrospectiveType, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const typeOrder: RetrospectiveType[] = ['daily', 'weekly', 'monthly']

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function RetroCard({ entry, onDelete }: { entry: RetrospectiveEntry; onDelete: (id: string) => void }) {
  const toggleAction = useRetroStore((s) => s.toggleAction)
  const deleteAction = useRetroStore((s) => s.deleteAction)
  const addAction = useRetroStore((s) => s.addAction)
  const [newAction, setNewAction] = useState('')
  const mood = MOOD_CONFIG[entry.mood]
  const MoodIcon = mood.icon

  const dateLabel = entry.endDate
    ? `${formatDate(entry.date)} – ${formatDate(entry.endDate)}`
    : formatDate(entry.date)

  const totalActions = entry.actions.length
  const doneActions = entry.actions.filter((a) => a.done).length

  const handleAddAction = () => {
    if (!newAction.trim()) return
    addAction(entry.id, newAction.trim())
    setNewAction('')
  }

  return (
    <Card glass className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between pb-0 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: mood.color + '18' }}
          >
            <MoodIcon size={20} style={{ color: mood.color }} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              {TYPE_LABELS[entry.type]}
              <Badge
                variant="outline"
                className="text-[10px] font-normal"
                style={{ color: mood.color, borderColor: mood.color + '40' }}
              >
                {mood.label}
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          aria-label="Excluir retrospectiva"
        >
          <Trash2 size={14} />
        </button>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {entry.wentWell.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              O que foi bem
            </p>
            <ul className="space-y-1">
              {entry.wentWell.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.toImprove.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
              <RefreshCw size={12} />
              O que melhorar
            </p>
            <ul className="space-y-1">
              {entry.toImprove.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="mt-0.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.notes && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-border/40 pl-3">
            {entry.notes}
          </p>
        )}

        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              Ações ({doneActions}/{totalActions})
            </p>
          </div>
          <div className="space-y-1">
            {entry.actions.map((action) => (
              <div key={action.id} className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/40 transition-colors">
                <button
                  onClick={() => toggleAction(entry.id, action.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  aria-label={action.done ? 'Desmarcar ação' : 'Concluir ação'}
                >
                  {action.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} />
                  )}
                </button>
                <span
                  className={cn(
                    'text-sm flex-1',
                    action.done && 'line-through text-muted-foreground',
                  )}
                >
                  {action.text}
                </span>
                <button
                  onClick={() => deleteAction(entry.id, action.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
                  aria-label="Excluir ação"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
              placeholder="Nova ação..."
              className="flex-1 bg-transparent text-sm border-b border-border/40 py-1 outline-none placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-xl"
              onClick={handleAddAction}
              disabled={!newAction.trim()}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RetroPage() {
  const entries = useRetroStore((s) => s.entries)
  const deleteEntry = useRetroStore((s) => s.deleteEntry)

  const [tab, setTab] = useState<RetrospectiveType | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = tab === 'all' ? entries : entries.filter((e) => e.type === tab)

  const counts = {
    all: entries.length,
    daily: entries.filter((e) => e.type === 'daily').length,
    weekly: entries.filter((e) => e.type === 'weekly').length,
    monthly: entries.filter((e) => e.type === 'monthly').length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#c9b6e418' }}
            >
              <RefreshCw size={22} style={{ color: '#c9b6e4' }} />
            </span>
            Retrospectiva
          </h1>
          <p className="text-muted-foreground mt-2">
            Reflita sobre seu dia, semana ou mês.
          </p>
        </div>
        <Button
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={15} />
          Nova retrospectiva
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as RetrospectiveType | 'all')} className={enter}>
        <TabList className="mb-4">
          <Tab value="all">
            Todas
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {counts.all}
            </span>
          </Tab>
          <Tab value="daily">
            Diária
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {counts.daily}
            </span>
          </Tab>
          <Tab value="weekly">
            Semanal
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {counts.weekly}
            </span>
          </Tab>
          <Tab value="monthly">
            Mensal
            <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
              {counts.monthly}
            </span>
          </Tab>
        </TabList>

        <TabPanel value={tab}>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...filtered]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((entry) => (
                  <RetroCard key={entry.id} entry={entry} onDelete={deleteEntry} />
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <RefreshCw size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {tab === 'all'
                  ? 'Nenhuma retrospectiva ainda. Comece refletindo sobre seu dia!'
                  : `Nenhuma retrospectiva ${TYPE_LABELS[tab as RetrospectiveType].toLowerCase()} encontrada.`}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-1.5" />
                Criar primeira
              </Button>
            </div>
          )}
        </TabPanel>
      </Tabs>

      <AddRetroDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultType={tab !== 'all' ? (tab as RetrospectiveType) : undefined}
      />
    </div>
  )
}
