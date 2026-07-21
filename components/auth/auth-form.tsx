'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthView = 'login' | 'cadastro' | 'esqueci-senha'

interface AuthFormProps {
  initialView?: AuthView
}

export function AuthForm({ initialView = 'login' }: AuthFormProps) {
  const [view, setView] = useState<AuthView>(initialView)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      setTimeout(() => {
        if (view === 'esqueci-senha') {
          setSubmitted(true)
        } else {
          router.push('/')
        }
      }, 1200)
    })
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
    }),
  }

  const getDirection = (from: AuthView, to: AuthView) => {
    const order: AuthView[] = ['login', 'cadastro', 'esqueci-senha']
    return order.indexOf(to) > order.indexOf(from) ? 1 : -1
  }

  const [direction, setDirection] = useState(1)

  const switchView = (newView: AuthView) => {
    setDirection(getDirection(view, newView))
    setSubmitted(false)
    setShowPassword(false)
    setView(newView)
  }

  return (
    <div className="w-full max-w-[400px]">
      <AnimatePresence mode="wait" custom={direction}>
        {view === 'login' && (
          <motion.div
            key="login"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <LoginForm
              onSubmit={handleSubmit}
              isPending={isPending}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSwitchToRegister={() => switchView('cadastro')}
              onSwitchToForgot={() => switchView('esqueci-senha')}
            />
          </motion.div>
        )}

        {view === 'cadastro' && (
          <motion.div
            key="cadastro"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <RegisterForm
              onSubmit={handleSubmit}
              isPending={isPending}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSwitchToLogin={() => switchView('login')}
            />
          </motion.div>
        )}

        {view === 'esqueci-senha' && (
          <motion.div
            key="esqueci-senha"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {submitted ? (
              <ForgotPasswordSuccess onBack={() => switchView('login')} />
            ) : (
              <ForgotPasswordForm
                onSubmit={handleSubmit}
                isPending={isPending}
                onBack={() => switchView('login')}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Login Form ───────────────────────────────────────────────────────────── */

function LoginForm({
  onSubmit,
  isPending,
  showPassword,
  onTogglePassword,
  onSwitchToRegister,
  onSwitchToForgot,
}: {
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onSwitchToRegister: () => void
  onSwitchToForgot: () => void
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-1">
          Bem-vinda de volta
        </h1>
        <p className="text-muted-foreground text-sm">
          Entre na sua conta para continuar planejando
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="seu@email.com"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <button
              type="button"
              onClick={onSwitchToForgot}
              className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all',
            'hover:bg-primary/85 active:translate-y-px',
            'disabled:pointer-events-none disabled:opacity-60',
            'cursor-pointer shadow-sm shadow-primary/20',
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Entrar
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      <button
        type="button"
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-sm font-medium transition-all',
          'hover:bg-muted/60 active:translate-y-px',
          'cursor-pointer',
        )}
      >
        <GoogleIcon className="size-4" />
        Entrar com Google
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Criar conta
          </button>
        </p>
      </div>
    </>
  )
}

/* ─── Register Form ────────────────────────────────────────────────────────── */

function RegisterForm({
  onSubmit,
  isPending,
  showPassword,
  onTogglePassword,
  onSwitchToLogin,
}: {
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onSwitchToLogin: () => void
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-1">
          Crie sua conta
        </h1>
        <p className="text-muted-foreground text-sm">
          Comece a organizar sua vida com estilo
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Seu nome"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="seu@email.com"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Mínimo de 8 caracteres
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all',
            'hover:bg-primary/85 active:translate-y-px',
            'disabled:pointer-events-none disabled:opacity-60',
            'cursor-pointer shadow-sm shadow-primary/20',
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Criar conta
              <Sparkles className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      <button
        type="button"
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card text-sm font-medium transition-all',
          'hover:bg-muted/60 active:translate-y-px',
          'cursor-pointer',
        )}
      >
        <GoogleIcon className="size-4" />
        Cadastrar com Google
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Fazer login
          </button>
        </p>
      </div>
    </>
  )
}

/* ─── Forgot Password Form ─────────────────────────────────────────────────── */

function ForgotPasswordForm({
  onSubmit,
  isPending,
  onBack,
}: {
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  onBack: () => void
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-1">
          Esqueceu a senha?
        </h1>
        <p className="text-muted-foreground text-sm">
          Informe seu e-mail e enviaremos um link para redefinir sua senha
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="seu@email.com"
              required
              className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all',
            'hover:bg-primary/85 active:translate-y-px',
            'disabled:pointer-events-none disabled:opacity-60',
            'cursor-pointer shadow-sm shadow-primary/20',
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Enviar link de redefinição'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Voltar ao login
        </button>
      </div>
    </>
  )
}

/* ─── Forgot Password Success ──────────────────────────────────────────────── */

function ForgotPasswordSuccess({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center py-8"
    >
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" />
      </div>
      <h1 className="font-serif text-2xl text-foreground mb-2">
        Link enviado!
      </h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-[300px] mx-auto">
        Verifique sua caixa de entrada e clique no link para redefinir sua senha
      </p>
      <button
        onClick={onBack}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 text-sm font-medium transition-all',
          'hover:bg-primary/85 active:translate-y-px',
          'cursor-pointer shadow-sm shadow-primary/20',
        )}
      >
        <ArrowLeft className="size-4" />
        Voltar ao login
      </button>
    </motion.div>
  )
}

/* ─── Google Icon ──────────────────────────────────────────────────────────── */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
