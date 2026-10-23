'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { seedUserDoc } from './seed'
import { ADMIN_COLLECTION, type Role } from './roles'
import { useSubscriptionStore } from '@/lib/subscriptions/use-subscription-store'
import { writeUserManifest } from '@/lib/admin/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isAdminSystem: boolean
  adminLoading: boolean
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
const SEED_FLAG_PREFIX = 'tria-papelaria:seeded:'
const SESSION_ACTIVITY_PREFIX = 'tria-papelaria-auth-last-activity:'
const SESSION_INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000

function sessionActivityKey(uid: string) {
  return SESSION_ACTIVITY_PREFIX + uid
}

function recordSessionActivity(uid: string, at = Date.now()) {
  try {
    localStorage.setItem(sessionActivityKey(uid), String(at))
  } catch {}
}

function sessionHasExpired(uid: string, now = Date.now()): boolean {
  try {
    const key = sessionActivityKey(uid)
    const raw = localStorage.getItem(key)
    const lastActivity = raw === null ? NaN : Number(raw)

    // Sessões já existentes antes desta regra ganham o primeiro prazo a
    // partir do próximo acesso. Valores inválidos também são reiniciados.
    if (!Number.isFinite(lastActivity) || lastActivity <= 0) {
      recordSessionActivity(uid, now)
      return false
    }

    return now - lastActivity >= SESSION_INACTIVITY_LIMIT_MS
  } catch {
    return false
  }
}

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

function clearLocalCache() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key?.startsWith('tria-papelaria-') && key !== 'tria-papelaria-theme') {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

function syncUserDataInBackground(user: User) {
  if (seededThisSession(user.uid)) return

  // A sessao do Firebase nao deve depender da latencia do Firestore.
  void (async () => {
    try {
      await seedUserDoc(user)
      await writeUserManifest(user, { email: user.email ?? '', name: user.displayName ?? '' })
      markSeeded(user.uid)
    } catch {
      // Um proximo ciclo de autenticacao tentara novamente.
    }
  })()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminSystem, setIsAdminSystem] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    let unsubscribeAdmin: (() => void) | undefined
    let activeUid: string | null = null

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u && auth.currentUser) return
      unsubscribeAdmin?.()
      unsubscribeAdmin = undefined
      // Limpa assinatura e permissão local ao deslogar; ambas são recarregadas
      // da conta e do vínculo admin no próximo login.
      if (!u) {
        activeUid = null
        useSubscriptionStore.getState().reset()
        setIsAdmin(false)
        setIsAdminSystem(false)
        setAdminLoading(false)
        setUser(u)
        setLoading(false)
        return
      }

      activeUid = u.uid
      setIsAdmin(false)
      setIsAdminSystem(false)
      setAdminLoading(true)
      useSubscriptionStore.getState().setSubscription({ role: 'subscriber' })

      // A sessão continua válida entre acessos por até sete dias. Cada
      // retorno ao sistema reinicia a janela; atividade na tela a mantém viva.
      if (sessionHasExpired(u.uid)) {
        void signOut(auth).finally(clearLocalCache)
        return
      }
      recordSessionActivity(u.uid)

      // seeding/manifest são responsabilidade dos pontos de cadastro/signIn,
      // não do onAuthStateChanged (que dispara a cada refresh/redirect e
      // causava read+write em todo carregamento de página). Mantemos aqui
      // apenas um fallback idempotente para usuários pré-existentes cujo
      // doc-raiz ainda não existe — cobre o caso Google-login-first-time
      // sem cadastro explícito na nossa app.
      setUser(u)
      setLoading(false)
      syncUserDataInBackground(u)

      unsubscribeAdmin = onSnapshot(
        doc(db, ADMIN_COLLECTION, u.uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (activeUid !== u.uid || snapshot.metadata.fromCache) return
          const member = snapshot.exists() && snapshot.data()?.isAdmin === true
          const systemAdmin = member && snapshot.data()?.isAdminSystem === true
          const role: Role = member ? 'admin' : 'subscriber'
          setIsAdmin(member)
          setIsAdminSystem(systemAdmin)
          setAdminLoading(false)
          useSubscriptionStore.getState().setSubscription({ role })
          void writeUserManifest(u, { role }).catch(() => {})
        },
        (error) => {
          if (activeUid !== u.uid) return
          console.error('Falha ao verificar a permissão administrativa', error)
          setIsAdmin(false)
          setIsAdminSystem(false)
          setAdminLoading(false)
          useSubscriptionStore.getState().setSubscription({ role: 'subscriber' })
        },
      )
    })
    return () => {
      activeUid = null
      unsubscribeAdmin?.()
      unsub()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence)
    const cred = await signInWithEmailAndPassword(auth, email, password)
    recordSessionActivity(cred.user.uid)
    setUser(cred.user)
    setLoading(false)
    // Login de conta já existente: doc-raiz já existe; só atualiza manifest
    // (avatar/nome podem ter mudado do lado do Google, por exemplo). Sienna.
    // Marcamos a sessão para evitar re-chamar isto no onAuthStateChanged.
    // O newUser aqui é desconhecido — perguntamos ao Firebase após login.
    // Em vez disso, fazemos o writeUserManifest dentro do onAuthStateChanged
    // (já contemplado pelo fallback acima) apenas na primeira vez por sessão.
  }

  const signUp = async (name: string, email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    recordSessionActivity(cred.user.uid)
    await updateProfile(cred.user, { displayName: name })
    setUser(cred.user)
    setLoading(false)
    // Seeding/manifest são best-effort: a conta Auth já foi criada acima.
    // Se o Firestore falhar (race com onAuthStateChanged, regra transitória,
    // etc.), o onAuthStateChanged retentará o seed no próximo ciclo (ele
    // também envolve seedUserDoc/writeUserManifest em try/catch). Não
    // bloqueamos o cadastro nem mostramos erro ao usuário — espelha o
    // padrão já usado em signInWithGoogle.
    try {
      await seedUserDoc(cred.user, { name })
      await writeUserManifest(cred.user, {
        email: cred.user.email ?? email,
        name,
      })
      markSeeded(cred.user.uid)
    } catch {}
  }

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence)
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    recordSessionActivity(cred.user.uid)
    setUser(cred.user)
    setLoading(false)
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
    try {
      await signOut(auth)
    } finally {
      clearLocalCache()
    }
  }

  useEffect(() => {
    if (!user) return

    let expirationStarted = false
    const expireIfInactive = () => {
      if (expirationStarted || !sessionHasExpired(user.uid)) return false
      expirationStarted = true
      void signOut(auth).finally(clearLocalCache)
      return true
    }

    const markActivity = () => {
      if (expireIfInactive()) return
      recordSessionActivity(user.uid)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') markActivity()
    }

    const timer = window.setInterval(expireIfInactive, 60_000)
    window.addEventListener('pointerdown', markActivity)
    window.addEventListener('keydown', markActivity)
    window.addEventListener('touchstart', markActivity)
    window.addEventListener('wheel', markActivity)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('pointerdown', markActivity)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('touchstart', markActivity)
      window.removeEventListener('wheel', markActivity)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, isAdminSystem, adminLoading, signIn, signUp, signInWithGoogle, resetPassword, logout }}
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
