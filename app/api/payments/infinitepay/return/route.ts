import { NextResponse } from 'next/server'
import { confirmInfinitePayPayment, serializePaymentError } from '@/lib/payments/server'

export const runtime = 'nodejs'

function redirectToPlans(
  request: Request,
  payment: string,
  params?: {
    orderNsu: string
    transactionNsu: string
    slug: string
    receiptUrl?: string
  },
) {
  const destination = new URL('/plans', request.url)
  destination.searchParams.set('payment', payment)
  if (params) {
    destination.searchParams.set('order_nsu', params.orderNsu)
    destination.searchParams.set('transaction_nsu', params.transactionNsu)
    destination.searchParams.set('slug', params.slug)
    if (params.receiptUrl) destination.searchParams.set('receipt_url', params.receiptUrl)
  }
  return NextResponse.redirect(destination)
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const orderNsu = params.get('order_nsu')
  const transactionNsu = params.get('transaction_nsu')
  const slug = params.get('slug')

  if (!orderNsu || !transactionNsu || !slug) {
    return redirectToPlans(request, 'invalid')
  }

  const confirmation = {
    orderNsu,
    transactionNsu,
    slug,
    receiptUrl: params.get('receipt_url') ?? undefined,
  }
  try {
    const paymentResult = await confirmInfinitePayPayment(confirmation)
    return redirectToPlans(request, 'success', {
      ...confirmation,
      receiptUrl: paymentResult.receiptUrl,
    })
  } catch (error) {
    const response = serializePaymentError(error)
    const retryable = [
      'payment_not_confirmed',
      'verification_unavailable',
      'verification_rejected',
    ].includes(response.body.code)
    return redirectToPlans(
      request,
      retryable ? 'pending' : 'error',
      retryable ? { ...confirmation, receiptUrl: undefined } : undefined,
    )
  }
}
