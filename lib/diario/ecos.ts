// ─── Ecos do Diário ───────────────────────────────────────────────────────────
//
// O diário deixa de ser uma ilha e vira a camada semântica do sistema
// inteiro. Os seletores deste módulo não renderizam nada — eles fazem
// a ponte entre um Registro do diário e os dados das outras superfícies
// (Finanças, Checklists, Rotina, Calendário). A UI consome o que
// estes seletores devolvem e desenha, sem reconstruir interpretação.
//
// Princípio: emoção é metadado, não decoração.
// O que você escreve no caderno íntimo colore como o resto do app lê
// o seu próprio dia — mas nunca substitui o que foi escrito. É eco,
// não grito.

import type { Transaction } from '@/lib/types'
import type { CalendarEvent } from '@/lib/types'
import type { Checklist } from '@/lib/types'
import type { Registro, Emocao, Energia } from './types'
import { EMOCOES, VALENCIA } from './types'

// ─── Dia ────────────────────────────────────────────────────────────────────

/** ISO do dia corrente, consistente com `isoDia` do store. */
const hoje = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

/** Data ISO do offset em dias a partir de hoje. */
const offsetIso = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

/** Vetor [maiorQual, ...outros] de emoções que dominam um dia. */
const valencias = (regs: Registro[]): Emocao[] => {
  if (regs.length === 0) return []
  const contagem = new Map<Emocao, number>()
  for (const r of regs) {
    for (const e of r.emocoes) {
      contagem.set(e, (contagem.get(e) ?? 0) + 1)
    }
  }
  return [...contagem.entries()]
    .map(([e, n]) => ({ e, n }))
    .sort((a, z) => z.n - a.n)
    .map((x) => x.e)
}

/** Energia média (1-5) de um conjunto de registros, arredondada. */
const energiaMedia = (regs: Registro[]): Energia => {
  if (regs.length === 0) return 3
  const soma = regs.reduce((acc, r) => acc + r.energia, 0)
  const media = soma / regs.length
  // Snap para mais perto: 1.4 vira 1, 1.6 vira 2, etc.
  const snap = Math.round(media)
  const lo: Energia = Math.max(1, snap) as Energia
  const hi: Energia = Math.min(5, lo) as Energia
  return hi
}

/** Cor herdada da emoção dominante, ou cinza neutro se ausente. */
const herdaCor = (regs: Registro[]): string => {
  const emocoes = valencias(regs)
  if (emocoes.length === 0) return 'var(--muted-foreground)'
  return EMOCOES[emocoes[0]].cor
}

/** Valência média (-2 a +2) de um periodo. 0 = neutra. */
export const valenciaDoPeriodo = (regs: Registro[]): number => {
  if (regs.length === 0) return 0
  let soma = 0
  let n = 0
  for (const r of regs) {
    for (const e of r.emocoes) {
      soma += VALENCIA[e]
      n += 1
    }
  }
  return n === 0 ? 0 : soma / n
}

// ─── Tipos de Eco ─────────────────────────────────────────────────────────

/** O texto mais antigo (primeiro registro) de um dia — quando houver. */
export interface EcoRasgado {
  /** ISO date. */
  data: string
  /** Emoções dominantes do dia, em ordem de frequência. Até 3. */
  humor: Emocao[]
  /** Energia agregada do dia (1-5). */
  energia: Energia
  /** Cor herdada do humor dominante. */
  cor: string
  /** Valência agregada (-2 a +2). */
  valencia: number
  /** Primeira frase do primeiro texto do dia, cortada (~120 chars). */
  preambulo: string | null
  /** Título do primeiro registro do dia, se houver. */
  titulo: string | null
  /** Prompt que puxou a escrita, se houver. */
  prompt: string | null
}

/** EcoRasgado de um dia específico. `null` = silêncio (sem registro). */
export const ecoDoDia = (registros: Registro[], iso: string): EcoRasgado | null => {
  const doDia = registros.filter((r) => r.data === iso && r.periodo === 'dia')
  if (doDia.length === 0) return null
  const primeiro = doDia.reduce((acc, r) => (r.criadoEm < acc.criadoEm ? r : acc), doDia[0])
  const texto = primeiro.texto ?? ''
  const preambulo = texto.trim()
    ? texto.trim().slice(0, 120).replace(/\s+/g, ' ') + (texto.length > 120 ? '…' : '')
    : null
  return {
    data: iso,
    humor: valencias(doDia).slice(0, 3),
    energia: energiaMedia(doDia),
    cor: herdaCor(doDia),
    valencia: valenciaDoPeriodo(doDia),
    preambulo,
    titulo: primeiro.titulo ?? null,
    prompt: primeiro.prompt ?? null,
  }
}

// ─── Linha de vida — 7 dias como um único gesto ───────────────────────────

/** Um vértice por dia da janela de 7 dias. */
export interface VerticeLinha {
  /** ISO date. */
  data: string
  /** Energia agregada do dia (default 3 = neutra). */
  energia: Energia
  /** Cor herdada do humor dominante; `null` quando não há registro. */
  cor: string | null
  /** `true` quando há um Registro neste dia. */
  escrito: boolean
  /** Valência agregada (-2..+2), útil para colorir o traço. */
  valencia: number
}

/**
 * Janela dos últimos 7 dias terminando em hoje. Retornamos em ordem
 * cronológica (passado → presente), porque é assim que o traço
 * se desenha — da esquerda para a direita.
 */
export const linhaSeteDias = (registros: Registro[]): VerticeLinha[] => {
  const seteISOs = Array.from({ length: 7 }, (_, i) => offsetIso(-(6 - i)))
  return seteISOs.map((iso) => {
    const doDia = registros.filter((r) => r.data === iso && r.periodo === 'dia')
    const escrito = doDia.length > 0
    return {
      data: iso,
      energia: escrito ? energiaMedia(doDia) : 3,
      cor: escrito ? herdaCor(doDia) : null,
      escrito,
      valencia: escrito ? valenciaDoPeriodo(doDia) : 0,
    }
  })
}

// ─── Ecos do sistema — o diário lê o resto ────────────────────────────────

export interface EcoFinanceiro {
  /** Gasto de hoje em centavos (somatório de `type==='expense'`). */
  gastoDia: number
  /** Receita de hoje em centavos. */
  receitaDia: number
  /** Número de transações do dia. */
  transacoes: number
  /** `true` se houve gasto superior a R$ 100 e valência < 0 (dia tenso). */
  diaTenso: boolean
}

/**
 * Lê as transações de um dia e devolve um eco financeiro. Não
 * interpreta nada; apenas reúne o que o dashboard pode exibir.
 */
export const ecoFinanceiro = (registros: Registro[], transacoes: Transaction[], iso: string): EcoFinanceiro => {
  const todas = transacoes.filter((t) => t.date === iso)
  const gasto = todas.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const receita = todas.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const regs = registros.filter((r) => r.data === iso && r.periodo === 'dia')
  const valencia = valenciaDoPeriodo(regs)
  const diaTenso = gasto > 10000 && valencia < 0
  return {
    gastoDia: gasto,
    receitaDia: receita,
    transacoes: todas.length,
    diaTenso,
  }
}

export interface EcoChecklist {
  /** Itens pendentes somados de todos os checklists. */
  pendentes: number
  /** Itens riscados somados de todos os checklists. */
  feitos: number
  /** `true` se energia do dia ≤ 2 e há pendentes — sugerir "só três". */
  sugerirTres: boolean
}

/**
 * Lê todas as checklists e devolve um eco. Quando energia do dia é
 * baixa, sugerimos uma versão recolhida — não exibimos a frota inteira.
 */
export const ecoChecklist = (
  registros: Registro[],
  checklists: Checklist[],
  iso: string,
): EcoChecklist => {
  const pendentes = checklists.reduce(
    (acc, c) => acc + c.items.filter((i) => !i.checked).length,
    0,
  )
  const feitos = checklists.reduce(
    (acc, c) => acc + c.items.filter((i) => i.checked).length,
    0,
  )
  const regs = registros.filter((r) => r.data === iso && r.periodo === 'dia')
  const energia = regs.length > 0 ? energiaMedia(regs) : 3
  return {
    pendentes,
    feitos,
    sugerirTres: pendentes > 0 && energia <= 2,
  }
}

export interface EcoCalendario {
  /** Eventos de hoje, ordenados por horário. */
  eventos: CalendarEvent[]
  /** Próximo evento (ainda não começou), ou `null`. */
  proximo: CalendarEvent | null
}

/** Eventos de um dia, com o mais próximo de "agora" marcado. */
export const ecoCalendario = (eventos: CalendarEvent[], iso: string): EcoCalendario => {
  const doDia = eventos.filter((e) => e.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const agora = new Date()
  const agoraHHMM = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
  const proximo = doDia.find((e) => e.startTime > agoraHHMM) ?? null
  return { eventos: doDia, proximo }
}

// ─── A ABRIR — gancho à escrita quando o dia ainda não foi escrito ─────────

export type ConviteEscrita =
  | { preciso: true; prompt: string }
  | { preciso: false; jahEscrito: true }
  | { preciso: false; jahEscrito: false }

/**
 * Decide o que dizer quando o usuário abre o dashboard de manhã.
 * - Hoje já foi escrito? Optamos por não insistir (`jahEscrito: true`).
 * - Senão, oferecemos o prompt determinístico do dia (consistente
 *   com `promptDoDia` do store, mas isolado para a camada de eco).
 */
export const conviteDeHoje = (registros: Registro[], promptDoDiaFn: () => string): ConviteEscrita => {
  const escHoje = registros.some((r) => r.data === hoje() && r.periodo === 'dia')
  if (escHoje) return { preciso: false, jahEscrito: true }
  return { preciso: true, prompt: promptDoDiaFn() }
}

// ─── diáspora emocional ─────────────────────────────────────────────────────

/** Retroativo de 90 dias. Conta quantas vezes cada emoção apareceu. */
export const constelacaoDeEmocoes = (
  registros: Registro[],
  dias = 90,
): { emocao: Emocao; n: number; ultimaVez: string | null }[] => {
  const desde = offsetIso(-dias)
  const contagem = new Map<Emocao, { n: number; ultima: string | null }>()
  for (const r of registros) {
    if (r.data < desde) continue
    for (const e of r.emocoes) {
      const prev = contagem.get(e) ?? { n: 0, ultima: null }
      prev.n += 1
      if (!prev.ultima || r.data > prev.ultima) prev.ultima = r.data
      contagem.set(e, prev)
    }
  }
  return [...contagem.entries()]
    .map(([emocao, v]) => ({ emocao, n: v.n, ultimaVez: v.ultima }))
    .sort((a, z) => z.n - a.n)
}

// ─── Andar do dia — como "ler" a sua semana em uma frase ───────────────────

const TRACOS_BAIXOS = ['afundando', 'no fundo do poço', 'puxando o freio', 'não rendendo']
const TRACOS_MEDIOS = ['no eixo', 'no compasso', 'no passo', 'fiel ao ritmo']
const TRACOS_ALTOS = ['transbordando', 'com asa', 'em fúria suave', 'no pico']

const rotuloValencia = (v: number): string => {
  if (v <= -1.5) return 'pesado'
  if (v <= -0.5) return 'tenso'
  if (v < 0.5) return 'em pé'
  if (v < 1.5) return 'leve'
  return 'fácil'
}

/**
 * Síntese de uma semana em uma linha, no idioma do diário (Caveat).
 * Não é estatística — é uma frase manuscrita. Nem sempre haverá
 * registros suficientes; devolvemos `null` quando o silêncio é mais
 * honesto do que o conselho.
 */
export const fraseDaSemana = (registros: Registro[]): string | null => {
  const sete = linhaSeteDias(registros)
  const escritos = sete.filter((d) => d.escrito)
  if (escritos.length === 0) return null
  const energiaMediana = escritos.sort((a, z) => a.energia - z.energia)[Math.floor(escritos.length / 2)].energia
  const valenciaTexto = rotuloValencia(sete.reduce((a, d) => a + d.valencia, 0) / sete.length)
  let bolt: string
  if (energiaMediana <= 2) bolt = TRACOS_BAIXOS[escritos.length % TRACOS_BAIXOS.length]
  else if (energiaMediana <= 3) bolt = TRACOS_MEDIOS[(escritos.length + 1) % TRACOS_MEDIOS.length]
  else bolt = TRACOS_ALTOS[(escritos.length + 2) % TRACOS_ALTOS.length]
  if (escritos.length >= 5) return `uma semana ${bolt}, ${valenciaTexto}`
  if (escritos.length >= 3) return `semana curta, ${bolt}`
  return `dois toques na semana — ${bolt}`
}

// ─── Sinais finos ───────────────────────────────────────────────────────────

/**
 * `true` se nas duas últimas semanas a valência média vem caindo
 * (média dos últimos 7 < média dos 7 anteriores). Não diagnosticamos;
 * apenas devolvemos um sinal para o dashboard desenhar discretamente.
 */
export const descidaDeHumor = (registros: Registro[]): boolean => {
  const agora = linhaSeteDias(registros)
  const anteriores = Array.from({ length: 7 }, (_, i) => offsetIso(-(13 - i))).map((iso) => {
    const doDia = registros.filter((r) => r.data === iso && r.periodo === 'dia')
    return valenciaDoPeriodo(doDia)
  })
  const mediaAgora = agora.reduce((a, d) => a + d.valencia, 0)
  const mediaAnt = anteriores.reduce((a, v) => a + v, 0)
  return mediaAgora < mediaAnt - 0.4
}
