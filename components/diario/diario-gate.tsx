'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useState } from 'react'
import { useDiarioStore } from '@/lib/diario/use-diario-store'
import { cn } from '@/lib/utils'

async function hashSenha(senha: string) {
  const bytes = new TextEncoder().encode(senha)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const eyebrow = 'font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground/55'
const inputClass =
  'peer h-12 w-full border-0 border-b border-border/70 bg-transparent pt-3 text-base text-foreground outline-none transition-colors placeholder:opacity-0 focus:border-primary placeholder-shown:border-border'

export function DiarioGate({ children }: { children: React.ReactNode }) {
  const senhaHash = useDiarioStore((state) => state.senhaHash)
  const definirSenha = useDiarioStore((state) => state.definirSenha)
  const [pronto, setPronto] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false)
  const [erro, setErro] = useState('')

  // Mantém a página fechada no primeiro render e em toda nova entrada na rota.
  useEffect(() => setPronto(true), [])

  const configurando = !senhaHash

  const entrar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErro('')

    if (senha.length < 4) {
      setErro('Escolha uma senha com pelo menos 4 caracteres.')
      return
    }

    if (configurando && senha !== confirmacao) {
      setErro('As senhas ainda não coincidem.')
      return
    }

    const hash = await hashSenha(senha)
    if (configurando) {
      definirSenha(hash)
      setAberto(true)
    } else if (hash === senhaHash) {
      setAberto(true)
    } else {
      setErro('Essa senha não abre o caderno. Tente novamente.')
    }
  }

  if (!pronto) return null
  if (aberto) return <>{children}</>

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-6 py-12">
      <section className="w-full max-w-[400px]" aria-labelledby="diario-gate-title">    
        <div className="mb-9">
          <p className={eyebrow}>{configurando ? 'abertura · diário' : 'entrada · diário'}</p>
          <h1 id="diario-gate-title" className="mt-2 font-serif text-[2.3rem] leading-[1.05] text-foreground">
            {configurando ? 'Escolha a chave.' : 'Seu caderno está fechado.'}
          </h1>
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
            {configurando
              ? 'Crie uma senha para proteger suas anotações. Ela será pedida sempre que você voltar para esta área.'
              : 'Há coisas que só precisam de um lugar seguro para existir. Digite sua senha para continuar.'}
          </p>
        </div>

        <DiarioError error={erro} />

        <form onSubmit={entrar} className="space-y-5">
          <DiarioField
            autoFocus
            label="senha do diário"
            type={senhaVisivel ? 'text' : 'password'}
            value={senha}
            onChange={setSenha}
            placeholder="sua senha"
            autoComplete={configurando ? 'new-password' : 'current-password'}
            describedBy={erro ? 'diario-gate-error' : undefined}
            trailing={
              <button
                type="button"
                onClick={() => setSenhaVisivel((visible) => !visible)}
                className="cursor-pointer font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {senhaVisivel ? 'ocultar' : 'ver'}
              </button>
            }
          />

          {configurando && (
            <DiarioField
              label="repetir senha"
              type={confirmacaoVisivel ? 'text' : 'password'}
              value={confirmacao}
              onChange={setConfirmacao}
              placeholder="repita sua senha"
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setConfirmacaoVisivel((visible) => !visible)}
                  className="cursor-pointer font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {confirmacaoVisivel ? 'ocultar' : 'ver'}
                </button>
              }
            />
          )}

          <DiarioSubmitButton label={configurando ? 'guardar senha e abrir' : 'abrir meu caderno'} />
        </form>
      </section>
    </div>
  )
}

function DiarioError({ error }: { error: string }) {
  if (!error) return null

  return (
    <div id="diario-gate-error" role="alert" className="mb-5 border-l-2 border-destructive/70 bg-destructive/[0.06] py-1.5 pl-3 text-xs text-destructive">
      {error}
    </div>
  )
}

function DiarioField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  describedBy,
  trailing,
}: {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  autoFocus?: boolean
  describedBy?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="relative">
      <label className="pointer-events-none absolute left-0 top-[3px] font-mono text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground/55 transition-all peer-focus:text-primary">
        {label}
      </label>
      <input
        autoFocus={autoFocus}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        className={cn(inputClass, 'peer peer-placeholder-shown:placeholder:opacity-40 pr-16')}
      />
      {trailing && <div className="absolute right-0 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  )
}

function DiarioSubmitButton({ label }: { label: string }) {
  return (
    <button type="submit" className="group relative mt-2 flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden">
      <span className="absolute inset-0 border-b border-foreground/80 transition-colors group-hover:border-primary" />
      <span className="relative font-mono text-[0.78rem] uppercase tracking-[0.3em] text-foreground/85 transition-colors group-hover:text-primary">
        <span className="flex items-center gap-2">
          {label}
          <span className="opacity-50">→</span>
        </span>
      </span>
    </button>
  )
}
