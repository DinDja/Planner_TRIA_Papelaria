'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/use-app-store'
import { useSettingsStore } from '@/lib/store/use-settings-store'
import { useCalendarStore } from '@/lib/store/use-calendar-store'
import { useFinanceStore } from '@/lib/store/use-finance-store'
import { useDiarioStore, isoDia, promptDoDia } from '@/lib/diario/use-diario-store'
import {
  ecoDoDia,
  linhaSeteDias,
  fraseDaSemana,
  descidaDeHumor,
  conviteDeHoje,
} from '@/lib/diario/ecos'
import { EcoDoDia } from '@/components/diario/eco-do-dia'
import { LinhaDeVida } from '@/components/diario/linha-de-vida'
import { EMOCOES } from '@/lib/diario/types'
import { cn } from '@/lib/utils'
import { Calendar, FolderOpen, NotebookPen, Star, Target } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { TemplateThumbnail } from '../planner-template-thumbnail'

// Cliente pediu fonte mais retinha (ela achou a cursiva "feminina demais").
// Aproveitamos o token --font-geist (mesma sans do app) para mudar SÓ o
// family no Dashboard, mantendo pesos/tamanhos — sem reescrever estilo.
const FONT_SANS = 'var(--font-geist), system-ui, sans-serif'

/** Atraso escalonado para animação de entrada */
const stagger = (i: number) => ({ animationDelay: `${i * 70}ms` })
const enter =
  'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

/** Formata centavos (int) como moeda BRL compacta. */
const formatBRL = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** Momento do dia corrente, no idioma do diário. */
const momentoAgora = (): 'manha' | 'tarde' | 'anoitecer' | 'noite' | 'madrugada' => {
  const h = new Date().getHours()
  if (h >= 0 && h < 5) return 'madrugada'
  if (h >= 5 && h < 12) return 'manha'
  if (h >= 12 && h < 17) return 'tarde'
  if (h >= 17 && h < 20) return 'anoitecer'
  return 'noite'
}

export function DashboardPage() {
  const planners = useAppStore((s) => s.planners)
  const gradCovers = useSettingsStore((s) => s.gradients.covers)
  const gradCharts = useSettingsStore((s) => s.gradients.charts)
  const favorites = planners.filter((p) => p.favorite)
  const recents = [...planners].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  // ─── Ecos do Diário ──────────────────────────────────────────────────
  // O dashboard lê o caderno: data por extenso, humor dominante,
  // energia da semana. Tudo derivado dos registros; nada inventado.
  const registros = useDiarioStore((s) => s.registros)
  const convite = useMemo(
    () => conviteDeHoje(registros, () => promptDoDia().texto),
    [registros],
  )
  const ecoHoje = useMemo(() => ecoDoDia(registros, isoDia()), [registros])
  const verticeSemana = useMemo(() => linhaSeteDias(registros), [registros])
  const fraseSemana = useMemo(() => fraseDaSemana(registros), [registros])
  const humorDescendo = useMemo(() => descidaDeHumor(registros), [registros])
  // `sequencia`, `episodios` e `emocoesFrequentes` são seletores derivados
  // que devolvem nova referência a cada chamada (vetor/objeto fresco).
  // Via `useDiarioStore((s) => s.metodo())` o `useSyncExternalStore` acredita
  // que o snapshot mudou a cada render → loop infinito.
  // Solução: puxar os métodos uma vez do store, e memoizar os resultados
  // com `registros` como dependência (registros é referência estável).
  const sequencia = useDiarioStore((s) => s.sequencia)
  const episodios = useDiarioStore((s) => s.episodios)
  const emocoesFrequentes = useDiarioStore((s) => s.emocoesFrequentes)
  const seq = useMemo(() => sequencia(), [sequencia, registros])
  const ep = useMemo(() => episodios(), [episodios, registros])
  const humorDominante = useMemo(() => emocoesFrequentes(3), [emocoesFrequentes, registros])

  // ─── Dados das outras superfícies (mantidos) ───────────────────────
  const totalPlanners = planners.length
  const totalPages = planners.reduce((n, p) => n + (p.pages?.length ?? 0), 0)

  const todayISO = isoDia()
  const agenda = useCalendarStore((s) => s.events)
    .filter((e) => e.date === todayISO)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const goals = useFinanceStore((s) => s.goals)

  // Mini calendar
  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const year = now.getFullYear()
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const firstDay = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7
  const today = now.getDate()

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ─── Abertura — sem "Bom dia, {nome}", sem gradiente ───
          O que abre o dashboard é a data de hoje desenhada à mão,
          no mesmo idioma do caderno. Nada de hero SaaS. */}
      <header
        className={cn('mb-8 flex flex-col gap-3', enter)}
        aria-label="Abertura do dia"
      >
        <h1
          className="font-sans text-foreground text-balance leading-none"
          style={{ fontFamily: FONT_SANS, fontSize: '2.05rem', fontWeight: 500 }}
        >
          {now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h1>

        {/* Frase da semana — uma só linha, como uma rubrica.
            Quando não houver o que dizer, dizemos nada. */}
        {fraseSemana && (
          <p
            className="font-sans text-muted-foreground/75 -mt-1 text-pretty"
            style={{ fontFamily: FONT_SANS, fontSize: '1.15rem', lineHeight: 1.2, fontWeight: 400 }}
          >
            {fraseSemana}
          </p>
        )}

        {/* Linha de vida — a assinatura dos Ecos no dashboard.
            Não é "gráfico de atividade"; é um gesto de 7 dias. */}
        <div className="mt-2">
          <LinhaDeVida
            vertices={verticeSemana}
            largura={320}
            altura={56}
          />
        </div>
      </header>

      {/* ─── Eco + Sinais ───
          Em vez de "Planners/Páginas/Favoritos" com ícones lucide coloridos,
          a primeira fila do dashboard é o Eco do Diário sentado ao lado
          de três sinais discretos: sequência, episódios, humor mais ouvido.
          Mesma linguagem do caderno — nada de cards SaaS. */}
      <section
        className={cn(
          'grid gap-x-10 gap-y-8 border-t border-border/40 py-7 mb-10',
          'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem]',
        )}
        style={{ animation: 'eco-fade 700ms ease-out both' }}
      >
        <EcoDoDia
          eco={ecoHoje}
          promptHoje={convite.preciso ? convite.prompt : ''}
          momentoAgora={momentoAgora()}
          className="pt-0.5"
        />

        <aside className="flex flex-col justify-start gap-6 lg:border-l lg:border-border/40 lg:pl-6">
          <Sinal rotulo="sequência" valor={seq} suffix={seq === 1 ? 'dia seguido' : 'dias seguidos'} />
          <Sinal rotulo="guardado" valor={ep} suffix={ep === 1 ? 'registro' : 'registros'} />
          {humorDominante.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground/45">
                mais ouvidas dentro de você
              </span>
              <ul className="flex flex-col gap-1.5">
                {humorDominante.map(({ emocao, n }) => (
                  <li key={emocao} className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 translate-y-px rounded-[1px]"
                      style={{ backgroundColor: EMOCOES[emocao].cor }}
                    />
                    <span
                      className="italic"
                      style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}
                    >
                      {EMOCOES[emocao].rotulo}
                    </span>
                    <span className="text-[0.7rem] text-muted-foreground/55 tabular-nums">
                      {n}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Aviso discreto de descida de humor — não é um alerta SaaS,
              é uma nota de quem lê o caderno e percebe. */}
          {humorDescendo && ep >= 4 && (
            <p
              className="border-l-2 border-amber-500/60 pl-3 font-sans text-amber-700/80 dark:text-amber-300/80 text-pretty"
              style={{ fontFamily: FONT_SANS, fontSize: '1rem', lineHeight: 1.25 }}
            >
              a semana tem pesado mais que a anterior — sem pressa de levantar.
            </p>
          )}
        </aside>
      </section>

      {/* ─── Stats row — três cards no estilo de "Planners recentes" ───
          Mesmo vidro (glass), mesmo canto arredondado, mesma sombra suave,
          ícone em bolinha translúcida — alinhado com os Cards da coluna
          lateral. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Planners', value: totalPlanners, icon: FolderOpen, color: '#e05b6d' },
          { label: 'Páginas', value: totalPages, icon: NotebookPen, color: '#5b8dbf' },
          { label: 'Favoritos', value: favorites.length, icon: Star, color: '#f0b429' },
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
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 pt-3">
              {recents.slice(0, 6).map((planner) => {
                const firstPage = planner.pages?.[0]
                return (
                  <Link
                    key={planner.id}
                    href={`/planner/${planner.id}`}
                    className="group flex flex-col rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-lift hover:border-transparent hover:-translate-y-1"
                  >
                    <div className="relative bg-[color:light-dark(#f4f2ed,#1b1b19)] px-2 pt-2 overflow-hidden">
                      <div className="relative overflow-hidden rounded-[4px] ring-1 ring-black/[0.07] dark:ring-white/10 shadow-sm bg-[color:light-dark(#ffffff,#2a2a28)]">
                        {firstPage?.template && (
                          <TemplateThumbnail
                            template={firstPage.template}
                            className="block w-full"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <p className="text-sm font-semibold truncate">{planner.name}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        {planner.pages?.length ?? 0} pág.
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Favorites */}
          {favorites.length > 0 && (
            <Card glass className={enter} style={stagger(6)}>
              <CardHeader className="flex-row items-center justify-between pb-0">
                <CardTitle className="text-base flex items-center gap-2">
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
                {agenda.length} eventos
              </span>
            </CardHeader>
            <div className="px-5 py-3">
              {agenda.length > 0 ? (
                <div className="relative space-y-1">
                  {/* trilha da timeline */}
                  <div className="absolute left-[59px] top-3 bottom-3 w-px bg-border/70" />
                  {agenda.map((event) => (
                    <div
                      key={event.id}
                      className="relative flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex flex-col items-end shrink-0 w-10">
                        <span className="text-xs font-semibold tabular-nums">{event.startTime}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {event.allDay ? 'dia todo' : event.endTime}
                        </span>
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
              {goals.length > 0 ? (
                goals.map((goal) => {
                  const pct =
                    goal.targetAmount > 0
                      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                      : 0
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">{goal.title}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          <span className="font-semibold text-foreground">
                            {formatBRL(goal.currentAmount)}
                          </span>
                          /{formatBRL(goal.targetAmount)}
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
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum objetivo cadastrado.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Sinais — micro-componentes tipográficos, no idioma do Diário ──────────

/** Um sinal: rótulo discreto em caixa-alta + valor manuscrito + unidade. */
function Sinal({
  rotulo,
  valor,
  suffix,
}: {
  rotulo: string
  valor: number
  suffix: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground/45">
        {rotulo}
      </span>
      <div className="flex items-baseline gap-2">
        <span
          className="font-sans text-foreground leading-none"
          style={{ fontFamily: FONT_SANS, fontSize: '1.9rem', fontWeight: 600 }}
        >
          {valor}
        </span>
        <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
          {suffix}
        </span>
      </div>
    </div>
  )
}

