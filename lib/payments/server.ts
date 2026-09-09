import 'server-only'

import { randomUUID } from 'node:crypto'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth, adminDb } from '@/lib/server/firebase-admin'
import { PLANS, isPaidPlanId, type PaidPlanId, type PlanId } from '@/lib/subscriptions/plan'
import { getPlanPeriodEnd, isFutureIso } from '@/lib/subscriptions/period'
import {
  INFINITEPAY_API_URL,
  isConfirmedPayment,
  isTrustedInfinitePayCheckoutUrl,
  type InfinitePayCheckoutPayload,
  type InfinitePayPaymentCheck,
  type PaymentOrder,
} from './infinitepay'

const ORDERS_COLLECTION = 'billingOrders'
const TRIAL_CLAIMS_COLLECTION = 'trialClaims'

export class PaymentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
  }
}

export async function requireFirebaseUser(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    throw new PaymentApiError('Faça login para continuar.', 401, 'unauthenticated')
  }

  try {
    return await adminAuth.verifyIdToken(token)
  } catch {
    throw new PaymentApiError('Sua sessão expirou. Entre novamente.', 401, 'invalid_token')
  }
}

function getAppOrigin(request: Request): string {
  const configuredOrigin = process.env.APP_URL
  if (!configuredOrigin && process.env.NODE_ENV === 'production') {
    throw new PaymentApiError(
      'Configure APP_URL para habilitar o checkout.',
      503,
      'missing_app_url',
    )
  }

  const url = new URL(configuredOrigin ?? request.url)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new PaymentApiError('APP_URL precisa usar HTTPS.', 503, 'invalid_app_url')
  }
  return url.origin
}

async function readProviderJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function markOrderFailed(orderNsu: string, failureReason: string) {
  await adminDb.collection(ORDERS_COLLECTION).doc(orderNsu).set({
    status: 'failed',
    failureReason,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

export async function createInfinitePayCheckout(
  request: Request,
  user: DecodedIdToken,
  plan: PaidPlanId,
): Promise<{ url: string; orderNsu: string }> {
  const handle = process.env.INFINITEPAY_HANDLE?.replace(/^\$/, '').trim()
  if (!handle) {
    throw new PaymentApiError(
      'Configure INFINITEPAY_HANDLE para habilitar os pagamentos.',
      503,
      'missing_handle',
    )
  }

  const origin = getAppOrigin(request)
  const orderNsu = `tria-${randomUUID()}`
  const planDefinition = PLANS[plan]
  const now = new Date().toISOString()
  const order: PaymentOrder = {
    orderNsu,
    uid: user.uid,
    plan,
    amount: planDefinition.price,
    status: 'pending',
    customerEmail: user.email ?? '',
    customerName: typeof user.name === 'string' ? user.name : '',
    createdAt: now,
    updatedAt: now,
  }

  await adminDb.collection(ORDERS_COLLECTION).doc(orderNsu).create(order)

  const customer = {
    ...(order.customerName ? { name: order.customerName } : {}),
    ...(order.customerEmail ? { email: order.customerEmail } : {}),
  }
  const payload: InfinitePayCheckoutPayload = {
    handle,
    redirect_url: `${origin}/api/payments/infinitepay/return`,
    webhook_url: `${origin}/api/payments/infinitepay/webhook`,
    order_nsu: orderNsu,
    items: [{
      quantity: 1,
      price: planDefinition.price,
      description: `Tria Papelaria — plano ${planDefinition.label}`,
    }],
    ...(Object.keys(customer).length > 0 ? { customer } : {}),
  }

  let response: Response
  try {
    response = await fetch(`${INFINITEPAY_API_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch (error) {
    await markOrderFailed(orderNsu, 'provider_unavailable')
    console.error('Falha de rede ao criar checkout InfinitePay', error)
    throw new PaymentApiError(
      'A InfinitePay não respondeu. Tente novamente em instantes.',
      502,
      'provider_unavailable',
    )
  }

  const result = await readProviderJson(response)
  if (!response.ok || !isTrustedInfinitePayCheckoutUrl(result.url)) {
    await markOrderFailed(orderNsu, 'checkout_rejected')
    console.error('InfinitePay recusou a criação do checkout', response.status, result)
    throw new PaymentApiError(
      'Não foi possível abrir o pagamento agora.',
      502,
      'checkout_rejected',
    )
  }

  const url = result.url
  await adminDb.collection(ORDERS_COLLECTION).doc(orderNsu).update({
    checkoutUrl: url,
    updatedAt: new Date().toISOString(),
  })
  return { url, orderNsu }
}

interface PaymentConfirmationInput {
  orderNsu: string
  transactionNsu: string
  slug: string
  receiptUrl?: string
}

function validatePaymentConfirmationInput(input: PaymentConfirmationInput) {
  if (!/^tria-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.orderNsu)) {
    throw new PaymentApiError('Identificador do pedido inválido.', 400, 'invalid_order')
  }
  if (!input.transactionNsu || input.transactionNsu.length > 160 || !input.slug || input.slug.length > 160) {
    throw new PaymentApiError('Dados da transação inválidos.', 400, 'invalid_transaction')
  }
}

function safeReceiptUrl(value: string | undefined): string | undefined {
  if (!value || value.length > 2_000) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

async function activatePaidOrder(
  input: PaymentConfirmationInput,
  result: InfinitePayPaymentCheck,
): Promise<PaymentOrder> {
  const orderRef = adminDb.collection(ORDERS_COLLECTION).doc(input.orderNsu)
  const orderSnapshot = await orderRef.get()
  if (!orderSnapshot.exists) {
    throw new PaymentApiError('Pedido não encontrado.', 404, 'order_not_found')
  }

  const expectedOrder = orderSnapshot.data() as PaymentOrder
  if (expectedOrder.status === 'paid') return expectedOrder
  if (!isConfirmedPayment(result, expectedOrder.amount)) {
    throw new PaymentApiError('Pagamento ainda não confirmado.', 409, 'payment_not_confirmed')
  }

  return adminDb.runTransaction(async (transaction) => {
    const freshOrderSnapshot = await transaction.get(orderRef)
    if (!freshOrderSnapshot.exists) {
      throw new PaymentApiError('Pedido não encontrado.', 404, 'order_not_found')
    }

    const order = freshOrderSnapshot.data() as PaymentOrder
    if (order.status === 'paid') return order
    if (order.amount !== result.amount) {
      throw new PaymentApiError('Valor do pagamento não confere.', 409, 'amount_mismatch')
    }

    const userRef = adminDb.collection('users').doc(order.uid)
    const manifestRef = adminDb.doc(`app/admin/users/${order.uid}`)
    const [userSnapshot, manifestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(manifestRef),
    ])
    const userData = userSnapshot.data() ?? {}
    const currentSubscription = (userData.subscription ?? {}) as Record<string, unknown>
    const now = new Date()
    const currentPaidUntil = typeof currentSubscription.paidUntil === 'string'
      ? currentSubscription.paidUntil
      : null
    const periodStartsAt = currentSubscription.plan === order.plan && isFutureIso(currentPaidUntil, now)
      ? new Date(currentPaidUntil as string)
      : now
    const paidUntil = getPlanPeriodEnd(order.plan, periodStartsAt).toISOString()
    const paidAt = now.toISOString()
    const subscription = {
      ...currentSubscription,
      role: currentSubscription.role ?? userData.role ?? 'subscriber',
      plan: order.plan,
      status: 'active',
      since: currentSubscription.since ?? paidAt,
      lastPayment: paidAt,
      paidUntil,
      cancelledAt: null,
      paymentProvider: 'infinitepay',
      lastOrderNsu: order.orderNsu,
    }
    const manifestData = manifestSnapshot.data() ?? {}
    const paidOrder: PaymentOrder = {
      ...order,
      status: 'paid',
      paidAt,
      paidUntil,
      transactionNsu: input.transactionNsu,
      invoiceSlug: input.slug,
      captureMethod: result.capture_method,
      receiptUrl: safeReceiptUrl(input.receiptUrl),
      updatedAt: paidAt,
    }

    transaction.set(userRef, { subscription, updatedAt: paidAt }, { merge: true })
    transaction.set(manifestRef, {
      uid: order.uid,
      email: manifestData.email ?? order.customerEmail,
      name: manifestData.name ?? order.customerName,
      avatar: manifestData.avatar ?? '🦊',
      role: manifestData.role ?? userData.role ?? 'subscriber',
      plan: order.plan,
      status: 'active',
      since: subscription.since,
      lastPayment: paidAt,
      paidUntil,
      blocked: manifestData.blocked ?? false,
      updatedAt: paidAt,
    }, { merge: true })
    transaction.set(orderRef, paidOrder)

    return paidOrder
  })
}

export async function confirmInfinitePayPayment(
  input: PaymentConfirmationInput,
): Promise<PaymentOrder> {
  validatePaymentConfirmationInput(input)
  const orderRef = adminDb.collection(ORDERS_COLLECTION).doc(input.orderNsu)
  const orderSnapshot = await orderRef.get()
  if (!orderSnapshot.exists) {
    throw new PaymentApiError('Pedido não encontrado.', 404, 'order_not_found')
  }

  const order = orderSnapshot.data() as PaymentOrder
  if (order.status === 'paid') return order

  const handle = process.env.INFINITEPAY_HANDLE?.replace(/^\$/, '').trim()
  if (!handle) {
    throw new PaymentApiError('InfinitePay não configurada.', 503, 'missing_handle')
  }

  let response: Response
  try {
    response = await fetch(`${INFINITEPAY_API_URL}/payment_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        order_nsu: input.orderNsu,
        transaction_nsu: input.transactionNsu,
        slug: input.slug,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    })
  } catch (error) {
    console.error('Falha ao verificar pagamento InfinitePay', error)
    throw new PaymentApiError(
      'Não foi possível confirmar o pagamento agora.',
      502,
      'verification_unavailable',
    )
  }

  const result = await readProviderJson(response) as InfinitePayPaymentCheck
  if (!response.ok) {
    throw new PaymentApiError(
      'A InfinitePay não confirmou a transação.',
      502,
      'verification_rejected',
    )
  }
  return activatePaidOrder(input, result)
}

export async function startTrial(user: DecodedIdToken) {
  const userRef = adminDb.collection('users').doc(user.uid)
  const claimRef = adminDb.collection(TRIAL_CLAIMS_COLLECTION).doc(user.uid)
  const manifestRef = adminDb.doc(`app/admin/users/${user.uid}`)

  return adminDb.runTransaction(async (transaction) => {
    const [userSnapshot, claimSnapshot, manifestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(claimRef),
      transaction.get(manifestRef),
    ])
    if (!userSnapshot.exists) {
      throw new PaymentApiError('Conclua seu cadastro antes de iniciar o teste.', 409, 'user_not_ready')
    }

    const userData = userSnapshot.data() ?? {}
    const current = (userData.subscription ?? {}) as Record<string, unknown>
    if (claimSnapshot.exists || current.trialStartedAt) {
      throw new PaymentApiError('O teste grátis já foi utilizado nesta conta.', 409, 'trial_already_used')
    }
    if (current.plan || current.status === 'active') {
      throw new PaymentApiError('Sua conta já possui um plano.', 409, 'subscription_exists')
    }

    const now = new Date()
    const startedAt = now.toISOString()
    const paidUntil = getPlanPeriodEnd('trial', now).toISOString()
    const subscription = {
      ...current,
      role: current.role ?? userData.role ?? 'subscriber',
      plan: 'trial' as const,
      status: 'active' as const,
      since: startedAt,
      lastPayment: null,
      paidUntil,
      trialStartedAt: startedAt,
      cancelledAt: null,
      paymentProvider: null,
    }
    const manifest = manifestSnapshot.data() ?? {}

    transaction.create(claimRef, { uid: user.uid, startedAt, paidUntil })
    transaction.set(userRef, { subscription, updatedAt: startedAt }, { merge: true })
    transaction.set(manifestRef, {
      uid: user.uid,
      email: manifest.email ?? user.email ?? userData.email ?? '',
      name: manifest.name ?? user.name ?? userData.name ?? '',
      avatar: manifest.avatar ?? userData.avatar ?? '🦊',
      role: manifest.role ?? userData.role ?? 'subscriber',
      plan: 'trial',
      status: 'active',
      since: startedAt,
      lastPayment: null,
      paidUntil,
      blocked: manifest.blocked ?? userData.blocked ?? false,
      updatedAt: startedAt,
    }, { merge: true })

    return subscription
  })
}

export async function cancelSubscriptionPeriod(user: DecodedIdToken) {
  const userRef = adminDb.collection('users').doc(user.uid)
  const manifestRef = adminDb.doc(`app/admin/users/${user.uid}`)

  return adminDb.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef)
    if (!userSnapshot.exists) {
      throw new PaymentApiError('Assinatura não encontrada.', 404, 'subscription_not_found')
    }

    const userData = userSnapshot.data() ?? {}
    const current = (userData.subscription ?? {}) as Record<string, unknown>
    if (!current.plan) {
      throw new PaymentApiError('Assinatura não encontrada.', 404, 'subscription_not_found')
    }

    const cancelledAt = new Date().toISOString()
    const subscription = { ...current, status: 'cancelled', cancelledAt }
    transaction.set(userRef, { subscription, updatedAt: cancelledAt }, { merge: true })
    transaction.set(manifestRef, { status: 'cancelled', updatedAt: cancelledAt }, { merge: true })
    return subscription
  })
}

export function parsePaidPlan(value: unknown): PaidPlanId {
  if (!isPaidPlanId(value)) {
    throw new PaymentApiError('Plano de pagamento inválido.', 400, 'invalid_plan')
  }
  return value
}

export function serializePaymentError(error: unknown) {
  if (error instanceof PaymentApiError) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    }
  }
  console.error('Erro inesperado no fluxo de assinatura', error)
  return {
    status: 500,
    body: { error: 'Não foi possível concluir a operação.', code: 'internal_error' },
  }
}

export function subscriptionResponse(value: Record<string, unknown>) {
  const plan = value.plan
  return {
    plan: (typeof plan === 'string' ? plan : null) as PlanId | null,
    status: typeof value.status === 'string' ? value.status : 'none',
    since: typeof value.since === 'string' ? value.since : null,
    lastPayment: typeof value.lastPayment === 'string' ? value.lastPayment : null,
    paidUntil: typeof value.paidUntil === 'string' ? value.paidUntil : null,
    trialStartedAt: typeof value.trialStartedAt === 'string' ? value.trialStartedAt : null,
    cancelledAt: typeof value.cancelledAt === 'string' ? value.cancelledAt : null,
  }
}
