'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Color conversions ──────────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return [0, 0, 0]
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let hue = 0
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
    hue *= 60
    if (hue < 0) hue += 360
  }
  const sat = max === 0 ? 0 : d / max
  const val = max
  return [hue, sat, val]
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

// ─── Component ──────────────────────────────────────────────────────────────

const SIZE = 200
const RING_W = 18 // largura do anel de hue
const R_OUT = SIZE / 2
const R_IN = R_OUT - RING_W
const SQUARE = R_IN * Math.SQRT2 // lado do quadrado SV inscrito
const SQUARE_OFF = (SIZE - SQUARE) / 2

interface ColorWheelProps {
  color: string
  onChange: (hex: string) => void
  className?: string
}

/**
 * ColorWheel — seletor de cor profissional estilo roda HSL.
 *
 *  - Anel externo: hue (0..360°), arraste para girar.
 *  - Quadrado inscrito: saturação (eixo X) × valor/brilho (eixo Y).
 *  - Hex input digitável.
 *  - Marcadores arrastáveis por pointer (mouse/touch/caneta).
 *  - Stroke-friendly: alvos grandes, sem preview cata-ouro.
 *
 *picker: suficiente p/ matching papéis de aquarela nanquim etc.
 */
export function ColorWheel({ color, onChange, className }: ColorWheelProps) {
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(1)
  const [val, setVal] = useState(1)
  const [hex, setHex] = useState(color)

  const wheelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<null | 'hue' | 'sv'>(null)

  useEffect(() => {
    const [h, s, v] = hexToHsv(color)
    setHue(h)
    setSat(s)
    setVal(v)
    setHex(color)
  }, [color])

  useEffect(() => {
    const next = hsvToHex(hue, sat, val)
    if (next.toLowerCase() !== hex.toLowerCase()) {
      setHex(next)
      onChange(next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, sat, val])

  // ─── Pointer handlers ────────────────────────────────────────────────────

  const updateFromPointer = useCallback((e: PointerEvent | React.PointerEvent) => {
    const el = wheelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = SIZE / rect.width
    const px = (e.clientX - rect.left) * scale
    const py = (e.clientY - rect.top) * scale
    const cx = SIZE / 2
    const cy = SIZE / 2
    const dx = px - cx
    const dy = py - cy
    const dist = Math.hypot(dx, dy)

    if (dragRef.current === 'hue') {
      let ang = Math.atan2(dy, dx) * 180 / Math.PI
      if (ang < 0) ang += 360
      setHue(ang)
    } else if (dragRef.current === 'sv') {
      // Coordenadas locais no quadrado SV (0..1)
      const u = Math.max(0, Math.min(1, (px - SQUARE_OFF) / SQUARE))
      const w = Math.max(0, Math.min(1, (py - SQUARE_OFF) / SQUARE))
      setSat(u)
      setVal(1 - w)
    } else {
      // Decide qual target pelo raio
      if (dist >= R_IN && dist <= R_OUT) {
        let ang = Math.atan2(dy, dx) * 180 / Math.PI
        if (ang < 0) ang += 360
        setHue(ang)
      } else if (dist < R_IN) {
        const u = Math.max(0, Math.min(1, (px - SQUARE_OFF) / SQUARE))
        const w = Math.max(0, Math.min(1, (py - SQUARE_OFF) / SQUARE))
        setSat(u)
        setVal(1 - w)
      }
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = wheelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = SIZE / rect.width
    const px = (e.clientX - rect.left) * scale
    const py = (e.clientY - rect.top) * scale
    const cx = SIZE / 2
    const cy = SIZE / 2
    const dist = Math.hypot(px - cx, py - cy)

    if (dist >= R_IN && dist <= R_OUT) dragRef.current = 'hue'
    else if (dist < R_IN) dragRef.current = 'sv'
    else dragRef.current = null

    updateFromPointer(e)

    const move = (ev: PointerEvent) => updateFromPointer(ev)
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }, [updateFromPointer])

  // ─── Marker positions ────────────────────────────────────────────────────

  // Hue marker no anel
  const hueRad = (hue * Math.PI) / 180
  const hueR = (R_OUT + R_IN) / 2
  const hueX = SIZE / 2 + Math.cos(hueRad) * hueR
  const hueY = SIZE / 2 + Math.sin(hueRad) * hueR

  // SV marker no quadrado
  const svX = SQUARE_OFF + sat * SQUARE
  const svY = SQUARE_OFF + (1 - val) * SQUARE

  const handleHexInput = (value: string) => {
    setHex(value)
    const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(value.trim())
    if (m) {
      const [h, s, v] = hexToHsv(value)
      setHue(h); setSat(s); setVal(v)
      onChange(value.startsWith('#') ? value : '#' + value.replace(/^#?/, ''))
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Quadrado SV: gradient horizontal = saturation; gradient vertical = value.
  // Base = cor pura do hue atual; overlay vertical vai preto→transparente
  // + horizontal branco→hue puro.
  const hueColor = hsvToHex(hue, 1, 1)

  return (
    <div className={cn('space-y-3', className)}>
      <div
        ref={wheelRef}
        className="relative mx-auto select-none touch-none"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={handlePointerDown}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block">
          {/* Anel de hue: 360 segmentos (um por grau) — suficiente p/ parecer contínuo */}
          <g>
            {Array.from({ length: 360 }, (_, i) => {
              const a0 = (i * Math.PI) / 180
              const a1 = ((i + 1.4) * Math.PI) / 180
              const x0o = SIZE / 2 + Math.cos(a0) * R_OUT
              const y0o = SIZE / 2 + Math.sin(a0) * R_OUT
              const x1o = SIZE / 2 + Math.cos(a1) * R_OUT
              const y1o = SIZE / 2 + Math.sin(a1) * R_OUT
              const x0i = SIZE / 2 + Math.cos(a0) * R_IN
              const y0i = SIZE / 2 + Math.sin(a0) * R_IN
              const x1i = SIZE / 2 + Math.cos(a1) * R_IN
              const y1i = SIZE / 2 + Math.sin(a1) * R_IN
              return (
                <path
                  key={i}
                  d={`M ${x0o} ${y0o} A ${R_OUT} ${R_OUT} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${R_IN} ${R_IN} 0 0 0 ${x0i} ${y0i} Z`}
                  fill={hsvToHex(i, 1, 1)}
                />
              )
            })}
          </g>

          {/* Recorte do centro: máscara simples com um círculo branco */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R_IN - 0.5} fill="var(--popover, #fff)" />

          {/* Quadrado SV — gradient duplo */}
          <defs>
            <linearGradient id="sv-sat" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor={hueColor} />
            </linearGradient>
            <linearGradient id="sv-val" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <clipPath id="sv-clip">
              <rect x={SQUARE_OFF} y={SQUARE_OFF} width={SQUARE} height={SQUARE} rx={6} />
            </clipPath>
          </defs>

          <g clipPath="url(#sv-clip)">
            <rect x={SQUARE_OFF} y={SQUARE_OFF} width={SQUARE} height={SQUARE} fill="url(#sv-sat)" />
            <rect x={SQUARE_OFF} y={SQUARE_OFF} width={SQUARE} height={SQUARE} fill="url(#sv-val)" />
          </g>
          <rect x={SQUARE_OFF} y={SQUARE_OFF} width={SQUARE} height={SQUARE} rx={6} fill="none" stroke="var(--border)" strokeWidth={1} />

          {/* Marcador hue (anel) */}
          <circle
            cx={hueX}
            cy={hueY}
            r={9}
            fill="none"
            stroke="var(--popover, #fff)"
            strokeWidth={3}
            style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))' }}
          />
          <circle cx={hueX} cy={hueY} r={9} fill="none" stroke="rgb(0 0 0 / 0.4)" strokeWidth={1} />

          {/* Marcador SV */}
          <circle
            cx={svX}
            cy={svY}
            r={9}
            fill="none"
            stroke="var(--popover, #fff)"
            strokeWidth={3}
            style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))' }}
          />
          <circle cx={svX} cy={svY} r={9} fill="none" stroke="rgb(0 0 0 / 0.4)" strokeWidth={1} />
        </svg>
      </div>

      {/* Hex input + preview */}
      <div className="flex items-center gap-2">
        <span
          className="size-8 rounded-lg border border-border shrink-0"
          style={{ backgroundColor: hex }}
        />
        <input
          value={hex}
          onChange={(e) => handleHexInput(e.target.value)}
          spellCheck={false}
          aria-label="Código hexadecimal da cor"
          className="flex-1 min-w-0 rounded-lg bg-muted/40 border border-border px-2.5 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}
