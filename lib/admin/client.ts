// â”€â”€â”€ Camada de acesso admin ao Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Leitura/escrita das coleÃ§Ãµes globais em /app/admin/... â€” sÃ³ admina.
// Cada usuÃ¡ria comum sÃ³ cria/atualiza seu prÃ³prio "manifest" em /app/admin/users
// quando faz login (feito em writeUserManifest).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from 'firebase/auth'
import type { Role } from '@/lib/auth/roles'
import type { PlanId, SubscriptionStatus } from '@/lib/subscriptions/plan'

// â”€â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UserManifest {
  uid: string
  email: string
  name: string
  avatar: string
  role: Role
  plan: PlanId | null
  status: SubscriptionStatus
  since: string | null
  lastPayment: string | null
  paidUntil: string | null
  blocked: boolean
  updatedAt: string
}

export interface AuditLog {
  id: string
  actorUid: string
  actorEmail: string
  action: string
  targetUid?: string
  targetEmail?: string
  details?: Record<string, unknown>
  at: string
}

export interface Coupon {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  value: number
  active: boolean
  expiresAt?: string
  maxUses?: number
  usedCount: number
  notes?: string
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  level: 'info' | 'success' | 'warning'
  active: boolean
  createdAt: string
  expiresAt?: string
}

export interface PlanDoc {
  id: PlanId
  label: string
  price: number
  period: 'por mÃªs' | 'por ano'
  description: string
  savings?: string
  color: string
  active: boolean
  createdAt: string
  updatedAt: string
}

// â”€â”€â”€ Manifest de usuÃ¡ria â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MANIFEST_PATH = 'app/admin/users'

/**
 * Garante que o doc de manifest da prÃ³pria usuÃ¡ria existe e estÃ¡ atualizado.
 * Cada uma escreve sÃ³ o seu (security rule). Admina lÃª todos.
 */
export async function writeUserManifest(user: User, data: Partial<UserManifest>) {
  const ref = doc(db, MANIFEST_PATH, user.uid)
  const snap = await getDoc(ref)
  const payload: UserManifest = {
    uid: user.uid,
    email: user.email ?? '',
    name: data.name ?? (snap.exists() ? (snap.data() as UserManifest).name : ''),
    avatar: data.avatar ?? (snap.exists() ? (snap.data() as UserManifest).avatar : 'ðŸ¦Š'),
    role: data.role ?? (snap.exists() ? (snap.data() as UserManifest).role : 'subscriber'),
    plan: data.plan ?? (snap.exists() ? (snap.data() as UserManifest).plan : null),
    status: data.status ?? (snap.exists() ? (snap.data() as UserManifest).status : 'none'),
    since: data.since ?? (snap.exists() ? (snap.data() as UserManifest).since : null),
    lastPayment: data.lastPayment ?? (snap.exists() ? (snap.data() as UserManifest).lastPayment : null),
    paidUntil: data.paidUntil ?? (snap.exists() ? (snap.data() as UserManifest).paidUntil : null),
    blocked: data.blocked ?? (snap.exists() ? (snap.data() as UserManifest).blocked : false),
    updatedAt: new Date().toISOString(),
  }
  await setDoc(ref, payload, { merge: true })
  return payload
}

/**
 * InscriÃ§Ã£o em tempo-real na lista de manifestos (sÃ³ admina).
 */
export function subscribeUserManifests(onData: (items: UserManifest[]) => void): Unsubscribe {
  const ref = collection(db, MANIFEST_PATH)
  return onSnapshot(ref, (snap) => {
    const items: UserManifest[] = []
    snap.forEach((d) => {
      const data = d.data() as UserManifest
      if (!data.uid) data.uid = d.id
      items.push(data)
    })
    // ordena por updatedAt desc
    items.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    onData(items)
  })
}

// â”€â”€â”€ AÃ§Ãµes administrativas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// A admina atualiza o doc-raiz da prÃ³pria usuÃ¡ria alvo em /users/{uid} e o
// /app/admin/users/{uid}. O doc-raiz Ã© a fonte de verdade; o manifest Ã© cache.

async function adminUpdateUserRoot(
  actor: User,
  targetUid: string,
  patch: Record<string, unknown>,
) {
  await updateDoc(doc(db, 'users', targetUid), {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

async function adminUpdateManifest(targetUid: string, patch: Partial<UserManifest>) {
  await updateDoc(doc(db, MANIFEST_PATH, targetUid), {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

/** Promove uma usuÃ¡ria a admina. */
export async function promoteToAdmin(actor: User, target: UserManifest) {
  await adminUpdateUserRoot(actor, target.uid, { role: 'admin' })
  await adminUpdateManifest(target.uid, { role: 'admin' })
  await writeAuditLog(actor, 'promote_to_admin', { targetUid: target.uid, targetEmail: target.email })
}

/** Rebaixa uma admina a assinante comum. */
export async function demoteFromAdmin(actor: User, target: UserManifest) {
  await adminUpdateUserRoot(actor, target.uid, { role: 'subscriber' })
  await adminUpdateManifest(target.uid, { role: 'subscriber' })
  await writeAuditLog(actor, 'demote_from_admin', { targetUid: target.uid, targetEmail: target.email })
}

/** Marca pagamento manual â€” ativa plano e registra Ãºltimo pagamento. */
export async function markPayment(
  actor: User,
  target: UserManifest,
  plan: PlanId,
  paidUntil?: string,
) {
  const now = new Date().toISOString()
  const patch = {
    plan,
    status: 'active' as SubscriptionStatus,
    lastPayment: now,
    paidUntil: paidUntil ?? null,
    since: target.since ?? now,
  }
  await adminUpdateUserRoot(actor, target.uid, { subscription: patch })
  await adminUpdateManifest(target.uid, patch)
  await writeAuditLog(actor, 'mark_payment', {
    targetUid: target.uid,
    targetEmail: target.email,
    plan,
    paidUntil: paidUntil ?? null,
  })
}

/** Pausa a assinatura (status 'past_due'). NÃ£o bloqueia a conta. */
export async function pauseSubscription(actor: User, target: UserManifest) {
  const patch = { status: 'past_due' as SubscriptionStatus }
  await adminUpdateUserRoot(actor, target.uid, { subscription: patch })
  await adminUpdateManifest(target.uid, patch)
  await writeAuditLog(actor, 'pause_subscription', { targetUid: target.uid, targetEmail: target.email })
}

/** Cancela a assinatura (status 'cancelled'). */
export async function cancelSubscription(actor: User, target: UserManifest) {
  const patch = { status: 'cancelled' as SubscriptionStatus }
  await adminUpdateUserRoot(actor, target.uid, { subscription: patch })
  await adminUpdateManifest(target.uid, patch)
  await writeAuditLog(actor, 'cancel_subscription', { targetUid: target.uid, targetEmail: target.email })
}

/** Bloqueia uma usuÃ¡ria (login barrado no cliente). */
export async function blockUser(actor: User, target: UserManifest) {
  await adminUpdateUserRoot(actor, target.uid, { blocked: true })
  await adminUpdateManifest(target.uid, { blocked: true })
  await writeAuditLog(actor, 'block_user', { targetUid: target.uid, targetEmail: target.email })
}

/** Desbloqueia uma usuÃ¡ria. */
export async function unblockUser(actor: User, target: UserManifest) {
  await adminUpdateUserRoot(actor, target.uid, { blocked: false })
  await adminUpdateManifest(target.uid, { blocked: false })
  await writeAuditLog(actor, 'unblock_user', { targetUid: target.uid, targetEmail: target.email })
}

// â”€â”€â”€ Audit logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AUDIT_PATH = 'app/admin/auditLogs'

export async function writeAuditLog(
  actor: User,
  action: string,
  details: Record<string, unknown> = {},
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const log: AuditLog = {
    id,
    actorUid: actor.uid,
    actorEmail: actor.email ?? '',
    action,
    ...details,
    at: new Date().toISOString(),
  } as AuditLog
  await setDoc(doc(db, AUDIT_PATH, id), log)
}

export function subscribeAuditLogs(onData: (items: AuditLog[]) => void): Unsubscribe {
  const ref = collection(db, AUDIT_PATH)
  return onSnapshot(ref, (snap) => {
    const items: AuditLog[] = []
    snap.forEach((d) => items.push({ ...(d.data() as AuditLog), id: d.id }))
    items.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
    onData(items)
  })
}

// â”€â”€â”€ Planos (configurÃ¡veis pela admina) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PLANS_PATH = 'app/admin/plans'

export async function savePlan(plan: PlanDoc) {
  await setDoc(doc(db, PLANS_PATH, plan.id), plan)
}

export async function deletePlan(id: string) {
  await deleteDoc(doc(db, PLANS_PATH, id))
}

export function subscribePlans(onData: (items: PlanDoc[]) => void): Unsubscribe {
  const ref = collection(db, PLANS_PATH)
  return onSnapshot(ref, (snap) => {
    const items: PlanDoc[] = []
    snap.forEach((d) => items.push({ ...(d.data() as PlanDoc), id: d.id as PlanId }))
    onData(items)
  })
}

// â”€â”€â”€ Cupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COUPONS_PATH = 'app/admin/coupons'

export async function saveCoupon(c: Coupon) {
  await setDoc(doc(db, COUPONS_PATH, c.id), c)
}

export async function deleteCoupon(id: string) {
  await deleteDoc(doc(db, COUPONS_PATH, id))
}

export function subscribeCoupons(onData: (items: Coupon[]) => void): Unsubscribe {
  const ref = collection(db, COUPONS_PATH)
  return onSnapshot(ref, (snap) => {
    const items: Coupon[] = []
    snap.forEach((d) => items.push({ ...(d.data() as Coupon), id: d.id }))
    items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    onData(items)
  })
}

// â”€â”€â”€ AnÃºncios (comunicaÃ§Ã£o interna) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ANNOUNCE_PATH = 'app/admin/announcements'

export async function saveAnnouncement(a: Announcement) {
  await setDoc(doc(db, ANNOUNCE_PATH, a.id), a)
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, ANNOUNCE_PATH, id))
}

export function subscribeAnnouncements(onData: (items: Announcement[]) => void): Unsubscribe {
  const ref = collection(db, ANNOUNCE_PATH)
  return onSnapshot(ref, (snap) => {
    const items: Announcement[] = []
    snap.forEach((d) => items.push({ ...(d.data() as Announcement), id: d.id }))
    items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    onData(items)
  })
}

// UtilitÃ¡rios
export { serverTimestamp }
