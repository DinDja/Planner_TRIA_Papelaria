'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Star, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from '../ui/toaster'

function PricingPage() {
  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Ideal para começar a se organizar.',
      icon: Star,
      color: '#6b7280',
      popular: false,
      features: [
        'Até 2 planners',
        '50 páginas',
        'Stickers limitados',
        'Templates gratuitos',
        'Exportação PNG',
        'Tema claro e escuro',
      ],
    },
    {
      name: 'Premium Mensal',
      price: 'R$ 19,90',
      period: 'por mês',
      description: 'Para quem quer levar a organização a sério.',
      icon: Sparkles,
      color: '#c9b6e4',
      popular: true,
      features: [
        'Planners ilimitados',
        'Páginas ilimitadas',
        'OCR ilimitado',
        'Biblioteca completa de stickers',
        'Upload ilimitado',
        'Templates premium',
        'Exportação PDF/PNG/JPEG',
        'Suporte prioritário',
        'Sincronização',
      ],
    },
    {
      name: 'Premium Anual',
      price: 'R$ 149,90',
      period: 'por ano',
      description: 'Economize 37% com o plano anual.',
      icon: Crown,
      color: '#f0b429',
      popular: false,
      features: [
        'Tudo do Premium Mensal',
        'Economia de R$ 89,90/ano',
        'Acesso antecipado a novos recursos',
        'Badge de apoiador',
      ],
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Planos <span className="text-primary">PlannerHub</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal para sua jornada de organização. Cancele a qualquer momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card
              className={cn(
                'relative h-full flex flex-col',
                plan.popular &&
                  'border-primary/40 shadow-lg ring-2 ring-primary/10',
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold rounded-full">
                  Mais popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: plan.color + '18' }}
                >
                  <plan.icon size={20} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full rounded-2xl',
                  plan.popular ? '' : 'variant-outline',
                )}
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                onClick={() =>
                  toast({
                    title: 'Em breve!',
                    description: 'Pagamento não integrado nesta versão.',
                  })
                }
              >
                {plan.price === 'R$ 0' ? 'Começar grátis' : 'Assinar'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <p className="text-xs text-muted-foreground">
          *Interface ilustrativa. Sem integração com pagamentos.
        </p>
      </div>
    </div>
  )
}

export { PricingPage }
