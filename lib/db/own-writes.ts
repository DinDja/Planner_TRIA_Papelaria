'use client'

/**
 * Registro central de "escritas próprias" — documentos cuja próxima
 * emissão de snapshot foi causada por nós mesmos (write-through ou
 * bindRootField), não por outra aba/dispositivo.
 *
 * O problema que isto resolve:
 *  - Usuário edita um item → write-through dispara writeBatch no Firestore.
 *  - Firestore confirma e reenvia o snapshot para TODOS os onSnapshot ativos.
 *  - Cada callback do onSnapshot roda setState na store correspondente.
 *  - Esse setState dispara o write-through de novo (via subscribe) → loop.
 *
 * A solução:
 *  - Antes de commitar cada documento no Firestore, marcamos seu path aqui,
 *    anotando o canonical (JSON do valor limpo) que estamos escrevendo.
 *  - Quando o onSnapshot chega, o callback consulta este registro e,
 *    se o item recebido for "igual ao que acabamos de escrever", remove-o
 *    do set de items a aplicar — cortando o loop na borda do snapshot,
 *    sem perder atualizações genuínas (canonical diferente) ou edições
 *    de outra aba que cheguem após a janela de expiração.
 *
 * O registro expira sozinho (TTL curto) para não mascarar edições
 * futuras legítimas vindas de outros clientes sobre o mesmo doc.
 */

const TTL_MS = 4000

interface Marker {
  canonical: string
  at: number
}

// Chave: `users/{uid}/{collection}/{docId}`  ->  Marker
const byDoc = new Map<string, Marker>()

function docKey(uid: string, collection: string, docId: string) {
  return `users/${uid}/${collection}/${docId}`
}

// Chave: `users/{uid}/{rootKey}`  ->  Marker   (root doc usa o rootKey como "id")
const byRoot = new Map<string, Marker>()

function rootFieldKey(uid: string, rootKey: string) {
  return `users/${uid}#${rootKey}`
}

function canonicalOf(value: unknown): string {
  try {
    return JSON.stringify(stripUndefinedSafe(value))
  } catch {
    return ''
  }
}

// ── Marcações (chamadas ANTES do commit do Firestore) ─────────────────

export function markDocWrite(
  uid: string,
  collection: string,
  docId: string,
  value: unknown,
) {
  byDoc.set(docKey(uid, collection, docId), {
    canonical: canonicalOf(value),
    at: Date.now(),
  })
}

export function markCollectionWrite(
  uid: string,
  collection: string,
  items: { id: string }[],
) {
  for (const it of items) {
    byDoc.set(docKey(uid, collection, it.id), {
      canonical: canonicalOf(it),
      at: Date.now(),
    })
  }
}

export function markRootFieldWrite(uid: string, rootKey: string, value: unknown) {
  byRoot.set(rootFieldKey(uid, rootKey), {
    canonical: canonicalOf(value),
    at: Date.now(),
  })
}

// ── Consultas (chamadas pelo onSnapshot para detectar eco) ───────────

/**
 * Dado um item de snapshot, retorna `true` se ele for eco de uma
 * escrita nossa recente (mesmo canonical, dentro do TTL).
 *
 * O callback do onSnapshot usa isto para **pular** o setState daquele
 * item específico — mantém o estado local intacto e corta o loop.
 */
export function isOwnDocSnapshot(
  uid: string,
  collection: string,
  item: { id: string },
): boolean {
  const m = byDoc.get(docKey(uid, collection, item.id))
  if (!m) return false
  if (Date.now() - m.at > TTL_MS) {
    byDoc.delete(docKey(uid, collection, item.id))
    return false
  }
  if (m.canonical === canonicalOf(item)) {
    // Eco confirmado — consome o marcador para não mascarar edições futuras.
    byDoc.delete(docKey(uid, collection, item.id))
    return true
  }
  return false
}

/**
 * Versão para o root doc (users/{uid}) — verifica se um campo específico
 * que chegou no snapshot do doc-raiz foi causado por nossa escrita.
 */
export function isOwnRootFieldSnapshot(
  uid: string,
  rootKey: string,
  value: unknown,
): boolean {
  const k = rootFieldKey(uid, rootKey)
  const m = byRoot.get(k)
  if (!m) return false
  if (Date.now() - m.at > TTL_MS) {
    byRoot.delete(k)
    return false
  }
  if (m.canonical === canonicalOf(value)) {
    byRoot.delete(k)
    return true
  }
  return false
}

// ── Utilitários internos ─────────────────────────────────────────────

function stripUndefinedSafe(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined) continue
    out[k] = typeof v === 'object' && v !== null ? stripUndefinedSafe(v) : v
  }
  return out
}
