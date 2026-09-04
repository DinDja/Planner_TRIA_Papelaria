'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useFinanceStore } from '@/lib/store/use-finance-store'
import { isoDia, useDiarioStore } from '@/lib/diario/use-diario-store'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Flame,
  FolderOpen,
  NotebookPen,
  Pencil,
  Star,
  Target,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DeletePlannerDialog } from '../planners/delete-planner-dialog'
import { CalendarEventDialog } from '../calendar/calendar-dialogs'
import { GoalDialog } from '../finance/finance-dialogs'
import { CreatePlannerDialog } from './create-planner-dialog'

const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

export function DashboardPage() {
  const planners = useAppStore((s) => s.planners)
  const [editTarget, setEditTarget] = useState<Planner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Planner | null>(null)
  const favorites = planners.filter((p) => p.favorite)
  const recents = [...planners].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const registros = useDiarioStore((s) => s.registros)
  const calendarEvents = useCalendarStore((s) => s.events)
  const deleteEvent = useCalendarStore((s) => s.deleteEvent)
  const goals = useFinanceStore((s) => s.goals)
  const deleteGoal = useFinanceStore((s) => s.deleteGoal)
  const [eventEditId, setEventEditId] = useState<string | undefined>()
  const [goalEditId, setGoalEditId] = useState<string | undefined>()

  const now = new Date()
  const todayISO = isoDia(now)
  const agenda = useMemo(
    () =>
      calendarEvents
        .filter((event) => event.date === todayISO)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [calendarEvents, todayISO],
  )

  const activity = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now)
        date.setHours(12, 0, 0, 0)
        date.setDate(now.getDate() - (6 - index))
        const dateISO = isoDia(date)
        return {
          day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          count: registros.filter((registro) => registro.data === dateISO).length,
        }
      }),
    [registros, todayISO],
  )
  const maxActivity = Math.max(...activity.map((day) => day.count), 1)
  const recordsThisWeek = activity.reduce((total, day) => total + day.count, 0)

  const currentStreak = useMemo(() => {
    const dailyRecords = new Set(
      registros.filter((registro) => registro.periodo === 'dia').map((registro) => registro.data),
    )
    let streak = 0
    const date = new Date(now)
    date.setHours(12, 0, 0, 0)
    while (dailyRecords.has(isoDia(date))) {
      streak += 1
      date.setDate(date.getDate() - 1)
    }
    return streak
  }, [registros, todayISO])

  const totalPages = planners.reduce((total, planner) => total + planner.pages.length, 0)

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  // Mini calendar
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const year = now.getFullYear()
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const firstDay = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7
  const today = now.getDate()

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">usuário</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {(new Date()).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Planners', value: planners.length, icon: FolderOpen, color: '#d1bdb8' },
          { label: 'Páginas', value: totalPages, icon: NotebookPen, color: '#6a634d' },
          { label: 'Registros na semana', value: recordsThisWeek, icon: Clock, color: '#b76f06' },
          { label: 'Dias de streak', value: currentStreak, icon: Flame, color: '#d1bdb8' },
        ].map((stat) => (
          <Card key={stat.label} glass hover className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: stat.color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-0.5">{stat.value}</p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.color + '18' }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content: Recent + Favorites */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recents */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Planners recentes</CardTitle>
              <Link href="/planners" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 pt-3">
              {recents.length > 0 ? (
                recents.slice(0, 6).map((planner) => (
                  <Link
                    key={planner.id}
                    href={`/planner/${planner.id}`}
                    className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border/60 p-4 hover:shadow-md hover:border-border transition-all duration-200"
                  >
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setEditTarget(planner) }}
                        className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-primary cursor-pointer"
                        aria-label={`Editar ${planner.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeleteTarget(planner) }}
                        className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-destructive cursor-pointer"
                        aria-label={`Excluir ${planner.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div
                      className="flex size-12 items-center justify-center rounded-2xl text-white text-lg font-bold group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: planner.color }}
                    >
                      {planner.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{planner.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {planner.pages.length} páginas
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                  Nenhum planner cadastrado.
                </p>
              )}
            </div>
          </Card>

          {/* Favorites */}
          {favorites.length > 0 && (
            <Card glass>
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star size={16} className="text-warning fill-warning" />
                  Favoritos
                </CardTitle>
              </CardHeader>
              <div className="flex gap-3 p-5 pt-3 overflow-auto scrollbar-thin">
                {favorites.map((planner) => (
                  <Link
                    key={planner.id}
                    href={`/planner/${planner.id}`}
                    className="group relative flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 p-4 w-28 hover:shadow-md hover:border-border transition-all duration-200"
                  >
                    <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setEditTarget(planner) }}
                        className="rounded-md bg-background/90 p-1 text-muted-foreground shadow-sm hover:text-primary cursor-pointer"
                        aria-label={`Editar ${planner.name}`}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setDeleteTarget(planner) }}
                        className="rounded-md bg-background/90 p-1 text-muted-foreground shadow-sm hover:text-destructive cursor-pointer"
                        aria-label={`Excluir ${planner.name}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div
                      className="flex size-14 items-center justify-center rounded-2xl text-white text-xl font-bold"
                      style={{ backgroundColor: planner.color }}
                    >
                      {planner.name[0]}
                    </div>
                    <p className="text-[11px] font-medium text-center truncate w-full">
                      {planner.name}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Activity chart */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Atividade semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {activity.map((day) => {
                  const h = (day.count / maxActivity) * 100
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {day.count} {day.count === 1 ? 'registro' : 'registros'}
                      </span>
                      <div
                        className="w-full rounded-t-xl transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          backgroundColor: day.count > 0 ? '#6a634d' : '#ddd6c6',
                          opacity: 0.8,
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground">{day.day}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar content */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card glass>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold capitalize">
                {monthName} {year}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <span key={d} className="text-[10px] font-semibold text-muted-foreground py-1">
                  {d}
                </span>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1
                const isToday = d === today
                return (
                  <div
                    key={d}
                    className={cn(
                      'text-xs py-1.5 rounded-lg transition-colors',
                      isToday
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Agenda */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Agenda de hoje
              </CardTitle>
            </CardHeader>
            <div className="px-5 py-3">
              {agenda.length > 0 ? (
                <div className="space-y-2">
                  {agenda.map((event) => (
                    <div
                      key={event.id}
                      className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex flex-col items-center shrink-0 w-12">
                        <span className="text-xs font-semibold">{event.startTime}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {event.allDay ? 'dia todo' : event.endTime ?? ''}
                        </span>
                      </div>
                      <div className="w-0.5 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <span className="min-w-0 flex-1 truncate text-sm">{event.title}</span>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEventEditId(event.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                          aria-label={`Editar ${event.title}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEvent(event.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          aria-label={`Excluir ${event.title}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento para hoje.
                </p>
              )}
            </div>
          </Card>

          {/* Goals */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-success" />
                Objetivos
              </CardTitle>
            </CardHeader>
            <div className="px-5 pb-3 space-y-3">
              {goals.length > 0 ? (
                goals.map((goal) => {
                  const pct = goal.targetAmount > 0
                    ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                    : 0
                  return (
                    <div key={goal.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="min-w-0 truncate text-xs font-medium">{goal.title}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">
                            {formatBRL(goal.currentAmount)}/{formatBRL(goal.targetAmount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGoalEditId(goal.id)}
                            className="rounded-md p-1 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:bg-primary/10 hover:text-primary cursor-pointer"
                            aria-label={`Editar ${goal.title}`}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGoal(goal.id)}
                            className="rounded-md p-1 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            aria-label={`Excluir ${goal.title}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum objetivo cadastrado.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <CreatePlannerDialog
        open={editTarget !== null}
        editId={editTarget?.id}
        onClose={() => setEditTarget(null)}
      />
      <DeletePlannerDialog planner={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <CalendarEventDialog
        open={eventEditId !== undefined}
        editId={eventEditId}
        onClose={() => setEventEditId(undefined)}
      />
      <GoalDialog
        open={goalEditId !== undefined}
        editId={goalEditId}
        onClose={() => setGoalEditId(undefined)}
      />
    </div>
  )
}
