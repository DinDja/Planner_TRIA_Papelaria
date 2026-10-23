// â”€â”€â”€ Camada de acesso admin ao Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Leitura/escrita das coleÃ§Ãµes globais em /app/admin/... â€” sÃ³ admina.
// Cada usuÃ¡ria comum sÃ³ cria/atualiza seu prÃ³prio "manifest" em /app/admin/users
// quando faz login (feito em writeUserManifest).

import {
  collection,
  collectionGroup,
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
import { ADMIN_COLLECTION } from '@/lib/auth/roles'
import type { Role } from '@/lib/auth/roles'
import { PLANS, type PlanId, type SubscriptionStatus } from '@/lib/subscriptions/plan'
import { addMonthsClamped } from '@/lib/subscriptions/period'

// â”€â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UserManifest {
  uid: string
  email: string
  name: string
  avatar: string
  role: Role
  isAdminSystem?: boolean
  plan: PlanId | null
  status: SubscriptionStatus | null
  since: string | null
  lastPayment: string | null
  paidUntil: string | null
  trialStartedAt?: string | null
  cancelledAt?: string | null
  gratuityActive?: boolean
  gratuityIndefinite?: boolean
  gratuityPrevious?: GratuityPreviousSubscription | null
  blocked: boolean
  updatedAt: string
}

export interface GratuityPreviousSubscription {
  plan: PlanId | null
  status: SubscriptionStatus | null
  since: string | null
  paidUntil: string | null
  trialStartedAt: string | null
  cancelledAt: string | null
  gratuityActive: boolean
  gratuityIndefinite: boolean
}

export interface AuditLog {
  id: string
  actorUid: string
  actorEmail: string
  action: string
  targetUid?: string
  targetEmail?: string
  plan?: PlanId
  amount?: number
  details?: Record<string, unknown>
  at: string
}

export interface BillingPayment {
  id: string
  uid: string
  plan: Exclude<PlanId, 'trial'>
  amount: number
  confirmedAt: string
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
  period: 'por mês' | 'por ano' | 'por 1 mês'
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
  const [snap, adminSnap] = await Promise.all([
    getDoc(ref),
    data.role === undefined ? getDoc(doc(db, ADMIN_COLLECTION, user.uid)) : Promise.resolve(null),
  ])
  const payload: UserManifest = {
    uid: user.uid,
    email: user.email ?? '',
    name: data.name ?? (snap.exists() ? (snap.data() as UserManifest).name : ''),
    avatar: data.avatar ?? (snap.exists() ? (snap.data() as UserManifest).avatar : ''),
    role: data.role ?? (adminSnap?.data()?.isAdmin === true ? 'admin' : 'subscriber'),
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
  return onSnapshot(collection(db, MANIFEST_PATH), (snap) => {
    const items = snap.docs.map((d) => ({ ...(d.data() as UserManifest), uid: d.id }))
    items.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    onData(items)
  })
}

export function subscribeAdminSystemUids(onData: (uids: string[]) => void): Unsubscribe {
  return onSnapshot(collection(db, ADMIN_COLLECTION), (snap) => {
    const uids = snap.docs
      .filter((entry) => entry.data().isAdmin === true && entry.data().isAdminSystem === true)
      .map((entry) => entry.id)
    onData(uids)
  })
}

export async function fetchAllSystemUsers(user: User): Promise<UserManifest[]> {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  })

  if (!response.ok) throw new Error('Não foi possível carregar os usuários do sistema.')

  const payload = await response.json() as { users?: UserManifest[] }
  return Array.isArray(payload.users) ? payload.users : []
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
  await setDoc(doc(db, MANIFEST_PATH, targetUid), {
    ...patch,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

/** Promove uma usuÃ¡ria a admina. */
export async function promoteToAdmin(actor: User, target: UserManifest) {
  await setDoc(doc(db, ADMIN_COLLECTION, target.uid), {
    uid: target.uid,
    isAdmin: true,
    isAdminSystem: false,
    email: target.email,
    createdAt: new Date().toISOString(),
    createdByUid: actor.uid,
  })
  await adminUpdateUserRoot(actor, target.uid, {
    role: 'admin',
    'subscription.role': 'admin',
  })
  await adminUpdateManifest(target.uid, { role: 'admin' })
  await writeAuditLog(actor, 'promote_to_admin', { targetUid: target.uid, targetEmail: target.email })
}

export async function promoteToSystemAdmin(actor: User, target: UserManifest) {
  if (target.isAdminSystem) {
    throw new Error('Este usuário já é adminSystem.')
  }

  const adminRef = doc(db, ADMIN_COLLECTION, target.uid)
  const existingAdmin = await getDoc(adminRef)
  if (existingAdmin.data()?.isAdminSystem === true) {
    throw new Error('Este usuário já é adminSystem.')
  }
  const now = new Date().toISOString()
  const batch = writeBatch(db)
  batch.set(adminRef, {
    uid: target.uid,
    isAdmin: true,
    isAdminSystem: true,
    email: target.email,
    ...(existingAdmin.exists() ? {} : { createdAt: now, createdByUid: actor.uid }),
  }, { merge: true })
  batch.update(doc(db, 'users', target.uid), {
    role: 'admin',
    'subscription.role': 'admin',
    updatedAt: now,
  })
  batch.set(doc(db, MANIFEST_PATH, target.uid), {
    role: 'admin',
    updatedAt: now,
  }, { merge: true })
  await batch.commit()
  await writeAuditLog(actor, 'promote_to_system_admin', { targetUid: target.uid, targetEmail: target.email })
}

/** Rebaixa uma admina a assinante comum. */
export async function demoteFromAdmin(actor: User, target: UserManifest) {
  if (actor.uid === target.uid) {
    throw new Error('Não é possível remover a própria permissão administrativa.')
  }
  const [actorAdmin, targetAdmin] = await Promise.all([
    getDoc(doc(db, ADMIN_COLLECTION, actor.uid)),
    getDoc(doc(db, ADMIN_COLLECTION, target.uid)),
  ])
  const targetIsSystemAdmin = targetAdmin.exists() && targetAdmin.data()?.isAdminSystem === true
  if (targetIsSystemAdmin && actorAdmin.data()?.isAdminSystem !== true) {
    throw new Error('Somente um adminSystem pode remover outro adminSystem.')
  }
  const now = new Date().toISOString()
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', target.uid), {
    role: 'subscriber',
    'subscription.role': 'subscriber',
    updatedAt: now,
  })
  batch.set(doc(db, MANIFEST_PATH, target.uid), {
    role: 'subscriber',
    updatedAt: now,
  }, { merge: true })
  batch.update(doc(db, ADMIN_COLLECTION, target.uid), {
    isAdmin: false,
    isAdminSystem: false,
    updatedAt: now,
  })
  await batch.commit()
  await writeAuditLog(actor, 'demote_from_admin', { targetUid: target.uid, targetEmail: target.email })
}

/** Marca pagamento manual â€” ativa plano e registra Ãºltimo pagamento. */
export async function markPayment(
  actor: User,
  target: UserManifest,
  plan: PlanId,
  paidUntil?: string,
  amount = PLANS[plan].price,
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
    amount,
    paidUntil: paidUntil ?? null,
  })
}

/** Concede acesso gratuito pelo período escolhido ao usuário selecionado. */
export type GratuityPeriod =
  | { unit: 'hours' | 'days' | 'months'; amount: number }
  | { unit: 'indefinite' }

export async function activateGratuity(actor: User, target: UserManifest, period: GratuityPeriod) {
  const now = new Date()
  const nowIso = now.toISOString()
  const isIndefinite = period.unit === 'indefinite'
  let paidUntil: string | null = null
  if (!isIndefinite) {
    if (!Number.isSafeInteger(period.amount) || period.amount < 1) {
      throw new Error('Informe uma duração inteira maior que zero.')
    }
    const currentPaidUntil = target.paidUntil ? new Date(target.paidUntil) : null
    const startsAt = currentPaidUntil && Number.isFinite(currentPaidUntil.getTime()) && currentPaidUntil > now
      ? currentPaidUntil
      : now
    const end = new Date(startsAt)
    if (period.unit === 'hours') end.setTime(end.getTime() + period.amount * 60 * 60 * 1000)
    if (period.unit === 'days') end.setUTCDate(end.getUTCDate() + period.amount)
    if (period.unit === 'months') end.setTime(addMonthsClamped(startsAt, period.amount).getTime())
    if (!Number.isFinite(end.getTime())) throw new Error('A duração informada é muito grande.')
    paidUntil = end.toISOString()
  }
  const emptyPrevious: GratuityPreviousSubscription = {
    plan: null,
    status: 'none',
    since: null,
    paidUntil: null,
    trialStartedAt: null,
    cancelledAt: null,
    gratuityActive: false,
    gratuityIndefinite: false,
  }
  const previous = target.gratuityActive
    ? target.gratuityPrevious ?? emptyPrevious
    : target.gratuityIndefinite
      ? emptyPrevious
      : {
          plan: target.plan,
          status: target.status ?? 'none',
          since: target.since,
          paidUntil: target.paidUntil,
          trialStartedAt: target.trialStartedAt ?? null,
          cancelledAt: target.cancelledAt ?? null,
          gratuityActive: target.gratuityActive === true,
          gratuityIndefinite: target.gratuityIndefinite === true,
        }
  const patch = {
    plan: 'trial' as const,
    status: 'active' as const,
    since: target.since && target.since.length >= 10 ? target.since : nowIso,
    paidUntil,
    trialStartedAt: nowIso,
    cancelledAt: null,
    gratuityActive: true,
    gratuityIndefinite: isIndefinite,
    gratuityPrevious: previous,
  }

  await adminUpdateUserRoot(actor, target.uid, {
    'subscription.role': target.role,
    'subscription.plan': patch.plan,
    'subscription.status': patch.status,
    'subscription.since': patch.since,
    'subscription.paidUntil': patch.paidUntil,
    'subscription.trialStartedAt': patch.trialStartedAt,
    'subscription.cancelledAt': patch.cancelledAt,
    'subscription.gratuityActive': patch.gratuityActive,
    'subscription.gratuityIndefinite': patch.gratuityIndefinite,
    'subscription.gratuityPrevious': patch.gratuityPrevious,
  })
  await adminUpdateManifest(target.uid, patch)
  await writeAuditLog(actor, 'activate_gratuity', {
    targetUid: target.uid,
    targetEmail: target.email,
    plan: 'trial',
    paidUntil,
    durationUnit: period.unit,
    ...(period.unit === 'indefinite' ? {} : { durationAmount: period.amount }),
  })
}

/** Remove o acesso gratuito e restaura a assinatura que existia antes da concessão. */
export async function removeGratuity(actor: User, target: UserManifest) {
  if (!target.gratuityActive && !target.gratuityIndefinite) {
    throw new Error('Esta conta não tem uma gratuidade ativa.')
  }

  const previous = target.gratuityPrevious ?? {
    plan: null,
    status: 'none' as const,
    since: null,
    paidUntil: null,
    trialStartedAt: null,
    cancelledAt: null,
    gratuityActive: false,
    gratuityIndefinite: false,
  }
  const patch = {
    plan: previous.plan,
    status: previous.status ?? 'none',
    since: previous.since,
    paidUntil: previous.paidUntil,
    trialStartedAt: previous.trialStartedAt,
    cancelledAt: previous.cancelledAt,
    gratuityActive: previous.gratuityActive,
    gratuityIndefinite: previous.gratuityIndefinite,
    gratuityPrevious: null,
  }

  await adminUpdateUserRoot(actor, target.uid, {
    'subscription.role': target.role,
    'subscription.plan': patch.plan,
    'subscription.status': patch.status,
    'subscription.since': patch.since,
    'subscription.paidUntil': patch.paidUntil,
    'subscription.trialStartedAt': patch.trialStartedAt,
    'subscription.cancelledAt': patch.cancelledAt,
    'subscription.gratuityActive': false,
    'subscription.gratuityIndefinite': false,
    'subscription.gratuityPrevious': null,
  })
  await adminUpdateManifest(target.uid, patch)
  await writeAuditLog(actor, 'remove_gratuity', {
    targetUid: target.uid,
    targetEmail: target.email,
    restoredPlan: patch.plan,
    restoredStatus: patch.status,
    paidUntil: patch.paidUntil,
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

export function subscribeAuditLogs(
  onData: (items: AuditLog[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const ref = collection(db, AUDIT_PATH)
  return onSnapshot(ref, (snap) => {
    const items: AuditLog[] = []
    snap.forEach((d) => items.push({ ...(d.data() as AuditLog), id: d.id }))
    items.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
    onData(items)
  }, (error) => onError?.(error))
}

/** Acompanha comprovantes confirmados em todas as contas para o resumo financeiro. */
export function subscribeBillingPayments(
  onData: (items: BillingPayment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(collectionGroup(db, 'billingPayments'), (snap) => {
    const items: BillingPayment[] = []
    snap.forEach((d) => {
      const data = d.data()
      if (
        (data.plan === 'monthly' || data.plan === 'annual')
        && typeof data.amount === 'number'
        && Number.isFinite(data.amount)
        && typeof data.confirmedAt === 'string'
      ) {
        const uid = d.ref.parent.parent?.id
        if (!uid) return
        items.push({
          id: d.id,
          uid,
          plan: data.plan,
          amount: data.amount,
          confirmedAt: data.confirmedAt,
        })
      }
    })
    onData(items)
  }, (error) => onError?.(error))
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
