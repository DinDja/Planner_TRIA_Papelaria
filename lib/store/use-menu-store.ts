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

export const DEFAULT_MODULES: ModuleDef[] = [
  { id: 'dashboard',       href: '/',              label: 'Dashboard',      enabled: true },
  { id: 'diario',          href: '/diario',        label: 'Diário',         enabled: true },
  { id: 'notas',           href: '/notas',         label: 'Notas',          enabled: true },
  { id: 'listas',          href: '/listas',        label: 'Listas',         enabled: true },
  { id: 'checklists',      href: '/checklists',    label: 'Checklists',     enabled: true },
  { id: 'wishlist',        href: '/wishlist',       label: 'Wishlist',       enabled: true },
  { id: 'frases',          href: '/frases',         label: 'Frases',         enabled: true },
  { id: 'memorias',        href: '/memorias',       label: 'Memórias',      enabled: true },
  { id: 'cofre',           href: '/cofre',          label: 'Senhas',         enabled: true },
  { id: 'saude',           href: '/saude',          label: 'Saúde',          enabled: true },
  { id: 'rotina',          href: '/rotina',         label: 'Rotina',         enabled: true },
  { id: 'calendario',      href: '/calendario',     label: 'Calendário',    enabled: true },
  { id: 'financas',        href: '/financas',       label: 'Finanças',       enabled: true },
  { id: 'metas',           href: '/metas',          label: 'Metas',          enabled: true },
  { id: 'habitos',         href: '/habitos',        label: 'Hábitos',        enabled: true },
  { id: 'retrospectiva',   href: '/retrospectiva', label: 'Retrospectiva',  enabled: true },
  { id: 'templates',       href: '/templates',     label: 'Templates',      enabled: true },
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
      version: 2,
      // Antes da v2, cada item levava `icon: 'BookHeart'` etc (nome Lucide).
      // O ícone virou derivado de `id` (ver components/icons/modules). Aqui
      // descartamos o campo legado ao reidratar do localStorage.
      //
      // `migrate` (não `merge`) é o lugar correto: roda só quando a `version`
      // muda, recebe o estado velho, e devolve apenas os campos persistidos.
      // As actions ficam de fora — o zustand recria-as ao montar a store.
      migrate: (persisted, _fromVersion) => {
        const p = (persisted as { modules?: ModuleDef[]; [k: string]: unknown }) | undefined
        if (!p || !Array.isArray(p.modules)) {
          return { modules: DEFAULT_MODULES }
        }
        const cleaned = p.modules.map((m) => {
          const { icon: _drop, ...rest } = m as ModuleDef & { icon?: string }
          return rest as ModuleDef
        })
        return { modules: cleaned }
      },
      partialize: (s) => ({ modules: s.modules }),
    },
  ),
)
