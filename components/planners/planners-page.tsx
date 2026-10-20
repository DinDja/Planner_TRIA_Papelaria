'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { cn } from '@/lib/utils'
import { BookOpen, Folder as FolderIcon, FolderPlus, Pencil, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { CreatePlannerDialog } from '../dashboard/create-planner-dialog'
import { Button, buttonVariants } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tab, TabList, Tabs } from '../ui/overlays'
import { CadernoIcon } from '../icons/modules'
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
    <div className="flex h-full min-w-0">
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

      <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
          <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                  <CadernoIcon size={22} className="text-primary" aria-hidden />
                </span>
                Meus Cadernos
              </h1>
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
              <TabList>
                <Tab value="all">
                  Todos
                  <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
                    {planners.length}
                  </span>
                </Tab>
                {folders.map((folder) => (
                  <Tab key={folder.id} value={`folder-${folder.id}`}>
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />
                    {folder.name}
                  </Tab>
                ))}
              </TabList>
            </Tabs>
          </div>

          {filteredPlanners.length > 0 ? (
            <div className="space-y-4">
              {filteredPlanners.map((planner) => {
                const pageCount = planner.pageCount ?? planner.pages?.length ?? 0
                const plannerFolderName = folderName(planner.folderId)

                return (
                  <Card
                    key={planner.id}
                    glass
                    className="overflow-hidden"
                    style={{ borderTopColor: planner.color, borderTopWidth: 3 }}
                  >
                    <CardHeader className="flex-row items-start justify-between gap-3 pb-0">
                      <Link
                        href={'/planner/' + planner.id}
                        className="flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: planner.color + '18', color: planner.color }}
                        >
                          <CadernoIcon size={18} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <CardTitle className="truncate text-base">{planner.name}</CardTitle>
                            {planner.favorite && (
                              <span
                                role="img"
                                aria-label="Caderno favorito"
                                title="Caderno favorito"
                                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning/25 text-warning"
                              >
                                <Star size={11} className="fill-current" aria-hidden />
                              </span>
                            )}
                          </div>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {plannerFolderName ? <FolderIcon size={11} aria-hidden /> : null}
                              {plannerFolderName ?? 'Sem pasta'}
                            </span>
                            <span>{pageCount} {pageCount === 1 ? 'página' : 'páginas'}</span>
                          </span>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(planner)
                            setCreateOpen(true)
                          }}
                          aria-label={'Editar ' + planner.name}
                          title={'Editar ' + planner.name}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(planner)}
                          aria-label={'Excluir ' + planner.name}
                          title={'Excluir ' + planner.name}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      {planner.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{planner.description}</p>
                      )}
                      <Link
                        href={'/planner/' + planner.id}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'mt-3 w-full rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground',
                        })}
                      >
                        <BookOpen size={13} aria-hidden />
                        Abrir caderno
                      </Link>
                    </CardContent>
                  </Card>
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
