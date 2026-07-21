'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasData } from '@/lib/types'
import {
  recognizeCanvasData,
  type RecognitionOutput,
  type RecognizedWord,
} from '@/lib/recognition/engine'
import { lexiconScore, type LexLang } from '@/lib/recognition/lexicon'
import { rasterizeWord } from '@/lib/recognition/rasterize'

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
  /**
   * Fallback híbrido: palavras com baixa confiança no motor vetorial são
   * re-avaliadas pelo Tesseract (recorte da palavra, PSM palavra-única) e a
   * melhor hipótese vence por score lexical. Default: true.
   */
  hybridFallback?: boolean
}

/** Palavras abaixo desta confiança vão para a segunda opinião (Tesseract). */
const FALLBACK_CONF = 0.55
/** Teto de palavras re-avaliadas por execução (custo ~150ms cada). */
const FALLBACK_MAX_WORDS = 14

/**
 * Motor profissional de reconhecimento de escrita à mão.
 *
 * Estágio 1 — HTR vetorial (lib/recognition): análise online dos traços
 * (ordem, direção, curvatura), segmentação linha→palavra→caractere,
 * classificação por DTW contra protótipos, busca DP no lattice de hipóteses
 * e pós-processamento lexical pt-BR. 100% offline, sem download de modelo.
 *
 * Estágio 2 — Fallback híbrido opcional: segunda opinião do Tesseract.js
 * sobre recortes binarizados (Otsu) de palavras duvidosas, com fusão por
 * score de léxico.
 *
 * API compatível com o PlannerEditor:
 *   status 'idle'|'loading'|'done'|'error', progress 0..100, progressText,
 *   errorMessage, lastResult {text, confidence}, recognize(data), reset().
 */
export function useHandwritingOcr({ lang, hybridFallback = true }: UseHandwritingOcrOptions) {
  const [progress, setProgress] = useState<OcrProgress>({ status: 'idle', progress: 0 })
  const [result, setResult] = useState<OcrResult | null>(null)

  // Worker Tesseract — criado sob demanda, apenas se o fallback for acionado.
  const workerRef = useRef<unknown>(null)
  const creatingRef = useRef<Promise<unknown> | null>(null)

  const ensureWorker = useCallback(async (): Promise<unknown> => {
    if (workerRef.current) return workerRef.current
    if (creatingRef.current) return creatingRef.current

    creatingRef.current = (async () => {
      setProgress((p) => ({
        ...p,
        message: 'Carregando modelo auxiliar…',
      }))
      const { createWorker, PSM } = await import('tesseract.js')
      const tessLang = lang === 'eng' ? 'eng' : 'por'
      const worker = await createWorker(tessLang)
      // Palavra única por recorte
      await (worker as { setParameters: (p: Record<string, unknown>) => Promise<unknown> }).setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_WORD,
      })
      workerRef.current = worker
      creatingRef.current = null
      return worker
    })()

    return creatingRef.current
  }, [lang])

  /**
   * Segunda opinião: re-avalia palavras de baixa confiança com Tesseract
   * sobre recortes justos/binarizados e funde por score lexical.
   */
  const applyHybridFallback = useCallback(
    async (out: RecognitionOutput): Promise<void> => {
      const low: RecognizedWord[] = []
      for (const line of out.lineDetails) {
        for (const w of line.words) {
          if (w.confidence < FALLBACK_CONF && /[a-zA-Zà-ÿ]{2,}/.test(w.text)) {
            low.push(w)
          }
        }
      }
      if (low.length === 0) return

      let worker: unknown
      try {
        worker = await ensureWorker()
      } catch {
        return // sem fallback — mantém resultado vetorial
      }

      const targets = low.slice(0, FALLBACK_MAX_WORDS)
      for (let i = 0; i < targets.length; i++) {
        const w = targets[i]
        setProgress({
          status: 'recognizing',
          progress: 0.7 + (0.3 * i) / targets.length,
          message: `Segunda opinião (${i + 1}/${targets.length})…`,
        })
        try {
          const canvas = rasterizeWord(w.strokes, w.xHeight)
          if (!canvas) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: res } = await (worker as any).recognize(canvas)
          const cand = String(res?.text ?? '').trim().split(/\s+/)[0] ?? ''
          if (!cand) continue
          // Fusão: a segunda opinião só vence se tiver score lexical claramente melhor
          const tessLang: LexLang = lang
          if (lexiconScore(cand, tessLang) > lexiconScore(w.text, tessLang) + 0.15) {
            w.raw = w.text
            w.text = cand
            w.confidence = Math.max(w.confidence, 0.62)
          }
        } catch {
          // palavra individual falhou — segue com a hipótese vetorial
        }
      }

      // Reconstrói texto das linhas após fusões
      for (const line of out.lineDetails) {
        line.text = line.words.map((w) => w.text).join(' ')
      }
      out.lines = out.lineDetails.map((l) => l.text)
      out.text = out.lines.join('\n')
    },
    [ensureWorker, lang],
  )

  const recognize = useCallback(
    async (data: CanvasData): Promise<OcrResult | null> => {
      if (data.strokes.length === 0) {
        setResult(null)
        setProgress({ status: 'idle', progress: 0, message: 'Nenhum traço na página para reconhecer.' })
        return null
      }

      try {
        setProgress({ status: 'preparing', progress: 0.02, message: 'Analisando traços…' })

        const out = await recognizeCanvasData(data, {
          lang,
          onProgress: (_stage, done, total) => {
            setProgress({
              status: 'recognizing',
              progress: 0.05 + 0.65 * (done / Math.max(total, 1)),
              message: `Reconhecendo escrita… linha ${done}/${total}`,
            })
          },
        })

        if (hybridFallback) {
          await applyHybridFallback(out)
        }

        const r: OcrResult = {
          text: out.text.trim(),
          confidence: Math.round(out.confidence * 100),
          lines: out.lines,
        }
        setResult(r)
        setProgress({ status: 'done', progress: 1, message: 'Reconhecimento concluído.' })
        return r
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setProgress({ status: 'error', progress: 0, message })
        return null
      }
    },
    [applyHybridFallback, hybridFallback, lang],
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
      return result ? { text: result.text, confidence: result.confidence } : null
    },
    recognize: async (data: CanvasData) => {
      await recognize(data)
    },
    reset,
  }

  return api
}

async function terminateWorker(worker: unknown): Promise<void> {
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
