'use client'

import { useNotesStore } from '@/lib/store/use-notes-store'
import type { Note } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  FileText,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Badge, Input as SearchInput, ScrollArea } from '../ui/primitives'
import { Dialog, DialogContent, Tab, TabList, TabPanel, Tabs } from '../ui/overlays'
import { AddFolderDialog, AddNoteDialog } from './notes-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

const ROTATIONS = [-2, -1, 0, 1, 2, 3, -3, -1.5, 1.5, 0]

function NoteCard({
  note,
  index,
  folderName,
  onDelete,
  onTogglePin,
  onMove,
}: {
  note: Note
  index: number
  folderName?: string
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onMove: (id: string) => void
}) {
  const lines = note.content.split('\n').filter(Boolean)
  const preview = lines.slice(0, 4).join('\n')
  const hasMore = lines.length > 4
  const rotate = ROTATIONS[index % ROTATIONS.length]

  return (
    <div
      className="group relative"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Sombra de papel */}
      <div
        className="absolute inset-0 rounded-2xl translate-y-[3px] translate-x-[3px] transition-shadow"
        style={{ backgroundColor: note.color + '60' }}
      />

      {/* Pin visual */}
      {note.pinned && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Pin size={16} className="text-destructive fill-destructive drop-shadow-sm" />
        </div>
      )}

      {/* Nota propriamente dita */}
      <div
        className={cn(
          'relative rounded-2xl p-4 transition-all duration-200',
          'group-hover:-translate-y-1 group-hover:shadow-xl',
          note.pinned ? 'shadow-lg' : 'shadow-md',
        )}
        style={{
          backgroundColor: note.color + '18',
          borderLeft: `4px solid ${note.color}`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-sm leading-snug tracking-tight"
              style={{ color: note.color }}
            >
              {note.title}
            </h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onTogglePin(note.id)}
              className="rounded-lg p-1 transition-colors cursor-pointer"
              style={{
                color: note.pinned ? 'var(--destructive)' : 'var(--muted-foreground)',
              }}
              aria-label={note.pinned ? 'Desfixar' : 'Fixar'}
            >
              {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
            <button
              onClick={() => onMove(note.id)}
              className="rounded-lg p-1 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
              aria-label="Mover para pasta"
              title="Mover para pasta"
            >
              <FolderInput size={13} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="rounded-lg p-1 text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
              aria-label="Excluir nota"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground/60 mb-2">
          {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Conteúdo */}
        <div
          className="text-xs leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--foreground)' }}
        >
          {preview}
          {hasMore && (
            <span className="text-muted-foreground/50 block text-[10px] mt-1">
              ... {lines.length - 4} linhas a mais
            </span>
          )}
        </div>

        {/* Tags e pasta */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {note.tags.slice(0, 2).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="text-[9px] px-1.5 py-0"
              style={{
                borderColor: note.color + '50',
                color: note.color,
              }}
            >
              {t}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[9px] text-muted-foreground">+{note.tags.length - 2}</span>
          )}
          {folderName && (
            <span className="ml-auto text-[9px] text-muted-foreground/60 flex items-center gap-1">
              <FolderIcon size={10} />
              {folderName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function NotesPage() {
  const notes = useNotesStore((s) => s.notes)
  const folders = useNotesStore((s) => s.folders)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const togglePinNote = useNotesStore((s) => s.togglePinNote)
  const deleteFolder = useNotesStore((s) => s.deleteFolder)
  const updateNote = useNotesStore((s) => s.updateNote)

  const [tab, setTab] = useState('all')
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [addFolderOpen, setAddFolderOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [moveNoteId, setMoveNoteId] = useState<string | null>(null)

  const moveNote = moveNoteId ? notes.find((n) => n.id === moveNoteId) : null

  const handleMoveToFolder = (folderId: string | null) => {
    if (moveNoteId) {
      updateNote(moveNoteId, { folderId })
      setMoveNoteId(null)
    }
  }

  const folderMap = useMemo(() => {
    const m = new Map<string, string>()
    folders.forEach((f) => m.set(f.id, f.name))
    return m
  }, [folders])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach((n) => n.tags.forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    let list = [...notes]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (tab === 'all') {
      list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.updatedAt.localeCompare(a.updatedAt)
      })
    } else if (tab.startsWith('folder-')) {
      const folderId = tab.replace('folder-', '')
      list = list.filter((n) => n.folderId === folderId)
    } else if (tab.startsWith('tag-')) {
      const tag = tab.replace('tag-', '')
      list = list.filter((n) => n.tags.includes(tag))
    }

    return list
  }, [notes, search, tab])

  return (
    <div className="flex h-full">
      {/* Sidebar de pastas */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/40 p-4 gap-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pastas
          </p>
          <button
            onClick={() => setAddFolderOpen(true)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Nova pasta"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        <button
          onClick={() => setTab('all')}
          className={cn(
            'flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer',
            tab === 'all'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <FileText size={15} />
          Todas as notas
          <span className="ml-auto text-xs text-muted-foreground/60">{notes.length}</span>
        </button>

        <div className="border-t border-border/30 my-2" />

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="space-y-0.5">
            {folders.map((f) => {
              const count = notes.filter((n) => n.folderId === f.id).length
              return (
                <div key={f.id} className="group flex items-center">
                  <button
                    onClick={() => setTab(`folder-${f.id}`)}
                    className={cn(
                      'flex items-center gap-2.5 flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer min-w-0',
                      tab === `folder-${f.id}`
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="size-2.5 rounded-md shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground/60">{count}</span>
                  </button>
                  <button
                    onClick={() => deleteFolder(f.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
                    aria-label={`Excluir pasta ${f.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {allTags.length > 0 && (
          <>
            <div className="border-t border-border/30 my-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(tab === `tag-${t}` ? 'all' : `tag-${t}`)}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer',
                    tab === `tag-${t}`
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-6', enter)}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: '#f0b42918' }}
              >
                <FileText size={22} style={{ color: '#f0b429' }} />
              </span>
              Notas
            </h1>
            <p className="text-muted-foreground mt-2">
              Anote ideias, reuniões, listas e tudo mais.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl gap-1.5 hidden lg:flex"
              onClick={() => setAddFolderOpen(true)}
            >
              <FolderPlus size={14} />
              Pasta
            </Button>
            <Button
              className="rounded-xl gap-1.5 shadow-md"
              onClick={() => setAddNoteOpen(true)}
            >
              <Plus size={15} />
              Nova nota
            </Button>
          </div>
        </div>

        <div className={cn('relative mb-6', enter)}>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Mobile folder tabs */}
        <div className="lg:hidden mb-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabList className="overflow-auto scrollbar-thin">
              <Tab value="all">
                Todas
                <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {notes.length}
                </span>
              </Tab>
              {folders.map((f) => (
                <Tab key={f.id} value={`folder-${f.id}`}>
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  {f.name}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 py-4">
            {filteredNotes.map((n, i) => (
              <NoteCard
                key={n.id}
                note={n}
                index={i}
                folderName={folderMap.get(n.folderId ?? '')}
                onDelete={deleteNote}
                onTogglePin={togglePinNote}
                onMove={setMoveNoteId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? 'Nenhuma nota encontrada.'
                : 'Nenhuma nota ainda. Crie sua primeira nota!'}
            </p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddNoteOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Criar nota
            </Button>
          </div>
        )}
      </div>

      <AddNoteDialog
        open={addNoteOpen}
        onClose={() => setAddNoteOpen(false)}
        defaultFolderId={tab.startsWith('folder-') ? tab.replace('folder-', '') : null}
      />
      <AddFolderDialog open={addFolderOpen} onClose={() => setAddFolderOpen(false)} />

      <Dialog open={moveNoteId !== null} onOpenChange={(o) => !o && setMoveNoteId(null)}>
        <DialogContent title="Mover nota" description={moveNote ? `Reorganize «${moveNote.title}» em outra pasta.` : undefined}>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleMoveToFolder(null)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left cursor-pointer',
                moveNote?.folderId === null
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <FileText size={16} />
              Sem pasta
            </button>
            {folders.map((f) => {
              const count = notes.filter((n) => n.folderId === f.id).length
              const active = moveNote?.folderId === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => handleMoveToFolder(f.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left cursor-pointer',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <span className="size-2.5 rounded-md shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-xs text-muted-foreground/60">{count}</span>
                </button>
              )
            })}
            {folders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma pasta criada. Crie uma pasta primeiro.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
