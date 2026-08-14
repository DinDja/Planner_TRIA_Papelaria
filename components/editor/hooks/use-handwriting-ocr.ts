'use client'

import { useCallback, useState } from 'react'
import type { CanvasData } from '@/lib/types'
import { recognizeCanvasData } from '@/lib/recognition/engine'

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
 * Motor de reconhecimento de escrita à mão — 100% vetorial e offline:
 * comparação de traços normalizados contra base de templates (DTW), sem
 * modelo de IA, sem download, sem rede. Todo o processamento acontece no
 * dispositivo. Pós-processamento com léxico pt-BR (acentos + Damerau).
 *
 * API compatível com o PlannerEditor:
 *   status 'idle'|'loading'|'done'|'error', progress 0..100, progressText,
 *   errorMessage, lastResult {text, confidence}, recognize(data), reset().
 */
export function useHandwritingOcr({ lang }: UseHandwritingOcrOptions) {
  const [progress, setProgress] = useState<OcrProgress>({ status: 'idle', progress: 0 })
  const [result, setResult] = useState<OcrResult | null>(null)

  const recognize = useCallback(
    async (data: CanvasData): Promise<OcrResult | null> => {
      if (data.strokes.length === 0) {
        setResult(null)
        setProgress({ status: 'idle', progress: 0, message: 'Nenhum traço na página para reconhecer.' })
        return null
      }

      try {
        setProgress({ status: 'preparing', progress: 0.05, message: 'Analisando traços…' })

        const out = await recognizeCanvasData(data, {
          lang,
          onProgress: (_stage, done, total) => {
            setProgress({
              status: 'recognizing',
              progress: 0.05 + 0.85 * (done / Math.max(total, 1)),
              message: `Reconhecendo escrita… linha ${done}/${total}`,
            })
          },
        })

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
    [lang],
  )

  const reset = useCallback(() => {
    setResult(null)
    setProgress({ status: 'idle', progress: 0 })
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