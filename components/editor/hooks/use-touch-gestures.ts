'use client'

import { useEffect, useRef } from 'react'

export interface TouchGestureHandlers {
  /** 2 dedos tocam o canvas simultaneamente (sem arrastar).
   *  Convenção Procreate/Concepts: desfazer. */
  onTwoFingerTap?: () => void
  /** 3 dedos tocam o canvas simultaneamente (sem arrastar): refazer. */
  onThreeFingerTap?: () => void
  /** Toque duplo (dedo único) em qualquer lugar: toggle pen ↔ eraser. */
  onDoubleTap?: () => void
  /** Duplo-toque com a caneta: mesma troca, mas com tipo caneta. */
  onPenDoubleTap?: () => void
  /** Toque longo (~600ms) sem arrastar: erase por área sob o ponto. */
  onLongPress?: (x: number, y: number) => void
}

interface PointerRecord {
  id: number
  type: 'mouse' | 'pen' | 'touch'
  downX: number
  downY: number
  downAt: number
  moved: boolean
}

const TAP_MAX_MS = 280
const TAP_MAX_DIST = 14
const DOUBLE_MAX_MS = 320
const N_FINGER_WINDOW_MS = 340
const LONG_PRESS_MS = 600

/** useTouchGestures — reconhece gestos touch/caneta no editor canvas.
 *
 * Implementação top-level via window pointer listeners (não interfere nos
 * handlers existentes do canvas), com buffer circular de pointer-ups sem
 * movimento a partir do qual reconhece 1, 2 ou 3 toques numa janela curta.
 *
 * Gestos:
 *  - 2-finger tap       → onTwoFingerTap (undo)
 *  - 3-finger tap       → onThreeFingerTap (redo)
 *  - double-tap (dedo)  → onDoubleTap (toggle pen ↔ eraser)
 *  - double-tap (caneta)→ onPenDoubleTap (mesma troca)
 *  - long-press touch   → onLongPress (x,y)
 *
 * Long-press é cancelado se houver movimento > TAP_MAX_DIST antes do
 * disparo (sensível a arrasto acidental). Multi-dedo aborta long-press.
 *
 * Sensacional de descontar este conjunto foi deixar o "não houve arrasto"
 * como pré-requisito — N-finger tap é uma pancada seca no canvas, não um
 * spread de pinch. Pinch usa movimento e é tratado no use-canvas-pointer.
 */
export function useTouchGestures(
  handlers: TouchGestureHandlers,
  enabled = true,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    const pointers = new Map<number, PointerRecord>()
    // Ponteiros que completaram "tap" (sem arrasto) e ficaram disponíveis
    // para um gesto, identificados por (downT: timestamp, x, y, type).
    const recentUps: { type: string; x: number; y: number; t: number }[] = []
    let lastSingleUp: { type: string; x: number; y: number; t: number } | null = null
    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let longPressId: number | null = null
    let longPressFired = false

    const pruneBuffer = (now: number) => {
      const cutoff = now - N_FINGER_WINDOW_MS
      while (recentUps.length > 0 && recentUps[0].t < cutoff) recentUps.shift()
    }

    const discardTypeFromBuffer = (type: string) => {
      for (let i = recentUps.length - 1; i >= 0; i--) {
        if (recentUps[i].type === type) recentUps.splice(i, 1)
      }
    }

    const onDown = (e: PointerEvent) => {
      // Foco de long-press apenas p/ touch quando apenas 1 dedo presente.
      // Qualquer chegada de novo dedo aborta long-press (multi = não é long).
      if (pointers.size >= 1 && longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
        longPressId = null
      }
      const rec: PointerRecord = {
        id: e.pointerId,
        type: (e.pointerType ?? 'touch') as PointerRecord['type'],
        downX: e.clientX,
        downY: e.clientY,
        downAt: performance.now(),
        moved: false,
      }
      pointers.set(e.pointerId, rec)
      longPressFired = false

      if (pointers.size === 1 && rec.type === 'touch') {
        longPressId = e.pointerId
        longPressTimer = setTimeout(() => {
          if (longPressId == null) return
          const r = pointers.get(longPressId)
          if (!r || r.moved) return
          longPressFired = true
          handlersRef.current.onLongPress?.(r.downX, r.downY)
        }, LONG_PRESS_MS)
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = pointers.get(e.pointerId)
      if (!r) return
      if (Math.hypot(e.clientX - r.downX, e.clientY - r.downY) > TAP_MAX_DIST) {
        r.moved = true
        if (longPressId === e.pointerId && longPressTimer) {
          clearTimeout(longPressTimer)
          longPressTimer = null
          longPressId = null
        }
      }
    }

    const onUp = (e: PointerEvent) => {
      if (longPressId === e.pointerId && longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      longPressId = null

      const r = pointers.get(e.pointerId)
      pointers.delete(e.pointerId)
      if (!r) return

      const t = performance.now()
      const dur = t - r.downAt

      // Long-press já disparado: não conta como tap.
      if (longPressFired) return

      const isTap = !r.moved && dur < TAP_MAX_MS
      if (!isTap) return

      const tapType = r.type
      recentUps.push({ type: tapType, x: e.clientX, y: e.clientY, t })
      pruneBuffer(t)

      const inWindow = recentUps.filter(u => u.type === tapType)
      const count = inWindow.length

      // ── N-finger tap ─────────────────────────────────────────────────
      if (count === 2) {
        handlersRef.current.onTwoFingerTap?.()
        discardTypeFromBuffer(tapType)
        lastSingleUp = null
        return
      }
      if (count === 3) {
        handlersRef.current.onThreeFingerTap?.()
        discardTypeFromBuffer(tapType)
        lastSingleUp = null
        return
      }
      // (count === 1) — continua p/ checar double-tap

      // ── Double-tap (single dedo) ──────────────────────────────────────
      if (lastSingleUp && lastSingleUp.type === tapType) {
        const dt = t - lastSingleUp.t
        const dx = e.clientX - lastSingleUp.x
        const dy = e.clientY - lastSingleUp.y
        if (dt < DOUBLE_MAX_MS && Math.hypot(dx, dy) < TAP_MAX_DIST * 2.5) {
          if (tapType === 'pen') handlersRef.current.onPenDoubleTap?.()
          else handlersRef.current.onDoubleTap?.()
          lastSingleUp = null
          discardTypeFromBuffer(tapType)
          return
        }
      }
      lastSingleUp = { type: tapType, x: e.clientX, y: e.clientY, t }
    }

    const onCancel = (e: PointerEvent) => {
      if (longPressId === e.pointerId && longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      if (longPressId === e.pointerId) longPressId = null
      pointers.delete(e.pointerId)
    }

    window.addEventListener('pointerdown', onDown, { passive: false })
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp, { passive: false })
    window.addEventListener('pointercancel', onCancel, { passive: false })

    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      if (longPressTimer) clearTimeout(longPressTimer)
    }
  }, [enabled])
}
