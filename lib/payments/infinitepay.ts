import type { PaidPlanId } from '@/lib/subscriptions/plan'

export const INFINITEPAY_API_URL = 'https://api.checkout.infinitepay.io'

export interface InfinitePayCheckoutPayload {
  handle: string
  redirect_url: string
  order_nsu: string
  items: Array<{
    quantity: number
    price: number
    description: string
  }>
  customer?: {
    name?: string
    email?: string
  }
}

export interface InfinitePayPaymentCheck {
  success?: boolean
  paid?: boolean
  amount?: number
  paid_amount?: number
  installments?: number
  capture_method?: string
}

export interface VerifiedPayment {
  paymentId: string
  uid: string
  plan: PaidPlanId
  amount: number
  confirmedAt: string
  orderCreatedAt: string
  orderNsu: string
  transactionNsu: string
  invoiceSlug: string
  captureMethod?: string
  receiptUrl?: string
}

export function isTrustedInfinitePayCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (
      url.hostname === 'infinitepay.com.br'
      || url.hostname.endsWith('.infinitepay.com.br')
      || url.hostname === 'infinitepay.io'
      || url.hostname.endsWith('.infinitepay.io')
    )
  } catch {
    return false
  }
}

export function isConfirmedPayment(
  result: InfinitePayPaymentCheck,
  expectedAmount: number,
): boolean {
  return result.success === true
    && result.paid === true
    && result.amount === expectedAmount
}
