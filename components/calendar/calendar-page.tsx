'use client'

import { useCalendarPlannerStore, EMPTY_CALENDAR_WEEK } from '@/lib/store/use-calendar-planner-store'
import type { CalendarPlannerWeek } from '@/lib/store/use-calendar-planner-store'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useRoutineStore } from '@/lib/store/use-routine-store'
import type { CalendarEvent, Habit, RecurringTask, Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ListTodo, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { AddRecurringDialog, AddTaskDialog, RoutineTodayDialog } from '../routine/routine-dialogs'
import { PRIORITY_COLORS } from '../routine/shared'
import { CalendarEventDialog } from './calendar-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const HABIT_DAY_HEADERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

type CalendarView = 'day' | 'week' | 'month'

const VIEW_OPTIONS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Diária' },
  { id: 'week', label: 'Semanal' },
  { id: 'month', label: 'Mensal' },
]

const dateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const toDateKey = (date: Date) => dateKey(date.getFullYear(), date.getMonth(), date.getDate())
const todayKey = () => toDateKey(new Date())

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  start.setHours(12, 0, 0, 0)
  return start
}

function getWeekDays(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

interface CalendarCell {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const weeks: CalendarCell[][] = []
  let week: CalendarCell[] = []

  for (let index = firstDay - 1; index >= 0; index--) {
    week.push({
      day: daysInPreviousMonth - index,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push({ day, month, year, isCurrentMonth: true })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    let nextDay = 1
    while (week.length < 7) {
      week.push({
        day: nextDay++,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      })
    }
    weeks.push(week)
  }

  return weeks
}

function formatDayTitle(date: Date) {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
}

function formatWeekTitle(date: Date) {
  const days = getWeekDays(date)
  const start = days[0]
  const end = days[6]
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} de ${MONTHS[end.getMonth()]} de ${end.getFullYear()}`
  }
  return `${start.getDate()} de ${MONTHS[start.getMonth()]} de ${start.getFullYear()} – ${end.getDate()} de ${MONTHS[end.getMonth()]} de ${end.getFullYear()}`
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
    return (a.startTime ?? '').localeCompare(b.startTime ?? '')
  })
}

function EventChip({ event, onClick, past = false }: { event: CalendarEvent; onClick: () => void; past?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full truncate rounded-sm border-l-2 px-2 py-1 text-left text-[11px] font-medium transition-colors hover:bg-primary/[0.06] cursor-pointer',
        past && 'opacity-60',
      )}
      style={{ borderLeftColor: event.color }}
    >
      <span className="text-foreground/65">
        {event.allDay ? 'Dia inteiro · ' : event.startTime ? `${event.startTime} · ` : ''}
      </span>
      {event.title}
    </button>
  )
}

type RoutineCalendarItem =
  | { kind: 'task'; task: Task }
  | { kind: 'recurring'; task: RecurringTask }

function sortRoutineItems(items: RoutineCalendarItem[]) {
  return [...items].sort((a, b) => (a.task.time ?? '').localeCompare(b.task.time ?? ''))
}

function RoutineTaskChip({
  item,
  onComplete,
  past = false,
}: {
  item: RoutineCalendarItem
  onComplete: (item: RoutineCalendarItem) => void
  past?: boolean
}) {
  const task = item.task
  const done = item.kind === 'task' && item.task.done
  const color = PRIORITY_COLORS[task.priority]

  return (
    <button
      type="button"
      onClick={() => onComplete(item)}
      className={cn(
        'w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-all hover:brightness-110 cursor-pointer',
        (past || done) && 'opacity-60',
        done && 'line-through',
      )}
      style={{
        backgroundColor: color + '18',
        color,
        borderLeft: `2.5px solid ${color}`,
      }}
      title={item.kind === 'recurring' ? 'Concluir ocorrência da rotina' : undefined}
    >
      <span className="mr-1 opacity-70">{item.kind === 'recurring' ? '↻' : done ? '✓' : '○'}</span>
      {task.time ? `${task.time} ` : ''}{task.title}
    </button>
  )
}

function TaskCount({ count, compact = false }: { count: number; compact?: boolean }) {
  if (count === 0) return null
  return (
    <span
      title={`${count} ${count === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`}
      className={cn(
        'inline-flex items-center gap-1 text-[10px] text-muted-foreground',
        compact && 'gap-0.5 rounded-full border border-border/50 px-1.5 py-0.5',
      )}
    >
      <ListTodo size={compact ? 9 : 11} />
      {compact ? count : `${count} ${count === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`}
    </span>
  )
}

function MonthlyCalendarView({
  weeks,
  today,
  eventsByDate,
  routineByDate,
  onAdd,
  onEdit,
  onCompleteRoutine,
}: {
  weeks: CalendarCell[][]
  today: string
  eventsByDate: Map<string, CalendarEvent[]>
  routineByDate: Map<string, RoutineCalendarItem[]>
  onAdd: (date: string) => void
  onEdit: (id: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  return (
    <Card glass className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-border/20 last:border-0">
            {week.map((cell) => {
              const key = dateKey(cell.year, cell.month, cell.day)
              const dayEvents = sortEvents(eventsByDate.get(key) ?? [])
              const routineItems = sortRoutineItems(routineByDate.get(key) ?? [])
              const taskCount = routineItems.filter(
                (item) => item.kind === 'recurring' || !item.task.done,
              ).length
              const isToday = key === today
              const isPast = key < today
              const visibleEvents = dayEvents.slice(0, 3)
              const visibleRoutine = routineItems.slice(0, Math.max(0, 3 - visibleEvents.length))
              const hiddenCount = dayEvents.length + routineItems.length - visibleEvents.length - visibleRoutine.length

              return (
                <div
                  key={key}
                  className={cn(
                    'group relative min-h-[100px] border-r border-border/20 p-1.5 transition-colors last:border-0',
                    !cell.isCurrentMonth && 'bg-muted/15',
                    isToday && 'bg-primary/[0.04]',
                  )}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className={cn(
                      'inline-flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
                      isToday
                        ? 'bg-primary font-bold text-primary-foreground shadow-md'
                        : cell.isCurrentMonth
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground/50',
                    )}>
                      {cell.day}
                    </span>
                    <TaskCount count={taskCount} compact />
                  </div>

                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEdit(event.id)}
                        className={cn(
                          'w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-all hover:brightness-110 cursor-pointer',
                          isPast && 'opacity-60',
                        )}
                        style={{
                          backgroundColor: event.color + '20',
                          color: event.color,
                          borderLeft: `2.5px solid ${event.color}`,
                        }}
                      >
                        {event.allDay ? event.title : `${event.startTime} ${event.title}`}
                      </button>
                    ))}
                    {visibleRoutine.map((item) => (
                      <RoutineTaskChip
                        key={`${item.kind}-${item.task.id}`}
                        item={item}
                        past={isPast}
                        onComplete={onCompleteRoutine}
                      />
                    ))}
                    {hiddenCount > 0 && (
                      <p className="pl-1.5 text-[10px] font-medium text-muted-foreground">
                        +{hiddenCount} mais
                      </p>
                    )}
                  </div>

                  {cell.isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => onAdd(key)}
                      className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-muted cursor-pointer"
                      aria-label="Adicionar evento"
                    >
                      <Plus size={12} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

function PlannerDayBlock({
  date,
  notes,
  events,
  routineItems,
  today,
  onNoteChange,
  onAdd,
  onEdit,
  onCompleteRoutine,
}: {
  date: Date
  notes: string[]
  events: CalendarEvent[]
  routineItems: RoutineCalendarItem[]
  today: string
  onNoteChange: (index: number, value: string) => void
  onAdd: (date: string) => void
  onEdit: (id: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  const key = toDateKey(date)
  const isToday = key === today
  const sortedEvents = sortEvents(events)
  const sortedRoutineItems = sortRoutineItems(routineItems)
  const taskCount = sortedRoutineItems.filter(
    (item) => item.kind === 'recurring' || !item.task.done,
  ).length
  const noteLines = Array.from({ length: 5 }, (_, index) => notes[index] ?? '')

  return (
    <section className={cn(
      'group rounded-sm border border-primary/15 bg-background/55 px-4 pb-4 pt-3 transition-colors hover:border-primary/25 sm:px-5',
      isToday && 'border-primary/35 bg-primary/[0.025]',
    )}>
      <div className="mb-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onAdd(key)}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-primary/[0.045] text-sm font-medium tabular-nums text-foreground/75 transition-colors hover:border-primary/40 hover:bg-primary/[0.08] cursor-pointer',
            isToday && 'border-primary/45 bg-primary/[0.10] text-primary',
          )}
          aria-label={`Adicionar evento em ${formatDayTitle(date)}`}
        >
          {String(date.getDate()).padStart(2, '0')}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium capitalize tracking-wide text-muted-foreground">{DAY_NAMES[date.getDay()]}</p>
          {taskCount > 0 && <TaskCount count={taskCount} compact />}
        </div>
        <button
          type="button"
          onClick={() => onAdd(key)}
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground/45 opacity-0 transition-all hover:bg-primary/[0.06] hover:text-foreground group-hover:opacity-100 cursor-pointer"
          aria-label="Adicionar evento"
        >
          <Plus size={13} />
        </button>
      </div>

      {sortedEvents.length > 0 && (
        <div className="mb-2 space-y-0.5 border-b border-primary/10 pb-2">
          {sortedEvents.map((event) => (
            <EventChip key={event.id} event={event} past={key < today} onClick={() => onEdit(event.id)} />
          ))}
          {sortedRoutineItems.map((item) => (
            <RoutineTaskChip
              key={`${item.kind}-${item.task.id}`}
              item={item}
              past={key < today}
              onComplete={onCompleteRoutine}
            />
          ))}
        </div>
      )}

      {sortedEvents.length === 0 && sortedRoutineItems.length > 0 && (
        <div className="mb-2 space-y-0.5 border-b border-primary/10 pb-2">
          {sortedRoutineItems.map((item) => (
            <RoutineTaskChip
              key={`${item.kind}-${item.task.id}`}
              item={item}
              past={key < today}
              onComplete={onCompleteRoutine}
            />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {noteLines.map((note, index) => (
          <label key={index} className="flex items-center gap-2.5">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary/30" />
            <input
              value={note}
              onChange={(event) => onNoteChange(index, event.target.value)}
              aria-label={`Anotação ${index + 1} de ${formatDayTitle(date)}`}
              className="min-w-0 flex-1 border-0 border-b border-dashed border-muted-foreground/20 bg-transparent px-0 py-0.5 text-xs text-foreground/75 outline-none placeholder:text-transparent focus:border-primary/45"
              placeholder=" "
            />
          </label>
        ))}
      </div>
    </section>
  )
}

function PlannerDays({
  days,
  plannerWeeks,
  eventsByDate,
  routineByDate,
  today,
  onNoteChange,
  onAdd,
  onEdit,
  onCompleteRoutine,
}: {
  days: Date[]
  plannerWeeks: Record<string, CalendarPlannerWeek>
  eventsByDate: Map<string, CalendarEvent[]>
  routineByDate: Map<string, RoutineCalendarItem[]>
  today: string
  onNoteChange: (weekKey: string, date: string, index: number, value: string) => void
  onAdd: (date: string) => void
  onEdit: (id: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-7 md:gap-y-6">
      {days.map((date, index) => {
        const key = toDateKey(date)
        const dayWeekKey = toDateKey(startOfWeek(date))
        return (
          <div key={key} className={index === days.length - 1 && days.length % 2 === 1 ? 'md:col-span-2' : undefined}>
            <PlannerDayBlock
              date={date}
              notes={plannerWeeks[dayWeekKey]?.notesByDate[key] ?? []}
              events={eventsByDate.get(key) ?? []}
              routineItems={routineByDate.get(key) ?? []}
              today={today}
              onNoteChange={(noteIndex, value) => onNoteChange(dayWeekKey, key, noteIndex, value)}
              onAdd={onAdd}
              onEdit={onEdit}
              onCompleteRoutine={onCompleteRoutine}
            />
          </div>
        )
      })}
    </div>
  )
}

function PlannerFooter({ weekKey, weekDays }: { weekKey: string; weekDays: Date[] }) {
  const week = useCalendarPlannerStore((state) => state.weeks[weekKey]) ?? EMPTY_CALENDAR_WEEK
  const setObjective = useCalendarPlannerStore((state) => state.setObjective)
  const setGratitude = useCalendarPlannerStore((state) => state.setGratitude)
  const habits = useHabitsStore((state) => state.habits)
  const logs = useHabitsStore((state) => state.logs)
  const toggleLog = useHabitsStore((state) => state.toggleLog)

  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived).slice(0, 4), [habits])
  const habitDays = [...weekDays.slice(1), weekDays[0]]

  return (
    <div className="mt-10 space-y-8">
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Objetivos da Semana</h2>
        <div className="grid grid-cols-1 gap-x-7 gap-y-3 sm:grid-cols-2">
          {week.objectives.map((objective, index) => (
            <label key={index} className="flex items-center gap-2.5 rounded-sm border border-primary/10 bg-primary/[0.025] px-3 py-2.5">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary/30" />
              <input
                value={objective}
                onChange={(event) => setObjective(weekKey, index, event.target.value)}
                aria-label={`Objetivo ${index + 1} da semana`}
                placeholder="escreva um objetivo"
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground/75 outline-none placeholder:text-muted-foreground/40"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Hábitos</h2>
          <div className="border-y border-primary/10 py-2.5">
            <div className="grid grid-cols-[minmax(110px,1fr)_repeat(7,24px)] items-center gap-1 text-center text-[10px] text-muted-foreground">
              <span className="text-left"> </span>
              {HABIT_DAY_HEADERS.map((day, index) => <span key={index}>{day}</span>)}
            </div>
            {activeHabits.length === 0 ? (
              <p className="py-5 text-xs text-muted-foreground">Crie um hábito para acompanhá-lo nesta semana.</p>
            ) : (
              activeHabits.map((habit) => (
                <HabitRow key={habit.id} habit={habit} days={habitDays} logs={logs} onToggle={toggleLog} />
              ))
            )}
            {habits.filter((habit) => !habit.archived).length > 4 && (
              <p className="mt-2 text-[10px] text-muted-foreground">+ outros hábitos na seção Hábitos</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Gratidão</h2>
          <div className="min-h-[142px] border border-primary/10 bg-primary/[0.025] p-4">
            <textarea
              value={week.gratitude}
              onChange={(event) => setGratitude(weekKey, event.target.value)}
              aria-label="Gratidão da semana"
              placeholder="uma coisa boa para guardar desta semana"
              className="h-full min-h-[110px] w-full resize-none bg-transparent text-sm text-foreground/75 outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function HabitRow({
  habit,
  days,
  logs,
  onToggle,
}: {
  habit: Habit
  days: Date[]
  logs: { habitId: string; date: string; completed: boolean }[]
  onToggle: (habitId: string, date: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(110px,1fr)_repeat(7,24px)] items-center gap-1 border-t border-primary/[0.07] py-2 text-center">
      <span className="truncate pr-2 text-left text-xs text-foreground/70" title={habit.name}>{habit.name}</span>
      {days.map((day) => {
        const date = toDateKey(day)
        const completed = logs.some((log) => log.habitId === habit.id && log.date === date && log.completed)
        return (
          <button
            key={date}
            type="button"
            onClick={() => onToggle(habit.id, date)}
            aria-label={`${completed ? 'Desmarcar' : 'Marcar'} ${habit.name} em ${date}`}
            aria-pressed={completed}
            className={cn(
              'mx-auto size-4 rounded-sm border border-primary/20 bg-background transition-colors hover:border-primary/45 cursor-pointer',
              completed && 'border-primary/55 bg-primary/30',
            )}
          />
        )
      })}
    </div>
  )
}

export function CalendarPage() {
  const events = useCalendarStore((state) => state.events)
  const tasks = useRoutineStore((state) => state.tasks)
  const recurringTasks = useRoutineStore((state) => state.recurringTasks)
  const toggleTask = useRoutineStore((state) => state.toggleTask)
  const completeRecurring = useRoutineStore((state) => state.completeRecurring)
  const plannerWeeks = useCalendarPlannerStore((state) => state.weeks)
  const setNote = useCalendarPlannerStore((state) => state.setNote)

  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState('')
  const [editId, setEditId] = useState<string | undefined>()
  const [routineTodayOpen, setRoutineTodayOpen] = useState(false)
  const [routineTaskOpen, setRoutineTaskOpen] = useState(false)
  const [routineRecurringOpen, setRoutineRecurringOpen] = useState(false)
  const [routineTaskEditId, setRoutineTaskEditId] = useState<string | undefined>()
  const [routineRecurringEditId, setRoutineRecurringEditId] = useState<string | undefined>()

  const today = todayKey()
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const monthWeeks = useMemo(
    () => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )
  const weekKey = toDateKey(weekDays[0])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      map.set(event.date, [...(map.get(event.date) ?? []), event])
    }
    return map
  }, [events])

  const visibleDates = view === 'month'
    ? monthWeeks.flat().map((cell) => new Date(cell.year, cell.month, cell.day, 12))
    : view === 'day'
      ? [currentDate]
      : weekDays

  const routineByDate = useMemo(() => {
    const map = new Map<string, RoutineCalendarItem[]>()
    const add = (date: string, item: RoutineCalendarItem) => {
      map.set(date, [...(map.get(date) ?? []), item])
    }

    for (const task of tasks) add(task.date, { kind: 'task', task })

    for (const date of visibleDates) {
      const key = toDateKey(date)
      const weekday = (date.getDay() + 6) % 7
      for (const task of recurringTasks) {
        if (!task.active || key < task.createdAt.slice(0, 10)) continue
        const occurs =
          task.frequency === 'daily' ||
          (task.frequency === 'weekly' && task.weekdays?.includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6)) ||
          (task.frequency === 'monthly' && date.getDate() === task.dayOfMonth)
        if (occurs) add(key, { kind: 'recurring', task })
      }
    }

    return map
  }, [currentDate, monthWeeks, recurringTasks, tasks, view, visibleDates, weekDays])

  const title = view === 'day'
    ? formatDayTitle(currentDate)
    : view === 'week'
      ? formatWeekTitle(currentDate)
      : `${MONTHS[currentDate.getMonth()]} de ${currentDate.getFullYear()}`

  const navigate = (delta: number) => {
    const next = new Date(currentDate)
    if (view === 'day') {
      next.setDate(next.getDate() + delta)
    } else if (view === 'week') {
      next.setDate(next.getDate() + delta * 7)
    } else {
      const day = next.getDate()
      next.setDate(1)
      next.setMonth(next.getMonth() + delta)
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    }
    setCurrentDate(next)
  }

  const openAdd = (date = toDateKey(currentDate)) => {
    setEditId(undefined)
    setDialogDate(date)
    setDialogOpen(true)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    setDialogDate(events.find((event) => event.id === id)?.date ?? '')
    setDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-[1040px] px-6 py-8 lg:px-10 lg:py-12">
      <header className={cn('mb-9 flex flex-wrap items-end justify-between gap-5', enter)}>
        <div>
          {view === 'month' ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
              <p className="mt-2 text-muted-foreground">{events.length + tasks.length} itens agendados</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-light uppercase tracking-[0.22em] text-foreground/80 sm:text-4xl">
                {MONTHS[currentDate.getMonth()]}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">Uma página para planejar, escrever e acompanhar a semana.</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setRoutineTodayOpen(true)}
            className="rounded-xl text-sm"
          >
            Rotina
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            onClick={() => openAdd()}
            className={cn(
              'rounded-xl gap-1.5 text-sm',
              view !== 'month' && 'rounded-sm border-primary/20 bg-transparent text-xs font-normal shadow-none hover:bg-primary/[0.05]',
            )}
          >
            <Plus size={14} />
            Novo evento
          </Button>
        </div>
      </header>

      <div className={cn('mb-7 flex flex-wrap items-center justify-between gap-3', enter)}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-primary/[0.05] hover:text-foreground cursor-pointer"
            aria-label="Período anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <span className={cn(
            'min-w-[180px] text-center capitalize sm:min-w-[250px]',
            view === 'month'
              ? 'px-1 text-xl font-bold text-foreground'
              : 'text-xs font-medium tracking-wide text-muted-foreground',
          )}>{title}</span>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-primary/[0.05] hover:text-foreground cursor-pointer"
            aria-label="Próximo período"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {view === 'day' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-sm text-xs font-normal text-muted-foreground hover:bg-primary/[0.05]"
            >
              Hoje
            </Button>
          )}
          <div role="group" aria-label="Forma de visualização" className="flex border-b border-primary/20">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={view === option.id}
                onClick={() => setView(option.id)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors sm:px-3',
                  view === option.id ? 'border-b border-primary text-foreground' : 'hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className={cn(enter)}>
        {view === 'month' ? (
          <MonthlyCalendarView
            weeks={monthWeeks}
            today={today}
            eventsByDate={eventsByDate}
            routineByDate={routineByDate}
            onAdd={openAdd}
            onEdit={openEdit}
            onCompleteRoutine={(item) => item.kind === 'task'
              ? toggleTask(item.task.id)
              : completeRecurring(item.task.id)}
          />
        ) : (
          <PlannerDays
            days={view === 'day' ? [currentDate] : weekDays}
            plannerWeeks={plannerWeeks}
            eventsByDate={eventsByDate}
            routineByDate={routineByDate}
            today={today}
            onNoteChange={(dayWeekKey, date, index, value) => setNote(dayWeekKey, date, index, value)}
            onAdd={openAdd}
            onEdit={openEdit}
            onCompleteRoutine={(item) => item.kind === 'task'
              ? toggleTask(item.task.id)
              : completeRecurring(item.task.id)}
          />
        )}
        {view === 'week' && <PlannerFooter weekKey={weekKey} weekDays={weekDays} />}
      </main>

      <CalendarEventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditId(undefined)
        }}
        defaultDate={dialogDate}
        editId={editId}
      />

      <RoutineTodayDialog
        open={routineTodayOpen}
        onClose={() => setRoutineTodayOpen(false)}
        onEditTask={(id) => { setRoutineTodayOpen(false); setRoutineTaskEditId(id); setRoutineTaskOpen(true) }}
        onEditRecurring={(id) => { setRoutineTodayOpen(false); setRoutineRecurringEditId(id); setRoutineRecurringOpen(true) }}
        onAddTask={() => {
          setRoutineTodayOpen(false)
          setRoutineTaskOpen(true)
        }}
      />

      <AddTaskDialog
        key={toDateKey(currentDate)}
        open={routineTaskOpen}
        editId={routineTaskEditId}
        onClose={() => { setRoutineTaskOpen(false); setRoutineTaskEditId(undefined) }}
        defaultDate={toDateKey(currentDate)}
      />
      <AddRecurringDialog
        open={routineRecurringOpen}
        editId={routineRecurringEditId}
        onClose={() => { setRoutineRecurringOpen(false); setRoutineRecurringEditId(undefined) }}
      />
    </div>
  )
}
