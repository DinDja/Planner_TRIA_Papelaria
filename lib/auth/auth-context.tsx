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

// Chave de sessão: marca que já fizemos o seeding/manifest para este uid
// nesta sessão do navegador. sessionStorage zera ao fechar a aba, então
// um novo login real dispara novamente. Isto evita repetir seedUserDoc
// + writeUserManifest em todo refresh/redirect do onAuthStateChanged.
const SEED_FLAG_PREFIX = 'plannerhub:seeded:'

function seededThisSession(uid: string): boolean {
  try {
    return sessionStorage.getItem(SEED_FLAG_PREFIX + uid) === '1'
  } catch {
    return false
  }
}
function markSeeded(uid: string) {
  try {
    sessionStorage.setItem(SEED_FLAG_PREFIX + uid, '1')
  } catch {}
}

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
      // Reset do estado de assinatura local ao deslogar (a store será
      // re-hidratada do Firestore no próximo login via StoreSyncProvider).
      if (!u) {
        useSubscriptionStore.getState().reset()
        syncRole(u)
        setUser(u)
        setLoading(false)
        return
      }

      // seeding/manifest são responsabilidade dos pontos de cadastro/signIn,
      // não do onAuthStateChanged (que dispara a cada refresh/redirect e
      // causava read+write em todo carregamento de página). Mantemos aqui
      // apenas um fallback idempotente para usuários pré-existentes cujo
      // doc-raiz ainda não existe — cobre o caso Google-login-first-time
      // sem cadastro explícito na nossa app.
      if (!seededThisSession(u.uid)) {
        try {
          await seedUserDoc(u)
          await writeUserManifest(u, { email: u.email ?? '', name: u.displayName ?? '' })
          markSeeded(u.uid)
        } catch {}
      }

      syncRole(u)
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // Login de conta já existente: doc-raiz já existe; só atualiza manifest
    // (avatar/nome podem ter mudado do lado do Google, por exemplo). Sienna.
    // Marcamos a sessão para evitar re-chamar isto no onAuthStateChanged.
    // O newUser aqui é desconhecido — perguntamos ao Firebase após login.
    // Em vez disso, fazemos o writeUserManifest dentro do onAuthStateChanged
    // (já contemplado pelo fallback acima) apenas na primeira vez por sessão.
  }

  const signUp = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await seedUserDoc(cred.user, { name })
    await writeUserManifest(cred.user, {
      email: cred.user.email ?? email,
      name,
    })
    markSeeded(cred.user.uid)
    // Define a role imediatamente após cadastro.
    const r = roleFromEmail(email)
    useSubscriptionStore.getState().setSubscription({ role: r })
    setRole(r)
  }

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    // Google login não tem "cadastro" separado na nossa app; pode ser
    // primeiro login (precisa seed) ou retorno (doc já existe, seed é
    // no-op). seedUserDoc é idempotente (getDoc-then-setDoc). Manifest
    // é upsert (merge). Marcamos a sessão para o onAuthStateChanged
    // não repetir — corta os 5% do sangramento que vinham do onAuth.
    try {
      await seedUserDoc(cred.user)
      await writeUserManifest(cred.user, {
        email: cred.user.email ?? '',
        name: cred.user.displayName ?? '',
      })
      markSeeded(cred.user.uid)
    } catch {}
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
