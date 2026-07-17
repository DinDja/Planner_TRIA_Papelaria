'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { MOCK_ACTIVITY, MOCK_AGENDA, MOCK_GOALS, MOCK_STATS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  FolderOpen,
  LayoutDashboard,
  NotebookPen,
  Pen,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge, ScrollArea } from '../ui/primitives'
import { Separator } from '../ui/primitives'

export function DashboardPage() {
  const planners = useAppStore((s) => s.planners)
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

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">usuário</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {(new Date()).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </p>
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
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base">Planners recentes</CardTitle>
              <Link href="/" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 pt-3">
              {recents.slice(0, 6).map((planner) => (
                <Link
                  key={planner.id}
                  href={`/planner/${planner.id}`}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 p-4 hover:shadow-md hover:border-border transition-all duration-200"
                >
                  <div
                    className="flex size-12 items-center justify-center rounded-2xl text-white text-lg font-bold group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: planner.color }}
                  >
                    {planner.name[0]}
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
            <Card glass>
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
                    className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 p-4 w-28 hover:shadow-md hover:border-border transition-all duration-200"
                  >
                    <div
                      className="flex size-14 items-center justify-center rounded-2xl text-white text-xl font-bold"
                      style={{ backgroundColor: planner.color }}
                    >
                      {planner.name[0]}
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
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Atividade semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {MOCK_ACTIVITY.map((day) => {
                  const maxM = Math.max(...MOCK_ACTIVITY.map((d) => d.minutes))
                  const h = (day.minutes / maxM) * 100
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {day.minutes}m
                      </span>
                      <div
                        className="w-full rounded-t-xl transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          backgroundColor: day.minutes > 100 ? '#f0b429' : '#5b8dbf',
                          opacity: 0.8,
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground">{day.day}</span>
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
          <Card glass>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold capitalize">
                {monthName} {year}
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
                      'text-xs py-1.5 rounded-lg transition-colors',
                      isToday
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Agenda */}
          <Card glass>
            <CardHeader className="flex-row items-center justify-between pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Agenda de hoje
              </CardTitle>
            </CardHeader>
            <div className="px-5 py-3">
              {MOCK_AGENDA.length > 0 ? (
                <div className="space-y-2">
                  {MOCK_AGENDA.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex flex-col items-center shrink-0 w-12">
                        <span className="text-xs font-semibold">{event.time}</span>
                        <span className="text-[10px] text-muted-foreground">{event.endTime}</span>
                      </div>
                      <div className="w-0.5 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <span className="text-sm">{event.title}</span>
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
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Objetivos
              </CardTitle>
            </CardHeader>
            <div className="px-5 pb-3 space-y-3">
              {MOCK_GOALS.map((goal) => {
                const pct = Math.round((goal.current / goal.target) * 100)
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{goal.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: goal.color,
                        }}
                      />
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
