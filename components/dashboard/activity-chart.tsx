'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { BarChart3, Clock, FileText } from 'lucide-react'

interface ActivityChartProps {
  data: Array<{
    day: string
    pages: number
    minutes: number
  }>
  totalMinutes: number
}

const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const dayColors = {
  'Seg': '#3b82f6',
  'Ter': '#10b981', 
  'Qua': '#f59e0b',
  'Qui': '#ef4444',
  'Sex': '#8b5cf6',
  'Sáb': '#06b6d4',
  'Dom': '#6366f1'
}

export function ActivityChart({ data, totalMinutes }: ActivityChartProps) {
  const maxMinutes = Math.max(...data.map(d => d.minutes))
  const maxPages = Math.max(...data.map(d => d.pages))
  const today = data.find(d => d.day === new Date().toLocaleDateString('pt-BR', { weekday: 'short', weekdayStandalone: false }).slice(0, 2)) || data[0]
  
  const getToday = () => {
    const today = new Date()
    const todayStr = today.toLocaleDateString('pt-BR', { weekday: 'short', weekdayStandalone: false })
    return todayStr.charAt(0).toUpperCase() + todayStr.slice(1, 3)
  }

  return (
    <Card className="glass border border-border/60 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BarChart3 size={16} className="text-blue-500" />
          Atividade Semanal
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-muted-foreground">Minutos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-muted-foreground">Páginas</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumo semanal */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-blue-600">{totalMinutes}min</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-emerald-600">{data.reduce((sum, d) => sum + d.pages, 0)}pg</p>
              <p className="text-xs text-muted-foreground">Páginas</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-purple-600">{Math.round(totalMinutes / data.length)}min</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
          </div>

          {/* Gráfico de barras combinado */}
          <div className="relative h-48 flex items-end justify-between gap-2 pt-4">
            {/* Linhas de grade */}
            <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((value, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="w-8 text-right text-xs text-muted-foreground pr-2 tabular-nums">
                    {value === 100 ? maxMinutes : maxMinutes * value / 100}m
                  </div>
                  <div className="flex-1 ml-2 border-t border-dashed border-border/30" />
                </div>
              ))}
            </div>

            {data.map((day, index) => {
              const minuteHeight = (day.minutes / maxMinutes) * 100
              const pageHeight = (day.pages / maxPages) * 60 // Páginas tem altura máxima de 60%
              const isToday = day.day === getToday()
              const dayKey = daysOfWeek[index]
              const color = dayColors[dayKey as keyof typeof dayColors]

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full flex flex-col items-center gap-1 cursor-pointer">
                          {/* Barra de minutos */}
                          <div
                            className={cn(
                              'w-full rounded-t-lg transition-all duration-500 hover:opacity-80',
                              isToday ? 'shadow-lg ring-2 ring-blue-400/50' : 'shadow-md'
                            )}
                            style={{
                              height: `${minuteHeight}%`,
                              background: `linear-gradient(to top, ${color}, ${color}99)`,
                              opacity: isToday ? 1 : 0.85,
                            }}
                          />
                          {/* Barra de páginas */}
                          <div
                            className={cn(
                              'w-full rounded-b-lg transition-all duration-500',
                              isToday ? 'shadow-lg ring-2 ring-emerald-400/50' : ''
                            )}
                            style={{
                              height: `${pageHeight}%`,
                              backgroundColor: '#10b981',
                              opacity: isToday ? 1 : 0.7,
                            }}
                          />
                          {/* Badge do dia */}
                          <div className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full transition-all',
                            isToday 
                              ? 'bg-blue-500 text-white shadow-md' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}>
                            {day.day}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold">{day.day}</p>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-blue-500" />
                              <span>{day.minutes} minutos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={12} className="text-emerald-500" />
                              <span>{day.pages} páginas</span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )
            })}
          </div>

          {/* Insights */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
              ⭐ Mais produtivo: {data.reduce((max, day) => day.minutes > max.minutes ? day : max, data[0]).day}
            </div>
            <div className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
              📈 {data.filter(d => d.pages > 3).length} dias com +3 páginas
            </div>
            <div className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
              ⏱️ {Math.round(totalMinutes / 60)}h semanais
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}