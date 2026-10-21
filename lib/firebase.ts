'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { migrateLegacyStorage } from '@/lib/storage/brand-migration'

migrateLegacyStorage()

const firebaseConfig = {
  apiKey: "AIzaSyAAkQLkIjA9a3UKACGzZJBeYtUzOI8fops",
  authDomain: "teste-3637d.firebaseapp.com",
  projectId: "teste-3637d",
  storageBucket: "teste-3637d.firebasestorage.app",
  messagingSenderId: "735967297653",
  appId: "1:735967297653:web:5331f1088d316e1c1af83c",
  measurementId: "G-2PX1FBV36Y"
};

let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  try {
    // Keep Firestore's write queue in IndexedDB so offline edits survive a
    // reload and can reach the server when the connection returns.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    // Reuse an instance created earlier (for example after a client HMR reload)
    // or fall back when persistent storage is unavailable in this browser.
    db = getFirestore(app)
  }
} else {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }
