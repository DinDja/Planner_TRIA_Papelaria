// ─── Análise de layout: linhas → palavras → corpos/marcas ────────────────────
// Segmentação 100% vetorial. Agrupa traços por proximidade vertical (linhas),
// estima inclinação de cada linha e aplica deskew; depois corta em palavras
// por análise de gaps horizontais. Traços minúsculos acima/abaixo da banda do
// corpo (pingos, acentos, barras de t/f) são separados como "marcas" e
// anexados ao caractere correto na etapa de hipóteses.

import {
  bbox,
  bboxCx,
  bboxCy,
  bboxUnion,
  centroid,
  clamp,
  median,
  rotate,
  type BBox,
  type Pt,
} from './geometry'
import type { CleanStroke } from './preprocess'

export interface SegWord {
  /** Traços do corpo da palavra, ordenados por x. */
  strokes: CleanStroke[]
  /** Pingos/acentos/barras anexáveis a caracteres desta palavra. */
  marks: CleanStroke[]
  box: BBox
}

export interface SegLine {
  /** Traços já com deskew aplicado (coordenadas da linha). */
  strokes: CleanStroke[]
  words: SegWord[]
  box: BBox
  /** Y da baseline estimada (coordenada da linha, pós-deskew). */
  baselineY: number
  /** Altura-x estimada da linha (px). */
  xHeight: number
  /** Ângulo removido pelo deskew (radianos). */
  angle: number
}

function remapStroke(s: CleanStroke, pts: Pt[]): CleanStroke {
  return { ...s, pts, box: bbox(pts) }
}

/** Agrupa traços em linhas por proximidade do centro-y (sweep com tolerância adaptativa). */
export function segmentLines(strokes: CleanStroke[]): SegLine[] {
  if (strokes.length === 0) return []

  const medH = Math.max(median(strokes.map((s) => s.box.h)), 6)
  const tol = Math.max(medH * 1.1, 12)
  const sorted = [...strokes].sort((a, b) => bboxCy(a.box) - bboxCy(b.box))

  interface Acc {
    strokes: CleanStroke[]
    cy: number
  }
  const groups: Acc[] = []
  for (const s of sorted) {
    const c = bboxCy(s.box)
    let best: Acc | null = null
    let bestD = tol
    for (const g of groups) {
      const d = Math.abs(c - g.cy)
      if (d < bestD) {
        bestD = d
        best = g
      }
    }
    if (best) {
      best.strokes.push(s)
      // Média móvel do centro da linha
      best.cy = best.strokes.reduce((acc, st) => acc + bboxCy(st.box), 0) / best.strokes.length
    } else {
      groups.push({ strokes: [s], cy: c })
    }
  }
  groups.sort((a, b) => a.cy - b.cy)
  return groups.map((g) => buildLine(g.strokes))
}

/** Deskew por regressão dos centroides + estimativa de baseline e altura-x. */
function buildLine(lineStrokes: CleanStroke[]): SegLine {
  // Regressão y ~ x dos centroides ponderada pelo comprimento do traço
  let sw = 0
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  for (const s of lineStrokes) {
    const c = centroid(s.pts)
    const w = Math.max(s.length, 1)
    sw += w
    sx += w * c.x
    sy += w * c.y
    sxx += w * c.x * c.x
    sxy += w * c.x * c.y
  }
  const denom = sw * sxx - sx * sx
  const slope = Math.abs(denom) > 1e-9 ? (sw * sxy - sx * sy) / denom : 0
  const angle = clamp(Math.atan(slope), -0.26, 0.26) // máx ±15°

  const allPts = lineStrokes.flatMap((s) => s.pts)
  const pivot = centroid(allPts)
  const rotated = angle !== 0 ? lineStrokes.map((s) => remapStroke(s, rotate(s.pts, -angle, pivot))) : lineStrokes

  // Altura-x: mediana das alturas dos traços (robusta a ascendentes/descendentes)
  const xHeight = Math.max(median(rotated.map((s) => s.box.h)), 8)
  // Baseline: mediana das bases dos traços
  const baselineY = median(rotated.map((s) => s.box.y + s.box.h))

  const box = rotated.map((s) => s.box).reduce(bboxUnion)
  const words = segmentWords(rotated, xHeight, baselineY)
  return { strokes: rotated, words, box, baselineY, xHeight, angle }
}

/**
 * Corta a linha em palavras por gaps horizontais e separa marcas.
 * Um traço é "marca" se for minúsculo e estiver fora da banda do corpo
 * (pingos de i/j, acentos, cedilha) ou uma barra horizontal curta acima do
 * meio da banda (travisseiro de t/f). Pontos finais e vírgulas ficam na
 * banda do corpo e seguem como traços normais (viram pontuação).
 */
export function segmentWords(strokes: CleanStroke[], xHeight: number, baselineY: number): SegWord[] {
  if (strokes.length === 0) return []
  const sorted = [...strokes].sort((a, b) => a.box.x - b.box.x)
  const wordGap = Math.max(xHeight * 0.85, 12)

  const groups: CleanStroke[][] = []
  let cur: CleanStroke[] = [sorted[0]]
  let curRight = sorted[0].box.x + sorted[0].box.w
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i]
    if (s.box.x - curRight > wordGap) {
      groups.push(cur)
      cur = [s]
    } else {
      cur.push(s)
    }
    curRight = Math.max(curRight, s.box.x + s.box.w)
  }
  groups.push(cur)

  const bandTop = baselineY - xHeight * 1.25
  const bandBottom = baselineY + xHeight * 0.15

  return groups.map((g) => {
    const body: CleanStroke[] = []
    const marks: CleanStroke[] = []
    for (const s of g) {
      const tiny = s.box.h < 0.34 * xHeight && s.box.w < 0.4 * xHeight
      const above = bboxCy(s.box) < bandTop + 0.35 * xHeight
      const below = s.box.y > bandBottom
      const bar = s.box.w / Math.max(s.box.h, 1e-6) > 2.2 && s.box.h < 0.3 * xHeight && above
      if ((tiny && (above || below)) || bar) marks.push(s)
      else body.push(s)
    }
    // Palavra composta só de marcas (ex.: "..." isolado): tudo vira corpo
    const finalBody = body.length > 0 ? body : g.slice()
    const finalMarks = body.length > 0 ? marks : []
    const box = g.map((s) => s.box).reduce(bboxUnion)
    return { strokes: finalBody, marks: finalMarks, box }
  })
}

export { bboxCx }
