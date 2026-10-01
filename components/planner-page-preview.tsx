'use client'

import type { PlannerPage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getStroke } from 'perfect-freehand'
import { getSticker } from '@/lib/stickers'
import { TemplateThumbnail } from './planner-template-thumbnail'

interface PlannerPagePreviewProps {
  page?: PlannerPage
  className?: string
}

export function PlannerPagePreview({ page, className }: PlannerPagePreviewProps) {
  const pageTitle = page?.title ?? ''
  const title = /^P[aá]gina\s+\d+$/i.test(pageTitle.trim()) ? '' : pageTitle
  const content = typeof page?.content === 'string'
    ? page.content
    : (page?.data?.texts ?? []).map((item) => item.text).filter(Boolean).join('\n\n')
  const data = page?.data

  const strokePaths = (data?.strokes ?? []).map((stroke) => {
    try {
      const outline = getStroke(stroke.points, {
        size: stroke.size,
        thinning: stroke.tool === 'marker' || stroke.tool === 'highlighter' ? 0.1 : 0.5,
        smoothing: 0.6,
        streamline: 0.4,
      })
      if (outline.length < 2) return null
      const path = `M ${outline[0][0]} ${outline[0][1]} L ${outline.slice(1).map(([x, y]) => `${x} ${y}`).join(' ')} Z`
      return { id: stroke.id, path, color: stroke.color, opacity: stroke.opacity }
    } catch {
      return null
    }
  }).filter((stroke): stroke is NonNullable<typeof stroke> => stroke !== null)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative aspect-[820/1160] overflow-hidden bg-[color:light-dark(#fffefa,#302c29)] text-foreground',
        className,
      )}
      style={{ containerType: 'inline-size' }}
    >
      <TemplateThumbnail
        template={page?.template ?? 'blank'}
        className="absolute inset-0 block w-full"
        width={820}
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 820 1160"
        preserveAspectRatio="none"
      >
        {strokePaths.map((stroke) => (
          <path key={stroke.id} d={stroke.path} fill={stroke.color} opacity={stroke.opacity} />
        ))}
        {(data?.shapes ?? []).map((shape) => {
          const transform = shape.rotation
            ? `rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`
            : undefined
          const fill = shape.outline ? 'none' : shape.color
          const strokeWidth = shape.strokeWidth ?? 2

          if (shape.kind === 'ellipse') {
            return (
              <ellipse key={shape.id} cx={shape.x + shape.width / 2} cy={shape.y + shape.height / 2}
                rx={shape.width / 2} ry={shape.height / 2} fill={fill} stroke={shape.color}
                strokeWidth={strokeWidth} opacity={shape.opacity ?? 1} transform={transform} />
            )
          }
          if (shape.kind === 'line' || shape.kind === 'arrow') {
            const x2 = shape.x + shape.width
            const y2 = shape.y + shape.height
            return (
              <g key={shape.id} opacity={shape.opacity ?? 1} transform={transform}>
                <line x1={shape.x} y1={shape.y} x2={x2} y2={y2} stroke={shape.color} strokeWidth={strokeWidth} />
                {shape.kind === 'arrow' && (
                  <path d={`M ${x2 - 12} ${y2 - 5} L ${x2} ${y2} L ${x2 - 5} ${y2 - 12}`} fill="none" stroke={shape.color} strokeWidth={strokeWidth} />
                )}
              </g>
            )
          }
          if (shape.kind === 'triangle') {
            const points = `${shape.x + shape.width / 2},${shape.y} ${shape.x + shape.width},${shape.y + shape.height} ${shape.x},${shape.y + shape.height}`
            return <polygon key={shape.id} points={points} fill={fill} stroke={shape.color} strokeWidth={strokeWidth} opacity={shape.opacity ?? 1} transform={transform} />
          }
          return (
            <rect key={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height}
              fill={fill} stroke={shape.color}
              strokeWidth={strokeWidth} opacity={shape.opacity ?? 1} transform={transform} />
          )
        })}
        {(data?.stickers ?? []).map((sticker) => {
          const definition = getSticker(sticker.stickerId)
          const svg = sticker.customSvg ?? (sticker.lottieUrl ? definition?.previewSvg : definition?.svg) ?? definition?.svg
          if (!svg) return null
          const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
          return (
            <image key={sticker.id} href={source} x={sticker.x} y={sticker.y}
              width={sticker.width} height={sticker.height} opacity={sticker.opacity ?? 1}
              transform={sticker.rotation ? `rotate(${sticker.rotation} ${sticker.x + sticker.width / 2} ${sticker.y + sticker.height / 2})` : undefined} />
          )
        })}
        {(data?.stickyNotes ?? []).map((note) => {
          const width = note.width ?? 120
          const height = note.height ?? 120
          return (
            <g key={note.id} opacity={note.opacity ?? 1}
              transform={note.rotation ? `rotate(${note.rotation} ${note.x + width / 2} ${note.y + height / 2})` : undefined}>
              <rect x={note.x} y={note.y} width={width} height={height} rx="4" fill={note.color} />
              {note.text.split('\n').map((line, index) => (
                <text key={`${note.id}-${index}`} x={note.x + 10} y={note.y + 20 + index * 18} fill="#302c29" fontSize="14">{line}</text>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 px-[8%] pt-[8%]">
        <div className="mb-[3%] truncate font-serif text-[3.5cqw] leading-tight">
          {title || <span className="text-muted-foreground/55">Título da página</span>}
        </div>
        <div
          className="min-h-[82%] whitespace-pre-wrap break-words font-sans text-[2.2cqw] leading-[3.9cqw] text-foreground/90"
          style={{
            backgroundImage: 'linear-gradient(to bottom, transparent calc(3.9cqw - 1px), color-mix(in oklab, var(--border) 42%, transparent) 3.9cqw)',
            backgroundSize: '100% 3.9cqw',
            backgroundPosition: '0 0.15cqw',
          }}
        >
          {content || <span className="text-muted-foreground/55">Comece a escrever…</span>}
        </div>
      </div>
      <span className="absolute bottom-[5%] right-[8%] text-[1.8cqw] tabular-nums text-muted-foreground">
        1
      </span>
    </div>
  )
}
