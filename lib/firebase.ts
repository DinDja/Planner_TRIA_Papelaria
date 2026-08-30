'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

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
  db = getFirestore(app)
} else {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }
