'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import type { BodyMeasurement } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Activity,
  Beaker,
  CalendarClock,
  Cigarette,
  ClipboardCheck,
  HeartPulse,
  Pill,
  Pencil,
  Plus,
  Stethoscope,
  Target,
  Trash2,
  Weight,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Input } from '../ui/primitives'
import { Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddWeightDialog, AddSymptomDialog, AddMedicationDialog, AddCycleDialog, AddDoctorDialog, AddAppointmentDialog, AddExamDialog, AddMeasurementDialog } from './health-dialogs'
import { HealthOnboarding } from './health-onboarding'
import { ReminderButton } from '../notifications/reminder-button'

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
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#6a634d' }
  if (bmi < 25) return { label: 'Peso normal', color: '#6a634d' }
  if (bmi < 30) return { label: 'Sobrepeso', color: '#b76f06' }
  return { label: 'Obesidade', color: '#d1bdb8' }
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

type MeasurementMetric = keyof Pick<BodyMeasurement, 'bust' | 'waist' | 'abdomen' | 'hips' | 'arm' | 'thigh' | 'calf'>

const measurementMetrics: { key: MeasurementMetric; label: string }[] = [
  { key: 'waist', label: 'Cintura' },
  { key: 'abdomen', label: 'Abdômen' },
  { key: 'bust', label: 'Busto' },
  { key: 'hips', label: 'Quadris' },
  { key: 'arm', label: 'Braço' },
  { key: 'thigh', label: 'Coxa' },
  { key: 'calf', label: 'Panturrilha' },
]

function MeasurementChart({ measurements, metric }: { measurements: BodyMeasurement[]; metric: MeasurementMetric }) {
  const sorted = measurements
    .filter((measurement) => typeof measurement[metric] === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))

  if (sorted.length < 2) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        Registre ao menos duas medições de {measurementMetrics.find((item) => item.key === metric)?.label.toLowerCase()} para ver o histórico.
      </p>
    )
  }

  const w = 340
  const h = 140
  const pad = { top: 12, right: 10, bottom: 20, left: 36 }
  const values = sorted.map((measurement) => measurement[metric] as number)
  const minValue = Math.min(...values) - 2
  const maxValue = Math.max(...values) + 2
  const range = maxValue - minValue || 1
  const xScale = (index: number) => pad.left + (index / (sorted.length - 1)) * (w - pad.left - pad.right)
  const yScale = (value: number) => pad.top + ((maxValue - value) / range) * (h - pad.top - pad.bottom)
  const points = values.map((value, index) => `${xScale(index)},${yScale(value)}`).join(' ')
  const yLabels = Array.from({ length: 5 }, (_, index) => minValue + (range / 4) * index)
  const label = measurementMetrics.find((item) => item.key === metric)?.label ?? 'Medida'

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label={`Gráfico histórico de ${label.toLowerCase()}`}>
      {yLabels.map((value) => (
        <g key={value}>
          <line x1={pad.left} y1={yScale(value)} x2={w - pad.right} y2={yScale(value)} stroke="var(--border)" strokeWidth="0.5" />
          <text x={pad.left - 4} y={yScale(value) + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize="8">
            {value.toFixed(1)}
          </text>
        </g>
      ))}
      <polygon
        points={`${xScale(0)},${h - pad.bottom} ${points} ${xScale(sorted.length - 1)},${h - pad.bottom}`}
        fill="var(--primary)"
        fillOpacity="0.08"
      />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((value, index) => (
        <circle
          key={`${sorted[index].id}-${metric}`}
          cx={xScale(index)}
          cy={yScale(value)}
          r="3"
          fill="hsl(var(--primary))"
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
  const [editId, setEditId] = useState<string | undefined>()
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
            <Activity size={16} className={diffNum <= 0 ? 'text-success' : 'text-destructive shrink-0'} />
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
            <Target size={16} className="shrink-0" style={{ color: !goalDiff || goalDiffNum <= 0 ? '#6a634d' : '#b76f06' }} />
            <div className="leading-tight min-w-0">
              {goalWeight ? (
                <>
                  <p className="text-lg font-bold tabular-nums">
                    {goalWeight} kg
                    {goalDiff && (
                      <span className="text-xs font-normal ml-1" style={{ color: goalDiffNum <= 0 ? '#6a634d' : '#b76f06' }}>
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
            <div key={w.id} className="group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Weight size={16} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(w.date)}</span>
              <span className="text-sm font-bold tabular-nums">{w.weight} kg</span>
              {wBmiInfo && (
                <span className="text-[10px] tabular-nums" style={{ color: wBmiInfo.color }}>
                  IMC {wBmi.toFixed(1)}
                </span>
              )}
              {w.notes && <span className="text-xs text-muted-foreground/70 truncate">{w.notes}</span>}
              <button onClick={() => { setEditId(w.id); setAddOpen(true) }} className="ml-auto rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar peso">
                <Pencil size={12} />
              </button>
              <button onClick={() => deleteWeight(w.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir peso">
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
      <AddWeightDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

function SymptomsTab() {
  const symptoms = useHealthStore((s) => s.symptoms)
  const deleteSymptom = useHealthStore((s) => s.deleteSymptom)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

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
          <div key={s.id} className="group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cigarette size={16} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(s.date)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{s.symptom}</p>
              {(s.time || s.possibleCause) && (
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  {s.time && `às ${s.time}`}
                  {s.time && s.possibleCause && ' · '}
                  {s.possibleCause && `possível causa: ${s.possibleCause}`}
                </p>
              )}
            </div>
            {s.notes && <span className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{s.notes}</span>}
            <button onClick={() => { setEditId(s.id); setAddOpen(true) }} className="rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar sintoma">
              <Pencil size={12} />
            </button>
            <button onClick={() => deleteSymptom(s.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir sintoma">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AddSymptomDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

function MedicationsTab() {
  const medications = useHealthStore((s) => s.medications)
  const updateMedication = useHealthStore((s) => s.updateMedication)
  const deleteMedication = useHealthStore((s) => s.deleteMedication)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const sorted = [...medications].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{medications.length} medicamentos</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {sorted.map((m) => (
          <div key={m.id} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${m.color}18` }}>
              <Pill size={16} style={{ color: m.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{m.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5">{m.frequency}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(m.startDate)}{m.endDate ? ` até ${formatDate(m.endDate)}` : ''}
                {m.dosage && ` · ${m.dosage}`}
                {m.intervalHours ? ` · a cada ${m.intervalHours}h` : ''}
                {m.durationDays ? ` · ${m.durationDays} dias` : ''}
              </p>
              {m.times && m.times.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.times.map((t) => (
                    <Badge key={t} variant="outline" className="text-[9px] px-1.5">{t}</Badge>
                  ))}
                </div>
              )}
              {m.notes && <p className="text-xs text-muted-foreground/70 mt-1">{m.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <ReminderButton
                enabled={m.reminderEnabled === true}
                onEnabledChange={(enabled) => updateMedication(m.id, { reminderEnabled: enabled })}
                compact
              />
              <button onClick={() => { setEditId(m.id); setAddOpen(true) }} className="rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar medicamento">
                <Pencil size={12} />
              </button>
              <button onClick={() => deleteMedication(m.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir medicamento">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddMedicationDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

function CyclesTab() {
  const cycles = useHealthStore((s) => s.cycles)
  const deleteCycle = useHealthStore((s) => s.deleteCycle)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

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
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-rose/55 dark:bg-brand-rose/20">
              <Venus size={16} className="text-foreground dark:text-brand-beige" />
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
            <button onClick={() => { setEditId(c.id); setAddOpen(true) }} className="rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar ciclo">
              <Pencil size={12} />
            </button>
            <button onClick={() => deleteCycle(c.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir ciclo">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <AddCycleDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

function DoctorsTab() {
  const doctors = useHealthStore((s) => s.doctors)
  const deleteDoctor = useHealthStore((s) => s.deleteDoctor)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{doctors.length} médicos</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {doctors.map((d) => (
          <div key={d.id} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${d.color}18` }}>
              <Stethoscope size={16} style={{ color: d.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{d.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5">{d.specialty}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/80">
                {d.phone && <span>📞 {d.phone}</span>}
                {d.email && <span>✉ {d.email}</span>}
                {d.address && <span>📍 {d.address}</span>}
              </div>
              {d.notes && <p className="text-xs text-muted-foreground/60 mt-1">{d.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => { setEditId(d.id); setAddOpen(true) }} className="rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar médico">
                <Pencil size={12} />
              </button>
              <button onClick={() => deleteDoctor(d.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir médico">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddDoctorDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

function AppointmentsTab() {
  const appointments = useHealthStore((s) => s.appointments)
  const updateAppointment = useHealthStore((s) => s.updateAppointment)
  const deleteAppointment = useHealthStore((s) => s.deleteAppointment)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date))
  const statusColor = { scheduled: '#ddd6c6', done: '#6a634d', cancelled: '#d1bdb8' }
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
                {formatDate(a.date)} às {a.time}
                {a.specialty && a.specialty !== '—' && ` · ${a.specialty}`}
                {a.location && ` · ${a.location}`}
              </p>
              {a.whatToBring && <p className="text-xs text-muted-foreground/70 mt-1">Levar: {a.whatToBring}</p>}
              {a.questions && <p className="text-xs text-muted-foreground/70 mt-1">Perguntas: {a.questions}</p>}
              {a.notes && <p className="text-xs text-muted-foreground/70 mt-1">{a.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <ReminderButton
                enabled={a.reminderEnabled === true}
                onEnabledChange={(enabled) => updateAppointment(a.id, { reminderEnabled: enabled })}
                compact
              />
              {a.status === 'scheduled' && (
                <button onClick={() => updateAppointment(a.id, { status: 'done' })} className="rounded-lg p-1 text-muted-foreground/30 hover:text-success transition-colors cursor-pointer" title="Marcar como realizada">
                  <ClipboardCheck size={14} />
                </button>
              )}
              <button onClick={() => { setEditId(a.id); setAddOpen(true) }} className="rounded-lg p-1 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer" aria-label="Editar consulta">
                <Pencil size={13} />
              </button>
              <button onClick={() => deleteAppointment(a.id)} className="rounded-lg p-1 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer" aria-label="Excluir consulta">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddAppointmentDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} doctors={[]} />
      {/* doctors prop deprecated: dialog reads from store internally */}
    </div>
  )
}

function ExamsTab() {
  const exams = useHealthStore((s) => s.exams)
  const updateExam = useHealthStore((s) => s.updateExam)
  const deleteExam = useHealthStore((s) => s.deleteExam)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()

  const sorted = [...exams].sort((a, b) => b.date.localeCompare(a.date))
  const statusColor = { pending: '#b76f06', done: '#d1bdb8', reviewed: '#6a634d' }
  const statusLabel = { pending: 'Pendente', done: 'Realizado', reviewed: 'Revisado' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} exames</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Novo exame
        </Button>
      </div>
      <div className="space-y-2">
        {sorted.map((e) => (
          <div key={e.id} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${e.color}18` }}>
              <Beaker size={16} style={{ color: e.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{e.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5" style={{ color: statusColor[e.status], borderColor: statusColor[e.status] + '50' }}>
                  {statusLabel[e.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.date)}{e.time ? ` às ${e.time}` : ''}</p>
              {e.doctor && <p className="text-xs text-muted-foreground/70 mt-1">Médico: {e.doctor}</p>}
              {e.laboratory && <p className="text-xs text-muted-foreground/70">Laboratório: {e.laboratory}</p>}
              {e.address && <p className="text-xs text-muted-foreground/70">Endereço: {e.address}</p>}
              {e.result && <p className="text-xs text-muted-foreground/80 mt-1 bg-muted/50 rounded-lg px-2 py-1">{e.result}</p>}
              {e.notes && <p className="text-xs text-muted-foreground/60 mt-1">{e.notes}</p>}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <ReminderButton
                enabled={e.reminderEnabled === true}
                onEnabledChange={(enabled) => updateExam(e.id, { reminderEnabled: enabled })}
                compact
              />
              {e.status !== 'reviewed' && (
                <button onClick={() => updateExam(e.id, { status: e.status === 'pending' ? 'done' : 'reviewed' })} className="rounded-md p-1 text-muted-foreground/30 hover:text-primary transition-colors cursor-pointer" aria-label="Atualizar status do exame">
                  <ClipboardCheck size={13} />
                </button>
              )}
              <button onClick={() => { setEditId(e.id); setAddOpen(true) }} className="rounded-md p-1 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer" aria-label="Editar exame">
                <Pencil size={12} />
              </button>
              <button onClick={() => deleteExam(e.id)} className="rounded-md p-1 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer" aria-label="Excluir exame">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddExamDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}

type OverviewHistoryItem = {
  id: string
  date: string
  label: string
  detail: string
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: string
}) {
  return (
    <Card glass className="h-full">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{value}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/75">{detail}</p>
        </div>
      </div>
    </Card>
  )
}

function OverviewTab({ sex }: { sex: 'male' | 'female' | null }) {
  const weights = useHealthStore((s) => s.weights)
  const symptoms = useHealthStore((s) => s.symptoms)
  const medications = useHealthStore((s) => s.medications)
  const cycles = useHealthStore((s) => s.cycles)
  const measurements = useHealthStore((s) => s.measurements)
  const appointments = useHealthStore((s) => s.appointments)
  const exams = useHealthStore((s) => s.exams)

  const today = new Date().toISOString().slice(0, 10)
  const latestWeight = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  const latestSymptom = [...symptoms].sort((a, b) => b.date.localeCompare(a.date))[0]
  const activeMedications = medications.filter(
    (medication) => medication.startDate <= today && (!medication.endDate || medication.endDate >= today),
  )
  const nextAppointment = [...appointments]
    .filter((appointment) => appointment.status === 'scheduled' && appointment.date >= today)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0]
  const nextExam = [...exams]
    .filter((exam) => exam.status === 'pending' && exam.date >= today)
    .sort((a, b) => `${a.date}T${a.time ?? ''}`.localeCompare(`${b.date}T${b.time ?? ''}`))[0]
  const latestCycle = sex === 'female'
    ? [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
    : undefined

  const history = useMemo<OverviewHistoryItem[]>(() => {
    const records: OverviewHistoryItem[] = [
      ...weights.map((record) => ({
        id: `weight-${record.id}`,
        date: record.date,
        label: 'Peso',
        detail: `${record.weight} kg`,
      })),
      ...measurements.map((record) => ({
        id: `measurement-${record.id}`,
        date: record.date,
        label: 'Medidas',
        detail: 'Medidas corporais registradas',
      })),
      ...symptoms.map((record) => ({
        id: `symptom-${record.id}`,
        date: record.date,
        label: 'Sintoma',
        detail: record.symptom,
      })),
      ...medications.map((record) => ({
        id: `medication-${record.id}`,
        date: record.startDate,
        label: 'Medicamento',
        detail: record.name,
      })),
      ...appointments.map((record) => ({
        id: `appointment-${record.id}`,
        date: record.date,
        label: 'Consulta',
        detail: record.doctorName,
      })),
      ...exams.map((record) => ({
        id: `exam-${record.id}`,
        date: record.date,
        label: 'Exame',
        detail: record.name,
      })),
      ...(sex === 'female'
        ? cycles.map((record) => ({
            id: `cycle-${record.id}`,
            date: record.startDate,
            label: 'Ciclo menstrual',
            detail: record.endDate ? `${formatDate(record.startDate)} a ${formatDate(record.endDate)}` : 'Em andamento',
          }))
        : []),
    ]

    return records.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  }, [appointments, cycles, exams, measurements, medications, sex, symptoms, weights])

  const metrics = [
    {
      icon: Weight,
      label: 'Peso mais recente',
      value: latestWeight ? `${latestWeight.weight} kg` : 'Sem registro',
      detail: latestWeight ? `Registrado em ${formatDate(latestWeight.date)}` : 'Nenhum registro ainda',
    },
    {
      icon: Cigarette,
      label: 'Último sintoma',
      value: latestSymptom?.symptom ?? 'Sem registro',
      detail: latestSymptom ? `Registrado em ${formatDate(latestSymptom.date)}` : 'Nenhum registro ainda',
    },
    {
      icon: Pill,
      label: 'Remédios ativos',
      value: activeMedications.length ? `${activeMedications.length} ativo${activeMedications.length === 1 ? '' : 's'}` : 'Nenhum ativo',
      detail: activeMedications.length ? activeMedications.slice(0, 2).map((medication) => medication.name).join(' · ') : 'Nenhum registro ainda',
    },
    {
      icon: CalendarClock,
      label: 'Próxima consulta',
      value: nextAppointment?.doctorName ?? 'Sem agendamento',
      detail: nextAppointment ? `${formatDate(nextAppointment.date)} às ${nextAppointment.time}` : 'Nenhuma consulta marcada',
    },
    {
      icon: Beaker,
      label: 'Próximo exame',
      value: nextExam?.name ?? 'Sem agendamento',
      detail: nextExam ? `Agendado para ${formatDate(nextExam.date)}` : 'Nenhum exame pendente',
    },
    ...(sex === 'female'
      ? [{
          icon: Venus,
          label: 'Ciclo menstrual',
          value: latestCycle ? formatDate(latestCycle.startDate) : 'Sem registro',
          detail: latestCycle?.endDate ? `Até ${formatDate(latestCycle.endDate)}` : latestCycle ? 'Em andamento' : 'Nenhum registro ainda',
        }]
      : []),
    {
      icon: ClipboardCheck,
      label: 'Última receita',
      value: 'Sem registro',
      detail: 'Nenhuma receita registrada',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Como você está</h2>
        <p className="mt-1 text-sm text-muted-foreground">um resumo carinhoso do que você registrou até aqui</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => <OverviewMetric key={metric.label} {...metric} />)}
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle className="text-base">Últimos registros</CardTitle>
        </CardHeader>
        <div className="mt-3 divide-y divide-border/50">
          {history.length > 0 ? history.map((record) => (
            <div key={record.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="size-2 shrink-0 rounded-full bg-primary/70" />
              <span className="w-20 shrink-0 text-[11px] text-muted-foreground">{formatDate(record.date)}</span>
              <span className="text-xs font-medium text-muted-foreground">{record.label}</span>
              <span className="min-w-0 truncate text-sm">{record.detail}</span>
            </div>
          )) : (
            <p className="py-2 text-sm text-muted-foreground">Ainda não há registros para mostrar.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

export function HealthPage() {
  const [tab, setTab] = useState('geral')
  const [editingProfile, setEditingProfile] = useState(false)
  const [onboardingCompletedThisSession, setOnboardingCompletedThisSession] = useState(false)
  const onboarded = useHealthStore((s) => s.onboarded)
  const sex = useHealthStore((s) => s.sex)
  const weights = useHealthStore((s) => s.weights)

  if (!onboarded && !onboardingCompletedThisSession && sex === null && weights.length === 0) {
    return <HealthOnboarding onComplete={() => setOnboardingCompletedThisSession(true)} />
  }

  if (editingProfile) {
    return <HealthOnboarding mode="edit" onComplete={() => setEditingProfile(false)} />
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(106, 99, 77, 0.094)' }}>
              <HeartPulse size={22} style={{ color: '#6a634d' }} />
            </span>
            Saúde
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe seu bem-estar completo.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs text-muted-foreground"
          onClick={() => setEditingProfile(true)}
        >
          <Pencil size={13} className="mr-1.5" />
          Editar meus dados
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className={enter}>
        <TabList className="mb-4 flex w-full flex-wrap items-center justify-start gap-1 overflow-visible">
          <Tab value="geral"><HeartPulse size={14} className="mr-1.5" />Visão geral</Tab>
          <Tab value="peso"><Weight size={14} className="mr-1.5" />Peso</Tab>
          <Tab value="medidas"><Activity size={14} className="mr-1.5" />Medidas</Tab>
          <Tab value="sintomas"><Cigarette size={14} className="mr-1.5" />Sintomas</Tab>
          <Tab value="medicamentos"><Pill size={14} className="mr-1.5" />Medicamentos</Tab>
          {sex !== 'male' && (
            <Tab value="ciclo"><Venus size={14} className="mr-1.5" />Ciclo</Tab>
          )}
          <Tab value="medicos"><Stethoscope size={14} className="mr-1.5" />Médicos</Tab>
          <Tab value="consultas"><CalendarClock size={14} className="mr-1.5" />Consultas</Tab>
          <Tab value="exames"><Beaker size={14} className="mr-1.5" />Exames</Tab>
        </TabList>

        <TabPanel value="geral"><OverviewTab sex={sex} /></TabPanel>
        <TabPanel value="peso"><WeightTab /></TabPanel>
        <TabPanel value="medidas"><MeasurementsTab /></TabPanel>
        <TabPanel value="sintomas"><SymptomsTab /></TabPanel>
        <TabPanel value="medicamentos"><MedicationsTab /></TabPanel>
        {sex !== 'male' && (
          <TabPanel value="ciclo"><CyclesTab /></TabPanel>
        )}
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
  const [editId, setEditId] = useState<string | undefined>()
  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetric>('waist')

  const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date))
  const availableMetrics = useMemo(
    () => measurementMetrics
      .filter(({ key }) => measurements.some((measurement) => typeof measurement[key] === 'number'))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [measurements],
  )
  const activeMetric = availableMetrics.some(({ key }) => key === selectedMetric)
    ? selectedMetric
    : availableMetrics[0]?.key

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{sorted.length} registros</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Nova medida
        </Button>
      </div>
      <Card glass className="mb-4">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Histórico de medidas</CardTitle>
            {availableMetrics.length > 0 && (
              <select
                value={activeMetric}
                onChange={(event) => setSelectedMetric(event.target.value as MeasurementMetric)}
                className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Escolha a medida do gráfico"
              >
                {availableMetrics.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          {activeMetric ? (
            <MeasurementChart measurements={measurements} metric={activeMetric} />
          ) : (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Registre uma medida corporal para começar o histórico.
            </p>
          )}
        </CardContent>
      </Card>
      {sorted.length > 0 ? (
        <div className="space-y-1">
          {sorted.map((m) => (
            <div key={m.id} className="group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Activity size={16} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground w-20 shrink-0">{formatDate(m.date)}</span>
              <div className="flex gap-3 text-sm flex-1 flex-wrap">
                {m.bust && <span>Busto: <strong>{m.bust}cm</strong></span>}
                {m.waist && <span>Cintura: <strong>{m.waist}cm</strong></span>}
                {m.abdomen && <span>Abdômen: <strong>{m.abdomen}cm</strong></span>}
                {m.hips && <span>Quadris: <strong>{m.hips}cm</strong></span>}
                {m.arm && <span>Braço: <strong>{m.arm}cm</strong></span>}
                {m.thigh && <span>Coxa: <strong>{m.thigh}cm</strong></span>}
                {m.calf && <span>Panturrilha: <strong>{m.calf}cm</strong></span>}
              </div>
              {m.notes && <span className="text-xs text-muted-foreground/70 truncate">{m.notes}</span>}
              <button onClick={() => { setEditId(m.id); setAddOpen(true) }} className="ml-auto rounded-md p-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer" aria-label="Editar medidas">
                <Pencil size={12} />
              </button>
              <button onClick={() => deleteMeasurement(m.id)} className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer" aria-label="Excluir medidas">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma medida corporal registrada ainda.</p>
      )}
      <AddMeasurementDialog open={addOpen} editId={editId} onClose={() => { setAddOpen(false); setEditId(undefined) }} />
    </div>
  )
}
