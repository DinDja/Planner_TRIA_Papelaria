import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  markDocWrite,
  markCollectionWrite,
  markRootFieldWrite,
  isOwnDocSnapshot,
  isOwnRootFieldSnapshot,
} from '@/lib/db/own-writes'

const UID = 'user-123'
const COLL = 'checklists'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('own-writes — marquei escrita própria, o snapshot eco deve ser detectado', () => {
  it('marca 1 doc e detecta o eco dele por isOwnDocSnapshot', () => {
    const item = { id: 'c1', titulo: 'Compras', items: [] }
    markDocWrite(UID, COLL, 'c1', item)
    // Mesma forma serializada vinda do Firestore → deve reconhecer.
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(true)
  })

  it('snapshot com canonical diferente NÃO é detectado como eco', () => {
    const original = { id: 'c1', titulo: 'Compras', items: [] }
    markDocWrite(UID, COLL, 'c1', original)
    // Outra aba mexeu no mesmo doc — chega com conteúdo diferente.
    const externo = { id: 'c1', titulo: 'Compras da semana', items: [] }
    expect(isOwnDocSnapshot(UID, COLL, externo)).toBe(false)
  })

  it('snapshot de doc que nunca marcamos → false', () => {
    const item = { id: 'cX', titulo: 'Nova' }
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(false)
  })

  it('campos undefined no item não quebram o canonical (stripUndefined)', () => {
    const item = { id: 'c1', titulo: 'X', notas: undefined }
    markDocWrite(UID, COLL, 'c1', item)
    // Snapshot volta sem o `notas` (Firestore nunca envia undefined):
    const snapshot = { id: 'c1', titulo: 'X' }
    expect(isOwnDocSnapshot(UID, COLL, snapshot)).toBe(true)
  })
})

describe('own-writes — TTL: ecos antigos não são mais nossos', () => {
  it('depois do TTL_MS, isOwnDocSnapshot retorna false (não mascara edições futuras)', () => {
    const item = { id: 'c1', titulo: 'X' }
    markDocWrite(UID, COLL, 'c1', item)
    // Ainda dentro da janela.
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(true)
    // Escreve de novo (re-marca).
    markDocWrite(UID, COLL, 'c1', item)
    // Avança 5s (acima do TTL_MS = 4000).
    vi.advanceTimersByTime(5000)
    // O mesmo conteúdo chegaria agora — deve ser tratado como externo.
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(false)
  })

  it('markRootFieldWrite → isOwnRootFieldSnapshot respeita o mesmo TTL', () => {
    const v = 'dark'
    markRootFieldWrite(UID, 'theme', v)
    expect(isOwnRootFieldSnapshot(UID, 'theme', v)).toBe(true)
    markRootFieldWrite(UID, 'theme', v)
    vi.advanceTimersByTime(5000)
    expect(isOwnRootFieldSnapshot(UID, 'theme', v)).toBe(false)
  })
})

describe('own-writes — consumo: ao detectar eco, marcador é consumido', () => {
  it('chamar isOwnDocSnapshot duas vezes: segunda retorna false (já consumiu)', () => {
    const item = { id: 'c1', titulo: 'X' }
    markDocWrite(UID, COLL, 'c1', item)
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(true)
    // Segunda chegada do mesmo eco — não deve mais casar (consumido).
    expect(isOwnDocSnapshot(UID, COLL, item)).toBe(false)
  })
})

describe('own-writes — markCollectionWrite: marca vários docs de uma vez', () => {
  it('marcar lista reflete como eco para cada item', () => {
    const items = [
      { id: 'a', titulo: 'A' },
      { id: 'b', titulo: 'B' },
      { id: 'c', titulo: 'C' },
    ]
    markCollectionWrite(UID, COLL, items as any)
    for (const it of items) {
      expect(isOwnDocSnapshot(UID, COLL, it)).toBe(true)
    }
  })

  it('markRootFieldWrite: detecta eco no root doc (theme, name)', () => {
    markRootFieldWrite(UID, 'theme', 'dark')
    expect(isOwnRootFieldSnapshot(UID, 'theme', 'dark')).toBe(true)
    // Valor diferente → não eco.
    expect(isOwnRootFieldSnapshot(UID, 'theme', 'light')).toBe(false)
  })

  it('rootKey com ponto (subscription.plan) também funciona', () => {
    markRootFieldWrite(UID, 'subscription.plan', 'premium')
    expect(isOwnRootFieldSnapshot(UID, 'subscription.plan', 'premium')).toBe(true)
  })
})
