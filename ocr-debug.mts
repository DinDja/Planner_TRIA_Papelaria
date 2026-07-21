// Debug: features + top-3 do classificador para letras problemáticas.
import { featurizeGlyph } from './lib/recognition/features'
import { classifyGlyph } from './lib/recognition/engine'
import { cleanStrokes } from './lib/recognition/preprocess'
import { segmentLines } from './lib/recognition/segment'
import { getPrototypeStrokes } from './lib/recognition/prototypes'
import type { Stroke } from './lib/types'

const ASC = new Set('bdfhklt'.split(''))
const DESC = new Set('gjpqy'.split(''))

let uid = 0
function mkStroke(pts: { x: number; y: number }[]): Stroke {
  return {
    id: `s${uid++}`,
    tool: 'pen', color: '#000', size: 4, opacity: 1,
    points: pts.map((p) => ({ x: p.x, y: p.y, pressure: 0.5 })),
  }
}

function renderChar(ch: string, x0: number, baseY: number, xH = 40): Stroke[] {
  const raw = getPrototypeStrokes(ch)
  if (!raw) return []
  const isUpper = ch >= 'A' && ch <= 'Z'
  const isDigit = ch >= '0' && ch <= '9'
  let scaleY = xH
  let topY = baseY - xH
  if (isUpper || isDigit || ASC.has(ch)) { scaleY = xH * 1.55; topY = baseY - xH * 1.55 }
  else if (DESC.has(ch)) { scaleY = xH * 1.4; topY = baseY - xH }
  else if (ch === 'i') { scaleY = xH * 1.4; topY = baseY - xH * 1.4 }
  let minX = Infinity, maxX = -Infinity
  for (const st of raw) for (const p of st) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x) }
  return raw.map((st) =>
    mkStroke(st.map((p) => ({ x: x0 + (p.x - minX) * scaleY, y: topY + p.y * scaleY }))),
  )
}

// Uma linha com todas as letras (como o teste anterior)
const chars = 'abcdefghijklmnopqrstuvwxyz'
const allStrokes = chars.split('').flatMap((ch, i) => renderChar(ch, 60 + i * 90, 300))
const cleaned = cleanStrokes(allStrokes)
const lines = segmentLines(cleaned)
const line = lines[0]
console.log(`line: xHeight=${line.xHeight.toFixed(1)} baseline=${line.baselineY.toFixed(1)} words=${line.words.length}`)
for (const w of line.words) {
  console.log(`  word: body=${w.strokes.length} marks=${w.marks.length} box=${JSON.stringify(w.box)}`)
}

// Classifica glifos isolados com ctx ideal
for (const ch of ['a', 'f', 'j', 'r', 'w']) {
  const strokes = cleanStrokes(renderChar(ch, 100, 300))
  const body = strokes.filter((s) => s.length > 2)
  const feat = featurizeGlyph(strokes, [], { baselineY: 300, xHeight: 40 })
  const top = classifyGlyph(feat)
  console.log(
    `${ch}: relH=${feat.relHeight.toFixed(2)} aspect=${feat.aspect.toFixed(2)} loops=${feat.loops} nStrokes=${feat.nStrokes} dot=${feat.dotAbove} bar=${feat.barAcross} zone=(${feat.zone.top.toFixed(2)},${feat.zone.bot.toFixed(2)})`,
  )
  console.log(`   top3: ${top.map((t) => `${t.ch}=${t.score.toFixed(3)}`).join('  ')}`)
  void body
}
