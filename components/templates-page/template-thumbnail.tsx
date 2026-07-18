'use client'

import { drawTemplate, getTemplateColors } from '@/lib/templates'
import type { PageTemplateId } from '@/lib/types'
import { PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { useEffect, useRef } from 'react'
import { useTheme } from '../providers/theme-provider'

interface TemplateThumbnailProps {
  template: PageTemplateId
  className?: string
  aspectRatio?: number
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

    const ratio = aspectRatio ?? PAGE_HEIGHT / PAGE_WIDTH
    const scale = 2 // renderização em alta resolução
    const w = Math.round(width * scale)
    const h = Math.round(width * ratio * scale)

    canvas.width = w
    canvas.height = h
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    const tc = getTemplateColors(isDark)
    ctx.clearRect(0, 0, w, h)
    ctx.scale(scale, scale)
    drawTemplate(ctx, template, width, Math.round(width * ratio), tc)
  }, [template, isDark, aspectRatio, width])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  )
}
