'use client'

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'

const nowISO = () => new Date().toISOString()

type WithId = { id: string }

export function userCol<T extends WithId>(user: User, path: string) {
  return collection(db, 'users', user.uid, path) as unknown as ReturnType<typeof collection>
}

export function userDoc(user: User, path: string, id: string) {
  return doc(db, 'users', user.uid, path, id)
}

export function userRootDoc(user: User) {
  return doc(db, 'users', user.uid)
}

export async function ensureUserDoc(user: User, partial: Record<string, unknown>) {
  await setDoc(userRootDoc(user), { ...partial, updatedAt: nowISO() }, { merge: true })
}

export async function getUserDoc(user: User) {
  const snap = await getDocs(query(collection(db, 'users', user.uid, '__self__')))
  return snap
}

/**
 * Subscribes to a subcollection. Returns the unsubscribe and calls callback
 * with the full array each time the snapshot updates.
 */
export function subscribeCollection<T extends WithId>(
  user: User,
  path: string,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const ref = collection(db, 'users', user.uid, path)
  return onSnapshot(
    ref,
    (snap) => {
      const items: T[] = []
      snap.forEach((d) => {
        const data = d.data() as T
        if (!data.id) (data as any).id = d.id
        items.push(data)
      })
      onData(items)
    },
    (err) => onError?.(err as Error),
  )
}

export async function setItem<T extends WithId>(user: User, path: string, item: T) {
  const ref = doc(db, 'users', user.uid, path, item.id)
  await setDoc(ref, { ...item, updatedAt: nowISO() }, { merge: true })
  return ref
}

export async function setItemNoMerge<T extends WithId>(user: User, path: string, item: T) {
  const ref = doc(db, 'users', user.uid, path, item.id)
  await setDoc(ref, { ...item, updatedAt: nowISO() })
  return ref
}

export async function updateItem(
  user: User,
  path: string,
  id: string,
  patch: Record<string, unknown>,
) {
  const ref = doc(db, 'users', user.uid, path, id)
  await updateDoc(ref, { ...patch, updatedAt: nowISO() })
  return ref
}

export async function deleteItem(user: User, path: string, id: string) {
  const ref = doc(db, 'users', user.uid, path, id)
  await deleteDoc(ref)
  return ref
}

export async function writeBatchItems<T extends WithId>(
  user: User,
  path: string,
  items: T[],
  merge = true,
) {
  const batch = writeBatch(db)
  for (const item of items) {
    const ref = doc(db, 'users', user.uid, path, item.id)
    batch.set(ref, { ...item, updatedAt: nowISO() }, { merge })
  }
  await batch.commit()
}

export { Timestamp }
