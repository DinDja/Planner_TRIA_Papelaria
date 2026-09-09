'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
import {
  hasAccess,
  statusLabel,
  useSubscriptionStore,
} from '@/lib/subscriptions/use-subscription-store'
import { PLANS, PLAN_ORDER, formatBRL, type PlanId } from '@/lib/subscriptions/plan'
import {
  cancelSubscriptionFromClient,
  claimInfinitePayPayment,
  startTrialFromClient,
  SubscriptionClientError,
  type PaymentClaimInput,
} from '@/lib/subscriptions/client'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'

async function authenticatedPost<T>(user: User, path: string, body?: unknown): Promise<T> {
  const token = await user.getIdToken()
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = await response.json().catch(() => ({})) as { error?: string } & T
  if (!response.ok) throw new Error(result.error ?? 'Não foi possível concluir a operação.')
  return result
}

function formatAccessDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
}

const RETRYABLE_PAYMENT_CODES = new Set([
  'payment_not_confirmed',
  'verification_unavailable',
  'verification_rejected',
])

async function claimPaymentWithRetry(user: User, input: PaymentClaimInput) {
  const delays = [0, 1_500, 3_000, 5_000]
  let lastError: unknown
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    try {
      return await claimInfinitePayPayment(user, input)
    } catch (error) {
      lastError = error
      if (!(error instanceof SubscriptionClientError) || !RETRYABLE_PAYMENT_CODES.has(error.code)) {
        throw error
      }
    }
  }
  throw lastError
}

function PricingPage() {
  const { user } = useAuth()
  const sub = useSubscriptionStore()
  const callbackHandled = useRef(false)
  const [processingPlan, setProcessingPlan] = useState<PlanId | 'cancel' | 'confirming' | null>(null)
  const isActive = hasAccess(sub)
  const label = statusLabel(sub)
  const accessUntil = formatAccessDate(sub.paidUntil)

  useEffect(() => {
    if (!user || callbackHandled.current) return
    const url = new URL(window.location.href)
    const payment = url.searchParams.get('payment')
    if (!payment) return
    callbackHandled.current = true

    const finishReturn = async () => {
      let keepReturnData = false
      try {
        if (payment === 'success' || payment === 'pending') {
          const orderNsu = url.searchParams.get('order_nsu')
          const transactionNsu = url.searchParams.get('transaction_nsu')
          const slug = url.searchParams.get('slug')
          if (!orderNsu || !transactionNsu || !slug) {
            throw new Error('O retorno do pagamento está incompleto.')
          }

          setProcessingPlan('confirming')
          const subscription = await claimPaymentWithRetry(user, {
            orderNsu,
            transactionNsu,
            slug,
            receiptUrl: url.searchParams.get('receipt_url') ?? undefined,
          })
          sub.setSubscription(subscription)
          toast({
            title: 'Pagamento confirmado',
            description: 'Seu período da Tria Papelaria já está liberado.',
            variant: 'success',
          })
        } else {
          throw new Error('Confira a transação ou tente abrir um novo checkout.')
        }
      } catch (error) {
        const retryable = error instanceof SubscriptionClientError
          && RETRYABLE_PAYMENT_CODES.has(error.code)
        keepReturnData = retryable
        toast({
          title: retryable ? 'Pagamento ainda em confirmação' : 'Não foi possível confirmar o pagamento',
          description: retryable
            ? 'Os dados foram preservados. Atualize esta página para tentar novamente.'
            : error instanceof Error ? error.message : 'Tente novamente em instantes.',
          variant: retryable ? 'default' : 'error',
        })
      } finally {
        if (!keepReturnData) {
          for (const key of ['payment', 'order_nsu', 'transaction_nsu', 'slug', 'receipt_url']) {
            url.searchParams.delete(key)
          }
          window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
        }
        setProcessingPlan(null)
      }
    }
    void finishReturn()
  }, [user, sub])

  const handleChoosePlan = async (planId: PlanId) => {
    if (!user || processingPlan) return
    setProcessingPlan(planId)

    try {
      if (planId === 'trial') {
        const subscription = await startTrialFromClient(user)
        sub.setSubscription(subscription)
        toast({
          title: 'Seu mês grátis começou',
          description: 'Todos os módulos e atualizações estão liberados.',
          variant: 'success',
        })
        setProcessingPlan(null)
        return
      }

      const checkout = await authenticatedPost<{ url: string }>(
        user,
        '/api/payments/infinitepay/checkout',
        { plan: planId },
      )
      window.location.assign(checkout.url)
    } catch (error) {
      toast({
        title: planId === 'trial' ? 'Não foi possível iniciar o teste' : 'Não foi possível abrir o pagamento',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'error',
      })
      setProcessingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!user || processingPlan) return
    setProcessingPlan('cancel')
    try {
      const subscription = await cancelSubscriptionFromClient(user)
      sub.setSubscription(subscription)
      toast({
        title: 'Plano cancelado',
        description: accessUntil
          ? `Seu acesso continua disponível até ${accessUntil}.`
          : 'A assinatura foi cancelada.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Não foi possível cancelar',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
        variant: 'error',
      })
    } finally {
      setProcessingPlan(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-6 lg:p-8">
      <div className="mb-9 max-w-2xl">
        <p
          className="text-sm text-muted-foreground"
          style={{ fontFamily: FONT_HAND, fontSize: '1.15rem' }}
        >
          um jeito simples de começar
        </p>
        <h1
          className="mt-1 text-3xl tracking-tight sm:text-4xl"
          style={{ fontFamily: FONT_SERIF }}
        >
          A Tria inteira, no tempo que fizer sentido para você.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Os três caminhos liberam todos os módulos e todas as atualizações.
          Muda apenas o período e a forma de começar.
        </p>
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border/50 py-3 text-sm">
        <span
          aria-hidden="true"
          className={cn('size-2 rounded-full', isActive ? 'bg-success' : 'bg-muted-foreground/40')}
        />
        <span>
          Sua conta: <span className="font-semibold">{label}</span>
        </span>
        {sub.plan && <span className="text-muted-foreground">· {PLANS[sub.plan].label}</span>}
        {isActive && accessUntil && (
          <span className="text-muted-foreground">· acesso até {accessUntil}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLAN_ORDER.map((id, index) => {
          const plan = PLANS[id]
          const current = sub.plan === id && isActive
          const alreadyUsedTrial = id === 'trial' && Boolean(sub.trialStartedAt) && !current
          const isProcessing = processingPlan === id

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
            >
              <Card
                className={cn(
                  'relative flex h-full flex-col overflow-hidden rounded-xl p-0 shadow-none',
                  id === 'annual' && 'border-warning/50',
                )}
              >
                <div className="h-1" style={{ backgroundColor: plan.color }} />
                <div className="flex h-full flex-col p-5">
                  <div className="mb-6 min-h-24">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-lg font-semibold">{plan.label}</h2>
                      <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/55">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6 border-b border-border/50 pb-5">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold tracking-tight" style={{ fontFamily: FONT_SERIF }}>
                        {id === 'trial' ? 'Grátis' : formatBRL(plan.price)}
                      </span>
                      <span className="pb-1 text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                    {id === 'annual' && (
                      <p className="mt-1 text-xs text-warning">12x de {formatBRL(plan.price / 12)}</p>
                    )}
                  </div>

                  <ul className="mb-7 flex-1 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="grid grid-cols-[12px_1fr] items-start gap-2.5">
                        <span aria-hidden="true" className="mt-[0.48rem] h-px w-3 bg-current opacity-45" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {current ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full cursor-default" disabled>
                        {sub.status === 'cancelled' ? 'Acesso vigente' : 'Seu plano atual'}
                      </Button>
                      {sub.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          disabled={processingPlan === 'cancel'}
                          onClick={handleCancel}
                        >
                          {processingPlan === 'cancel' ? 'Cancelando…' : 'Cancelar plano'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant={id === 'annual' ? 'default' : 'outline'}
                      size="lg"
                      className="w-full"
                      disabled={Boolean(processingPlan) || alreadyUsedTrial}
                      onClick={() => handleChoosePlan(id)}
                    >
                      {alreadyUsedTrial
                        ? 'Teste já utilizado'
                        : isProcessing
                          ? id === 'trial' ? 'Liberando…' : 'Abrindo pagamento…'
                          : id === 'trial'
                            ? 'Começar meu mês grátis'
                            : `Pagar ${formatBRL(plan.price)}`}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Mensal e anual são pagamentos por período no checkout seguro da InfinitePay,
        por Pix ou cartão, sem débito automático.
        O teste grátis dura um mês, pode ser usado uma vez por conta e não solicita cartão.
      </p>
    </div>
  )
}

export { PricingPage }
