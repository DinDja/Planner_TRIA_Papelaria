import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Appointment,
  BodyMeasurement,
  CycleRecord,
  Doctor,
  ExamRecord,
  Medication,
  SymptomLog,
  WeightRecord,
} from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const today = dayStr()

const seedWeights: WeightRecord[] = [
  { id: `w-${uid()}`, date: dayStr(-30), weight: 72.5, notes: 'Início da dieta', createdAt: nowISO() },
  { id: `w-${uid()}`, date: dayStr(-23), weight: 71.8, createdAt: nowISO() },
  { id: `w-${uid()}`, date: dayStr(-16), weight: 71.2, notes: 'Senti diferença nas roupas', createdAt: nowISO() },
  { id: `w-${uid()}`, date: dayStr(-9), weight: 70.5, createdAt: nowISO() },
  { id: `w-${uid()}`, date: dayStr(-2), weight: 70.1, createdAt: nowISO() },
]

const seedSymptoms: SymptomLog[] = [
  { id: `sym-${uid()}`, date: dayStr(-5), symptom: 'Dor de cabeça', severity: 3, notes: 'Passou depois do café', createdAt: nowISO() },
  { id: `sym-${uid()}`, date: dayStr(-3), symptom: 'Fadiga', severity: 2, notes: 'Dormi mal na noite anterior', createdAt: nowISO() },
  { id: `sym-${uid()}`, date: today, symptom: 'Dor nas costas', severity: 4, notes: 'Ficar sentado o dia todo', createdAt: nowISO() },
]

const seedMedications: Medication[] = [
  { id: `med-${uid()}`, name: 'Vitamina D', dosage: '1 comprimido', frequency: '1x ao dia', startDate: dayStr(-60), notes: 'Após o almoço', color: '#f0b429', createdAt: nowISO() },
  { id: `med-${uid()}`, name: 'Ômega 3', dosage: '1 cápsula', frequency: '2x ao dia', startDate: dayStr(-30), notes: 'Café da manhã e jantar', color: '#5b8dbf', createdAt: nowISO() },
]

const seedCycles: CycleRecord[] = [
  { id: `cyc-${uid()}`, startDate: dayStr(-28), endDate: dayStr(-24), flow: 'medium', symptoms: ['cólica', 'dor de cabeça'], notes: 'Intensidade moderada', createdAt: nowISO() },
  { id: `cyc-${uid()}`, startDate: dayStr(-56), endDate: dayStr(-52), flow: 'heavy', symptoms: ['cólica forte', 'náusea', 'fadiga'], createdAt: nowISO() },
]

const seedDoctors: Doctor[] = [
  { id: `doc-${uid()}`, name: 'Dra. Ana Oliveira', specialty: 'Clínico Geral', phone: '(11) 99999-0001', email: 'ana.oliveira@email.com', address: 'Rua Augusta, 1500', color: '#5b8dbf', createdAt: nowISO() },
  { id: `doc-${uid()}`, name: 'Dr. Carlos Santos', specialty: 'Dermatologista', phone: '(11) 99999-0002', address: 'Av. Paulista, 2000', color: '#7bb686', createdAt: nowISO() },
]

const seedAppointments: Appointment[] = [
  { id: `apt-${uid()}`, doctorId: seedDoctors[0].id, doctorName: 'Dra. Ana Oliveira', specialty: 'Clínico Geral', date: dayStr(15), time: '10:00', location: 'Rua Augusta, 1500', notes: 'Check-up anual', status: 'scheduled', createdAt: nowISO() },
  { id: `apt-${uid()}`, doctorName: 'Laboratório São Paulo', specialty: 'Exames de sangue', date: dayStr(-20), time: '08:00', location: 'Av. Brigadeiro, 500', status: 'done', createdAt: nowISO() },
]

const seedExams: ExamRecord[] = [
  { id: `exam-${uid()}`, name: 'Hemograma completo', date: dayStr(-20), doctor: 'Dra. Ana Oliveira', laboratory: 'Lab São Paulo', result: 'Tudo dentro da normalidade', status: 'reviewed', color: '#7bb686', createdAt: nowISO() },
  { id: `exam-${uid()}`, name: 'Colesterol e triglicerídeos', date: dayStr(-20), doctor: 'Dra. Ana Oliveira', laboratory: 'Lab São Paulo', result: 'Colesterol levemente elevado (210 mg/dL)', status: 'reviewed', color: '#f0b429', createdAt: nowISO() },
  { id: `exam-${uid()}`, name: 'Glicemia em jejum', date: dayStr(15), doctor: 'Dra. Ana Oliveira', status: 'pending', color: '#e8a0a0', createdAt: nowISO() },
]

interface HealthState {
  weights: WeightRecord[]
  measurements: BodyMeasurement[]
  symptoms: SymptomLog[]
  medications: Medication[]
  cycles: CycleRecord[]
  doctors: Doctor[]
  appointments: Appointment[]
  exams: ExamRecord[]

  /** Altura em cm (para cálculo de IMC) */
  height: number
  /** Peso meta em kg */
  goalWeight: number | null

  addWeight: (data: { date: string; weight: number; notes?: string }) => void
  deleteWeight: (id: string) => void
  setHeight: (cm: number) => void
  setGoalWeight: (kg: number | null) => void

  addMeasurement: (data: { date: string; waist?: number; hips?: number; chest?: number; arm?: number; thigh?: number; notes?: string }) => void
  deleteMeasurement: (id: string) => void

  addSymptom: (data: { date: string; symptom: string; severity: 1 | 2 | 3 | 4 | 5; notes?: string }) => void
  deleteSymptom: (id: string) => void

  addMedication: (data: { name: string; dosage: string; frequency: string; startDate: string; endDate?: string; notes?: string; color?: string }) => void
  deleteMedication: (id: string) => void

  addCycle: (data: { startDate: string; endDate?: string; flow: 'light' | 'medium' | 'heavy'; symptoms?: string[]; notes?: string }) => void
  deleteCycle: (id: string) => void

  addDoctor: (data: { name: string; specialty: string; phone?: string; email?: string; address?: string; notes?: string; color?: string }) => void
  updateDoctor: (id: string, patch: Partial<Doctor>) => void
  deleteDoctor: (id: string) => void

  addAppointment: (data: { doctorId?: string; doctorName: string; specialty: string; date: string; time: string; location?: string; notes?: string }) => void
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void

  addExam: (data: { name: string; date: string; doctor?: string; laboratory?: string; result?: string; notes?: string; color?: string }) => void
  updateExam: (id: string, patch: Partial<ExamRecord>) => void
  deleteExam: (id: string) => void

  /** Sexo biológico do usuário (para filtros de onboarding e ciclo). */
  sex: 'male' | 'female' | null
  /** Indica se o onboarding inicial já foi feito. */
  onboarded: boolean
  setSex: (sex: 'male' | 'female') => void
  /** Marca o onboarding como concluído. */
  completeOnboarding: () => void
  /** Reseta o onboarding (usado para testar/alterar perfil). */
  resetOnboarding: () => void
}

const COLORS = ['#e05b6d', '#f0b429', '#7bb686', '#5b8dbf', '#c9b6e4', '#e8a0a0']

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      weights: seedWeights,
      measurements: [],
      symptoms: seedSymptoms,
      medications: seedMedications,
      cycles: seedCycles,
      doctors: seedDoctors,
      appointments: seedAppointments,
      exams: seedExams,
      height: 170,
      goalWeight: 65,
      sex: null,
      onboarded: false,

      addWeight: (data) =>
        set((s) => ({ weights: [{ id: `w-${uid()}`, ...data, createdAt: nowISO() }, ...s.weights] })),
      deleteWeight: (id) =>
        set((s) => ({ weights: s.weights.filter((w) => w.id !== id) })),
      setHeight: (cm) => set({ height: cm }),
      setGoalWeight: (kg) => set({ goalWeight: kg }),

      addMeasurement: (data) =>
        set((s) => ({ measurements: [{ id: `m-${uid()}`, ...data, createdAt: nowISO() }, ...s.measurements] })),
      deleteMeasurement: (id) =>
        set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),

      addSymptom: (data) =>
        set((s) => ({ symptoms: [{ id: `sym-${uid()}`, ...data, createdAt: nowISO() }, ...s.symptoms] })),
      deleteSymptom: (id) =>
        set((s) => ({ symptoms: s.symptoms.filter((sy) => sy.id !== id) })),

      addMedication: ({ color, ...data }) =>
        set((s) => ({
          medications: [{ id: `med-${uid()}`, ...data, color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)], createdAt: nowISO() }, ...s.medications],
        })),
      deleteMedication: (id) =>
        set((s) => ({ medications: s.medications.filter((m) => m.id !== id) })),

      addCycle: (data) =>
        set((s) => ({ cycles: [{ id: `cyc-${uid()}`, ...data, symptoms: data.symptoms ?? [], createdAt: nowISO() }, ...s.cycles] })),
      deleteCycle: (id) =>
        set((s) => ({ cycles: s.cycles.filter((c) => c.id !== id) })),

      addDoctor: ({ color, ...data }) =>
        set((s) => ({
          doctors: [{ id: `doc-${uid()}`, ...data, color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)], createdAt: nowISO() }, ...s.doctors],
        })),
      updateDoctor: (id, patch) =>
        set((s) => ({ doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDoctor: (id) =>
        set((s) => ({ doctors: s.doctors.filter((d) => d.id !== id) })),

      addAppointment: (data) =>
        set((s) => ({
          appointments: [{ id: `apt-${uid()}`, ...data, status: 'scheduled' as const, createdAt: nowISO() }, ...s.appointments],
        })),
      updateAppointment: (id, patch) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),

      addExam: ({ color, ...data }) =>
        set((s) => ({
          exams: [{ id: `exam-${uid()}`, ...data, color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)], status: 'pending' as const, createdAt: nowISO() }, ...s.exams],
        })),
      updateExam: (id, patch) =>
        set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExam: (id) =>
        set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      setSex: (sex) => set({ sex }),
      completeOnboarding: () => set({ onboarded: true }),
      resetOnboarding: () => set({ onboarded: false, sex: null }),
    }),
    { name: 'plannerhub-health' },
  ),
)
