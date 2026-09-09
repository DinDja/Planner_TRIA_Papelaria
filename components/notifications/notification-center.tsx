'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeCollection } from '@/lib/db/client'
import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useHealthStore } from '@/lib/store/use-health-store'
import { buildReminders, reminderStorageKey } from '@/lib/notifications/reminders'
import { toast } from '../ui/toaster'

const STORAGE_KEY = 'tria-papelaria-fired-reminders'
const CHECK_EVERY_MS = 15_000
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 45

const REMINDER_COLLECTIONS = [
  ['medications', 'medications'],
  ['appointments', 'appointments'],
  ['exams', 'exams'],
  ['events', 'calendarEvents'],
  ['birthdays', 'birthdays'],
  ['habits', 'habits'],
] as const

type RemoteItem = { id: string }

function mergeItems<T extends RemoteItem>(local: T[], remoteItems: Record<string, RemoteItem[]>, key: string) {
  const merged = new Map((remoteItems[key] ?? []).map((item) => [item.id, item as T]))
  for (const item of local) merged.set(item.id, item)
  return [...merged.values()]
}

function getFired() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number>
    const cutoff = Date.now() - MAX_AGE_MS
    return Object.fromEntries(Object.entries(parsed).filter(([, timestamp]) => timestamp > cutoff))
  } catch {
    return {}
  }
}

export function NotificationCenter() {
  const { user } = useAuth()
  const medications = useHealthStore((s) => s.medications)
  const appointments = useHealthStore((s) => s.appointments)
  const exams = useHealthStore((s) => s.exams)
  const events = useCalendarStore((s) => s.events)
  const birthdays = useBirthdaysStore((s) => s.entries)
  const habits = useHabitsStore((s) => s.habits)
  const [remoteItems, setRemoteItems] = useState<Record<string, RemoteItem[]>>({})

  // O restante do app usa carregamento por rota. Os avisos precisam conhecer
  // os seis módulos mesmo quando a pessoa está em outra tela, então mantemos
  // uma leitura dedicada e somente de leitura dessas coleções.
  useEffect(() => {
    if (!user) {
      setRemoteItems({})
      return
    }
    const unsubs = REMINDER_COLLECTIONS.map(([key, collection]) => subscribeCollection<any>(user, collection, (items) => {
      setRemoteItems((current) => ({ ...current, [key]: items }))
    }))
    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [user?.uid])

  const reminderMedications = useMemo(() => mergeItems(medications, remoteItems, 'medications'), [medications, remoteItems])
  const reminderAppointments = useMemo(() => mergeItems(appointments, remoteItems, 'appointments'), [appointments, remoteItems])
  const reminderExams = useMemo(() => mergeItems(exams, remoteItems, 'exams'), [exams, remoteItems])
  const reminderEvents = useMemo(() => mergeItems(events, remoteItems, 'events'), [events, remoteItems])
  const reminderBirthdays = useMemo(() => mergeItems(birthdays, remoteItems, 'birthdays'), [birthdays, remoteItems])
  const reminderHabits = useMemo(() => mergeItems(habits, remoteItems, 'habits'), [habits, remoteItems])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const check = () => {
      const now = new Date()
      const fired = getFired()
      const due = buildReminders({
        medications: reminderMedications,
        appointments: reminderAppointments,
        exams: reminderExams,
        events: reminderEvents,
        birthdays: reminderBirthdays,
        habits: reminderHabits,
        now,
      })
        .filter((reminder) => {
          const age = now.getTime() - reminder.dueAt.getTime()
          const happenedToday = reminder.dueAt.toDateString() === now.toDateString()
          return happenedToday && age >= 0 && age <= 24 * 60 * 60_000 && !fired[reminderStorageKey(reminder)]
        })

      for (const reminder of due) {
        const key = reminderStorageKey(reminder)
        fired[key] = now.getTime()
        toast({ title: reminder.title, description: reminder.body, variant: 'success' })
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(reminder.title, {
            body: reminder.body,
            icon: '/triaprojeto.png',
            tag: key,
          })
          notification.onclick = () => window.focus()
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(fired))
    }

    check()
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [appointments, birthdays, events, exams, habits, medications, reminderAppointments, reminderBirthdays, reminderEvents, reminderExams, reminderHabits, reminderMedications])

  return null
}
