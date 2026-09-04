'use client'

import { useHealthStore } from '@/lib/store/use-health-store'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Mars,
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

const STEPS = [
  { id: 'sex', label: 'Perfil', icon: HeartPulse },
  { id: 'weight', label: 'Peso e altura', icon: Weight },
] as const

export function HealthOnboarding({
  mode = 'initial',
  onComplete,
}: {
  mode?: 'initial' | 'edit'
  onComplete?: () => void
}) {
  const saveHealthProfile = useHealthStore((s) => s.saveHealthProfile)
  const storedSex = useHealthStore((s) => s.sex)
  const storedHeight = useHealthStore((s) => s.height)
  const weights = useHealthStore((s) => s.weights)
  const latestWeight = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  const [step, setStep] = useState(0)
  const [sex, setSex] = useState<'male' | 'female' | null>(mode === 'edit' ? storedSex : null)
  const [weight, setWeight] = useState(mode === 'edit' && latestWeight ? String(latestWeight.weight) : '')
  const [height, setHeight] = useState(mode === 'edit' && storedHeight > 0 ? String(storedHeight) : '')

  const pickSex = (s: 'male' | 'female') => setSex(s)

  const totalSteps = STEPS.length
  const isLast = step === totalSteps - 1

  const handleNext = () => {
    if (step === 0 && !sex) {
      toast({ title: 'Selecione seu sexo biológico', variant: 'error' })
      return
    }
    if (isLast) {
      const w = parseFloat(weight.replace(',', '.'))
      const h = parseInt(height)
      saveHealthProfile({
        date: dayStr(),
        mode,
        ...(sex ? { sex } : {}),
        ...(w > 0 ? { weight: w } : {}),
        ...(h > 0 ? { height: h } : {}),
      })
      toast({ title: mode === 'edit' ? 'Perfil atualizado' : 'Perfil configurado', variant: 'success' })
      onComplete?.()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))
  const handleSkip = () => {
    if (isLast) {
      saveHealthProfile({ date: dayStr(), mode, ...(sex ? { sex } : {}) })
      onComplete?.()
    } else {
      setStep((s) => s + 1)
    }
  }

  const current = STEPS[step]
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <Card glass className="w-full max-w-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse size={18} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {mode === 'edit' ? 'Editar perfil' : 'Configuração do perfil'} · {step + 1}/{totalSteps}
            </span>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            {current.icon && <current.icon size={18} className="text-primary" />}
            {current.label}
          </CardTitle>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: '#6a634d' }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {/* Etapa 0: Sexo */}
          {step === 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Para personalizar seu acompanhamento, informe seu sexo biológico. Isso determina
                se a aba de ciclo menstrual ficará disponível no seu painel.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => pickSex('female')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border px-4 py-6 text-sm font-medium transition-all cursor-pointer',
                    sex === 'female'
                      ? 'border-brand-rose bg-brand-rose/45 text-foreground shadow-sm'
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
                      ? 'border-brand-green/60 bg-brand-green/10 text-brand-green dark:text-success shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <Mars size={28} />
                  Masculino
                </button>
              </div>             
            </div>
          )}

          {/* Etapa 1: Peso e altura */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Peso atual (kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70,5"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Altura (cm)</label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                />
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
                    {mode === 'edit' ? 'Salvar alterações' : 'Concluir'}
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
