// ─── Pré-processamento de traços ─────────────────────────────────────────────
// Limpa o dado bruto do canvas: remove jitter, pontos duplicados, suaviza e
// reamostra. Marca texto (highlighter) e régua são ignorados — não são escrita.

import type { Stroke } from '../types'
import {
  bbox,
  pathLength,
  resampleSpacing,
  smoothEMA,
  type BBox,
  type Pt,
} from './geometry'

export interface CleanStroke {
  id: string
  pts: Pt[]
  box: BBox
  length: number
  /** Espessura lógica da caneta (px) — usada na rasterização de fallback. */
  size: number
  tool: Stroke['tool']
}

const IGNORED_TOOLS = new Set(['highlighter', 'ruler'])

function dedupe(pts: Pt[], minDist: number): Pt[] {
  if (pts.length < 2) return pts.slice()
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const prev = out[out.length - 1]
    if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) >= minDist) {
      out.push(pts[i])
    }
  }
  return out
}

export function cleanStrokes(strokes: Stroke[]): CleanStroke[] {
  const out: CleanStroke[] = []
  for (const s of strokes) {
    if (IGNORED_TOOLS.has(s.tool)) continue
    if (!s.points || s.points.length === 0) continue

    let pts: Pt[] = s.points.map((p) => ({ x: p.x, y: p.y }))
    pts = dedupe(pts, 0.6)
    if (pts.length === 0) continue
    if (pts.length === 1) {
      // Ponto isolado (ex.: pingo do "i") — vira micro-segmento para ter direção.
      pts = [pts[0], { x: pts[0].x + 0.01, y: pts[0].y + 0.01 }]
    }
    pts = smoothEMA(pts, 0.4)
    pts = resampleSpacing(pts, 2.5)

    out.push({
      id: s.id,
      pts,
      box: bbox(pts),
      length: pathLength(pts),
      size: s.size,
      tool: s.tool,
    })
  }
  return out
}
