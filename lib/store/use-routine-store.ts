import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PendingItem,
  RecurringTask,
  RoutineSlot,
  Task,
  TaskPriority,
  Weekday,
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

/** YYYY-MM-DD local (sem offset de timezone) */
const toDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayStr = () => toDateStr(new Date())

/**
 * Calcula próxima ocorrência de uma tarefa recorrente.
 * Estratégia: partir da última conclusão (ou hoje, se nunca feita)
 * e avançar até achar a primeira data elegível.
 */
function computeNextDue(task: Pick<
  RecurringTask,
  'frequency' | 'weekdays' | 'dayOfMonth' | 'lastDone'
>): string {
  const start = task.lastDone ? new Date(task.lastDone) : new Date()
  // avança 1 dia para não repetir o próprio dia
  start.setDate(start.getDate() + 1)
  start.setHours(0, 0, 0, 0)

  const guard = new Date(start)
  guard.setFullYear(guard.getFullYear() + 1) // limite: 1 ano

  if (task.frequency === 'daily') {
    return toDateStr(start)
  }

  if (task.frequency === 'weekly') {
    const wanted = new Set(task.weekdays?.map(Number) ?? [])
    if (wanted.size === 0) return toDateStr(start)
    const cursor = new Date(start)
    for (let i = 0; i < 14; i++) {
      const wd = cursor.getDay() as Weekday // 0..6 —domingo=0
      // nosso Weekday é Seg=0..Dom=6 —converter
      const isoLike = (((wd + 6) % 7) as Weekday)
      if (wanted.has(isoLike)) return toDateStr(cursor)
      cursor.setDate(cursor.getDate() + 1)
    }
    return toDateStr(start)
  }

  // monthly
  const dom = task.dayOfMonth ?? 1
  const cursor = new Date(start)
  // se já passou o dia este mês, vai para o próximo
  if (cursor.getDate() > dom) {
    cursor.setMonth(cursor.getMonth() + 1)
  }
  // adjust to valid day (clamp to last day of month)
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  cursor.setDate(Math.min(dom, lastDay))
  return toDateStr(cursor)
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface RoutineState {
  tasks: Task[]
  recurringTasks: RecurringTask[]
  pendingItems: PendingItem[]
  routineSlots: RoutineSlot[]

  // Tarefas únicas
  addTask: (data: {
    title: string
    date: string
    priority?: TaskPriority
    notes?: string
  }) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void

  // Tarefas recorrentes
  addRecurring: (data: {
    title: string
    frequency: RecurringTask['frequency']
    weekdays?: Weekday[]
    dayOfMonth?: number
    priority?: TaskPriority
    notes?: string
  }) => void
  updateRecurring: (id: string, patch: Partial<RecurringTask>) => void
  completeRecurring: (id: string) => void
  toggleRecurringActive: (id: string) => void
  deleteRecurring: (id: string) => void

  // Pendências avulsas
  addPending: (data: {
    title: string
    priority?: TaskPriority
    notes?: string
  }) => void
  updatePending: (id: string, patch: Partial<PendingItem>) => void
  convertPendingToTask: (id: string, date: string) => void
  deletePending: (id: string) => void

  // Rotina ideal
  addRoutineSlot: (data: Omit<RoutineSlot, 'id'>) => void
  updateRoutineSlot: (id: string, patch: Partial<RoutineSlot>) => void
  deleteRoutineSlot: (id: string) => void
}

const nowISO = () => new Date().toISOString()

const seedRecurring: RecurringTask[] = [
  {
    id: 'rec-seed-1',
    title: 'Beber 2L de água',
    frequency: 'daily',
    priority: 'medium',
    active: true,
    nextDue: todayStr(),
    createdAt: nowISO(),
  },
  {
    id: 'rec-seed-2',
    title: 'Revisão de e-mails',
    frequency: 'weekly',
    weekdays: [0, 1, 2, 3, 4],
    priority: 'high',
    active: true,
    nextDue: todayStr(),
    createdAt: nowISO(),
  },
  {
    id: 'rec-seed-3',
    title: 'Pagamento da internet',
    frequency: 'monthly',
    dayOfMonth: 10,
    priority: 'high',
    active: true,
    nextDue: todayStr(),
    createdAt: nowISO(),
  },
]

const seedTasks: Task[] = [
  {
    id: 'tsk-seed-1',
    title: 'Marcar consulta no dentista',
    date: todayStr(),
    priority: 'medium',
    done: false,
    createdAt: nowISO(),
  },
  {
    id: 'tsk-seed-2',
    title: 'Comprar presente da Ana',
    date: todayStr(),
    priority: 'high',
    done: false,
    createdAt: nowISO(),
  },
  {
    id: 'tsk-seed-3',
    title: 'Responder mensagem do Thiago',
    date: todayStr(),
    priority: 'low',
    done: true,
    completedAt: nowISO(),
    createdAt: nowISO(),
  },
]

const seedPending: PendingItem[] = [
  {
    id: 'pend-seed-1',
    title: 'Pensar em ideias de viagem',
    priority: 'low',
    createdAt: nowISO(),
  },
  {
    id: 'pend-seed-2',
    title: 'Cancelar assinatura não usada',
    priority: 'medium',
    createdAt: nowISO(),
  },
]

const seedRoutine: RoutineSlot[] = [
  {
    id: 'slot-seed-1',
    time: '07:00',
    endTime: '07:30',
    title: 'Academia',
    weekdays: [0, 1, 2, 3, 4],
    color: '#7bb686',
  },
  {
    id: 'slot-seed-2',
    time: '08:00',
    endTime: '08:30',
    title: 'Café da manhã + journaling',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    color: '#f0b429',
  },
  {
    id: 'slot-seed-3',
    time: '22:30',
    endTime: '23:00',
    title: 'Leitura antes de dormir',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    color: '#5b8dbf',
  },
]

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      recurringTasks: seedRecurring,
      pendingItems: seedPending,
      routineSlots: seedRoutine,

      // ── Tarefas únicas ────────────────────────────────────────────
      addTask: ({ title, date, priority = 'medium', notes }) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: `tsk-${uid()}`,
              title,
              date,
              priority,
              notes,
              done: false,
              createdAt: nowISO(),
            },
          ],
        })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  completedAt: !t.done ? nowISO() : undefined,
                }
              : t,
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Tarefas recorrentes ────────────────────────────────────────
      addRecurring: ({ title, frequency, weekdays, dayOfMonth, priority = 'medium', notes }) => {
        const draft: RecurringTask = {
          id: `rec-${uid()}`,
          title,
          frequency,
          weekdays,
          dayOfMonth,
          priority,
          notes,
          active: true,
          nextDue: '',
          createdAt: nowISO(),
        }
        draft.nextDue = computeNextDue(draft)
        set((s) => ({ recurringTasks: [...s.recurringTasks, draft] }))
      },

      updateRecurring: (id, patch) =>
        set((s) => ({
          recurringTasks: s.recurringTasks.map((t) => {
            if (t.id !== id) return t
            const merged = { ...t, ...patch }
            if (patch.frequency || patch.weekdays || patch.dayOfMonth || patch.lastDone) {
              merged.nextDue = computeNextDue(merged)
            }
            return merged
          }),
        })),

      completeRecurring: (id) =>
        set((s) => ({
          recurringTasks: s.recurringTasks.map((t) => {
            if (t.id !== id) return t
            const lastDone = todayStr()
            const updated: RecurringTask = { ...t, lastDone }
            updated.nextDue = computeNextDue(updated)
            return updated
          }),
        })),

      toggleRecurringActive: (id) =>
        set((s) => ({
          recurringTasks: s.recurringTasks.map((t) =>
            t.id === id ? { ...t, active: !t.active } : t,
          ),
        })),

      deleteRecurring: (id) =>
        set((s) => ({
          recurringTasks: s.recurringTasks.filter((t) => t.id !== id),
        })),

      // ── Pendências ──────────────────────────────────────────────────
      addPending: ({ title, priority = 'medium', notes }) =>
        set((s) => ({
          pendingItems: [
            ...s.pendingItems,
            {
              id: `pend-${uid()}`,
              title,
              priority,
              notes,
              createdAt: nowISO(),
            },
          ],
        })),

      updatePending: (id, patch) =>
        set((s) => ({
          pendingItems: s.pendingItems.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),

      convertPendingToTask: (id, date) =>
        set((s) => {
          const pending = s.pendingItems.find((p) => p.id === id)
          if (!pending) return s
          const newTask: Task = {
            id: `tsk-${uid()}`,
            title: pending.title,
            notes: pending.notes,
            date,
            priority: pending.priority,
            done: false,
            createdAt: nowISO(),
          }
          return {
            tasks: [...s.tasks, newTask],
            pendingItems: s.pendingItems.filter((p) => p.id !== id),
          }
        }),

      deletePending: (id) =>
        set((s) => ({
          pendingItems: s.pendingItems.filter((p) => p.id !== id),
        })),

      // ── Rotina ideal ────────────────────────────────────────────────
      addRoutineSlot: (data) =>
        set((s) => ({
          routineSlots: [...s.routineSlots, { ...data, id: `slot-${uid()}` }],
        })),

      updateRoutineSlot: (id, patch) =>
        set((s) => ({
          routineSlots: s.routineSlots.map((slot) =>
            slot.id === id ? { ...slot, ...patch } : slot,
          ),
        })),

      deleteRoutineSlot: (id) =>
        set((s) => ({
          routineSlots: s.routineSlots.filter((slot) => slot.id !== id),
        })),
    }),
    {
      name: 'plannerhub-routine',
    },
  ),
)
