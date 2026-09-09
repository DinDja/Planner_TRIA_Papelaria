import 'server-only'

import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'teste-3637d'

const adminApp = getApps()[0] ?? initializeApp({
  projectId,
})

export const adminAuth = getAuth(adminApp)
