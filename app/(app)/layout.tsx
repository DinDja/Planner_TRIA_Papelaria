import { AppShell } from '@/components/layout/app-shell'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreSyncProvider } from '@/components/providers/store-sync-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <StoreSyncProvider>
        <AppShell>{children}</AppShell>
      </StoreSyncProvider>
    </RequireAuth>
  )
}
