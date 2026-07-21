// ─── Rasterização de palavra para o fallback Tesseract ───────────────────────
// Recorte justo da palavra, escalado para altura ideal de OCR (~160px), com
// binarização de Otsu. Muito melhor que mandar a página inteira: o Tesseract
// opera no modo "palavra única" (PSM 8).

import { bboxUnion, type BBox } from './geometry'
import type { CleanStroke } from './preprocess'

export interface RasterizeOptions {
  /** Altura alvo do recorte (px). */
  targetHeight?: number
  /** Padding em fração da altura-x. */
  padFactor?: number
}

export function rasterizeWord(
  strokes: CleanStroke[],
  xHeight: number,
  opts: RasterizeOptions = {},
): HTMLCanvasElement | null {
  if (strokes.length === 0 || typeof document === 'undefined') return null
  const targetHeight = opts.targetHeight ?? 160
  const pad = (opts.padFactor ?? 0.6) * xHeight

  const box: BBox = strokes.map((s) => s.box).reduce(bboxUnion)
  const srcW = box.w + 2 * pad
  const srcH = box.h + 2 * pad
  const scale = targetHeight / srcH

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(8, Math.round(srcW * scale))
  canvas.height = Math.max(8, Math.round(srcH * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#000000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const s of strokes) {
    if (s.pts.length === 0) continue
    ctx.lineWidth = Math.max(2, s.size * scale * 0.55)
    ctx.beginPath()
    ctx.moveTo((s.pts[0].x - box.x + pad) * scale, (s.pts[0].y - box.y + pad) * scale)
    for (let i = 1; i < s.pts.length; i++) {
      ctx.lineTo((s.pts[i].x - box.x + pad) * scale, (s.pts[i].y - box.y + pad) * scale)
    }
    ctx.stroke()
  }

  otsuBinarize(ctx, canvas.width, canvas.height)
  return canvas
}

/** Binarização de Otsu in-place (preto/branco puro — ideal para OCR). */
function otsuBinarize(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const hist = new Uint32Array(256)
  const total = w * h

  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000
    hist[g | 0]++
  }

  let sum = 0
  for (let t = 0; t < 256; t++) sum += t * hist[t]
  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > maxVar) {
      maxVar = between
      threshold = t
    }
  }

  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000
    const v = g > threshold ? 255 : 0
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}
