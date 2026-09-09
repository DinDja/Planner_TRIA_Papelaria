import { describe, expect, it } from 'vitest'
import { PLANS, monthlyEquivalent } from '@/lib/subscriptions/plan'
import { addMonthsClamped, getPlanPeriodEnd } from '@/lib/subscriptions/period'
import {
  isConfirmedPayment,
  isTrustedInfinitePayCheckoutUrl,
} from '@/lib/payments/infinitepay'

describe('catálogo de planos', () => {
  it('mantém a economia anual de R$ 60 em relação a doze mensalidades', () => {
    expect(PLANS.monthly.price * 12 - PLANS.annual.price).toBe(6000)
    expect(monthlyEquivalent(PLANS.annual.price, 'annual')).toBe(2500)
  })

  it('oferece um mês grátis sem cartão e com os mesmos acessos', () => {
    expect(PLANS.trial.price).toBe(0)
    expect(PLANS.trial.features).toContain('Acesso a todos os módulos')
    expect(PLANS.trial.features).toContain('Acesso a todas as atualizações')
    expect(PLANS.trial.features).toContain('Não precisa de cartão para testar')
  })
})

describe('períodos de assinatura', () => {
  it('limita corretamente o fim de um mês iniciado no dia 31', () => {
    const start = new Date('2026-01-31T15:30:00.000Z')
    expect(addMonthsClamped(start, 1).toISOString()).toBe('2026-02-28T15:30:00.000Z')
  })

  it('cria um ano completo para o plano anual', () => {
    const start = new Date('2026-09-09T12:00:00.000Z')
    expect(getPlanPeriodEnd('annual', start).toISOString()).toBe('2027-09-09T12:00:00.000Z')
  })
})

describe('validação da InfinitePay', () => {
  it('só confirma pagamento aprovado com o valor exato do pedido', () => {
    expect(isConfirmedPayment({ success: true, paid: true, amount: 3000 }, 3000)).toBe(true)
    expect(isConfirmedPayment({ success: true, paid: true, amount: 1 }, 3000)).toBe(false)
    expect(isConfirmedPayment({ success: true, paid: false, amount: 3000 }, 3000)).toBe(false)
  })

  it('aceita somente URLs HTTPS pertencentes à InfinitePay', () => {
    expect(isTrustedInfinitePayCheckoutUrl('https://checkout.infinitepay.com.br/pagar')).toBe(true)
    expect(isTrustedInfinitePayCheckoutUrl('https://buy.infinitepay.io/pagar')).toBe(true)
    expect(isTrustedInfinitePayCheckoutUrl('https://infinitepay.io.evil.test/pagar')).toBe(false)
    expect(isTrustedInfinitePayCheckoutUrl('http://checkout.infinitepay.com.br/pagar')).toBe(false)
  })
})
