'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

// ─── Geometria da "página" (fonte única de verdade p/ SVG + texto DOM) ────────
const PAGE_W = 340
const PAGE_H = 430
const CELL_W = 120
const CELL_H = 72
const GAP_X = 18
const GAP_Y = 10
const GRID_X0 = 38
const GRID_Y0 = 86
const COLS = [GRID_X0, GRID_X0 + CELL_W + GAP_X]
const ROWS = [
  GRID_Y0,
  GRID_Y0 + CELL_H + GAP_Y,
  GRID_Y0 + 2 * (CELL_H + GAP_Y),
  GRID_Y0 + 3 * (CELL_H + GAP_Y),
]
const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
// i=7 → 8ª célula (col1,row3) ocupada como área de "Notas" para fechar a grade 2×4

// Estrela de 5 pontas limpa — gerada a partir de cx,cy,r externo.
function starPath(cx: number, cy: number, R: number, r: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const ang = (-90 + i * 36) * (Math.PI / 180)
    const rad = i % 2 === 0 ? R : r
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`)
  }
  return `M${pts[0]} L${pts[1]} L${pts[2]} L${pts[3]} L${pts[4]} L${pts[5]} L${pts[6]} L${pts[7]} L${pts[8]} L${pts[9]} Z`
}

// Tick-marks de energia dentro da célula de hoje.
function energyTicks(x: number, y: number) {
  return Array.from({ length: 7 }).map((_, i) => {
    const tx = x + 14 + i * 14
    const filled = i < 3
    const ty = y + 44
    const h = filled ? 18 : 12
    return { key: i, d: `M${tx} ${ty} v${h}`, filled }
  })
}

export function AuthDecorativePanel() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Date determinado só no client evitando hydration mismatch (locale/tz).
  const today = new Date()
  const dayOfMonth = String(today.getDate()).padStart(2, '0')
  const monthName = today.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const weekday = today.toLocaleDateString('pt-BR', { weekday: 'long' })
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const todayIdx = (today.getDay() + 6) % 7
  const todayCol = todayIdx % 2
  const todayRow = Math.floor(todayIdx / 2)
  const todayX = COLS[todayCol]
  const todayY = ROWS[todayRow]
  const ticks = energyTicks(todayX, todayY)

  if (!mounted) {
    // Placeholder estático (mesmas dimensões) — sem date-dependent content.
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-accent/35 via-background to-background">
        <div className="absolute inset-0 dot-grid-bg opacity-25" />
        <div className="absolute inset-0 paper-grain opacity-[0.04]" />
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-accent/35 via-background to-background">
      <div className="absolute inset-0 dot-grid-bg opacity-25" />
      <div className="absolute inset-0 paper-grain opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,_var(--primary)_0%,_transparent_55%)] opacity-[0.05]" />

      {/* ── Página desenhada à mão ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative"
        style={{ filter: 'drop-shadow(0 24px 40px rgb(0 0 0 / 0.08))' }}
      >
        <svg width={PAGE_W} height={PAGE_H} viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} fill="none" className="block">
          {/* Folha — contorno */}
          <motion.path
            d="M22 18 H318 Q322 18 322 22 V410 Q322 414 318 414 H22 Q18 414 18 410 V22 Q18 18 22 18 Z"
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeOpacity={0.55}
            strokeWidth={1.8}
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.3 }}
          />

          {/* Divisória do cabeçalho */}
          <motion.path
            d="M40 70 H300"
            stroke="var(--foreground)"
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 1.6 }}
          />

          {/* Estrela de favorito no cabeçalho */}
          <motion.path
            d={starPath(52, 47, 11, 4.4)}
            fill="var(--primary)"
            fillOpacity={0.16}
            stroke="var(--primary)"
            strokeWidth={1.6}
            strokeLinejoin="round"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'backOut', delay: 2.1 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />

          {/* 7 dias + 8ª célula de Notas — grade 2×4 completa */}
          {Array.from({ length: 8 }).map((_, i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const x = COLS[col]
            const y = ROWS[row]
            const isToday = i === todayIdx
            const isNotes = i === 7
            const stroke = isToday ? 'var(--primary)' : 'var(--foreground)'
            const strokeOp = isToday ? 0.7 : isNotes ? 0.18 : 0.24
            const sw = isToday ? 2 : 1.4
            return (
              <motion.path
                key={i}
                d={`M${x} ${y} H${x + CELL_W} V${y + CELL_H} H${x} Z`}
                fill={isToday ? 'var(--primary)' : 'none'}
                fillOpacity={isToday ? 0.06 : 0}
                stroke={stroke}
                strokeOpacity={strokeOp}
                strokeWidth={sw}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 1.9 + i * 0.11 }}
              />
            )
          })}

          {/* Linha de energia (ticks) dentro da célula de hoje */}
          {ticks.map((t) => (
            <motion.path
              key={`tick-${t.key}`}
              d={t.d}
              stroke="var(--primary)"
              strokeOpacity={t.filled ? 0.6 : 0.28}
              strokeWidth={t.filled ? 2.6 : 1.6}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 2.6 + t.key * 0.06 }}
            />
          ))}

          {/* Doodle de "escrita" na célula de Notas (linha ondulada) */}
          <motion.path
            d={`M${COLS[1] + 12} ${ROWS[3] + 28} q8 -9 16 -1 q9 8 18 -6`}
            stroke="var(--foreground)"
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut', delay: 3.0 }}
          />

          {/* ✓ marcado na célula de sábado (i=5 → col1,row2) — hábito concluído */}
          <motion.path
            d={`M${COLS[1] + 10} ${ROWS[2] + 26} l4 5 l8 -11`}
            stroke="var(--primary)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 3.3 }}
          />
        </svg>

        {/* ── Texto manuscrito sobreposto (mesmas coords do SVG) ────── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Data no cabeçalho */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="absolute"
            style={{ left: '72px', top: '26px' }}
          >
            <p className="font-hand text-[1.95rem] leading-none text-foreground">{weekdayCap}, {dayOfMonth}</p>
            <p className="font-hand text-base text-muted-foreground -mt-0.5">{monthName}</p>
          </motion.div>

          {/* Rótulos dos 7 dias */}
          {WEEK_DAYS.map((d, i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const left = COLS[col] + 7
            const top = ROWS[row] + 5
            const isToday = i === todayIdx
            return (
              <motion.span
                key={d}
                initial={{ opacity: 0 }}
                animate={{ opacity: isToday ? 1 : 0.68 }}
                transition={{ delay: 2.0 + i * 0.11, duration: 0.4 }}
                className="absolute font-hand text-sm"
                style={{ left: `${left}px`, top: `${top}px`, color: isToday ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {d}
              </motion.span>
            )
          })}

          {/* Rótulo "Notas" na 8ª célula */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2.9, duration: 0.5 }}
            className="absolute font-hand text-sm italic"
            style={{ left: `${COLS[1] + 7}px`, top: `${ROWS[3] + 5}px`, color: 'var(--foreground)' }}
          >
            notas
          </motion.span>
        </div>
      </motion.div>

      {/* ── Conteúdo editorial ──────────────────────────────────────── */}
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3 px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Image src="/Logo.svg" alt="PlannerHub" width={180} height={102} className="opacity-90" priority />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="font-hand text-2xl text-foreground/70 leading-snug max-w-[300px]"
        >
          a vida se organiza {' '}
          <span className="text-primary font-semibold">uma página de cada vez</span>
        </motion.p>
      </div>
    </div>
  )
}