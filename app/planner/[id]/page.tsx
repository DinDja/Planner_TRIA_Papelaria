'use client'

import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
import { PlannerEditor } from '@/components/editor/planner-editor'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreSyncProvider } from '@/components/providers/store-sync-provider'
import { useAuth } from '@/lib/auth/auth-context'
import { db } from '@/lib/firebase'
import type { Planner } from '@/lib/types'
import { useAppStore } from '@/lib/store/use-app-store'

type RemoteStatus = 'loading' | 'found' | 'missing' | 'error'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.uid
  const storePlanner = useAppStore((s) => s.planners.find((p) => p.id === id) ?? null)
  const [cachedPlanner, setCachedPlanner] = useState<Planner | null>(() => storePlanner)
  const [remotePlanner, setRemotePlanner] = useState<Planner | null>(null)
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>('loading')
  const cachedPlannerRef = useRef<Planner | null>(storePlanner)

  useEffect(() => {
    if (!storePlanner) return
    cachedPlannerRef.current = storePlanner
    setCachedPlanner(storePlanner)
  }, [storePlanner])

  useEffect(() => {
    if (!userId) return

    setRemotePlanner(null)
    setRemoteStatus('loading')
    return onSnapshot(
      doc(db, 'users', userId, 'planners', id),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.exists()) {
          // O cache local do Firestore pode não ter o documento ainda. Só
          // mostramos "não encontrado" depois da confirmação do servidor.
          if (snapshot.metadata.fromCache) return
          setRemotePlanner(null)
          setRemoteStatus('missing')
          return
        }

        const data = snapshot.data() as Partial<Planner>
        const cached = cachedPlannerRef.current
        const pages = Array.isArray(data.pages) && data.pages.length > 0
          ? data.pages
          : cached?.pages ?? []

        const planner = { ...data, id: data.id ?? snapshot.id, pages } as Planner
        setRemotePlanner(planner)
        setRemoteStatus('found')
      },
      () => setRemoteStatus('error'),
    )
  }, [id, userId])

  const planner = storePlanner
    ?? (remotePlanner?.id === id ? remotePlanner : null)
    ?? (cachedPlanner?.id === id ? cachedPlanner : null)

  // O snapshot da coleção pode chegar vazio antes do snapshot deste documento.
  // Mantemos o planner selecionado na store para que o editor continue salvando
  // as alterações enquanto a sincronização termina.
  useEffect(() => {
    if (!planner || storePlanner) return
    useAppStore.setState((state) =>
      state.planners.some((item) => item.id === id)
        ? state
        : { planners: [...state.planners, planner] },
    )
  }, [id, planner, storePlanner])

  return (
    <RequireAuth>
      <StoreSyncProvider editorMode>
        {planner ? (
          <PlannerEditor planner={planner} />
        ) : remoteStatus === 'loading' ? (
          <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
            <p className="text-sm text-muted-foreground">Abrindo caderno…</p>
          </div>
        ) : (
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold">
                {remoteStatus === 'error' ? 'Não foi possível carregar este caderno' : 'Caderno não encontrado'}
              </p>
              <Button variant="link" onClick={() => router.push('/dashboard')} className="mt-2">
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        )}
      </StoreSyncProvider>
    </RequireAuth>
  )
}
