'use client'

/**
 * Mapa de rotas -> coleções que aquela rota precisa ler do Firestore.
 *
 * Isto é o coração do lazy loading: em vez de mantermos 35 `onSnapshot`
 * ativos desde o login (arranque glukoso do StoreSyncProvider antigo),
 * ouvimos apenas as coleções que a página atual consome. Quando o
 * usuário navega, a coleção antiga é dessubs crita e a nova é aberta.
 *
 * Sem isto, qualquer edição numa coleção suja snapshots de TODAS as
 * outras 34 ( Firestore não é granular ) e dispara write-throughs
 * em cascata — milhares de leituras em segundos.
 *
 * Este mapa foi derivado traçando, para cada `app/(app)/<rota>/page.tsx`
 * -> `<Componente>Page` em `components/`, quais `useXStore` são lidos.
 *
 * Coleções não-listadas aqui (ex.: `noteFolders`, que é `read:false`)
 * nunca precisam de onSnapshot; write-through ainda funciona
 * controlado pelo `write:true` no COL_BINDINGS.
 */

import type { User } from 'firebase/auth'

export type RouteCollectionPlan = {
  /** coleções a abrir onSnapshot (read). */
  collections: string[]
  /** campos do root doc (users/{uid}) a aplicar no snapshot. vazio = nenhum. */
  rootFields?: string[]
}

const always: string[] = [] // coleções que sempre precisamos? nenhuma — root doc resolve as essenciais.

// ── Mapa pathname -> plano ──────────────────────────────────────────

const PLAN: Array<{ match: RegExp; plan: RouteCollectionPlan }> = [
  // Dashboard agrega sinta do diário + calendário + metas + planners.
  // Não quantitativamente barato, mas honesto sobre o que a home mostra.
  {
    match: /^\/(|dashboard)$/,
    plan: {
      collections: ['planners', 'diarios', 'calendarEvents', 'financialGoals'],
      rootFields: ['name', 'avatar', 'theme', 'modules'],
    },
  },
  {
    match: /^\/diario$/,
    plan: {
      collections: ['diarios'],
      rootFields: ['theme', 'onboarded', 'diarioPasswordHash'],
    },
  },
  {
    match: /^\/notas$/,
    plan: {
      collections: ['notes'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/listas$/,
    plan: {
      collections: ['shoppingLists'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/checklists$/,
    plan: {
      collections: ['checklists'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/wishlist$/,
    plan: {
      collections: ['wishlist'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/frases$/,
    plan: {
      collections: ['quotes'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/memorias$/,
    plan: {
      collections: ['memories'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/cofre$/,
    plan: {
      collections: ['passwords'],
      rootFields: ['theme', 'masterPin'],
    },
  },
  {
    match: /^\/saude$/,
    plan: {
      collections: [
        'weights',
        'bodyMeasurements',
        'symptomLogs',
        'medications',
        'cycleRecords',
        'doctors',
        'appointments',
        'exams',
      ],
      rootFields: ['theme', 'height', 'goalWeight', 'sex', 'onboarded'],
    },
  },
  {
    match: /^\/rotina$/,
    plan: {
      collections: ['tasks', 'recurringTasks', 'pendingItems', 'routineSlots'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/calendario$/,
    plan: {
      collections: ['calendarEvents'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/financas$/,
    plan: {
      collections: [
        'financialAccounts',
        'transactions',
        'fixedBills',
        'subscriptions',
        'creditCards',
        'installments',
        'financialGoals',
        'goalDeposits',
        'savingsBoxes',
      ],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/aniversarios$/,
    plan: {
      collections: ['birthdays'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/metas$/,
    plan: {
      collections: ['financialGoals', 'goalDeposits', 'savingsBoxes'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/habitos$/,
    plan: {
      collections: ['habits', 'habitLogs'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/retrospectiva$/,
    plan: {
      collections: ['retroEntries', 'journalEntries'],
      rootFields: ['theme'],
    },
  },
  // Templates lista planners (write:false no sync, mas precisa do read).
  {
    match: /^\/templates$/,
    plan: {
      collections: ['planners'],
      rootFields: ['theme', 'folders'],
    },
  },
  // Plans/admin usam só o root doc (subscription.*) e coleções globais fora do provider.
  {
    match: /^\/plans$/,
    plan: {
      collections: [],
      rootFields: ['subscription.role', 'subscription.plan', 'subscription.status', 'subscription.since', 'subscription.lastPayment'],
    },
  },
  {
    match: /^\/admin$/,
    plan: {
      collections: [],
      rootFields: ['subscription.role', 'subscription.plan', 'subscription.status'],
    },
  },
  {
    match: /^\/perfil$/,
    plan: {
      collections: [],
      rootFields: ['name', 'avatar', 'email', 'theme', 'modules', 'subscription.role', 'subscription.plan', 'subscription.status'],
    },
  },
  {
    match: /^\/conta$/,
    plan: {
      collections: [],
      rootFields: ['name', 'avatar', 'email', 'theme', 'modules'],
    },
  },
  {
    match: /^\/menu$/,
    plan: {
      collections: [],
      rootFields: ['modules', 'theme'],
    },
  },
  {
    match: /^\/lixeira$/,
    plan: {
      collections: ['trashItems'],
      rootFields: ['theme'],
    },
  },
  {
    match: /^\/pastas\/[^/]+$/,
    plan: {
      collections: ['planners'],
      rootFields: ['folders', 'theme'],
    },
  },
  {
    match: /^\/tags\/[^/]+$/,
    plan: {
      collections: ['planners'],
      rootFields: ['plannerTags', 'theme'],
    },
  },
]

// Editor /planner/[id] — fora do route group (app), chama o provider inline.
export const EDITOR_PLAN: RouteCollectionPlan = {
  collections: ['planners'],
  rootFields: ['theme', 'folders', 'plannerTags'],
}

/**
 * Retorna o plano de coleções/rootFields para um pathname.
 * Sempre retorna um objeto (vazio se nada casa) — representa
 * "nenhum listener ativo", o que é válido para rotas públicas.
 */
export function resolveRoutePlan(pathname: string): RouteCollectionPlan {
  for (const { match, plan } of PLAN) {
    if (match.test(pathname)) {
      return { collections: [...plan.collections, ...always], rootFields: plan.rootFields }
    }
  }
  return { collections: [...always], rootFields: [] }
}

/**
 * Coleções "de carregamento preguiçoso": só abrimos o listener quando
 * a página correspondente está ativa. Cada mudança de rota só paga
 * 1-8 onSnapshots em vez dos 35 do arranque antigo.
 *
 * Esta função é exportada para teste e auditoria.
 */
export function minimalCollectionSet(_user: User, pathname: string): Set<string> {
  return new Set(resolveRoutePlan(pathname).collections)
}
