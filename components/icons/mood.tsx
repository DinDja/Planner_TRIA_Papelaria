/**
 * Escala de humor — substitui o padrão `Sparkles/Smile/Meh/Frown/Angry` que
 * Lançava emoji-decorativo disfarçado de ícone em memories-page, retro-page,
 * memories-dialogs e retro-dialogs.
 *
 * Princípio (ver ICONOGRAFIA.md e Diário V2): humor não é uma carinha; é um
 * estado entre euforia e cansaço. Cada grau é uma **forma única** que cresce,
 * descansa, ou afunda — não uma face. Rótulo + cor casam.
 *
 * Cinco graus: incrível / bom / neutro / ruim / difícil.
 * As cores seguem a paleta TRIA e preservam a leitura entre níveis.
 *
 * Stroke 1.5, butt joints — coerência com components/icons/modules.
 */

import type { SVGProps } from 'react'

const COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'butt' as const,
  strokeLinejoin: 'miter' as const,
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function svgProps(size = 20): SVGProps<SVGSVGElement> {
  return { width: size, height: size, viewBox: '0 0 20 20', ...COMMON, 'aria-hidden': true, focusable: false }
}

/**
 * `incrível` — arco amp que sobe, cume alto. Estado radiante, expansivo.
 */
export function MoodBrilliantIcon({ size, ...p }: IconProps) {
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 14 Q6 4 10 4 Q14 4 17 14" />
      <path d="M3 14 L17 14" />
    </svg>
  )
}

/**
 * `bom` — arco médio, sobe e volta. Estado agradável, contido.
 */
export function MoodGoodIcon({ size, ...p }: IconProps) {
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 13 Q6 7 10 7 Q14 7 17 13" />
      <path d="M3 14 L17 14" />
    </svg>
  )
}

/**
 * `neutro` — linha quase reta, com pequena ondulação. Equilíbrio.
 */
export function MoodNeutralIcon({ size, ...p }: IconProps) {
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 11 Q6 10 10 11 Q14 12 17 11" />
      <path d="M3 14 L17 14" />
    </svg>
  )
}

/**
 * `ruim` — arco que cai. Vai para baixo e fica.
 */
export function MoodBadIcon({ size, ...p }: IconProps) {
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 8 Q6 14 10 14 Q14 14 17 8" />
      <path d="M3 14 L17 14" />
    </svg>
  )
}

/**
 * `difícil` — linha que desce abruptamente. Carga pesada.
 */
export function MoodToughIcon({ size, ...p }: IconProps) {
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 7 L7 7 L9 14 L17 14" />
      <path d="M3 16 L17 16" opacity={0.4} />
    </svg>
  )
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export type MoodId = 'great' | 'good' | 'neutral' | 'bad' | 'tough'

interface MoodDef {
  id: MoodId
  /** Rótulo curto, pt-BR. */
  label: string
  /** Rótulo substantivo: "Um excelente [..." — usado nas legendas. */
  longLabel: string
  cor: string
  Icon: (p: IconProps) => JSX.Element
}

export const MOODS: Record<MoodId, MoodDef> = {
  great:   { id: 'great',   label: 'Incrível', longLabel: 'incrível',          cor: '#6a634d', Icon: MoodBrilliantIcon },
  good:    { id: 'good',    label: 'Bom',     longLabel: 'bom',               cor: '#ddd6c6', Icon: MoodGoodIcon },
  neutral: { id: 'neutral', label: 'Neutro',  longLabel: 'neutro',            cor: '#b76f06', Icon: MoodNeutralIcon },
  bad:     { id: 'bad',     label: 'Ruim',   longLabel: 'ruim',              cor: '#d1bdb8', Icon: MoodBadIcon },
  tough:   { id: 'tough',   label: 'Difícil', longLabel: 'difícil',           cor: '#b76f06', Icon: MoodToughIcon },
}

export const MOOD_LIST = [MOODS.great, MOODS.good, MOODS.neutral, MOODS.bad, MOODS.tough]

// ─── UI rápida de seleção ──────────────────────────────────────────────────────

export function MoodPicker({
  value,
  onChange,
  variant = 'buttons',
  className = '',
}: {
  value?: MoodId
  onChange: (v: MoodId) => void
  variant?: 'buttons' | 'inline'
  className?: string
}) {
  if (variant === 'inline') {
    // Versão discreta: lista horizontal só com a forma e o rótulo tipográfico.
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {MOOD_LIST.map((m) => {
          const ativa = m.id === value
          return (
            <button key={m.id} type="button" onClick={() => onChange(m.id)} aria-pressed={ativa}
              className={`group inline-flex items-baseline gap-1.5 transition-opacity ${ativa ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
              <span style={{ color: m.cor }} className="inline-flex">
                <m.Icon size={18} />
              </span>
              <span className="italic text-sm" style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }
  return (
    <div className={`flex gap-2 ${className}`}>
      {MOOD_LIST.map((m) => {
        const ativa = m.id === value
        return (
          <button key={m.id} type="button" onClick={() => onChange(m.id)} aria-pressed={ativa}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all"
            style={ativa ? { borderColor: 'transparent', backgroundColor: m.cor, color: 'white' } : { borderColor: 'var(--border)' }}>
            <span style={ativa ? { color: 'white' } : { color: m.cor }}>
              <m.Icon size={20} />
            </span>
            <span className={ativa ? '' : 'text-muted-foreground'}>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Marca mínima inline (chip "como me senti: incrível") — p/ cards de memória. */
export function MoodChip({ value, withLabel = true }: { value: MoodId; withLabel?: boolean }) {
  const m = MOODS[value]
  if (!m) return null
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span style={{ color: m.cor }} className="inline-flex">
        <m.Icon size={14} />
      </span>
      {withLabel && (
        <span className="italic text-sm" style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}>
          {m.label}
        </span>
      )}
    </span>
  )
}
