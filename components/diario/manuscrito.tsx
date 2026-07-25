'use client'

import { EMOCOES, type Momento, type Periodo } from '@/lib/diario/types'
import { cn } from '@/lib/utils'

// ─── Elementos tipográficos ──────────────────────────────────────────────────
//
// A identidade do Diário nasce destes tipogramas — cada um escolhe uma fonte
// com um papel. Não há cores, não há cards. A forma é a assinatura.

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'

/** Data por extenso, manuscrita — usa Caveat. É a "rubrica" de cada dia. */
export function DataManuscrita({
  iso,
  className,
}: {
  iso: string
  className?: string
}) {
  const d = new Date(iso + 'T12:00:00')
  const texto = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return (
    <span
      className={cn('font-hand leading-none tracking-wide', className)}
      style={{ fontFamily: FONT_HAND }}
    >
      {texto}
    </span>
  )
}

/** Numeração tabular de ano — IA Plex Sans porque precisa ser exato. */
export function AnoNumero({ iso, className }: { iso: string; className?: string }) {
  const d = new Date(iso + 'T12:00:00')
  return (
    <span className={cn('tabular-nums text-muted-foreground/70', className)}>
      {d.getFullYear()}
    </span>
  )
}

/** Faixa de período —应用到 semana/mês. Pequena, neutra. */
const ROTULO_PERIODO: Record<Periodo, string> = {
  dia: 'dia',
  semana: 'semana',
  mes: 'mês',
}

export function RotuloPeriodo({ periodo }: { periodo: Periodo }) {
  return (
    <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
      {ROTULO_PERIODO[periodo]}
    </span>
  )
}

/** Momento do dia em poucas palavras — serif para soar notebook. */
const ROTULO_MOMENTO: Record<Momento, string> = {
  madrugada: 'na madrugada',
  manha: 'pela manhã',
  tarde: 'à tarde',
  anoitecer: 'no anoitecer',
  noite: 'de noite',
}

export function RotuloMomento({ momento }: { momento: Momento }) {
  if (!momento) return null
  return (
    <span className="italic text-muted-foreground" style={{ fontFamily: FONT_SERIF }}>
      {ROTULO_MOMENTO[momento]}
    </span>
  )
}

/** Lista inline de emoções — cor é linguagem, não badge colorido. */
export function EmocoesLinha({
  emocoes,
  className,
}: {
  emocoes: (keyof typeof EMOCOES)[]
  className?: string
}) {
  if (emocoes.length === 0) return null
  return (
    <span className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      {emocoes.map((e, i) => {
        const cfg = EMOCOES[e]
        return (
          <span key={e} className="inline-flex items-baseline gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 translate-y-[1px] rounded-[1px]"
              style={{ backgroundColor: cfg.cor }}
            />
            <span className="italic text-foreground/85" style={{ fontFamily: FONT_SERIF }}>
              {cfg.rotulo}
            </span>
            {i < emocoes.length - 1 && (
              <span className="text-muted-foreground/40">·</span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** Etiqueta curta de tags — discreta, abaixo da folha. */
export function TagsLinha({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <span className="flex flex-wrap gap-x-2.5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/55">
      {tags.map((t, i) => (
        <span key={t}>
          {t}
          {i < tags.length - 1 && <span className="text-muted-foreground/30 ml-2.5">/</span>}
        </span>
      ))}
    </span>
  )
}
