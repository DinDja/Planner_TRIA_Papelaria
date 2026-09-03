'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { GoogleIcon } from './google-icon'

type AuthView = 'login' | 'cadastro' | 'esqueci-senha'

interface AuthFormProps {
  initialView?: AuthView
}

export function AuthForm({ initialView = 'login' }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [view, setView] = useState<AuthView>(initialView)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()
  const search = useSearchParams()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        if (view === 'login') {
          await signIn(email, password)
          const next = search.get('next')
          router.replace(next ? decodeURIComponent(next) : '/dashboard')
        } else if (view === 'cadastro') {
          await signUp(name, email, password)
          router.replace('/dashboard')
        } else if (view === 'esqueci-senha') {
          await resetPassword(email)
          setSubmitted(true)
        }
      } catch (err: any) {
        setError(friendlyError(err?.code || err?.message))
      }
    })
  }

  const handleGoogle = () => {
    setError(null)
    startTransition(async () => {
      try {
        await signInWithGoogle()
        const next = search.get('next')
        router.replace(next ? decodeURIComponent(next) : '/')
      } catch (err: any) {
        setError(friendlyError(err?.code || err?.message))
      }
    })
  }

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
  }

  const order: AuthView[] = ['login', 'cadastro', 'esqueci-senha']
  const [direction, setDirection] = useState(1)

  const switchView = (newView: AuthView) => {
    setDirection(order.indexOf(newView) > order.indexOf(view) ? 1 : -1)
    setSubmitted(false)
    setShowPassword(false)
    setError(null)
    setView(newView)
  }

  return (
    <div className="w-full max-w-[400px]">
      <AnimatePresence mode="wait" custom={direction}>
        {view === 'login' && (
          <motion.div key="login" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <LoginForm onSubmit={handleSubmit} onGoogle={handleGoogle} isPending={isPending}
              showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)}
              onSwitchToRegister={() => switchView('cadastro')} onSwitchToForgot={() => switchView('esqueci-senha')}
              email={email} password={password} onEmail={setEmail} onPassword={setPassword} error={error} />
          </motion.div>
        )}
        {view === 'cadastro' && (
          <motion.div key="cadastro" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <RegisterForm onSubmit={handleSubmit} onGoogle={handleGoogle} isPending={isPending}
              showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)}
              onSwitchToLogin={() => switchView('login')}
              name={name} email={email} password={password}
              onName={setName} onEmail={setEmail} onPassword={setPassword} error={error} />
          </motion.div>
        )}
        {view === 'esqueci-senha' && (
          <motion.div key="esqueci-senha" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {submitted ? (
              <ForgotPasswordSuccess onBack={() => switchView('login')} />
            ) : (
              <ForgotPasswordForm onSubmit={handleSubmit} isPending={isPending} onBack={() => switchView('login')}
                email={email} onEmail={setEmail} error={error} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function friendlyError(codeOrMsg: string): string {
  if (!codeOrMsg) return 'Algo deu errado. Tente novamente.'
  if (codeOrMsg.includes('auth/invalid-credential') || codeOrMsg.includes('auth/wrong-password')) return 'E-mail ou senha incorretos.'
  if (codeOrMsg.includes('auth/user-not-found')) return 'Não existe conta com este e-mail.'
  if (codeOrMsg.includes('auth/email-already-in-use')) return 'Este e-mail já está cadastrado.'
  if (codeOrMsg.includes('auth/invalid-email')) return 'E-mail inválido.'
  if (codeOrMsg.includes('auth/weak-password')) return 'Senha muito fraca (mín. 6 caracteres).'
  if (codeOrMsg.includes('auth/missing-password')) return 'Informe uma senha.'
  if (codeOrMsg.includes('auth/missing-email')) return 'Informe um e-mail.'
  if (codeOrMsg.includes('auth/too-many-requests')) return 'Muitas tentativas. Tente mais tarde.'
  if (codeOrMsg.includes('auth/popup-closed')) return 'Janela do Google fechada.'
  if (codeOrMsg.includes('auth/operation-not-allowed')) return 'Cadastro por e-mail e senha não está ativado. Contate o suporte.'
  if (codeOrMsg.includes('auth/network-request-failed')) return 'Falha de conexão. Verifique sua internet.'
  if (codeOrMsg.includes('auth/internal-error')) return 'Erro interno do servidor de autenticação. Tente novamente.'
  // Mantém o código original visível para diagnóstico — não mascara o erro.
  return codeOrMsg
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div className="mb-5 border-l-2 border-rose-500/70 bg-rose-500/[0.06] pl-3 py-1.5 text-xs text-rose-600 dark:text-rose-300">
      {error}
    </div>
  )
}

const eyebrow = 'font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground/55'
const inputClass =
  'peer h-12 w-full border-0 border-b border-border/70 bg-transparent pt-3 text-sm text-foreground outline-none transition-colors placeholder:opacity-0 focus:border-primary placeholder-shown:border-border placeholder-shown:border-border'

/* ─── Login ────────────────────────────────────────────────────────── */

function LoginForm(props: {
  onSubmit: (e: React.FormEvent) => void
  onGoogle: () => void
  isPending: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onSwitchToRegister: () => void
  onSwitchToForgot: () => void
  email: string
  password: string
  onEmail: (v: string) => void
  onPassword: (v: string) => void
  error: string | null
}) {
  const { onSubmit, onGoogle, isPending, showPassword, onTogglePassword, onSwitchToRegister, onSwitchToForgot, email, password, onEmail, onPassword, error } = props
  return (
    <>
      <Image
        src="/Logo.svg"
        alt="PlannerHub"
        width={156}
        height={88}
        priority
        className="mx-auto mb-10 h-auto w-[156px] opacity-90"
      />

      <div className="mb-9">
        <p className={eyebrow}>entrada · 001</p>
        <h1 className="font-serif text-[2.3rem] leading-[1.05] text-foreground mt-2">
          Bem-vinda de volta.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[320px]">
          Continue de onde parou. Seu caderno está como você deixou.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="e-mail" type="email" value={email} onChange={onEmail} placeholder="voce@email.com" />
        <div>
          <Field label="senha" type={showPassword ? 'text' : 'password'} value={password} onChange={onPassword} placeholder="sua senha"
            trailing={
              <button type="button" onClick={onTogglePassword} className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                {showPassword ? 'ocultar' : 'ver'}
              </button>
            }
          />
          <button type="button" onClick={onSwitchToForgot} className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
            esqueceu a senha?
          </button>
        </div>

        <SubmitButton isPending={isPending} label="entrar" />
      </form>

      <Divider />
      <GoogleButton onGoogle={onGoogle} isPending={isPending} label="entrar com google" />

      <SwitchLine text="ainda não tem conta?" action={onSwitchToRegister} actionLabel="criar a sua" />
    </>
  )
}

/* ─── Cadastro ───────────────────────────────────────────────────── */

function RegisterForm(props: {
  onSubmit: (e: React.FormEvent) => void
  onGoogle: () => void
  isPending: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onSwitchToLogin: () => void
  name: string
  email: string
  password: string
  onName: (v: string) => void
  onEmail: (v: string) => void
  onPassword: (v: string) => void
  error: string | null
}) {
  const { onSubmit, onGoogle, isPending, showPassword, onTogglePassword, onSwitchToLogin, name, email, password, onName, onEmail, onPassword, error } = props
  return (
    <>
      <div className="mb-9">
        <p className={eyebrow}>abertura · 002</p>
        <h1 className="font-serif text-[2.3rem] leading-[1.05] text-foreground mt-2">
          Comece seu caderno.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[320px]">
          Leva menos de um minuto. Depois é só abrir a primeira página.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="seu nome" type="text" value={name} onChange={onName} placeholder="como gosta de ser chamada" />
        <Field label="e-mail" type="email" value={email} onChange={onEmail} placeholder="voce@email.com" />
        <div>
          <Field label="senha" type={showPassword ? 'text' : 'password'} value={password} onChange={onPassword} placeholder="ao menos 6 caracteres"
            trailing={
              <button type="button" onClick={onTogglePassword} className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                {showPassword ? 'ocultar' : 'ver'}
              </button>
            }
          />
        </div>

        <SubmitButton isPending={isPending} label="criar conta" />
      </form>

      <Divider />
      <GoogleButton onGoogle={onGoogle} isPending={isPending} label="cadastrar com google" />

      <SwitchLine text="já tem conta?" action={onSwitchToLogin} actionLabel="fazer login" />
    </>
  )
}

/* ─── Esqueci a senha ─────────────────────────────────────────────── */

function ForgotPasswordForm(props: {
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  onBack: () => void
  email: string
  onEmail: (v: string) => void
  error: string | null
}) {
  const { onSubmit, isPending, onBack, email, onEmail, error } = props
  return (
    <>
      <div className="mb-9">
        <p className={eyebrow}>recuperação · 003</p>
        <h1 className="font-serif text-[2.3rem] leading-[1.05] text-foreground mt-2">
          Esqueceu a senha?
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[320px]">
          Sem problema. Deixe seu e-mail — mandamos um link para você começar de novo.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="e-mail" type="email" value={email} onChange={onEmail} placeholder="voce@email.com" />
        <SubmitButton isPending={isPending} label="enviar link" />
      </form>

      <div className="mt-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="size-3" />
          voltar ao login
        </button>
      </div>
    </>
  )
}

/* ─── Sucesso recuperação ────────────────────────────────────────── */

function ForgotPasswordSuccess({ onBack }: { onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <p className={eyebrow}>recuperação · 003</p>
      <h1 className="font-serif text-[2.3rem] leading-[1.05] text-foreground mt-2 mb-3">Link enviado.</h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[330px]">
        Verifique sua caixa de entrada e siga as instruções do e-mail. Depois é só voltar aqui.
      </p>
      <button onClick={onBack} className="mt-8 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-foreground hover:text-foreground/70 transition-colors cursor-pointer">
        <ArrowLeft className="size-3" />
        voltar ao login
      </button>
    </motion.div>
  )
}

/* ─── Pedaços editoriais ──────────────────────────────────────────── */

function Field({ label, type, value, onChange, placeholder, trailing }: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="relative">
      <label className="pointer-events-none absolute left-0 top-[3px] font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground/55 transition-all peer-focus:text-primary">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, 'peer peer-placeholder-shown:placeholder:opacity-40')}
      />
      {trailing && <div className="absolute right-0 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  )
}

function SubmitButton({ isPending, label }: { isPending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={cn(
        'mt-2 group relative flex h-11 w-full items-center justify-center overflow-hidden',
        'cursor-pointer disabled:cursor-wait',
      )}
    >
      <span className="absolute inset-0 border-b border-foreground/80 transition-colors group-hover:border-primary" />
      <span className={cn(
        'relative font-mono text-[0.66rem] uppercase tracking-[0.3em] text-foreground/85 transition-colors',
        'group-hover:text-primary',
        isPending && 'opacity-50',
      )}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <span className="flex items-center gap-2">{label}<span className="opacity-50">→</span></span>}
      </span>
    </button>
  )
}

function Divider() {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
      <div className="relative flex justify-center">
        <span className="bg-background px-3 font-mono text-[0.58rem] uppercase tracking-[0.28em] text-muted-foreground/45">ou</span>
      </div>
    </div>
  )
}

function GoogleButton({ onGoogle, isPending, label }: { onGoogle: () => void; isPending: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onGoogle}
      disabled={isPending}
      className={cn(
        'flex h-11 w-full items-center justify-center gap-2.5 border border-border/55 transition-colors',
        'hover:border-foreground/40 hover:bg-muted/40 active:translate-y-px cursor-pointer disabled:opacity-60',
      )}
    >
      <GoogleIcon className="size-4" />
      <span className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-foreground/75">{label}</span>
    </button>
  )
}

function SwitchLine({ text, action, actionLabel }: { text: string; action: () => void; actionLabel: string }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground/45">{text}</span>
      <button onClick={action} className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-foreground/85 hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline">
        {actionLabel}
      </button>
    </div>
  )
}
