'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Folder as FolderIcon,
  Tag as TagIcon,
} from 'lucide-react'
import Link from 'next/link'
import { forwardRef } from 'react'
import { Card, CardContent } from '../ui/card'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

interface FilteredPlannersPageProps {
  kind: 'folder' | 'tag'
  id: string
  title: string
  color?: string
  description?: string
}

const CATEGORY_LABELS: Record<Planner['category'], string> = {
  diario: 'Diário',
  estudos: 'Estudos',
  trabalho: 'Trabalho',
  fitness: 'Fitness',
  financas: 'Finanças',
  bullet: 'Bullet',
}

export function FilteredPlannersPage({
  kind,
  id,
  title,
  color,
  description,
}: FilteredPlannersPageProps) {
  const planners = useAppStore((s) => s.planners)

  const filtered = planners.filter((p) =>
    kind === 'folder' ? p.folderId === id : p.tags.includes(id),
  )

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto">
      <div className={cn('mb-8', enter)}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar ao Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: (color ?? '#7bb686') + '18' }}
          >
            {kind === 'folder' ? (
              <FolderIcon size={22} style={{ color: color ?? '#7bb686' }} />
            ) : (
              <TagIcon size={22} style={{ color: color ?? '#7bb686' }} />
            )}
          </span>
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {description ?? `${filtered.length} planner(s) nesta ${kind === 'folder' ? 'pasta' : 'tag'}.`}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((planner, i) => (
            <PlannerMiniCard key={planner.id} planner={planner} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderIcon size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Nenhum planner nesta {kind === 'folder' ? 'pasta' : 'tag'} ainda.
          </p>
        </div>
      )}
    </div>
  )
}

const PlannerMiniCard = forwardRef<
  HTMLAnchorElement,
  { planner: Planner; index: number }
>(function PlannerMiniCard({ planner, index }, _ref) {
  return (
    <Link href={`/planner/${planner.id}`} className="block group" style={{ animationDelay: `${index * 50}ms` }}>
      <Card glass hover className="h-full">
        <CardContent className="p-4 flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: planner.color + '18' }}
          >
            <span
              className="size-3 rounded-md"
              style={{ backgroundColor: planner.color }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{planner.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {CATEGORY_LABELS[planner.category]} · {planner.pages.length} pág.
            </p>
          </div>
          {planner.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {planner.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted text-muted-foreground px-1.5 py-0 text-[9px] font-medium"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
})
