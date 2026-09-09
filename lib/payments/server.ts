import 'server-only'

import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth } from '@/lib/server/firebase-admin'
import { PLANS, isPaidPlanId, type PaidPlanId } from '@/lib/subscriptions/plan'
import {
  INFINITEPAY_API_URL,
  isConfirmedPayment,
  isTrustedInfinitePayCheckoutUrl,
  type InfinitePayCheckoutPayload,
  type InfinitePayPaymentCheck,
  type VerifiedPayment,
} from './infinitepay'
import { createOrderToken, createPaymentId, verifyOrderToken } from './order-token'

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

function getHandle() {
  const handle = process.env.INFINITEPAY_HANDLE?.replace(/^\$/, '').trim()
  if (!handle) {
    throw new PaymentApiError(
      'Configure INFINITEPAY_HANDLE para habilitar os pagamentos.',
      503,
      'missing_handle',
    )
  }
  return handle
}

function getSigningSecret() {
  const secret = process.env.PAYMENT_SIGNING_SECRET?.trim()
  if (!secret || secret.length < 32 || secret === 'substitua_por_um_segredo_aleatorio') {
    throw new PaymentApiError(
      'Configure PAYMENT_SIGNING_SECRET para habilitar os pagamentos.',
      503,
      'missing_signing_secret',
    )
  }
  return secret
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

export async function createInfinitePayCheckout(
  request: Request,
  user: DecodedIdToken,
  plan: PaidPlanId,
): Promise<{ url: string; orderNsu: string }> {
  const handle = getHandle()
  const secret = getSigningSecret()
  const origin = getAppOrigin(request)
  const orderNsu = createOrderToken(user.uid, plan, secret)
  const planDefinition = PLANS[plan]
  const customer = {
    ...(typeof user.name === 'string' && user.name ? { name: user.name } : {}),
    ...(user.email ? { email: user.email } : {}),
  }
  const payload: InfinitePayCheckoutPayload = {
    handle,
    redirect_url: `${origin}/api/payments/infinitepay/return`,
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
    console.error('Falha de rede ao criar checkout InfinitePay', error)
    throw new PaymentApiError(
      'A InfinitePay não respondeu. Tente novamente em instantes.',
      502,
      'provider_unavailable',
    )
  }

  const result = await readProviderJson(response)
  if (!response.ok || !isTrustedInfinitePayCheckoutUrl(result.url)) {
    console.error('InfinitePay recusou a criação do checkout', response.status, result)
    throw new PaymentApiError(
      'Não foi possível abrir o pagamento agora.',
      502,
      'checkout_rejected',
    )
  }

  return { url: result.url, orderNsu }
}

export interface PaymentConfirmationInput {
  orderNsu: string
  transactionNsu: string
  slug: string
  receiptUrl?: string
}

function validatePaymentConfirmationInput(input: PaymentConfirmationInput) {
  if (!input.orderNsu || input.orderNsu.length > 320) {
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

export async function confirmInfinitePayPayment(
  input: PaymentConfirmationInput,
  expectedUid?: string,
): Promise<VerifiedPayment> {
  validatePaymentConfirmationInput(input)
  const secret = getSigningSecret()
  const order = verifyOrderToken(input.orderNsu, secret)
  if (!order) {
    throw new PaymentApiError('Pedido inválido ou expirado.', 400, 'invalid_order')
  }
  if (expectedUid && order.uid !== expectedUid) {
    throw new PaymentApiError('Este pagamento pertence a outra conta.', 403, 'payment_owner_mismatch')
  }

  const handle = getHandle()
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
  const amount = PLANS[order.plan].price
  if (!isConfirmedPayment(result, amount)) {
    throw new PaymentApiError('Pagamento ainda não confirmado.', 409, 'payment_not_confirmed')
  }

  const receiptUrl = safeReceiptUrl(input.receiptUrl)
  return {
    paymentId: createPaymentId(input.orderNsu, input.transactionNsu, input.slug, secret),
    uid: order.uid,
    plan: order.plan,
    amount,
    confirmedAt: new Date().toISOString(),
    orderCreatedAt: new Date(order.createdAt * 1000).toISOString(),
    orderNsu: input.orderNsu,
    transactionNsu: input.transactionNsu,
    invoiceSlug: input.slug,
    ...(typeof result.capture_method === 'string'
      ? { captureMethod: result.capture_method }
      : {}),
    ...(receiptUrl ? { receiptUrl } : {}),
  }
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
