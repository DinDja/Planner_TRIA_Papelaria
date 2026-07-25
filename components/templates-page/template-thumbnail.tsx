'use client'

import { drawTemplate, getTemplateColors } from '@/lib/templates'
import type { PageTemplateId } from '@/lib/types'
import { PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { useEffect, useRef } from 'react'
import { useTheme } from '../providers/theme-provider'

interface TemplateThumbnailProps {
  template: PageTemplateId
  className?: string
  /** Override da razão de aspecto. Default = razão nativa da página (PAGE_HEIGHT/PAGE_WIDTH). */
  aspectRatio?: number
  /** Largura lógica do thumbnail em px (antes do retina 2×). Default 200. */
  width?: number
}

export function TemplateThumbnail({ template, className, aspectRatio, width = 200 }: TemplateThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Razão de aspecto do bitmap. Default = razão nativa da página real.
    const ratio = aspectRatio ?? PAGE_HEIGHT / PAGE_WIDTH
    const retina = 2 // nitidez em telas HiDPI
    const bw = width // largura lógica do thumbnail
    const bh = Math.round(width * ratio) // altura lógica

    // Tamanho físico do bitmap (com retina)
    canvas.width = Math.round(bw * retina)
    canvas.height = Math.round(bh * retina)
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    // Limpa e aplica transformação composta:
    //   retina (2×) × encaixe (thumbnail_lógico / página_nativa)
    // Assim drawTemplate opera sempre em coordenadas nativas (820×1160)
    // onde suas fontes/margens são proporcionais — o hardware escala tudo
    // para o tamanho do thumbnail, sem refazer a lógica de desenho.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fitX = bw / PAGE_WIDTH
    const fitY = bh / PAGE_HEIGHT
    ctx.scale(retina * fitX, retina * fitY)

    const tc = getTemplateColors(isDark)
    drawTemplate(ctx, template, PAGE_WIDTH, PAGE_HEIGHT, tc)
  }, [template, isDark, aspectRatio, width])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  )
}