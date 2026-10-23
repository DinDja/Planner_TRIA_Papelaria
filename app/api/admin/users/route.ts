import { NextResponse } from 'next/server'
import type { GratuityPreviousSubscription, UserManifest } from '@/lib/admin/client'

export const dynamic = 'force-dynamic'

type FirestoreValue = {
  stringValue?: string
  booleanValue?: boolean
  mapValue?: { fields?: Record<string, FirestoreValue> }
}

type FirestoreDocument = {
  name: string
  fields?: Record<string, FirestoreValue>
}

type FirestoreQueryRow = {
  document?: FirestoreDocument
}

const PROFILE_FIELDS = [
  'email',
  'name',
  'avatar',
  'role',
  'blocked',
  'updatedAt',
  'subscription.plan',
  'subscription.status',
  'subscription.since',
  'subscription.lastPayment',
  'subscription.paidUntil',
  'subscription.trialStartedAt',
  'subscription.cancelledAt',
  'subscription.gratuityActive',
  'subscription.gratuityIndefinite',
  'subscription.gratuityPrevious',
]

function readField(fields: Record<string, FirestoreValue>, path: string) {
  const [first, ...nested] = path.split('.')
  return nested.reduce<FirestoreValue | undefined>(
    (value, key) => value?.mapValue?.fields?.[key],
    fields[first],
  )
}

function readString(fields: Record<string, FirestoreValue>, path: string, fallback = '') {
  const value = readField(fields, path)?.stringValue
  return typeof value === 'string' ? value : fallback
}

function readNullableString(fields: Record<string, FirestoreValue>, path: string) {
  const value = readField(fields, path)?.stringValue
  return typeof value === 'string' ? value : null
}

function readGratuityPrevious(fields: Record<string, FirestoreValue>): GratuityPreviousSubscription | null {
  const previous = readField(fields, 'subscription.gratuityPrevious')?.mapValue?.fields
  if (!previous) return null

  const planValue = previous.plan?.stringValue
  const statusValue = previous.status?.stringValue
  return {
    plan: planValue === 'monthly' || planValue === 'annual' || planValue === 'trial' ? planValue : null,
    status: statusValue === 'active' || statusValue === 'past_due' || statusValue === 'cancelled' || statusValue === 'none'
      ? statusValue
      : null,
    since: previous.since?.stringValue ?? null,
    paidUntil: previous.paidUntil?.stringValue ?? null,
    trialStartedAt: previous.trialStartedAt?.stringValue ?? null,
    cancelledAt: previous.cancelledAt?.stringValue ?? null,
    gratuityActive: previous.gratuityActive?.booleanValue === true,
    gratuityIndefinite: previous.gratuityIndefinite?.booleanValue === true,
  }
}

function toUser(document: FirestoreDocument): UserManifest {
  const fields = document.fields ?? {}
  const plan = readString(fields, 'subscription.plan')
  const status = readString(fields, 'subscription.status')

  return {
    uid: document.name.split('/').at(-1) ?? '',
    email: readString(fields, 'email'),
    name: readString(fields, 'name'),
    avatar: readString(fields, 'avatar'),
    role: readString(fields, 'role') === 'admin' ? 'admin' : 'subscriber',
    plan: plan === 'monthly' || plan === 'annual' || plan === 'trial' ? plan : null,
    status: status === 'active' || status === 'past_due' || status === 'cancelled' || status === 'none' ? status : null,
    since: readNullableString(fields, 'subscription.since'),
    lastPayment: readNullableString(fields, 'subscription.lastPayment'),
    paidUntil: readNullableString(fields, 'subscription.paidUntil'),
    trialStartedAt: readNullableString(fields, 'subscription.trialStartedAt'),
    cancelledAt: readNullableString(fields, 'subscription.cancelledAt'),
    gratuityActive: readField(fields, 'subscription.gratuityActive')?.booleanValue === true,
    gratuityIndefinite: readField(fields, 'subscription.gratuityIndefinite')?.booleanValue === true,
    gratuityPrevious: readGratuityPrevious(fields),
    blocked: readField(fields, 'blocked')?.booleanValue === true,
    updatedAt: readString(fields, 'updatedAt'),
  }
}

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? 'teste-3637d'
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          select: { fields: PROFILE_FIELDS.map((fieldPath) => ({ fieldPath })) },
        },
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const status = response.status === 403 || response.status === 401 ? 403 : 502
    return NextResponse.json({ error: 'Não foi possível consultar os perfis de usuários.' }, { status })
  }

  const rows = await response.json() as FirestoreQueryRow[]
  const users = Array.isArray(rows)
    ? rows.flatMap((row) => row.document ? [toUser(row.document)] : [])
    : []

  return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store' } })
}
