'use client'

import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { NotificationPermissionButton } from '../notifications/reminder-button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    setIos(isIOSDevice())
    const dismissed = sessionStorage.getItem('tria-pwa-install-dismissed') === '1'
    if (!dismissed) window.setTimeout(() => setVisible(true), 1800)

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    sessionStorage.setItem('tria-pwa-install-dismissed', '1')
    setVisible(false)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    setInstallEvent(null)
  }

  return (
    <aside className="fixed bottom-5 left-5 z-50 w-[min(380px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-card p-4 shadow-xl">
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Fechar aviso de instalação">
        <X size={15} />
      </button>
      <div className="pr-5">
        <p className="text-sm font-semibold">Leve o Tria com você</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Instale o planner para abrir mais rápido e receber seus avisos no dispositivo.
        </p>
      </div>
      {ios ? (
        <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-foreground/80">
          No iPhone ou iPad: toque em <Share size={13} className="mx-0.5 inline-block align-[-2px]" /> <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
          <span className="mt-1 block text-muted-foreground">Depois, abra o Tria pela nova tela para ativar os avisos.</span>
        </div>
      ) : installEvent ? (
        <>
          <Button onClick={install} className="mt-3 w-full rounded-xl gap-2">
            <Download size={15} /> Instalar Tria
          </Button>
          <NotificationPermissionButton />
        </>
      ) : (
        <>
          <NotificationPermissionButton />
          <p className="mt-2 text-[11px] text-muted-foreground">O navegador exibirá a opção de instalação quando estiver pronta.</p>
        </>
      )}
    </aside>
  )
}
