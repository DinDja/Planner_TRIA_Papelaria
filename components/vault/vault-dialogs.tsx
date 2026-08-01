'use client'

import { usePasswordsStore } from '@/lib/store/use-passwords-store'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input } from '../ui/primitives'
import { toast } from '../ui/toaster'

export function AddPasswordDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const addEntry = usePasswordsStore((s) => s.addEntry)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setUrl('')
    setLogin('')
    setPassword('')
    setNotes('')
  }

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: 'Digite um nome', variant: 'error' })
      return
    }
    if (!password.trim()) {
      toast({ title: 'Digite a senha', variant: 'error' })
      return
    }
    addEntry({
      title: name.trim(),
      url: url.trim() || undefined,
      username: login.trim() || undefined,
      password: password.trim(),
      notes: notes.trim() || undefined,
    })
    toast({ title: 'Senha salva!', variant: 'success' })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nova senha" description="Salve suas senhas com segurança.">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Email, Banco..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Login</label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="email@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="rounded-xl shadow-md">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
