import 'server-only'

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'teste-3637d'
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

const adminApp = getApps()[0] ?? initializeApp({
  projectId,
  credential: clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault(),
})

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
