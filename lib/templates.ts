import type { PageTemplateId } from './types'

export interface PageTemplate {
  id: PageTemplateId
  name: string
  description: string
  group: 'Básico' | 'Planejamento' | 'Produtividade' | 'Vida'
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  { id: 'blank', name: 'Em branco', description: 'Página lisa, liberdade total', group: 'Básico' },
  { id: 'lined', name: 'Pautada', description: 'Linhas horizontais para escrita', group: 'Básico' },
  { id: 'grid', name: 'Quadriculada', description: 'Grade quadriculada fina', group: 'Básico' },
  { id: 'dotted', name: 'Pontilhada', description: 'Pontos discretos estilo bullet journal', group: 'Básico' },
  { id: 'cornell', name: 'Cornell', description: 'Método Cornell de anotações', group: 'Básico' },
  { id: 'daily', name: 'Planner diário', description: 'Horários, prioridades e notas', group: 'Planejamento' },
  { id: 'weekly', name: 'Planner semanal', description: 'Sete dias em visão única', group: 'Planejamento' },
  { id: 'monthly', name: 'Planner mensal', description: 'Grade do mês completo', group: 'Planejamento' },
  { id: 'calendar', name: 'Calendário', description: 'Calendário anual compacto', group: 'Planejamento' },
  { id: 'kanban', name: 'Kanban', description: 'A fazer, fazendo, concluído', group: 'Produtividade' },
  { id: 'checklist', name: 'Checklist', description: 'Lista de tarefas com caixas', group: 'Produtividade' },
  { id: 'habit', name: 'Habit Tracker', description: 'Rastreie hábitos por 31 dias', group: 'Produtividade' },
  { id: 'meal', name: 'Meal Planner', description: 'Refeições da semana', group: 'Vida' },
  { id: 'finance', name: 'Controle financeiro', description: 'Entradas, saídas e saldo', group: 'Vida' },
]

export interface TemplateColors {
  paper: string
  line: string
  accent: string
  text: string
  faint: string
}

/** Paleta do papel/template adaptada ao tema atual */
export function getTemplateColors(isDark: boolean): TemplateColors {
  return {
    paper: isDark ? '#2a2a28' : '#ffffff',
    line: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
    accent: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    text: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
    faint: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
  }
}

/**
 * Desenha o fundo do template no canvas.
 * As cores se adaptam ao tema (recebidas como parâmetro).
 */
export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  template: PageTemplateId,
  w: number,
  h: number,
  colors: TemplateColors,
) {
  ctx.fillStyle = colors.paper
  ctx.fillRect(0, 0, w, h)

  const margin = 48

  switch (template) {
    case 'lined': {
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 1
      for (let y = margin + 40; y < h - margin; y += 34) {
        line(ctx, margin, y, w - margin, y)
      }
      break
    }

    case 'grid': {
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 0.75
      for (let x = margin; x <= w - margin; x += 28) line(ctx, x, margin, x, h - margin)
      for (let y = margin; y <= h - margin; y += 28) line(ctx, margin, y, w - margin, y)
      break
    }

    case 'dotted': {
      ctx.fillStyle = colors.line
      for (let x = margin; x <= w - margin; x += 26) {
        for (let y = margin; y <= h - margin; y += 26) {
          ctx.beginPath()
          ctx.arc(x, y, 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }

    case 'cornell': {
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 1.25
      const cueW = (w - margin * 2) * 0.3
      const summaryH = 190
      // Linha vertical (cue | notas)
      line(ctx, margin + cueW, margin, margin + cueW, h - margin - summaryH)
      // Linha horizontal (resumo)
      line(ctx, margin, h - margin - summaryH, w - margin, h - margin - summaryH)
      // Linhas de escrita na área de notas
      ctx.lineWidth = 0.75
      for (let y = margin + 44; y < h - margin - summaryH - 20; y += 34) {
        line(ctx, margin + cueW + 22, y, w - margin, y)
      }
      // Rótulos
      ctx.fillStyle = colors.faint
      ctx.font = '600 13px system-ui, sans-serif'
      ctx.fillText('PALAVRAS-CHAVE', margin + 4, margin + 18)
      ctx.fillText('ANOTAÇÕES', margin + cueW + 26, margin + 18)
      ctx.fillText('RESUMO', margin + 4, h - margin - summaryH + 24)
      break
    }

    case 'daily': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1

      // Cabeçalho
      ctx.font = '600 22px system-ui, sans-serif'
      ctx.fillText('Data:', margin, margin + 24)
      ctx.beginPath()
      ctx.moveTo(margin + 60, margin + 28)
      ctx.lineTo(margin + 280, margin + 28)
      ctx.stroke()

      // Coluna de horários (esquerda)
      const colW = (w - margin * 2) * 0.55
      ctx.font = '500 15px system-ui, sans-serif'
      let y = margin + 80
      for (let hour = 6; hour <= 22; hour += 2) {
        ctx.globalAlpha = 0.55
        ctx.fillText(`${String(hour).padStart(2, '0')}h`, margin, y + 4)
        ctx.globalAlpha = 1
        line(ctx, margin + 44, y, margin + colW, y)
        y += 58
      }

      // Coluna direita: prioridades + notas
      const rx = margin + colW + 32
      ctx.font = '600 16px system-ui, sans-serif'
      ctx.fillText('Prioridades', rx, margin + 84)
      for (let i = 0; i < 4; i++) {
        const py = margin + 112 + i * 40
        ctx.strokeRect(rx, py - 12, 14, 14)
        line(ctx, rx + 24, py, w - margin, py)
      }
      ctx.fillText('Notas', rx, margin + 320)
      for (let i = 0; i < 8; i++) {
        const ny = margin + 352 + i * 36
        line(ctx, rx, ny, w - margin, ny)
      }
      break
    }

    case 'weekly': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1
      const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
      const rowH = (h - margin * 2 - 40) / 4
      const colWk = (w - margin * 2) / 2
      ctx.font = '600 17px system-ui, sans-serif'

      days.forEach((day, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + col * colWk
        const y = margin + 40 + row * rowH
        ctx.fillText(day, x + 12, y + 26)
        ctx.strokeRect(x, y, colWk - (col === 0 ? 16 : 0), rowH - 16)
      })
      break
    }

    case 'monthly': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1
      const now = new Date()
      const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      ctx.font = '600 24px system-ui, sans-serif'
      ctx.fillText(monthName.charAt(0).toUpperCase() + monthName.slice(1), margin, margin + 26)

      const top = margin + 60
      const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      const cellW = (w - margin * 2) / 7
      const cellH = (h - top - margin) / 6
      ctx.font = '600 13px system-ui, sans-serif'
      ctx.fillStyle = colors.faint
      weekDays.forEach((d, i) => ctx.fillText(d, margin + i * cellW + 8, top - 10))

      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOffset = (first.getDay() + 6) % 7 // segunda = 0
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      ctx.strokeStyle = colors.line
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          const x = margin + c * cellW
          const yy = top + r * cellH
          ctx.strokeRect(x, yy, cellW, cellH)
          const dayNum = r * 7 + c - startOffset + 1
          if (dayNum >= 1 && dayNum <= daysInMonth) {
            ctx.fillStyle = dayNum === now.getDate() ? colors.accent : colors.text
            ctx.font = dayNum === now.getDate() ? '700 14px system-ui, sans-serif' : '500 13px system-ui, sans-serif'
            ctx.fillText(String(dayNum), x + 8, yy + 20)
          }
        }
      }
      break
    }

    case 'calendar': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      const year = new Date().getFullYear()
      ctx.font = '600 24px system-ui, sans-serif'
      ctx.fillText(String(year), margin, margin + 24)

      const months = Array.from({ length: 12 }, (_, i) =>
        new Date(year, i, 1).toLocaleDateString('pt-BR', { month: 'long' }),
      )
      const gridW = (w - margin * 2 - 48) / 3
      const gridH = (h - margin * 2 - 60) / 4
      months.forEach((m, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = margin + col * (gridW + 24)
        const y = margin + 52 + row * (gridH + 14)
        ctx.font = '600 13px system-ui, sans-serif'
        ctx.fillStyle = colors.text
        ctx.fillText(m.charAt(0).toUpperCase() + m.slice(1), x, y)
        // mini grade 7x6
        const cw = gridW / 7
        ctx.fillStyle = colors.faint
        ctx.font = '500 9px system-ui, sans-serif'
        const firstDay = (new Date(year, i, 1).getDay() + 6) % 7
        const dim = new Date(year, i + 1, 0).getDate()
        for (let d = 1; d <= dim; d++) {
          const pos = firstDay + d - 1
          const dx = x + (pos % 7) * cw
          const dy = y + 22 + Math.floor(pos / 7) * (cw * 0.9)
          ctx.fillText(String(d), dx, dy)
        }
      })
      break
    }

    case 'kanban': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1
      const cols = ['A fazer', 'Fazendo', 'Concluído']
      const colW = (w - margin * 2 - 32) / 3
      const top = margin + 10
      const colH = h - margin * 2 - 20
      cols.forEach((c, i) => {
        const x = margin + i * (colW + 16)
        // cabeçalho da coluna
        ctx.fillStyle = colors.accent
        roundRect(ctx, x, top, colW, 40, 10)
        ctx.fill()
        ctx.fillStyle = colors.paper
        ctx.font = '600 16px system-ui, sans-serif'
        ctx.fillText(c, x + 16, top + 26)
        // corpo
        ctx.strokeStyle = colors.line
        ctx.setLineDash([5, 5])
        roundRect(ctx, x, top + 52, colW, colH - 52, 10)
        ctx.stroke()
        ctx.setLineDash([])
      })
      break
    }

    case 'checklist': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1.25
      ctx.font = '600 22px system-ui, sans-serif'
      ctx.fillText('Checklist', margin, margin + 24)
      let y = margin + 84
      for (let i = 0; i < 18 && y < h - margin; i++) {
        ctx.strokeRect(margin, y - 15, 18, 18)
        line(ctx, margin + 34, y, w - margin, y)
        y += 52
      }
      break
    }

    case 'habit': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 0.75
      ctx.font = '600 22px system-ui, sans-serif'
      ctx.fillText('Rastreador de hábitos', margin, margin + 24)

      const top = margin + 70
      const labelW = 180
      const days = 31
      const cellW = (w - margin * 2 - labelW) / days
      const rowH = 44
      const habits = 12

      ctx.font = '500 10px system-ui, sans-serif'
      ctx.fillStyle = colors.faint
      for (let d = 1; d <= days; d++) {
        ctx.fillText(String(d), margin + labelW + (d - 1) * cellW + 2, top - 8)
      }
      for (let rI = 0; rI < habits; rI++) {
        const y = top + rI * rowH
        ctx.strokeStyle = colors.line
        line(ctx, margin, y, w - margin, y)
        for (let d = 0; d < days; d++) {
          ctx.strokeRect(margin + labelW + d * cellW + 1.5, y + 10, cellW - 3, rowH - 20)
        }
      }
      line(ctx, margin, top + habits * rowH, w - margin, top + habits * rowH)
      line(ctx, margin + labelW, top, margin + labelW, top + habits * rowH)
      break
    }

    case 'meal': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1
      ctx.font = '600 22px system-ui, sans-serif'
      ctx.fillText('Refeições da semana', margin, margin + 24)

      const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
      const meals = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar']
      const top = margin + 60
      const labelW = 120
      const colW = (w - margin * 2 - labelW) / meals.length
      const rowH = (h - top - margin) / days.length

      ctx.font = '600 13px system-ui, sans-serif'
      meals.forEach((m, i) => ctx.fillText(m, margin + labelW + i * colW + 10, top - 10))
      days.forEach((d, rI) => {
        const y = top + rI * rowH
        ctx.fillStyle = colors.text
        ctx.font = '600 13px system-ui, sans-serif'
        ctx.fillText(d, margin, y + rowH / 2)
        for (let c = 0; c < meals.length; c++) {
          ctx.strokeStyle = colors.line
          roundRect(ctx, margin + labelW + c * colW + 4, y + 4, colW - 10, rowH - 10, 8)
          ctx.stroke()
        }
      })
      break
    }

    case 'finance': {
      ctx.strokeStyle = colors.line
      ctx.fillStyle = colors.text
      ctx.lineWidth = 1
      ctx.font = '600 22px system-ui, sans-serif'
      ctx.fillText('Controle financeiro', margin, margin + 24)

      // Resumo
      const top = margin + 56
      const boxW = (w - margin * 2 - 32) / 3
      const labels = ['Entradas', 'Saídas', 'Saldo']
      labels.forEach((l, i) => {
        const x = margin + i * (boxW + 16)
        ctx.fillStyle = colors.accent
        roundRect(ctx, x, top, boxW, 64, 10)
        ctx.fill()
        ctx.fillStyle = colors.paper
        ctx.font = '600 14px system-ui, sans-serif'
        ctx.fillText(l, x + 14, top + 26)
        ctx.font = '500 13px system-ui, sans-serif'
        ctx.fillText('R$ _________', x + 14, top + 46)
      })

      // Tabela
      const tableTop = top + 96
      const cols = ['Data', 'Descrição', 'Categoria', 'Valor']
      const colWs = [0.16, 0.42, 0.22, 0.2].map((f) => f * (w - margin * 2))
      ctx.fillStyle = colors.faint
      ctx.font = '600 12px system-ui, sans-serif'
      let x = margin
      cols.forEach((c, i) => {
        ctx.fillText(c, x + 6, tableTop + 18)
        x += colWs[i]
      })
      ctx.strokeStyle = colors.line
      line(ctx, margin, tableTop + 28, w - margin, tableTop + 28)
      for (let rI = 0; rI < 16; rI++) {
        const y = tableTop + 28 + (rI + 1) * 40
        if (y > h - margin) break
        line(ctx, margin, y, w - margin, y)
      }
      x = margin
      colWs.forEach((cw) => {
        line(ctx, x, tableTop + 28, x, Math.min(tableTop + 28 + 16 * 40, h - margin))
        x += cw
      })
      line(ctx, w - margin, tableTop + 28, w - margin, Math.min(tableTop + 28 + 16 * 40, h - margin))
      break
    }

    default:
      break
  }
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
