'use client'

import { getStroke } from 'perfect-freehand'
import type { Stroke } from '@/lib/types'
import type { Registro } from '@/lib/diario/types'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AnoNumero,
  DataManuscrita,
  EmocoesLinha,
  RotuloMomento,
  RotuloPeriodo,
  TagsLinha,
} from './manuscrito'
import { LinhaDeEnergia } from './linha-de-energia'

const FONT_SERIF = 'var(--font-instrument), Georgia, serif'
const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'

// ─── Helper de traço → path SVG ───────────────────────────────────────────────

function vecToSvg(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  return `M ${pts[0][0]} ${pts[0][1]} L ${pts.slice(1).map((p) => `${p[0]} ${p[1]}`).join(' ')} Z`
}
function strokeToPath(s: Stroke): string {
  try {
    const outline = getStroke(s.points, { size: 4, thinning: 0.5, smoothing: 0.6, streamline: 0.4 })
    return vecToSvg(outline)
  } catch {
    return ''
  }
}
function rabiscoToSvg(rabisco: Stroke[] | undefined) {
  if (!rabisco || rabisco.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of rabisco) {
    for (const p of s.points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
    }
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const pad = 12
  const paths = rabisco.map((s) => strokeToPath(s)).filter(Boolean)
  return { viewBox: `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`, paths }
}

// ─── INTERVALOS ───────────────────────────────────────────────────────────────

function intervaloDeDatas(inicio: string, fim: string | undefined): string {
  if (!fim) return ''
  const fmt = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }
  return `${fmt(inicio)} — ${fmt(fim)}`
}

// ─── FOLHA ────────────────────────────────────────────────────────────────────

export interface FolhaProps {
  registro: Registro
  /** Indica se é a folha inicial do usuário hoje — desenhamos um traço de giz. */
  marcada?: boolean
  className?: string
  onAbrir?: (r: Registro) => void
  onFixar?: (r: Registro) => void
  onRemover?: (r: Registro) => void
}

export function Folha({
  registro,
  marcada = false,
  className,
  onAbrir,
  onFixar,
  onRemover,
}: FolhaProps) {
  const r = registro
  const ehPeriodo = r.periodo !== 'dia'
  const intervalo = ehPeriodo ? intervaloDeDatas(r.data, r.dataFim) : ''

  const rabisco = rabiscoToSvg(r.rabisco)
  const texto = r.texto ?? ''
  const linhas = texto.split('\n')
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0

  return (
    <article
      className={cn('group relative isolate', className)}
      data-marcada={marcada ? '' : undefined}
    >
      {/* Traço de giz — uma marca discreta no topo para o "hoje". */}
      {marcada && (
        <span
          aria-hidden
          className="absolute -top-px left-0 right-0 block h-px"
          style={{
            background:
              'linear-gradient(to right, transparent 4%, var(--primary) 18%, var(--primary) 40%, transparent 70%)',
            opacity: 0.5,
          }}
        />
      )}

      {/* Linha superior discreta — não é "borda de card"; é lombada de bloco. */}
      <div className="border-t border-border/60" />

      {/* Grade: coluna-data esquerda + corpo direito */}
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-6 py-7 px-1 sm:px-3">
        {/* Coluna de data — manuscrita, vertical. */}
        <header className="flex flex-col gap-2 pt-1 text-right">
          <RotuloPeriodo periodo={r.periodo} />
          {ehPeriodo ? (
            <div className="space-y-0.5 leading-tight">
              <span
                className="block font-hand tracking-wide text-foreground"
                style={{ fontFamily: FONT_HAND, fontSize: '1.45rem', lineHeight: 1.05 }}
              >
                {intervaloDeDatasCurto(r.data, r.dataFim)}
              </span>
              <AnoNumero iso={r.data} className="text-[0.7rem]" />
            </div>
          ) : (
            <>
              <DataManuscrita iso={r.data} className="text-[1.6rem]" />
              <div className="flex flex-col items-end gap-0.5 text-[0.7rem] text-muted-foreground/70">
                <AnoNumero iso={r.data} />
                {r.momento && <RotuloMomento momento={r.momento} />}
              </div>
              <LinhaDeEnergia energia={r.energia} cor={r.cor} className="mt-1 justify-end" />
            </>
          )}
        </header>

        {/* Corpo da escrita */}
        <div
          className="cursor-pointer"
          onClick={() => onAbrir?.(r)}
          role="button"
          tabIndex={0}
        >
          {/* Margem numerada — números discretos a cada parágrafo. */}
          <div className="relative">
            {/* Título */}
            {r.titulo && (
              <h2
                className="font-serif font-medium leading-tight mb-3 text-balance"
                style={{ fontFamily: FONT_SERIF, fontSize: '1.55rem' }}
              >
                {r.titulo}
              </h2>
            )}

            {/* Prompt respondido — mostrado como convite manuscrito. */}
            {r.prompt && (
              <p
                className="mb-4 -ml-0.5 font-hand text-muted-foreground/80 text-pretty"
                style={{ fontFamily: FONT_HAND, fontSize: '1.18rem', lineHeight: 1.2 }}
              >
                {r.prompt}
              </p>
            )}

            {/* Emoções */}
            {r.emocoes.length > 0 && (
              <EmocoesLinha emocoes={r.emocoes} className="mb-4 text-[0.95rem]" />
            )}

            {/* Corpo: coisas diferentes por período */}
            {ehPeriodo && r.retro ? (
              <div className="space-y-5">
                <BlocoRetro
                  titulo="fora de mim"
                  itens={r.retro.fora}
                  saldo="·"
                />
                <BlocoRetro
                  titulo="dentro de mim"
                  itens={r.retro.dentro}
                  saldo="·"
                />
                <BlocoRetro
                  titulo="levarei adiante"
                  itens={r.retro.proximo}
                  saldo="→"
                />
                {r.notas && (
                  <p
                    className="ml-px font-serif text-foreground/85 leading-relaxed text-pretty"
                    style={{ fontFamily: FONT_SERIF, fontSize: '1.02rem' }}
                  >
                    {r.notas}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {linhas.map((linha, i) =>
                  linha.trim() ? (
                    <p
                      key={i}
                      className="font-serif text-foreground/85 leading-[1.65] text-pretty"
                      style={{ fontFamily: FONT_SERIF, fontSize: '1.02rem' }}
                    >
                      {linha}
                    </p>
                  ) : (
                    <div key={i} className="h-2.5" aria-hidden />
                  ),
                )}
              </div>
            )}

            {/* Rabisco à mão livre — se houver. */}
            {rabisco && (
              <figure className="mt-5 max-w-xs">
                <svg
                  viewBox={rabisco.viewBox}
                  className="h-auto w-full"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ maxHeight: 140, opacity: 0.92 }}
                >
                  {rabisco.paths.map((d, i) => (
                    <path key={i} d={d} fill="var(--foreground)" stroke="none" opacity={0.78} />
                  ))}
                </svg>
              </figure>
            )}

            {/* Rodapé discreto: tags · palavra · intervalo (saída). */}
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-muted-foreground/55">
              <TagsLinha tags={r.tags} />
              <span className="flex items-center gap-3 tabular-nums">
                {palavras > 0 && <span>{palavras} palavras</span>}
                {intervalo && <span>{intervalo}</span>}
              </span>
            </footer>
          </div>
        </div>

        {/* Ações — discretas, só no hover/foco. Não são "botões de card". */}
        <div className="pointer-events-none absolute right-0 top-3 flex translate-y-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAbrir?.(r) }}
            aria-label="Editar registro"
            title="Editar"
            className="pointer-events-auto flex size-7 items-center justify-center rounded-md border border-border/50 bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFixar?.(r) }}
            aria-label={r.fixado ? 'Desafixar' : 'Fixar no topo'}
            title={r.fixado ? 'Desafixar' : 'Fixar no topo'}
            aria-pressed={r.fixado}
            className={cn(
              'pointer-events-auto flex size-7 items-center justify-center rounded-md border border-border/50 bg-background/70 text-muted-foreground hover:text-foreground hover:border-border transition-colors',
              r.fixado && 'border-primary/50 text-primary hover:text-primary',
            )}
          >
            <Pin size={13} className={r.fixado ? 'fill-primary' : ''} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemover?.(r) }}
            aria-label="Apagar registro"
            title="Apagar"
            className="pointer-events-auto flex size-7 items-center justify-center rounded-md border border-border/50 bg-background/70 text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
          >
            <Trash size={13} />
          </button>
        </div>

        {/* Marca de fixado — um traço manuscrito discreto no canto. */}
        {r.fixado && (
          <span
            aria-hidden
            className="absolute left-1.5 top-7 hidden font-hand text-primary/70 sm:block"
            style={{ fontFamily: FONT_HAND, fontSize: '0.7rem', writingMode: 'vertical-rl' }}
          >
            fixado
          </span>
        )}
      </div>
    </article>
  )
}

// ─── Bloco de retrospectiva ───────────────────────────────────────────────────

function BlocoRetro({
  titulo,
  itens,
  saldo,
}: {
  titulo: string
  itens: string[]
  saldo: string
}) {
  if (itens.length === 0) return null
  return (
    <section>
      <h3
        className="mb-2 text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {titulo}
      </h3>
      <ul className="space-y-1.5">
        {itens.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 font-serif text-foreground/85 text-pretty"
            style={{ fontFamily: FONT_SERIF, fontSize: '1rem', lineHeight: 1.55 }}
          >
            <span aria-hidden className="mt-1 text-muted-foreground/45 text-sm">
              {saldo}
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// helper local — intervalo curto (ex.: "16–22 jul")
function intervaloDeDatasCurto(inicio: string, fim?: string): string {
  if (!fim) {
    const d = new Date(inicio + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }
  const di = new Date(inicio + 'T12:00:00')
  const df = new Date(fim + 'T12:00:00')
  const mesmoMes = di.getMonth() === df.getMonth() && di.getFullYear() === df.getFullYear()
  const ext = (d: Date) => ({
    dia: d.toLocaleDateString('pt-BR', { day: 'numeric' }),
    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  })
  const a = ext(di)
  const b = ext(df)
  if (mesmoMes) return `${a.dia} – ${b.dia} ${b.mes}`
  return `${a.dia} ${a.mes} – ${b.dia} ${b.mes}`
}

// ─── Ícones mínimos inline (sem lucide para estes — menor pegada) ────────────

function Pin({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 3h6l-1 6 3 3H7l3-3-1-6Z" />
    </svg>
  )
}

function Trash({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M5 7l1 13h12l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  )
}
