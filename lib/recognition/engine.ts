// ─── Motor de reconhecimento de escrita (HTR vetorial) ───────────────────────
// Pipeline profissional de reconhecimento ONLINE (usa os vetores dos traços,
// não raster):
//
//   traços → limpeza → linhas (cluster y + deskew) → palavras (gaps x)
//   → hipóteses de caracteres (agrupamento de 1..3 traços + splits)
//   → classificação DTW contra protótipos → busca DP no lattice
//   → pós-processamento lexical (score, correção, restauração de acentos)
//
// A busca por programação dinâmica escolhe a segmentação + sequência de
// caracteres que maximiza a verossimilhança global da palavra — o mesmo
// princípio de motores comerciais (lattice de hipóteses + modelo de linguagem).

import { dtwFrames } from './dtw'
import { featurizeGlyph, type GlyphContext, type GlyphFeat } from './features'
import { bbox, bboxCx, bboxUnion, clamp, type BBox, type Pt } from './geometry'
import {
  lexiconScore,
  normalizeWord,
  restoreAccents,
  suggest,
  type LexLang,
} from './lexicon'
import { bigramCost } from './bigrams'
import { cleanStrokes, type CleanStroke } from './preprocess'
import { getPrototypes } from './prototypes'
import { segmentLines, type SegLine, type SegWord } from './segment'
import type { CanvasData } from '../types'

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface RecognizedWord {
  text: string
  /** Texto cru antes da correção lexical. */
  raw: string
  confidence: number
  box: BBox
  /** Traços (pós-deskew) que compõem a palavra — usados no fallback raster. */
  strokes: CleanStroke[]
  xHeight: number
}

export interface RecognizedLine {
  text: string
  confidence: number
  box: BBox
  words: RecognizedWord[]
}

export interface RecognitionOutput {
  text: string
  lines: string[]
  lineDetails: RecognizedLine[]
  confidence: number
}

export interface EngineOptions {
  lang: LexLang
  onProgress?: (stage: 'lines', done: number, total: number) => void
}

// ─── Classificador de glifo ──────────────────────────────────────────────────

interface CharMatch {
  ch: string
  score: number
}

const TOP_K = 4

/** Exportado para testes/diagnóstico. */
export function classifyGlyph(feat: GlyphFeat): CharMatch[] {
  const protos = getPrototypes()
  const matches: CharMatch[] = []
  const relH = Math.max(feat.relHeight, 0.15)
  const aspect = Math.max(feat.aspect, 0.05)

  for (const p of protos) {
    const base = dtwFrames(feat.frames, p.feat.frames)
    if (!Number.isFinite(base)) continue

    let pen = 0
    pen += 0.22 * Math.abs(Math.log(relH / p.feat.relHeight))
    pen += 0.1 * Math.abs(Math.log(aspect / Math.max(p.feat.aspect, 0.05)))
    pen += 0.3 * Math.min(Math.abs(feat.loops - p.feat.loops), 2)
    if (feat.dotAbove !== p.feat.dotAbove) pen += 0.45
    if (feat.dotBelow !== p.feat.dotBelow) pen += 0.4
    if (feat.barAcross !== p.feat.barAcross) pen += 0.35
    pen +=
      0.3 *
      (clamp(Math.abs(feat.zone.top - p.feat.zone.top), 0, 1.5) +
        clamp(Math.abs(feat.zone.bot - p.feat.zone.bot), 0, 1.5))
    // Posição vertical da massa — separa "p" (massa embaixo) de "b"/"D" (no meio)
    pen += 0.8 * Math.abs(feat.centerY - p.feat.centerY)
    // Posição vertical do loop — separa "p"/"g" (loop embaixo) de "d"/"b" (loop no alto)
    if (feat.loopY >= 0 && p.feat.loopY >= 0) {
      pen += 0.9 * Math.abs(feat.loopY - p.feat.loopY)
    }

    const score = Math.exp(-3.0 * (base + pen))
    matches.push({ ch: p.ch, score })
  }

  matches.sort((a, b) => b.score - a.score)
  // Dedup por caractere (vários alógrafos) mantendo o melhor
  const seen = new Set<string>()
  const out: CharMatch[] = []
  for (const m of matches) {
    if (seen.has(m.ch)) continue
    seen.add(m.ch)
    out.push(m)
    if (out.length >= TOP_K) break
  }
  return out
}

// ─── Hipóteses de caracteres (over-segmentation) ─────────────────────────────

interface Hypo {
  /** nº de traços de corpo consumidos (1..3) */
  take: number
  /** Sequência FIXA de caracteres produzida por esta aresta (1 para grupos, 2 para splits). */
  seq: CharMatch[]
}

const SPLIT_PENALTY = 0.55

/** Atribui cada marca ao traço de corpo mais próximo em x; marcas órfãs viram pseudo-corpo. */
function arrangeWord(word: SegWord, xHeight: number): {
  body: CleanStroke[]
  marksOf: Map<number, CleanStroke[]>
} {
  const body = [...word.strokes]
  const marksOf = new Map<number, CleanStroke[]>()
  const stray: CleanStroke[] = []

  for (const m of word.marks) {
    const mcx = bboxCx(m.box)
    let bestIdx = -1
    let bestD = 0.8 * xHeight
    body.forEach((s, i) => {
      const d = Math.abs(mcx - bboxCx(s.box))
      if (d < bestD) {
        bestD = d
        bestIdx = i
      }
    })
    if (bestIdx >= 0) {
      const arr = marksOf.get(bestIdx) ?? []
      arr.push(m)
      marksOf.set(bestIdx, arr)
    } else {
      stray.push(m)
    }
  }

  // Marcas órfãs (ex.: pontuação solta) entram no corpo em ordem de x
  for (const s of stray) {
    let i = 0
    while (i < body.length && body[i].box.x < s.box.x) i++
    body.splice(i, 0, s)
    // Reindexa marksOf
    const re = new Map<number, CleanStroke[]>()
    for (const [k, v] of marksOf) re.set(k >= i ? k + 1 : k, v)
    marksOf.clear()
    for (const [k, v] of re) marksOf.set(k, v)
  }

  return { body, marksOf }
}

function marksForRange(marksOf: Map<number, CleanStroke[]>, i: number, j: number): CleanStroke[] {
  const out: CleanStroke[] = []
  for (let k = i; k <= j; k++) {
    const arr = marksOf.get(k)
    if (arr) out.push(...arr)
  }
  return out
}

/** Pontos de corte: vales inferiores (mudança descida→subida) na metade inferior do traço. */
function splitPoints(pts: Pt[]): number[] {
  const out: number[] = []
  const b = bbox(pts)
  const midY = b.y + b.h * 0.5
  for (let i = 2; i < pts.length - 2; i++) {
    const dyPrev = pts[i].y - pts[i - 2].y
    const dyNext = pts[i + 2].y - pts[i].y
    const inX = pts[i].x > b.x + b.w * 0.25 && pts[i].x < b.x + b.w * 0.75
    if (dyPrev > 0.5 && dyNext < -0.5 && pts[i].y > midY && inX) {
      if (out.length === 0 || i - out[out.length - 1] > 6) out.push(i)
    }
  }
  return out.slice(0, 4)
}

function splitStroke(s: CleanStroke, at: number): [CleanStroke, CleanStroke] {
  const a = { ...s, pts: s.pts.slice(0, at + 1) }
  const b = { ...s, pts: s.pts.slice(at) }
  return [
    { ...a, box: bbox(a.pts) },
    { ...b, box: bbox(b.pts) },
  ]
}

/** Monta o lattice de hipóteses por posição de traço. */
function buildHypotheses(word: SegWord, line: SegLine): Hypo[][] {
  const { body, marksOf } = arrangeWord(word, line.xHeight)
  const ctx: GlyphContext = { baselineY: line.baselineY, xHeight: line.xHeight }
  const n = body.length
  const lattice: Hypo[][] = Array.from({ length: n }, () => [])

  for (let i = 0; i < n; i++) {
    // Agrupamentos de 1..3 traços consecutivos — uma aresta por alternativa top-K
    for (let take = 1; take <= 3 && i + take <= n; take++) {
      const group = body.slice(i, i + take)
      const gBox = group.map((s) => s.box).reduce(bboxUnion)
      if (take > 1 && gBox.w > 2.4 * line.xHeight) break // largo demais p/ 1 caractere
      const marks = marksForRange(marksOf, i, i + take - 1)
      const feat = featurizeGlyph(group, marks, ctx)
      for (const alt of classifyGlyph(feat).slice(0, 3)) {
        lattice[i].push({ take, seq: [alt] })
      }
    }

    // Splits: traço largo único → 2 caracteres (letras ligadas: "rn", "cl", "vv"...)
    const s = body[i]
    if (s.box.w > 1.9 * line.xHeight && s.pts.length > 12) {
      for (const at of splitPoints(s.pts)) {
        const [sa, sb] = splitStroke(s, at)
        const marks = marksForRange(marksOf, i, i)
        const fa = featurizeGlyph([sa], [], ctx)
        const fb = featurizeGlyph([sb], marks, ctx)
        const ca = classifyGlyph(fa)
        const cb = classifyGlyph(fb)
        if (ca.length > 0 && cb.length > 0) {
          for (const x of ca.slice(0, 2)) {
            for (const y of cb.slice(0, 2)) {
              lattice[i].push({
                take: 1,
                seq: [
                  { ch: x.ch, score: x.score * Math.exp(-SPLIT_PENALTY) },
                  { ch: y.ch, score: y.score },
                ],
              })
            }
          }
        }
      }
    }
  }
  return lattice
}

// ─── Busca DP no lattice com bigramas + beam ─────────────────────────────────
// O custo de emitir um caractere combina a verossimilhança do classificador
// (−log score do glifo) com o modelo de linguagem de caracteres
// (−λ·log P(c | anterior)). O beam mantém as N melhores hipóteses por
// posição — sem bigramas, o DP não tem como preferir "oi" (2 caracteres) a
// "à" (1 glifo): os traços são literalmente os mesmos.

/** Peso do modelo de linguagem de caracteres no DP. */
const LM_WEIGHT = 0.18
/** Largura do beam (hipóteses mantidas por posição). */
const BEAM = 6
/** Nº de hipóteses finais usadas no re-scoring lexical. */
const NBEST = 5

interface DpNode {
  cost: number
  chars: CharMatch[]
}

/** Melhores sequências de caracteres consumindo todos os traços do corpo. */
function solveWord(lattice: Hypo[][], bodyLen: number, lang: LexLang): DpNode[] {
  const dp: DpNode[][] = Array.from({ length: bodyLen + 1 }, () => [])
  dp[0] = [{ cost: 0, chars: [] }]

  for (let i = 0; i < bodyLen; i++) {
    const cur = dp[i]
    if (cur.length === 0) continue
    for (const h of lattice[i]) {
      const j = i + h.take
      for (const curNode of cur) {
        // Custo de cada caractere da aresta: emissão + bigrama com o anterior
        const seq = h.seq
        let add = 0
        let prev = curNode.chars.length > 0 ? curNode.chars[curNode.chars.length - 1].ch : '^'
        for (let k = 0; k < seq.length; k++) {
          add += -Math.log(Math.max(seq[k].score, 1e-6))
          add += LM_WEIGHT * bigramCost(prev, seq[k].ch, lang)
          prev = seq[k].ch
        }
        const cost = curNode.cost + add
        const chars = [...curNode.chars, ...seq]
        const cell = dp[j]
        if (cell.length < BEAM) {
          cell.push({ cost, chars })
          cell.sort((a, b) => a.cost - b.cost)
        } else if (cost < cell[cell.length - 1].cost) {
          cell[cell.length - 1] = { cost, chars }
          cell.sort((a, b) => a.cost - b.cost)
        }
      }
    }
  }
  return dp[bodyLen].slice(0, NBEST)
}

// ─── Reconhecimento de palavra ───────────────────────────────────────────────

function recognizeWord(word: SegWord, line: SegLine, lang: LexLang): RecognizedWord | null {
  const { body } = arrangeWord(word, line.xHeight)
  if (body.length === 0) return null

  const lattice = buildHypotheses(word, line)
  const hypos = solveWord(lattice, body.length, lang)
  if (hypos.length === 0 || hypos[0].chars.length === 0) return null

  // ── Re-scoring: pondera a verossimilhança do caminho com o léxico ──
  interface Hypo { raw: string; charConf: number; lex: number; cost: number }
  const scored: Hypo[] = hypos.map((h) => {
    const raw = h.chars.map((c) => c.ch).join('')
    const pathScore = Math.exp(-h.cost)
    const charConf = Math.exp(
      h.chars.reduce((acc, c) => acc + Math.log(Math.max(c.score, 1e-6)), 0) / h.chars.length,
    )
    const isWord = /[a-zA-Zà-ÿ]{2,}/.test(raw)
    return { raw, charConf, lex: isWord ? lexiconScore(raw, lang) : 0.5, cost: h.cost }
  })
  scored.sort(
    (a, b) =>
      0.65 * (b.charConf - a.charConf) +
      0.2 * (b.lex - a.lex) +
      0.25 * (Math.exp(-b.cost) - Math.exp(-a.cost)),
  )

  const best = scored[0]
  const raw = best.raw
  let lex = best.lex
  const charConf = best.charConf

  // ── Pós-processamento lexical ──
  let text = raw
  const isWord = /[a-zA-Zà-ÿ]{2,}/.test(raw)
  if (isWord && lex < 1) {
    const cands = suggest(raw, lang, 2, 3)
    if (cands.length > 0 && (charConf < 0.6 || lex < 0.5)) {
      const sugg = cands[0]
      const bestScore = lexiconScore(sugg.word, lang)
      if (bestScore > lex + 0.2) {
        text = sugg.word
        lex = bestScore
      }
    }
  }
  if (isWord) {
    const restored = restoreAccents(text, lang)
    if (restored !== text) {
      text = restored
      lex = Math.max(lex, 0.95)
    }
  }

  const confidence = clamp(0.62 * charConf + 0.38 * lex, 0, 1)
  const allStrokes = [...word.strokes, ...word.marks]
  return {
    text,
    raw,
    confidence,
    box: word.box,
    strokes: allStrokes,
    xHeight: line.xHeight,
  }
}

// ─── API principal ───────────────────────────────────────────────────────────

const yieldUI = (): Promise<void> => new Promise((r) => setTimeout(r, 0))

export async function recognizeCanvasData(
  data: CanvasData,
  opts: EngineOptions,
): Promise<RecognitionOutput> {
  const strokes = cleanStrokes(data.strokes)
  const lines = segmentLines(strokes)
  const lineDetails: RecognizedLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const words: RecognizedWord[] = []
    for (const w of line.words) {
      const rw = recognizeWord(w, line, opts.lang)
      if (rw && rw.text.length > 0) words.push(rw)
    }
    const text = words.map((w) => w.text).join(' ')
    const confidence =
      words.length > 0
        ? words.reduce((a, w) => a + w.confidence * w.text.length, 0) /
          Math.max(
            words.reduce((a, w) => a + w.text.length, 0),
            1,
          )
        : 0
    if (text.trim().length > 0) {
      lineDetails.push({ text, confidence, box: line.box, words })
    }
    opts.onProgress?.('lines', i + 1, lines.length)
    await yieldUI()
  }

  const outLines = lineDetails.map((l) => l.text)
  const text = outLines.join('\n')
  const confidence =
    lineDetails.length > 0
      ? lineDetails.reduce((a, l) => a + l.confidence, 0) / lineDetails.length
      : 0

  return { text, lines: outLines, lineDetails, confidence }
}

export { normalizeWord }
