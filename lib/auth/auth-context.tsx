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
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
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

// Graça para não travar a sessão quando o Firestore não responde (offline /
// regras antigas publicadas). Após este prazo, usa o espelho legado.
const ADMIN_FALLBACK_MS = 4_000

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

/**
 * Fallback de migração: antes do vínculo `admin/{uid}`, o papel ficava
 * espelhado em `users/{uid}.role` e `users/{uid}.subscription.role`.
 *
 * Consultamos o espelho somente quando o vínculo novo não existe ou não pode
 * ser lido (por exemplo, Firestore Rules antigas ainda publicadas). O espelho
 * não é um caminho de auto-promoção: as regras impedem a própria usuária de
 * alterar `role`.
 */
async function readLegacyAdminRole(uid: string): Promise<Role | null> {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid))
    if (!snapshot.exists()) return null
    const data = snapshot.data() as Record<string, unknown>
    const subscription = data.subscription && typeof data.subscription === 'object'
      ? data.subscription as Record<string, unknown>
      : null
    return data.role === 'admin' || subscription?.role === 'admin' ? 'admin' : 'subscriber'
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminSystem, setIsAdminSystem] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    let unsubscribeAdmin: (() => void) | undefined
    let adminTimeout: ReturnType<typeof setTimeout> | undefined
    let activeUid: string | null = null

    const clearAdminTimeout = () => {
      if (adminTimeout !== undefined) {
        clearTimeout(adminTimeout)
        adminTimeout = undefined
      }
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u && auth.currentUser) return
      clearAdminTimeout()
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
      useSubscriptionStore.getState().setRole('subscriber')

      // Se o onSnapshot não dispara (rede indisponível/offline persistente),
      // ainda liberamos o acesso via espelho legado depois de um curto prazo
      // em vez de deixar a tela presa no carregamento.
      adminTimeout = setTimeout(() => {
        if (!adminLoading) return
        if (activeUid !== u.uid) return
        void applyAdminFromLegacyMirror()
      }, ADMIN_FALLBACK_MS)

      const applyAdminRole = (member: boolean, systemAdmin: boolean) => {
        clearAdminTimeout()
        const role: Role = member ? 'admin' : 'subscriber'
        setIsAdmin(member)
        setIsAdminSystem(systemAdmin)
        setAdminLoading(false)
        useSubscriptionStore.getState().setRole(role)
        void writeUserManifest(u, { role }).catch(() => {})
      }

      // Sem vínculo admin/{uid} (ou sem permissão de lê-lo), usa o espelho
      // legado em users/{uid}. Isso mantém administradoras antigas com acesso
      // enquanto as regras publicadas e o vínculo novo não são concluídos.
      const applyAdminFromLegacyMirror = async () => {
        const legacyRole = await readLegacyAdminRole(u.uid)
        if (activeUid !== u.uid) return
        if (legacyRole === 'admin') {
          console.warn(
            'Permissão administrativa recuperada de users/{uid}.role. ' +
            'Publique as Firestore Rules atuais e crie o vínculo admin/{uid} para concluir a migração.',
          )
        }
        applyAdminRole(legacyRole === 'admin', false)
      }

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
          applyAdminRole(member, systemAdmin)
          if (!member && activeUid === u.uid) {
            // Vínculo não existe: tenta espelho legado antes de tratar como assinante.
            void applyAdminFromLegacyMirror()
          }
        },
        (error) => {
          if (activeUid !== u.uid) return
          clearAdminTimeout()
          console.warn(
            'Não foi possível ler o vínculo administrativo. Tentando espelho legado.',
          )
          void applyAdminFromLegacyMirror()
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
