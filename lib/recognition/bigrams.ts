// ─── Modelo de linguagem de caracteres (bigramas) ────────────────────────────
// Substitui a decisão "glifo isolado" do decodificador DP por um modelo
// sequencial: P(c2 | c1) e P(c1 | início). Muito do erro de HTR vem de
// segmentações absurdas que o classificador isolado não consegue descartar
// (ex.: "oi" fundido vira "à" — os traços são idênticos, só o contexto
// linguístico separa). Frequências vêm do léxico + corpus curado de pt-BR/en
// + dígitos sintéticos; suavização de Laplace; retrocesso por classe
// (vogal/consoante/dígito/pontuação) para pares não vistos.

import { getLexiconWords, type LexLang } from './lexicon'

export const START = '^'

// Classes de letras para retrocesso em pares não vistos
const VOWELS = new Set('aáàâãeéêiíioóôõuúüy'.split(''))
const ACCENTED = new Set('áàâãéêíóôõúüç'.split(''))
const DIGITS = new Set('0123456789'.split(''))
const PUNCT = new Set('.,;:!?\'"-()/+='.split(''))

function cls(ch: string): string {
  if (ch === START) return 'start'
  if (DIGITS.has(ch)) return 'digit'
  if (PUNCT.has(ch)) return 'punct'
  if (ACCENTED.has(ch)) return 'accented'
  if (VOWELS.has(ch)) return 'vowel'
  return 'consonant'
}

// Corpus curado — frases e digrafos comuns de planner/idioma. As contagens
// importam mais que a forma: pares frequentes do Português escrito.
const PT_CORPUS = [
  'fazer compras no supermercado hoje de manhã',
  'reunião com a equipe para o projeto novo',
  'preciso pagar a conta de luz e internet',
  'marcar consulta com o dentista amanhã',
  'levar as crianças para a escola',
  'estudar português e matemática à noite',
  'treinar academia cedo antes do trabalho',
  'comprar presente para o aniversário dela',
  'enviar email para o cliente sobre o relatório',
  'organizar a casa e lavar a roupa no sábado',
  'aliás querem todas as vezes que fica',           // digrafos: li/ás, qu, ve, nh, ch, ss, lh
  'aquele exemplo mostra muita coisa para nós',
  'que bom isso aqui funciona como sempre',
  'trabalho semana feriado janeiro fevereiro',
  'não sabemos onde estão aquelas páginas',
  'cuidado com o filho dele depois da aula',
  'revisar as tarefas antes do prazo final',
  'jantar com a família no domingo à noite',
  'caminhar no parque depois do almoço',
  'quase esqueci o remédio de ontem',
  'faltou pouco para conseguir a meta',
  'mesmo assim vamos tentar novamente',
  'cada pessoa tem sua própria história',
  'segunda terça quarta quinta sexta sábado',
  'agendar reunião depois do café da tarde',
]

const EN_CORPUS = [
  'the quick brown fox jumps over the lazy dog',
  'remember to buy milk and bread tomorrow',
  'call the doctor about the appointment',
  'finish the report before the meeting',
  'walk the dog in the park this morning',
  'read the book chapter number five',
  'write an email to the new client',
  'schedule the meeting for monday',
  'pay the bill at the bank today',
  'study english and math at night',
  'clean the house and wash the dishes',
]

// Frequência aproximada de dígitos (anos, horas, quantidades) — pares dígito+dígito
const DIGIT_SEQS = [
  '0123456789', '2024', '2025', '2026', '2023', '2022', '2021', '2030',
  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25',
  '30', '40', '50', '60', '70', '80', '90', '100', '200', '300', '500', '1000', '7', '9',
]

interface BigramModel {
  /** P(c2 | c1) — log. c1 pode ser START. */
  logP: Map<string, number>
  /** Retrocesso por classe: P(classe | classe) log. */
  logPClass: Map<string, number>
  /** Evita reprocessar igual. */
}

const cache = new Map<LexLang, BigramModel>()

// Frequência relativa de letras em textos pt-BR / en (início de palavra
// tende a consoantes; P(à|^) é ~10× menor que P(o|^) — o léxico sozinho
// trata artigos e preposições com peso idêntico).
const PT_LETTER_FREQ: Record<string, number> = {
  a: 0.084, b: 0.013, c: 0.042, d: 0.042, e: 0.102, f: 0.011, g: 0.011, h: 0.005,
  i: 0.071, j: 0.002, k: 0.0002, l: 0.03, m: 0.048, n: 0.045, o: 0.092, p: 0.026,
  q: 0.008, r: 0.052, s: 0.077, t: 0.039, u: 0.033, v: 0.015, w: 0.0005, x: 0.002,
  y: 0.0005, z: 0.004, á: 0.0022, à: 0.0011, â: 0.0012, ã: 0.005, é: 0.004,
  ê: 0.0006, í: 0.002, ó: 0.0028, ô: 0.0005, õ: 0.003, ú: 0.0012, ü: 0.0001, ç: 0.002,
}
const EN_LETTER_FREQ: Record<string, number> = {
  a: 0.082, b: 0.015, c: 0.028, d: 0.043, e: 0.127, f: 0.022, g: 0.02, h: 0.061,
  i: 0.07, j: 0.0015, k: 0.0077, l: 0.04, m: 0.024, n: 0.067, o: 0.075, p: 0.019,
  q: 0.001, r: 0.06, s: 0.063, t: 0.091, u: 0.028, v: 0.0098, w: 0.024, x: 0.0015,
  y: 0.02, z: 0.0007,
}

function letterFreq(ch: string, lang: LexLang): number {
  const table = lang === 'eng' ? EN_LETTER_FREQ : PT_LETTER_FREQ
  return table[ch.toLowerCase()] ?? 1e-4
}

function build(lang: LexLang): BigramModel {
  const counts = new Map<string, number>()
  const totals = new Map<string, number>()
  const startCounts = new Map<string, number>()
  const classCounts = new Map<string, number>()
  const classTotals = new Map<string, number>()

  let nWords = 0
  const addPair = (a: string, b: string, w = 1) => {
    counts.set(a + b, (counts.get(a + b) ?? 0) + w)
    totals.set(a, (totals.get(a) ?? 0) + w)
    classCounts.set(cls(a) + ':' + cls(b), (classCounts.get(cls(a) + ':' + cls(b)) ?? 0) + w)
    classTotals.set(cls(a), (classTotals.get(cls(a)) ?? 0) + w)
  }
  const addWord = (word: string, w = 1) => {
    const chars = word.toLowerCase().split('')
    if (chars.length === 0) return
    nWords += w
    startCounts.set(chars[0], (startCounts.get(chars[0]) ?? 0) + w)
    for (let i = 1; i < chars.length; i++) addPair(chars[i - 1], chars[i], w)
  }

  for (const word of getLexiconWords(lang)) addWord(word, 1)
  for (const seg of lang === 'por' ? PT_CORPUS : lang === 'eng' ? EN_CORPUS : [...PT_CORPUS, ...EN_CORPUS]) {
    for (const word of seg.split(/\s+/)) addWord(word, 8)
  }
  for (const seq of DIGIT_SEQS) addWord(seq, 4)

  const V = counts.size + 4 // vocabulário efetivo
  const logP = new Map<string, number>()
  for (const [key, c] of counts) {
    const a = key[0]
    const t = totals.get(a) ?? 0
    logP.set(key, Math.log((c + 1) / (t + V)))
  }
  for (const [a, t] of totals) {
    const unseen = Math.log(1 / (t + V))
    logP.set(a + '*', unseen)
  }
  // START: P(c1 | início)
  for (const [c, s] of startCounts) logP.set(START + c, Math.log((s + 1) / (nWords + V)))
  const startUnseen = Math.log(1 / (nWords + V))
  for (const c of 'abcdefghijklmnopqrstuvwxyz0123456789') {
    if (!logP.has(START + c)) logP.set(START + c, startUnseen)
  }
  logP.set(START + '*', startUnseen)

  // Retrocesso por classe
  const logPClass = new Map<string, number>()
  for (const [key, c] of classCounts) {
    const ca = key.split(':')[0]
    const t = classTotals.get(ca) ?? 0
    logPClass.set(key, Math.log((c + 1) / (t + 7)))
  }
  for (const [a, t] of classTotals) {
    logPClass.set(a + '*', Math.log(1 / (t + 7)))
  }

  return { logP, logPClass }
}

function getModel(lang: LexLang): BigramModel {
  let m = cache.get(lang)
  if (!m) {
    m = build(lang)
    cache.set(lang, m)
  }
  return m
}

/**
 * Burro log-bigrama P(b | a), com retrocesso por classe e um piso seguro.
 * `a` pode ser START ('^'). Valores entre ~ -12 (absurdo) e 0 (certo).
 */
export function bigramLogP(a: string, b: string, lang: LexLang): number {
  const m = getModel(lang)
  const key = a + b
  const direct = m.logP.get(key)
  if (direct !== undefined) return direct
  const fallback = m.logP.get(a + '*') ?? m.logP.get(START + '*') ?? Math.log(1e-4)
  // Retrocesso por classe suavizado — não é tão severo quanto o direto desconhecido
  const ck = cls(a) + ':' + cls(b)
  const ck2 = cls(a) + '*'
  const cfb = m.logPClass.get(ck) ?? m.logPClass.get(ck2) ?? Math.log(1e-3)
  return Math.max(fallback * 0.5 + cfb * 0.5, Math.log(1e-8))
}

/** Custo (≥0) de emitir o caractere `b` após `a` (a = START no início). */
export function bigramCost(a: string, b: string, lang: LexLang): number {
  return -bigramLogP(a, b, lang)
}