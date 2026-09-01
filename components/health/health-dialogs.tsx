'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import { cn } from '@/lib/utils'
import type { Doctor } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

const dayStr = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const SPECIALTIES = [
  'Ginecologista', 'Clínico Geral', 'Dentista', 'Dermatologista',
  'Nutricionista', 'Psicólogo', 'Psiquiatra', 'Endocrinologista',
  'Oftalmologista', 'Outros',
]

const CUSTOM_OPTION = '__custom__'

const selectClass =
  'flex h-9 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20'

/** Combo que lista opções cadastradas com a opção de digitar uma nova. */
function RegisteredSelect({
  options,
  value,
  onPick,
  onCustom,
  placeholder,
}: {
  options: { id: string; label: string; sub?: string }[]
  value: string
  onPick: (id: string, label: string) => void
  onCustom: (label: string) => void
  placeholder: string
}) {
  const [custom, setCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  if (custom) {
    return (
      <div className="flex gap-2">
        <Input
          value={customLabel}
          onChange={(e) => {
            setCustomLabel(e.target.value)
            onCustom(e.target.value)
          }}
          placeholder="Digite o nome..."
          autoFocus
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl shrink-0 px-3"
          onClick={() => {
            setCustom(false)
            setCustomLabel('')
            onCustom('')
          }}
        >
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <select
      className={selectClass}
      value={options.some((o) => o.id === value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === CUSTOM_OPTION) {
          setCustom(true)
          return
        }
        const opt = options.find((o) => o.id === e.target.value)
        if (opt) onPick(opt.id, opt.label)
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
          {o.sub ? ` — ${o.sub}` : ''}
        </option>
      ))}
      <option value={CUSTOM_OPTION}>✎ Outro (digitar)</option>
    </select>
  )
}

/** Combo de especialidades agrupado por área, com opção de digitar. */
function SpecialtyPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [custom, setCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  if (custom) {
    return (
      <div className="flex gap-2">
        <Input
          value={customLabel}
          onChange={(e) => {
            setCustomLabel(e.target.value)
            onChange(e.target.value)
          }}
          placeholder="Digite a especialidade..."
          autoFocus
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl shrink-0 px-3"
          onClick={() => {
            setCustom(false)
            setCustomLabel('')
            onChange('')
          }}
        >
          Voltar
        </Button>
      </div>
    )
  }

  const allItems = SPECIALTIES
  return (
    <select
      className={selectClass}
      value={allItems.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === CUSTOM_OPTION) {
          setCustom(true)
          return
        }
        onChange(e.target.value)
      }}
    >
      <option value="">Selecione a especialidade</option>
      {SPECIALTIES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
      <option value={CUSTOM_OPTION}>✎ Outra (digitar)</option>
    </select>
  )
}

function addDaysToDate(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function daysBetween(startValue: string, endValue: string) {
  const [startYear, startMonth, startDay] = startValue.split('-').map(Number)
  const [endYear, endMonth, endDay] = endValue.split('-').map(Number)
  const start = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

function addHoursToTime(time: string, hours: number) {
  const [hour, minute] = time.split(':').map(Number)
  const totalMinutes = (hour * 60 + minute + hours * 60) % 1440
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

const LEGACY_MEDICATION_TIMES: Record<string, string> = {
  'Manhã': '08:00',
  'Almoço': '12:00',
  Tarde: '15:00',
  Jantar: '20:00',
  Noite: '22:00',
}

function normalizeMedicationTimes(values?: string[]) {
  return (values ?? []).map((value) => LEGACY_MEDICATION_TIMES[value] ?? value)
}

function calculateMedicationTimes(firstTime: string, intervalHours: number) {
  if (!firstTime || !Number.isInteger(intervalHours) || intervalHours < 1 || intervalHours > 24) return []
  const doseCount = Math.floor(24 / intervalHours)
  return Array.from({ length: doseCount }, (_, index) => addHoursToTime(firstTime, index * intervalHours))
}

export function AddWeightDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addWeight = useHealthStore((s) => s.addWeight)
  const updateWeight = useHealthStore((s) => s.updateWeight)
  const existing = useHealthStore((s) => s.weights.find((item) => item.id === editId))
  const height = useHealthStore((s) => s.height)
  const setHeight = useHealthStore((s) => s.setHeight)
  const [date, setDate] = useState(dayStr())
  const [heightInput, setHeightInput] = useState(String(height))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setDate(existing.date)
      setWeight(String(existing.weight))
      setNotes(existing.notes ?? '')
    } else if (!editId) {
      setDate(dayStr()); setWeight(''); setNotes('')
    }
  }, [open, editId, existing])

  // Após o cadastro inicial, a altura fica fixa (vem do perfil) — exibida antes do peso.
  const fixedHeight = height > 0

  const handleSave = () => {
    const w = parseFloat(weight.replace(',', '.'))
    if (!w || w <= 0) { toast({ title: 'Digite um peso válido', variant: 'error' }); return }
    if (!fixedHeight) {
      const h = parseInt(heightInput)
      if (h >= 100 && h <= 250) setHeight(h)
    }
    const data = { date, weight: w, notes: notes.trim() || undefined }
    if (editId) {
      updateWeight(editId, data)
      toast({ title: 'Peso atualizado!', variant: 'success' })
    } else {
      addWeight(data)
      toast({ title: 'Peso registrado!', variant: 'success' })
    }
    setWeight(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar registro de peso' : 'Registrar peso'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Altura (cm)</label>
              {fixedHeight ? (
                <div className="flex h-9 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                  {height} cm
                </div>
              ) : (
                <Input type="number" step="1" min="100" max="250" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} placeholder="170" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Peso (kg)</label>
              <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 70,5" autoFocus />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddMeasurementDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addMeasurement = useHealthStore((s) => s.addMeasurement)
  const updateMeasurement = useHealthStore((s) => s.updateMeasurement)
  const existing = useHealthStore((s) => s.measurements.find((item) => item.id === editId))
  const [date, setDate] = useState(dayStr())
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [abdomen, setAbdomen] = useState('')
  const [hips, setHips] = useState('')
  const [arm, setArm] = useState('')
  const [thigh, setThigh] = useState('')
  const [calf, setCalf] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setDate(existing.date)
      setBust(existing.bust?.toString() ?? ''); setWaist(existing.waist?.toString() ?? '')
      setAbdomen(existing.abdomen?.toString() ?? ''); setHips(existing.hips?.toString() ?? '')
      setArm(existing.arm?.toString() ?? ''); setThigh(existing.thigh?.toString() ?? '')
      setCalf(existing.calf?.toString() ?? ''); setNotes(existing.notes ?? '')
    } else if (!editId) {
      setDate(dayStr()); setBust(''); setWaist(''); setAbdomen(''); setHips(''); setArm(''); setThigh(''); setCalf(''); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    const vals = [bust, waist, abdomen, hips, arm, thigh, calf].filter(Boolean)
    if (vals.length === 0) { toast({ title: 'Preencha ao menos uma medida', variant: 'error' }); return }
    const data = {
      date,
      bust: bust ? parseFloat(bust) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      abdomen: abdomen ? parseFloat(abdomen) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      arm: arm ? parseFloat(arm) : undefined,
      thigh: thigh ? parseFloat(thigh) : undefined,
      calf: calf ? parseFloat(calf) : undefined,
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateMeasurement(editId, data)
      toast({ title: 'Medidas atualizadas!', variant: 'success' })
    } else {
      addMeasurement(data)
      toast({ title: 'Medidas registradas!', variant: 'success' })
    }
    setBust(''); setWaist(''); setAbdomen(''); setHips(''); setArm(''); setThigh(''); setCalf(''); setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar medidas corporais' : 'Novas medidas corporais'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Busto (cm)</label><Input type="number" step="0.1" value={bust} onChange={(e) => setBust(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Cintura (cm)</label><Input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Abdômen (cm)</label><Input type="number" step="0.1" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Quadris (cm)</label><Input type="number" step="0.1" value={hips} onChange={(e) => setHips(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Braço (cm)</label><Input type="number" step="0.1" value={arm} onChange={(e) => setArm(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Coxa (cm)</label><Input type="number" step="0.1" value={thigh} onChange={(e) => setThigh(e.target.value)} /></div>
            <div className="col-span-2"><label className="text-sm font-medium mb-1.5 block">Panturrilha (cm)</label><Input type="number" step="0.1" value={calf} onChange={(e) => setCalf(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddSymptomDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addSymptom = useHealthStore((s) => s.addSymptom)
  const updateSymptom = useHealthStore((s) => s.updateSymptom)
  const existing = useHealthStore((s) => s.symptoms.find((item) => item.id === editId))
  const [date, setDate] = useState(dayStr())
  const [symptom, setSymptom] = useState('')
  const [time, setTime] = useState('')
  const [cause, setCause] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setDate(existing.date); setSymptom(existing.symptom); setTime(existing.time ?? '')
      setCause(existing.possibleCause ?? ''); setNotes(existing.notes ?? '')
    } else if (!editId) {
      setDate(dayStr()); setSymptom(''); setTime(''); setCause(''); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    if (!symptom.trim()) { toast({ title: 'Digite o sintoma', variant: 'error' }); return }
    const data = { date, symptom: symptom.trim(), time: time || undefined, possibleCause: cause.trim() || undefined, severity: (existing?.severity ?? 3) as 1 | 2 | 3 | 4 | 5, notes: notes.trim() || undefined }
    if (editId) {
      updateSymptom(editId, data)
      toast({ title: 'Sintoma atualizado!', variant: 'success' })
    } else {
      addSymptom(data)
      toast({ title: 'Sintoma registrado!', variant: 'success' })
    }
    setSymptom(''); setTime(''); setCause(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar sintoma' : 'Registrar sintoma'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sintoma</label>
              <Input value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="Ex: Dor de cabeça" autoFocus />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Horário</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Possível causa</label>
            <Input value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Ex: Dormi pouco, jejum prolongado" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddMedicationDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addMedication = useHealthStore((s) => s.addMedication)
  const updateMedication = useHealthStore((s) => s.updateMedication)
  const existing = useHealthStore((s) => s.medications.find((item) => item.id === editId))
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [durationDays, setDurationDays] = useState('1')
  const [intervalHours, setIntervalHours] = useState('24')
  const [firstTime, setFirstTime] = useState('08:00')
  const [startDate, setStartDate] = useState(dayStr())
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      const parsedDurationDays = existing.durationDays ?? (existing.endDate ? daysBetween(existing.startDate, existing.endDate) : 1)
      setName(existing.name); setDosage(existing.dosage)
      const storedTimes = normalizeMedicationTimes(existing.times)
      setDurationDays(String(parsedDurationDays)); setIntervalHours(String(existing.intervalHours ?? 24))
      setFirstTime(storedTimes[0]?.match(/^\d{2}:\d{2}$/)?.[0] ?? '08:00')
      setStartDate(existing.startDate); setNotes(existing.notes ?? '')
    } else if (!editId) {
      const today = dayStr()
      setName(''); setDosage(''); setDurationDays('1'); setIntervalHours('24')
      setFirstTime('08:00'); setStartDate(today); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    const days = Number(durationDays)
    const interval = Number(intervalHours)
    const generatedTimes = calculateMedicationTimes(firstTime, interval)
    if (!name.trim() || !dosage.trim()) {
      toast({ title: 'Preencha nome e dosagem', variant: 'error' }); return
    }
    if (!Number.isInteger(days) || days < 1) {
      toast({ title: 'Informe a duração do tratamento em dias', variant: 'error' }); return
    }
    if (!Number.isInteger(interval) || interval < 1 || interval > 24) {
      toast({ title: 'O intervalo deve estar entre 1 e 24 horas', variant: 'error' }); return
    }
    if (!startDate || generatedTimes.length === 0) {
      toast({ title: 'Informe o primeiro horário e um intervalo válido', variant: 'error' }); return
    }
    const data = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: `${generatedTimes.length}x ao dia`,
      times: generatedTimes,
      durationDays: days,
      intervalHours: interval,
      startDate,
      endDate: addDaysToDate(startDate, days - 1),
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateMedication(editId, data)
      toast({ title: 'Medicamento atualizado!', variant: 'success' })
    } else {
      addMedication(data)
      toast({ title: 'Medicamento adicionado!', variant: 'success' })
    }
    setName(''); setDosage(''); setDurationDays('1'); setIntervalHours('24'); setFirstTime('08:00'); setStartDate(dayStr()); setNotes(''); onClose()
  }

  const calculatedTimes = calculateMedicationTimes(firstTime, Number(intervalHours))
  const calculatedEndDate = startDate && Number.isInteger(Number(durationDays)) && Number(durationDays) > 0
    ? addDaysToDate(startDate, Number(durationDays) - 1)
    : ''

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar medicamento' : 'Adicionar medicamento'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Nome</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vitamina D" autoFocus /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Dosagem</label><Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ex: 1 comprimido" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data de início</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Dias de tratamento</label><Input type="number" min="1" max="3650" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} /></div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Data de fim calculada: {calculatedEndDate ? calculatedEndDate.split('-').reverse().join('/') : 'informe a duração'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Intervalo entre doses (horas)</label><Input type="number" min="1" max="24" value={intervalHours} onChange={(e) => setIntervalHours(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Primeiro horário</label><Input type="time" value={firstTime} onChange={(e) => setFirstTime(e.target.value)} /></div>
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
            <p className="text-sm font-medium">Horários calculados automaticamente</p>
            <p className="text-xs text-muted-foreground">A partir do primeiro horário e do intervalo entre as doses.</p>
            <div className="flex flex-wrap gap-1.5">
              {calculatedTimes.map((time) => (
                <span key={time} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {time}
                </span>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddCycleDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addCycle = useHealthStore((s) => s.addCycle)
  const updateCycle = useHealthStore((s) => s.updateCycle)
  const existing = useHealthStore((s) => s.cycles.find((item) => item.id === editId))
  const [startDate, setStartDate] = useState(dayStr())
  const [endDate, setEndDate] = useState('')
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy'>('medium')
  const [cramps, setCramps] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setStartDate(existing.startDate); setEndDate(existing.endDate ?? ''); setFlow(existing.flow)
      setCramps(existing.symptoms?.includes('cólica') ?? false); setNotes(existing.notes ?? '')
    } else if (!editId) {
      setStartDate(dayStr()); setEndDate(''); setFlow('medium'); setCramps(false); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    const data = {
      startDate,
      endDate: endDate || undefined,
      flow,
      symptoms: cramps ? ['cólica'] : [],
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateCycle(editId, data)
      toast({ title: 'Ciclo atualizado!', variant: 'success' })
    } else {
      addCycle(data)
      toast({ title: 'Ciclo registrado!', variant: 'success' })
    }
    setEndDate(''); setCramps(false); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar ciclo menstrual' : 'Registrar ciclo menstrual'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data de início</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Data de fim</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fluxo</label>
            <div className="flex gap-2">
              {(['light', 'medium', 'heavy'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFlow(f)}
                  className="flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: flow === f ? '#e05b6d' : 'transparent',
                    color: flow === f ? 'white' : 'var(--muted-foreground)',
                    borderColor: flow === f ? '#e05b6d' : 'var(--border)',
                  }}
                >{f === 'light' ? 'Leve' : f === 'medium' ? 'Moderado' : 'Intenso'}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Cólica</label>
            <div className="flex gap-2">
              {([true, false] as const).map((v) => (
                <button key={String(v)} type="button" onClick={() => setCramps(v)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                    cramps === v
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >{v ? 'Sim' : 'Não'}</button>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddDoctorDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addDoctor = useHealthStore((s) => s.addDoctor)
  const updateDoctor = useHealthStore((s) => s.updateDoctor)
  const existing = useHealthStore((s) => s.doctors.find((item) => item.id === editId))
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setName(existing.name); setSpecialty(existing.specialty); setAddress(existing.address ?? '')
      setPhone(existing.phone ?? ''); setNotes(existing.notes ?? '')
    } else if (!editId) {
      setName(''); setSpecialty(''); setAddress(''); setPhone(''); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    if (!name.trim() || !specialty.trim()) { toast({ title: 'Preencha nome e especialidade', variant: 'error' }); return }
    const data = { name: name.trim(), specialty: specialty.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined }
    if (editId) {
      updateDoctor(editId, data)
      toast({ title: 'Médico atualizado!', variant: 'success' })
    } else {
      addDoctor(data)
      toast({ title: 'Médico adicionado!', variant: 'success' })
    }
    setName(''); setSpecialty(''); setAddress(''); setPhone(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar médico' : 'Adicionar médico'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Nome" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Especialidade</label>
            <SpecialtyPicker value={specialty} onChange={setSpecialty} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Endereço</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Telefone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddAppointmentDialog({ open, onClose, doctors, editId }: { open: boolean; onClose: () => void; doctors: Doctor[]; editId?: string }) {
  const addAppointment = useHealthStore((s) => s.addAppointment)
  const updateAppointment = useHealthStore((s) => s.updateAppointment)
  const healthDoctors = useHealthStore((s) => s.doctors)
  const allDoctors = doctors.length > 0 ? doctors : healthDoctors
  const existing = useHealthStore((s) => s.appointments.find((item) => item.id === editId))
  const [doctorId, setDoctorId] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [date, setDate] = useState(dayStr())
  const [time, setTime] = useState('08:00')
  const [whatToBring, setWhatToBring] = useState('')
  const [questions, setQuestions] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setDoctorId(existing.doctorId ?? ''); setDoctorName(existing.doctorName); setSpecialty(existing.specialty)
      setDate(existing.date); setTime(existing.time); setWhatToBring(existing.whatToBring ?? '')
      setQuestions(existing.questions ?? ''); setNotes(existing.notes ?? '')
    } else if (!editId) {
      setDoctorId(''); setDoctorName(''); setSpecialty(''); setDate(dayStr()); setTime('08:00')
      setWhatToBring(''); setQuestions(''); setNotes('')
    }
  }, [open, editId, existing])

  const handleSave = () => {
    if (!doctorName.trim()) { toast({ title: 'Informe o nome do médico ou local', variant: 'error' }); return }
    const data = {
      doctorId: doctorId || undefined,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || '—',
      date,
      time,
      whatToBring: whatToBring.trim() || undefined,
      questions: questions.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateAppointment(editId, data)
      toast({ title: 'Consulta atualizada!', variant: 'success' })
    } else {
      addAppointment(data)
      toast({ title: 'Consulta agendada!', variant: 'success' })
    }
    setDoctorId(''); setDoctorName(''); setSpecialty(''); setTime('08:00'); setWhatToBring(''); setQuestions(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar consulta' : 'Agendar consulta'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Médico</label>
            <RegisteredSelect
              options={allDoctors.map((d) => ({ id: d.id, label: d.name, sub: d.specialty }))}
              value={doctorId}
              onPick={(id, label) => {
                setDoctorId(id)
                setDoctorName(label)
                const doc = allDoctors.find((d) => d.id === id)
                setSpecialty(doc?.specialty ?? '')
              }}
              onCustom={(label) => {
                setDoctorId('')
                setDoctorName(label)
              }}
              placeholder="Selecione um médico cadastrado"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Horário</label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">O que levar</label>
            <Input value={whatToBring} onChange={(e) => setWhatToBring(e.target.value)} placeholder="Ex: pedidos de exames, documentos" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Perguntas para o médico</label>
            <Input value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Ex: preciso de acompanhamento mensal?" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Agendar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddExamDialog({ open, onClose, editId }: { open: boolean; onClose: () => void; editId?: string }) {
  const addExam = useHealthStore((s) => s.addExam)
  const updateExam = useHealthStore((s) => s.updateExam)
  const healthDoctors = useHealthStore((s) => s.doctors)
  const existing = useHealthStore((s) => s.exams.find((item) => item.id === editId))
  const [name, setName] = useState('')
  const [date, setDate] = useState(dayStr())
  const [time, setTime] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [doctor, setDoctor] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setName(existing.name); setDate(existing.date); setTime(existing.time ?? '')
      setDoctor(existing.doctor ?? ''); setAddress(existing.address ?? ''); setNotes(existing.notes ?? '')
      const doctorMatch = healthDoctors.find((item) => item.name === existing.doctor)
      setDoctorId(doctorMatch?.id ?? '')
    } else if (!editId) {
      setName(''); setDate(dayStr()); setTime(''); setDoctorId(''); setDoctor(''); setAddress(''); setNotes('')
    }
  }, [open, editId, existing, healthDoctors])

  const handleSave = () => {
    if (!name.trim()) { toast({ title: 'Digite o nome do exame', variant: 'error' }); return }
    const data = {
      name: name.trim(),
      date,
      time: time || undefined,
      doctor: doctor.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    if (editId) {
      updateExam(editId, data)
      toast({ title: 'Exame atualizado!', variant: 'success' })
    } else {
      addExam(data)
      toast({ title: 'Exame registrado!', variant: 'success' })
    }
    setName(''); setTime(''); setDoctorId(''); setDoctor(''); setAddress(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editId ? 'Editar exame' : 'Novo exame'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome do exame</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hemograma" autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Médico solicitante</label>
            <RegisteredSelect
              options={healthDoctors.map((d) => ({ id: d.id, label: d.name, sub: d.specialty }))}
              value={doctorId}
              onPick={(id, label) => {
                setDoctorId(id)
                setDoctor(label)
              }}
              onCustom={(label) => {
                setDoctorId('')
                setDoctor(label)
              }}
              placeholder="Selecione um médico cadastrado"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Horário</label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Endereço</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Laboratório ou clínica" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">{editId ? 'Salvar alterações' : 'Salvar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
