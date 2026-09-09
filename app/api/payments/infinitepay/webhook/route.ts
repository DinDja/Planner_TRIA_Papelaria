import { NextResponse } from 'next/server'
import { confirmInfinitePayPayment, serializePaymentError } from '@/lib/payments/server'

export const runtime = 'nodejs'

interface InfinitePayWebhookBody {
  order_nsu?: unknown
  transaction_nsu?: unknown
  invoice_slug?: unknown
  receipt_url?: unknown
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as InfinitePayWebhookBody
    if (
      typeof body.order_nsu !== 'string'
      || typeof body.transaction_nsu !== 'string'
      || typeof body.invoice_slug !== 'string'
    ) {
      return NextResponse.json(
        { success: false, message: 'Payload inválido' },
        { status: 400 },
      )
    }

    await confirmInfinitePayPayment({
      orderNsu: body.order_nsu,
      transactionNsu: body.transaction_nsu,
      slug: body.invoice_slug,
      receiptUrl: typeof body.receipt_url === 'string' ? body.receipt_url : undefined,
    })
    return NextResponse.json({ success: true, message: null })
  } catch (error) {
    const response = serializePaymentError(error)
    return NextResponse.json(
      { success: false, message: response.body.error },
      { status: 400 },
    )
  }
}
