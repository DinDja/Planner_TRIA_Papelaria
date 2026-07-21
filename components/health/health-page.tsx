'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import { cn } from '@/lib/utils'
import {
  Activity,
  Beaker,
  CalendarClock,
  Cigarette,
  ClipboardCheck,
  HeartPulse,
  Pill,
  Plus,
  Stethoscope,
  Target,
  Trash2,
  Weight,
  Venus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Input } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddWeightDialog, AddSymptomDialog, AddMedicationDialog, AddCycleDialog, AddDoctorDialog, AddAppointmentDialog, AddExamDialog, AddMeasurementDialog } from './health-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function calcBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0
  const h = heightCm / 100
  return weightKg / (h * h)
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#5b8dbf' }
  if (bmi < 25) return { label: 'Peso normal', color: '#7bb686' }
  if (bmi < 30) return { label: 'Sobrepeso', color: '#f0b429' }
  return { label: 'Obesidade', color: '#e05b6d' }
}

function WeightChart({ weights }: { weights: { date: string; weight: number }[] }) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const w = 340
  const h = 140
  const pad = { top: 12, right: 10, bottom: 20, left: 36 }

  const minW = Math.min(...sorted.map((s) => s.weight)) - 2
  const maxW = Math.max(...sorted.map((s) => s.weight)) + 2
  const range = maxW - minW || 1

  const xScale = (i: number) => pad.left + (i / (sorted.length - 1)) * (w - pad.left - pad.right)
  const yScale = (v: number) => pad.top + ((maxW - v) / range) * (h - pad.top - pad.bottom)

  const points = sorted.map((s, i) => `${xScale(i)},${yScale(s.weight)}`).join(' ')

  // moving average (3-point)
  const movingAvg: { x: number; y: number }[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i < 2) continue
    const avg = (sorted[i - 2].weight + sorted[i - 1].weight + sorted[i].weight) / 3
    movingAvg.push({ x: xScale(i), y: yScale(avg) })
  }

  const yLabels: number[] = []
  const step = range / 4
  for (let i = 0; i <= 4; i++) {
    yLabels.push(minW + step * i)
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Gráfico de peso">
      {/* grid lines */}
      {yLabels.map((v) => (
        <g key={v}>
          <line x1={pad.left} y1={yScale(v)} x2={w - pad.right} y2={yScale(v)} stroke="var(--border)" strokeWidth="0.5" />
          <text x={pad.left - 4} y={yScale(v) + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize="8">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      {/* area fill */}
      <polygon
        points={`${xScale(0)},${h - pad.bottom} ${points} ${xScale(sorted.length - 1)},${h - pad.bottom}`}
        fill="var(--primary)"
        fillOpacity="0.08"
      />
      {/* trend line (moving avg) */}
      {movingAvg.length > 1 && (
        <polyline
          points={movingAvg.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.5"
        />
      )}
      {/* weight line */}
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* dots */}
      {sorted.map((s, i) => (
        <circle
          key={`${s.date}-${i}`}
          cx={xScale(i)}
          cy={yScale(s.weight)}
          r="3"
          fill={`hsl(var(--primary))`}
          stroke="var(--card)"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  )
}

function WeightTab() {
  const weights = useHealthStore((s) => s.weights)
  const height = useHealthStore((s) => s.height)
  const goalWeight = useHealthStore((s) => s.goalWeight)
  const deleteWeight = useHealthStore((s) => s.deleteWeight)
  const setHeight = useHealthStore((s) => s.setHeight)
  const setGoalWeight = useHealthStore((s) => s.setGoalWeight)
  const [addOpen, setAddOpen] = useState(false)
  const [editingHeight, setEditingHeight] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [heightInput, setHeightInput] = useState(String(height))
  const [goalInput, setGoalInput] = useState(goalWeight ? String(goalWeight) : '')

  const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const first = sorted[sorted.length - 1]
  const diff = latest && first ? (latest.weight - first.weight).toFixed(1) : '0'
  const diffNum = parseFloat(diff)

  const bmi = latest ? calcBMI(latest.weight, height) : 0
  const bmiInfo = bmiCategory(bmi)

  const goalDiff = latest && goalWeight ? (latest.weight - goalWeight).toFixed(1) : null
  const goalDiffNum = goalDiff ? parseFloat(goalDiff) : 0

  const chartData = useMemo(() => {
    const sortedAsc = [...weights].sort((a, b) => a.date.localeCompare(b.date))
    return sortedAsc.slice(-20)
  }, [weights])

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm h-full">
            <Weight size={16} className="text-primary shrink-0" />
            <div className="leading-tight min-w-0">
              <p className="text-lg font-bold tabular-nums">{latest?.weight ?? '—'} kg</p>
              <p className="text-[10px] text-muted-foreground">última medição</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm h-full">
            <Activity size={16} className={diffNum <= 0 ? 'text-emerald-500' : 'text-destructive shrink-0'} />
            <div className="leading-tight">
              <p className="text-sm font-bold tabular-nums" style={{ color: diffNum <= 0 ? 'var(--emerald-500)' : 'var(--destructive)' }}>
                {diffNum > 0 ? '+' : ''}{diff} kg
              </p>
              <p className="text-[10px] text-muted-foreground">variação total</p>
            </div>
          </div>
        </div>

        <div>
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 py-3 shadow-sm h-full cursor-pointer hover:brightness-95 transition-all"
            style={{ borderColor: bmiInfo.color + '40', backgroundColor: bmiInfo.color + '10' }}
            onClick={() => { setEditingHeight(true); setHeightInput(String(height)) }}
            title="Clique para ajustar altura"
          >
            <div className="leading-tight min-w-0">
              <p className="text-lg font-bold tabular-nums" style={{ color: bmiInfo.color }}>{bmi.toFixed(1)}</p>
              <p className="text-[10px] font-medium" style={{ color: bmiInfo.color }}>IMC · {bmiInfo.label}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 shadow-sm h-full">
            <Target size={16} className="shrink-0" style={{ color: !goalDiff || goalDiffNum <= 0 ? '#7bb686' : '#f0b429' }} />
            <div className="leading-tight min-w-0">
              {goalWeight ? (
                <>
                  <p className="text-lg font-bold tabular-nums">
                    {goalWeight} kg
                    {goalDiff && (
                      <span className="text-xs font-normal ml-1" style={{ color: goalDiffNum <= 0 ? '#7bb686' : '#f0b429' }}>
                        ({goalDiffNum > 0 ? '+' : ''}{goalDiff})
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">meta{latest && latest.weight <= goalWeight ? ' 🎯' : ''}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-muted-foreground">—</p>
                  <p
                    className="text-[10px] text-muted-foreground underline decoration-dotted cursor-pointer"
                    onClick={() => { setEditingGoal(true); setGoalInput('') }}
                  >definir meta</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity size={14} />
            Evolução do peso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length >= 2 ? (
            <>
              <WeightChart weights={chartData} />
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Peso</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary/50" /> Tendência (média 3)</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Registre ao menos 2 medições para ver o gráfico.</p>
          )}
        </CardContent>
      </Card>

      {/* Height & Goal inline editors */}
      {editingHeight && (
        <div className="flex items-center gap-2 mb-4 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium">Altura:</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="1"
              min="100"
              max="250"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              className="w-20 h-8 text-sm"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">cm</span>
          </div>
          <Button
            size="sm"
            variant="default"
            className="rounded-xl h-8 ml-auto"
            onClick={() => {
              const v = parseInt(heightInput)
              if (v >= 100 && v <= 250) {
                setHeight(v)
                setEditingHeight(false)
              }
            }}
          >Salvar</Button>
          <Button size="sm" variant="ghost" className="rounded-xl h-8" onClick={() => setEditingHeight(false)}>Cancelar</Button>
        </div>
      )}

      {editingGoal && (
        <div className="flex items-center gap-2 mb-4 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium">Meta de peso:</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-24 h-8 text-sm"
              placeholder="kg"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">kg</span>
          </div>
          <Button
            size="sm"
            variant="default"
            className="rounded-xl h-8 ml-auto"
            onClick={() => {
              const v = parseFloat(goalInput)
              if (v > 0) {
                setGoalWeight(v)
                setEditingGoal(false)
              }
            }}
          >Salvar</Button>
          <Button size="sm" variant="ghost" className="rounded-xl h-8" onClick={() => { setEditingGoal(false); setGoalWeight(null) }}>
            Remover
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl h-8" onClick={() => setEditingGoal(false)}>Cancelar</Button>
        </div>
      )}

      {/* Record button + list */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? 'registro' : 'registros'}
          {height > 0 && latest && <span className="ml-2 text-[11px]">· IMC {bmi.toFixed(1)} — {bmiInfo.label}</span>}
        </p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Registrar peso
        </Button>
      </div>

      <div className="space-y-1">
        {sorted.map((w) => {
          const wBmi = height > 0 ? calcBMI(w.weight, height) : 0
          const wBmiInfo = wBmi ? bmiCategory(wBmi) : null
          return (
            <div key={w.id} className="group flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(w.date)}</span>
              <span className="text-sm font-bold tabular-nums">{w.weight} kg</span>
              {wBmiInfo && (
                <span className="text-[10px] tabular-nums" style={{ color: wBmiInfo.color }}>
                  IMC {wBmi.toFixed(1)}
                </span>
              )}
              {w.notes && <span className="text-xs text-muted-foreground/70 truncate">{w.notes}</span>}
              <button onClick={() => deleteWeight(w.id)} className="ml-auto rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer">
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
      <AddWeightDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function SymptomsTab() {
  const symptoms = useHealthStore((s) => s.symptoms)
  const deleteSymptom = useHealthStore((s) => s.deleteSymptom)
  const [addOpen, setAddOpen] = useState(false)

  const sorted = [...symptoms].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} registros</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Novo sintoma
        </Button>
      </div>
      <div className="space-y-1">
        {sorted.map((s) => (
          <div key={s.id} className="group flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(s.date)}</span>
            <span className="text-sm font-medium flex-1">{s.symptom}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={cn('size-2 rounded-full', n <= s.severity ? 'bg-destructive' : 'bg-muted')} />
              ))}
            </div>
            {s.notes && <span className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{s.notes}</span>}
            <button onClick={() => deleteSymptom(s.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AddSymptomDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function MedicationsTab() {
  const medications = useHealthStore((s) => s.medications)
  const deleteMedication = useHealthStore((s) => s.deleteMedication)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{medications.length} medicamentos</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {medications.map((m) => (
          <Card key={m.id} glass className="relative group" style={{ borderLeft: `4px solid ${m.color}` }}>
            <CardHeader className="pb-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{m.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{m.dosage} · {m.frequency}</p>
                </div>
                <button onClick={() => deleteMedication(m.id)} className="rounded-lg p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-[10px] text-muted-foreground">Desde {formatDate(m.startDate)}{m.endDate ? ` até ${formatDate(m.endDate)}` : ''}</p>
              {m.notes && <p className="text-xs text-muted-foreground/70 mt-1">{m.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <AddMedicationDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function CyclesTab() {
  const cycles = useHealthStore((s) => s.cycles)
  const deleteCycle = useHealthStore((s) => s.deleteCycle)
  const [addOpen, setAddOpen] = useState(false)

  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} ciclos registrados</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Registrar
        </Button>
      </div>
      <div className="space-y-2">
        {sorted.map((c) => (
          <div key={c.id} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
              <Venus size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {formatDate(c.startDate)}
                {c.endDate ? ` – ${formatDate(c.endDate)}` : ' · em andamento'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] px-1.5">
                  {c.flow === 'light' ? 'Leve' : c.flow === 'medium' ? 'Moderado' : 'Intenso'}
                </Badge>
                {c.symptoms.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{c.symptoms.join(', ')}</span>
                )}
              </div>
              {c.notes && <p className="text-xs text-muted-foreground/70 mt-1">{c.notes}</p>}
            </div>
            <button onClick={() => deleteCycle(c.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AddCycleDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function DoctorsTab() {
  const doctors = useHealthStore((s) => s.doctors)
  const deleteDoctor = useHealthStore((s) => s.deleteDoctor)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{doctors.length} médicos</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {doctors.map((d) => (
          <Card key={d.id} glass className="relative group" style={{ borderLeft: `4px solid ${d.color}` }}>
            <CardHeader className="pb-1">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: d.color + '18' }}>
                    <Stethoscope size={16} style={{ color: d.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{d.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  </div>
                </div>
                <button onClick={() => deleteDoctor(d.id)} className="rounded-lg p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-1 space-y-0.5 text-xs text-muted-foreground/80">
              {d.phone && <p>📞 {d.phone}</p>}
              {d.email && <p>✉ {d.email}</p>}
              {d.address && <p>📍 {d.address}</p>}
              {d.notes && <p className="text-muted-foreground/60 mt-1">{d.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <AddDoctorDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function AppointmentsTab() {
  const appointments = useHealthStore((s) => s.appointments)
  const updateAppointment = useHealthStore((s) => s.updateAppointment)
  const deleteAppointment = useHealthStore((s) => s.deleteAppointment)
  const [addOpen, setAddOpen] = useState(false)

  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date))
  const statusColor = { scheduled: '#5b8dbf', done: '#7bb686', cancelled: '#e8a0a0' }
  const statusLabel = { scheduled: 'Agendada', done: 'Realizada', cancelled: 'Cancelada' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} consultas</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Agendar
        </Button>
      </div>
      <div className="space-y-2">
        {sorted.map((a) => (
          <div key={a.id} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarClock size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{a.doctorName}</span>
                <Badge variant="outline" className="text-[9px] px-1.5" style={{ color: statusColor[a.status], borderColor: statusColor[a.status] + '50' }}>
                  {statusLabel[a.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(a.date)} às {a.time} · {a.specialty}
                {a.location && ` · ${a.location}`}
              </p>
              {a.notes && <p className="text-xs text-muted-foreground/70 mt-1">{a.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {a.status === 'scheduled' && (
                <button onClick={() => updateAppointment(a.id, { status: 'done' })} className="rounded-lg p-1 text-muted-foreground/30 hover:text-emerald-500 transition-colors cursor-pointer" title="Marcar como realizada">
                  <ClipboardCheck size={14} />
                </button>
              )}
              <button onClick={() => deleteAppointment(a.id)} className="rounded-lg p-1 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddAppointmentDialog open={addOpen} onClose={() => setAddOpen(false)} doctors={[]} />
      {/* doctors prop deprecated: dialog reads from store internally */}
    </div>
  )
}

function ExamsTab() {
  const exams = useHealthStore((s) => s.exams)
  const updateExam = useHealthStore((s) => s.updateExam)
  const deleteExam = useHealthStore((s) => s.deleteExam)
  const [addOpen, setAddOpen] = useState(false)

  const sorted = [...exams].sort((a, b) => b.date.localeCompare(a.date))
  const statusColor = { pending: '#f0b429', done: '#5b8dbf', reviewed: '#7bb686' }
  const statusLabel = { pending: 'Pendente', done: 'Realizado', reviewed: 'Revisado' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} exames</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Novo exame
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((e) => (
          <Card key={e.id} glass className="relative group" style={{ borderLeft: `4px solid ${e.color}` }}>
            <CardHeader className="pb-1">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: e.color + '18' }}>
                    <Beaker size={16} style={{ color: e.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{e.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {e.status !== 'reviewed' && (
                    <button onClick={() => updateExam(e.id, { status: e.status === 'pending' ? 'done' : 'reviewed' })} className="rounded-lg p-1 text-muted-foreground/30 hover:text-primary transition-colors cursor-pointer">
                      <ClipboardCheck size={13} />
                    </button>
                  )}
                  <button onClick={() => deleteExam(e.id)} className="rounded-lg p-1 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <Badge variant="outline" className="text-[9px] px-1.5" style={{ color: statusColor[e.status], borderColor: statusColor[e.status] + '50' }}>
                {statusLabel[e.status]}
              </Badge>
              {e.doctor && <p className="text-xs text-muted-foreground/70 mt-1">Médico: {e.doctor}</p>}
              {e.laboratory && <p className="text-xs text-muted-foreground/70">Laboratório: {e.laboratory}</p>}
              {e.result && <p className="text-xs text-muted-foreground/80 mt-1 bg-muted/50 rounded-lg px-2 py-1">{e.result}</p>}
              {e.notes && <p className="text-xs text-muted-foreground/60 mt-1">{e.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <AddExamDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

export function HealthPage() {
  const [tab, setTab] = useState('peso')

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#7bb68618' }}>
              <HeartPulse size={22} style={{ color: '#7bb686' }} />
            </span>
            Saúde
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seu bem-estar completo.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <TabList className="mb-4 overflow-auto scrollbar-thin">
          <Tab value="peso"><Weight size={14} className="mr-1.5" />Peso</Tab>
          <Tab value="medidas"><Activity size={14} className="mr-1.5" />Medidas</Tab>
          <Tab value="sintomas"><Cigarette size={14} className="mr-1.5" />Sintomas</Tab>
          <Tab value="medicamentos"><Pill size={14} className="mr-1.5" />Medicamentos</Tab>
          <Tab value="ciclo"><Venus size={14} className="mr-1.5" />Ciclo</Tab>
          <Tab value="medicos"><Stethoscope size={14} className="mr-1.5" />Médicos</Tab>
          <Tab value="consultas"><CalendarClock size={14} className="mr-1.5" />Consultas</Tab>
          <Tab value="exames"><Beaker size={14} className="mr-1.5" />Exames</Tab>
        </TabList>

        <TabPanel value="peso"><WeightTab /></TabPanel>
        <TabPanel value="medidas"><MeasurementsTab /></TabPanel>
        <TabPanel value="sintomas"><SymptomsTab /></TabPanel>
        <TabPanel value="medicamentos"><MedicationsTab /></TabPanel>
        <TabPanel value="ciclo"><CyclesTab /></TabPanel>
        <TabPanel value="medicos"><DoctorsTab /></TabPanel>
        <TabPanel value="consultas"><AppointmentsTab /></TabPanel>
        <TabPanel value="exames"><ExamsTab /></TabPanel>
      </Tabs>
    </div>
  )
}

function MeasurementsTab() {
  const measurements = useHealthStore((s) => s.measurements)
  const deleteMeasurement = useHealthStore((s) => s.deleteMeasurement)
  const [addOpen, setAddOpen] = useState(false)

  const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} registros</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Nova medida
        </Button>
      </div>
      {sorted.length > 0 ? (
        <div className="space-y-1">
          {sorted.map((m) => (
            <div key={m.id} className="group flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
              <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(m.date)}</span>
              <div className="flex gap-3 text-sm flex-1">
                {m.waist && <span>Cintura: <strong>{m.waist}cm</strong></span>}
                {m.hips && <span>Quadril: <strong>{m.hips}cm</strong></span>}
                {m.chest && <span>Tórax: <strong>{m.chest}cm</strong></span>}
                {m.arm && <span>Braço: <strong>{m.arm}cm</strong></span>}
                {m.thigh && <span>Coxa: <strong>{m.thigh}cm</strong></span>}
              </div>
              {m.notes && <span className="text-xs text-muted-foreground/70 truncate">{m.notes}</span>}
              <button onClick={() => deleteMeasurement(m.id)} className="ml-auto rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma medida corporal registrada ainda.</p>
      )}
      <AddMeasurementDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
