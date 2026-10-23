// Papéis legíveis usados pela assinatura. A permissão administrativa vem de
// um documento em `admin/{uid}` no Firestore, nunca de e-mail ou cache local.
export type Role = 'admin' | 'subscriber'

export const ADMIN_COLLECTION = 'admin'
