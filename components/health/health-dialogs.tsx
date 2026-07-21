'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
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

export function AddWeightDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addWeight = useHealthStore((s) => s.addWeight)
  const [date, setDate] = useState(dayStr())
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    const w = parseFloat(weight.replace(',', '.'))
    if (!w || w <= 0) { toast({ title: 'Digite um peso válido', variant: 'error' }); return }
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
              <label className="text-sm font-medium mb-1.5 block">Peso (kg)</label>
              <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 70,5" autoFocus />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
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
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [chest, setChest] = useState('')
  const [arm, setArm] = useState('')
  const [thigh, setThigh] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    const vals = [waist, hips, chest, arm, thigh].filter(Boolean)
    if (vals.length === 0) { toast({ title: 'Preencha ao menos uma medida', variant: 'error' }); return }
    addMeasurement({
      date,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      chest: chest ? parseFloat(chest) : undefined,
      arm: arm ? parseFloat(arm) : undefined,
      thigh: thigh ? parseFloat(thigh) : undefined,
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Medidas registradas!', variant: 'success' })
    setWaist(''); setHips(''); setChest(''); setArm(''); setThigh(''); setNotes('')
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
            <div><label className="text-sm font-medium mb-1.5 block">Cintura (cm)</label><Input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Quadril (cm)</label><Input type="number" step="0.1" value={hips} onChange={(e) => setHips(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Tórax (cm)</label><Input type="number" step="0.1" value={chest} onChange={(e) => setChest(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Braço (cm)</label><Input type="number" step="0.1" value={arm} onChange={(e) => setArm(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Coxa (cm)</label><Input type="number" step="0.1" value={thigh} onChange={(e) => setThigh(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
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
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!symptom.trim()) { toast({ title: 'Digite o sintoma', variant: 'error' }); return }
    addSymptom({ date, symptom: symptom.trim(), severity, notes: notes.trim() || undefined })
    toast({ title: 'Sintoma registrado!', variant: 'success' })
    setSymptom(''); setNotes(''); onClose()
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
            <label className="text-sm font-medium mb-2 block">Intensidade</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button key={n} type="button" onClick={() => setSeverity(n)}
                  className="flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: severity >= n ? '#e05b6d' : 'transparent',
                    color: severity >= n ? 'white' : 'var(--muted-foreground)',
                    borderColor: severity >= n ? '#e05b6d' : 'var(--border)',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
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
  const [startDate, setStartDate] = useState(dayStr())
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      toast({ title: 'Preencha nome, dosagem e frequência', variant: 'error' }); return
    }
    addMedication({ name: name.trim(), dosage: dosage.trim(), frequency: frequency.trim(), startDate, notes: notes.trim() || undefined })
    toast({ title: 'Medicamento adicionado!', variant: 'success' })
    setName(''); setDosage(''); setFrequency(''); setNotes(''); onClose()
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
          <div><label className="text-sm font-medium mb-1.5 block">Data de início</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></div>
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
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    addCycle({
      startDate,
      endDate: endDate || undefined,
      flow,
      symptoms: symptoms ? symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Ciclo registrado!', variant: 'success' })
    setEndDate(''); setSymptoms(''); setNotes(''); onClose()
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
          <div><label className="text-sm font-medium mb-1.5 block">Sintomas (separados por vírgula)</label><Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Ex: cólica, dor de cabeça" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></div>
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
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim() || !specialty.trim()) { toast({ title: 'Preencha nome e especialidade', variant: 'error' }); return }
    addDoctor({ name: name.trim(), specialty: specialty.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined, address: address.trim() || undefined, notes: notes.trim() || undefined })
    toast({ title: 'Médico adicionado!', variant: 'success' })
    setName(''); setSpecialty(''); setPhone(''); setEmail(''); setAddress(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Adicionar médico">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Nome</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Nome" autoFocus /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Especialidade</label><Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Cardiologista" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Telefone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Endereço</label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></div>
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
  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [date, setDate] = useState(dayStr())
  const [time, setTime] = useState('08:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!doctorName.trim()) { toast({ title: 'Informe o nome do médico ou local', variant: 'error' }); return }
    addAppointment({ doctorName: doctorName.trim(), specialty: specialty.trim(), date, time, location: location.trim() || undefined, notes: notes.trim() || undefined })
    toast({ title: 'Consulta agendada!', variant: 'success' })
    setDoctorName(''); setSpecialty(''); setTime('08:00'); setLocation(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Agendar consulta">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Médico / Local</label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Dr. Nome" list="doctor-list" autoFocus />
              <datalist id="doctor-list">
                {allDoctors.map((d) => (<option key={d.id} value={d.name} />))}
              </datalist>
            </div>
            <div><label className="text-sm font-medium mb-1.5 block">Especialidade</label><Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Clínico Geral" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Horário</label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Local</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço da consulta" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></div>
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
  const [name, setName] = useState('')
  const [date, setDate] = useState(dayStr())
  const [doctor, setDoctor] = useState('')
  const [laboratory, setLaboratory] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!name.trim()) { toast({ title: 'Digite o nome do exame', variant: 'error' }); return }
    addExam({ name: name.trim(), date, doctor: doctor.trim() || undefined, laboratory: laboratory.trim() || undefined, notes: notes.trim() || undefined })
    toast({ title: 'Exame registrado!', variant: 'success' })
    setName(''); setDoctor(''); setLaboratory(''); setNotes(''); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo exame">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Nome do exame</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hemograma" autoFocus /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Data</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Médico</label><Input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Opcional" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Laboratório</label><Input value={laboratory} onChange={(e) => setLaboratory(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Observação</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
