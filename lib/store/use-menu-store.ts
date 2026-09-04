import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuloId } from '@/components/icons/modules'

export interface ModuleDef {
  /** Identificador canônico do módulo — também é a chave do ícone. */
  id: ModuloId
  href: string
  label: string
  enabled: boolean
}

const REMOVED_MODULE_IDS = new Set(['retrospectiva', 'templates', 'rotina'])

// O Dashboard vive em /dashboard. O / raiz Ã© reservado para a landing pÃºblica.
const MODULE_HREFS: Partial<Record<ModuloId, string>> = {
  dashboard: '/dashboard',
  diario: '/diario',
  notas: '/notas',
  listas: '/listas',
  checklists: '/checklists',
  wishlist: '/wishlist',
  frases: '/frases',
  memorias: '/memorias',
  cofre: '/cofre',
  saude: '/saude',
  calendario: '/calendario',
  financas: '/financas',
  aniversarios: '/aniversarios',
  habitos: '/habitos',
  plans: '/plans',
  admin: '/admin',
  perfil: '/perfil',
}

export function sanitizeModules(modules: ModuleDef[]): ModuleDef[] {
  return modules
    .filter((module) => !REMOVED_MODULE_IDS.has(module.id))
    .map((module) => ({
      ...module,
      href: MODULE_HREFS[module.id] ?? module.href,
      ...(module.id === 'calendario' ? { label: 'Agenda' } : {}),
    }))
}

export const DEFAULT_MODULES: ModuleDef[] = [
  { id: 'dashboard',       href: '/dashboard',     label: 'Dashboard',      enabled: true },
  { id: 'diario',          href: '/diario',        label: 'Diário',         enabled: true },
  { id: 'notas',           href: '/notas',         label: 'Notas',          enabled: true },
  { id: 'listas',          href: '/listas',        label: 'Listas',         enabled: true },
  { id: 'checklists',      href: '/checklists',    label: 'Checklists',     enabled: true },
  { id: 'wishlist',        href: '/wishlist',       label: 'Wishlist',       enabled: true },
  { id: 'frases',          href: '/frases',         label: 'Frases',         enabled: true },
  { id: 'memorias',        href: '/memorias',       label: 'Memórias',      enabled: true },
  { id: 'cofre',           href: '/cofre',          label: 'Senhas',         enabled: true },
  { id: 'saude',           href: '/saude',          label: 'Saúde',          enabled: true },
  { id: 'calendario',      href: '/calendario',     label: 'Agenda',         enabled: true },
  { id: 'financas',        href: '/financas',       label: 'Finanças',       enabled: true },
  { id: 'aniversarios',    href: '/aniversarios',   label: 'Aniversários',   enabled: true },
  { id: 'habitos',         href: '/habitos',        label: 'Hábitos',        enabled: true },
  { id: 'plans',           href: '/plans',          label: 'Planos',         enabled: true },
  { id: 'admin',           href: '/admin',          label: 'Admin',          enabled: true },
  { id: 'perfil',          href: '/perfil',         label: 'Perfil',         enabled: true },
]

interface MenuState {
  modules: ModuleDef[]

  toggleModule: (id: string) => void
  reorderModules: (fromIdx: number, toIdx: number) => void
  getEnabledModules: () => ModuleDef[]
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      modules: DEFAULT_MODULES,

      toggleModule: (id) =>
        set((s) => ({
          modules: s.modules.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled } : m,
          ),
        })),

      reorderModules: (fromIdx, toIdx) =>
        set((s) => {
          const modules = [...s.modules]
          const [moved] = modules.splice(fromIdx, 1)
          modules.splice(toIdx, 0, moved)
          return { modules }
        }),

      getEnabledModules: () => get().modules.filter((m) => m.enabled),
    }),
    {
      name: 'plannerhub-menu',
      version: 6,
      // Antes da v2, cada item levava `icon: 'BookHeart'` etc (nome Lucide).
      // O ícone virou derivado de `id` (ver components/icons/modules). Aqui
      // descartamos o campo legado ao reidratar do localStorage.
      //
      // v3: a aba "Metas" duplicava as metas financeiras de Finanças e foi
      // removida; "Aniversários" foi adicionada como módulo novo — reentra
      // para quem já tinha o menu persistido.
      // v4: Retrospectiva e Templates deixaram de ser módulos do menu.
      // v5: Rotina foi incorporada à Agenda e deixou de ser item separado.
      //
      // `migrate` (não `merge`) é o lugar correto: roda só quando a `version`
      // muda, recebe o estado velho, e devolve apenas os campos persistidos.
      // As actions ficam de fora — o zustand recria-as ao montar a store.
      migrate: (persisted, _fromVersion) => {
        const raw = persisted as { modules?: ModuleDef[] }
        if (!raw || !Array.isArray(raw.modules)) {
          return { modules: DEFAULT_MODULES }
        }
        const validIds = new Set(DEFAULT_MODULES.map((m) => m.id))
        const cleaned = sanitizeModules(raw.modules
          .map((m) => {
            const { icon: _drop, ...rest } = m as ModuleDef & { icon?: string }
            return rest as ModuleDef
          })
          .filter((m) => m.href !== '/metas')
          .filter((m) => validIds.has(m.id)))
        // Garante que todo módulo padrão exista (reentrada para quem tinha
        // menu persistido antes de um módulo novo ser adicionado).
        for (const def of DEFAULT_MODULES) {
          if (!cleaned.some((m) => m.id === def.id)) {
            cleaned.push(def)
          }
        }
        return { modules: cleaned }
      },
      partialize: (s) => ({ modules: s.modules }),
    },
  ),
)
