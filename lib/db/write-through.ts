'use client'

import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'

type WithId = { id: string }

interface CollectionBinding<T extends WithId> {
  store: { getState: () => Record<string, any>; subscribe: any }
  field: string
  collectionName: string
}

function snapshotsEqual<T extends WithId>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  const bmap = new Map(b.map((x) => [x.id, x]))
  for (const item of a) {
    const other = bmap.get(item.id)
    if (!other) return false
    if (JSON.stringify(item) !== JSON.stringify(other)) return false
  }
  return true
}

/**
 * Write-through: subscribes to a store field (array of {id}) and, when it
 * changes due to a local action, batches a full collection rewrite to Firestore.
 * Returns an unsubscribe.
 */
export function bindCollectionWriteThrough<T extends WithId>(
  user: User,
  binding: CollectionBinding<T>,
): () => void {
  const { store, field, collectionName } = binding
  let lastSnapshot: T[] = [...(store.getState()[field] ?? [])]
  let unsubscribed = false

  const unsub = store.subscribe((state: Record<string, any>) => {
    const current: T[] = state[field] ?? []
    if (snapshotsEqual(lastSnapshot, current)) return
    lastSnapshot = current
    void writeFullCollection(user, collectionName, current)
  })

  return () => {
    unsubscribed = true
    unsub()
  }
}

async function writeFullCollection<T extends WithId>(
  user: User,
  path: string,
  items: T[],
) {
  const batches: ReturnType<typeof writeBatch>[] = []
  let batch = writeBatch(db)
  let count = 0
  for (const item of items) {
    const ref = doc(db, 'users', user.uid, path, item.id)
    batch.set(ref, { ...item, updatedAt: new Date().toISOString() }, { merge: true })
    count++
    if (count >= 400) {
      batches.push(batch)
      batch = writeBatch(db)
      count = 0
    }
  }
  batches.push(batch)
  for (const b of batches) await b.commit()
}

/**
 * Bind a root-doc field (array embedded on the user root document).
 * Write-through on store field changes.
 */
export function bindRootField<T>(
  user: User,
  store: { getState: () => Record<string, any>; subscribe: any },
  field: string,
  rootKey: string,
): () => void {
  let last = JSON.stringify(store.getState()[field] ?? null)
  const unsub = store.subscribe((state: Record<string, any>) => {
    const current = JSON.stringify(state[field] ?? null)
    if (current === last) return
    last = current
    const rootRef = doc(db, 'users', user.uid)
    void setDoc(rootRef, { [rootKey]: state[field], updatedAt: new Date().toISOString() }, { merge: true })
  })
  return () => unsub()
}
