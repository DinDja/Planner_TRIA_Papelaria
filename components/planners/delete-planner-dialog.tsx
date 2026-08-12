'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { deleteItem } from '@/lib/db/client'
import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner } from '@/lib/types'
import { Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { toast } from '../ui/toaster'

/**
 * Confirmação única de exclusão de planner, usada no Dashboard e na aba
 * Meus Planners. Apaga do store (instantâneo) e do Firestore (fonte da
 * verdade — a coleção planners tem write-through desligado no
 * StoreSyncProvider, então a remoção remota é responsabilidade daqui).
 */
export function DeletePlannerDialog({
  planner,
  onClose,
}: {
  planner: Planner | null
  onClose: () => void
}) {
  const { user } = useAuth()
  const deletePlanner = useAppStore((s) => s.deletePlanner)
  const open = planner !== null

  const confirm = async () => {
    if (!planner) return
    deletePlanner(planner.id)
    if (user) {
      try {
        await deleteItem(user, 'planners', planner.id)
      } catch {}
    }
    toast({ title: 'Planner excluído', variant: 'error' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Excluir planner" description="Esta ação não pode ser desfeita.">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir{' '}
            <strong className="text-foreground">{planner?.name}</strong>
            {planner && planner.pages.length > 0 && (
              <> e todas as suas {planner.pages.length} páginas?</>
            )}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirm} className="rounded-xl gap-1.5">
              <Trash2 size={14} />
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}