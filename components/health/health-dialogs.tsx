'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import { cn } from '@/lib/utils'
import type { Doctor } from '@/lib/types'
import { useState } from 'react'
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

const SPECIALTY_GROUPS: { area: string; items: string[] }[] = [
  { area: 'Clínica médica', items: ['Clínico Geral', 'Geriatra', 'Pediatra'] },
  { area: 'Cardiologia', items: ['Cardiologista'] },
  { area: 'Dermatologia', items: ['Dermatologista'] },
  { area: 'Endocrinologia', items: ['Endocrinologista'] },
  { area: 'Gastroenterologia', items: ['Gastroenterologista'] },
  { area: 'Ginecologia e Obstetrícia', items: ['Ginecologista', 'Obstetra'] },
  { area: 'Hematologia', items: ['Hematologista'] },
  { area: 'Neurologia', items: ['Neurologista'] },
  { area: 'Nutrição', items: ['Nutricionista'] },
  { area: 'Oftalmologia', items: ['Oftalmologista'] },
  { area: 'Oncologia', items: ['Oncologista'] },
  { area: 'Ortopedia', items: ['Ortopedista'] },
  { area: 'Otorrinolaringologia', items: ['Otorrinolaringologista'] },
  { area: 'Pneumologia', items: ['Pneumologista'] },
  { area: 'Psiquiatria', items: ['Psiquiatra'] },
  { area: 'Reumatologia', items: ['Reumatologista'] },
  { area: 'Urologia', items: ['Urologista'] },
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

  const allItems = SPECIALTY_GROUPS.flatMap((g) => g.items)
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
      {SPECIALTY_GROUPS.map((g) => (
        <optgroup key={g.area} label={g.area}>
          {g.items.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={CUSTOM_OPTION}>✎ Outra (digitar)</option>
    </select>
  )
}

const MED_TIMES = ['Manhã', 'Almoço', 'Tarde', 'Jantar', 'Noite']

export function AddWeightDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addWeight = useHealthStore((s) => s.addWeight)
  const height = useHealthStore((s) => s.height)
  const setHeight = useHealthStore((s) => s.setHeight)
  const [date, setDate] = useState(dayStr())
  const [heightInput, setHeightInput] = useState(String(height))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    const w = parseFloat(weight.replace(',', '.'))
    if (!w || w <= 0) { toast({ title: 'Digite um peso válido', variant: 'error' }); return }
    const h = parseInt(heightInput)
    if (h >= 100 && h <= 250 && h !== height) setHeight(h)
    addWeight({ date, weight: w, notes: notes.trim() || undefined })
    toast({ title: 'Peso registrado!', variant: 'success' })
    setWeight(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Registrar peso">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Altura (cm)</label>
              <Input type="number" step="1" min="100" max="250" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} placeholder="170" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Peso (kg)</label>
            <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 70,5" autoFocus />
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

export function AddMeasurementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMeasurement = useHealthStore((s) => s.addMeasurement)
  const [date, setDate] = useState(dayStr())
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [abdomen, setAbdomen] = useState('')
  const [hips, setHips] = useState('')
  const [arm, setArm] = useState('')
  const [thigh, setThigh] = useState('')
  const [calf, setCalf] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    const vals = [bust, waist, abdomen, hips, arm, thigh, calf].filter(Boolean)
    if (vals.length === 0) { toast({ title: 'Preencha ao menos uma medida', variant: 'error' }); return }
    addMeasurement({
      date,
      bust: bust ? parseFloat(bust) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      abdomen: abdomen ? parseFloat(abdomen) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      arm: arm ? parseFloat(arm) : undefined,
      thigh: thigh ? parseFloat(thigh) : undefined,
      calf: calf ? parseFloat(calf) : undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Medidas registradas!', variant: 'success' })
    setBust(''); setWaist(''); setAbdomen(''); setHips(''); setArm(''); setThigh(''); setCalf(''); setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novas medidas corporais">
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

export function AddSymptomDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addSymptom = useHealthStore((s) => s.addSymptom)
  const [date, setDate] = useState(dayStr())
  const [symptom, setSymptom] = useState('')
  const [time, setTime] = useState('')
  const [cause, setCause] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!symptom.trim()) { toast({ title: 'Digite o sintoma', variant: 'error' }); return }
    addSymptom({ date, symptom: symptom.trim(), time: time || undefined, possibleCause: cause.trim() || undefined, severity: 3, notes: notes.trim() || undefined })
    toast({ title: 'Sintoma registrado!', variant: 'success' })
    setSymptom(''); setTime(''); setCause(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Registrar sintoma">
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

export function AddMedicationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMedication = useHealthStore((s) => s.addMedication)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [times, setTimes] = useState<string[]>([])
  const [startDate, setStartDate] = useState(dayStr())
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const toggleTime = (t: string) => {
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const handleSave = () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      toast({ title: 'Preencha nome, dosagem e frequência', variant: 'error' }); return
    }
    addMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      times: times.length > 0 ? times : undefined,
      startDate,
      endDate: endDate || undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Medicamento adicionado!', variant: 'success' })
    setName(''); setDosage(''); setFrequency(''); setTimes([]); setEndDate(''); setReason(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Adicionar medicamento">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Nome</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vitamina D" autoFocus /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Dosagem</label><Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ex: 1 comprimido" /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Frequência</label><Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Ex: 1x ao dia" /></div>
          <div>
            <label className="text-sm font-medium mb-2 block">Horários (pode marcar mais de um)</label>
            <div className="flex flex-wrap gap-2">
              {MED_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                    times.includes(t)
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data de início</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Data de fim</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Motivo</label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Deficiência de vitamina D" /></div>
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

export function AddCycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCycle = useHealthStore((s) => s.addCycle)
  const [startDate, setStartDate] = useState(dayStr())
  const [endDate, setEndDate] = useState('')
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy'>('medium')
  const [cramps, setCramps] = useState(false)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    addCycle({
      startDate,
      endDate: endDate || undefined,
      flow,
      symptoms: cramps ? ['cólica'] : [],
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Ciclo registrado!', variant: 'success' })
    setEndDate(''); setCramps(false); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Registrar ciclo menstrual">
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

export function AddDoctorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addDoctor = useHealthStore((s) => s.addDoctor)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim() || !specialty.trim()) { toast({ title: 'Preencha nome e especialidade', variant: 'error' }); return }
    addDoctor({ name: name.trim(), specialty: specialty.trim(), address: address.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined })
    toast({ title: 'Médico adicionado!', variant: 'success' })
    setName(''); setSpecialty(''); setAddress(''); setPhone(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Adicionar médico">
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

export function AddAppointmentDialog({ open, onClose, doctors }: { open: boolean; onClose: () => void; doctors: Doctor[] }) {
  const addAppointment = useHealthStore((s) => s.addAppointment)
  const healthDoctors = useHealthStore((s) => s.doctors)
  const allDoctors = doctors.length > 0 ? doctors : healthDoctors
  const [doctorId, setDoctorId] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [date, setDate] = useState(dayStr())
  const [time, setTime] = useState('08:00')
  const [whatToBring, setWhatToBring] = useState('')
  const [questions, setQuestions] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!doctorName.trim()) { toast({ title: 'Informe o nome do médico ou local', variant: 'error' }); return }
    addAppointment({
      doctorId: doctorId || undefined,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || '—',
      date,
      time,
      whatToBring: whatToBring.trim() || undefined,
      questions: questions.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Consulta agendada!', variant: 'success' })
    setDoctorId(''); setDoctorName(''); setSpecialty(''); setTime('08:00'); setWhatToBring(''); setQuestions(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Agendar consulta">
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

export function AddExamDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addExam = useHealthStore((s) => s.addExam)
  const healthDoctors = useHealthStore((s) => s.doctors)
  const [name, setName] = useState('')
  const [date, setDate] = useState(dayStr())
  const [time, setTime] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [doctor, setDoctor] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim()) { toast({ title: 'Digite o nome do exame', variant: 'error' }); return }
    addExam({
      name: name.trim(),
      date,
      time: time || undefined,
      doctor: doctor.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Exame registrado!', variant: 'success' })
    setName(''); setTime(''); setDoctorId(''); setDoctor(''); setAddress(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo exame">
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
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
