import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { PaidPlanId } from '@/lib/subscriptions/plan'

const TOKEN_VERSION = '1'
const TOKEN_PREFIX = 'tria'
const MAX_TOKEN_AGE_SECONDS = 7 * 24 * 60 * 60

export interface OrderTokenClaims {
  uid: string
  plan: PaidPlanId
  createdAt: number
}

function planCode(plan: PaidPlanId) {
  return plan === 'monthly' ? 'm' : 'a'
}

function decodePlan(value: string): PaidPlanId | null {
  if (value === 'm') return 'monthly'
  if (value === 'a') return 'annual'
  return null
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest().subarray(0, 18).toString('base64url')
}

export function createOrderToken(
  uid: string,
  plan: PaidPlanId,
  secret: string,
  now = new Date(),
) {
  const uidEncoded = Buffer.from(uid, 'utf8').toString('base64url')
  const createdAt = Math.floor(now.getTime() / 1000).toString(36)
  const nonce = randomBytes(8).toString('base64url')
  const unsigned = [TOKEN_PREFIX, TOKEN_VERSION, planCode(plan), uidEncoded, createdAt, nonce].join('.')
  return `${unsigned}.${signature(unsigned, secret)}`
}

export function verifyOrderToken(
  token: string,
  secret: string,
  now = new Date(),
): OrderTokenClaims | null {
  const parts = token.split('.')
  if (parts.length !== 7 || parts[0] !== TOKEN_PREFIX || parts[1] !== TOKEN_VERSION) return null

  const [prefix, version, encodedPlan, uidEncoded, encodedCreatedAt, nonce, receivedSignature] = parts
  const plan = decodePlan(encodedPlan)
  if (!plan || !uidEncoded || !nonce || !receivedSignature) return null

  const unsigned = [prefix, version, encodedPlan, uidEncoded, encodedCreatedAt, nonce].join('.')
  const expected = Buffer.from(signature(unsigned, secret))
  const received = Buffer.from(receivedSignature)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

  let uid: string
  try {
    uid = Buffer.from(uidEncoded, 'base64url').toString('utf8')
  } catch {
    return null
  }
  const createdAt = Number.parseInt(encodedCreatedAt, 36)
  const nowSeconds = Math.floor(now.getTime() / 1000)
  if (
    !uid
    || uid.length > 128
    || !Number.isFinite(createdAt)
    || createdAt > nowSeconds + 300
    || nowSeconds - createdAt > MAX_TOKEN_AGE_SECONDS
  ) return null

  return { uid, plan, createdAt }
}

export function createPaymentId(
  orderNsu: string,
  transactionNsu: string,
  slug: string,
  secret: string,
) {
  return createHmac('sha256', secret)
    .update(`payment:${orderNsu}:${transactionNsu}:${slug}`)
    .digest('base64url')
    .slice(0, 32)
}
