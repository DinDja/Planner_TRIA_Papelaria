'use client'

import Image from 'next/image'
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
  Pencil,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { AddPasswordDialog } from './vault-dialogs'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
const authEyebrow = 'font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground/55'
const authInput =
  'peer h-12 w-full border-0 border-b border-border/70 bg-transparent pt-3 text-sm text-foreground outline-none transition-colors placeholder:opacity-0 focus:border-primary placeholder-shown:border-border'

function VaultAccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-12">
      <section className="w-full max-w-[400px]">{children}</section>
    </div>
  )
}

function VaultError({ error }: { error: string }) {
  if (!error) return null

  return (
    <div role="alert" className="mb-5 border-l-2 border-rose-500/70 bg-rose-500/[0.06] py-1.5 pl-3 text-xs text-rose-600 dark:text-rose-300">
      {error}
    </div>
  )
}

function VaultField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus,
  trailing,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
  trailing?: React.ReactNode
}) {
  const id = `vault-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  return (
    <div className="relative">
      <label htmlFor={id} className="pointer-events-none absolute left-0 top-[3px] font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground/55 transition-all peer-focus:text-primary">
        {label}
      </label>
      <input
        id={id}
        autoFocus={autoFocus}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(authInput, 'peer peer-placeholder-shown:placeholder:opacity-40 pr-16')}
      />
      {trailing && <div className="absolute right-0 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  )
}

function VaultSubmitButton({ label }: { label: string }) {
  return (
    <button type="submit" className="group relative mt-2 flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden">
      <span className="absolute inset-0 border-b border-foreground/80 transition-colors group-hover:border-primary" />
      <span className="relative font-mono text-[0.66rem] uppercase tracking-[0.3em] text-foreground/85 transition-colors group-hover:text-primary">
        <span className="flex items-center gap-2">
          {label}
          <span className="opacity-50">→</span>
        </span>
      </span>
    </button>
  )
}

function PasswordCard({
  entry,
  onEdit,
  onDelete,
  visiblePasswords,
  toggleVisibility,
}: {
  entry: PasswordEntry
  onEdit: (id: string) => void
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
        className="group overflow-hidden"
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
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            aria-label="Editar senha"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
            aria-label="Excluir senha"
          >
            <Trash2 size={13} />
          </button>
        </div>
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
  const [editId, setEditId] = useState<string | undefined>()
  const [locked, setLocked] = useState(masterPin !== '')
  const [pinInput, setPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [settingPin, setSettingPin] = useState(masterPin === '')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [showUnlockPin, setShowUnlockPin] = useState(false)
  const [accessError, setAccessError] = useState('')

  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleUnlock = () => {
    setAccessError('')
    if (verifyMasterPin(pinInput)) {
      setLocked(false)
      setPinInput('')
    } else {
      setAccessError('Senha incorreta. Tente novamente.')
    }
  }

  const handleSetPin = () => {
    setAccessError('')
    if (newPin.length < 4) {
      setAccessError('A senha deve ter ao menos 4 caracteres.')
      return
    }
    if (newPin !== confirmPin) {
      setAccessError('As senhas não conferem.')
      return
    }
    setMasterPin(newPin)
    setLocked(true)
    setSettingPin(false)
    setNewPin('')
    setConfirmPin('')
    toast({ title: 'Senha definida com sucesso!', variant: 'success' })
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
      <VaultAccessLayout>
       
        <div className="mb-9">
          <p className={authEyebrow}>entrada · cofre</p>
          <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.05] text-foreground">
            Suas senhas estão protegidas.
          </h1>
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
            Digite sua senha de acesso para continuar.
          </p>
        </div>

        <VaultError error={accessError} />
        <form onSubmit={(event) => { event.preventDefault(); handleUnlock() }} className="space-y-5">
          <VaultField
            autoFocus
            label="senha de acesso"
            type={showUnlockPin ? 'text' : 'password'}
            value={pinInput}
            onChange={setPinInput}
            placeholder="sua senha"
            trailing={
              <button
                type="button"
                onClick={() => setShowUnlockPin((visible) => !visible)}
                className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {showUnlockPin ? 'ocultar' : 'ver'}
              </button>
            }
          />
          <VaultSubmitButton label="desbloquear" />
        </form>
      </VaultAccessLayout>
    )
  }

  // Tela de configuração de senha
  if (settingPin) {
    return (
      <VaultAccessLayout>
        
        <div className="mb-9">
          <p className={authEyebrow}>proteção · cofre</p>
          <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.05] text-foreground">
            Proteja suas senhas.
          </h1>
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
            Crie uma senha de acesso. Ela pode ser diferente da senha da sua conta e ficará salva neste dispositivo.
          </p>
        </div>

        <VaultError error={accessError} />
        <form onSubmit={(event) => { event.preventDefault(); handleSetPin() }} className="space-y-5">
          <VaultField
            autoFocus
            label="crie uma senha"
            type={showPin ? 'text' : 'password'}
            value={newPin}
            onChange={setNewPin}
            placeholder="ao menos 4 caracteres"
            trailing={
              <button
                type="button"
                onClick={() => setShowPin((visible) => !visible)}
                className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {showPin ? 'ocultar' : 'ver'}
              </button>
            }
          />
          <VaultField
            label="repita a senha"
            type={showConfirmPin ? 'text' : 'password'}
            value={confirmPin}
            onChange={setConfirmPin}
            placeholder="confirme sua senha"
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirmPin((visible) => !visible)}
                className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {showConfirmPin ? 'ocultar' : 'ver'}
              </button>
            }
          />
          <VaultSubmitButton label="proteger" />
        </form>
        <button
          type="button"
          className="mt-8 flex w-full cursor-pointer justify-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground/45 transition-colors hover:text-foreground"
          onClick={() => setSettingPin(false)}
        >
          pular · usar sem proteção
        </button>
      </VaultAccessLayout>
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
            Senhas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas senhas com segurança.
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
              Remover senha
            </Button>
          )}
          <Button className="rounded-xl gap-1.5 shadow-md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Nova senha
          </Button>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((e) => (
            <PasswordCard
              key={e.id}
              entry={e}
              onEdit={(id) => { setEditId(id); setAddOpen(true) }}
              onDelete={deleteEntry}
              visiblePasswords={visiblePasswords}
              toggleVisibility={toggleVisibility}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <KeyRound size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma senha salva ainda.</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Adicionar senha
          </Button>
        </div>
      )}

      <AddPasswordDialog
        open={addOpen}
        editId={editId}
        onClose={() => { setAddOpen(false); setEditId(undefined) }}
      />
    </div>
  )
}
