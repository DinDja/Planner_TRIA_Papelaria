'use client'

import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_SETTINGS } from '@/lib/store/use-settings-store'
import { DEFAULT_MODULES } from '@/lib/store/use-menu-store'
import { roleFromEmail } from './roles'

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
  const role = roleFromEmail(email)

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
    // Assinatura inicial — gravada no Firestore.
    // Admina: status ativo sem plano. Assinante comum: sem plano até pagar.
    subscription: {
      role,
      plan: null,
      status: role === 'admin' ? 'active' : 'none',
      since: null,
      lastPayment: null,
    },
    updatedAt: new Date().toISOString(),
  })
}

