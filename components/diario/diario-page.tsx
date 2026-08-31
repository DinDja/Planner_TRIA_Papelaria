'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Registro } from '@/lib/diario/types'
import { EMOCOES } from '@/lib/diario/types'
import {
  isoDia,
  promptDoDia,
  useDiarioStore,
} from '@/lib/diario/use-diario-store'
import { Folha } from './folha'
import { EscreverDialog } from './escrever-dialog'
import { cn } from '@/lib/utils'
import { DiarioGate } from './diario-gate'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'
const FONT_MONO = 'var(--font-geist), system-ui, sans-serif'

// ─── Página ───────────────────────────────────────────────────────────────────

export function DiarioPage() {
  return (
    <DiarioGate>
      <DiarioNotebook />
    </DiarioGate>
  )
}

function DiarioNotebook() {
  const registros = useDiarioStore((s) => s.registros)
  const linhaDoTempo = useDiarioStore((s) => s.linhaDoTempo)
  const fixar = useDiarioStore((s) => s.fixar)
  const remover = useDiarioStore((s) => s.remover)
  // `sequencia` e `episodios` são chamadas que devolvem novo valor a cada
  // invocação (cierto para número/bad — mas o React useSyncExternalStore
  // considera "snapshot mudou" a cada chamada mesmo se o resultado for o
  // mesmo. Causam loop infinito. Memoizamos via `registros` como dep.
  const sequenciFn = useDiarioStore((s) => s.sequencia)
  const episodiosFn = useDiarioStore((s) => s.episodios)
  const sequencia = useMemo(() => sequenciFn(), [sequenciFn, registros])
  const episodios = useMemo(() => episodiosFn(), [episodiosFn, registros])

  const [escreverOpen, setEscreverOpen] = useState(false)
  const [editar, setEditar] = useState<Registro | null>(null)
  const [busca, setBusca] = useState('')

  const hoje = isoDia()
  const temHoje = registros.some((r) => r.periodo === 'dia' && r.data === hoje)
  // Quantos registros você já escreveu no dia de hoje — permite múltiplos,
  // cada um sendo uma parte do dia contada por si só.
  const qtdHoje = registros.filter((r) => r.periodo === 'dia' && r.data === hoje).length
  const prompt = useMemo(() => promptDoDia(), [])
  const timeline = useMemo(() => linhaDoTempo(), [registros])
  const filtrados = useMemo(() => {
    if (!busca.trim()) return timeline
    const q = busca.trim().toLowerCase()
    return timeline.filter(
      (r) =>
        r.titulo?.toLowerCase().includes(q) ||
        r.texto?.toLowerCase().includes(q) ||
        r.notas?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [timeline, busca])
  const emocoesFrequentes = useDiarioStore((s) => s.emocoesFrequentes)
  const topEmocoes = useMemo(() => emocoesFrequentes(3), [emocoesFrequentes, registros])

  const abrirParaEditar = (r: Registro) => {
    setEditar(r)
    setEscreverOpen(true)
  }
  const abrirNovo = () => {
    setEditar(null)
    setEscreverOpen(true)
  }
  const handleFixar = (r: Registro) => fixar(r.id)
  const handleRemover = (r: Registro) => remover(r.id)

  // A primeira folha "dia" de hoje ganha o traço de giz.
  const idMarcado = filtrados.find(
    (r) => r.periodo === 'dia' && r.data === hoje,
  )?.id

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-8 sm:px-8 lg:pt-12">
      <Abertura
        temHoje={temHoje}
        qtdHoje={qtdHoje}
        prompt={prompt.texto}
        sequencia={sequencia}
        episodios={episodios}
        principais={topEmocoes}
        onEscrever={abrirNovo}
      />

      <IndiceMes registros={registros} onSelecionar={abrirParaEditar} />

      {/* Busca — uma linha contínua, sem chrome de toolbar. */}
      <div className="mt-12 mb-10 flex items-end justify-between gap-4 border-b border-border/40 pb-1.5">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="voltar no tempo…"
          className="w-full max-w-sm bg-transparent pb-1 font-serif text-foreground outline-none placeholder:text-muted-foreground/35"
          style={{ fontFamily: FONT_SERIF, fontSize: '1.05rem' }}
        />
        <span className="shrink-0 pb-1 text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground/55">
          {filtrados.length} {filtrados.length === 1 ? 'registo' : 'registros'}
        </span>
      </div>

      {filtrados.length > 0 ? (
        <ol className="flex flex-col">
          {filtrados.map((r, i) => (
            <li
              key={r.id}
              className={cn('relative', i < filtrados.length - 1 && 'mb-2')}
            >
              <Folha
                registro={r}
                marcada={r.id === idMarcado}
                onAbrir={abrirParaEditar}
                onFixar={handleFixar}
                onRemover={handleRemover}
              />
            </li>
          ))}
        </ol>
      ) : (
        <EstadoVazio
          onEscrever={abrirNovo}
          buscando={busca.trim().length > 0}
          prompt={prompt.texto}
        />
      )}

      <ConviteEscrever onEscrever={abrirNovo} visible={!escreverOpen} />

      <EscreverDialog
        open={escreverOpen}
        onClose={() => setEscreverOpen(false)}
        editar={editar}
        periodoInicial="dia"
      />
    </div>
  )
}

// ─── Abertura ─────────────────────────────────────────────────────────────────

function Abertura({
  temHoje,
  qtdHoje,
  prompt,
  sequencia,
  episodios,
  principais,
  onEscrever,
}: {
  temHoje: boolean
  qtdHoje: number
  prompt: string
  sequencia: number
  episodios: number
  principais: { emocao: keyof typeof EMOCOES; n: number }[]
  onEscrever: () => void
}) {
  const agora = new Date()

  return (
    <section className="grid grid-cols-1 gap-y-8 sm:gap-x-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
      {/* Coluna principal — escrever, convidado manuscrito. */}
      <div className="flex flex-col gap-5">
        <p
          className="font-hand text-foreground/85 text-balance"
          style={{ fontFamily: FONT_HAND, fontSize: '2rem', lineHeight: 1.05 }}
        >
          {agora.toLocaleDateString('pt-BR', { weekday: 'long' })},{' '}
          {agora.getDate()} de {agora.toLocaleDateString('pt-BR', { month: 'long' })}
        </p>

        {/* A porta nunca se fecha. Já escreveu? Reconhecemos, mas deixamos
            aberto: é possível escrever de novo, ou voltar a um dia anterior
            que ficou em silêncio. Cada folha é uma parte do dia. */}
        {temHoje ? (
          <div className="flex max-w-[34rem] flex-col gap-5">
            <p
              className="font-serif italic text-muted-foreground"
              style={{ fontFamily: FONT_SERIF, fontSize: '1.15rem' }}
            >
              {qtdHoje === 1
                ? 'Você já escreveu hoje. Voltar aqui é só querer lembrar.'
                : `${qtdHoje} folhas para este dia — cada uma foi sua.`}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-7">
              <button
                type="button"
                onClick={onEscrever}
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground/55 transition-colors group-hover:text-foreground/80">
                  escrever outra
                </span>
                <span
                  className="block border-b border-foreground/15 pb-1 transition-colors group-hover:border-foreground/40"
                  style={{ fontFamily: FONT_HAND, fontSize: '1.15rem' }}
                >
                  a mesma caneta, outra página
                </span>
              </button>
              <button
                type="button"
                onClick={onEscrever}
                className="group flex flex-col gap-1.5 text-left"
              >
                <span className="text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground/55 transition-colors group-hover:text-foreground/80">
                  um dia antes
                </span>
                <span
                  className="block border-b border-foreground/15 pb-1 transition-colors group-hover:border-foreground/40"
                  style={{ fontFamily: FONT_HAND, fontSize: '1.15rem' }}
                >
                  voltar e escrever o que ficou em silêncio
                </span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEscrever}
            className="group flex max-w-[30rem] flex-col gap-3 text-left"
          >
            <span
              className="block border-b border-foreground/15 pb-4 transition-colors group-hover:border-foreground/40"
              style={{ fontFamily: FONT_SERIF, fontSize: '1.25rem', lineHeight: 1.45 }}
            >
              <span
                className="block font-hand text-foreground"
                style={{ fontFamily: FONT_HAND, fontSize: '1.45rem', lineHeight: 1.18 }}
              >
                {prompt}
              </span>
            </span>
            <span className="text-[0.78rem] uppercase tracking-[0.18em] text-muted-foreground/50 transition-colors group-hover:text-foreground/75">
              tomar a caneta
            </span>
          </button>
        )}
      </div>

      {/* Coluna lateral — sinais discretos. Sem "stats" SaaS. */}
      <aside className="flex flex-col gap-7 border-l border-border/40 pl-6 lg:border-l-0 lg:pl-0">
        <Sinal rotulo="sequência">
          <span
            className="font-hand text-foreground"
            style={{ fontFamily: FONT_HAND, fontSize: '1.9rem', lineHeight: 1 }}
          >
            {sequencia}
          </span>
          <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
            {sequencia === 1 ? 'dia seguido' : 'dias seguidos'}
          </span>
        </Sinal>

        <Sinal rotulo="guardado">
          <span
            className="font-hand text-foreground"
            style={{ fontFamily: FONT_HAND, fontSize: '1.9rem', lineHeight: 1 }}
          >
            {episodios}
          </span>
          <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
            {episodios === 1 ? 'registro no caderno' : 'registros no caderno'}
          </span>
        </Sinal>

        {principais.length > 0 && (
          <Sinal rotulo="mais ouvidas dentro de você">
            <ul className="flex flex-col gap-1.5">
              {principais.map(({ emocao, n }) => (
                <li key={emocao} className="flex items-baseline gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 translate-y-px rounded-[1px]"
                    style={{ backgroundColor: EMOCOES[emocao].cor }}
                  />
                  <span
                    className="font-serif italic"
                    style={{ fontFamily: FONT_SERIF }}
                  >
                    {EMOCOES[emocao].rotulo}
                  </span>
                  <span
                    aria-hidden
                    className="not-italic text-[0.7rem] text-muted-foreground/55 tabular-nums"
                  >
                    {n}×
                  </span>
                </li>
              ))}
            </ul>
          </Sinal>
        )}
      </aside>
    </section>
  )
}

function Sinal({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground/45">
        {rotulo}
      </span>
      <div className="flex items-baseline gap-2.5">{children}</div>
    </div>
  )
}

// ─── Índice do mês — cal, não grelha gigante ──────────────────────────────────

function IndiceMes({
  registros,
  onSelecionar,
}: {
  registros: Registro[]
  onSelecionar: (r: Registro) => void
}) {
  const agora = new Date()
  const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const doMes = registros.filter((r) => r.data.startsWith(anoMes))

  if (doMes.length === 0) return null

  const dias = [...new Set(doMes.map((r) => r.data))].sort().reverse()

  return (
    <nav
      aria-label="Índice deste mês"
      className="mt-10 flex flex-col gap-2 border-t border-border/40 pt-5"
    >
      <p className="text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground/55">
        o mês até agora
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem]">
        {dias.map((iso) => {
          const d = new Date(iso + 'T12:00:00')
          const r = doMes.find((x) => x.data === iso)
          if (!r) return null
          const day = d.getDate()
          const weekday = d
            .toLocaleDateString('pt-BR', { weekday: 'short' })
            .replace('.', '')
          return (
            <li key={iso}>
              <button
                type="button"
                onClick={() => onSelecionar(r)}
                className="group flex items-baseline gap-1.5 text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <span
                  className="font-hand text-foreground/85"
                  style={{ fontFamily: FONT_HAND }}
                >
                  {day} {weekday}
                </span>
                <span
                  aria-hidden
                  className="h-1 w-1 -translate-y-0.5 rounded-full bg-current opacity-0 transition-opacity group-hover:opacity-60"
                />
                <span
                  className="hidden text-[0.7rem] text-muted-foreground/50 sm:inline"
                  style={{ fontFamily: FONT_MONO }}
                >
                  {r.titulo ?? (r.periodo === 'dia' ? 'dia' : r.periodo)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <Link
        href="/calendario"
        className="mt-1 self-start text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/45 transition-colors hover:text-foreground"
      >
        ver a agenda inteira →
      </Link>
    </nav>
  )
}

// ─── Estado vazio — interessante, não genérico ────────────────────────────────

function EstadoVazio({
  onEscrever,
  buscando,
  prompt,
}: {
  onEscrever: () => void
  buscando: boolean
  prompt: string
}) {
  if (buscando) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <p
          className="max-w-md font-hand text-muted-foreground/70 text-balance"
          style={{ fontFamily: FONT_HAND, fontSize: '1.5rem' }}
        >
          Nada encontrado com isso — talvez vocês ainda não se conheceram.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-20 text-center">
      <p
        className="max-w-md font-hand text-muted-foreground/75 text-balance"
        style={{ fontFamily: FONT_HAND, fontSize: '1.7rem', lineHeight: 1.15 }}
      >
        Sua primeira página está em branco como esta.
        <br />
        Não é vazio — é convite.
      </p>
      <p
        className="max-w-md font-serif italic text-muted-foreground"
        style={{ fontFamily: FONT_SERIF, fontSize: '1.05rem' }}
      >
        “{prompt}”
      </p>
      <button
        type="button"
        onClick={onEscrever}
        className="rounded border border-foreground/40 px-5 py-2 text-[0.75rem] uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        abrir o caderno
      </button>
    </div>
  )
}

// ─── Convite contínuo à escrita ──────────────────────────────────────────────

function ConviteEscrever({
  onEscrever,
  visible,
}: {
  onEscrever: () => void
  visible: boolean
}) {
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onEscrever}
      className="group fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/60 bg-background/95 px-5 py-2.5 text-left shadow-[0_8px_30px_-12px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all hover:border-foreground/40 md:left-auto md:right-8 md:translate-x-0"
      aria-label="Escrever agora"
    >
      <span
        className="font-hand text-base text-foreground"
        style={{ fontFamily: FONT_HAND }}
      >
        escrever agora
      </span>
      <span
        aria-hidden
        className="font-serif text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
        style={{ fontFamily: FONT_SERIF }}
      >
        →
      </span>
    </button>
  )
}
