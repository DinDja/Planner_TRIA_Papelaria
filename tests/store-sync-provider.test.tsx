import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import React from 'react'

// ────────────────────────────────────────────────────────────────────
// Mocks do Firebase.  Importante: o StoreSyncProvider importa muitos
// hooks de store do Zustand; muitas dessas stores têm `persist` que
// toca em `localStorage`.  Para este teste, mockeamos só o que é
// essencial e consideramos que as stores já estão carregadas em memória
// (vitest/jsdom provêm `localStorage` automaticamente).
// ────────────────────────────────────────────────────────────────────

type SnapshotCb = (snap: { exists: () => boolean; data: () => any }) => void
// O callback de onSnapshot de coleção recebe um "snap" que tem forEach
// (it: doc)=>void. Em subscribeCollection isso é desembrulhado em items[].
type CollCb = (snap: { forEach: (cb: (doc: { data: () => any; id: string }) => void) => void }) => void

interface DocHandle {
  ref: any
  cb: SnapshotCb
}
interface CollHandle {
  ref: any
  cb: CollCb
}

const callbacksDoc: DocHandle[] = []
const callbacksColl: CollHandle[] = []

function makeCollSnapshot(items: any[]) {
  return {
    forEach: (cb: (doc: { data: () => any; id: string }) => void) => {
      for (const it of items) {
        cb({
          id: it.id,
          data: () => it,
        })
      }
    },
  }
}

beforeEach(() => {
  callbacksDoc.length = 0
  callbacksColl.length = 0
  ;(globalThis as any).localStorage.clear()
})

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db: any, ...segs: string[]) => `doc:${segs.join('/')}`),
  collection: vi.fn((db: any, ...segs: string[]) => `coll:${segs.join('/')}`),
  onSnapshot: vi.fn((ref: any, cb: any, errCb?: any) => {
    if (typeof errCb === 'function') {
      // Coleção.
      const handle: CollHandle = { ref, cb }
      callbacksColl.push(handle)
      return () => {
        const i = callbacksColl.indexOf(handle)
        if (i >= 0) callbacksColl.splice(i, 1)
      }
    }
    const handle: DocHandle = { ref, cb }
    callbacksDoc.push(handle)
    return () => {
      const i = callbacksDoc.indexOf(handle)
      if (i >= 0) callbacksDoc.splice(i, 1)
    }
  }),
  setDoc: vi.fn(async () => {}),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(async () => {}),
  })),
}))

vi.mock('@/lib/firebase', () => ({
  db: { __mock: true },
  auth: { __mockAuth: true },
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' } as any }),
}))

// Mock de next/navigation: controlamos o pathname.
const pathState: { value: string } = { value: '/diario' }
vi.mock('next/navigation', () => ({
  usePathname: () => pathState.value,
}))

// IMPORTS após mocks.
import { StoreSyncProvider } from '@/components/providers/store-sync-provider'
import { useDiarioStore } from '@/lib/diario/use-diario-store'
import { useChecklistsStore } from '@/lib/store/use-checklists-store'
import { markDocWrite } from '@/lib/db/own-writes'

// Wrapper conveniente.
function mount() {
  return render(
    React.createElement(
      StoreSyncProvider,
      null as any,
      React.createElement('div', null, 'CHILD'),
    ),
  )
}

// ────────────────────────────────────────────────────────────────────
// Testes
// ────────────────────────────────────────────────────────────────────

describe('StoreSyncProvider — lazy loading por pathname', () => {
  it('em /diario abre só 1 onSnapshot de coleção (diarios) + 1 do root doc', async () => {
    pathState.value = '/diario'
    mount()

    await waitFor(() => {
      // 1 onSnapshot do doc-raiz + 1 onSnapshot da coleção "diarios".
      expect(callbacksDoc.length).toBe(1)
      expect(callbacksColl.length).toBe(1)
    })
  })

  it('em /saude abre 8 onSnapshots de coleções', async () => {
    pathState.value = '/saude'
    mount()

    await waitFor(() => {
      expect(callbacksDoc.length).toBe(1)
      // Peso, medidas, sintomas, medicações, ciclos, médicos, consultas, exames.
      expect(callbacksColl.length).toBe(8)
    })
  })

  it('em /checklists só abre 1 de coleção (checklists)', async () => {
    pathState.value = '/checklists'
    mount()
    await waitFor(() => {
      expect(callbacksColl.length).toBe(1)
    })
  })

  it('em /plans (sem coleções) abre 0 onSnapshots de coleção', async () => {
    pathState.value = '/plans'
    mount()
    await waitFor(() => {
      expect(callbacksDoc.length).toBe(1)
      expect(callbacksColl.length).toBe(0)
    })
  })

  it('em / diário → /saude, remonta os snapshots (não deixa /diario acumulando)', async () => {
    pathState.value = '/diario'
    const { rerender } = mount()
    await waitFor(() => expect(callbacksColl.length).toBe(1))

    // Simula navegação: renderiza de novo em novo pathname.
    pathState.value = '/saude'
    rerender(
      React.createElement(
        StoreSyncProvider,
        null as any,
        React.createElement('div', null, 'CHILD'),
      ),
    )

    // Após re-render, o effect [user, plan] roda de novo: 8 coleções
    // (o listener de diarios fechou). Estado final: máximo de 8.
    await waitFor(() => {
      expect(callbacksColl.length).toBe(8)
    })
  })
})

describe('StoreSyncProvider — flag own-writes corta o setState de ecos', () => {
  it('se um checklist que acabamos de escrever ecoa no onSnapshot, não aplica setState', async () => {
    pathState.value = '/checklists'
    mount()

    await waitFor(() => expect(callbacksColl.length).toBe(1))

    const collCb = callbacksColl[0].cb
    const store = useChecklistsStore as any

    // População inicial via snapshot limpo.
    const remote = [{ id: 'c1', titulo: 'Compras', items: [] }]
    collCb(makeCollSnapshot(remote))
    const estadoAposPrimeiroSnap = store.getState().checklists
    expect(estadoAposPrimeiroSnap).toEqual(remote)

    // Simula o write-through: marcou o item e o Firestore ecoa exatamente
    // o mesmo payload (incluindo o `updatedAt` que o write-through injetou).
    const updatedAt = '2026-07-26T10:00:00.000Z'
    const markedItem = { id: 'c1', titulo: 'Compras', items: [], updatedAt }
    markDocWrite('test-uid', 'checklists', 'c1', markedItem)

    // Eco: o onSnapshot chega com o mesmo conteúdo que escrevemos.
    const eco = [{ id: 'c1', titulo: 'Compras', items: [], updatedAt }]
    collCb(makeCollSnapshot(eco))

    // O filtro own-writes remove este item do merge (é eco).
    // Sem items novos para aplicar e sem remoções, o merge == estado local
    // → guard `same` aborta o setState.
    const estadoFinal = store.getState().checklists
    expect(estadoFinal).toEqual(remote)
    expect(estadoFinal[0].updatedAt).toBeUndefined()
  })

  it('edição feita por outra aba (não-eco) ainda atualiza a store', async () => {
    pathState.value = '/diario'
    mount()
    await waitFor(() => expect(callbacksColl.length).toBe(1))

    const collCb = callbacksColl[0].cb
    const store = useDiarioStore as any

    collCb(makeCollSnapshot([{ id: 'd1', texto: 'olá' }]))
    expect(store.getState().registros).toEqual([{ id: 'd1', texto: 'olá' }])

    // Outra aba edita — não há marcador para `d1` no nosso registro own-writes,
    // então isOwnDocSnapshot retorna false e o snapshot é aplicado.
    collCb(makeCollSnapshot([{ id: 'd1', texto: 'olá editado por outra aba' }]))
    expect(store.getState().registros).toEqual([{ id: 'd1', texto: 'olá editado por outra aba' }])
  })
})
