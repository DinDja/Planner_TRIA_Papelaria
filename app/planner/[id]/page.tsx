'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useEditorStore } from '@/lib/store/use-editor-store'
import { useParams, useRouter } from 'next/navigation'
import { PlannerEditor } from '@/components/editor/planner-editor'
import { ArrowBack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreSyncProvider } from '@/components/providers/store-sync-provider'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const planner = useAppStore((s) => s.planners.find((p) => p.id === id))

  return (
    <RequireAuth>
      <StoreSyncProvider>
        {planner ? (
          <PlannerEditor planner={planner} />
        ) : (
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold">Planner não encontrado</p>
              <Button variant="link" onClick={() => router.push('/')} className="mt-2">
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        )}
      </StoreSyncProvider>
    </RequireAuth>
  )
}
