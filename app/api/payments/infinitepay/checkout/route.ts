import { NextResponse } from 'next/server'
import {
  createInfinitePayCheckout,
  parsePaidPlan,
  requireFirebaseUser,
  serializePaymentError,
} from '@/lib/payments/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request)
    const body = await request.json() as { plan?: unknown }
    const plan = parsePaidPlan(body.plan)
    const checkout = await createInfinitePayCheckout(request, user, plan)
    return NextResponse.json(checkout)
  } catch (error) {
    const response = serializePaymentError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
