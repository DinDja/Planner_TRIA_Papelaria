'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB-7WZZfnS1CVon7gse9sswGOx1GRkESek",
  authDomain: "tria-2b81c.firebaseapp.com",
  projectId: "tria-2b81c",
  storageBucket: "tria-2b81c.firebasestorage.app",
  messagingSenderId: "910962235649",
  appId: "1:910962235649:web:f76251135020d29afb2300",
  measurementId: "G-7NVSSJ2K0K"
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
