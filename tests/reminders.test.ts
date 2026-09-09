import { describe, expect, it } from 'vitest'
import { buildReminders } from '@/lib/notifications/reminders'

describe('reminder engine', () => {
  it('encontra os seis tipos de lembrete no momento correto', () => {
    const now = new Date(2026, 7, 10, 9, 0, 0) // segunda-feira
    const reminders = buildReminders({
      now,
      medications: [{ id: 'med-1', name: 'Vitamina', dosage: '1 comprimido', frequency: '1x', times: ['09:00'], startDate: '2026-08-01', color: '#000', reminderEnabled: true, createdAt: '' }],
      appointments: [{ id: 'apt-1', doctorName: 'Dra. Ana', specialty: 'Clínica', date: '2026-08-10', time: '09:00', status: 'scheduled', reminderEnabled: true, createdAt: '' }],
      exams: [{ id: 'exam-1', name: 'Hemograma', date: '2026-08-10', time: '09:00', status: 'pending', color: '#000', reminderEnabled: true, createdAt: '' }],
      events: [{ id: 'event-1', title: 'Reunião', date: '2026-08-10', startTime: '09:00', color: '#000', reminderEnabled: true, createdAt: '' }],
      birthdays: [{ id: 'birthday-1', name: 'Maria', date: '2000-08-10', color: '#000', reminderEnabled: true, createdAt: '' }],
      habits: [{ id: 'habit-1', name: 'Caminhar', color: '#000', frequency: 'weekly', weekdays: [0], reminderTime: '09:00', reminderEnabled: true, archived: false, createdAt: '' }],
    })

    expect(reminders).toHaveLength(6)
    expect(reminders.map((reminder) => reminder.kind).sort()).toEqual([
      'appointment', 'birthday', 'calendar', 'exam', 'habit', 'medication',
    ])
  })

  it('respeita o dia do mês e não avisa hábitos arquivados', () => {
    const reminders = buildReminders({
      now: new Date(2026, 7, 10, 10, 0, 0),
      medications: [], appointments: [], exams: [], events: [], birthdays: [],
      habits: [
        { id: 'monthly', name: 'Fechar mês', color: '#000', frequency: 'monthly', dayOfMonth: 10, reminderTime: '10:00', reminderEnabled: true, archived: false, createdAt: '' },
        { id: 'archived', name: 'Arquivado', color: '#000', frequency: 'daily', reminderTime: '10:00', reminderEnabled: true, archived: true, createdAt: '' },
      ],
    })

    expect(reminders.map((reminder) => reminder.id)).toEqual(['habit-monthly'])
  })
})
