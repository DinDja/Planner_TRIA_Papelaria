'use client'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { CommandPalette } from '@/components/layout/command-palette'
import { TopBar } from '@/components/layout/top-bar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/overlays'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { CreatePlannerDialog } from '@/components/dashboard/create-planner-dialog'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sideCollapsed, setSideCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const openCreate = useCallback(() => setCreateOpen(true), [])
  const openSettings = useCallback(() => setSettingsOpen(true), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
      // Atalho: Ctrl/Cmd + , abre configurações
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        collapsed={sideCollapsed}
        setCollapsed={setSideCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenCreate={openCreate}
        onOpenSettings={openSettings}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onToggleSidebar={() => setMobileOpen((v) => !v)}
          onOpenCommand={() => setCmdOpen(true)}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <CreatePlannerDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
