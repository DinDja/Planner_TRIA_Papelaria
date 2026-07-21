'use client'

import { useRoutineStore } from '@/lib/store/use-routine-store'
import type { PendingItem, RecurringTask, Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  Inbox,
  Plus,
  Repeat,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Switch } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import {
  AddPendingDialog,
  AddRecurringDialog,
  AddSlotDialog,
  AddTaskDialog,
} from './routine-dialogs'
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  WEEKDAY_SHORT,
  formatDateShort,
  relativeDateLabel,
  todayStr,
  todayWeekday,
} from './shared'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

// ─── Item de tarefa única ─────────────────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const toggleTask = useRoutineStore((s) => s.toggleTask)
  const deleteTask = useRoutineStore((s) => s.deleteTask)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40',
        task.done && 'opacity-60',
      )}
    >
      <button
        onClick={() => toggleTask(task.id)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        aria-label={task.done ? 'Desmarcar tarefa' : 'Concluir tarefa'}
      >
        {task.done ? (
          <CheckCircle2 size={20} className="text-emerald-500" />
        ) : (
          <Circle size={20} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            task.done && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {relativeDateLabel(task.date)} · {formatDateShort(task.date)}
        </p>
      </div>
      <Badge
        variant="outline"
        className="shrink-0 text-[10px]"
        style={{ color: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] + '50' }}
      >
        {PRIORITY_LABELS[task.priority]}
      </Badge>
      <button
        onClick={() => deleteTask(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
        aria-label="Excluir tarefa"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Item de tarefa recorrente ────────────────────────────────────────────────

function RecurringRow({ task, compact }: { task: RecurringTask; compact?: boolean }) {
  const completeRecurring = useRoutineStore((s) => s.completeRecurring)
  const toggleRecurringActive = useRoutineStore((s) => s.toggleRecurringActive)
  const deleteRecurring = useRoutineStore((s) => s.deleteRecurring)

  const isDue = task.nextDue <= todayStr()

  const freqLabel =
    task.frequency === 'daily'
      ? 'Diária'
      : task.frequency === 'weekly'
        ? `Semanal · ${(task.weekdays ?? []).map((d) => WEEKDAY_SHORT[d]).join(', ')}`
        : `Mensal · dia ${task.dayOfMonth}`

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40',
        !task.active && 'opacity-55',
      )}
    >
      {compact ? (
        <button
          onClick={() => completeRecurring(task.id)}
          disabled={!task.active}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
          aria-label="Concluir ocorrência de hoje"
        >
          <Circle size={20} />
        </button>
      ) : (
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '18' }}
        >
          <Repeat size={15} style={{ color: PRIORITY_COLORS[task.priority] }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {freqLabel} ·{' '}
          {isDue ? (
            <span className="font-semibold text-primary">vence hoje</span>
          ) : (
            <>próxima: {formatDateShort(task.nextDue)}</>
          )}
        </p>
      </div>
      {compact ? (
        <Badge
          variant="outline"
          className="shrink-0 text-[10px]"
          style={{ color: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] + '50' }}
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      ) : (
        <>
          <Switch
            checked={task.active}
            onCheckedChange={() => toggleRecurringActive(task.id)}
            aria-label={task.active ? 'Pausar recorrência' : 'Ativar recorrência'}
          />
          <button
            onClick={() => deleteRecurring(task.id)}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir recorrência"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Item de pendência ────────────────────────────────────────────────────────

function PendingRow({ item, onSchedule }: { item: PendingItem; onSchedule: (id: string) => void }) {
  const deletePending = useRoutineStore((s) => s.deletePending)

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: PRIORITY_COLORS[item.priority] + '18' }}
      >
        <Inbox size={15} style={{ color: PRIORITY_COLORS[item.priority] }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground">
          adicionada em {formatDateShort(item.createdAt.slice(0, 10))}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 rounded-xl gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onSchedule(item.id)}
      >
        Agendar <ArrowRight size={12} />
      </Button>
      <button
        onClick={() => deletePending(item.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
        aria-label="Excluir pendência"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function RoutinePage() {
  const tasks = useRoutineStore((s) => s.tasks)
  const recurringTasks = useRoutineStore((s) => s.recurringTasks)
  const pendingItems = useRoutineStore((s) => s.pendingItems)
  const routineSlots = useRoutineStore((s) => s.routineSlots)
  const convertPendingToTask = useRoutineStore((s) => s.convertPendingToTask)
  const deleteRoutineSlot = useRoutineStore((s) => s.deleteRoutineSlot)

  const [tab, setTab] = useState('hoje')
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addRecurringOpen, setAddRecurringOpen] = useState(false)
  const [addPendingOpen, setAddPendingOpen] = useState(false)
  const [addSlotOpen, setAddSlotOpen] = useState(false)

  const today = todayStr()
  const weekday = todayWeekday()

  // Derivados
  const todayTasks = tasks.filter((t) => t.date === today)
  const overdueTasks = tasks.filter((t) => t.date < today && !t.done)
  const upcomingTasks = tasks
    .filter((t) => t.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const dueRecurring = recurringTasks.filter((t) => t.active && t.nextDue <= today)
  const todaySlots = routineSlots
    .filter((s) => s.weekdays.includes(weekday))
    .sort((a, b) => a.time.localeCompare(b.time))

  const todayTotal = todayTasks.length + dueRecurring.length
  const todayDone = todayTasks.filter((t) => t.done).length

  const handleSchedule = (id: string) => {
    convertPendingToTask(id, today)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#5b8dbf18' }}
            >
              <ClipboardList size={22} style={{ color: '#5b8dbf' }} />
            </span>
            Rotina
          </h1>
          <p className="text-muted-foreground mt-2 capitalize">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-3.5 py-2 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <div className="leading-tight">
            <p className="text-sm font-bold tabular-nums">
              {todayDone}/{todayTotal}
            </p>
            <p className="text-[10px] text-muted-foreground">concluídas hoje</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <TabList>
            <Tab value="hoje">
              <Sun size={14} className="mr-1.5" />
              Hoje
              {todayTotal > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {todayTotal}
                </span>
              )}
            </Tab>
            <Tab value="recorrentes">
              <Repeat size={14} className="mr-1.5" />
              Recorrentes
            </Tab>
            <Tab value="pendencias">
              <Inbox size={14} className="mr-1.5" />
              Pendências
              {pendingItems.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {pendingItems.length}
                </span>
              )}
            </Tab>
            <Tab value="ideal">
              <Sparkles size={14} className="mr-1.5" />
              Rotina ideal
            </Tab>
          </TabList>
          <Button
            className="rounded-xl gap-1.5 shadow-md"
            onClick={() => {
              if (tab === 'hoje') setAddTaskOpen(true)
              else if (tab === 'recorrentes') setAddRecurringOpen(true)
              else if (tab === 'pendencias') setAddPendingOpen(true)
              else setAddSlotOpen(true)
            }}
          >
            <Plus size={15} />
            {tab === 'hoje' && 'Nova tarefa'}
            {tab === 'recorrentes' && 'Nova recorrência'}
            {tab === 'pendencias' && 'Nova pendência'}
            {tab === 'ideal' && 'Novo bloco'}
          </Button>
        </div>

        {/* ── Tab: Hoje ──────────────────────────────────────────────── */}
        <TabPanel value="hoje">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Atrasadas */}
              {overdueTasks.length > 0 && (
                <Card glass>
                  <CardHeader className="flex-row items-center justify-between pb-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarClock size={16} className="text-destructive" />
                      Atrasadas
                    </CardTitle>
                    <span className="text-[11px] text-destructive font-semibold tabular-nums">
                      {overdueTasks.length}
                    </span>
                  </CardHeader>
                  <div className="px-3 py-3 space-y-0.5">
                    {overdueTasks.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Tarefas de hoje */}
              <Card glass>
                <CardHeader className="flex-row items-center justify-between pb-0">
                  <CardTitle className="text-base">Tarefas de hoje</CardTitle>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {todayTasks.filter((t) => t.done).length}/{todayTasks.length} feitas
                  </span>
                </CardHeader>
                <div className="px-3 py-3 space-y-0.5">
                  {todayTasks.length > 0 ? (
                    todayTasks.map((t) => <TaskRow key={t.id} task={t} />)
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhuma tarefa para hoje. Aproveite o dia! 🎉
                    </p>
                  )}
                </div>
              </Card>

              {/* Recorrentes devendo hoje */}
              <Card glass>
                <CardHeader className="flex-row items-center justify-between pb-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Repeat size={16} className="text-primary" />
                    Recorrências de hoje
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {dueRecurring.length}
                  </span>
                </CardHeader>
                <div className="px-3 py-3 space-y-0.5">
                  {dueRecurring.length > 0 ? (
                    dueRecurring.map((t) => <RecurringRow key={t.id} task={t} compact />)
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhuma recorrência pendente hoje.
                    </p>
                  )}
                </div>
              </Card>

              {/* Próximas */}
              {upcomingTasks.length > 0 && (
                <Card glass>
                  <CardHeader className="flex-row items-center justify-between pb-0">
                    <CardTitle className="text-base">Próximas</CardTitle>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {upcomingTasks.length}
                    </span>
                  </CardHeader>
                  <div className="px-3 py-3 space-y-0.5">
                    {upcomingTasks.slice(0, 5).map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Coluna lateral: rotina ideal de hoje */}
            <div className="space-y-6">
              <Card glass>
                <CardHeader className="flex-row items-center justify-between pb-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    Rotina ideal de hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {todaySlots.length > 0 ? (
                    <div className="relative space-y-1">
                      <div className="absolute left-[46px] top-3 bottom-3 w-px bg-border/70" />
                      {todaySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="relative flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex flex-col items-end shrink-0 w-9">
                            <span className="text-xs font-semibold tabular-nums">{slot.time}</span>
                            {slot.endTime && (
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {slot.endTime}
                              </span>
                            )}
                          </div>
                          <div
                            className="relative z-10 size-2.5 rounded-full shrink-0 ring-4 ring-card"
                            style={{ backgroundColor: slot.color ?? '#5b8dbf' }}
                          />
                          <span className="text-sm truncate">{slot.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum bloco definido para hoje.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* ── Tab: Recorrentes ───────────────────────────────────────── */}
        <TabPanel value="recorrentes">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Tarefas recorrentes</CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {recurringTasks.filter((t) => t.active).length} ativas · {recurringTasks.length} total
              </span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {recurringTasks.length > 0 ? (
                recurringTasks.map((t) => <RecurringRow key={t.id} task={t} />)
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma tarefa recorrente ainda.
                </p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Tab: Pendências ────────────────────────────────────────── */}
        <TabPanel value="pendencias">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox size={16} className="text-primary" />
                Caixa de pendências
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {pendingItems.length}
              </span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {pendingItems.length > 0 ? (
                pendingItems.map((p) => (
                  <PendingRow key={p.id} item={p} onSchedule={handleSchedule} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma pendência. Tudo organizado! ✨
                </p>
              )}
            </div>
          </Card>
        </TabPanel>

        {/* ── Tab: Rotina ideal ──────────────────────────────────────── */}
        <TabPanel value="ideal">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Blocos da rotina ideal
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {routineSlots.length}
              </span>
            </CardHeader>
            <div className="px-3 py-3 space-y-0.5">
              {routineSlots.length > 0 ? (
                [...routineSlots]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tabular-nums"
                        style={{
                          backgroundColor: (slot.color ?? '#5b8dbf') + '18',
                          color: slot.color ?? '#5b8dbf',
                        }}
                      >
                        {slot.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{slot.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {slot.time}
                          {slot.endTime ? `–${slot.endTime}` : ''} ·{' '}
                          {slot.weekdays.length === 7
                            ? 'Todos os dias'
                            : slot.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteRoutineSlot(slot.id)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                        aria-label="Excluir bloco"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Monte sua rotina ideal adicionando blocos de horário.
                </p>
              )}
            </div>
          </Card>
        </TabPanel>
      </Tabs>

      {/* Dialogs */}
      <AddTaskDialog open={addTaskOpen} onClose={() => setAddTaskOpen(false)} />
      <AddRecurringDialog open={addRecurringOpen} onClose={() => setAddRecurringOpen(false)} />
      <AddPendingDialog open={addPendingOpen} onClose={() => setAddPendingOpen(false)} />
      <AddSlotDialog open={addSlotOpen} onClose={() => setAddSlotOpen(false)} />
    </div>
  )
}
