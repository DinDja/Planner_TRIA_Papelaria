'use client'

import { useCalendarPlannerStore, EMPTY_CALENDAR_WEEK } from '@/lib/store/use-calendar-planner-store'
import type { CalendarPlannerWeek } from '@/lib/store/use-calendar-planner-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useRoutineStore } from '@/lib/store/use-routine-store'
import { recurringOccursOn } from '@/lib/routine/occurrences'
import type { Habit, RecurringTask, Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ListTodo, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { AddRecurringDialog, AddTaskDialog, RoutineTodayDialog } from '../routine/routine-dialogs'
import { PRIORITY_COLORS } from '../routine/shared'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
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
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
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
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
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
  routineByDate,
  onAdd,
  onCompleteRoutine,
}: {
  weeks: CalendarCell[][]
  today: string
  routineByDate: Map<string, RoutineCalendarItem[]>
  onAdd: (date: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  return (
    <Card glass className="hidden overflow-hidden md:block">
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
              const routineItems = sortRoutineItems(routineByDate.get(key) ?? [])
              const taskCount = routineItems.filter(
                (item) => item.kind === 'recurring' || !item.task.done,
              ).length
              const isToday = key === today
              const isPast = key < today
              const visibleRoutine = routineItems.slice(0, 3)
              const hiddenCount = routineItems.length - visibleRoutine.length

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
                      className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-md hover:bg-muted cursor-pointer"
                      aria-label="Adicionar tarefa"
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

function MobileMonthlyAgenda({
  weeks,
  today,
  selectedDate,
  routineByDate,
  onSelectDate,
  onAdd,
  onCompleteRoutine,
}: {
  weeks: CalendarCell[][]
  today: string
  selectedDate: Date
  routineByDate: Map<string, RoutineCalendarItem[]>
  onSelectDate: (date: string) => void
  onAdd: (date: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  const selectedKey = toDateKey(selectedDate)
  const selectedRoutine = sortRoutineItems(routineByDate.get(selectedKey) ?? [])
  const selectedTitle = formatDayTitle(selectedDate)

  return (
    <div className="space-y-4 md:hidden">
      <Card glass className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
          {DAY_HEADERS.map((day) => (
            <div key={day} className="py-2 text-center text-[8px] font-semibold uppercase text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-border/20 last:border-0">
            {week.map((cell) => {
              const key = dateKey(cell.year, cell.month, cell.day)
              const routineItems = routineByDate.get(key) ?? []
              const itemCount = routineItems.length
              const isToday = key === today
              const isSelected = key === selectedKey
              const markers = routineItems.map((item) => ({
                id: `${item.kind}-${item.task.id}`,
                color: PRIORITY_COLORS[item.task.priority],
              })).slice(0, 3)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate(key)}
                  aria-pressed={isSelected}
                  aria-label={`${formatDayTitle(new Date(cell.year, cell.month, cell.day, 12))}, ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
                  className={cn(
                                  'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 border-r border-border/20 py-1 last:border-0 cursor-pointer',
                    isSelected && 'bg-primary/[0.06]',
                  )}
                >
                  <span className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs tabular-nums',
                    isToday
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : isSelected
                        ? 'font-semibold text-primary'
                        : cell.isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground/45',
                  )}>
                    {cell.day}
                  </span>
                  <span aria-hidden className="flex h-1 items-center justify-center gap-0.5">
                    {markers.map((marker) => (
                      <span key={marker.id} className="size-1 rounded-full" style={{ backgroundColor: marker.color }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </Card>

      <section aria-label="Agenda do dia selecionado" className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold capitalize text-foreground">{selectedTitle}</h2>
            <TaskCount
              count={selectedRoutine.filter((item) => item.kind === 'recurring' || !item.task.done).length}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => onAdd(selectedKey)} className="shrink-0 gap-1.5">
            <Plus size={14} />
            Tarefa
          </Button>
        </div>

        {selectedRoutine.length === 0 ? (
          <Card glass className="px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia.</p>
            <button
              type="button"
              onClick={() => onAdd(selectedKey)}
                        className="mt-1 text-xs font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
            >
              Adicionar tarefa
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedRoutine.map((item) => {
              const task = item.task
              const done = item.kind === 'task' && item.task.done
              const color = PRIORITY_COLORS[task.priority]
              return (
                <button
                  key={`${item.kind}-${task.id}`}
                  type="button"
                  onClick={() => onCompleteRoutine(item)}
                  className={cn(
                                  'flex w-full min-w-0 items-start gap-2.5 rounded-sm px-3 py-2.5 text-left transition-colors hover:brightness-95 cursor-pointer',
                    (done || selectedKey < today) && 'opacity-60',
                  )}
                  style={{ backgroundColor: color + '18', borderLeft: `3px solid ${color}` }}
                  title={item.kind === 'recurring' ? 'Concluir ocorrência da rotina' : undefined}
                >
                  <span aria-hidden className="mt-0.5 shrink-0 text-xs" style={{ color }}>
                    {item.kind === 'recurring' ? '↻' : done ? '✓' : '○'}
                  </span>
                  <span className={cn('min-w-0 flex-1 break-words text-sm font-medium [overflow-wrap:anywhere]', done && 'line-through')}>
                    {task.time && <span className="mr-1 text-xs font-normal opacity-70">{task.time}</span>}
                    {task.title}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function PlannerDayBlock({
  date,
  notes,
  routineItems,
  today,
  onNoteChange,
  onAdd,
  onCompleteRoutine,
}: {
  date: Date
  notes: string[]
  routineItems: RoutineCalendarItem[]
  today: string
  onNoteChange: (index: number, value: string) => void
  onAdd: (date: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  const key = toDateKey(date)
  const isToday = key === today
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
          aria-label={`Adicionar tarefa em ${formatDayTitle(date)}`}
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
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground/60 hover:bg-primary/[0.06] hover:text-foreground cursor-pointer"
          aria-label="Adicionar tarefa"
        >
          <Plus size={13} />
        </button>
      </div>

      {sortedRoutineItems.length > 0 && (
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
  weekKey,
  plannerWeeks,
  routineByDate,
  today,
  onNoteChange,
  onAdd,
  onCompleteRoutine,
}: {
  days: Date[]
  weekKey: string
  plannerWeeks: Record<string, CalendarPlannerWeek>
  routineByDate: Map<string, RoutineCalendarItem[]>
  today: string
  onNoteChange: (weekKey: string, date: string, index: number, value: string) => void
  onAdd: (date: string) => void
  onCompleteRoutine: (item: RoutineCalendarItem) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-7 md:gap-y-6">
      {days.map((date, index) => {
        const key = toDateKey(date)
        const dayWeekKey = toDateKey(startOfWeek(date))
        return (
          <div key={key} className={index === days.length - 1 && days.length % 2 === 1 && days.length !== 7 ? 'md:col-span-2' : undefined}>
            <PlannerDayBlock
              date={date}
              notes={plannerWeeks[dayWeekKey]?.notesByDate[key] ?? []}
              routineItems={routineByDate.get(key) ?? []}
              today={today}
              onNoteChange={(noteIndex, value) => onNoteChange(dayWeekKey, key, noteIndex, value)}
              onAdd={onAdd}
              onCompleteRoutine={onCompleteRoutine}
            />
          </div>
        )
      })}
      {days.length === 7 && (
        <div className="md:col-start-2 md:row-start-4">
          <PlannerFooter weekKey={weekKey} weekDays={days} />
        </div>
      )}
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
  const habitDays = weekDays

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Objetivos da Semana</h2>
        <div className="grid grid-cols-1 gap-x-7 gap-y-3">
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
  const tasks = useRoutineStore((state) => state.tasks)
  const recurringTasks = useRoutineStore((state) => state.recurringTasks)
  const toggleTask = useRoutineStore((state) => state.toggleTask)
  const completeRecurring = useRoutineStore((state) => state.completeRecurring)
  const plannerWeeks = useCalendarPlannerStore((state) => state.weeks)
  const setNote = useCalendarPlannerStore((state) => state.setNote)

  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [routineTodayOpen, setRoutineTodayOpen] = useState(false)
  const [routineTaskOpen, setRoutineTaskOpen] = useState(false)
  const [routineRecurringOpen, setRoutineRecurringOpen] = useState(false)
  const [routineTaskDate, setRoutineTaskDate] = useState(() => toDateKey(new Date()))
  const [routineTaskEditId, setRoutineTaskEditId] = useState<string | undefined>()
  const [routineRecurringEditId, setRoutineRecurringEditId] = useState<string | undefined>()

  const today = todayKey()
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const monthWeeks = useMemo(
    () => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )
  const weekKey = toDateKey(weekDays[0])

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
      for (const task of recurringTasks) {
        if (recurringOccursOn(task, date)) add(key, { kind: 'recurring', task })
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
    setRoutineTaskEditId(undefined)
    setRoutineTaskDate(date)
    setRoutineTaskOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
      <header className={cn('mb-9 flex flex-wrap items-end justify-between gap-5', enter)}>
        <div>
          {view === 'month' ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
              <p className="mt-2 text-muted-foreground">
                {tasks.length + recurringTasks.filter((task) => task.active).length} itens agendados
              </p>
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
            variant="default"
            onClick={() => openAdd(toDateKey(currentDate))}
            className="rounded-xl gap-1.5 text-sm"
          >
            <Plus size={14} />
            Nova Tarefa
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
            'min-w-0 flex-1 text-center capitalize sm:min-w-[250px] sm:flex-none',
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

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          {toDateKey(currentDate) !== today && (
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
                              'px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors sm:px-3 cursor-pointer',
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
          <>
            <MobileMonthlyAgenda
              weeks={monthWeeks}
              today={today}
              selectedDate={currentDate}
              routineByDate={routineByDate}
              onSelectDate={(date) => {
                const [year, month, day] = date.split('-').map(Number)
                setCurrentDate(new Date(year, month - 1, day, 12))
              }}
              onAdd={openAdd}
              onCompleteRoutine={(item) => item.kind === 'task'
                ? toggleTask(item.task.id)
                : completeRecurring(item.task.id)}
            />
            <MonthlyCalendarView
              weeks={monthWeeks}
              today={today}
              routineByDate={routineByDate}
              onAdd={openAdd}
              onCompleteRoutine={(item) => item.kind === 'task'
                ? toggleTask(item.task.id)
                : completeRecurring(item.task.id)}
            />
          </>
        ) : (
          <PlannerDays
            days={view === 'day' ? [currentDate] : weekDays}
            weekKey={weekKey}
            plannerWeeks={plannerWeeks}
            routineByDate={routineByDate}
            today={today}
            onNoteChange={(dayWeekKey, date, index, value) => setNote(dayWeekKey, date, index, value)}
            onAdd={openAdd}
            onCompleteRoutine={(item) => item.kind === 'task'
              ? toggleTask(item.task.id)
              : completeRecurring(item.task.id)}
          />
        )}
      </main>

      <RoutineTodayDialog
        open={routineTodayOpen}
        onClose={() => setRoutineTodayOpen(false)}
        onEditTask={(id) => { setRoutineTodayOpen(false); setRoutineTaskEditId(id); setRoutineTaskOpen(true) }}
        onEditRecurring={(id) => { setRoutineTodayOpen(false); setRoutineRecurringEditId(id); setRoutineRecurringOpen(true) }}
        onAddTask={() => {
          setRoutineTodayOpen(false)
          setRoutineTaskDate(toDateKey(new Date()))
          setRoutineTaskOpen(true)
        }}
      />

      <AddTaskDialog
        key={routineTaskDate}
        open={routineTaskOpen}
        editId={routineTaskEditId}
        onClose={() => { setRoutineTaskOpen(false); setRoutineTaskEditId(undefined) }}
        defaultDate={routineTaskDate}
      />
      <AddRecurringDialog
        open={routineRecurringOpen}
        editId={routineRecurringEditId}
        onClose={() => { setRoutineRecurringOpen(false); setRoutineRecurringEditId(undefined) }}
      />
    </div>
  )
}
