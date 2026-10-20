'use client'

import { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
import { PlannerEditor } from '@/components/editor/planner-editor'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreSyncProvider } from '@/components/providers/store-sync-provider'
import { useAuth } from '@/lib/auth/auth-context'
import { db } from '@/lib/firebase'
import { withRemoteStoreUpdate } from '@/lib/db/write-through'
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
    let latestData: Record<string, any> | null = null
    let stopPages: (() => void) | undefined
    const stopPlanner = onSnapshot(
      doc(db, 'users', userId, 'planners', id),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.exists()) {
          stopPages?.()
          stopPages = undefined
          latestData = null
          // O cache local do Firestore pode não ter o documento ainda. Só
          // mostramos "não encontrado" depois da confirmação do servidor.
          if (snapshot.metadata.fromCache) return
          setRemotePlanner(null)
          setRemoteStatus('missing')
          return
        }

        latestData = snapshot.data() as Record<string, any>
        if (stopPages) return

        stopPages = onSnapshot(
          collection(db, 'users', userId, 'planners', id, 'pages'),
          { includeMetadataChanges: true },
          (pagesSnapshot) => {
            if (!latestData) return
            const data = latestData as Partial<Planner> & { pageCount?: number }
            const remotePages = pagesSnapshot.docs
              .map((pageDoc) => {
                const page = pageDoc.data() as Planner['pages'][number]
                return { ...page, id: page.id ?? pageDoc.id }
              })
              .sort((a, b) => (a.pageOrder ?? Number.MAX_SAFE_INTEGER) - (b.pageOrder ?? Number.MAX_SAFE_INTEGER))
            const legacyPages = Array.isArray(data.pages) ? data.pages : []
            const cached = cachedPlannerRef.current
            if (
              pagesSnapshot.metadata.fromCache &&
              remotePages.length === 0 &&
              legacyPages.length === 0 &&
              (cached?.pages.length ?? 0) === 0 &&
              data.pageCount !== 0
            ) return
            const pages = remotePages.length > 0
              ? remotePages
              : data.pageCount === 0
                ? []
                : legacyPages.length > 0
                  ? legacyPages
                  : cached?.pages ?? []

            setRemotePlanner({ ...data, id: data.id ?? id, pages } as Planner)
            setRemoteStatus('found')
          },
          () => setRemoteStatus('error'),
        )
      },
      () => setRemoteStatus('error'),
    )
    return () => {
      stopPages?.()
      stopPlanner()
    }
  }, [id, userId])

  const currentRemotePlanner = remotePlanner?.id === id ? remotePlanner : null
  const planner = remoteStatus === 'loading'
    ? null
    : remoteStatus === 'found' && currentRemotePlanner
      ? storePlanner && Date.parse(storePlanner.updatedAt) > Date.parse(currentRemotePlanner.updatedAt)
        ? storePlanner
        : currentRemotePlanner
      : storePlanner ?? (cachedPlanner?.id === id ? cachedPlanner : null)

  // O snapshot da coleção pode chegar vazio antes do snapshot deste documento.
  // Mantemos o planner selecionado na store para que o editor continue salvando
  // as alterações enquanto a sincronização termina.
  useEffect(() => {
    if (!planner) return
    withRemoteStoreUpdate(() => {
      useAppStore.setState((state) => {
        const current = state.planners.find((item) => item.id === id)
        if (current && Date.parse(current.updatedAt) > Date.parse(planner.updatedAt)) return state
        if (current && JSON.stringify(current) === JSON.stringify(planner)) return state
        return {
          planners: current
            ? state.planners.map((item) => item.id === id ? planner : item)
            : [...state.planners, planner],
        }
      })
    })
  }, [id, planner])

  return (
    <RequireAuth>
      <StoreSyncProvider editorMode>
        {planner ? (
          <PlannerEditor planner={planner} />
        ) : remoteStatus === 'loading' ? (
          <div className="flex h-dvh items-center justify-center px-4" role="status" aria-live="polite">
            <p className="text-sm text-muted-foreground">Abrindo caderno…</p>
          </div>
        ) : (
          <div className="flex h-dvh items-center justify-center px-4">
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
