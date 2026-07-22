'use client'

import { useRetroStore } from '@/lib/store/use-retro-store'
import type { RetrospectiveEntry, RetrospectiveMood, RetrospectiveType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Angry,
  CalendarDays,
  CheckCircle2,
  Circle,
  Frown,
  Meh,
  PartyPopper,
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
import { Dialog, DialogContent, Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
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

function RetroCard({ entry, onDelete, isNew }: { entry: RetrospectiveEntry; onDelete: (id: string) => void; isNew?: boolean }) {
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
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              isNew && 'animate-[pop_0.5s_ease-out]',
            )}
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
              {isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary animate-[banner-pop_0.5s_ease-out]">
                  <Sparkles size={10} />
                  Nova! Faça sua reflexão
                </span>
              )}
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
        {(entry.wentWell.length === 0 && entry.toImprove.length === 0 && !entry.notes) && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-center">
            <Sparkles size={18} className="mx-auto text-muted-foreground/60 mb-1.5" />
            <p className="text-xs text-muted-foreground">
              Sua retrospectiva foi criada. Toque em “Preencher” no topo para adicionar
              o que foi bem, o que melhorar e ações.
            </p>
          </div>
        )}
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

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TYPE_CREATE_OPTIONS: {
  type: RetrospectiveType
  label: string
  description: string
  icon: typeof CalendarDays
  color: string
}[] = [
  { type: 'daily', label: 'Diária', description: 'Reflexão sobre o seu dia', icon: CalendarDays, color: '#5b8dbf' },
  { type: 'weekly', label: 'Semanal', description: 'Reveja a semana que passou', icon: CalendarDays, color: '#7bb686' },
  { type: 'monthly', label: 'Mensal', description: 'Um balanço completo do mês', icon: CalendarDays, color: '#c9b6e4' },
]

export function RetroPage() {
  const entries = useRetroStore((s) => s.entries)
  const deleteEntry = useRetroStore((s) => s.deleteEntry)
  const addEntry = useRetroStore((s) => s.addEntry)

  const [tab, setTab] = useState<RetrospectiveType | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null)

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={15} />
            Preencher
          </Button>
          <Button
            className="rounded-xl gap-1.5 shadow-md"
            onClick={() => setSelectOpen(true)}
          >
            <Sparkles size={15} />
            Nova retrospectiva
          </Button>
        </div>
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
                  <div
                    key={entry.id}
                    className={cn(
                      entry.id === justCreatedId
                        ? 'animate-[banner-pop_0.6s_ease-out] ring-2 ring-primary/40 rounded-2xl'
                        : '',
                    )}
                  >
                    <RetroCard entry={entry} onDelete={deleteEntry} isNew={entry.id === justCreatedId} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <RefreshCw size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {tab === 'all'
                  ? 'Nenhuma retrospectiva ainda. Selecione qual tipo deseja gerar!'
                  : `Nenhuma retrospectiva ${TYPE_LABELS[tab as RetrospectiveType].toLowerCase()} encontrada.`}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSelectOpen(true)}>
                <Sparkles size={14} className="mr-1.5" />
                Gerar retrospectiva
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

      {/* Modal seletor animado — cria a retrospectiva imediatamente */}
      <Dialog open={selectOpen} onOpenChange={(o) => !o && setSelectOpen(false)}>
        <DialogContent title="Gerar retrospectiva" description="Selecione o período e sua reflexão será criada na hora para você preencher.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPE_CREATE_OPTIONS.map((opt, i) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  const today = dayStr()
                  const startDate =
                    opt.type === 'weekly'
                      ? dayStr(-6)
                      : opt.type === 'monthly'
                        ? dayStr(-29)
                        : today
                  addEntry({
                    type: opt.type,
                    date: startDate,
                    endDate: opt.type !== 'daily' ? today : undefined,
                    mood: 'neutral',
                    wentWell: [],
                    toImprove: [],
                  })
                  // Captura o id da entry recém-criada (sempre é inserida no topo)
                  const newId = useRetroStore.getState().entries[0]?.id ?? null
                  setJustCreatedId(newId)
                  setTimeout(() => setJustCreatedId(null), 3500)
                  setSelectOpen(false)
                  setTab(opt.type)
                }}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-transparent cursor-pointer"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="flex size-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: opt.color + '18' }}
                >
                  <PartyPopper size={20} style={{ color: opt.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: opt.color }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {opt.description}
                  </p>
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: opt.color + '20', color: opt.color }}
                >
                  <Plus size={10} />
                  Criar agora
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
