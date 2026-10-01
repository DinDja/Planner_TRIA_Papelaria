'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { SYSTEM_PALETTES, SYSTEM_PALETTE_MAP } from '@/lib/theme'
import { useSettingsStore } from '@/lib/store/use-settings-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

interface Props {
  open: boolean
  onClose: () => void
  editId?: string
  onSaved?: (folderId: string) => void
}

export function PlannerFolderDialog({ open, onClose, editId, onSaved }: Props) {
  const addFolder = useAppStore((s) => s.addFolder)
  const updateFolder = useAppStore((s) => s.updateFolder)
  const existing = useAppStore((s) => s.folders.find((folder) => folder.id === editId))
  const selectedPalette = useSettingsStore((s) => s.palette)
  const defaultColor = SYSTEM_PALETTE_MAP[selectedPalette].value
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setName(existing.name)
      setColor(existing.color)
    } else if (!editId) {
      setName('')
      setColor(defaultColor)
    }
  }, [open, editId, existing, defaultColor])

  const handleSave = () => {
    const cleanName = name.trim()
    if (!cleanName) {
      toast({ title: 'Digite um nome para a pasta', variant: 'error' })
      return
    }

    if (editId) {
      updateFolder(editId, { name: cleanName, color })
      toast({ title: 'Pasta atualizada!', variant: 'success' })
      onSaved?.(editId)
    } else {
      const folderId = addFolder(cleanName, color)
      toast({ title: 'Pasta criada!', variant: 'success' })
      onSaved?.(folderId)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        title={editId ? 'Editar pasta' : 'Nova pasta'}
        description="Organize seus cadernos em pastas."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="planner-folder-name">
              Nome da pasta
            </label>
            <Input
              id="planner-folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Pessoal, Trabalho, Estudos..."
              onKeyDown={(event) => event.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Cor</legend>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_PALETTES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`Selecionar cor ${option.label}`}
                  aria-pressed={color === option.value}
                  onClick={() => setColor(option.value)}
                  className={cn(
                    'inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all',
                    color === option.value
                      ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover'
                      : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                >
                  {color === option.value && <Check size={12} strokeWidth={3} className="text-white" aria-hidden />}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl">
              {editId ? 'Salvar alterações' : 'Criar pasta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
