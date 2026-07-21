'use client'

import { useRoutineStore } from '@/lib/store/use-routine-store'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import type { CalendarEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/primitives'
import { CalendarEventDialog } from './calendar-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

// ─── Helpers de calendário ────────────────────────────────────────────────────

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Grelha 2D do mês: cada semana = 7 cells {day, month, year, isCurrentMonth} */
function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const weeks: { day: number; month: number; year: number; isCurrentMonth: boolean }[][] = []
  let week: typeof weeks[number] = []

  // Dias do mês anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    week.push({ day: daysInPrev - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false })
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    week.push({ day: d, month, year, isCurrentMonth: true })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  // Dias do mês seguinte para completar
  if (week.length > 0) {
    let nextDay = 1
    while (week.length < 7) {
      week.push({ day: nextDay++, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false })
    }
    weeks.push(week)
  }

  return weeks
}

const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const todayKey = () => {
  const t = new Date()
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CalendarPage() {
  const events = useCalendarStore((s) => s.events)
  const tasks = useRoutineStore((s) => s.tasks)

  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState('')
  const [editId, setEditId] = useState<string | undefined>()

  const weeks = useMemo(() => getMonthGrid(year, month), [year, month])
  const today = todayKey()
  const selectedMonth = `${MONTHS[month]} de ${year}`

  const navigate = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const goToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
  }

  const openAdd = (dateStr?: string) => {
    setEditId(undefined)
    setDialogDate(dateStr ?? dateKey(year, month, 1))
    setDialogOpen(true)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    const ev = events.find((e) => e.id === id)
    setDialogDate(ev?.date ?? '')
    setDialogOpen(true)
  }

  // Tasks agrupadas por data (para integração)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (!t.done) {
        map.set(t.date, (map.get(t.date) ?? 0) + 1)
      }
    }
    return map
  }, [tasks])

  // Events por data
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }
    return map
  }, [events])

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground mt-2">
            {events.length} eventos cadastrados
          </p>
        </div>
        <Button
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => openAdd()}
        >
          <Plus size={15} />
          Novo evento
        </Button>
      </div>

      {/* Navegação do mês */}
      <div className={cn('flex items-center justify-between mb-5', enter)}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex size-9 items-center justify-center rounded-xl border border-border/60 hover:bg-muted transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <h2 className="text-xl font-bold px-1 min-w-[180px] text-center">
            {selectedMonth}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="flex size-9 items-center justify-center rounded-xl border border-border/60 hover:bg-muted transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="rounded-xl">
          Hoje
        </Button>
      </div>

      {/* Grade do calendário */}
      <Card glass className={cn('overflow-hidden', enter)}>
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de semanas */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border/20 last:border-0">
              {week.map((cell) => {
                const key = dateKey(cell.year, cell.month, cell.day)
                const isToday = key === today
                const dayEvents = eventsByDate.get(key) ?? []
                const taskCount = tasksByDate.get(key) ?? 0
                const isPast = key < today

                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-[100px] border-r border-border/20 last:border-0 p-1.5 transition-colors relative group',
                      !cell.isCurrentMonth && 'bg-muted/15',
                      isToday && 'bg-primary/[0.04]',
                    )}
                  >
                    {/* Número do dia + indicadores */}
                    <div className="flex items-start justify-between mb-1">
                      <span
                        className={cn(
                          'inline-flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
                          isToday
                            ? 'bg-primary text-primary-foreground font-bold shadow-md'
                            : cell.isCurrentMonth
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground/50',
                        )}
                      >
                        {cell.day}
                      </span>
                      {taskCount > 0 && (
                        <button
                          className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer"
                          title={`${taskCount} tarefa${taskCount > 1 ? 's' : ''} pendente${taskCount > 1 ? 's' : ''}`}
                        >
                          <ListTodo size={9} />
                          {taskCount}
                        </button>
                      )}
                    </div>

                    {/* Eventos do dia */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => openEdit(ev.id)}
                          className={cn(
                            'w-full rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium truncate transition-all cursor-pointer hover:brightness-110',
                            isPast ? 'opacity-60' : '',
                          )}
                          style={{
                            backgroundColor: ev.color + '20',
                            color: ev.color,
                            borderLeft: `2.5px solid ${ev.color}`,
                          }}
                        >
                          {ev.allDay ? ev.title : `${ev.startTime} ${ev.title}`}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1.5 font-medium">
                          +{dayEvents.length - 3} mais
                        </p>
                      )}
                    </div>

                    {/* Botão rápido para adicionar */}
                    {cell.isCurrentMonth && (
                      <button
                        onClick={() => openAdd(key)}
                        className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all cursor-pointer"
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

      {/* Dialog */}
      <CalendarEventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditId(undefined)
        }}
        defaultDate={dialogDate}
        editId={editId}
      />
    </div>
  )
}
