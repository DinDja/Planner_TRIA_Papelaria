import { NextResponse } from 'next/server'
import {
  requireFirebaseUser,
  serializePaymentError,
  startTrial,
  subscriptionResponse,
} from '@/lib/payments/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request)
    const subscription = await startTrial(user)
    return NextResponse.json({ subscription: subscriptionResponse(subscription) })
  } catch (error) {
    const response = serializePaymentError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
