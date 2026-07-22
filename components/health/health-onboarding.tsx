'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import { cn } from '@/lib/utils'
import {
  Activity,
  Beaker,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Mars,
  Pill,
  Stethoscope,
  Venus,
  Weight,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface FormState {
  weight: string
  height: string
  waist: string
  hips: string
  chest: string
  arm: string
  thigh: string
  symptom: string
  symptomSeverity: string
  medName: string
  medDosage: string
  medFrequency: string
  doctorName: string
  doctorSpecialty: string
  doctorPhone: string
  apptDoctorName: string
  apptSpecialty: string
  apptDate: string
  apptTime: string
  examName: string
  examDate: string
  examLab: string
  cycleStart: string
  cycleEnd: string
  cycleFlow: 'light' | 'medium' | 'heavy'
}

const STEPS = [
  { id: 'sex', label: 'Perfil', icon: HeartPulse },
  { id: 'weight', label: 'Peso', icon: Weight },
  { id: 'measurements', label: 'Medidas', icon: Activity },
  { id: 'symptom', label: 'Sintomas', icon: HeartPulse },
  { id: 'medications', label: 'Medicamentos', icon: Pill },
  { id: 'doctors', label: 'Médicos', icon: Stethoscope },
  { id: 'appointments', label: 'Consultas', icon: CalendarClock },
  { id: 'exams', label: 'Exames', icon: Beaker },
] as const

export function HealthOnboarding() {
  const store = useHealthStore()
  const [step, setStep] = useState(0)
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [showCycle, setShowCycle] = useState(true)
  const [f, setF] = useState<FormState>({
    weight: '',
    height: '',
    waist: '',
    hips: '',
    chest: '',
    arm: '',
    thigh: '',
    symptom: '',
    symptomSeverity: '3',
    medName: '',
    medDosage: '',
    medFrequency: '',
    doctorName: '',
    doctorSpecialty: '',
    doctorPhone: '',
    apptDoctorName: '',
    apptSpecialty: '',
    apptDate: dayStr(7),
    apptTime: '',
    examName: '',
    examDate: dayStr(7),
    examLab: '',
    cycleStart: '',
    cycleEnd: '',
    cycleFlow: 'medium',
  })

  const set = (patch: Partial<FormState>) => setF((prev) => ({ ...prev, ...patch }))

  // Etapas dinâmicas: inclui "Ciclo" apenas se usuário for do sexo feminino
  const steps = [
    ...STEPS,
    ...(sex === 'female'
      ? ([{ id: 'cycle', label: 'Ciclo', icon: Venus }] as const)
      : ([] as const)),
  ]

  const totalSteps = steps.length // inclui perfil
  const isLast = step === totalSteps - 1

  const pickSex = (s: 'male' | 'female') => {
    setSex(s)
    setShowCycle(s === 'female')
  }

  const handleNext = () => {
    if (step === 0 && !sex) {
      toast({ title: 'Selecione seu sexo biológico', variant: 'error' })
      return
    }
    if (step === 1) {
      // Persiste peso
      const w = parseFloat(f.weight)
      if (w && w > 0) {
        store.addWeight({ date: dayStr(), weight: w })
      }
      const h = parseInt(f.height)
      if (h && h > 0) store.setHeight(h)
      // próximo passo: se masculino, pular ciclo ao final (já tratado em steps)
    }
    if (step === 2) {
      const w = parseFloat(f.waist)
      if (w || parseFloat(f.hips) || parseFloat(f.chest) || parseFloat(f.arm) || parseFloat(f.thigh)) {
        store.addMeasurement({
          date: dayStr(),
          waist: w || undefined,
          hips: parseFloat(f.hips) || undefined,
          chest: parseFloat(f.chest) || undefined,
          arm: parseFloat(f.arm) || undefined,
          thigh: parseFloat(f.thigh) || undefined,
        })
      }
    }
    if (step === 3 && f.symptom.trim()) {
      const sev = Number(f.symptomSeverity) as 1 | 2 | 3 | 4 | 5
      store.addSymptom({ date: dayStr(), symptom: f.symptom.trim(), severity: sev })
    }
    if (step === 4 && f.medName.trim()) {
      store.addMedication({
        name: f.medName.trim(),
        dosage: f.medDosage.trim() || '—',
        frequency: f.medFrequency.trim() || '—',
        startDate: dayStr(),
      })
    }
    if (step === 5 && f.doctorName.trim()) {
      store.addDoctor({
        name: f.doctorName.trim(),
        specialty: f.doctorSpecialty.trim() || '—',
        phone: f.doctorPhone.trim() || undefined,
      })
    }
    if (step === 6 && f.apptDoctorName.trim()) {
      store.addAppointment({
        doctorName: f.apptDoctorName.trim(),
        specialty: f.apptSpecialty.trim() || '—',
        date: f.apptDate,
        time: f.apptTime || '08:00',
      })
    }
    if (step === 7 && f.examName.trim()) {
      store.addExam({
        name: f.examName.trim(),
        date: f.examDate,
        laboratory: f.examLab.trim() || undefined,
      })
    }
    const cycleIdx = steps.findIndex((s) => s.id === 'cycle')
    if (cycleIdx >= 0 && step === cycleIdx) {
      if (f.cycleStart) {
        store.addCycle({
          startDate: f.cycleStart,
          endDate: f.cycleEnd || undefined,
          flow: f.cycleFlow,
        })
      }
    }

    if (isLast) {
      if (sex) store.setSex(sex)
      store.completeOnboarding()
      toast({ title: 'Perfil de saúde configurado!', variant: 'success' })
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))
  const handleSkip = () => {
    if (isLast) {
      if (sex) store.setSex(sex)
      store.completeOnboarding()
    } else {
      setStep((s) => s + 1)
    }
  }

  const current = steps[step]
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <Card glass className="w-full max-w-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse size={18} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configuração do perfil · {step + 1}/{totalSteps}
            </span>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            {current.icon && <current.icon size={18} className="text-primary" />}
            {current.label}
          </CardTitle>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: '#7bb686' }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {/* Etapa 0: Sexo */}
          {step === 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Para personalizar seu acompanhamento, informe seu sexo biológico. Isso determina
                se a etapa de ciclo menstrual será exibida.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => pickSex('female')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border px-4 py-6 text-sm font-medium transition-all cursor-pointer',
                    sex === 'female'
                      ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Venus size={28} />
                  Feminino
                </button>
                <button
                  type="button"
                  onClick={() => pickSex('male')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border px-4 py-6 text-sm font-medium transition-all cursor-pointer',
                    sex === 'male'
                      ? 'border-blue-500/60 bg-blue-500/10 text-blue-600 shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Mars size={28} />
                  Masculino
                </button>
              </div>
              {!showCycle && sex === 'male' && (
                <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  A etapa de ciclo menstrual será ocultada para usuários do sexo masculino.
                </p>
              )}
            </div>
          )}

          {/* Etapa 1: Peso */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Peso atual (kg)</label>
                <Input
                  type="number"
                  value={f.weight}
                  onChange={(e) => set({ weight: e.target.value })}
                  placeholder="70,5"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Altura (cm)</label>
                <Input
                  type="number"
                  value={f.height}
                  onChange={(e) => set({ height: e.target.value })}
                  placeholder="170"
                />
              </div>
            </div>
          )}

          {/* Etapa 2: Medidas */}
          {step === 2 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Preencha as medidas que você conhece (em cm). Deixe em branco o que não applicar.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cintura</label>
                  <Input value={f.waist} onChange={(e) => set({ waist: e.target.value })} placeholder="80" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quadril</label>
                  <Input value={f.hips} onChange={(e) => set({ hips: e.target.value })} placeholder="95" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tórax</label>
                  <Input value={f.chest} onChange={(e) => set({ chest: e.target.value })} placeholder="90" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Braço</label>
                  <Input value={f.arm} onChange={(e) => set({ arm: e.target.value })} placeholder="30" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Coxa</label>
                  <Input value={f.thigh} onChange={(e) => set({ thigh: e.target.value })} placeholder="55" />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Sintomas */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Sintoma atual (opcional)
                </label>
                <Input
                  value={f.symptom}
                  onChange={(e) => set({ symptom: e.target.value })}
                  placeholder="Ex: Dor de cabeça, fadiga..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Severidade: {f.symptomSeverity}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={f.symptomSeverity}
                  onChange={(e) => set({ symptomSeverity: e.target.value })}
                  className="w-full accent-[#7bb686]"
                />
              </div>
            </div>
          )}

          {/* Etapa 4: Medicamentos */}
          {step === 4 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome do medicamento</label>
                <Input
                  value={f.medName}
                  onChange={(e) => set({ medName: e.target.value })}
                  placeholder="Ex: Vitamina D"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dosagem</label>
                  <Input value={f.medDosage} onChange={(e) => set({ medDosage: e.target.value })} placeholder="1 comprimido" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Frequência</label>
                  <Input value={f.medFrequency} onChange={(e) => set({ medFrequency: e.target.value })} placeholder="1x ao dia" />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 5: Médicos */}
          {step === 5 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome do médico(a)</label>
                <Input
                  value={f.doctorName}
                  onChange={(e) => set({ doctorName: e.target.value })}
                  placeholder="Ex: Dra. Ana Oliveira"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Especialidade</label>
                  <Input value={f.doctorSpecialty} onChange={(e) => set({ doctorSpecialty: e.target.value })} placeholder="Clínico geral" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
                  <Input value={f.doctorPhone} onChange={(e) => set({ doctorPhone: e.target.value })} placeholder="(11) 99999-0000" />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 6: Consultas */}
          {step === 6 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Registre uma consulta futura (opcional). Você pode adicionar mais depois.
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Médico/local</label>
                <Input
                  value={f.apptDoctorName}
                  onChange={(e) => set({ apptDoctorName: e.target.value })}
                  placeholder="Ex: Dr. Carlos Santos"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Especialidade</label>
                  <Input value={f.apptSpecialty} onChange={(e) => set({ apptSpecialty: e.target.value })} placeholder="Cardiologista" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={f.apptDate} onChange={(e) => set({ apptDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
                <Input type="time" value={f.apptTime} onChange={(e) => set({ apptTime: e.target.value })} />
              </div>
            </div>
          )}

          {/* Etapa 7: Exames */}
          {step === 7 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Registre um exame (opcional). Você pode adicionar mais depois.
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome do exame</label>
                <Input
                  value={f.examName}
                  onChange={(e) => set({ examName: e.target.value })}
                  placeholder="Ex: Hemograma"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={f.examDate} onChange={(e) => set({ examDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Laboratório</label>
                  <Input value={f.examLab} onChange={(e) => set({ examLab: e.target.value })} placeholder="Lab São Paulo" />
                </div>
              </div>
            </div>
          )}

          {/* Etapa Ciclo (apenas feminino) */}
          {current.id === 'cycle' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Registre seu último ciclo menstrual (opcional). Você pode adicionar mais depois.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Início</label>
                  <Input type="date" value={f.cycleStart} onChange={(e) => set({ cycleStart: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
                  <Input type="date" value={f.cycleEnd} onChange={(e) => set({ cycleEnd: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Fluxo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'medium', 'heavy'] as const).map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => set({ cycleFlow: fl })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                        f.cycleFlow === fl
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      {fl === 'light' ? 'Leve' : fl === 'medium' ? 'Médio' : 'Intenso'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className="rounded-xl gap-1 text-xs"
            >
              <ChevronLeft size={14} />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip} className="rounded-xl text-xs text-muted-foreground">
                {isLast ? 'Pular tudo' : 'Pular'}
              </Button>
              <Button onClick={handleNext} className="rounded-xl gap-1">
                {isLast ? (
                  <>
                    <CheckCircle2 size={14} />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={14} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
