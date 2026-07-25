/**
 * Sistema de ícones de módulo — PlannerHub
 *
 * Cada ícone aqui é específico do domínio do produto. Não é coleção genérica;
 * não replique Lucide. Queira ler `ICONOGRAFIA.md` antes de adicionar qualquer
 * ícone novo.
 *
 * Assinatura visual (imutável):
 *   - viewBox 0 0 20 20, conteúdo dentro de 16x16 com padding 2
 *   - stroke 1.5, butt linecaps, miter linejoins
 *   - sem preenchimento, salvo onde a forma é uma mancha (exp. moeda) — e
 *     nesse caso é `fill` no mesmo `currentColor`, explicito no path
 *   - herdando `currentColor`
 *
 * Consumo:
 *   import { ModuloIcon } from '@/components/icons/modules'
 *   <ModuloIcon name="diario" />
 *
 * Ou direto por componente:
 *   import { DiarioIcon } from '@/components/icons/modules'
 *
 * NUNCA alterar stroke 1.5. Se precisar de "fino" para um lugar específico,
 * use a prop `size` e crie outro preço visual fora deste sistema.
 */

import type { SVGProps } from 'react'

export type ModuloId =
  | 'dashboard'
  | 'diario'
  | 'notas'
  | 'listas'
  | 'checklists'
  | 'frases'
  | 'memorias'
  | 'cofre'
  | 'saude'
  | 'wishlist'
  | 'rotina'
  | 'calendario'
  | 'financas'
  | 'metas'
  | 'habitos'
  | 'retrospectiva'
  | 'templates'
  | 'plans'
  | 'admin'
  | 'perfil'

const COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'butt' as const,
  strokeLinejoin: 'miter' as const,
}

type P = SVGProps<SVGSVGElement> & { size?: number }

function svgProps(size = 20): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    ...COMMON,
    'aria-hidden': true,
    focusable: false,
  }
}

// ─── Implementações ──────────────────────────────────────────────────────────

export function DiarioIcon({ size, ...p }: P) {
  // Página aberta + linha de tinta ondulada.
  // Folha: linha superior (lombada), linha vertical direita; sem contorno fechado
  // — deixa o gesto "página em branco" respirar.
  // Onda: curva oscilando dentro.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M5 4.5 L5 16.5" />
      <path d="M5 4.5 L15 4.5" />
      <path d="M5 11 Q7.5 9 10 11 T15 11" />
    </svg>
  )
}

export function NotasIcon({ size, ...p }: P) {
  // Quadrado com canto inferior-direito dobrado. Sem pauta (notas ≠ doc).
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M5 3 L13 3 L15 5 L15 17 L5 17 Z" />
      <path d="M13 3 L13 5 L15 5" />
    </svg>
  )
}

export function ListasIcon({ size, ...p }: P) {
  // Três linhas de comprimentos diferentes — enumeração orgânica.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M4 5 L16 5" />
      <path d="M4 10 L13 10" />
      <path d="M4 15 L11 15" />
    </svg>
  )
}

export function ChecklistsIcon({ size, ...p }: P) {
  // Três linhas + três vistos pequenos à esquerda — feito item-a-item.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M6 5 L16 5" />
      <path d="M6 10 L16 10" />
      <path d="M6 15 L16 15" />
      <path d="M3 4.4 L4 5.4 L5 3.6" />
      <path d="M3 9.4 L4 10.4 L5 8.6" />
      <path d="M3 14.4 L4 15.4 L5 13.6" />
    </svg>
  )
}

export function FrasesIcon({ size, ...p }: P) {
  // Aspas tipográficas + linha de base (citação).
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M4 5 L8 5 L8 9 L5 9 L5 11" />
      <path d="M11 5 L15 5 L15 9 L12 9 L12 11" />
      <path d="M4 15 L16 15" />
    </svg>
  )
}

export function MemoriasIcon({ size, ...p }: P) {
  // Caixa com fio de recordação saindo.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 8 L17 8 L17 17 L3 17 Z" />
      <path d="M10 8 Q10 4 14 4 Q16 4 16 5.5" />
    </svg>
  )
}

export function CofreIcon({ size, ...p }: P) {
  // Retângulo com dial circular.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 4 L17 4 L17 16 L3 16 Z" />
      <circle cx="11" cy="10" r="3" />
      <path d="M11 10 L11 8" />
      <path d="M11 10 L12.6 11.2" />
    </svg>
  )
}

export function SaudeIcon({ size, ...p }: P) {
  // Linha de ECG — batimento estendido.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 10 L7 10 L8.5 6 L10 14 L11.5 8 L13 10 L17 10" />
    </svg>
  )
}

export function WishlistIcon({ size, ...p }: P) {
  // Estrela de 5 pontas sem preenchimento.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M10 3 L11.9 7.2 L16.5 7.7 L13 10.9 L14 15.5 L10 13.2 L6 15.5 L7 10.9 L3.5 7.7 L8.1 7.2 Z" />
    </svg>
  )
}

export function RotinaIcon({ size, ...p }: P) {
  // Relógio: círculo, marca de 12h, dois ponteiros.
  return (
    <svg {...svgProps(size)} {...p}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3 L10 4.4" />
      <path d="M10 10 L10 6.5" />
      <path d="M10 10 L12.5 11" />
    </svg>
  )
}

export function CalendarioIcon({ size, ...p }: P) {
  // Folha com dois marcadores em cima + grade 3x2 com um dia realçado.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 5 L17 5 L17 17 L3 17 Z" />
      <path d="M3 8.5 L17 8.5" />
      <path d="M3 12 L17 12" />
      <path d="M8 8.5 L8 17" />
      <path d="M13 8.5 L13 17" />
      <path d="M6.5 3 L6.5 6" />
      <path d="M13.5 3 L13.5 6" />
      {/* Dia realçado — pequeno quadrado preenchido */}
      <rect x="9" y="13.4" width="3" height="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FinancasIcon({ size, ...p }: P) {
  // Círculo (moeda) + "R$" central.
  return (
    <svg {...svgProps(size)} {...p}>
      <circle cx="10" cy="10" r="7.2" />
      {/* "R$" — letras simplificadas por traços, na metade inferior */}
      <path d="M7.8 7.8 L7.8 12.4" />
      <path d="M7.8 7.8 Q10.5 7.8 10.5 10 Q10.5 12.2 7.8 12.2" />
      <path d="M10.8 9 L13 9 Q14 9 14 10 Q14 11 13 11 L11 11 L13.5 13" />
    </svg>
  )
}

export function MetasIcon({ size, ...p }: P) {
  // Bandeira em cimo + linha de base.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M5 16 L5 4" />
      <path d="M5 4 L15 4 L13.5 7.5 L15 11 L5 11" />
      <path d="M3 16 L17 16" />
    </svg>
  )
}

export function HabitosIcon({ size, ...p }: P) {
  // Três selos pequenos iguais — repetição.
  return (
    <svg {...svgProps(size)} {...p}>
      <circle cx="4.5" cy="10" r="2" />
      <circle cx="10" cy="10" r="2" />
      <circle cx="15.5" cy="10" r="2" />
    </svg>
  )
}

export function RetrospectivaIcon({ size, ...p }: P) {
  // Seta curva que quase completa o círculo + ponto no fim (olhar p/ trás).
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M15.5 10 A5.5 5.5 0 1 1 8.5 4.7" />
      <path d="M8.5 2.5 L8.5 4.7 L10.7 4.7" />
      <circle cx="15.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TemplatesIcon({ size, ...p }: P) {
  // Três retângulos offset em pilha.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M6 6 L15 6 L15 16 L6 16 Z" />
      <path d="M7 4 L16 4 L16 14" />
      <path d="M8 2 L17 2 L17 12" />
    </svg>
  )
}

export function PlansIcon({ size, ...p }: P) {
  // Etiqueta/cartão com símbolo de preço (R$ abreviado).
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 5 L13 5 L17 10 L13 15 L3 15 Z" />
      <path d="M6.5 8 L6.5 12.4" />
      <path d="M6.5 8 Q9 8 9 9.8 Q9 11.6 6.5 11.6" />
      <path d="M11 9 L13 9" />
    </svg>
  )
}

export function AdminIcon({ size, ...p }: P) {
  // Grade 2x2 com parte tracejada — ferramenta de inspeção.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 3 L9 3 L9 9 L3 9 Z" />
      <path d="M11 3 L17 3 L17 9 L11 9 Z" />
      <path d="M3 11 L9 11 L9 17 L3 17 Z" />
      <path d="M11 11 L13 11" />
      <path d="M14.5 11 L17 11" />
      <path d="M11 13.5 L11.6 13.5" />
      <path d="M12.8 13.5 L15.4 13.5" />
      <path d="M16.4 13.5 L17 13.5" />
      <path d="M11 16 L13.6 16" />
      <path d="M14.8 16 L17 16" />
    </svg>
  )
}

export function PerfilIcon({ size, ...p }: P) {
  // Círculo + arco de ombros, todos vazios.
  return (
    <svg {...svgProps(size)} {...p}>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17 Q4 11.5 10 11.5 Q16 11.5 16 17" />
    </svg>
  )
}

export function DashboardIcon({ size, ...p }: P) {
  // Três retângulos de tamanhos diferentes — composição, não grelha.
  return (
    <svg {...svgProps(size)} {...p}>
      <path d="M3 4 L11 4 L11 10 L3 10 Z" />
      <path d="M13 4 L17 4 L17 7 L13 7 Z" />
      <path d="M3 12 L17 12 L17 17 L3 17 Z" />
    </svg>
  )
}

// ─── Mapa canônico ───────────────────────────────────────────────────────────

export const MODULO_ICONS: Record<ModuloId, (p: P) => JSX.Element> = {
  dashboard: DashboardIcon,
  diario: DiarioIcon,
  notas: NotasIcon,
  listas: ListasIcon,
  checklists: ChecklistsIcon,
  frases: FrasesIcon,
  memorias: MemoriasIcon,
  cofre: CofreIcon,
  saude: SaudeIcon,
  wishlist: WishlistIcon,
  rotina: RotinaIcon,
  calendario: CalendarioIcon,
  financas: FinancasIcon,
  metas: MetasIcon,
  habitos: HabitosIcon,
  retrospectiva: RetrospectivaIcon,
  templates: TemplatesIcon,
  plans: PlansIcon,
  admin: AdminIcon,
  perfil: PerfilIcon,
}

export function ModuloIcon({
  name,
  size = 20,
  ...props
}: { name: ModuloId } & P) {
  const C = MODULO_ICONS[name]
  return <C size={size} {...props} />
}
