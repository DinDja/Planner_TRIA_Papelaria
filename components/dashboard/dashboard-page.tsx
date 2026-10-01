'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useHealthStore } from '@/lib/store/use-health-store'
import { useRoutineStore } from '@/lib/store/use-routine-store'
import { isoDia } from '@/lib/diario/use-diario-store'
import { useProfileStore } from '@/lib/store/use-profile-store'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  HeartPulse,
  NotebookPen,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DeletePlannerDialog } from '../planners/delete-planner-dialog'
import { CalendarEventDialog } from '../calendar/calendar-dialogs'
import { CreatePlannerDialog } from './create-planner-dialog'

function HabitsSummary({ todayISO }: { todayISO: string }) {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const toggleLog = useHabitsStore((s) => s.toggleLog)
  const activeHabits = habits.filter((habit) => !habit.archived)

  return (
    <Card glass className="min-h-[220px]">
      <CardHeader className="flex-row items-center justify-between pb-0">
        <CardTitle className="text-base">Hábitos</CardTitle>
        <Link href="/habitos" className="flex items-center gap-1 text-xs text-primary hover:underline">
          Ver todos <ArrowUpRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        {activeHabits.length > 0 ? (
          <div className="space-y-1">
            {activeHabits.slice(0, 4).map((habit) => {
              const done = logs.some(
                (log) => log.habitId === habit.id && log.date === todayISO && log.completed,
              )

              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleLog(habit.id, todayISO)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/40 cursor-pointer"
                  aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${habit.name} hoje`}
                >
                  {done ? (
                    <CheckCircle2 size={18} style={{ color: habit.color }} />
                  ) : (
                    <span
                      className="size-[18px] shrink-0 rounded-full border-2 border-dashed"
                      style={{ borderColor: `${habit.color}80` }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {done ? 'feito' : 'hoje'}
                  </span>
                </button>
              )
            })}
            {activeHabits.length > 4 && (
              <p className="px-2 pt-1 text-[11px] text-muted-foreground">
                + {activeHabits.length - 4} hábitos na sua lista
              </p>
            )}
          </div>
        ) : (
          <div className="flex min-h-[155px] flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Nenhum hábito cadastrado.</p>
            <Link href="/habitos" className="mt-2 text-xs text-primary hover:underline">
              Criar primeiro hábito
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const profileName = useProfileStore((s) => s.name)
  const planners = useAppStore((s) => s.planners)
  const [editTarget, setEditTarget] = useState<Planner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Planner | null>(null)
  const favorites = planners.filter((p) => p.favorite)
  const calendarEvents = useCalendarStore((s) => s.events)
  const deleteEvent = useCalendarStore((s) => s.deleteEvent)
  const birthdays = useBirthdaysStore((s) => s.entries)
  const tasks = useRoutineStore((s) => s.tasks)
  const recurringTasks = useRoutineStore((s) => s.recurringTasks)
  const pendingItems = useRoutineStore((s) => s.pendingItems)
  const appointments = useHealthStore((s) => s.appointments)
  const exams = useHealthStore((s) => s.exams)
  const [eventEditId, setEventEditId] = useState<string | undefined>()

  const now = new Date()
  const todayISO = isoDia(now)
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const year = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentMonthKey = `${year}-${String(currentMonth).padStart(2, '0')}`
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const firstDay = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7
  const today = now.getDate()
  const todayEvents = useMemo(
    () =>
      calendarEvents
        .filter((event) => event.date === todayISO)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [calendarEvents, todayISO],
  )

  const monthlyBirthdays = useMemo(() => {
    return birthdays
      .map((entry) => {
        const [, month, day] = entry.date.split('-').map(Number)
        return { ...entry, month, day }
      })
      .filter((entry) => entry.month === currentMonth)
      .sort((a, b) => a.day - b.day)
      .slice(0, 5)
  }, [birthdays, currentMonth])

  const monthlyHealthRecords = useMemo(() => [
    ...appointments
      .filter((appointment) => appointment.date.startsWith(currentMonthKey))
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        title: appointment.doctorName,
        detail: `Consulta · ${appointment.specialty}`,
        date: appointment.date,
        time: appointment.time,
        color: 'var(--primary)',
      })),
    ...exams
      .filter((exam) => exam.date.startsWith(currentMonthKey))
      .map((exam) => ({
        id: `exam-${exam.id}`,
        title: exam.name,
        detail: 'Exame pendente',
        date: exam.date,
        time: exam.time,
        color: exam.color,
      })),
  ].sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`)).slice(0, 8),
    [appointments, exams, currentMonthKey],
  )

  const taskCount = tasks.length + recurringTasks.filter((task) => task.active).length + pendingItems.length
  const healthRecordCount = monthlyHealthRecords.length

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const displayName = profileName.trim() || user?.displayName?.trim() || user?.email?.split('@')[0] || 'usuário'

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">{displayName}</span>
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tarefas', value: taskCount, icon: CheckCircle2, color: '#d1bdb8' },
          { label: 'Aniversários', value: monthlyBirthdays.length, icon: NotebookPen, color: '#6a634d' },
          { label: 'Consultas e Exames', value: healthRecordCount, icon: HeartPulse, color: '#d1bdb8' },
        ].map((stat) => (
          <Card key={stat.label} glass hover className="relative h-full overflow-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Coluna esquerda: agenda, tarefas, favoritos e hábitos */}
        <div className="min-w-0 space-y-6">
          {/* Agenda diária */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Agenda diária
              </CardTitle>
              <Link href="/calendario" className="text-xs text-primary hover:underline">Ver agenda</Link>
            </CardHeader>
            <div className="px-5 py-3">
              {todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.map((event) => (
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
                      <div className="flex shrink-0 items-center gap-0.5">
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
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento para hoje.</p>
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
                    <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5">
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

          <HabitsSummary todayISO={todayISO} />
        </div>

        {/* Coluna direita: aniversários e consultas/exames */}
        <div className="min-w-0 space-y-6">
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

          {/* Aniversários */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <NotebookPen size={16} className="text-primary" />
                Aniversários
              </CardTitle>
              <Link href="/aniversarios" className="text-xs text-primary hover:underline">Ver todos</Link>
            </CardHeader>
            <div className="px-5 py-3">
              {monthlyBirthdays.length > 0 ? (
                <div className="space-y-1">
                  {monthlyBirthdays.map((birthday) => (
                    <div key={birthday.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: birthday.color }} />
                      <span className="min-w-0 flex-1 truncate text-sm">{birthday.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {`${String(birthday.day).padStart(2, '0')}/${String(birthday.month).padStart(2, '0')}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversário cadastrado.</p>
              )}
            </div>
          </Card>

          {/* Consultas e exames */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse size={16} className="text-primary" />
                Consultas e exames
              </CardTitle>
              <Link href="/saude" className="text-xs text-primary hover:underline">Ver todos</Link>
            </CardHeader>
            <div className="px-5 py-3">
              {monthlyHealthRecords.length > 0 ? (
                <div className="space-y-1">
                  {monthlyHealthRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: record.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{record.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{record.detail}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        {record.time ? ` · ${record.time}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma consulta ou exame neste mês.</p>
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
    </div>
  )
}
