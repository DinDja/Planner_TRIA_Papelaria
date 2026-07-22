'use client'

import { usePasswordsStore } from '@/lib/store/use-passwords-store'
import type { PasswordEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, Input } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { AddPasswordDialog } from './vault-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

function PasswordCard({
  entry,
  onDelete,
  visiblePasswords,
  toggleVisibility,
}: {
  entry: PasswordEntry
  onDelete: (id: string) => void
  visiblePasswords: Set<string>
  toggleVisibility: (id: string) => void
}) {
  const visible = visiblePasswords.has(entry.id)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: `${label} copiado!`, variant: 'success' })
  }

  return (
    <Card
      glass
      className="overflow-hidden"
      style={{ borderLeft: `4px solid ${entry.color}` }}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 pb-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: entry.color + '18' }}
          >
            <KeyRound size={18} style={{ color: entry.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{entry.title}</CardTitle>
            {entry.category && (
              <Badge
                variant="outline"
                className="text-[9px] mt-1"
                style={{ borderColor: entry.color + '40', color: entry.color }}
              >
                {entry.category}
              </Badge>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </CardHeader>
      <CardContent className="pt-3 space-y-2.5">
        {entry.username && (
          <div className="flex items-center justify-between group/copy">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Usuário</p>
              <p className="text-sm truncate">{entry.username}</p>
            </div>
            <button
              onClick={() => copyToClipboard(entry.username!, 'Usuário')}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/30 opacity-0 group-hover/copy:opacity-100 hover:text-primary transition-all cursor-pointer"
            >
              <Copy size={13} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between group/copy">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Senha</p>
            <p className="text-sm font-mono truncate">
              {visible ? entry.password : '••••••••'}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => toggleVisibility(entry.id)}
              className="rounded-lg p-1.5 text-muted-foreground/30 hover:text-foreground transition-colors cursor-pointer"
            >
              {visible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => copyToClipboard(entry.password, 'Senha')}
              className="rounded-lg p-1.5 text-muted-foreground/30 hover:text-primary transition-colors cursor-pointer"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        {entry.url && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">URL</p>
            <p className="text-xs text-primary truncate">{entry.url}</p>
          </div>
        )}

        {entry.notes && (
          <p className="text-xs text-muted-foreground/80 border-t border-border/30 pt-2 mt-1">
            {entry.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function VaultPage() {
  const entries = usePasswordsStore((s) => s.entries)
  const deleteEntry = usePasswordsStore((s) => s.deleteEntry)
  const masterPin = usePasswordsStore((s) => s.masterPin)
  const setMasterPin = usePasswordsStore((s) => s.setMasterPin)
  const verifyMasterPin = usePasswordsStore((s) => s.verifyMasterPin)

  const [addOpen, setAddOpen] = useState(false)
  const [locked, setLocked] = useState(masterPin !== '')
  const [pinInput, setPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [settingPin, setSettingPin] = useState(masterPin === '')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [showUnlockPin, setShowUnlockPin] = useState(false)

  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleUnlock = () => {
    if (verifyMasterPin(pinInput)) {
      setLocked(false)
      setPinInput('')
    } else {
      toast({ title: 'PIN incorreto', variant: 'error' })
    }
  }

  const handleSetPin = () => {
    if (newPin.length < 4) {
      toast({ title: 'O PIN deve ter ao menos 4 dígitos', variant: 'error' })
      return
    }
    if (newPin !== confirmPin) {
      toast({ title: 'Os PINs não conferem', variant: 'error' })
      return
    }
    setMasterPin(newPin)
    setLocked(true)
    setSettingPin(false)
    setNewPin('')
    setConfirmPin('')
    toast({ title: 'PIN definido com sucesso!', variant: 'success' })
  }

  const handleRemovePin = () => {
    setMasterPin('')
    setLocked(false)
    setSettingPin(true)
    toast({ title: 'Proteção removida', variant: 'success' })
  }

  // Tela de bloqueio
  if (locked) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <Card glass className="w-full max-w-sm">
          <CardHeader className="items-center text-center pb-2">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
              <Lock size={28} className="text-primary" />
            </div>
            <CardTitle className="text-lg">Cofre bloqueado</CardTitle>
            <p className="text-sm text-muted-foreground">Digite seu PIN para acessar</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                type={showUnlockPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Digite o PIN"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="text-center text-lg font-mono tracking-[0.5em] pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowUnlockPin((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                aria-label={showUnlockPin ? 'Ocultar PIN' : 'Exibir PIN'}
              >
                {showUnlockPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Button className="w-full rounded-xl" onClick={handleUnlock} disabled={pinInput.length < 4}>
              <Unlock size={15} className="mr-1.5" />
              Desbloquear
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de configuração de PIN
  if (settingPin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <Card glass className="w-full max-w-sm">
          <CardHeader className="items-center text-center pb-2">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <CardTitle className="text-lg">Proteger o cofre</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crie um PIN para proteger suas credenciais. Ele ficará salvo neste dispositivo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Crie um PIN (4-6 dígitos)"
                className="text-center text-lg font-mono tracking-[0.5em] pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPin ? 'Ocultar PIN' : 'Exibir PIN'}
              >
                {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showConfirmPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirme o PIN"
                className="text-center text-lg font-mono tracking-[0.5em] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                aria-label={showConfirmPin ? 'Ocultar PIN' : 'Exibir PIN'}
              >
                {showConfirmPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Button className="w-full rounded-xl" onClick={handleSetPin} disabled={!newPin || !confirmPin}>
              <ShieldCheck size={15} className="mr-1.5" />
              Proteger cofre
            </Button>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground" onClick={() => setSettingPin(false)}>
              Pular — usar sem proteção
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#e05b6d18' }}
            >
              <KeyRound size={22} style={{ color: '#e05b6d' }} />
            </span>
            Cofre de Credenciais
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas credenciais com segurança.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => { setLocked(true); setVisiblePasswords(new Set()) }}
          >
            <Lock size={14} />
            Bloquear
          </Button>
          {masterPin && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground" onClick={handleRemovePin}>
              Remover PIN
            </Button>
          )}
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Nova credencial
          </Button>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((e) => (
            <PasswordCard
              key={e.id}
              entry={e}
              onDelete={deleteEntry}
              visiblePasswords={visiblePasswords}
              toggleVisibility={toggleVisibility}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <KeyRound size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma credencial salva ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar credencial
          </Button>
        </div>
      )}

      <AddPasswordDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
