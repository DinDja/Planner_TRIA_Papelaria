'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CreatePlannerDialog } from '../dashboard/create-planner-dialog'
import { TemplateThumbnail } from '../planner-template-thumbnail'
import { Button } from '../ui/button'
import { DeletePlannerDialog } from './delete-planner-dialog'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const CATEGORY_LABELS: Record<Planner['category'], string> = {
  diario: 'Diário',
  estudos: 'Estudos',
  trabalho: 'Trabalho',
  fitness: 'Fitness',
  financas: 'Finanças',
  bullet: 'Bullet',
}

export function PlannersPage() {
  const planners = useAppStore((s) => s.planners)
  const folders = useAppStore((s) => s.folders)
  const [deleteTarget, setDeleteTarget] = useState<Planner | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Planner | null>(null)

  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Cabeçalho — mesmo padrão das outras abas: ícone + título + contagem. */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#6a634d18' }}
            >
              <span className="size-3 rounded-md" style={{ backgroundColor: '#6a634d' }} />
            </span>
            Meus Planners
          </h1>
          <p className="text-muted-foreground mt-2">
            {planners.length === 0
              ? 'Nenhum planner ainda.'
              : `${planners.length} planner(s) ao todo.`}
          </p>
        </div>
        <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Novo planner
        </Button>
      </div>

      {planners.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {planners.map((planner, i) => {
            const firstPage = planner.pages?.[0]
            return (
              <Link
                key={planner.id}
                href={`/planner/${planner.id}`}
                className="group relative flex flex-col rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-lift hover:border-transparent hover:-translate-y-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Capa */}
                <div className="relative bg-[color:light-dark(#ddd6c6,#211f1a)] px-2 pt-2 overflow-hidden">
                  <div className="relative overflow-hidden rounded-[4px] ring-1 ring-black/[0.07] dark:ring-white/10 shadow-sm bg-[color:light-dark(#ffffff,#2a2a28)]">
                    {firstPage?.template && (
                      <TemplateThumbnail template={firstPage.template} className="block w-full" />
                    )}
                  </div>
                  {/* Favorito — estrela preenchida só para leitura rápida. */}
                  {planner.favorite && (
                    <span className="absolute right-3.5 top-3.5 flex size-6 items-center justify-center rounded-full bg-warning/90 text-primary-foreground shadow-sm">
                      <Star size={12} className="fill-current" />
                    </span>
                  )}
                </div>

                {/* Ação de excluir — revelada no hover, sem navegar (botão fora do Link de abertura). */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditTarget(planner)
                    setCreateOpen(true)
                  }}
                  aria-label={`Editar ${planner.name}`}
                  className="absolute right-11 top-2 z-10 flex size-8 items-center justify-center rounded-xl bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-primary focus-visible:opacity-100 cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDeleteTarget(planner)
                  }}
                  aria-label={`Excluir ${planner.name}`}
                  className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-xl bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-destructive focus-visible:opacity-100 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>

                {/* Rótulo */}
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{planner.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {CATEGORY_LABELS[planner.category]}
                      {planner.folderId && folderName(planner.folderId)
                        ? ` · ${folderName(planner.folderId)}`
                        : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {planner.pages?.length ?? 0} pág.
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <Plus size={22} className="text-muted-foreground/40" />
          </span>
          <p className="text-muted-foreground">Nenhum planner ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Criar primeiro planner
          </Button>
        </div>
      )}

      <DeletePlannerDialog planner={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <CreatePlannerDialog
        open={createOpen}
        editId={editTarget?.id}
        onClose={() => { setCreateOpen(false); setEditTarget(null) }}
      />
    </div>
  )
}
