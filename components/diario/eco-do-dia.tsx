'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Energia } from '@/lib/diario/types'
import { DataManuscrita, EmocoesLinha, RotuloMomento } from './manuscrito'
import { LinhaDeEnergia } from './linha-de-energia'
import type { EcoRasgado } from '@/lib/diario/ecos'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'

// ─── Eco do Dia — a primeira página transplantada ao dashboard ─────────────
//
// O dashboard deixa de ser uma mesa de operações SaaS e vira a primeira
// página do caderno. Três estados possuem dignidade própria:
//
//   1. Silêncio — hoje não foi escrito. Mostramos o prompt e um convite
//      manuscrito. Nada de "empty state" ilustrado.
//
//   2. Préambulo — hoje tem registro. Mostramos data manuscrita, primeira
//      frase, emoções, e a linha de energia. Tudo tipográfico, sem card.
//
//   3. Convite não-intrusivo — quando já escreveu, não insistimos. Há só
//      a data e uma frase discreta "voltar a ler".
//
// Decisões de identidade (Anti AI slop):
//   - Sem ícones lucide. Nenhum Sparkles, Calendar, NotebookPen.
//   - Sem card. A folha é definida por uma margem lateral fina colorida
//     pela emoção dominante do dia — não por um retângulo arredondado.
//   - Sem gray placeholders. Texto é texto, não aparência.

export interface EcoDoDiaProps {
  eco: EcoRasgado | null
  /** O prompt de hoje (determinístico), já formatado. */
  promptHoje: string
  /** Momento do dia corrente, derivado da hora. */
  momentoAgora: 'manha' | 'tarde' | 'anoitecer' | 'noite' | 'madrugada'
  className?: string
}

export function EcoDoDia({
  eco,
  promptHoje,
  momentoAgora,
  className,
}: EcoDoDiaProps) {
  // Decisão: o usuário já escreveu hoje? Optamos por NÃO torrar com
  // "visual empty state". Ou silêncio, ou já rasgou — ambos têm
  // dignidade. Tudo derivado de `eco`: null = convite; não-null = folha.
  const jaEscrito = eco !== null
  const corMargem = jaEscrito ? eco!.cor : 'var(--border)'
  const energia: Energia = jaEscrito ? eco!.energia : 3

  return (
    <section
      className={cn('relative isolate pl-4 pr-1', className)}
      style={{ animation: 'eco-rise 700ms ease-out both' }}
      aria-label="Eco do diário de hoje"
    >
      {/* Margem lateral fina — não é "borda de card", é linha de caderno. */}
      <span
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-px"
        style={{ backgroundColor: corMargem, opacity: jaEscrito ? 0.85 : 0.4 }}
      />

      {/* Rubrica — data manuscrita + momento */}
      <header className="flex items-baseline gap-2.5 pb-3">
        <DataManuscrita iso={eco?.data ?? hojeISO()} className="text-[1.55rem]" />
        {!jaEscrito && (
          <RotuloMomento momento={momentoAgora} />
        )}
        {jaEscrito && eco!.titulo && (
          <span
            className="font-serif italic text-muted-foreground/75"
            style={{ fontFamily: FONT_SERIF, fontSize: '0.95rem' }}
          >
            — {eco!.titulo}
          </span>
        )}
      </header>

      {/* Corpo — derivado do estado de escrita */}
      {jaEscrito ? (
        <JaEscrito eco={eco!} />
      ) : (
        <AindaSilencio promptHoje={promptHoje} />
      )}
    </section>
  )
}

// ─── Hoje ainda em silêncio — convite à caneta ──────────────────────────────

function AindaSilencio({ promptHoje }: { promptHoje: string }) {
  return (
    <div className="flex flex-col gap-3 py-1">
      <Link href="/diario" className="group flex flex-col gap-1.5 max-w-[28rem]">
        <span
          className="font-hand text-foreground"
          style={{ fontFamily: FONT_HAND, fontSize: '1.35rem', lineHeight: 1.18 }}
        >
          {promptHoje}
        </span>
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground/55 transition-colors group-hover:text-foreground/75">
          tomar a caneta
        </span>
      </Link>
      <LinhaDeEnergia energia={3} cor="var(--muted-foreground)" className="opacity-50" />
    </div>
  )
}

// ─── Hoje já rasgado — mostrar o primeiro fôlego do dia ────────────────────

function JaEscrito({ eco }: { eco: EcoRasgado }) {
  // Préambulo: primeira frase do primeiro texto do dia.
  // Se o dia só tem emoções (sem texto), mostramos as emoções e a linha.
  const pre = eco.preambulo
  return (
    <div className="flex flex-col gap-3">
      {pre && (
        <p
          className="font-serif text-foreground/85 text-pretty leading-snug max-w-[28rem]"
          style={{ fontFamily: FONT_SERIF, fontSize: '1.05rem', lineHeight: 1.5 }}
        >
          {pre}
        </p>
      )}

      {/* Emoções — cor é linguagem. Sem badges */}
      {eco.humor.length > 0 && (
        <EmocoesLinha emocoes={eco.humor} className="text-[0.95rem]" />
      )}

      {/* Linha de energia — a assinatura visual */}
      <div className="flex items-center gap-3 pt-0.5">
        <LinhaDeEnergia energia={eco.energia} cor={eco.cor} comRotulo />
      </div>

      {/* Leitura — discreto, sem botão de fancy */}
      <Link
        href="/diario"
        className="self-start -ml-px text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground/55 transition-colors hover:text-foreground/80 pt-1"
      >
        reler o dia →
      </Link>
    </div>
  )
}

// ─── Helper interno — ISO de hoje ───────────────────────────────────────────

function hojeISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}
