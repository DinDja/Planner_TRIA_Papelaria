'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import type { PlannerCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BookHeart,
  BriefcaseBusiness,
  Calculator,
  Dumbbell,
  GraduationCap,
  NotebookPen,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import { toast } from '../ui/toaster'

interface Props {
  open: boolean
  onClose: () => void
}

function CreatePlannerDialog({ open, onClose }: Props) {
  const addPlanner = useAppStore((s) => s.addPlanner)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PlannerCategory>('diario')
  const [color, setColor] = useState('#e05b6d')

  const categories: { id: PlannerCategory; label: string; icon: typeof NotebookPen; color: string }[] = [
    { id: 'diario', label: 'Diário', icon: NotebookPen, color: '#e05b6d' },
    { id: 'estudos', label: 'Estudos', icon: GraduationCap, color: '#5b8dbf' },
    { id: 'trabalho', label: 'Trabalho', icon: BriefcaseBusiness, color: '#c9b6e4' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#7bb686' },
    { id: 'financas', label: 'Finanças', icon: Calculator, color: '#f0b429' },
    { id: 'bullet', label: 'Bullet Journal', icon: BookHeart, color: '#e8a0a0' },
  ]

  const colors = ['#e05b6d', '#e8a0a0', '#f0b429', '#7bb686', '#5b8dbf', '#a5c8e4', '#c9b6e4', '#d4b070', '#b0a090', '#8b7aaa']

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para o planner', variant: 'error' })
      return
    }
    const cat = categories.find((c) => c.id === category)!
    addPlanner({
      name: name.trim(),
      category,
      color,
      icon: cat.icon.displayName ?? 'NotebookPen',
    })
    toast({ title: 'Planner criado!', variant: 'success' })
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Novo planner" description="Escolha o tipo, cor e nome para começar.">
        <div className="flex flex-col gap-5">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meu planner..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id)
                    setColor(cat.color)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-200',
                    category === cat.id
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 hover:border-border hover:bg-muted/40',
                  )}
                >
                  <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <cat.icon size={20} style={{ color: cat.color }} />
                  </div>
                  <span className="text-[11px] font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Cor de capa</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-8 rounded-full border-2 transition-all',
                    color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="h-24 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{ backgroundColor: color + '18', border: `2px dashed ${color}40` }}
          >
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color }}>
                {name || 'Meu planner'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{categories.find((c) => c.id === category)?.label}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl">
              Criar planner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CreatePlannerDialog }
