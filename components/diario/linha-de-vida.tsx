'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { VerticeLinha } from '@/lib/diario/ecos'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'

// ─── Linha de Vida ─────────────────────────────────────────────────────────
//
// A assinatura visual dos Ecos do Diário. Não é gráfico — é um gesto.
// Sete dias como uma única curva contínua, colorida por emoção, com
// a cadência da energia de cada dia. A linha se desenha sozinha ao
// montar, como uma caneta passando no papel.
//
// Diferente da LinhaDeEnergia original (que desenha um perfil por
// nível), esta desenha a SEMANA — então cada segmento é uma curva
// própria, interpolada suavemente, e a cor muda entre dias conforme
// a emoção dominante. Silêncio (dia sem registro) é pontilhado cinza.

const COR_SILENCIO = 'var(--muted-foreground)'
const OPACIDADE_SILENCIO = 0.32
const OPACIDADE_ESCRITO = 0.82

function energiaParaY(energia: number, alt: number): number {
  // energia 1 → 82% (fundo); energia 5 → 12% (pico). Espelja LinhaDeEnergia.
  const map: Record<number, number> = { 1: 0.82, 2: 0.62, 3: 0.5, 4: 0.3, 5: 0.12 }
  return map[Math.max(1, Math.min(5, energia))] * alt
}

/** Curva Bézier suave entre pontos. Recebe Y dos 7 dias e desenha path. */
function curvaSeteDias(ys: number[], xs: number[]) {
  if (ys.length < 2) return ''
  let d = `M ${xs[0]} ${ys[0]}`
  for (let i = 1; i < ys.length; i++) {
    const xPrev = xs[i - 1]
    const xCur = xs[i]
    const yPrev = ys[i - 1]
    const yCur = ys[i]
    // c p/ c, âncoras em metade do segmento p/ curva suave
    const cx = (xPrev + xCur) / 2
    d += ` C ${cx} ${yPrev} ${cx} ${yCur} ${xCur} ${yCur}`
  }
  return d
}

/** Cor de um segmento dado os dois dias. Se um é silencio, mistura com a outra. */
function corSegmento(esq: VerticeLinha, dir: VerticeLinha): string {
  if (esq.cor && dir.cor) return dir.cor
  if (esq.cor) return esq.cor
  if (dir.cor) return dir.cor
  return COR_SILENCIO
}

const ROTULOS_DIA_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

export interface LinhaDeVidaProps {
  /** Sete vértices em ordem cronológica (passado → presente). */
  vertices: VerticeLinha[]
  /** Largura do traço em px. Default 240. */
  largura?: number
  /** Altura em px. Default 56. */
  altura?: number
  /** `true` para desenhar os rótulos de dia da semana em Caveat abaixo. */
  comRotulos?: boolean
  /** `true` para desenhar os números dos dias do mês. */
  comDias?: boolean
  className?: string
}

export function LinhaDeVida({
  vertices,
  largura = 240,
  altura = 56,
  comRotulos = true,
  comDias = false,
  className,
}: LinhaDeVidaProps) {
  // Cada vértice é igualmente espaçado por X. Deixamos `pad` nas bordas
  // para os marcadores não ficarem colados à margem do SVG.
  const { xs, ys, marcadores } = useMemo(() => {
    const pad = 14
    const xs: number[] = vertices.map(
      (_, i) => pad + (i * (largura - pad * 2)) / (vertices.length - 1 || 1),
    )
    const ys: number[] = vertices.map((v) => energiaParaY(v.energia, altura))

    // Marcadores verticais: um por dia, com cor e altura por dia.
    const marcadores = vertices.map((v, i) => {
      const yBase = altura * 0.5
      const yTop = altura * 0.18
      const tickAlto = v.escrito ? yTop : yBase + 4
      const tickBaixo = altura - 4
      const cor = v.cor ?? COR_SILENCIO
      const opacity = v.escrito ? OPACIDADE_ESCRITO : OPACIDADE_SILENCIO
      const dasharray = v.escrito ? 'none' : '2 3'
      return { x: xs[i], yBase: tickBaixo, yTop: tickAlto, cor, opacity, dasharray, escrito: v.escrito }
    })

    return { xs, ys, marcadores }
  }, [vertices, largura, altura])

  if (vertices.length === 0) {
    // Semana sem nenhum vértice — devolvemos um placeholder honesto,
    // não uma "empty state card". Uma linha tracejada e uma frase.
    return (
      <span
        className={cn('inline-flex items-center gap-2', className)}
        style={{ fontFamily: FONT_HAND }}
      >
        <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden>
          <line
            x1={12}
            y1={altura / 2}
            x2={largura - 12}
            y2={altura / 2}
            stroke={COR_SILENCIO}
            strokeWidth={1.2}
            strokeDasharray="3 5"
            opacity={OPACIDADE_SILENCIO}
          />
        </svg>
      </span>
    )
  }

  // Distribuimos cores por dia para pintar por segmento — cada segmento
  // usa a cor do dia à direita, exceto se ambos silencio (cinza).
  const segmentosColoreados = vertices.slice(1).map((v, i) => ({
    x1: xs[i],
    x2: xs[i + 1],
    cor: corSegmento(vertices[i], vertices[i + 1]),
    opacidade:
      (vertices[i].escrito || vertices[i + 1].escrito)
        ? OPACIDADE_ESCRITO
        : OPACIDADE_SILENCIO,
    silence:
      !vertices[i].escrito && !vertices[i + 1].escrito,
  }))

  return (
    <span className={cn('inline-flex flex-col items-center gap-1', className)}>
      <svg
        width={largura}
        height={altura}
        viewBox={`0 0 ${largura} ${altura}`}
        fill="none"
        aria-label="Linha de vida da semana"
        role="img"
      >
        {/* Linha-base pautada discreta — como caderno em pauta. */}
        <line
          x1={6}
          y1={altura * 0.5}
          x2={largura - 6}
          y2={altura * 0.5}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 5"
          opacity={0.4}
        />

        {/* Segmentos coloridos por dia — cada segmento é próprio path.
            Quando silêncio, pontilhado. */}
        {segmentosColoreados.map((s, i) => (
          <path
            key={i}
            d={curvaSeteDias([ys[i], ys[i + 1]], [s.x1, s.x2])}
            stroke={s.cor}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={s.opacidade}
            strokeDasharray={s.silence ? '2 4' : 'none'}
            className="linha-de-vida__stroke"
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}

        {/* Marcadores verticais — risco de caneta no caderno pautado. */}
        {marcadores.map((m, i) => (
          <line
            key={i}
            x1={m.x}
            y1={m.yTop}
            x2={m.x}
            y2={m.yBase}
            stroke={m.cor}
            strokeWidth={m.escrito ? 1.6 : 1}
            strokeLinecap="round"
            opacity={m.opacity}
            strokeDasharray={m.dasharray}
          />
        ))}

        {/* Hoje — um pequeno acento no último vértice, se houve escrita. */}
        {vertices[vertices.length - 1].escrito && (
          <circle
            cx={xs[xs.length - 1]}
            cy={ys[ys.length - 1]}
            r={3}
            fill={vertices[vertices.length - 1].cor ?? COR_SILENCIO}
            opacity={0.9}
          />
        )}
      </svg>

      {(comRotulos || comDias) && (
        <span
          className="flex w-full justify-between px-1 text-[0.7rem] leading-none"
          style={{ fontFamily: FONT_HAND, color: 'var(--muted-foreground)' }}
          aria-hidden
        >
          {vertices.map((v, i) => {
            const data = new Date(v.data + 'T12:00:00')
            const rotulo = ROTULOS_DIA_SEMANA[(data.getDay() + 6) % 7]
            const dia = data.getDate()
            return (
              <span
                key={i}
                style={{ width: 18, textAlign: 'center' }}
                className={v.escrito ? 'text-foreground/75' : 'text-muted-foreground/45'}
              >
                {comRotulos && rotulo}
                {comDias && (
                  <span className="block text-[0.62rem] tabular-nums opacity-80">{dia}</span>
                )}
              </span>
            )
          })}
        </span>
      )}
      <span className="sr-only">{descrever(vertices)}</span>
    </span>
  )
}

// ─── Acessibilidade — descreve o traço em uma frase ──────────────────────────

function descrever(v: VerticeLinha[]): string {
  const escritos = v.filter((x) => x.escrito).length
  if (escritos === 0) return 'Sem registros esta semana.'
  const hoje = v[v.length - 1]
  const parte = escritos === 1 ? 'apenas um dia' : `${escritos} dias`
  const hojeTxt = hoje.escrito ? 'hoje foi escrito.' : 'hoje ainda em branco.'
  return `Linha da semana: escritos em ${parte}. ${hojeTxt}`
}
