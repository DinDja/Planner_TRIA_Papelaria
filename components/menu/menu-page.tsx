'use client'

import { useMenuStore, type ModuleDef } from '@/lib/store/use-menu-store'
import { cn } from '@/lib/utils'
import {
  BookHeart,
  Bookmark,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  Heart,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  List,
  ListChecks,
  RefreshCw,
  GripVertical,
  Target,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Switch } from '../ui/primitives'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  BookHeart,
  FileText,
  List,
  ListChecks,
  Heart,
  Bookmark,
  Box,
  KeyRound,
  HeartPulse,
  ClipboardList,
  Calendar,
  Wallet,
  Target,
  CheckCircle,
  RefreshCw,
  BookOpen,
  BriefcaseBusiness,
}

export function MenuPage() {
  const modules = useMenuStore((s) => s.modules)
  const toggleModule = useMenuStore((s) => s.toggleModule)
  const reorderModules = useMenuStore((s) => s.reorderModules)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const enabledCount = modules.filter((m) => m.enabled).length

  const handleDragStart = (idx: number) => {
    setDragIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    reorderModules(dragIdx, idx)
    setDragIdx(idx)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <div className={cn('mb-8', enter)}>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#5b8dbf18' }}>
            <List size={22} style={{ color: '#5b8dbf' }} />
          </span>
          Personalizar Menu
        </h1>
        <p className="text-muted-foreground mt-2">
          Organize os módulos na ordem que preferir. Arraste para reordenar.
        </p>
      </div>

      <div className={cn('mb-6 flex items-center gap-4', enter)}>
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-3.5 py-2 shadow-sm">
          <LayoutDashboard size={16} className="text-primary" />
          <div className="leading-tight">
            <p className="text-sm font-bold tabular-nums">{enabledCount}/{modules.length}</p>
            <p className="text-[10px] text-muted-foreground">módulos ativos</p>
          </div>
        </div>
      </div>

      <div className={cn('space-y-1', enter)}>
        {modules.map((mod, idx) => {
          const Icon = ICON_MAP[mod.icon]
          return (
            <div
              key={mod.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                'hover:bg-muted/40 cursor-grab active:cursor-grabbing',
                dragIdx === idx && 'opacity-50',
                !mod.enabled && 'opacity-50',
              )}
            >
              <GripVertical size={14} className="shrink-0 text-muted-foreground/40" />
              <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
                {Icon && <Icon size={15} />}
              </div>
              <span className="text-sm flex-1 font-medium">{mod.label}</span>
              <Switch
                checked={mod.enabled}
                onCheckedChange={() => toggleModule(mod.id)}
                aria-label={`${mod.enabled ? 'Ocultar' : 'Mostrar'} ${mod.label}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
