import { recognizeCanvasData } from './lib/recognition/engine'
import { segmentLines } from './lib/recognition/segment'
import { cleanStrokes } from './lib/recognition/preprocess'
import { getPrototypeStrokes } from './lib/recognition/prototypes'
import type { CanvasData, Stroke } from './lib/types'
import { bbox, bboxCx } from './lib/recognition/geometry'

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

function renderPrinted(word: string, x0 = 80, baseY = 300, xH = 40): Stroke[] {
  const ASC = 'bdfhklt'.split('')
  const DESC = 'gjpqy'.split('')
  const out: Stroke[] = []
  let cur = x0
  for (const ch of word) {
    const raw = getPrototypeStrokes(ch)
    if (!raw) continue
    const isUpper = ch >= 'A' && ch <= 'Z'
    const asc = ASC.includes(ch), desc = DESC.includes(ch)
    const scaleY = isUpper || asc ? xH * 1.55 : desc ? xH * 1.4 : xH
    const topY = baseY - scaleY
    let minX = Infinity, maxX = -Infinity
    for (const st of raw) for (const p of st) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x) }
    const w01 = Math.max(maxX - minX, 0.1)
    for (const st of raw) {
      const pts = st.map(p => ({ x: cur + (p.x - minX) * scaleY, y: topY + p.y * scaleY }))
      out.push(mkStroke(pts))
    }
    cur += w01 * scaleY + xH * 0.35
  }
  return out
}

async function probe(name: string, strokes: Stroke[]) {
  const data: CanvasData = { strokes, stickers: [], texts: [], shapes: [], stickyNotes: [] }
  const clean = cleanStrokes(data.strokes)
  const lines = segmentLines(clean)
  console.log(`\n=== ${name} ===`)
  console.log(`  traços limpos: ${clean.length}`)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    console.log(`  linha ${i}: xH=${l.xHeight.toFixed(1)} baseline=${l.baselineY.toFixed(1)} palabras=${l.words.length}`)
    for (const w of l.words) {
      console.log(`    palavra x=${w.box.x.toFixed(1)} w=${w.box.w.toFixed(1)} body=${w.strokes.length} marks=${w.marks.length}`)
      for (const s of w.strokes) {
        console.log(`      body-stroke x=${bboxCx(s.box).toFixed(1)} w=${s.box.w.toFixed(1)} h=${s.box.h.toFixed(1)} ratio=${(s.box.w / l.xHeight).toFixed(2)}`)
      }
    }
  }
  const out = await recognizeCanvasData(data, { lang: 'por' })
  console.log(`  SAÍDA: ${JSON.stringify(out.text)} (linhas=${JSON.stringify(out.lines)})`)
  for (const l of out.lineDetails) {
    for (const w of l.words) {
      console.log(`    palavra raw=${JSON.stringify(w.raw)} final=${JSON.stringify(w.text)} conf=${w.confidence.toFixed(2)}`)
    }
  }
}

const main = async () => {
  await probe('Bruno impresso', renderPrinted('Bruno'))
  process.exit(0)
}
main()