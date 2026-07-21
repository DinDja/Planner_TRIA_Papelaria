'use client'

import { useHabitsStore } from '@/lib/store/use-habits-store'
import { cn } from '@/lib/utils'
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Flame,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { AddHabitDialog } from './habit-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Mini heatmap (últimos 35 dias) ───────────────────────────────────────────

function MiniHeatmap({ habitId }: { habitId: string }) {
  const isCompleted = useHabitsStore((s) => s.isCompleted)

  const days = useMemo(() => {
    const result: { date: string; day: number; isToday: boolean }[] = []
    const today = new Date()
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      result.push({
        date: `${y}-${m}-${day}`,
        day: d.getDate(),
        isToday: i === 0,
      })
    }
    return result
  }, [])

  return (
    <div className="flex gap-[2px] items-end flex-wrap">
      {days.map((d) => {
        const done = isCompleted(habitId, d.date)
        return (
          <div
            key={d.date}
            className={cn(
              'size-[10px] rounded-sm transition-colors',
              d.isToday && 'ring-1 ring-foreground/50',
              done ? 'bg-emerald-500' : 'bg-muted/40',
            )}
            title={`${d.date}${done ? ' ✓' : ''}`}
          />
        )
      })}
    </div>
  )
}

// ─── Card de hábito ───────────────────────────────────────────────────────────

function HabitCard({
  habit,
}: {
  habit: { id: string; name: string; color: string; frequency: string; archived: boolean }
}) {
  const toggleLog = useHabitsStore((s) => s.toggleLog)
  const isCompleted = useHabitsStore((s) => s.isCompleted)
  const getStreak = useHabitsStore((s) => s.getStreak)
  const archiveHabit = useHabitsStore((s) => s.archiveHabit)
  const deleteHabit = useHabitsStore((s) => s.deleteHabit)
  const getCompletionCount = useHabitsStore((s) => s.getCompletionCount)

  const today = todayStr()
  const doneToday = isCompleted(habit.id, today)
  const streak = getStreak(habit.id)

  const monthStart = todayStr().slice(0, 7) + '-01'
  const monthEnd = todayStr()
  const monthCount = getCompletionCount(habit.id, monthStart, monthEnd)
  const daysInMonth = new Date().getDate()
  const monthPct = Math.round((monthCount / daysInMonth) * 100)

  const freqLabel =
    habit.frequency === 'daily'
      ? 'Diário'
      : habit.frequency === 'weekly'
        ? 'Semanal'
        : 'Mensal'

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/50 bg-card/80 p-4 transition-all duration-300 hover:shadow-lift hover:border-transparent',
        habit.archived && 'opacity-60',
      )}
    >
      {/* Indicador de cor e toggle de hoje */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => toggleLog(habit.id, today)}
          className={cn(
            'shrink-0 transition-all duration-300 cursor-pointer',
            doneToday
              ? 'scale-110'
              : 'hover:scale-105',
          )}
          aria-label={doneToday ? 'Desmarcar hoje' : 'Marcar hoje'}
        >
          {doneToday ? (
            <CheckCircle2 size={44} className="drop-shadow-md" style={{ color: habit.color }} />
          ) : (
            <div
              className="flex size-11 items-center justify-center rounded-2xl border-2 border-dashed transition-colors hover:border-solid"
              style={{ borderColor: habit.color + '60' }}
            >
              <Target size={18} style={{ color: habit.color + '80' }} />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold truncate">{habit.name}</p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
              {freqLabel}
            </Badge>
          </div>

          {/* Streak + monthly % */}
          <div className="flex items-center gap-4 mt-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame size={13} className={cn(streak > 0 ? 'text-orange-500' : 'text-muted-foreground/50')} />
              <span className={cn('font-semibold tabular-nums', streak > 0 && 'text-orange-500')}>
                {streak}
              </span>
              <span className="text-[10px]">dias</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp size={13} className={monthPct > 50 ? 'text-emerald-500' : ''} />
              <span className="font-semibold tabular-nums">{monthPct}%</span>
              <span className="text-[10px]">este mês</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              archiveHabit(habit.id)
              toast({ title: habit.archived ? 'Hábito ativado' : 'Hábito arquivado', variant: 'success' })
            }}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            aria-label={habit.archived ? 'Ativar' : 'Arquivar'}
          >
            {habit.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          </button>
          <button
            onClick={() => {
              deleteHabit(habit.id)
              toast({ title: 'Hábito excluído', variant: 'success' })
            }}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Mini heatmap */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Últimos 35 dias</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {monthCount}/{daysInMonth} dias
          </span>
        </div>
        <MiniHeatmap habitId={habit.id} />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function HabitsPage() {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const getStreak = useHabitsStore((s) => s.getStreak)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')

  const today = todayStr()
  const todayDone = logs.filter((l) => l.date === today && l.completed).length

  const activeHabits = habits.filter((h) => !h.archived)
  const displayed = filter === 'all' ? habits : filter === 'archived' ? habits.filter((h) => h.archived) : activeHabits

  const bestStreak = useMemo(() => {
    let best = 0
    for (const h of habits) {
      const s = getStreak(h.id)
      if (s > best) best = s
    }
    return best
  }, [habits, getStreak])

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#7bb68618' }}>
              <Target size={22} style={{ color: '#7bb686' }} />
            </span>
            Hábitos
          </h1>
          <p className="text-muted-foreground mt-2">
            {activeHabits.length} hábitos ativos · {habits.length} total
          </p>
        </div>
        <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setDialogOpen(true)}>
          <Plus size={15} />
          Novo hábito
        </Button>
      </div>

      {/* Stats */}
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mb-8', enter)}>
        {[
          { label: 'Hábitos ativos', value: activeHabits.length, icon: Target, color: '#7bb686' },
          { label: 'Feitos hoje', value: todayDone, icon: CheckCircle2, color: '#5b8dbf' },
          { label: 'Melhor sequência', value: `${bestStreak} dias`, icon: Flame, color: '#f0b429' },
          { label: 'Total de registros', value: logs.length, icon: TrendingUp, color: '#c9b6e4' },
        ].map((s) => (
          <Card key={s.label} glass hover className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums">{s.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.color + '18' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className={cn('flex items-center gap-1.5 mb-5', enter)}>
        {(['active', 'archived', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
              filter === f ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted/50')}>
            {f === 'active' ? 'Ativos' : f === 'archived' ? 'Arquivados' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Grid de hábitos */}
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', enter)}>
        {displayed.length > 0 ? displayed.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        )) : (
          <div className="col-span-full">
            <Card glass>
              <p className="text-sm text-muted-foreground text-center py-12">
                {filter === 'archived' ? 'Nenhum hábito arquivado.' : 'Nenhum hábito ainda. Crie seu primeiro hábito!'}
              </p>
            </Card>
          </div>
        )}
      </div>

      <AddHabitDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
