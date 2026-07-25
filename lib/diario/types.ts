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
  serenidade:   { rotulo: 'serenidade',   cor: '#8aa6a3' },
  gratidao:     { rotulo: 'gratidão',     cor: '#b08968' },
  alegria:      { rotulo: 'alegria',      cor: '#d4a657' },
  inspiracao:   { rotulo: 'inspiração',   cor: '#c98a5e' },
  esperanca:   { rotulo: 'esperança',   cor: '#7a9a6f' },
  curiosidade:  { rotulo: 'curiosidade',  cor: '#6f8fad' },
  neutra:       { rotulo: 'neutra',       cor: '#9a958c' },
  cansaco:      { rotulo: 'cansaço',      cor: '#8a8782' },
  preocupacao: { rotulo: 'preocupação', cor: '#c08a6e' },
  tristeza:     { rotulo: 'tristeza',     cor: '#6f7d96' },
  frustracao:  { rotulo: 'frustração',  cor: '#b6706a' },
  pressa:       { rotulo: 'pressa',       cor: '#a87a5e' },
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
  /** Prompt respondido, quando veio de um. */
  prompt?: string
  /** Texto da escrita — sempre longa, sem limite artificial. */
  texto?: string

  // Específico de semana/mês:
  retro?: RetroResumo
  /** Linha corrida para semana/mês — além das listas estruturadas. */
  notas?: string
}

// ─── Catálogo de prompts ────────────────────────────────────────────────────

export type CategoriaPrompt =
  | 'gratidao'
  | 'reflexao'
  | 'cores'
  | 'decisao'
  | 'memoria'
  | 'corpo'

export interface Prompt {
  id: string
  texto: string
  categoria: CategoriaPrompt
}

export const PROMPTS: Prompt[] = [
  { id: 'p1',  texto: 'Que cor teve o seu dia?',                       categoria: 'cores' },
  { id: 'p2',  texto: 'O que ficou em você depois que o dia passou?',  categoria: 'reflexao' },
  { id: 'p3',  texto: 'Qual pergunta você não conseguiu responder hoje?', categoria: 'reflexao' },
  { id: 'p4',  texto: 'Por qual detalhe pequeno você é grato agora?',   categoria: 'gratidao' },
  { id: 'p5',  texto: 'O que seu corpo pediu hoje e você não ouviu?',    categoria: 'corpo' },
  { id: 'p6',  texto: 'Que decisão você adiou hoje? Por quê?',          categoria: 'decisao' },
  { id: 'p7',  texto: 'Descreva um instante em que o tempo parou.',      categoria: 'memoria' },
  { id: 'p8',  texto: 'O que você quer lembrar da semana que passou?',   categoria: 'memoria' },
  { id: 'p9',  texto: 'Qual ideia está pedindo passagem?',                categoria: 'reflexao' },
  { id: 'p10', texto: 'O que você precisa soltar antes de dormir?',      categoria: 'gratidao' },
]
