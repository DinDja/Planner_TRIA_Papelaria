// ─── Extração de features de glifo ───────────────────────────────────────────
// Representa cada candidato a caractere como uma sequência de frames de
// direção (cos θ, sen θ) com marcadores de pen-up entre traços, mais um
// vetor estrutural (loops, pingos, barras, zonas verticais). É a mesma
// featurização para candidatos e protótipos — comparáveis via DTW.

import {
  bbox,
  bboxCy,
  bboxUnion,
  pathLength,
  resampleCount,
  selfIntersections,
  type BBox,
  type Pt,
} from './geometry'
import type { CleanStroke } from './preprocess'

export const GLYPH_N = 48

export interface Frame {
  /** cos/sen da direção do segmento. */
  c: number
  s: number
  /** 1 = pen-down; 0 = salto pen-up entre traços. */
  pen: number
}

/** Zona vertical esperada relativa à banda da linha (em unidades de altura-x). */
export interface Zone {
  /** Topo relativo: 0 = topo do x; ≈-0.65 = ascendentes/maiúsculas/dígitos. */
  top: number
  /** Base relativa: 1 = baseline; ≈1.45 = descendentes. */
  bot: number
}

export interface GlyphFeat {
  frames: Frame[]
  nStrokes: number
  /** largura/altura da caixa normalizada. */
  aspect: number
  /** altura real / altura-x da linha. */
  relHeight: number
  loops: number
  dotAbove: boolean
  dotBelow: boolean
  barAcross: boolean
  zone: Zone
}

/** Concatena traços normalizados em N pontos, distribuídos por comprimento. */
export function strokesToFrames(strokes: Pt[][], n: number = GLYPH_N): Frame[] {
  const lens = strokes.map((st) => Math.max(pathLength(st), 1e-6))
  const total = lens.reduce((a, b) => a + b, 0)
  const counts = lens.map((l) => Math.max(2, Math.round((n * l) / total)))
  // Ajusta para somar exatamente n
  let sum = counts.reduce((a, b) => a + b, 0)
  let i = counts.indexOf(Math.max(...counts))
  while (sum > n && counts.some((c) => c > 2)) {
    if (counts[i] > 2) {
      counts[i]--
      sum--
    }
    i = (i + 1) % counts.length
  }
  while (sum < n) {
    counts[i]++
    sum++
    i = (i + 1) % counts.length
  }

  const frames: Frame[] = []
  strokes.forEach((st, si) => {
    const pts = resampleCount(st, counts[si])
    for (let k = 1; k < pts.length; k++) {
      const ang = Math.atan2(pts[k].y - pts[k - 1].y, pts[k].x - pts[k - 1].x)
      frames.push({ c: Math.cos(ang), s: Math.sin(ang), pen: 1 })
    }
    if (si < strokes.length - 1) {
      // Frame de salto pen-up até o próximo traço
      frames.push({ c: 0, s: 0, pen: 0 })
    }
  })
  return frames
}

function countLoops(strokes: Pt[][]): number {
  let loops = 0
  for (const st of strokes) {
    const r = resampleCount(st, 40)
    loops += selfIntersections(r, 4)
  }
  return loops
}

export interface GlyphContext {
  /** Baseline da linha (coordenada original). */
  baselineY: number
  /** Altura-x da linha (px). */
  xHeight: number
}

/**
 * Featuriza um candidato: corpo + marcas anexadas, no contexto da linha.
 */
export function featurizeGlyph(
  body: CleanStroke[],
  marks: CleanStroke[],
  ctx: GlyphContext,
): GlyphFeat {
  const all = [...body, ...marks]
  const box = all.map((s) => s.box).reduce(bboxUnion)
  // Normaliza todos os traços pela MESMA caixa (altura = 1, proporção preservada)
  const normUnified = all.map((s) =>
    s.pts.map((p) => ({ x: (p.x - box.x) / box.h, y: (p.y - box.y) / box.h })),
  )

  const frames = strokesToFrames(normUnified)
  const bodyBox = body.map((s) => s.box).reduce(bboxUnion)

  let dotAbove = false
  let dotBelow = false
  let barAcross = false
  for (const m of marks) {
    const mBox: BBox = m.box
    const isBar = mBox.w / Math.max(mBox.h, 1e-6) > 2.2
    const overlapsX = mBox.x + mBox.w > bodyBox.x - 0.2 * bodyBox.w && mBox.x < bodyBox.x + bodyBox.w + 0.2 * bodyBox.w
    if (isBar && bboxCy(mBox) < bboxCy(bodyBox) && overlapsX) barAcross = true
    else if (bboxCy(mBox) < bodyBox.y + 0.25 * bodyBox.h && overlapsX) dotAbove = true
    else if (mBox.y > bodyBox.y + 0.85 * bodyBox.h && overlapsX) dotBelow = true
  }

  const bandTop = ctx.baselineY - ctx.xHeight
  return {
    frames,
    nStrokes: all.length,
    aspect: box.w / Math.max(box.h, 1e-6),
    relHeight: box.h / Math.max(ctx.xHeight, 1e-6),
    loops: countLoops(normUnified),
    dotAbove,
    dotBelow,
    barAcross,
    zone: {
      top: (box.y - bandTop) / ctx.xHeight,
      bot: (box.y + box.h - bandTop) / ctx.xHeight,
    },
  }
}

/**
 * Featuriza um protótipo (caixa unitária, contexto sintético).
 * `zone` e `relHeight` são declarados pela tabela de classes do caractere.
 */
export function featurizePrototype(
  strokes: Pt[][],
  zone: Zone,
  relHeight: number,
  flags?: { dotAbove?: boolean; dotBelow?: boolean; barAcross?: boolean },
): GlyphFeat {
  const box = strokes.map((st) => bbox(st)).reduce(bboxUnion)
  const norm = strokes.map((st) =>
    st.map((p) => ({ x: (p.x - box.x) / Math.max(box.h, 1e-6), y: (p.y - box.y) / Math.max(box.h, 1e-6) })),
  )
  return {
    frames: strokesToFrames(norm),
    nStrokes: strokes.length,
    aspect: box.w / Math.max(box.h, 1e-6),
    relHeight,
    loops: countLoops(norm),
    dotAbove: flags?.dotAbove ?? false,
    dotBelow: flags?.dotBelow ?? false,
    barAcross: flags?.barAcross ?? false,
    zone,
  }
}
