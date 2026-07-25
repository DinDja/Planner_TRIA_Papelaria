'use client'

import { useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeCollection } from '@/lib/db/client'
import { bindCollectionWriteThrough, bindRootField } from '@/lib/db/write-through'
import type { User } from 'firebase/auth'

import { useAppStore } from '@/lib/store/use-app-store'
import { useProfileStore } from '@/lib/store/use-profile-store'
import { useSettingsStore } from '@/lib/store/use-settings-store'
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
  // Role é derivado do e-mail no onAuthStateChanged; apenas persistimos snapshot.
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

export function StoreSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const unsubs: Array<() => void> = []

    // ── Root doc reads ─────────────────────────────────────────────
    const rootRef = doc(db, 'users', user.uid)
    const unsubRoot = onSnapshot(rootRef, (snap) => {
      if (!snap.exists()) return
      const d = snap.data() as any
      for (const b of ROOT_BINDINGS) {
        if (b.read && d[b.rootKey] !== undefined) {
          ;(b.store as any).setState({ [b.field]: d[b.rootKey] })
        }
      }
    })
    unsubs.push(unsubRoot)

    // ── Collection reads ──────────────────────────────────────────
    for (const b of COL_BINDINGS) {
      if (b.read) {
        const unsub = subscribeCollection<any>(user, b.collection, (items) => {
          ;(b.store as any).setState({ [b.field]: items })
        })
        unsubs.push(unsub)
      }
    }

    // ── Write-through (store → Firestore) ─────────────────────────
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
    for (const b of ROOT_BINDINGS) {
      if (b.write) {
        unsubs.push(bindRootField(user, b.store, b.field, b.rootKey))
      }
    }

    return () => unsubs.forEach((u) => u())
  }, [user])

  return <>{children}</>
}
