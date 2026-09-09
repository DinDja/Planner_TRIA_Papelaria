'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeCollection } from '@/lib/db/client'
import {
  bindCollectionWriteThrough,
  bindRootField,
  getPendingCollectionState,
  notifyCollectionRemote,
  withRemoteStoreUpdate,
} from '@/lib/db/write-through'
import { isOwnDocSnapshot, isOwnRootFieldSnapshot } from '@/lib/db/own-writes'
import { EDITOR_PLAN, resolveRoutePlan, type RouteCollectionPlan } from '@/lib/db/route-collections'
import { useAppStore } from '@/lib/store/use-app-store'
import { useProfileStore } from '@/lib/store/use-profile-store'
import { sanitizeModules, useMenuStore } from '@/lib/store/use-menu-store'
import type { ModuleDef } from '@/lib/store/use-menu-store'
import { useDiarioStore } from '@/lib/diario/use-diario-store'
import { useJournalStore } from '@/lib/store/use-journal-store'
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
import { useCalendarPlannerStore } from '@/lib/store/use-calendar-planner-store'
import { useFinanceStore } from '@/lib/store/use-finance-store'
import { useBirthdaysStore } from '@/lib/store/use-birthdays-store'
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
  { store: useCalendarPlannerStore as unknown as StoreLike, field: 'weeks', rootKey: 'calendarPlanner', read: true, write: true },
  { store: useDiarioStore as unknown as StoreLike, field: 'senhaHash', rootKey: 'diarioPasswordHash', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'height', rootKey: 'height', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'goalWeight', rootKey: 'goalWeight', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'sex', rootKey: 'sex', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'onboarded', rootKey: 'onboarded', read: true, write: true },
  { store: usePasswordsStore as unknown as StoreLike, field: 'masterPin', rootKey: 'masterPin', read: false, write: true },
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
  { store: useNotesStore as unknown as StoreLike, field: 'notes', collection: 'notes', read: true, write: true },
  { store: useNotesStore as unknown as StoreLike, field: 'folders', collection: 'noteFolders', read: false, write: false },
  { store: useListsStore as unknown as StoreLike, field: 'lists', collection: 'shoppingLists', read: true, write: true },
  { store: useListsStore as unknown as StoreLike, field: 'userPresets', collection: 'listPresets', read: false, write: false },
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
  { store: useFinanceStore as unknown as StoreLike, field: 'accounts', collection: 'financialAccounts', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'transactions', collection: 'transactions', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'fixedBills', collection: 'fixedBills', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'subscriptions', collection: 'subscriptions', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'cards', collection: 'creditCards', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'installments', collection: 'installments', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'goals', collection: 'financialGoals', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'goalDeposits', collection: 'goalDeposits', read: true, write: true },
  { store: useFinanceStore as unknown as StoreLike, field: 'savingsBoxes', collection: 'savingsBoxes', read: true, write: true },
  { store: useBirthdaysStore as unknown as StoreLike, field: 'entries', collection: 'birthdays', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'weights', collection: 'weights', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'measurements', collection: 'bodyMeasurements', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'symptoms', collection: 'symptomLogs', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'medications', collection: 'medications', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'cycles', collection: 'cycleRecords', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'doctors', collection: 'doctors', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'appointments', collection: 'appointments', read: true, write: true },
  { store: useHealthStore as unknown as StoreLike, field: 'exams', collection: 'exams', read: true, write: true },
]

function readRootField(data: Record<string, any>, rootKey: string): unknown {
  if (!rootKey.includes('.')) return data[rootKey]
  let current: any = data
  for (const segment of rootKey.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[segment]
  }
  return current
}

export interface StoreSyncProviderProps {
  children: React.ReactNode
  editorMode?: boolean
}

export function StoreSyncProvider({ children, editorMode = false }: StoreSyncProviderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const plan: RouteCollectionPlan = useMemo(
    () => (editorMode ? EDITOR_PLAN : resolveRoutePlan(pathname ?? '/')),
    [editorMode, pathname],
  )

  useEffect(() => {
    if (!user) return
    const unsubs: Array<() => void> = []
    for (const binding of ROOT_BINDINGS) {
      if (binding.write) unsubs.push(bindRootField(user, binding.store, binding.field, binding.rootKey))
    }
    for (const binding of COL_BINDINGS) {
      if (binding.write) {
        unsubs.push(bindCollectionWriteThrough(user, {
          store: binding.store,
          field: binding.field,
          collectionName: binding.collection,
        }))
      }
    }
    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [user?.uid])

  useEffect(() => {
    if (!user) return
    const unsubs: Array<() => void> = []
    const rootRef = doc(db, 'users', user.uid)
    const wantedRootKeys = new Set(plan.rootFields ?? [])
    unsubs.push(onSnapshot(rootRef, (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.data() as Record<string, any>
      for (const binding of ROOT_BINDINGS) {
        if (!binding.read) continue
        if (wantedRootKeys.size > 0 && !wantedRootKeys.has(binding.rootKey)) continue
        const value = readRootField(data, binding.rootKey)
        if (value === undefined) continue
        const normalized = binding.field === 'modules' && Array.isArray(value)
          ? sanitizeModules(value as ModuleDef[])
          : value
        if (isOwnRootFieldSnapshot(user.uid, binding.rootKey, normalized)) continue
        withRemoteStoreUpdate(() => binding.store.setState({ [binding.field]: normalized }))
      }
    }))

    const wantedCollections = new Set(plan.collections)
    for (const binding of COL_BINDINGS) {
      if (!binding.read || !wantedCollections.has(binding.collection)) continue
      unsubs.push(subscribeCollection<any>(user, binding.collection, (items) => {
        const local: any[] = binding.store.getState()[binding.field] ?? []
        const localMap = new Map(local.map((item) => [item.id, item]))
        const pending = getPendingCollectionState(user.uid, binding.collection)
        const merged: any[] = []
        const baseline: any[] = []
        const seen = new Set<string>()

        for (const item of items) {
          if (pending.deletes.has(item.id)) {
            baseline.push(item)
            continue
          }
          const own = isOwnDocSnapshot(user.uid, binding.collection, item)
          const localItem = localMap.get(item.id)
          if (pending.upserts.has(item.id)) {
            merged.push(localItem ?? item)
            baseline.push(item)
          } else if (own) {
            merged.push(localItem ?? item)
            baseline.push(localItem ?? item)
          } else {
            merged.push(item)
            baseline.push(item)
          }
          seen.add(item.id)
        }
        for (const item of local) {
          if (!seen.has(item.id) && pending.upserts.has(item.id)) merged.push(item)
        }

        notifyCollectionRemote(user.uid, binding.collection, items, baseline)
        const same = merged.length === local.length && merged.every(
          (item, index) => item.id === local[index].id && JSON.stringify(item) === JSON.stringify(local[index]),
        )
        if (!same) withRemoteStoreUpdate(() => binding.store.setState({ [binding.field]: merged }))
      }))
    }
    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [user?.uid, plan])

  return <>{children}</>
}
