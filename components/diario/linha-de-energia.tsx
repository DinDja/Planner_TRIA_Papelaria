'use client'

import { cn } from '@/lib/utils'
import type { Energia } from '@/lib/diario/types'

// ─── Linha de energia ────────────────────────────────────────────────────────
//
// A assinatura visual do Diário. Em vez de uma barra preenchida (que é
// estatística) ou 5 asteriscos (que é review de app), a energia vira uma
// linha de tinta que tem uma forma própria para cada nível — como se o
// gesto de escrever já carregasse o cansaço ou a euforia do dia.

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'

/**
 * SVG inline. O "traço" é uma polyline horizontal com variação de altura.
 * Para energia 1, a linha cai no fim. Para energia 5, sobe e se mantém.
 * A linha é única, contínua — não segmentada.
 */
function pathPara(energia: Energia, largura = 140, alturaBox = 28): string {
  // pontos X em % do largura. Y em % do alturaBox (de cima p/ baixo).
  const yBase = alturaBox * 0.62
  const amplitude = alturaBox * 0.34
  const x = [0.05, 0.27, 0.5, 0.72, 0.95].map((p) => p * largura)

  // Y de cada ponto é função da energia — mapa simiescas.
  // Quanto maior energia, mais alta a curva. Pequena variação aleatória controlada por energia para parecer gesto.
  const perfis: Record<Energia, number[]> = {
    1: [0.25, 0.35, 0.50, 0.65, 0.82],   // afunda (cansaço)
    2: [0.30, 0.42, 0.50, 0.55, 0.62],   // plano baixo
    3: [0.50, 0.45, 0.50, 0.52, 0.50],   // plano neutro, leve ondulação
    4: [0.40, 0.32, 0.28, 0.30, 0.26],   // sobe suave
    5: [0.30, 0.20, 0.12, 0.18, 0.08],   // pico (euforia)
  }
  const ys = perfis[energia].map((t) => t * alturaBox)
  return x
    .map((xi, i) => `${i === 0 ? 'M' : 'L'} ${xi.toFixed(1)} ${(ys[i]).toFixed(1)}`)
    .join(' ')
}

export function LinhaDeEnergia({
  energia,
  cor = 'var(--foreground)',
  largura = 140,
  alturaBox = 28,
  className,
  comRotulo = false,
}: {
  energia: Energia
  cor?: string
  largura?: number
  alturaBox?: number
  className?: string
  comRotulo?: boolean
}) {
  const d = pathPara(energia, largura, alturaBox)
  const rotulo = ['', 'exausto', 'cansado', 'no meio', 'vivo', 'transbordando'][energia]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={largura}
        height={alturaBox}
        viewBox={`0 0 ${largura} ${alturaBox}`}
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        {/* "linha de margem" discreta para o gesto não parecer solto */}
        <line
          x1={0}
          y1={alturaBox * 0.5}
          x2={largura}
          y2={alturaBox * 0.5}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.5}
        />
        <path
          d={d}
          stroke={cor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {comRotulo && (
        <span
          className="text-muted-foreground/70 text-[0.95em] leading-none -translate-y-px"
          style={{ fontFamily: FONT_HAND }}
        >
          {rotulo}
        </span>
      )}
    </span>
  )
}
