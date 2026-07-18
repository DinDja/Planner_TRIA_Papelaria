'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useSettingsStore } from '@/lib/store/use-settings-store'
import { MOCK_ACTIVITY, MOCK_AGENDA, MOCK_GOALS, MOCK_STATS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Flame,
  FolderOpen,
  NotebookPen,
  Star,
  Target,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/** Atraso escalonado para animação de entrada */
const stagger = (i: number) => ({ animationDelay: `${i * 70}ms` })
const enter =
  'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

export function DashboardPage() {
  const planners = useAppStore((s) => s.planners)
  const gradDash = useSettingsStore((s) => s.gradients.dashboard)
  const gradCharts = useSettingsStore((s) => s.gradients.charts)
  const gradCovers = useSettingsStore((s) => s.gradients.covers)
  const favorites = planners.filter((p) => p.favorite)
  const recents = [...planners].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  // Mini calendar
  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const year = now.getFullYear()
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const firstDay = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7
  const today = now.getDate()

  const maxMinutes = Math.max(...MOCK_ACTIVITY.map((d) => d.minutes))
  const todayIdx = (now.getDay() + 6) % 7 // Seg = 0

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className={cn('flex flex-wrap items-end justify-between gap-4 mb-8', enter)}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting},{' '}
            <span
              data-grad="dashboard"
              className={cn(
                'bg-clip-text text-transparent',
                gradDash
                  ? 'bg-gradient-to-r from-primary via-[#e05b6d] to-[#f0b429]'
                  : 'text-primary bg-none',
              )}
            >
              usuário
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {now.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-3.5 py-2 shadow-sm">
          <Flame size={16} className="text-orange-500 fill-orange-500/30" />
          <div className="leading-tight">
            <p className="text-sm font-bold tabular-nums">{MOCK_STATS.currentStreak} dias</p>
            <p className="text-[10px] text-muted-foreground">de sequência</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Planners', value: MOCK_STATS.totalPlanners, icon: FolderOpen, color: '#e05b6d' },
          { label: 'Páginas', value: MOCK_STATS.totalPages, icon: NotebookPen, color: '#5b8dbf' },
          { label: 'Minutos esta semana', value: MOCK_STATS.weeklyMinutes, icon: Clock, color: '#f0b429' },
          { label: 'Dias de streak', value: MOCK_STATS.currentStreak, icon: Flame, color: '#e8a0a0' },
        ].map((stat) => (
          <Card key={stat.label} glass hover className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: stat.color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-0.5">{stat.value}</p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: stat.color + '18' }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content: Recent + Favorites */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recents */}
          <Card glass className={enter} style={stagger(5)}>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Planners recentes</CardTitle>
              <Link
                href="/templates"
                className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors"
              >
                Explorar templates <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 pt-3">
              {recents.slice(0, 6).map((planner) => (
                <Link
                  key={planner.id}
                  href={`/planner/${planner.id}`}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 p-4 transition-all duration-300 hover:shadow-lift hover:border-transparent hover:-translate-y-1"
                  style={{ ['--pc' as string]: planner.color }}
                >
                  <div
                    data-grad="cover"
                    className="relative flex size-12 items-center justify-center rounded-2xl text-white text-lg font-bold shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-4deg] overflow-hidden"
                    style={{
                      background: gradCovers
                        ? `linear-gradient(135deg, ${planner.color}, ${planner.color}b3)`
                        : planner.color,
                    }}
                  >
                    {gradCovers && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
                    )}
                    <span className="relative drop-shadow-sm">{planner.name[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{planner.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {planner.pages.length} páginas
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Favorites */}
          {favorites.length > 0 && (
            <Card glass className={enter} style={stagger(6)}>
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  Favoritos
                </CardTitle>
              </CardHeader>
              <div className="flex gap-3 p-5 pt-3 overflow-auto scrollbar-thin">
                {favorites.map((planner) => (
                  <Link
                    key={planner.id}
                    href={`/planner/${planner.id}`}
                    className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 p-4 w-28 transition-all duration-300 hover:shadow-lift hover:border-transparent hover:-translate-y-1"
                  >
                  <div
                    data-grad="cover"
                    className="relative flex size-14 items-center justify-center rounded-2xl text-white text-xl font-bold shadow-md transition-transform duration-300 group-hover:scale-105 overflow-hidden"
                    style={{
                      background: gradCovers
                        ? `linear-gradient(135deg, ${planner.color}, ${planner.color}b3)`
                        : planner.color,
                    }}
                  >
                    {gradCovers && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
                    )}
                    <span className="relative drop-shadow-sm">{planner.name[0]}</span>
                  </div>
                    <p className="text-[11px] font-medium text-center truncate w-full">
                      {planner.name}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Activity chart */}
          <Card glass className={enter} style={stagger(7)}>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Atividade semanal</CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Total: <span className="font-semibold text-foreground tabular-nums">{MOCK_STATS.weeklyMinutes}min</span>
              </span>
            </CardHeader>
            <CardContent>
              <div className="relative flex items-end gap-3 h-36 pt-2">
                {/* linhas-guia */}
                <div className="absolute inset-x-0 top-2 bottom-6 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="border-t border-dashed border-border/40" />
                  ))}
                </div>
                {MOCK_ACTIVITY.map((day, i) => {
                  const h = (day.minutes / maxMinutes) * 100
                  const isToday = i === todayIdx
                  const isMax = day.minutes === maxMinutes
                  const barColor = isMax ? '#f0b429' : '#5b8dbf'
                  return (
                    <div key={day.day} className="group relative flex-1 flex flex-col items-center gap-1.5 self-stretch">
                      <span
                        className={cn(
                          'text-[11px] font-medium tabular-nums transition-colors',
                          isToday ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      >
                        {day.minutes}m
                      </span>
                      <div className="flex-1 w-full flex items-end relative">
                        <div
                          className={cn(
                            'w-full rounded-full transition-all duration-500 group-hover:brightness-110 group-hover:shadow-lg',
                            isToday && 'shadow-md',
                          )}
                          style={{
                            height: `${h}%`,
                            background: gradCharts
                              ? `linear-gradient(to top, ${barColor}, ${barColor}99)`
                              : barColor,
                            boxShadow: isToday ? `0 0 0 2px ${barColor}40` : undefined,
                            opacity: isToday ? 1 : 0.85,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[11px] transition-colors',
                          isToday ? 'font-bold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {day.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar content */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card glass className={enter} style={stagger(8)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold capitalize">
                {monthName} <span className="text-muted-foreground font-medium">{year}</span>
              </span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                Hoje {today}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <span key={d} className="text-[10px] font-semibold text-muted-foreground py-1">
                  {d}
                </span>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1
                const isToday = d === today
                return (
                  <div
                    key={d}
                    className={cn(
                      'text-xs py-1.5 rounded-lg transition-all duration-200 cursor-default tabular-nums',
                      isToday
                        ? 'bg-primary text-primary-foreground font-bold shadow-[0_2px_10px_-2px_var(--primary)] scale-105'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Agenda */}
          <Card glass className={enter} style={stagger(9)}>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Agenda de hoje
              </CardTitle>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {MOCK_AGENDA.length} eventos
              </span>
            </CardHeader>
            <div className="px-5 py-3">
              {MOCK_AGENDA.length > 0 ? (
                <div className="relative space-y-1">
                  {/* trilha da timeline */}
                  <div className="absolute left-[59px] top-3 bottom-3 w-px bg-border/70" />
                  {MOCK_AGENDA.map((event) => (
                    <div
                      key={event.id}
                      className="relative flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex flex-col items-end shrink-0 w-10">
                        <span className="text-xs font-semibold tabular-nums">{event.time}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{event.endTime}</span>
                      </div>
                      <div
                        className="relative z-10 size-2.5 rounded-full shrink-0 ring-4 ring-card transition-transform duration-200 group-hover:scale-125"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-sm truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento para hoje.
                </p>
              )}
            </div>
          </Card>

          {/* Goals */}
          <Card glass className={enter} style={stagger(10)}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Objetivos
              </CardTitle>
            </CardHeader>
            <div className="px-5 pb-3 space-y-3.5">
              {MOCK_GOALS.map((goal) => {
                const pct = Math.round((goal.current / goal.target) * 100)
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{goal.title}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        <span className="font-semibold text-foreground">{goal.current}</span>
                        /{goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/80 overflow-hidden">
                      <div
                        className="relative h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: gradCharts
                            ? `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`
                            : goal.color,
                          boxShadow: `0 1px 6px -1px ${goal.color}80`,
                        }}
                      >
                        {gradCharts && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
