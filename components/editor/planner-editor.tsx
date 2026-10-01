'use client'

import { useEffect, useRef, type ChangeEvent, type PointerEvent } from 'react'
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

function pageLineCapacity(textarea: HTMLTextAreaElement): number {
  const style = window.getComputedStyle(textarea)
  const lineHeight = parseFloat(style.lineHeight)
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return 1

  const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
  return Math.max(1, Math.floor((textarea.clientHeight - verticalPadding) / lineHeight))
}

function splitIntoPageContents(value: string, textarea: HTMLTextAreaElement, capacity: number): string[] {
  if (countVisualLines(value, textarea) <= capacity) return [value]

  const contents: string[] = []
  let remaining = value

  while (remaining && countVisualLines(remaining, textarea) > capacity) {
    let low = 1
    let high = remaining.length
    let fittingLength = 1

    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      if (countVisualLines(remaining.slice(0, middle), textarea) <= capacity) {
        fittingLength = middle
        low = middle + 1
      } else {
        high = middle - 1
      }
    }

    const lastSpace = remaining.lastIndexOf(' ', fittingLength - 1)
    const lastNewline = remaining.lastIndexOf('\n', fittingLength - 1)
    const lastTab = remaining.lastIndexOf('\t', fittingLength - 1)
    const wordBoundary = Math.max(lastSpace, lastNewline, lastTab) + 1
    if (
      wordBoundary > 0 &&
      wordBoundary < fittingLength &&
      countVisualLines(remaining.slice(0, wordBoundary), textarea) <= capacity
    ) {
      fittingLength = wordBoundary
    }

    contents.push(remaining.slice(0, fittingLength))
    remaining = remaining.slice(fittingLength)
  }

  if (remaining || contents.length === 0) contents.push(remaining)
  return contents
}

export function PlannerEditor({ planner }: { planner: Planner }) {
  const router = useRouter()
  const updatePlanner = useAppStore((state) => state.updatePlanner)
  const addPage = useAppStore((state) => state.addPage)
  const paginatePage = useAppStore((state) => state.paginatePage)
  const textAreaRefs = useRef(new Map<string, HTMLTextAreaElement>())
  const checkedPageContents = useRef(new Map<string, string>())
  const checkedPlannerId = useRef(planner.id)
  const pageEndRef = useRef<HTMLDivElement>(null)
  const pages = Array.isArray(planner.pages) ? planner.pages : []

  useEffect(() => {
    if (pages.length === 0) addPage(planner.id, 'blank')
  }, [addPage, pages.length, planner.id])

  useEffect(() => {
    if (checkedPlannerId.current !== planner.id) {
      checkedPageContents.current.clear()
      checkedPlannerId.current = planner.id
    }

    for (const page of pages) {
      const textarea = textAreaRefs.current.get(page.id)
      if (!textarea || textarea.clientWidth <= 0 || textarea.clientHeight <= 0) continue

      const text = pageText(page)
      if (checkedPageContents.current.get(page.id) === text) continue
      checkedPageContents.current.set(page.id, text)
      const contents = splitIntoPageContents(text, textarea, pageLineCapacity(textarea))
      if (contents.length > 1) paginatePage(planner.id, page.id, contents)
    }
  }, [pages, paginatePage, planner.id])

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

  const handleTextChange = (page: PlannerPage, event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    const value = textarea.value
    const contents = splitIntoPageContents(value, textarea, pageLineCapacity(textarea))
    checkedPageContents.current.set(page.id, value)

    if (contents.length === 1) {
      updatePage(page, { content: value })
      return
    }

    const pageIds = paginatePage(planner.id, page.id, contents)
    const selectionStart = textarea.selectionStart ?? value.length
    const selectionEnd = textarea.selectionEnd ?? selectionStart
    let chunkStart = 0
    let targetIndex = contents.length - 1

    for (let index = 0; index < contents.length; index += 1) {
      const chunkEnd = chunkStart + contents[index].length
      if (selectionEnd < chunkEnd || index === contents.length - 1) {
        targetIndex = index
        break
      }
      chunkStart = chunkEnd
    }

    const targetContent = contents[targetIndex]
    const localStart = Math.max(0, Math.min(targetContent.length, selectionStart - chunkStart))
    const localEnd = Math.max(0, Math.min(targetContent.length, selectionEnd - chunkStart))
    const targetPageId = pageIds[targetIndex]

    requestAnimationFrame(() => {
      const field = textAreaRefs.current.get(targetPageId)
      if (!field) return
      field.focus()
      field.setSelectionRange(localStart, localEnd)
    })
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[color:light-dark(#eee8e2,#24211f)] text-foreground">
      <header className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-border/70 bg-background px-4 md:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="col-start-1 row-start-1 shrink-0 justify-self-start px-2">
          Voltar
        </Button>

        <div className="col-span-3 row-start-2 min-w-0 max-w-full justify-self-center text-center md:col-span-1 md:col-start-2 md:row-start-1 md:max-w-[min(calc(100vw-22rem),36rem)]">
          <p className="truncate font-serif text-lg leading-tight">{planner.name}</p>
        </div>

        <Button onClick={handleAddPage} className="col-start-3 row-start-1 justify-self-end">
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
                  onChange={(event) => handleTextChange(page, event)}
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
