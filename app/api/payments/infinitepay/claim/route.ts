import { NextResponse } from 'next/server'
import {
  confirmInfinitePayPayment,
  requireFirebaseUser,
  serializePaymentError,
  type PaymentConfirmationInput,
} from '@/lib/payments/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request)
    const body = await request.json() as Partial<PaymentConfirmationInput>
    const payment = await confirmInfinitePayPayment({
      orderNsu: typeof body.orderNsu === 'string' ? body.orderNsu : '',
      transactionNsu: typeof body.transactionNsu === 'string' ? body.transactionNsu : '',
      slug: typeof body.slug === 'string' ? body.slug : '',
      receiptUrl: typeof body.receiptUrl === 'string' ? body.receiptUrl : undefined,
    }, user.uid)
    return NextResponse.json({ payment })
  } catch (error) {
    const response = serializePaymentError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
