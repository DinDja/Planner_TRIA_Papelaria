import type { Appointment, BirthdayRecord, CalendarEvent, ExamRecord, Habit, Medication, Weekday } from '@/lib/types'

export type ReminderKind = 'medication' | 'appointment' | 'exam' | 'calendar' | 'birthday' | 'habit'

export interface Reminder {
  id: string
  kind: ReminderKind
  title: string
  body: string
  dueAt: Date
  occurrenceKey: string
}

const DEFAULT_TIME = '09:00'

function localDate(date: string, time = DEFAULT_TIME): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const value = new Date(`${date}T${/^\d{2}:\d{2}$/.test(time) ? time : DEFAULT_TIME}:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

function dateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isActiveOn(medication: Medication, date: string) {
  return medication.startDate <= date && (!medication.endDate || medication.endDate >= date)
}

export function buildReminders({
  medications,
  appointments,
  exams,
  events,
  birthdays,
  habits,
  now = new Date(),
}: {
  medications: Medication[]
  appointments: Appointment[]
  exams: ExamRecord[]
  events: CalendarEvent[]
  birthdays: BirthdayRecord[]
  habits: Habit[]
  now?: Date
}): Reminder[] {
  const today = dateKey(now)
  const reminders: Reminder[] = []

  for (const medication of medications) {
    if (!medication.reminderEnabled || !isActiveOn(medication, today)) continue
    const times = medication.times?.length ? medication.times : [DEFAULT_TIME]
    for (const time of times) {
      const dueAt = localDate(today, time)
      if (dueAt) reminders.push({
        id: `medication-${medication.id}-${time}`,
        kind: 'medication',
        title: `Hora do medicamento: ${medication.name}`,
        body: `${medication.dosage} · ${time}`,
        dueAt,
        occurrenceKey: today,
      })
    }
  }

  for (const appointment of appointments) {
    if (!appointment.reminderEnabled || appointment.status !== 'scheduled') continue
    const dueAt = localDate(appointment.date, appointment.time)
    if (dueAt) reminders.push({
      id: `appointment-${appointment.id}`,
      kind: 'appointment',
      title: `Consulta: ${appointment.doctorName}`,
      body: `${appointment.date} às ${appointment.time}`,
      dueAt,
      occurrenceKey: appointment.date,
    })
  }

  for (const exam of exams) {
    if (!exam.reminderEnabled || exam.status !== 'pending') continue
    const dueAt = localDate(exam.date, exam.time)
    if (dueAt) reminders.push({
      id: `exam-${exam.id}`,
      kind: 'exam',
      title: `Exame: ${exam.name}`,
      body: exam.time ? `${exam.date} às ${exam.time}` : `${exam.date} · lembrete do dia`,
      dueAt,
      occurrenceKey: exam.date,
    })
  }

  for (const event of events) {
    if (!event.reminderEnabled) continue
    const dueAt = localDate(event.date, event.allDay ? DEFAULT_TIME : event.startTime)
    if (dueAt) reminders.push({
      id: `calendar-${event.id}`,
      kind: 'calendar',
      title: `Agenda: ${event.title}`,
      body: event.allDay ? `${event.date} · dia inteiro` : `${event.date} às ${event.startTime}`,
      dueAt,
      occurrenceKey: event.date,
    })
  }

  for (const birthday of birthdays) {
    if (!birthday.reminderEnabled) continue
    const [, month, day] = birthday.date.split('-')
    const dueAt = localDate(`${today.slice(0, 4)}-${month}-${day}`)
    if (dueAt) reminders.push({
      id: `birthday-${birthday.id}`,
      kind: 'birthday',
      title: `Aniversário: ${birthday.name}`,
      body: 'Hoje é uma boa hora para enviar uma mensagem.',
      dueAt,
      occurrenceKey: today,
    })
  }

  for (const habit of habits) {
    if (!habit.reminderEnabled || habit.archived) continue
    const currentDay = (now.getDay() + 6) % 7
    const monthDay = now.getDate()
    const occursToday = habit.frequency === 'daily'
      || (habit.frequency === 'weekly' && (habit.weekdays ?? []).includes(currentDay as Weekday))
      || (habit.frequency === 'monthly' && habit.dayOfMonth === monthDay)
    if (!occursToday) continue
    const dueAt = localDate(today, habit.reminderTime ?? DEFAULT_TIME)
    if (dueAt) reminders.push({
      id: `habit-${habit.id}`,
      kind: 'habit',
      title: `Hora do hábito: ${habit.name}`,
      body: 'Reserve alguns minutos para manter sua sequência.',
      dueAt,
      occurrenceKey: today,
    })
  }

  return reminders
}

export function reminderStorageKey(reminder: Reminder) {
  return `${reminder.id}:${reminder.occurrenceKey}`
}
