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
import { FolderPicker } from '../folders/folder-picker'

interface Props {
  open: boolean
  onClose: () => void
  editId?: string
  initialFolderId?: string | null
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SYSTEM_PALETTES.map((color) => (
        <button
          key={color.id}
          type="button"
          aria-label={`Selecionar cor ${color.label}`}
          aria-pressed={value === color.value}
          onClick={() => onChange(color.value)}
          className={cn(
            'inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200',
            value === color.value
              ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-popover'
              : 'hover:scale-110 hover:shadow-md',
          )}
          style={{ backgroundColor: color.value }}
        >
          {value === color.value && (
            <Check size={12} strokeWidth={3} className="text-white drop-shadow-sm" aria-hidden />
          )}
        </button>
      ))}
    </div>
  )
}

function CreatePlannerDialog({ open, onClose, editId, initialFolderId }: Props) {
  const addPlanner = useAppStore((s) => s.addPlanner)
  const updatePlanner = useAppStore((s) => s.updatePlanner)
  const folders = useAppStore((s) => s.folders)
  const existing = useAppStore((s) => s.planners.find((planner) => planner.id === editId))
  const selectedPalette = useSettingsStore((s) => s.palette)
  const defaultColor = SYSTEM_PALETTE_MAP[selectedPalette].value
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [folderId, setFolderId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editId && existing) {
      setName(existing.name)
      setColor(existing.color)
      setFolderId(existing.folderId)
    } else if (!editId) {
      setName('')
      setColor(defaultColor)
      setFolderId(initialFolderId ?? null)
    }
  }, [open, editId, existing, initialFolderId, defaultColor])

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome para o caderno', variant: 'error' })
      return
    }
    const selectedFolderId = folderId && folders.some((folder) => folder.id === folderId)
      ? folderId
      : null
    if (editId) {
      updatePlanner(editId, {
        name: name.trim(),
        color,
        folderId: selectedFolderId,
      })
      toast({ title: 'Caderno atualizado!', variant: 'success' })
    } else {
      addPlanner({
        name: name.trim(),
        color,
        folderId: selectedFolderId,
      })
      toast({ title: 'Caderno criado!', variant: 'success' })
    }
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        title={editId ? 'Editar caderno' : 'Novo caderno'}
        description="Dê um nome ao caderno e, se quiser, escolha uma pasta."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="planner-name">
              Nome do caderno
            </label>
            <Input
              id="planner-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Digite o nome do caderno"
              onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <FolderPicker folders={folders} value={folderId} onChange={setFolderId} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Cor da capa</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="rounded-xl shadow-md"
            >
              {editId ? 'Salvar alterações' : 'Criar caderno'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CreatePlannerDialog }
