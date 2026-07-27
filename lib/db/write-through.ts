'use client'

import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'
import { markCollectionWrite, markRootFieldWrite } from './own-writes'

type WithId = { id: string }

/**
 * Firestore rejeita campos com valor `undefined` (lança
 * `Unsupported field value: undefined`). As stores do Zustand,
 * porém, guardam livremente `undefined` em campos opcionais
 * (`titulo?: string`, `notas?: string`, etc.).
 *
 * Esta função remove recursivamente toda chave cujo valor seja
 * `undefined` — antes de o documento ser escrito. `null` é
 * preservado, porque Firestore aceita `null` e o usamos para
 * diferenciar "vazio" de "ausente".
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined) continue
    out[k] = typeof v === 'object' && v !== null ? stripUndefined(v) : v
  }
  return out as T
}

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
 *
 * Debounce de 1500ms: o usuário editando (riscando item, digitando, mudando
 * uma tag) dispara dezenas de mudanças por segundo. Cada uma, sem debounce,
 * acionaria um writeBatch da coleção inteira — exaure a quota Firestore
 * (50K docs/dia no spark plano). Aguardamos silêncio curto antes de escrever.
 */
export function bindCollectionWriteThrough<T extends WithId>(
  user: User,
  binding: CollectionBinding<T>,
): () => void {
  const { store, field, collectionName } = binding
  let lastSnapshot: T[] = [...(store.getState()[field] ?? [])]
  // Guarda IDs já enviados ao Firestore, para diff de remoções.
  // Sem isto, deletar localmente não apaga o documento remoto —
  // ele volta via onSnapshot e a store é sobrescrita, ressuscitando.
  let lastWrittenIds: Set<string> = new Set(lastSnapshot.map((x) => x.id))
  let unsubscribed = false
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSnapshot: T[] | null = null
  let pendingIds: Set<string> | null = null

  const schedule = (snapshot: T[]) => {
    pendingSnapshot = snapshot
    pendingIds = new Set(snapshot.map((x) => x.id))
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      if (unsubscribed) return
      const toWrite = pendingSnapshot
      const newIds = pendingIds
      pendingSnapshot = null
      pendingIds = null
      if (!toWrite || !newIds) return
      // IDs que saíram: presentes no último write, ausentes agora.
      const removed: string[] = [...lastWrittenIds].filter((id) => !newIds.has(id))
      // Prepara payload canônico UMA vez (sem `undefined` + com updatedAt)
      // e usa este mesmo payload tanto para marcar own-writes quanto
      // para comitar no Firestore. Sem isto, o canonical marcado divergiria
      // do canonical ecado pelo Firestore (timestamps/arredondamentos
      // diferentes) e a flag own-writes nunca cortaria o loop.
      const markedAt = new Date().toISOString()
      const payload = toWrite.map((it: any) =>
        stripUndefined({ ...it, updatedAt: markedAt }),
      )
      markCollectionWrite(user.uid, collectionName, payload as { id: string }[])
      void writeFullCollection(user, collectionName, payload as T[], removed)
      lastWrittenIds = newIds
    }, 1500)
  }

  const unsub = store.subscribe((state: Record<string, any>) => {
    const current: T[] = state[field] ?? []
    if (snapshotsEqual(lastSnapshot, current)) return
    lastSnapshot = current
    schedule(current)
  })

  return () => {
    unsubscribed = true
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
    // Flush final pending write so user doesn't lose last edit on logout.
    if (pendingSnapshot && pendingIds) {
      const removed = [...lastWrittenIds].filter((id) => !pendingIds!.has(id))
      const flushAt = new Date().toISOString()
      const payload = pendingSnapshot.map((it: any) =>
        stripUndefined({ ...it, updatedAt: flushAt }),
      )
      markCollectionWrite(user.uid, collectionName, payload as { id: string }[])
      void writeFullCollection(user, collectionName, payload as T[], removed)
      lastWrittenIds = pendingIds
    }
    pendingSnapshot = null
    pendingIds = null
    unsub()
  }
}

async function writeFullCollection<T extends WithId>(
  user: User,
  path: string,
  items: T[],
  removedIds: string[] = [],
) {
  const batches: ReturnType<typeof writeBatch>[] = []
  let batch = writeBatch(db)
  let count = 0

  // ── Upserts: items já vêm limpos (stripUndefined + updatedAt) do caller.
  //    Usá-los diretamente garante que o eco do snapshot case com o marcador.
  for (const item of items) {
    const ref = doc(db, 'users', user.uid, path, item.id)
    batch.set(ref, item as any, { merge: true })
    count++
    if (count >= 400) {
      batches.push(batch)
      batch = writeBatch(db)
      count = 0
    }
  }

  // ── Deletes: IDs que saíram do estado (usuário apagou um registro)
  //    Sem isto, o documento fica órfão no Firestore, e o onSnapshot
  //    o manda de volta à store — ressuscitando o registro apagado.
  for (const id of removedIds) {
    const ref = doc(db, 'users', user.uid, path, id)
    batch.delete(ref)
    count++
    if (count >= 400) {
      batches.push(batch)
      batch = writeBatch(db)
      count = 0
    }
  }

  // Se batch vazio (nada a fazer), não empurra — evita commit de batch sem ops.
  if (count > 0) batches.push(batch)
  for (const b of batches) await b.commit()
}

/**
 * Bind a root-doc field (array embedded on the user root document).
 * Write-through on store field changes. Same 1500ms debounce — root fields
 * (theme, name, avatar, height, weight, etc.) também exaurem quota se
 * atualizados em rajada (slider de peso, troca de tema contínua).
 */
export function bindRootField<T>(
  user: User,
  store: { getState: () => Record<string, any>; subscribe: any },
  field: string,
  rootKey: string,
): () => void {
  let last = JSON.stringify(store.getState()[field] ?? null)
  let unsubscribed = false
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingValue: T | null = null

  const schedule = (value: T) => {
    pendingValue = value
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      if (unsubscribed) return
      const v = pendingValue
      pendingValue = null
      if (v === null) return
      const rootRef = doc(db, 'users', user.uid)
      const cleaned = stripUndefined({ [rootKey]: v, updatedAt: new Date().toISOString() })
      // Marca como escrita própria — evita que o onSnapshot do root doc
      // ecoe de volta e dispare novo setState neste bind.
      markRootFieldWrite(user.uid, rootKey, v)
      void setDoc(rootRef, cleaned, { merge: true })
    }, 1500)
  }

  const unsub = store.subscribe((state: Record<string, any>) => {
    const current = JSON.stringify(state[field] ?? null)
    if (current === last) return
    last = current
    schedule(state[field])
  })

  return () => {
    unsubscribed = true
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
    if (pendingValue !== null) {
      const rootRef = doc(db, 'users', user.uid)
      const cleaned = stripUndefined({ [rootKey]: pendingValue, updatedAt: new Date().toISOString() })
      markRootFieldWrite(user.uid, rootKey, pendingValue)
      void setDoc(rootRef, cleaned, { merge: true })
    }
    pendingValue = null
    unsub()
  }
}
