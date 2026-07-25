'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from '../ui/toaster'
import { useSubscriptionStore, hasAccess, statusLabel } from '@/lib/subscriptions/use-subscription-store'
import { PLANS, PLAN_ORDER, formatBRL } from '@/lib/subscriptions/plan'

function PricingPage() {
  const sub = useSubscriptionStore()
  const isActive = hasAccess(sub)
  const label = statusLabel(sub)

  const handleSubscribe = (planId: 'monthly' | 'annual') => {
    // TODO: integrar com gateway de pagamento (Stripe/Mercado Pago).
    // Por ora, simula o sucesso.
    sub.subscribe(planId)
    toast({
      title: 'Assinatura ativada!',
      description: `${PLANS[planId].label} — ${formatBRL(PLANS[planId].price)}.`,
      variant: 'success',
    })
  }

  const handleCancel = () => {
    sub.cancel()
    toast({
      title: 'Assinatura cancelada',
      description: 'Você ainda tem acesso até o fim do período pago.',
      variant: 'error',
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Topete — sem hero padrão */}
      <div className="mb-10">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground/55">
          assinatura
        </p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">PlannerHub Premium</h1>
        <p className="text-muted-foreground mt-1.5 max-w-lg">
          Tudo pago, sem tier gratuito. Compromisso real com quem leva o caderno a sério.
        </p>
      </div>

      {/* Selo de status atual */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-2">
        <span className={cn(
          'size-2 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40',
        )} />
        <span className="text-sm">
          Status: <span className="font-semibold">{label}</span>
        </span>
        {sub.plan && (
          <span className="text-xs text-muted-foreground">
            · {PLANS[sub.plan].label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {PLAN_ORDER.map((id, i) => {
          const plan = PLANS[id]
          const popular = id === 'annual'
          const isCurrent = sub.plan === id && sub.status === 'active'

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card
                className={cn(
                  'relative h-full flex flex-col',
                  popular && 'border-amber-400/40 shadow-lg ring-2 ring-amber-400/15',
                )}
              >
                {popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 px-4 py-1 text-xs font-semibold rounded-full">
                    Mais escolhido
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: plan.color + '18' }}
                  >
                    {id === 'annual' ? <Crown size={20} style={{ color: plan.color }} /> : <Sparkles size={20} style={{ color: plan.color }} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{plan.label}</h3>
                    {plan.savings && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        {plan.savings}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold">{formatBRL(plan.price)}</span>
                  <span className="text-sm text-muted-foreground ml-1.5">{plan.period}</span>
                </div>

                <p className="text-[11px] text-muted-foreground mb-5">{plan.description}</p>

                <ul className="flex-1 space-y-2.5 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    Todos os módulos do PlannerHub
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    Planners, páginas e stickers ilimitados
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    OCR, exportação e sincronização
                  </li>
                  {id === 'annual' && (
                    <li className="flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      Acesso antecipado a novos recursos
                    </li>
                  )}
                </ul>

                {isCurrent ? (
                  <div className="w-full space-y-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl cursor-default"
                      disabled
                    >
                      Plano atual
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={handleCancel}
                    >
                      Cancelar assinatura
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant={popular ? 'default' : 'outline'}
                    size="lg"
                    className="w-full rounded-2xl"
                    onClick={() => handleSubscribe(id)}
                  >
                    Assinar {formatBRL(plan.price)}
                  </Button>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-10 max-w-3xl">
        * Pagamento ainda não integrado nesta versão. A ativação e o cancelamento
        aqui são locais para demonstração do fluxo de assinatura.
      </p>
    </div>
  )
}

export { PricingPage }
