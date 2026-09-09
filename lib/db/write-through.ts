'use client'

import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'
import { markCollectionWrite, markRootFieldWrite } from './own-writes'

type WithId = { id: string }

/** Remove valores que o Firestore não aceita em documentos. */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj
      .filter((value) => value !== undefined)
      .map((value) =>
        typeof value === 'object' && value !== null ? stripUndefined(value) : value,
      ) as T
  }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === undefined) continue
    out[key] = typeof value === 'object' && value !== null ? stripUndefined(value) : value
  }
  return out as T
}

/** Impede que um setState originado de onSnapshot volte para o write-through. */
let remoteStoreUpdateDepth = 0

export function withRemoteStoreUpdate<T>(fn: () => T): T {
  remoteStoreUpdateDepth += 1
  try {
    return fn()
  } finally {
    remoteStoreUpdateDepth -= 1
  }
}

interface CollectionBinding<T extends WithId> {
  store: { getState: () => Record<string, any>; subscribe: any }
  field: string
  collectionName: string
}

export interface PendingCollectionState {
  upserts: Set<string>
  deletes: Set<string>
}

interface CollectionRuntime {
  applyRemote: (items: WithId[], baseline: WithId[]) => void
  getPending: () => PendingCollectionState
}

const collectionRuntimes = new Map<string, CollectionRuntime>()

function collectionRuntimeKey(uid: string, collectionName: string) {
  return `${uid}/${collectionName}`
}

export function getPendingCollectionState(
  uid: string,
  collectionName: string,
): PendingCollectionState {
  const runtime = collectionRuntimes.get(collectionRuntimeKey(uid, collectionName))
  return runtime?.getPending() ?? { upserts: new Set(), deletes: new Set() }
}

/** Atualiza o baseline remoto sem disparar uma nova escrita. */
export function notifyCollectionRemote(
  uid: string,
  collectionName: string,
  items: WithId[],
  baseline: WithId[] = items,
) {
  collectionRuntimes
    .get(collectionRuntimeKey(uid, collectionName))
    ?.applyRemote(items, baseline)
}

function canonical(value: unknown): string {
  return JSON.stringify(stripUndefined(value))
}

interface CollectionDiff<T extends WithId> {
  upserts: T[]
  deletes: string[]
}

function diffCollections<T extends WithId>(before: T[], after: T[]): CollectionDiff<T> {
  const previous = new Map(before.map((item) => [item.id, item]))
  const current = new Map(after.map((item) => [item.id, item]))
  const upserts: T[] = []
  const deletes: string[] = []

  for (const item of after) {
    const old = previous.get(item.id)
    if (!old || canonical(old) !== canonical(item)) upserts.push(item)
  }
  for (const item of before) {
    if (!current.has(item.id)) deletes.push(item.id)
  }
  return { upserts, deletes }
}

function snapshotsEqual<T extends WithId>(a: T[], b: T[]): boolean {
  return canonical(a) === canonical(b)
}

/**
 * Persiste somente os documentos que realmente mudaram. A versão anterior
 * regravava a coleção inteira em qualquer alteração de um único item.
 */
export function bindCollectionWriteThrough<T extends WithId>(
  user: User,
  binding: CollectionBinding<T>,
): () => void {
  const { store, field, collectionName } = binding
  let lastObserved: T[] = [...(store.getState()[field] ?? [])]
  let lastPersisted: T[] = [...lastObserved]
  let pendingSnapshot: T[] | null = null
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingUpserts = new Set<string>()
  let pendingDeletes = new Set<string>()
  let changeVersion = 0
  let hasLocalMutation = false
  let disposed = false
  let commitChain: Promise<void> = Promise.resolve()

  const refreshPending = (snapshot: T[]) => {
    const diff = diffCollections(lastPersisted, snapshot)
    pendingUpserts = new Set(diff.upserts.map((item) => item.id))
    pendingDeletes = new Set(diff.deletes)
  }

  const persist = (snapshot: T[]) => {
    const version = ++changeVersion
    const desired = [...snapshot]
    const diff = diffCollections(lastPersisted, desired)
    if (diff.upserts.length === 0 && diff.deletes.length === 0) {
      hasLocalMutation = false
      refreshPending(desired)
      return
    }

    const markedAt = new Date().toISOString()
    const payload = diff.upserts.map((item) =>
      stripUndefined({ ...item, updatedAt: markedAt }),
    ) as T[]

    commitChain = commitChain
      .then(async () => {
        markCollectionWrite(user.uid, collectionName, payload)
        await writeCollectionDiff(user, collectionName, payload, diff.deletes)
      })
      .then(() => {
        lastPersisted = desired
        if (version === changeVersion) {
          hasLocalMutation = false
          refreshPending(lastObserved)
        }
      })
      .catch((error) => {
        console.error(`Falha ao sincronizar ${collectionName}`, error)
        if (version === changeVersion) refreshPending(lastObserved)
      })
  }

  const schedule = (snapshot: T[]) => {
    hasLocalMutation = true
    pendingSnapshot = [...snapshot]
    refreshPending(snapshot)
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      const next = pendingSnapshot
      pendingSnapshot = null
      if (!disposed && next) persist(next)
    }, 1500)
  }

  const runtime: CollectionRuntime = {
    applyRemote: (_items, baseline) => {
      lastPersisted = baseline as T[]
      if (hasLocalMutation) refreshPending(lastObserved)
      else {
        pendingUpserts = new Set()
        pendingDeletes = new Set()
      }
    },
    getPending: () => ({
      upserts: new Set(pendingUpserts),
      deletes: new Set(pendingDeletes),
    }),
  }
  const runtimeKey = collectionRuntimeKey(user.uid, collectionName)
  collectionRuntimes.set(runtimeKey, runtime)

  const unsub = store.subscribe((state: Record<string, any>) => {
    const current: T[] = state[field] ?? []
    if (snapshotsEqual(lastObserved, current)) return
    lastObserved = [...current]
    if (remoteStoreUpdateDepth > 0) return
    schedule(lastObserved)
  })

  return () => {
    if (disposed) return
    disposed = true
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = null
    const finalSnapshot = pendingSnapshot
    pendingSnapshot = null
    if (finalSnapshot) persist(finalSnapshot)
    unsub()
    if (collectionRuntimes.get(runtimeKey) === runtime) collectionRuntimes.delete(runtimeKey)
  }
}

async function writeCollectionDiff<T extends WithId>(
  user: User,
  path: string,
  upserts: T[],
  removedIds: string[],
) {
  const operations = [
    ...upserts.map((item) => ({ type: 'set' as const, id: item.id, item })),
    ...removedIds.map((id) => ({ type: 'delete' as const, id })),
  ]
  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = writeBatch(db)
    for (const operation of operations.slice(offset, offset + 400)) {
      const ref = doc(db, 'users', user.uid, path, operation.id)
      if (operation.type === 'set') batch.set(ref, operation.item as any, { merge: true })
      else batch.delete(ref)
    }
    await batch.commit()
  }
}

interface RootCoordinator {
  activeBindings: number
  pending: Map<string, unknown>
  timer: ReturnType<typeof setTimeout> | null
}

const rootCoordinators = new Map<string, RootCoordinator>()

function setNestedValue(target: Record<string, any>, path: string, value: unknown) {
  const parts = path.split('.')
  let cursor = target
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {}
    cursor = cursor[part]
  }
  cursor[parts[parts.length - 1]] = value
}

async function flushRootCoordinator(user: User, coordinator: RootCoordinator) {
  if (coordinator.pending.size === 0) return
  const entries = [...coordinator.pending.entries()]
  coordinator.pending.clear()
  const payload: Record<string, any> = { updatedAt: new Date().toISOString() }
  for (const [rootKey, value] of entries) {
    setNestedValue(payload, rootKey, stripUndefined(value))
    markRootFieldWrite(user.uid, rootKey, value)
  }
  try {
    await setDoc(doc(db, 'users', user.uid), stripUndefined(payload), { merge: true })
  } catch (error) {
    console.error('Falha ao sincronizar dados do perfil', error)
  }
}

function scheduleRootField(user: User, rootKey: string, value: unknown) {
  const coordinator = rootCoordinators.get(user.uid)
  if (!coordinator) return
  coordinator.pending.set(rootKey, value)
  if (coordinator.timer) clearTimeout(coordinator.timer)
  coordinator.timer = setTimeout(() => {
    coordinator.timer = null
    void flushRootCoordinator(user, coordinator)
  }, 1500)
}

/** Agrupa alterações de todos os root fields em um único setDoc. */
export function bindRootField<T>(
  user: User,
  store: { getState: () => Record<string, any>; subscribe: any },
  field: string,
  rootKey: string,
): () => void {
  let coordinator = rootCoordinators.get(user.uid)
  if (!coordinator) {
    coordinator = { activeBindings: 0, pending: new Map(), timer: null }
    rootCoordinators.set(user.uid, coordinator)
  }
  coordinator.activeBindings += 1

  let last = JSON.stringify(store.getState()[field] ?? null)
  let disposed = false
  const unsub = store.subscribe((state: Record<string, any>) => {
    const current = JSON.stringify(state[field] ?? null)
    if (current === last) return
    last = current
    if (remoteStoreUpdateDepth > 0) return
    scheduleRootField(user, rootKey, state[field])
  })

  return () => {
    if (disposed) return
    disposed = true
    unsub()
    const currentCoordinator = rootCoordinators.get(user.uid)
    if (!currentCoordinator) return
    currentCoordinator.activeBindings -= 1
    if (currentCoordinator.activeBindings > 0) return
    if (currentCoordinator.timer) clearTimeout(currentCoordinator.timer)
    currentCoordinator.timer = null
    rootCoordinators.delete(user.uid)
    void flushRootCoordinator(user, currentCoordinator)
  }
}
