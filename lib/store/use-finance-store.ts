import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CreditCard,
  FinancialGoal,
  FixedBill,
  GoalDeposit,
  Installment,
  SavingsBox,
  Subscription,
  Transaction,
} from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

const dayStr = (offset = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const seedTransactions: Transaction[] = [
  { id: 'tx-seed-1', title: 'Salário Julho', amount: 450000, type: 'income', date: dayStr(-5), category: 'Salário', createdAt: nowISO() },
  { id: 'tx-seed-2', title: 'Freelance site', amount: 150000, type: 'income', date: dayStr(-3), category: 'Freelance', createdAt: nowISO() },
  { id: 'tx-seed-3', title: 'Aluguel', amount: 120000, type: 'expense', date: dayStr(-2), category: 'Moradia', createdAt: nowISO() },
  { id: 'tx-seed-4', title: 'Supermercado mês', amount: 85000, type: 'expense', date: dayStr(-2), category: 'Supermercado', createdAt: nowISO() },
  { id: 'tx-seed-5', title: 'Gasolina', amount: 18000, type: 'expense', date: dayStr(-1), category: 'Transporte', createdAt: nowISO() },
  { id: 'tx-seed-6', title: 'Jantar fora', amount: 8900, type: 'expense', date: dayStr(0), category: 'Lazer', createdAt: nowISO() },
  { id: 'tx-seed-7', title: 'Curso online', amount: 4900, type: 'expense', date: dayStr(0), category: 'Educação', createdAt: nowISO() },
]

const seedFixedBills: FixedBill[] = [
  { id: 'bill-seed-1', title: 'Aluguel', amount: 120000, category: 'Moradia', dayOfMonth: 5, active: true, createdAt: nowISO() },
  { id: 'bill-seed-2', title: 'Internet', amount: 10990, category: 'Moradia', dayOfMonth: 10, active: true, createdAt: nowISO() },
  { id: 'bill-seed-3', title: 'Plano de saúde', amount: 24990, category: 'Saúde', dayOfMonth: 15, active: true, createdAt: nowISO() },
]

const seedSubscriptions: Subscription[] = [
  { id: 'sub-seed-1', name: 'Netflix', amount: 5590, billingCycle: 'monthly', category: 'Lazer', nextBilling: dayStr(5), active: true, createdAt: nowISO() },
  { id: 'sub-seed-2', name: 'Spotify', amount: 2190, billingCycle: 'monthly', category: 'Lazer', nextBilling: dayStr(8), active: true, createdAt: nowISO() },
  { id: 'sub-seed-3', name: 'Academia', amount: 8990, billingCycle: 'monthly', category: 'Saúde', nextBilling: dayStr(1), active: true, createdAt: nowISO() },
]

const seedCards: CreditCard[] = [
  { id: 'card-seed-1', name: 'Nubank', limit: 500000, closingDay: 3, dueDay: 10, color: '#5b8dbf', createdAt: nowISO() },
  { id: 'card-seed-2', name: 'Inter', limit: 300000, closingDay: 15, dueDay: 22, color: '#e05b6d', createdAt: nowISO() },
]

const seedInstallments: Installment[] = [
  { id: 'inst-seed-1', title: 'iPhone 15', totalAmount: 720000, installmentAmount: 60000, totalInstallments: 12, currentInstallment: 4, cardId: 'card-seed-1', category: 'Eletrônicos', createdAt: nowISO() },
  { id: 'inst-seed-2', title: 'Curso de inglês', totalAmount: 240000, installmentAmount: 20000, totalInstallments: 12, currentInstallment: 8, cardId: 'card-seed-2', category: 'Educação', notes: 'Curso 1 ano', createdAt: nowISO() },
]

const seedGoals: FinancialGoal[] = [
  { id: 'goal-seed-1', title: 'Reserva de emergência', targetAmount: 600000, currentAmount: 150000, color: '#7bb686', createdAt: nowISO() },
  { id: 'goal-seed-2', title: 'Viagem para Europa', targetAmount: 1200000, currentAmount: 300000, color: '#5b8dbf', deadline: '2027-06-01', createdAt: nowISO() },
  { id: 'goal-seed-3', title: 'Carro novo', targetAmount: 8000000, currentAmount: 500000, color: '#f0b429', createdAt: nowISO() },
]

const seedBoxes: SavingsBox[] = [
  { id: 'box-seed-1', name: 'Fundo de emergência', targetAmount: 600000, currentAmount: 250000, color: '#7bb686', createdAt: nowISO() },
  { id: 'box-seed-2', name: 'Viagem', targetAmount: 500000, currentAmount: 120000, color: '#5b8dbf', deadline: '2026-12-31', createdAt: nowISO() },
  { id: 'box-seed-3', name: 'Presentes Natal', targetAmount: 200000, currentAmount: 80000, color: '#e05b6d', deadline: '2026-12-20', createdAt: nowISO() },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface FinanceState {
  transactions: Transaction[]
  fixedBills: FixedBill[]
  subscriptions: Subscription[]
  cards: CreditCard[]
  installments: Installment[]
  goals: FinancialGoal[]
  goalDeposits: GoalDeposit[]
  savingsBoxes: SavingsBox[]

  // Transações
  addTransaction: (data: { title: string; amount: number; type: Transaction['type']; date: string; category: string; notes?: string; fixedBillId?: string }) => void
  deleteTransaction: (id: string) => void

  // Contas fixas
  addFixedBill: (data: { title: string; amount: number; category: string; dayOfMonth: number; notes?: string }) => void
  updateFixedBill: (id: string, patch: Partial<FixedBill>) => void
  deleteFixedBill: (id: string) => void

  // Assinaturas
  addSubscription: (data: { name: string; amount: number; billingCycle: Subscription['billingCycle']; category: string; notes?: string }) => void
  toggleSubscription: (id: string) => void
  deleteSubscription: (id: string) => void

  // Cartões
  addCard: (data: { name: string; limit: number; closingDay: number; dueDay: number; color?: string }) => void
  deleteCard: (id: string) => void

  // Parcelamentos
  addInstallment: (data: { title: string; totalAmount: number; installmentAmount: number; totalInstallments: number; cardId: string; category: string; notes?: string }) => void
  advanceInstallment: (id: string) => void
  deleteInstallment: (id: string) => void

  // Metas
  addGoal: (data: { title: string; targetAmount: number; currentAmount?: number; color?: string; deadline?: string; notes?: string }) => void
  updateGoal: (id: string, patch: Partial<FinancialGoal>) => void
  deleteGoal: (id: string) => void
  addGoalDeposit: (data: { goalId: string; amount: number; date?: string; notes?: string }) => void
  getGoalDeposits: (goalId: string) => GoalDeposit[]

  // Caixinhas
  addBox: (data: { name: string; targetAmount: number; currentAmount?: number; color?: string; deadline?: string; notes?: string }) => void
  updateBox: (id: string, patch: Partial<SavingsBox>) => void
  deleteBox: (id: string) => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: seedTransactions,
      fixedBills: seedFixedBills,
      subscriptions: seedSubscriptions,
      cards: seedCards,
      installments: seedInstallments,
      goals: seedGoals,
      goalDeposits: [],
      savingsBoxes: seedBoxes,

      // ── Transações ──────────────────────────────────────────────────
      addTransaction: ({ fixedBillId, ...data }) =>
        set((s) => ({
          transactions: [
            ...s.transactions,
            { id: `tx-${uid()}`, ...data, fixedBillId, createdAt: nowISO() },
          ],
        })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      // ── Contas fixas ────────────────────────────────────────────────
      addFixedBill: (data) =>
        set((s) => ({
          fixedBills: [
            ...s.fixedBills,
            { id: `bill-${uid()}`, ...data, active: true, createdAt: nowISO() },
          ],
        })),
      updateFixedBill: (id, patch) =>
        set((s) => ({
          fixedBills: s.fixedBills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      deleteFixedBill: (id) =>
        set((s) => ({ fixedBills: s.fixedBills.filter((b) => b.id !== id) })),

      // ── Assinaturas ─────────────────────────────────────────────────
      addSubscription: (data) =>
        set((s) => ({
          subscriptions: [
            ...s.subscriptions,
            {
              id: `sub-${uid()}`,
              ...data,
              nextBilling: dayStr(0),
              active: true,
              createdAt: nowISO(),
            },
          ],
        })),
      toggleSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, active: !sub.active } : sub,
          ),
        })),
      deleteSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
        })),

      // ── Cartões ─────────────────────────────────────────────────────
      addCard: ({ color = '#5b8dbf', ...data }) =>
        set((s) => ({
          cards: [
            ...s.cards,
            { id: `card-${uid()}`, ...data, color, createdAt: nowISO() },
          ],
        })),
      deleteCard: (id) =>
        set((s) => ({
          cards: s.cards.filter((c) => c.id !== id),
          installments: s.installments.filter((inst) => inst.cardId !== id),
        })),

      // ── Parcelamentos ───────────────────────────────────────────────
      addInstallment: (data) =>
        set((s) => ({
          installments: [
            ...s.installments,
            { id: `inst-${uid()}`, ...data, currentInstallment: 1, createdAt: nowISO() },
          ],
        })),
      advanceInstallment: (id) =>
        set((s) => ({
          installments: s.installments.map((inst) =>
            inst.id === id && inst.currentInstallment < inst.totalInstallments
              ? { ...inst, currentInstallment: inst.currentInstallment + 1 }
              : inst,
          ),
        })),
      deleteInstallment: (id) =>
        set((s) => ({
          installments: s.installments.filter((inst) => inst.id !== id),
        })),

      // ── Metas ──────────────────────────────────────────────────────
      addGoal: ({ color = '#7bb686', currentAmount = 0, ...data }) =>
        set((s) => {
          const id = `goal-${uid()}`
          const deposits: GoalDeposit[] = currentAmount > 0
            ? [{ id: `gdep-${uid()}`, goalId: id, amount: currentAmount, date: dayStr(0), notes: 'Aporte inicial', createdAt: nowISO() }]
            : []
          return {
            goals: [...s.goals, { id, ...data, color, currentAmount, createdAt: nowISO() }],
            goalDeposits: [...s.goalDeposits, ...deposits],
          }
        }),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          goalDeposits: s.goalDeposits.filter((d) => d.goalId !== id),
        })),
      addGoalDeposit: ({ goalId, amount, date, notes }) =>
        set((s) => {
          if (amount === 0) return s
          const deposit: GoalDeposit = {
            id: `gdep-${uid()}`,
            goalId,
            amount,
            date: date ?? dayStr(0),
            notes,
            createdAt: nowISO(),
          }
          return {
            goalDeposits: [...s.goalDeposits, deposit],
            goals: s.goals.map((g) =>
              g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g,
            ),
          }
        }),
      getGoalDeposits: (goalId) => get().goalDeposits.filter((d) => d.goalId === goalId),

      // ── Caixinhas ──────────────────────────────────────────────────
      addBox: ({ color = '#7bb686', currentAmount = 0, ...data }) =>
        set((s) => ({
          savingsBoxes: [
            ...s.savingsBoxes,
            { id: `box-${uid()}`, ...data, color, currentAmount, createdAt: nowISO() },
          ],
        })),
      updateBox: (id, patch) =>
        set((s) => ({
          savingsBoxes: s.savingsBoxes.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      deleteBox: (id) =>
        set((s) => ({
          savingsBoxes: s.savingsBoxes.filter((b) => b.id !== id),
        })),
    }),
    { name: 'plannerhub-finance' },
  ),
)
