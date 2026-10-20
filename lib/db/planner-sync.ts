'use client'

import { collection, doc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { Planner, PlannerPage } from '@/lib/types'
import { useAppStore } from '@/lib/store/use-app-store'
import { db } from '@/lib/firebase'
import { isRemoteStoreUpdateActive, stripUndefined, withRemoteStoreUpdate } from './write-through'

type PlannerStore = typeof useAppStore
type PlannerRecord = Omit<Planner, 'pages'> & { pageCount?: number }
type RemotePlanner = { metadata: PlannerRecord; legacyPages: PlannerPage[] }
type WriteOperation =
  | { kind: 'set'; ref: ReturnType<typeof doc>; data: Record<string, unknown> }
  | { kind: 'delete'; ref: ReturnType<typeof doc> }

function canonical(value: unknown) {
  return JSON.stringify(stripUndefined(value))
}

function metadataFor(
  planner: Planner,
  order: number,
  pageCount = planner.pageCount ?? planner.pages.length,
): PlannerRecord {
  const { pages, ...metadata } = planner
  return { ...metadata, order, pageCount }
}

function pageForStorage(page: PlannerPage, order: number): PlannerPage {
  return { ...page, pageOrder: order }
}

function plannerChanged(a: Planner | undefined, b: Planner | undefined) {
  return canonical(a) !== canonical(b)
}

function timestamp(value: string | undefined) {
  const parsed = value ? Date.parse(value) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function sortPlanners(planners: Planner[]) {
  return [...planners].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
    return orderA - orderB || a.createdAt.localeCompare(b.createdAt)
  })
}

function sortPages(pages: PlannerPage[]) {
  return [...pages].sort((a, b) => {
    const orderA = typeof a.pageOrder === 'number' ? a.pageOrder : Number.MAX_SAFE_INTEGER
    const orderB = typeof b.pageOrder === 'number' ? b.pageOrder : Number.MAX_SAFE_INTEGER
    return orderA - orderB || a.id.localeCompare(b.id)
  })
}

async function writePlannerDiff(
  user: User,
  before: Planner[],
  after: Planner[],
  forceWriteIds: Set<string> = new Set(),
) {
  const previous = new Map(before.map((planner, index) => [planner.id, { planner, index }]))
  const current = new Map(after.map((planner, index) => [planner.id, { planner, index }]))
  const operations: WriteOperation[] = []

  for (const [id, { planner, index }] of current) {
    const old = previous.get(id)
    const force = forceWriteIds.has(id)
    const parentRef = doc(db, 'users', user.uid, 'planners', id)

    const previousPages = new Map((old?.planner.pages ?? []).map((page, pageIndex) => [
      page.id,
      pageForStorage(page, pageIndex),
    ]))
    const currentPages = new Map(planner.pages.map((page, pageIndex) => [
      page.id,
      pageForStorage(page, pageIndex),
    ]))
    const pagesChanged =
      previousPages.size !== currentPages.size ||
      [...currentPages].some(([pageId, page]) => canonical(previousPages.get(pageId)) !== canonical(page))
    const pageCount = pagesChanged
      ? planner.pages.length
      : planner.pageCount ?? planner.pages.length

    if (
      force ||
      !old ||
      canonical(metadataFor(old.planner, old.index)) !== canonical(metadataFor(planner, index, pageCount))
    ) {
      operations.push({
        kind: 'set',
        ref: parentRef,
        data: metadataFor(planner, index, pageCount) as unknown as Record<string, unknown>,
      })
    }

    for (const [pageId, page] of currentPages) {
      if (force || canonical(previousPages.get(pageId)) !== canonical(page)) {
        operations.push({
          kind: 'set',
          ref: doc(db, 'users', user.uid, 'planners', id, 'pages', pageId),
          data: page as unknown as Record<string, unknown>,
        })
      }
    }
    for (const pageId of previousPages.keys()) {
      if (!currentPages.has(pageId)) {
        operations.push({
          kind: 'delete',
          ref: doc(db, 'users', user.uid, 'planners', id, 'pages', pageId),
        })
      }
    }
  }

  for (const [id, { planner }] of previous) {
    if (current.has(id)) continue
    const remotePages = await getDocs(collection(db, 'users', user.uid, 'planners', id, 'pages'))
    const pageIds = new Set([...planner.pages.map((page) => page.id), ...remotePages.docs.map((page) => page.id)])
    for (const pageId of pageIds) {
      operations.push({
        kind: 'delete',
        ref: doc(db, 'users', user.uid, 'planners', id, 'pages', pageId),
      })
    }
    operations.push({ kind: 'delete', ref: doc(db, 'users', user.uid, 'planners', id) })
  }

  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = writeBatch(db)
    for (const operation of operations.slice(offset, offset + 400)) {
      if (operation.kind === 'set') batch.set(operation.ref, stripUndefined(operation.data) as any)
      else batch.delete(operation.ref)
    }
    await batch.commit()
  }
}

/** Bidirectional sync for planner metadata and its pages subcollection. */
export function bindPlannerFirestoreSync(
  user: User,
  store: PlannerStore,
  readRemote: boolean,
  activePagePlannerId?: string,
): () => void {
  let observed = [...store.getState().planners]
  let persisted = [...observed]
  let pendingSnapshot: Planner[] | null = null
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let commitChain: Promise<void> = Promise.resolve()
  let disposed = false
  const dirtyLocalIds = new Set<string>()
  const forceWriteIds = new Set<string>()

  let hasServerSnapshot = !readRemote
  let parentSnapshotReady = !readRemote
  let initialSyncComplete = !readRemote
  const remoteRecords = new Map<string, RemotePlanner>()
  const remotePages = new Map<string, PlannerPage[]>()
  const pageSnapshotReady = new Set<string>()
  const pageUnsubs = new Map<string, () => void>()
  const previouslyRemoteIds = new Set<string>()
  const remotelyDeletedIds = new Set<string>()

  const queueSnapshot = (snapshot: Planner[], forceIds: Iterable<string> = []) => {
    pendingSnapshot = [...snapshot]
    for (const id of forceIds) forceWriteIds.add(id)
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      if (disposed || !pendingSnapshot) return
      const target = pendingSnapshot
      pendingSnapshot = null
      if (readRemote && !initialSyncComplete) {
        pendingSnapshot = target
        return
      }
      const forced = new Set(forceWriteIds)
      forceWriteIds.clear()
      commitChain = commitChain
        .then(async () => {
          await writePlannerDiff(user, persisted, target, forced)
          persisted = [...target]
          const current = store.getState().planners
          for (const id of dirtyLocalIds) {
            const targetPlanner = target.find((planner) => planner.id === id)
            const currentPlanner = current.find((planner) => planner.id === id)
            if (!plannerChanged(targetPlanner, currentPlanner)) dirtyLocalIds.delete(id)
          }
        })
        .catch((error) => {
          console.error('Falha ao sincronizar cadernos e páginas', error)
          for (const id of forced) forceWriteIds.add(id)
        })
    }, 900)
  }

  const remoteSnapshot = () => sortPlanners([...remoteRecords.values()].map((record) => {
    const childPages = remotePages.get(record.metadata.id) ?? []
    const pages = childPages.length > 0
      ? childPages
      : record.metadata.pageCount === 0
        ? []
        : record.legacyPages.length > 0
          ? record.legacyPages
          : childPages
    return { ...record.metadata, pages } as Planner
  }))

  const reconcile = () => {
    if (!readRemote || !parentSnapshotReady) return
    if (activePagePlannerId && remoteRecords.has(activePagePlannerId) && !pageSnapshotReady.has(activePagePlannerId)) {
      return
    }

    const local = store.getState().planners
    const localMap = new Map(local.map((planner) => [planner.id, planner]))
    const remote = remoteSnapshot().map((planner) => {
      const record = remoteRecords.get(planner.id)
      const pageDataLoaded = planner.id === activePagePlannerId && pageSnapshotReady.has(planner.id)
      if (!pageDataLoaded && record?.legacyPages.length === 0) {
        const cached = localMap.get(planner.id)
        if (cached) return { ...planner, pages: cached.pages }
      }
      return planner
    })
    const remoteMap = new Map(remote.map((planner) => [planner.id, planner]))
    const forceIds = new Set<string>()

    for (const [id, record] of remoteRecords) {
      const pageDataLoaded = id === activePagePlannerId && pageSnapshotReady.has(id)
      if (record.legacyPages.length > 0 || (pageDataLoaded && record.metadata.pageCount === undefined)) {
        forceIds.add(id)
      }
    }

    const merged: Planner[] = []
    for (const remotePlanner of remote) {
      const localPlanner = localMap.get(remotePlanner.id)
      if (dirtyLocalIds.has(remotePlanner.id) && localPlanner) {
        merged.push(localPlanner)
      } else if (dirtyLocalIds.has(remotePlanner.id) && !localPlanner) {
        // A local delete that has not committed yet wins over this snapshot.
        forceIds.add(remotePlanner.id)
      } else if (
        localPlanner &&
        localPlanner.pages.length > 0 &&
        remotePlanner.pages.length === 0 &&
        remotePlanner.pageCount !== 0 &&
        remotePlanner.id === activePagePlannerId &&
        pageSnapshotReady.has(remotePlanner.id)
      ) {
        merged.push(localPlanner)
        forceIds.add(remotePlanner.id)
      } else if (localPlanner && timestamp(localPlanner.updatedAt) > timestamp(remotePlanner.updatedAt)) {
        merged.push(localPlanner)
        forceIds.add(remotePlanner.id)
      } else {
        merged.push(remotePlanner)
      }
      remotelyDeletedIds.delete(remotePlanner.id)
    }

    for (const localPlanner of local) {
      if (remoteMap.has(localPlanner.id)) continue
      if (remotelyDeletedIds.has(localPlanner.id) && !dirtyLocalIds.has(localPlanner.id)) continue
      merged.push(localPlanner)
    }

    const next = sortPlanners(merged)
    persisted = [...remote]
    initialSyncComplete = true

    if (canonical(next) !== canonical(local)) {
      withRemoteStoreUpdate(() => store.setState({ planners: next }))
      observed = [...next]
    }

    remotelyDeletedIds.clear()
    if (canonical(next) !== canonical(remote) || forceIds.size > 0) {
      queueSnapshot(next, forceIds)
    }
  }

  const unsubscribeStore = store.subscribe((state) => {
    const current = [...state.planners]
    if (isRemoteStoreUpdateActive()) {
      observed = current
      return
    }

    const oldMap = new Map(observed.map((planner) => [planner.id, planner]))
    const currentMap = new Map(current.map((planner) => [planner.id, planner]))
    let plannersChanged = false
    for (const [id, planner] of oldMap) {
      if (plannerChanged(planner, currentMap.get(id))) {
        dirtyLocalIds.add(id)
        plannersChanged = true
      }
    }
    for (const [id, planner] of currentMap) {
      if (plannerChanged(oldMap.get(id), planner)) {
        dirtyLocalIds.add(id)
        plannersChanged = true
      }
    }
    observed = current
    if (plannersChanged) queueSnapshot(current)
  })

  let unsubscribeParents: (() => void) | undefined
  if (readRemote) {
    unsubscribeParents = onSnapshot(
      collection(db, 'users', user.uid, 'planners'),
      { includeMetadataChanges: true },
      (snapshot) => {
        // A cache miss is not proof that Firestore has no planners. Wait for
        // the server snapshot before reconciling, or local cache data could
        // overwrite a remote planner while the initial request is in flight.
        if (snapshot.metadata.fromCache && !hasServerSnapshot) return
        hasServerSnapshot = true

        const nextIds = new Set<string>()
        for (const item of snapshot.docs) {
          const raw = item.data() as Record<string, unknown>
          const legacyPages = Array.isArray(raw.pages) ? raw.pages as PlannerPage[] : []
          const fields = { ...raw }
          delete fields.pages
          const metadata = {
            ...fields,
            id: typeof raw.id === 'string' ? raw.id : item.id,
          } as unknown as PlannerRecord
          nextIds.add(metadata.id)
          remoteRecords.set(metadata.id, { metadata, legacyPages })
          remotelyDeletedIds.delete(metadata.id)

          if (metadata.id === activePagePlannerId && !pageUnsubs.has(metadata.id)) {
            const pagesRef = collection(db, 'users', user.uid, 'planners', metadata.id, 'pages')
            const stop = onSnapshot(
              pagesRef,
              (pageSnapshot) => {
                const pages = pageSnapshot.docs.map((pageDoc) => {
                  const data = pageDoc.data() as PlannerPage
                  return { ...data, id: data.id ?? pageDoc.id }
                })
                remotePages.set(metadata.id, sortPages(pages))
                pageSnapshotReady.add(metadata.id)
                reconcile()
              },
              (error) => {
                console.error(`Falha ao carregar páginas do caderno ${metadata.id}`, error)
                remotePages.set(metadata.id, [])
                pageSnapshotReady.add(metadata.id)
                reconcile()
              },
            )
            pageUnsubs.set(metadata.id, stop)
          }
        }

        for (const id of previouslyRemoteIds) {
          if (nextIds.has(id)) continue
          if (dirtyLocalIds.has(id)) continue
          remotelyDeletedIds.add(id)
          pageUnsubs.get(id)?.()
          pageUnsubs.delete(id)
          remoteRecords.delete(id)
          remotePages.delete(id)
          pageSnapshotReady.delete(id)
        }
        previouslyRemoteIds.clear()
        for (const id of nextIds) previouslyRemoteIds.add(id)
        parentSnapshotReady = true
        reconcile()
      },
      (error) => {
        console.error('Falha ao carregar cadernos do Firestore', error)
        if (!initialSyncComplete) {
          initialSyncComplete = true
          if (pendingSnapshot) queueSnapshot(pendingSnapshot)
        }
      },
    )
  }

  return () => {
    disposed = true
    unsubscribeStore()
    unsubscribeParents?.()
    for (const stop of pageUnsubs.values()) stop()
    pageUnsubs.clear()
    if (pendingTimer) clearTimeout(pendingTimer)
    if (pendingSnapshot) {
      const target = pendingSnapshot
      pendingSnapshot = null
      commitChain = commitChain.then(() => writePlannerDiff(user, persisted, target, forceWriteIds))
    }
  }
}
