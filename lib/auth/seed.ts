'use client'

import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_SETTINGS } from '@/lib/store/use-settings-store'
import { DEFAULT_MODULES } from '@/lib/store/use-menu-store'

/**
 * Cria o documento-raiz `users/{uid}` com defaults se ainda não existir.
 * Roda no cadastro e no primeiro onAuthStateChanged de qualquer provider.
 * Não migra dados do localStorage — apenas inicializa um usuário novo.
 */
export async function seedUserDoc(user: User, opts?: { name?: string }) {
  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  if (existing.exists()) return

  const name = opts?.name || user.displayName || ''
  const email = user.email || ''

  await setDoc(ref, {
    name,
    avatar: '🦊',
    email,
    theme: 'light',
    settings: DEFAULT_SETTINGS,
    folders: [],
    plannerTags: [],
    noteFolders: [],
    modules: DEFAULT_MODULES,
    height: 170,
    goalWeight: 65,
    sex: null,
    onboarded: false,
    masterPin: '',
    role: 'subscriber',
    // Permissões administrativas são mantidas separadamente em admin/{uid}.
    subscription: {
      role: 'subscriber',
      plan: null,
      status: 'none',
      since: null,
      lastPayment: null,
      paidUntil: null,
      trialStartedAt: null,
      cancelledAt: null,
    },
    updatedAt: new Date().toISOString(),
  })
}

