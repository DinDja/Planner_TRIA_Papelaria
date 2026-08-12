'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBzfaZR-cBJDUhV7x9DKv1tyTdtPEqd3n0",
  authDomain: "tria-2-ae5dd.firebaseapp.com",
  projectId: "tria-2-ae5dd",
  storageBucket: "tria-2-ae5dd.firebasestorage.app",
  messagingSenderId: "921159215537",
  appId: "1:921159215537:web:083cc545e558e788603590",
  measurementId: "G-0KJWLF5DBC"
};

let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }
