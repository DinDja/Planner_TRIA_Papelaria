/**
 * Diário Digital — modelo unificado.
 *
 * Pensado como um caderno íntimo, não como uma lista de cards. Os tipos
 * refletem isso: um único "registro" cobre escrita livre (dia) e
 * retrospectiva (semana/mês), sem precisar de dois apps paralelos.
 *
 * Importante: emojis foram deliberadamente REMOVIDOS dos dados — eram
 * decoração que se passava por conteúdo. A emoção é uma palavra e uma cor;
 * o "tom" é interpretado pela escolha tipográfica na camada de UI.
 */

import type { Stroke } from '@/lib/types'

// ─── Tempo ──────────────────────────────────────────────────────────────────

export type Periodo = 'dia' | 'semana' | 'mes'

/** Momento do dia em que a escrita aconteceu — só para registro "dia". */
export type Momento = 'madrugada' | 'manha' | 'tarde' | 'anoitecer' | 'noite'

// ─── Humor ──────────────────────────────────────────────────────────────────

/**
 * Vocabulário enxuto de emoções. Cada uma carrega cor e rótulo curto.
 * Não há emoji — a camada de UI decide o que mostrar.
 */
export type Emocao =
  | 'serenidade'
  | 'gratidao'
  | 'alegria'
  | 'inspiracao'
  | 'esperanca'
  | 'curiosidade'
  | 'neutra'
  | 'cansaco'
  | 'preocupacao'
  | 'tristeza'
  | 'frustracao'
  | 'pressa'

export const EMOCOES: Record<Emocao, { rotulo: string; cor: string }> = {
  serenidade:   { rotulo: 'serenidade',   cor: '#6a634d' },
  gratidao:     { rotulo: 'gratidão',     cor: '#d1bdb8' },
  alegria:      { rotulo: 'alegria',      cor: '#b76f06' },
  inspiracao:   { rotulo: 'inspiração',   cor: '#b76f06' },
  esperanca:   { rotulo: 'esperança',   cor: '#6a634d' },
  curiosidade:  { rotulo: 'curiosidade',  cor: '#ddd6c6' },
  neutra:       { rotulo: 'neutra',       cor: '#ddd6c6' },
  cansaco:      { rotulo: 'cansaço',      cor: '#ddd6c6' },
  preocupacao: { rotulo: 'preocupação', cor: '#d1bdb8' },
  tristeza:     { rotulo: 'tristeza',     cor: '#6a634d' },
  frustracao:  { rotulo: 'frustração',  cor: '#d1bdb8' },
  pressa:       { rotulo: 'pressa',       cor: '#b76f06' },
}

/** Toda emoção tem uma "nota" de valência entre -2 e +2, usada só internamente. */
export const VALENCIA: Record<Emocao, number> = {
  serenidade: 2, gratidao: 2, alegria: 2, inspiracao: 2, esperanca: 1,
  curiosidade: 1, neutra: 0, cansaco: -1, preocupacao: -1,
  tristeza: -2, frustracao: -2, pressa: -1,
}

// ─── Energia: linha de tinta ────────────────────────────────────────────────

/**
 * Energia é um traço, não uma barra de progresso. Vai de 1 (exausto)
 * a 5 ( transbordando ). Na UI vira uma linha fina que oscila.
 */
export type Energia = 1 | 2 | 3 | 4 | 5

// ─── Retrospectiva (período > dia) ──────────────────────────────────────────

/**
 * A retrospectiva de semana/mês tem uma estrutura própria:
 * "fora de mim" (o que aconteceu), "dentro de mim" (o que ficou),
 * "próximo" (o que levarei adiante).
 */
export interface RetroResumo {
  /** O que saiu de nós rumo ao mundo — algo feito, dito, partilhado. */
  fora: string[]
  /** O que ficou em nós — uma sensação, uma pergunta, uma mudança. */
  dentro: string[]
  /** O que levaremos adiante — uma decisão, um cuidado, um aviso. */
  proximo: string[]
}

// ─── O registro unificado ───────────────────────────────────────────────────

export interface Registro {
  id: string
  /** Qual período da vida este registro cobre. */
  periodo: Periodo
  /** ISO date — início do período. */
  data: string
  /** ISO date — fim, só para semana/mês. Omitido para "dia". */
  dataFim?: string
  criadoEm: string
  atualizadoEm: string

  // Comum a todos os períodos:
  /** Título curto — opcional para "dia", esperado para semana/mês. */
  titulo?: string
  /** Emoções escolhidas (até 3). */
  emocoes: Emocao[]
  /** Linha de energia. */
  energia: Energia
  /** Cor usada para a folha. Herdada da primeira emoção ou escolhida. */
  cor: string
  /** Tags — palavras soltas que pulverizam memórias. */
  tags: string[]
  /** Rascunho à mão livre. */
  rabisco?: Stroke[]
  /** Fixado no topo da linha do tempo. */
  fixado?: boolean

  // Específico de "dia":
  /** Momento do dia em que a escrita aconteceu. */
  momento?: Momento
  /** Texto da escrita — sempre longa, sem limite artificial. */
  texto?: string

  // Específico de semana/mês:
  retro?: RetroResumo
  /** Linha corrida para semana/mês — além das listas estruturadas. */
  notas?: string
}
