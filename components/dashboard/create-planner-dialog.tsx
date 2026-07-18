'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useSettingsStore } from '@/lib/store/use-settings-store'
import type { PageTemplateId, PlannerCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  BookHeart,
  BriefcaseBusiness,
  Calculator,
  Check,
  Dumbbell,
  GraduationCap,
  NotebookPen,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/primitives'
import { Dialog, DialogContent } from '../ui/overlays'
import { toast } from '../ui/toaster'
import { TemplateThumbnail } from '../templates-page/template-thumbnail'

interface Props {
  open: boolean
  onClose: () => void
}

const categoryTemplateMap: Record<PlannerCategory, PageTemplateId> = {
  diario: 'daily',
  estudos: 'cornell',
  trabalho: 'kanban',
  fitness: 'habit',
  financas: 'finance',
  bullet: 'dotted',
}

function CreatePlannerDialog({ open, onClose }: Props) {
  const addPlanner = useAppStore((s) => s.addPlanner)
  const gradCovers = useSettingsStore((s) => s.gradients.covers)
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

  const activeCategory = categories.find((c) => c.id === category)!

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para o planner', variant: 'error' })
      return
    }
    addPlanner({
      name: name.trim(),
      category,
      color,
      icon: activeCategory.icon.displayName ?? 'NotebookPen',
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
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isActive = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id)
                      setColor(cat.color)
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 sm:p-3 transition-all duration-200 cursor-pointer',
                      isActive
                        ? 'border-transparent bg-background shadow-md scale-[1.02]'
                        : 'border-border/60 hover:border-border hover:bg-muted/40 hover:-translate-y-0.5',
                    )}
                    style={isActive ? { boxShadow: `0 0 0 2px ${cat.color}, 0 4px 12px -4px ${cat.color}66` } : undefined}
                  >
                    <div
                      className="flex size-9 sm:size-10 items-center justify-center rounded-xl transition-transform duration-200"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <cat.icon size={19} style={{ color: cat.color }} />
                    </div>
                    <span className={cn('text-[11px] font-medium leading-tight text-center', isActive && 'font-semibold')}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Cor de capa</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => {
                const isActive = color === c
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'size-8 rounded-full transition-all duration-200 cursor-pointer inline-flex items-center justify-center',
                      isActive
                        ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover'
                        : 'hover:scale-110 hover:shadow-md',
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {isActive && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview: capa + página */}
          <div>
            <label className="text-sm font-medium mb-2 block">Pré-visualização</label>
            <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-3">
              {/* Capa */}
              <div
                className="relative aspect-[3/4] rounded-r-[6px] rounded-l-[2px] overflow-hidden shadow-lift transition-colors duration-300"
                style={{ backgroundColor: color }}
              >
                {/* textura */}
                <div className="absolute inset-0 paper-grain opacity-[0.08] mix-blend-overlay" />
                {/* brilho */}
                {gradCovers && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/20" />
                )}
                {/* lombada */}
                <div className="absolute inset-y-0 left-0 w-[7%] bg-black/20" />
                <div className="absolute inset-y-0 left-[7%] w-px bg-white/20" />
                {/* conteúdo da capa */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-sm">
                    <activeCategory.icon size={18} className="text-white drop-shadow-sm" />
                  </div>
                  <p className="text-[13px] font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                    {name || 'Meu planner'}
                  </p>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">
                    {activeCategory.label}
                  </span>
                </div>
              </div>
              {/* Página interna */}
              <div className="relative aspect-[3/4]">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[5px] rotate-[2deg] translate-x-1 translate-y-1 bg-[color:light-dark(#efece5,#222220)] shadow-sm"
                />
                <div className="absolute inset-0 overflow-hidden rounded-[5px] ring-1 ring-border/60 shadow-lift bg-[color:light-dark(#ffffff,#2a2a28)]">
                  <TemplateThumbnail
                    template={categoryTemplateMap[category]}
                    className="block w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md w-full sm:w-auto">
              Criar planner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CreatePlannerDialog }
