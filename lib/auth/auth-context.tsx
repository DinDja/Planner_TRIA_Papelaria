'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { seedUserDoc } from './seed'
import { roleFromEmail, type Role } from './roles'
import { useSubscriptionStore } from '@/lib/subscriptions/use-subscription-store'
import { writeUserManifest } from '@/lib/admin/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  role: Role
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Role é derivada do e-mail (definido em lib/auth/roles.ts).
  // Default 'subscriber'; admina detectada no onAuthStateChanged.
  const [role, setRole] = useState<Role>('subscriber')

  useEffect(() => {
    // Aplica a role e sincroniza com a subscription store sempre que o user muda.
    const syncRole = (u: User | null) => {
      const r = roleFromEmail(u?.email)
      setRole(r)
      const subStore = useSubscriptionStore.getState()
      // Só atualiza se for diferente para evitar loops.
      if (subStore.role !== r) {
        subStore.setSubscription({ role: r })
      }
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Garante que o doc-raiz exista (cobre login via Google e usuários
        // criados antes da integração Firestore). Silencioso em lanterns.
        try {
          await seedUserDoc(u)
          // Atualiza o manifest administrativo (dona lê, cada uma escreve o seu).
          await writeUserManifest(u, {
            email: u.email ?? '',
            name: u.displayName ?? '',
          })
        } catch {}
      }
      // Reset do estado de assinatura local ao deslogar (a store será
      // re-hidratada do Firestore no próximo login via StoreSyncProvider).
      if (!u) {
        useSubscriptionStore.getState().reset()
      }
      syncRole(u)
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await seedUserDoc(cred.user, { name })
    // Define a role imediatamente após cadastro.
    const r = roleFromEmail(email)
    useSubscriptionStore.getState().setSubscription({ role: r })
    setRole(r)
  }

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, role, signIn, signUp, signInWithGoogle, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
