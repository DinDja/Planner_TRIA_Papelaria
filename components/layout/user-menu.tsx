'use client'

import { Menu as BaseMenu } from '@base-ui/react/menu'
import { useProfileStore } from '@/lib/store/use-profile-store'
import { useAuth } from '@/lib/auth/auth-context'
import { LogOut, Settings, User } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface UserMenuProps {
  onOpenSettings: () => void
}

const itemClass =
  'flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground'

export function UserMenu({ onOpenSettings }: UserMenuProps) {
  const profile = useProfileStore()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast({ title: 'Você saiu da conta', variant: 'default' })
      window.location.replace('/')
    } catch {
      toast({ title: 'Não foi possível sair agora', variant: 'error' })
    }
  }

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Menu da conta"
          >
            <span className="text-base leading-none">{profile.avatar}</span>
            <span className="hidden sm:inline max-w-[110px] truncate">
              {profile.name || 'Meu Perfil'}
            </span>
          </button>
        }
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={6} align="end" className="z-50">
          <BaseMenu.Popup className="min-w-[220px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-lg shadow-black/5">
            <div className="px-2.5 py-2 mb-1 border-b border-border/40">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile.name || 'Olá!'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.email || '—'}
              </p>
            </div>

            <BaseMenu.Item onClick={onOpenSettings} className={itemClass}>
              <Settings size={15} className="text-muted-foreground" />
              Configurações
            </BaseMenu.Item>

            <BaseMenu.LinkItem href="/perfil" className={itemClass}>
              <User size={15} className="text-muted-foreground" />
              Meu perfil
            </BaseMenu.LinkItem>

            <div className="my-1 h-px bg-border/40" />

            <BaseMenu.Item onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer outline-none data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
            >
              <LogOut size={15} />
              Sair da conta
            </BaseMenu.Item>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
