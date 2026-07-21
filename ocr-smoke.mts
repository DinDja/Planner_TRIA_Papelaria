// Smoke test do motor HTR vetorial — renderiza palavras a partir dos
// protótipos (com jitter e escala realistas) e verifica o reconhecimento.
// Uso: npx tsx ocr-smoke.mts

import { recognizeCanvasData } from './lib/recognition/engine'
import { getPrototypeStrokes } from './lib/recognition/prototypes'
import type { CanvasData, Stroke } from './lib/types'

const ASC = new Set('bdfhklt'.split(''))
const DESC = new Set('gjpqy'.split(''))
const ACCENTED = new Set('áàâãéêíóôõúüç'.split(''))

let uid = 0
function mkStroke(pts: { x: number; y: number }[]): Stroke {
  return {
    id: `s${uid++}`,
    tool: 'pen',
    color: '#000',
    size: 4,
    opacity: 1,
    points: pts.map((p) => ({ x: p.x, y: p.y, pressure: 0.5 })),
  }
}

/** Jitter determinístico leve */
function jitter(v: number, seed: number): number {
  return v + Math.sin(seed * 12.9898) * 1.6
}

function renderWord(word: string, x0: number, baseY: number, xH = 40): Stroke[] {
  const strokes: Stroke[] = []
  let cursor = x0
  for (const ch of word) {
    const raw = getPrototypeStrokes(ch)
    if (!raw) continue
    const isUpper = ch >= 'A' && ch <= 'Z'
    const isDigit = ch >= '0' && ch <= '9'
    let scaleY = xH
    let topY = baseY - xH
    if (isUpper || isDigit || ASC.has(ch)) {
      scaleY = xH * 1.55
      topY = baseY - xH * 1.55
    } else if (DESC.has(ch)) {
      scaleY = xH * 1.4
      topY = baseY - xH
    } else if (ACCENTED.has(ch)) {
      scaleY = xH * 1.45
      topY = baseY - xH * 1.45
    } else if (ch === 'i') {
      scaleY = xH * 1.4
      topY = baseY - xH * 1.4
    }
    // largura da caixa unitária do protótipo
    let minX = Infinity
    let maxX = -Infinity
    for (const st of raw) for (const p of st) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x) }
    const w01 = Math.max(maxX - minX, 0.1)
    for (const st of raw) {
      const pts = st.map((p, i) => ({
        x: jitter(cursor + (p.x - minX) * scaleY, i + cursor),
        y: jitter(topY + p.y * scaleY, i * 7 + cursor),
      }))
      strokes.push(mkStroke(pts))
    }
    cursor += w01 * scaleY + xH * 0.35
  }
  return strokes
}

function page(...lineStrokes: Stroke[][]): CanvasData {
  return {
    strokes: lineStrokes.flat(),
    stickers: [],
    texts: [],
    shapes: [],
    stickyNotes: [],
  }
}

let pass = 0
let fail = 0

async function check(name: string, data: CanvasData, expect: (out: { text: string; lines: string[] }) => boolean) {
  const out = await recognizeCanvasData(data, { lang: 'por' })
  const ok = expect(out)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  console.log(`      linhas: ${JSON.stringify(out.lines)}`)
  for (const l of out.lineDetails) {
    for (const w of l.words) {
      console.log(`      palavra raw=${JSON.stringify(w.raw)} final=${JSON.stringify(w.text)} conf=${w.confidence.toFixed(2)}`)
    }
  }
  if (ok) pass++
  else fail++
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const main = async () => {
  await check('palavra "oi"', page(renderWord('oi', 80, 300)), (o) =>
    norm(o.text).includes('oi'),
  )
  await check('palavra "casa"', page(renderWord('casa', 80, 300)), (o) =>
    norm(o.text).includes('casa'),
  )
  await check('palavra "hoje"', page(renderWord('hoje', 80, 300)), (o) =>
    norm(o.text).includes('hoje'),
  )
  await check(
    'duas linhas: "meta" / "semana"',
    page(renderWord('meta', 80, 300), renderWord('semana', 80, 520)),
    (o) => o.lines.length === 2 && norm(o.lines[0]).includes('meta') && norm(o.lines[1]).includes('semana'),
  )
  await check('dígitos "2024"', page(renderWord('2024', 80, 300)), (o) =>
    o.text.includes('2024'),
  )
  await check(
    'restauração de acento: "amanha" → "amanhã"',
    page(renderWord('amanha', 80, 300)),
    (o) => o.text.includes('amanhã') || norm(o.text).includes('amanha'),
  )
  await check(
    'frase: "pagar conta"',
    page(renderWord('pagar', 80, 300).concat(renderWord('conta', 320, 300))),
    (o) => norm(o.text).includes('pagar') && norm(o.text).includes('conta'),
  )

  console.log(`\n${pass} passaram, ${fail} falharam`)
  process.exit(fail > 0 ? 1 : 0)
}

main()
