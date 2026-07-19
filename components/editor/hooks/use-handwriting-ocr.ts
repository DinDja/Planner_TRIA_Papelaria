'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import type { CanvasData, Stroke } from '@/lib/types'
import { PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'

// ─── Helpers de path ─────────────────────────────────────────────────────────
// Mesma lógica do planner-editor (mantém paridade com o que o usuário vê).

function vecToSvgPath(points: number[][]): string {
  if (!points || points.length < 2) return ''
  return `M ${points[0][0]} ${points[0][1]} L ${points
    .slice(1)
    .map((p) => `${p[0]} ${p[1]}`)
    .join(' ')} Z`
}

function strokeOutlinePoints(s: Stroke): number[][] {
  return getStroke(s.points, {
    size: s.tool === 'highlighter' ? s.size * 1.5 : s.size,
    thinning: s.tool === 'pencil' ? 0.8 : s.tool === 'highlighter' ? 0.2 : 0.5,
    smoothing: 0.6,
    streamline: 0.4,
  })
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type OcrLang = 'por' | 'eng' | 'por+eng'

export interface OcrProgress {
  status: 'idle' | 'preparing' | 'recognizing' | 'done' | 'error'
  progress: number // 0..1
  message?: string
}

export interface OcrResult {
  text: string
  confidence: number
  lines: string[]
}

export interface UseHandwritingOcrOptions {
  lang: OcrLang
}

/**
 * Reconhecimento offline de escrita manual usando Tesseract.js (WASM, 100%
 * client-side, sem LLM, sem APIs externas). Renderiza apenas os strokes da
 * página em um canvas offscreen com contraste máximo (fundo branco, traços em
 * preto saturado) — esse é o setup que melhor funciona para OCR de handwriting.
 *
 * Workflow:
 * 1. rasterizeStrokes(data) -> HTMLCanvasElement
 * 2. recognize(canvas) -> OcrResult
 *
 * O worker é lazy e reutilizado entre chamadas (custoso de criar).
 */
export function useHandwritingOcr({ lang }: UseHandwritingOcrOptions) {
  const [progress, setProgress] = useState<OcrProgress>({ status: 'idle', progress: 0 })
  const [result, setResult] = useState<OcrResult | null>(null)

  // Worker Tesseract persistente — criar é caro (~download do modelo ~1-4 MB).
  // Tesseract Worker não é um Worker DOM padrão — tipamos como unknown e fazemos cast.
  const workerRef = useRef<unknown>(null)
  const workerLangRef = useRef<string | null>(null)
  const creatingRef = useRef<Promise<unknown> | null>(null)

  // Canvas offscreen reutilizado (evita allocar a cada chamada).
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const getScratchCanvas = useCallback(() => {
    let c = scratchCanvasRef.current
    if (!c) {
      c = document.createElement('canvas')
      c.width = PAGE_WIDTH
      c.height = PAGE_HEIGHT
      scratchCanvasRef.current = c
    }
    return c
  }, [])

  /**
   * Rasteriza os strokes em um canvas com fundo branco e traços pretos.
   * Ignora template de fundo (linhas/grid podem confundir o OCR) e ignora
   * cor/opacity reais (preto saturado maximiza precisão do Tesseract).
   * Retorna apenas se houver strokes — caso contrário devolve null.
   */
  const rasterizeStrokes = useCallback(
    (data: CanvasData): HTMLCanvasElement | null => {
      if (data.strokes.length === 0) return null
      const canvas = getScratchCanvas()
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Fundo branco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#000000'
      for (const s of data.strokes) {
        try {
          const pathD = vecToSvgPath(strokeOutlinePoints(s))
          if (!pathD) continue
          const path = new Path2D(pathD)
          ctx.fill(path)
        } catch {
          // ignore stroke com geometria inválida
        }
      }

      return canvas
    },
    [getScratchCanvas],
  )

  /**
   * Cria (ou reaproveita) o worker Tesseract para o idioma dado.
   * Recria se o idioma mudou.
   */
  const ensureWorker = useCallback(async (): Promise<unknown> => {
    const wanted = lang
    if (workerRef.current && workerLangRef.current === wanted) {
      return workerRef.current
    }
    // Encerra worker anterior com idioma diferente
    if (workerRef.current) {
      try {
        await terminateWorker(workerRef.current)
      } catch {
        /* noop */
      }
      workerRef.current = null
      workerLangRef.current = null
    }

    // Reaproveita criação em andamento
    if (creatingRef.current) return creatingRef.current

    creatingRef.current = (async () => {
      setProgress({ status: 'preparing', progress: 0, message: 'Carregando modelo de reconhecimento…' })
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(wanted, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing') {
            setProgress({ status: 'recognizing', progress: m.progress, message: 'Reconhecendo escrita…' })
          } else if (
            m.status === 'loading tesseract core' ||
            m.status === 'initializing tesseract' ||
            m.status === 'loading language traineddata' ||
            m.status === 'initializing api'
          ) {
            setProgress({ status: 'preparing', progress: m.progress ?? 0, message: 'Preparando motor OCR…' })
          }
        },
      })
      workerRef.current = worker
      workerLangRef.current = wanted
      creatingRef.current = null
      return worker
    })()

    return creatingRef.current
  }, [lang])

  const recognize = useCallback(
    async (data: CanvasData): Promise<OcrResult | null> => {
      const canvas = rasterizeStrokes(data)
      if (!canvas) {
        setResult(null)
        setProgress({ status: 'idle', progress: 0, message: 'Nenum traço na página para reconhecer.' })
        return null
      }

      try {
        const worker = await ensureWorker()
        setProgress({ status: 'recognizing', progress: 0, message: 'Reconhecendo escrita…' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: out } = await (worker as any).recognize(canvas)
        const text = (out?.text ?? '').trim()
        const confidence = typeof out?.confidence === 'number' ? out.confidence : 0
        const lines = text
          .split(/\r?\n/)
          .map((l: string) => l.trim())
          .filter(Boolean)

        const r: OcrResult = { text, confidence, lines }
        setResult(r)
        setProgress({ status: 'done', progress: 1, message: 'Reconhecimento concluído.' })
        return r
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setProgress({ status: 'error', progress: 0, message })
        return null
      }
    },
    [ensureWorker, rasterizeStrokes],
  )

  const reset = useCallback(() => {
    setResult(null)
    setProgress({ status: 'idle', progress: 0 })
  }, [])

  // Cleanup do worker ao desmontar
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        terminateWorker(workerRef.current).catch(() => {})
        workerRef.current = null
      }
    }
  }, [])

  // API compatível com o componente PlannerEditor
  // status: 'idle' | 'loading' | 'done' | 'error'
  // progress: 0..100
  // progressText: string
  // errorMessage: string
  // lastResult: { text: string; confidence: number } | null
  // recognize(data: CanvasData): Promise<void>
  // reset(): void
  const api = {
    get status() {
      const s = progress.status
      if (s === 'preparing' || s === 'recognizing') return 'loading'
      return s
    },
    get progress() {
      return Math.round(progress.progress * 100)
    },
    get progressText() {
      return progress.message
    },
    get errorMessage() {
      return progress.status === 'error' ? progress.message : undefined
    },
    get lastResult() {
      return result ? { text: result.text, confidence: Math.round(result.confidence) } : null
    },
    recognize: async (data: CanvasData) => {
      await recognize(data)
    },
    reset,
  }

  return api
}

async function terminateWorker(worker: unknown): Promise<void> {
  // tesseract.js v6+: worker.terminate() retorna Promise
  const w = worker as { terminate?: () => Promise<unknown> }
  if (typeof w.terminate === 'function') {
    await w.terminate()
  }
}

// ─── Util p/ converter canvas → dataURL (caso precise preview) ──────────────

export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

// Apenas para satisfazer importações de tipo (não usado em runtime):
export type _StrokePoint = CanvasData['strokes'][number]['points'][number]