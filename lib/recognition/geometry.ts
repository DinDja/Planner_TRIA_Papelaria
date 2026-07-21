// ─── Matemática vetorial para reconhecimento de escrita online ───────────────
// Opera sobre polilinhas (traços) sem nunca rasterizar — explora ordem,
// direção e curvatura do gesto, como os motores profissionais de HTR.

export interface Pt {
  x: number
  y: number
}

export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y)

export function pathLength(pts: Pt[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i])
  return len
}

/**
 * Reamostragem equidistante exata por comprimento de arco.
 * Retorna exatamente `n` pontos (início e fim preservados).
 */
export function resampleCount(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return []
  if (pts.length === 1 || n < 2) {
    return Array.from({ length: Math.max(n, 1) }, () => ({ ...pts[0] }))
  }
  const cum: number[] = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
  const total = cum[cum.length - 1]
  if (total < 1e-9) return Array.from({ length: n }, () => ({ ...pts[0] }))

  const out: Pt[] = []
  let j = 0
  for (let k = 0; k < n; k++) {
    const t = (total * k) / (n - 1)
    while (j < cum.length - 2 && cum[j + 1] < t) j++
    const segLen = cum[j + 1] - cum[j]
    const f = segLen > 1e-12 ? (t - cum[j]) / segLen : 0
    out.push({
      x: pts[j].x + (pts[j + 1].x - pts[j].x) * f,
      y: pts[j].y + (pts[j + 1].y - pts[j].y) * f,
    })
  }
  return out
}

/** Reamostragem por espaçamento fixo (nº de pontos variável). */
export function resampleSpacing(pts: Pt[], spacing: number): Pt[] {
  const total = pathLength(pts)
  const n = Math.max(2, Math.round(total / Math.max(spacing, 1e-6)) + 1)
  return resampleCount(pts, n)
}

export function bbox(pts: Pt[]): BBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, w: Math.max(maxX - minX, 1e-6), h: Math.max(maxY - minY, 1e-6) }
}

export function bboxUnion(a: BBox, b: BBox): BBox {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const r = Math.max(a.x + a.w, b.x + b.w)
  const btm = Math.max(a.y + a.h, b.y + b.h)
  return { x, y, w: r - x, h: btm - y }
}

export const bboxCx = (b: BBox): number => b.x + b.w / 2
export const bboxCy = (b: BBox): number => b.y + b.h / 2

export function centroid(pts: Pt[]): Pt {
  let sx = 0
  let sy = 0
  for (const p of pts) {
    sx += p.x
    sy += p.y
  }
  const n = Math.max(pts.length, 1)
  return { x: sx / n, y: sy / n }
}

/** Suavização exponencial (EMA) — remove jitter sem destruir curvas. */
export function smoothEMA(pts: Pt[], alpha: number): Pt[] {
  if (pts.length < 3) return pts.slice()
  const out: Pt[] = [{ ...pts[0] }]
  for (let i = 1; i < pts.length; i++) {
    const prev = out[i - 1]
    out.push({
      x: prev.x + alpha * (pts[i].x - prev.x),
      y: prev.y + alpha * (pts[i].y - prev.y),
    })
  }
  return out
}

export function rotate(pts: Pt[], angle: number, center: Pt): Pt[] {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return pts.map((p) => {
    const dx = p.x - center.x
    const dy = p.y - center.y
    return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c }
  })
}

/**
 * Normaliza para caixa unitária: altura = 1 (proporção preservada),
 * canto superior-esquerdo na origem.
 */
export function normalizeBox(pts: Pt[]): Pt[] {
  const b = bbox(pts)
  const scale = 1 / Math.max(b.h, 1e-6)
  return pts.map((p) => ({ x: (p.x - b.x) * scale, y: (p.y - b.y) * scale }))
}

/** Ângulos de direção entre pontos consecutivos (atan2, y para baixo). */
export function directionAngles(pts: Pt[]): number[] {
  const out: number[] = []
  for (let i = 1; i < pts.length; i++) {
    out.push(Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x))
  }
  return out
}

function ccw(a: Pt, b: Pt, c: Pt): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/** Interseção estrita entre segmentos (ignora toque em extremidades). */
export function segmentsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d1 = ccw(p3, p4, p1)
  const d2 = ccw(p3, p4, p2)
  const d3 = ccw(p1, p2, p3)
  const d4 = ccw(p1, p2, p4)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

/**
 * Nº de auto-interseções de uma polilinha (≈ nº de loops).
 * Pares de segmentos vizinhos são ignorados.
 */
export function selfIntersections(pts: Pt[], minGap = 3): number {
  let count = 0
  const n = pts.length
  for (let i = 0; i + 1 < n; i++) {
    for (let j = i + minGap; j + 1 < n; j++) {
      if (segmentsIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1])) count++
    }
  }
  return count
}

/** Mediana robusta (ordena cópia). */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const v = [...values].sort((a, b) => a - b)
  const mid = v.length >> 1
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v))
