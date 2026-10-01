'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FolderPlus, Pencil, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CreatePlannerDialog } from '../dashboard/create-planner-dialog'
import { PlannerPagePreview } from '../planner-page-preview'
import { Button } from '../ui/button'
import { Tab, TabList, Tabs } from '../ui/overlays'
import { DeletePlannerDialog } from './delete-planner-dialog'
import { PlannerFolderDialog } from './planner-folder-dialog'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

export function PlannersPage() {
  const planners = useAppStore((s) => s.planners)
  const folders = useAppStore((s) => s.folders)
  const deleteFolder = useAppStore((s) => s.deleteFolder)
  const [deleteTarget, setDeleteTarget] = useState<Planner | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Planner | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [editFolderId, setEditFolderId] = useState<string | undefined>()
  const [tab, setTab] = useState('all')

  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name
  const selectedFolder = folders.find((folder) => tab === `folder-${folder.id}`)
  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId)
    if (tab === `folder-${folderId}`) setTab('all')
  }
  const filteredPlanners = selectedFolder
    ? planners.filter((planner) => planner.folderId === selectedFolder.id)
    : planners

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border/40 p-4 lg:flex" aria-label="Filtros de cadernos">
        <button
          type="button"
          onClick={() => setTab('all')}
          aria-pressed={tab === 'all'}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            tab === 'all'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          Todos os cadernos
          <span className="ml-auto text-xs tabular-nums text-muted-foreground/70">{planners.length}</span>
        </button>
        <div className="my-2 border-t border-border/30" />
        <div className="mb-1 flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pastas</p>
          <button
            type="button"
            onClick={() => { setEditFolderId(undefined); setFolderDialogOpen(true) }}
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Nova pasta"
            title="Nova pasta"
          >
            <FolderPlus size={14} aria-hidden />
          </button>
        </div>
        {folders.map((folder) => {
          const count = planners.filter((planner) => planner.folderId === folder.id).length
          const active = tab === `folder-${folder.id}`
          return (
            <div key={folder.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => setTab(active ? 'all' : `folder-${folder.id}`)}
                aria-pressed={active}
                className={cn(
                  'flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <span className="size-2.5 shrink-0 rounded-md" style={{ backgroundColor: folder.color }} />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/70">{count}</span>
              </button>
              <button
                type="button"
                onClick={() => { setEditFolderId(folder.id); setFolderDialogOpen(true) }}
                aria-label={`Editar pasta ${folder.name}`}
                className="cursor-pointer rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Pencil size={12} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(folder.id)}
                aria-label={`Excluir pasta ${folder.name}`}
                className="cursor-pointer rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                <Trash2 size={12} aria-hidden />
              </button>
            </div>
          )
        })}
        {folders.length === 0 && (
          <p className="px-3 py-1 text-xs leading-relaxed text-muted-foreground/70">Nenhuma pasta criada.</p>
        )}
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
          <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meus Cadernos</h1>
              <p className="text-muted-foreground mt-2">
                {planners.length === 0
                  ? 'Nenhum caderno ainda.'
                  : `${planners.length} ${planners.length === 1 ? 'caderno' : 'cadernos'} ao todo.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setEditFolderId(undefined); setFolderDialogOpen(true) }}>
                <FolderPlus size={14} aria-hidden />
                Pasta
              </Button>
              <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
                Novo caderno
              </Button>
            </div>
          </div>

          <div className="mb-5 lg:hidden">
            <Tabs value={tab} onValueChange={setTab}>
              <TabList className="overflow-auto scrollbar-thin">
                <Tab value="all">
                  Todos
                  <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                    {planners.length}
                  </span>
                </Tab>
                {folders.map((folder) => (
                  <Tab key={folder.id} value={`folder-${folder.id}`}>{folder.name}</Tab>
                ))}
              </TabList>
            </Tabs>
          </div>

          {filteredPlanners.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPlanners.map((planner, i) => {
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
                      <PlannerPagePreview
                        page={firstPage}
                        className="w-full rounded-[4px] ring-1 ring-black/[0.07] shadow-sm"
                      />
                      {/* Favorito — estrela preenchida só para leitura rápida. */}
                      {planner.favorite && (
                        <span
                          role="img"
                          aria-label="Caderno favorito"
                          className="absolute right-3.5 top-3.5 flex size-6 items-center justify-center rounded-full bg-warning/90 text-primary-foreground shadow-sm"
                        >
                          <Star size={12} className="fill-current" aria-hidden />
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
                      className="absolute right-11 top-2 z-10 flex size-8 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur-sm hover:bg-primary cursor-pointer"
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteTarget(planner)
                      }}
                      aria-label={`Excluir ${planner.name}`}
                      className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-xl bg-black/45 text-white backdrop-blur-sm hover:bg-destructive cursor-pointer"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>

                    {/* Rótulo */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{planner.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {folderName(planner.folderId) ?? 'Sem pasta'}
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
              <p className="text-muted-foreground">
                {selectedFolder
                  ? `Nenhum caderno na pasta ${selectedFolder.name} ainda.`
                  : 'Nenhum caderno ainda.'}
              </p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setCreateOpen(true)}>
                Criar caderno
              </Button>
            </div>
          )}
        </div>
      </div>

      <DeletePlannerDialog planner={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <CreatePlannerDialog
        open={createOpen}
        editId={editTarget?.id}
        initialFolderId={selectedFolder?.id}
        onClose={() => { setCreateOpen(false); setEditTarget(null) }}
      />
      <PlannerFolderDialog
        open={folderDialogOpen}
        editId={editFolderId}
        onClose={() => { setFolderDialogOpen(false); setEditFolderId(undefined) }}
      />
    </div>
  )
}
