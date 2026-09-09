'use client'

import { Bell, BellRing } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { toast } from '../ui/toaster'

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    toast({
      title: 'Avisos não disponíveis neste navegador',
      description: 'Instale o Tria no dispositivo para receber lembretes do sistema.',
      variant: 'error',
    })
    return false
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  if (isIOS && !isInstalled) {
    toast({
      title: 'Instale o Tria no iPhone primeiro',
      description: 'Use Compartilhar → Adicionar à Tela de Início e ative o aviso pelo app instalado.',
      variant: 'error',
    })
    return false
  }

  if (Notification.permission === 'denied') {
    toast({
      title: 'Avisos bloqueados',
      description: 'Permita notificações nas configurações do navegador e tente novamente.',
      variant: 'error',
    })
    return false
  }

  let permission: NotificationPermission
  try {
    permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
  } catch {
    toast({
      title: 'O navegador não permitiu solicitar avisos',
      description: 'Verifique se o Tria está aberto em uma aba segura (HTTPS) e tente novamente.',
      variant: 'error',
    })
    return false
  }

  if (permission !== 'granted') {
    toast({ title: 'Avisos não ativados', description: 'Você pode ativá-los a qualquer momento.', variant: 'error' })
    return false
  }

  return true
}

export function NotificationPermissionButton() {
  const [requesting, setRequesting] = useState(false)
  const [active, setActive] = useState(false)

  const handleClick = async () => {
    setRequesting(true)
    try {
      setActive(await requestNotificationPermission())
    } finally {
      setRequesting(false)
    }
  }

  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={requesting}
      className="mt-3 w-full rounded-xl gap-2"
    >
      {active ? <BellRing size={14} /> : <Bell size={14} />}
      {active ? 'Notificações ativas' : 'Ativar notificações'}
    </Button>
  )
}

export function ReminderButton({
  enabled,
  onEnabledChange,
  description,
  compact = false,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  description?: string
  compact?: boolean
}) {
  const [requesting, setRequesting] = useState(false)

  const handleClick = async () => {
    if (enabled) {
      onEnabledChange(false)
      toast({ title: 'Aviso desativado' })
      return
    }

    setRequesting(true)
    try {
      if (await requestNotificationPermission()) {
        onEnabledChange(true)
        toast({ title: 'Aviso ativado', description: description ?? 'Você será avisado quando chegar a hora.', variant: 'success' })
      }
    } finally {
      setRequesting(false)
    }
  }

  return (
    <Button
      type="button"
      variant={enabled ? 'secondary' : 'outline'}
      size={compact ? 'xs' : 'sm'}
      onClick={handleClick}
      disabled={requesting}
      aria-pressed={enabled}
      title={enabled ? 'Desativar aviso' : 'Ativar aviso'}
      className="rounded-lg gap-1.5"
    >
      {enabled ? <BellRing size={compact ? 12 : 14} /> : <Bell size={compact ? 12 : 14} />}
      <span>{enabled ? 'Avisando' : 'Avise-me'}</span>
    </Button>
  )
}
