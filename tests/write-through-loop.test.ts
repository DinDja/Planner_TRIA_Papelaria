import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Contadores vivem dentro do factory do vi.mock para não esbarrar no hoisting.
const state = {
  set: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn(async () => {}),
  writeBatch: vi.fn(() => ({ set: state.set, delete: state.delete, commit: state.commit })),
  doc: vi.fn((db: any, ...segs: string[]) => `doc:${segs.join('/')}`),
  setDoc: vi.fn(async () => {}),
}

vi.mock('firebase/firestore', () => ({
  doc: (...a: any[]) => (state.doc as any)(...a),
  setDoc: (...a: any[]) => (state.setDoc as any)(...a),
  writeBatch: (...a: any[]) => (state.writeBatch as any)(...a),
}))

vi.mock('@/lib/firebase', () => ({
  db: { __mockDb: true },
}))

// IMPORTS depois dos mocks.
import { create } from 'zustand'
import { bindCollectionWriteThrough } from '@/lib/db/write-through'
import {
  markDocWrite,
  isOwnDocSnapshot,
} from '@/lib/db/own-writes'

type Item = { id: string; titulo: string }

interface IListsStore {
  lists: Item[]
  setLists: (next: Item[]) => void
  setList: (next: Item) => void
}

function makeStore(initial: Item[] = []) {
  const store = create<IListsStore>((set) => ({
    lists: initial,
    setLists: (next) => set({ lists: next }),
    setList: (next) =>
      set((s) => {
        const i = s.lists.findIndex((x) => x.id === next.id)
        if (i === -1) return { lists: [...s.lists, next] }
        const copy = [...s.lists]
        copy[i] = next
        return { lists: copy }
      }),
  }))
  return store
}

const user = { uid: 'user-1' } as any

beforeEach(() => {
  state.set.mockClear()
  state.delete.mockClear()
  state.commit.mockClear()
  state.writeBatch.mockClear()
  state.doc.mockClear()
  state.setDoc.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('write-through — sem flag own-writes no callback, eco regravaria', () => {
  it('loop estrutural: setState(eco com updatedAt) dispara novo writeBatch', async () => {
    vi.useFakeTimers()
    const store = makeStore([])
    const unsub = bindCollectionWriteThrough<Item>(user as any, {
      store,
      field: 'lists',
      collectionName: 'shoppingLists',
    })

    // 1. Cria item → debounce agenda.
    store.getState().setList({ id: 'L1', titulo: 'Compras' })
    expect(state.commit).not.toHaveBeenCalled()

    // 2. Debounce dispara → 1 commit, 1 markCollectionWrite (não testamos aqui).
    vi.advanceTimersByTime(1500)
    expect(state.commit).toHaveBeenCalledTimes(1)
    state.set.mockClear()
    state.commit.mockClear()

    // 3. Simula o onSnapshot SEM filtro own-writes:
    //    o StoreSyncProvider (sem defesa) faria setState({ lists: [eco] }).
    //    O bind reage por `snapshotsEqual` — updatedAt difere → agenda.
    const eco = { id: 'L1', titulo: 'Compras', updatedAt: '2026-07-26T10:00:00.000Z' }
    store.getState().setLists([eco])
    vi.advanceTimersByTime(1500)
    // Provamos: segundo commit — o loop ORIGINAL aconteceria aqui.
    expect(state.commit).toHaveBeenCalledTimes(1)

    unsub()
  })
})

describe('write-through — com flag own-writes, commit é único (loop cortado)', () => {
  it('uma edição → só 1 commit; filtro no provider evita re-setState', async () => {
    vi.useFakeTimers()
    const store = makeStore([])
    const unsub = bindCollectionWriteThrough<Item>(user as any, {
      store,
      field: 'lists',
      collectionName: 'shoppingLists',
    })

    // 1. Cria item → markCollectionWrite marca-o com updatedAt.
    //    Note: o write-through adiciona `updatedAt` ao payload que marca
    //    — por isso o eco do snapshot (que o Firestore enriqueceria com o
    //    mesmo `updatedAt`) casa com o marcador.
    const novo = { id: 'L1', titulo: 'Compras' }
    store.getState().setList(novo)
    vi.advanceTimersByTime(1500)
    expect(state.commit).toHaveBeenCalledTimes(1)

    // 2. O Firestore ecoa o snapshot com EXATAMENTE o mesmo payload
    //    que acabamos de escrever — incluindo o `updatedAt` adicionado
    //    dentro do write-through (replicamos aqui no teste).
    const ecoPayload = { id: 'L1', titulo: 'Compras', updatedAt: (state.set.mock.calls[0][1] as any).updatedAt }
    // isOwn deve detectar eco (mesmo canonical).
    expect(isOwnDocSnapshot(user.uid, 'shoppingLists', ecoPayload)).toBe(true)

    // 3. Sendo eco, o StoreSyncProvider não chama setState — sem segundo commit.
    state.set.mockClear()
    state.commit.mockClear()
    vi.advanceTimersByTime(5000)
    expect(state.commit).not.toHaveBeenCalled()

    unsub()
  })

  it('outra aba edita → bind reage e reescreve', async () => {
    vi.useFakeTimers()
    const store = makeStore([])
    const unsub = bindCollectionWriteThrough<Item>(user as any, {
      store,
      field: 'lists',
      collectionName: 'shoppingLists',
    })

    const original = { id: 'L1', titulo: 'Compras' }
    store.getState().setList(original)
    vi.advanceTimersByTime(1500)
    expect(state.commit).toHaveBeenCalledTimes(1)
    state.set.mockClear()
    state.commit.mockClear()

    // Outra aba mexeu → não é eco.
    const editado = { id: 'L1', titulo: 'Compras da semana' }
    markDocWrite(user.uid, 'shoppingLists', 'L1', original)
    expect(isOwnDocSnapshot(user.uid, 'shoppingLists', editado)).toBe(false)

    // Provider não filtra → setState → bind reage → outro commit.
    store.getState().setLists([editado])
    vi.advanceTimersByTime(1500)
    expect(state.commit).toHaveBeenCalledTimes(1)

    unsub()
  })
})

describe('write-through — flush no unsubscribe persiste estado pendente', () => {
  it('unsub antes do debounce dispara flush final', async () => {
    vi.useFakeTimers()
    const store = makeStore([])
    const unsub = bindCollectionWriteThrough<Item>(user as any, {
      store,
      field: 'lists',
      collectionName: 'shoppingLists',
    })

    store.getState().setList({ id: 'L1', titulo: 'Pendentes' })
    unsub()
    expect(state.commit).toHaveBeenCalledTimes(1)
  })
})

describe('write-through — batch: 50 itens = 1 batch, 1 commit', () => {
  it('50 upserts criam 1 writeBatch e 1 commit', async () => {
    vi.useFakeTimers()
    const store = makeStore([])
    const unsub = bindCollectionWriteThrough<Item>(user as any, {
      store,
      field: 'lists',
      collectionName: 'shoppingLists',
    })

    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `L${i}`,
      titulo: `Lista ${i}`,
    }))
    store.getState().setLists(items)
    vi.advanceTimersByTime(1500)

    expect(state.writeBatch).toHaveBeenCalledTimes(1)
    expect(state.commit).toHaveBeenCalledTimes(1)
    expect(state.set).toHaveBeenCalledTimes(50)

    unsub()
  })
})
