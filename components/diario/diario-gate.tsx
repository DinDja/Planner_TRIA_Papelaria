'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useDiarioStore } from '@/lib/diario/use-diario-store'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'

async function hashSenha(senha: string) {
  const bytes = new TextEncoder().encode(senha)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

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
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1180px] items-center px-4 pb-24 pt-10 sm:px-8">
      <section className="w-full max-w-[34rem] border-y border-border/50 py-10 sm:py-14" aria-labelledby="diario-gate-title">
        <div className="mb-8 flex items-start gap-5">
          <div className="relative mt-1 h-16 w-14 shrink-0 border border-foreground/35 bg-background shadow-[5px_5px_0_-1px_var(--background),5px_5px_0_0_color-mix(in_srgb,var(--foreground)_25%,transparent)]" aria-hidden="true">
            <div className="absolute inset-x-2 top-5 border-t border-foreground/20" />
            <div className="absolute inset-x-2 top-9 border-t border-foreground/20" />
            <div className="absolute inset-x-2 top-[3.25rem] border-t border-foreground/20" />
          </div>
          <div>
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground/60">
              diário pessoal
            </p>
            <h1 id="diario-gate-title" className="text-3xl text-foreground" style={{ fontFamily: FONT_HAND }}>
              {configurando ? 'Escolha a chave do caderno' : 'Seu caderno está fechado'}
            </h1>
          </div>
        </div>

        <p className="mb-8 max-w-[30rem] text-base leading-relaxed text-muted-foreground" style={{ fontFamily: FONT_SERIF }}>
          {configurando
            ? 'Crie uma senha para proteger suas anotações. Ela será pedida sempre que você voltar para esta área.'
            : 'Há coisas que só precisam de um lugar seguro para existir. Digite sua senha para continuar.'}
        </p>

        <form className="flex max-w-[28rem] flex-col gap-5" onSubmit={entrar}>
          <label className="flex flex-col gap-2">
            <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/65">
              senha do diário
            </span>
            <span className="relative">
              <input
                autoFocus
                required
                type={senhaVisivel ? 'text' : 'password'}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                autoComplete={configurando ? 'new-password' : 'current-password'}
                className="h-12 w-full border-b border-foreground/30 bg-transparent px-1 pr-11 text-lg text-foreground outline-none transition-colors placeholder:text-muted-foreground/35 focus:border-foreground"
                placeholder="••••••••"
                aria-describedby={erro ? 'diario-gate-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setSenhaVisivel((visible) => !visible)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {senhaVisivel ? <EyeOff size={17} strokeWidth={1.7} /> : <Eye size={17} strokeWidth={1.7} />}
              </button>
            </span>
          </label>

          {configurando && (
            <label className="flex flex-col gap-2">
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/65">
                repetir senha
              </span>
              <span className="relative">
                <input
                  required
                  type={confirmacaoVisivel ? 'text' : 'password'}
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  autoComplete="new-password"
                  className="h-12 w-full border-b border-foreground/30 bg-transparent px-1 pr-11 text-lg text-foreground outline-none transition-colors placeholder:text-muted-foreground/35 focus:border-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setConfirmacaoVisivel((visible) => !visible)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  aria-label={confirmacaoVisivel ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
                >
                  {confirmacaoVisivel ? <EyeOff size={17} strokeWidth={1.7} /> : <Eye size={17} strokeWidth={1.7} />}
                </button>
              </span>
            </label>
          )}

          {erro && (
            <p id="diario-gate-error" role="alert" className="text-sm text-foreground/75">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="self-start border border-foreground/45 px-5 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            {configurando ? 'guardar senha e abrir' : 'abrir meu caderno'}
          </button>
        </form>

      </section>
    </div>
  )
}
