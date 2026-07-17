'use client'

import { drawTemplate } from '@/lib/templates'
import type { PageTemplateId } from '@/lib/types'
import { PAGE_HEIGHT, PAGE_WIDTH } from '@/lib/types'
import { useEffect, useRef } from 'react'
import { useTheme } from '../providers/theme-provider'

function getTemplateColors(isDark: boolean) {
  return {
    paper: isDark ? '#2a2a28' : '#ffffff',
    line: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
    accent: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    text: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
    faint: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
  }
}

interface TemplateThumbnailProps {
  template: PageTemplateId
  className?: string
  aspectRatio?: number
}

export function TemplateThumbnail({ template, className, aspectRatio }: TemplateThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ratio = aspectRatio ?? PAGE_HEIGHT / PAGE_WIDTH
    const scale = 2 // retina
    const w = 200 * scale
    const h = Math.round(w * ratio * scale)

    canvas.width = w
    canvas.height = h
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    const tc = getTemplateColors(isDark)
    ctx.clearRect(0, 0, w, h)
    ctx.scale(scale, scale)
    drawTemplate(ctx, template, 200, Math.round(200 * ratio), tc)
  }, [template, isDark, aspectRatio])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  )
}