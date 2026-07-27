'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeCollection } from '@/lib/db/client'
import { bindCollectionWriteThrough, bindRootField } from '@/lib/db/write-through'
import { isOwnDocSnapshot, isOwnRootFieldSnapshot } from '@/lib/db/own-writes'
import { EDITOR_PLAN, resolveRoutePlan, type RouteCollectionPlan } from '@/lib/db/route-collections'
import type { User } from 'firebase/auth'

import { useAppStore } from '@/lib/store/use-app-store'
import { useProfileStore } from '@/lib/store/use-profile-store'
import { useMenuStore } from '@/lib/store/use-menu-store'
import { useDiarioStore } from '@/lib/diario/use-diario-store'
import { useJournalStore } from '@/lib/store/use-journal-store'
import { useRetroStore } from '@/lib/store/use-retro-store'
import { useNotesStore } from '@/lib/store/use-notes-store'
import { useListsStore } from '@/lib/store/use-lists-store'
import { useChecklistsStore } from '@/lib/store/use-checklists-store'
import { useQuotesStore } from '@/lib/store/use-quotes-store'
import { useMemoriesStore } from '@/lib/store/use-memories-store'
import { usePasswordsStore } from '@/lib/store/use-passwords-store'
import { useWishlistStore } from '@/lib/store/use-wishlist-store'
import { useHealthStore } from '@/lib/store/use-health-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useRoutineStore } from '@/lib/store/use-routine-store'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useFinanceStore } from '@/lib/store/use-finance-store'
import { useTrashStore } from '@/lib/store/use-trash-store'
import { useSubscriptionStore } from '@/lib/subscriptions/use-subscription-store'

type StoreLike = {
  getState: () => Record<string, any>
  setState: (patch: Record<string, any>) => void
  subscribe: (listener: (state: Record<string, any>) => void) => () => void
}

interface RootBinding {
  store: StoreLike
  field: string
  rootKey: string
  read: boolean
  write: boolean
}

interface ColBinding {
  store: StoreLike
  field: string
  collection: string
  read: boolean
  write: boolean
}

const ROOT_BINDINGS: RootBinding[] = [
  { store: useAppStore as unknown as StoreLike, field: 'folders', rootKey: 'folders', read: true, write: true },
  { store: useAppStore as unknown as StoreLike, field: 'tags', rootKey: 'plannerTags', read: true, write: true },
  { store: useAppStore as unknown as StoreLike, field: 'theme', rootKey: 'theme', read: true, write: true },
  { store: useProfileStore as unknown as StoreLike, field: 'name', rootKey: 'name', read: true, write: true },
  { store: useProfileStore as unknown as StoreLike, field: 'avatar', rootKey: 'avatar', read: true, write: true },
  { store: useProfileStore as unknown as StoreLike, field: 'email', rootKey: 'email', read: true, write: true },
  { store: useMenuStore as unknown as StoreLike, field: 'modules', rootKey: 'modules', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'height', rootKey: 'height', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'goalWeight', rootKey: 'goalWeight', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'sex', rootKey: 'sex', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'onboarded', rootKey: 'onboarded', read: true, write: true },
  { store: usePasswordsStore as unknown as StoreLike, field: 'masterPin', rootKey: 'masterPin', read: false, write: true },

  // Assinatura — sinergia de role (admin) com plano/status.
  { store: useSubscriptionStore as unknown as StoreLike, field: 'role', rootKey: 'subscription.role', read: true, write: true },
  { store: useSubscriptionStore as unknown as StoreLike, field: 'plan', rootKey: 'subscription.plan', read: true, write: true },
  { store: useSubscriptionStore as unknown as StoreLike, field: 'status', rootKey: 'subscription.status', read: true, write: true },
  { store: useSubscriptionStore as unknown as StoreLike, field: 'since', rootKey: 'subscription.since', read: true, write: true },
  { store: useSubscriptionStore as unknown as StoreLike, field: 'lastPayment', rootKey: 'subscription.lastPayment', read: true, write: true },
]

const COL_BINDINGS: ColBinding[] = [
  { store: useAppStore as unknown as StoreLike, field: 'planners', collection: 'planners', read: true, write: false },
  { store: useDiarioStore as unknown as StoreLike, field: 'registros', collection: 'diarios', read: true, write: true },
  { store: useJournalStore as unknown as StoreLike, field: 'entries', collection: 'journalEntries', read: true, write: true },
  { store: useRetroStore as unknown as StoreLike, field: 'entries', collection: 'retroEntries', read: true, write: true },
  { store: useNotesStore as unknown as StoreLike, field: 'notes', collection: 'notes', read: true, write: true },
  { store: useNotesStore as unknown as StoreLike, field: 'folders', collection: 'noteFolders', read: false, write: false },
  { store: useListsStore as unknown as StoreLike, field: 'lists', collection: 'shoppingLists', read: true, write: true },
  { store: useChecklistsStore as unknown as StoreLike, field: 'checklists', collection: 'checklists', read: true, write: true },
  { store: useQuotesStore as unknown as StoreLike, field: 'quotes', collection: 'quotes', read: true, write: true },
  { store: useMemoriesStore as unknown as StoreLike, field: 'entries', collection: 'memories', read: true, write: true },
  { store: usePasswordsStore as unknown as StoreLike, field: 'entries', collection: 'passwords', read: true, write: true },
  { store: useWishlistStore as unknown as StoreLike, field: 'items', collection: 'wishlist', read: true, write: true },
  { store: useTrashStore as unknown as StoreLike, field: 'items', collection: 'trashItems', read: true, write: true },
  { store: useCalendarStore as unknown as StoreLike, field: 'events', collection: 'calendarEvents', read: true, write: true },
  { store: useHabitsStore as unknown as StoreLike, field: 'habits', collection: 'habits', read: true, write: true },
  { store: useHabitsStore as unknown as StoreLike, field: 'logs', collection: 'habitLogs', read: true, write: true },
  { store: useRoutineStore as unknown as StoreLike, field: 'tasks', collection: 'tasks', read: true, write: true },
  { store: useRoutineStore as unknown as StoreLike, field: 'recurringTasks', collection: 'recurringTasks', read: true, write: true },
  { store: useRoutineStore as unknown as StoreLike, field: 'pendingItems', collection: 'pendingItems', read: true, write: true },
  { store: useRoutineStore as unknown as StoreLike, field: 'routineSlots', collection: 'routineSlots', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'transactions', collection: 'transactions', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'fixedBills', collection: 'fixedBills', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'subscriptions', collection: 'subscriptions', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'cards', collection: 'creditCards', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'installments', collection: 'installments', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'goals', collection: 'financialGoals', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'goalDeposits', collection: 'goalDeposits', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'savingsBoxes', collection: 'savingsBoxes', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'weights', collection: 'weights', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'measurements', collection: 'bodyMeasurements', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'symptoms', collection: 'symptomLogs', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'medications', collection: 'medications', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'cycles', collection: 'cycleRecords', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'doctors', collection: 'doctors', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'appointments', collection: 'appointments', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'exams', collection: 'exams', read: true, write: true },
]

/**
 * Resolve um rootKey aninhado (ex.: "subscription.role") a partir do
 * documento-raiz plano serializado pelo Firestore. Suporta uma chave
 * simples ("theme") ou uma nested com ponto ("subscription.role").
 */
function readRootField(d: Record<string, any>, rootKey: string): unknown {
  if (!rootKey.includes('.')) return d[rootKey]
  let cur: any = d
  for (const seg of rootKey.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[seg]
  }
  return cur
}

export interface StoreSyncProviderProps {
  children: React.ReactNode
  /**
   * Modo editor (/planner/[id]): bypassa o resolveRoutePlan baseado em
   * pathname e usa um planta fixo que carrega planners + root essenciais
   * (theme/folders/plannerTags). Passa `true` no mount inline do editor.
   */
  editorMode?: boolean
}

export function StoreSyncProvider({ children, editorMode = false }: StoreSyncProviderProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Plano atual: coleções/rootFields que esta página precisa ler.
  // No modo editor, ignora o pathname e usa o plano fixo do editor.
  const plan: RouteCollectionPlan = editorMode
    ? EDITOR_PLAN
    : resolveRoutePlan(pathname ?? '/')

  // ── Efeito 1 — Root doc + collection writes (sempre ativos enquanto
  //    o usuário está logado). Os write-through não dependem da rota:
  //    garantem que criações locais sejam persistidas mesmo se o listener
  //    de read estiver desligado (caso do usuário criar item fora da página
  //    nativa da coleção). Custo néant: nenhum onSnapshot aberto aqui.
  useEffect(() => {
    if (!user) return
    const unsubs: Array<() => void> = []

    // Write-through de root fields — SEMPRE ativos para escrita. A leitura
    // seletiva dos snapshots é feita no outro useEffect via own-writes flag.
    for (const b of ROOT_BINDINGS) {
      if (b.write) {
        unsubs.push(bindRootField(user, b.store, b.field, b.rootKey))
      }
    }
    // Write-through de coleções — SEMPRE ativos. Importante: se o listener
    // de read daquela coleção está desligado (página não precisa), o write-
    // through ainda escreve, e quando o usuário abrir a página certa, o
    // onSnapshot chega com o estado atualizado. Sem isso, creates feitos
    // fora da página nativa sumiriam até a próxima visita.
    for (const b of COL_BINDINGS) {
      if (b.write) {
        unsubs.push(
          bindCollectionWriteThrough(user, {
            store: b.store,
            field: b.field,
            collectionName: b.collection,
          }),
        )
      }
    }
    return () => unsubs.forEach((u) => u())
  }, [user])

  // ── Efeito 2 — Leitura (onSnapshot) lazy por pathname/plano.
  //    Só abre o listener do root doc e das coleções que a página atual
  //    precisa. Re-roda quando o pathname muda (navegação) ou quando o
  //    usuário muda (login/logout). Isto corta ~70% das leituras diárias.
  useEffect(() => {
    if (!user) return
    const unsubs: Array<() => void> = []

    // 2a. Root doc — aberto sempre (cobra só 1 leitura/refresh), mas só
    //     aplicamos ao store os rootFields que o plano pede. Isto continua
    //     económico: 1 listener + 1 doc reads vs. 35 collection listeners.
    const rootRef = doc(db, 'users', user.uid)
    const wantRootKeys = new Set(plan.rootFields ?? [])
    const unsubRoot = onSnapshot(rootRef, (snap) => {
      if (!snap.exists()) return
      const d = snap.data() as any
      for (const b of ROOT_BINDINGS) {
        if (!b.read) continue
        if (wantRootKeys.size > 0 && !wantRootKeys.has(b.rootKey)) continue
        const value = readRootField(d, b.rootKey)
        if (value === undefined) continue
        // Corte do loop: se este campo é eco de uma escrita nossa recente,
        // ignora o setState — o write-through já atualizou a store.
        if (isOwnRootFieldSnapshot(user.uid, b.rootKey, value)) continue
        ;(b.store as any).setState({ [b.field]: value })
      }
    })
    unsubs.push(unsubRoot)

    // 2b. Coleções — abre onSnapshot só para as do plano.
    const wantCols = new Set(plan.collections)
    const UPSERT_KEY = '__pendingWrites'

    for (const b of COL_BINDINGS) {
      if (!b.read) continue
      if (!wantCols.has(b.collection)) continue

      const unsub = subscribeCollection<any>(user, b.collection, (items) => {
        // Corte do loop por item: para cada item do snapshot, verificamos
        // se é eco de uma escrita nossa recente.
        //  • Se é eco (mesmo canonical) → o estado local JÁ está com este
        //    item atualizado (foi o próprio write-through que o escreveu).
        //    Mantemos a cópia LOCAL no merge — descartar faria com que o
        //    "merged" perdesse o item e o setState acabasse apagando-o.
        //  • Se NÃO é eco → aplicar o item do snapshot (atualização remota
        //    legítima, de outra aba/dispositivo).
        const local: any[] = (b.store as any).getState()[b.field] ?? []
        const localMap = new Map(local.map((x) => [x.id, x]))
        // IDs criados localmente que ainda não foram escritos — preservar.
        const pendingRaw = (window as any)[UPSERT_KEY + ':' + b.collection] as Set<string> | undefined
        const pending = pendingRaw ? new Set([...pendingRaw]) : new Set<string>()

        // Estratégia de merge:
        //  • Para cada id no snapshot:
        //    - se é eco nosso → usar cópia LOCAL (já está correta, não
        //      precisa re-setar → corta o loop do write-through).
        //    - senão → usar snapshot remote (mudança externa legítima).
        //  • Para cada id no local que NÃO está no snapshot:
        //    - se está em pending (criação local ainda não escrita) → manter local.
        //    - senão → descartar (apagado remotamente por outra aba/device).
        const merged: any[] = []
        const seenIds = new Set<string>()
        for (const item of items) {
          if (isOwnDocSnapshot(user.uid, b.collection, item)) {
            // Eco de nossa escrita. Mantém o local (que já contém este item
            // — foi o write-through que disparou a escrita que gerou o eco).
            const localItem = localMap.get(item.id)
            if (localItem) {
              merged.push(localItem)
              seenIds.add(item.id)
            }
            continue
          }
          // Atualização externa legítima — usa o payload do snapshot.
          merged.push(item)
          seenIds.add(item.id)
        }
        for (const item of local) {
          if (!seenIds.has(item.id)) {
            // Não está no snapshot remoto. Se é pending (criação local
            // recente), preservamos até a próxima emissãoofirestore dele.
            // Caso contrário, foi apagado remotamente — descarta.
            if (pending.has(item.id)) {
              merged.push(item)
              seenIds.add(item.id)
            }
          }
        }

        // Se o merge casa id<EA>nticamente com o estado local (incl. ordem),
        // aborta o setState — corta novo ciclo write-through:
        const same =
          merged.length === local.length &&
          merged.every((m, i) => m.id === local[i].id && JSON.stringify(m) === JSON.stringify(local[i]))
        if (same) return
        ;(b.store as any).setState({ [b.field]: merged })
      })
      unsubs.push(unsub)
    }

    return () => unsubs.forEach((u) => u())
  }, [user, plan])

  return <>{children}</>
}
