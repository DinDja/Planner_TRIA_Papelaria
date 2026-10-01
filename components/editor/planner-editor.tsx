'use client'

import { useEffect, useRef, type PointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store/use-app-store'
import type { Planner, PlannerPage } from '@/lib/types'
import { Button } from '../ui/button'

function pageText(page: PlannerPage): string {
  if (typeof page.content === 'string') return page.content
  return (page.data?.texts ?? []).map((item) => item.text).filter(Boolean).join('\n\n')
}

function countVisualLines(value: string, textarea: HTMLTextAreaElement): number {
  const style = window.getComputedStyle(textarea)
  const width = textarea.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context || width <= 0) return Math.max(1, value.split('\n').length)

  context.font = style.font
  let count = 0

  for (const paragraph of value.split('\n')) {
    if (!paragraph) {
      count += 1
      continue
    }

    let line = ''
    for (const word of paragraph.match(/\S+\s*/g) ?? [paragraph]) {
      const candidate = line + word
      if (line && context.measureText(candidate).width > width) {
        count += 1
        line = word.trimStart()
      } else {
        line = candidate
      }

      if (context.measureText(line).width > width) {
        let fragment = ''
        for (const character of line) {
          if (fragment && context.measureText(fragment + character).width > width) {
            count += 1
            fragment = character
          } else {
            fragment += character
          }
        }
        line = fragment
      }
    }
    count += 1
  }

  return Math.max(count, 1)
}

export function PlannerEditor({ planner }: { planner: Planner }) {
  const router = useRouter()
  const updatePlanner = useAppStore((state) => state.updatePlanner)
  const addPage = useAppStore((state) => state.addPage)
  const textAreaRefs = useRef(new Map<string, HTMLTextAreaElement>())
  const pageEndRef = useRef<HTMLDivElement>(null)
  const pages = Array.isArray(planner.pages) ? planner.pages : []

  useEffect(() => {
    if (pages.length === 0) addPage(planner.id, 'blank')
  }, [addPage, pages.length, planner.id])

  const updatePage = (page: PlannerPage, patch: Partial<PlannerPage>) => {
    updatePlanner(planner.id, {
      pages: pages.map((item) => item.id === page.id ? { ...item, ...patch } : item),
    })
  }

  const handleAddPage = () => {
    addPage(planner.id, 'blank')
    requestAnimationFrame(() => pageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
  }

  const handleTextAreaPointerDown = (
    page: PlannerPage,
    event: PointerEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = event.currentTarget
    const style = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(style.lineHeight)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return

    const borderTop = parseFloat(style.borderTopWidth) || 0
    const paddingTop = parseFloat(style.paddingTop) || 0
    const clickedLine = Math.floor(
      (event.clientY - textarea.getBoundingClientRect().top + textarea.scrollTop - borderTop - paddingTop) /
        lineHeight,
    )
    const value = textarea.value
    const existingLines = countVisualLines(value, textarea)
    if (clickedLine < existingLines) return

    const nextValue = `${value}${'\n'.repeat(clickedLine - existingLines + 1)}`
    event.preventDefault()
    updatePage(page, { content: nextValue })
    requestAnimationFrame(() => {
      const field = textAreaRefs.current.get(page.id)
      if (!field) return
      field.focus()
      field.setSelectionRange(nextValue.length, nextValue.length)
    })
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[color:light-dark(#eee8e2,#24211f)] text-foreground">
      <header className="flex min-h-16 items-center gap-4 border-b border-border/70 bg-background px-4 md:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="shrink-0 px-2">
          Voltar
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg leading-tight">{planner.name}</p>
          <p className="text-xs text-muted-foreground">Caderno</p>
        </div>

        <Button variant="outline" onClick={handleAddPage}>
          Adicionar página
        </Button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 md:gap-8">
          {pages.map((page, index) => {
            const pageTitle = page.title ?? ''
            const title = /^P[aá]gina\s+\d+$/i.test(pageTitle.trim()) ? '' : pageTitle

            return (
              <article
                key={page.id}
                className="flex min-h-[78vh] w-full flex-col bg-[color:light-dark(#fffefa,#302c29)] px-6 py-8 shadow-paper-sheet md:min-h-[82vh] md:px-16 md:py-12"
              >
                <input
                  aria-label={`Título da página ${index + 1}`}
                  value={title}
                  onChange={(event) => updatePage(page, { title: event.target.value })}
                  placeholder="Título da página"
                  className="mb-5 w-full border-0 bg-transparent font-serif text-2xl text-foreground outline-none placeholder:text-muted-foreground/55 md:text-3xl"
                />

                <textarea
                  ref={(element) => {
                    if (element) textAreaRefs.current.set(page.id, element)
                    else textAreaRefs.current.delete(page.id)
                  }}
                  aria-label={`Texto da página ${index + 1}`}
                  autoCapitalize="sentences"
                  value={pageText(page)}
                  onPointerDown={(event) => handleTextAreaPointerDown(page, event)}
                  onChange={(event) => updatePage(page, { content: event.target.value })}
                  placeholder="Comece a escrever…"
                  spellCheck
                  className="min-h-[56vh] w-full flex-1 resize-none border-0 bg-transparent p-0 text-base leading-8 text-foreground outline-none placeholder:text-muted-foreground/55 md:min-h-[62vh] md:text-lg"
                  style={{
                    fontFamily: 'var(--font-plex), sans-serif',
                    backgroundImage: 'linear-gradient(to bottom, transparent calc(2rem - 1px), color-mix(in oklab, var(--border) 42%, transparent) 2rem)',
                    backgroundSize: '100% 2rem',
                    backgroundPosition: '0 0.12rem',
                  }}
                />

                <footer className="mt-5 flex justify-end text-xs tabular-nums text-muted-foreground">
                  <span aria-label={`Página ${index + 1}`}>{index + 1}</span>
                </footer>
              </article>
            )
          })}

          {pages.length === 0 && (
            <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground" role="status">
              Preparando a primeira página…
            </div>
          )}
          <div ref={pageEndRef} aria-hidden="true" />
        </div>
      </main>
    </div>
  )
}
