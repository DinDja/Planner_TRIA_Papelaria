// ─── DTW bandado (Sakoe-Chiba) sobre sequências de frames de direção ─────────
// Custo local combina distância angular (1 − cos Δθ)/2 com penalidade por
// incompatibilidade de pen-up/pen-down — captura diferença de nº de traços.

import type { Frame } from './features'

const BAND = 14
const PEN_MISMATCH = 0.55

function localCost(a: Frame, b: Frame): number {
  const ang = (1 - (a.c * b.c + a.s * b.s)) / 2
  const pen = Math.abs(a.pen - b.pen) * PEN_MISMATCH
  return ang + pen
}

/**
 * DTW com janela |i−j| ≤ BAND. Retorna custo médio por passo do melhor
 * caminho (0 ≈ idêntico). Infinity se as sequências não se alcançam na banda.
 */
export function dtwFrames(a: Frame[], b: Frame[], band: number = BAND): number {
  const n = a.length
  const m = b.length
  if (n === 0 || m === 0) return Infinity

  const INF = Infinity
  let prev = new Float64Array(m + 1).fill(INF)
  let cur = new Float64Array(m + 1).fill(INF)
  prev[0] = 0

  for (let i = 1; i <= n; i++) {
    const jLo = Math.max(1, i - band)
    const jHi = Math.min(m, i + band)
    cur.fill(INF)
    for (let j = jLo; j <= jHi; j++) {
      const cost = localCost(a[i - 1], b[j - 1])
      cur[j] = cost + Math.min(prev[j], cur[j - 1], prev[j - 1])
    }
    ;[prev, cur] = [cur, prev]
  }

  const total = prev[m]
  if (!Number.isFinite(total)) return INF
  // Normaliza pelo comprimento do caminho (≈ max(n, m))
  return total / Math.max(n, m)
}
