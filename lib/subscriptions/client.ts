'use client'

import type { User } from 'firebase/auth'
import { doc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { VerifiedPayment } from '@/lib/payments/infinitepay'
import { getPlanPeriodEnd, isFutureIso } from './period'
import type { Subscription } from './use-subscription-store'

export interface PaymentClaimInput {
  orderNsu: string
  transactionNsu: string
  slug: string
  receiptUrl?: string
}

type StoredSubscription = Subscription & {
  paymentProvider?: 'infinitepay' | null
  lastOrderNsu?: string
  lastTransactionNsu?: string
}

async function postAuthenticated<T>(user: User, path: string, body: unknown): Promise<T> {
  const token = await user.getIdToken()
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({})) as T & { error?: string; code?: string }
  if (!response.ok) {
    throw new SubscriptionClientError(
      result.error ?? 'Não foi possível concluir a operação.',
      result.code ?? 'unknown_error',
      response.status,
    )
  }
  return result
}

export class SubscriptionClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function currentSubscription(data: Record<string, unknown>): Partial<StoredSubscription> {
  const value = data.subscription
  return value && typeof value === 'object' ? value as Partial<StoredSubscription> : {}
}

function manifestFields(user: User, data: Record<string, unknown>, subscription: StoredSubscription) {
  return {
    uid: user.uid,
    email: user.email ?? (typeof data.email === 'string' ? data.email : ''),
    name: user.displayName ?? (typeof data.name === 'string' ? data.name : ''),
    avatar: typeof data.avatar === 'string' ? data.avatar : '🦊',
    role: data.role === 'admin' ? 'admin' : 'subscriber',
    plan: subscription.plan,
    status: subscription.status,
    since: subscription.since,
    lastPayment: subscription.lastPayment,
    paidUntil: subscription.paidUntil,
    blocked: Boolean(data.blocked),
    updatedAt: new Date().toISOString(),
  }
}

export async function claimInfinitePayPayment(
  user: User,
  input: PaymentClaimInput,
): Promise<Subscription> {
  const { payment } = await postAuthenticated<{ payment: VerifiedPayment }>(
    user,
    '/api/payments/infinitepay/claim',
    input,
  )
  if (payment.uid !== user.uid) throw new Error('Este pagamento pertence a outra conta.')

  const userRef = doc(db, 'users', user.uid)
  const manifestRef = doc(db, 'app/admin/users', user.uid)
  const paymentRef = doc(db, 'users', user.uid, 'billingPayments', payment.paymentId)
  return runTransaction(db, async (transaction) => {
    const [snapshot, paymentSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(paymentRef),
    ])
    if (!snapshot.exists()) throw new Error('Cadastro não encontrado.')

    const data = snapshot.data() as Record<string, unknown>
    const current = currentSubscription(data)
    if (paymentSnapshot.exists()) {
      return current as Subscription
    }

    const confirmedAt = new Date(payment.confirmedAt)
    if (Number.isNaN(confirmedAt.getTime())) throw new Error('Data de pagamento inválida.')
    const periodStartsAt = current.plan === payment.plan && isFutureIso(current.paidUntil, confirmedAt)
      ? new Date(current.paidUntil as string)
      : confirmedAt
    const paidUntil = getPlanPeriodEnd(payment.plan, periodStartsAt).toISOString()
    const next: StoredSubscription = {
      role: data.role === 'admin' ? 'admin' : 'subscriber',
      plan: payment.plan,
      status: 'active',
      since: typeof current.since === 'string' ? current.since : payment.confirmedAt,
      lastPayment: payment.confirmedAt,
      paidUntil,
      trialStartedAt: typeof current.trialStartedAt === 'string' ? current.trialStartedAt : null,
      cancelledAt: null,
      paymentProvider: 'infinitepay',
      lastOrderNsu: payment.orderNsu,
      lastTransactionNsu: payment.transactionNsu,
    }

    transaction.update(userRef, { subscription: next, updatedAt: payment.confirmedAt })
    transaction.set(paymentRef, {
      id: payment.paymentId,
      provider: 'infinitepay',
      plan: payment.plan,
      amount: payment.amount,
      confirmedAt: payment.confirmedAt,
      orderCreatedAt: payment.orderCreatedAt,
      orderNsu: payment.orderNsu,
      transactionNsu: payment.transactionNsu,
      invoiceSlug: payment.invoiceSlug,
      ...(payment.captureMethod ? { captureMethod: payment.captureMethod } : {}),
      ...(payment.receiptUrl ? { receiptUrl: payment.receiptUrl } : {}),
    })
    transaction.set(manifestRef, manifestFields(user, data, next), { merge: true })
    return next
  })
}

export async function startTrialFromClient(user: User): Promise<Subscription> {
  const userRef = doc(db, 'users', user.uid)
  const manifestRef = doc(db, 'app/admin/users', user.uid)
  const trialRef = doc(db, 'users', user.uid, 'billingTrials', 'one-month')
  return runTransaction(db, async (transaction) => {
    const [snapshot, trialSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(trialRef),
    ])
    if (!snapshot.exists()) throw new Error('Conclua seu cadastro antes de iniciar o teste.')

    const data = snapshot.data() as Record<string, unknown>
    const current = currentSubscription(data)
    if (trialSnapshot.exists() || current.trialStartedAt) {
      throw new Error('O teste grátis já foi utilizado nesta conta.')
    }
    if (current.plan || current.status === 'active') throw new Error('Sua conta já possui um plano.')

    const startedAt = new Date().toISOString()
    const next: StoredSubscription = {
      role: data.role === 'admin' ? 'admin' : 'subscriber',
      plan: 'trial',
      status: 'active',
      since: startedAt,
      lastPayment: null,
      paidUntil: getPlanPeriodEnd('trial', new Date(startedAt)).toISOString(),
      trialStartedAt: startedAt,
      cancelledAt: null,
      paymentProvider: null,
    }

    transaction.update(userRef, { subscription: next, updatedAt: startedAt })
    transaction.set(trialRef, {
      id: 'one-month',
      startedAt,
      paidUntil: next.paidUntil,
    })
    transaction.set(manifestRef, manifestFields(user, data, next), { merge: true })
    return next
  })
}

export async function cancelSubscriptionFromClient(user: User): Promise<Subscription> {
  const userRef = doc(db, 'users', user.uid)
  const manifestRef = doc(db, 'app/admin/users', user.uid)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists()) throw new Error('Assinatura não encontrada.')

    const data = snapshot.data() as Record<string, unknown>
    const current = currentSubscription(data)
    if (!current.plan) throw new Error('Assinatura não encontrada.')

    const cancelledAt = new Date().toISOString()
    const next = {
      ...current,
      role: data.role === 'admin' ? 'admin' as const : 'subscriber' as const,
      status: 'cancelled' as const,
      cancelledAt,
    } as StoredSubscription
    transaction.update(userRef, { subscription: next, updatedAt: cancelledAt })
    transaction.set(manifestRef, manifestFields(user, data, next), { merge: true })
    return next
  })
}
