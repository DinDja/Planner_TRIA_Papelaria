import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ModuleDef {
  id: string
  href: string
  label: string
  icon: string
  enabled: boolean
}

const DEFAULT_MODULES: ModuleDef[] = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: 'LayoutDashboard', enabled: true },
  { id: 'diario', href: '/diario', label: 'Diário', icon: 'BookHeart', enabled: true },
  { id: 'notas', href: '/notas', label: 'Notas', icon: 'FileText', enabled: true },
  { id: 'listas', href: '/listas', label: 'Listas', icon: 'List', enabled: true },
  { id: 'checklists', href: '/checklists', label: 'Checklists', icon: 'ListChecks', enabled: true },
  { id: 'wishlist', href: '/wishlist', label: 'Wishlist', icon: 'Heart', enabled: true },
  { id: 'frases', href: '/frases', label: 'Frases', icon: 'Bookmark', enabled: true },
  { id: 'memorias', href: '/memorias', label: 'Memórias', icon: 'Box', enabled: true },
  { id: 'cofre', href: '/cofre', label: 'Cofre', icon: 'KeyRound', enabled: true },
  { id: 'saude', href: '/saude', label: 'Saúde', icon: 'HeartPulse', enabled: true },
  { id: 'rotina', href: '/rotina', label: 'Rotina', icon: 'ClipboardList', enabled: true },
  { id: 'calendario', href: '/calendario', label: 'Calendário', icon: 'Calendar', enabled: true },
  { id: 'financas', href: '/financas', label: 'Finanças', icon: 'Wallet', enabled: true },
  { id: 'metas', href: '/metas', label: 'Metas', icon: 'Target', enabled: true },
  { id: 'habitos', href: '/habitos', label: 'Hábitos', icon: 'CheckCircle', enabled: true },
  { id: 'retrospectiva', href: '/retrospectiva', label: 'Retrospectiva', icon: 'RefreshCw', enabled: true },
  { id: 'templates', href: '/templates', label: 'Templates', icon: 'BookOpen', enabled: true },
  { id: 'plans', href: '/plans', label: 'Planos', icon: 'BriefcaseBusiness', enabled: true },
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
    { name: 'plannerhub-menu' },
  ),
)
