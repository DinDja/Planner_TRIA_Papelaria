import { NextResponse } from 'next/server'
import { confirmInfinitePayPayment, serializePaymentError } from '@/lib/payments/server'

export const runtime = 'nodejs'

function redirectToPlans(request: Request, payment: string) {
  const destination = new URL('/plans', request.url)
  destination.searchParams.set('payment', payment)
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

  try {
    await confirmInfinitePayPayment({
      orderNsu,
      transactionNsu,
      slug,
      receiptUrl: params.get('receipt_url') ?? undefined,
    })
    return redirectToPlans(request, 'success')
  } catch (error) {
    const response = serializePaymentError(error)
    return redirectToPlans(
      request,
      response.body.code === 'payment_not_confirmed' ? 'pending' : 'error',
    )
  }
}
