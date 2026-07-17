'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

interface ToastCtx {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext value={{ toasts, toast, dismiss }}>
      <ToastBinder />
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-2xl border border-border/60 p-4 shadow-lg glass min-w-[300px] max-w-[420px]',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {t.variant === 'success' ? (
                  <CheckCircle size={18} className="text-emerald-500" />
                ) : t.variant === 'error' ? (
                  <XCircle size={18} className="text-red-500" />
                ) : (
                  <Info size={18} className="text-primary" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}

let toastFn: ToastCtx['toast'] | null = null
let dismissFn: ToastCtx['dismiss'] | null = null

export function ToastBinder() {
  const ctx = useContext(ToastContext)
  toastFn = ctx.toast
  dismissFn = ctx.dismiss
  return null
}

export function toast(t: Omit<Toast, 'id'>) {
  toastFn?.(t)
}

export function dismissToast(id: string) {
  dismissFn?.(id)
}

export function useToast() {
  return useContext(ToastContext)
}
