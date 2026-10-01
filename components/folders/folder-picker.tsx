'use client'

import type { Folder } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FolderPickerProps {
  folders: Folder[]
  value: string | null
  onChange: (folderId: string | null) => void
}

export function FolderPicker({ folders, value, onChange }: FolderPickerProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">Pasta</label>
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Selecionar pasta">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
          className={cn(
            'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
            value === null
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-border/60 text-muted-foreground hover:bg-muted/50',
          )}
        >
          Sem pasta
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            aria-pressed={value === folder.id}
            onClick={() => onChange(folder.id)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5',
              value === folder.id
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-muted/50',
            )}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: folder.color }} />
            {folder.name}
          </button>
        ))}
      </div>
    </div>
  )
}
