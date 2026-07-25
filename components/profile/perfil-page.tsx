'use client'

import { useMemo } from 'react'
import {
  useProfileStore,
  AVATAR_OPTIONS,
  ACCENT_OPTIONS,
  ESTACOES,
  type Estacao,
} from '@/lib/store/use-profile-store'
import { useAppStore } from '@/lib/store/use-app-store'
import { useDiarioStore } from '@/lib/diario/use-diario-store'
import { useHabitsStore } from '@/lib/store/use-habits-store'
import { useFinanceStore } from '@/lib/store/use-finance-store'
import { cn } from '@/lib/utils'
import { toast } from '../ui/toaster'
import { Separator } from '../ui/primitives'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'
const FONT_MONO = 'var(--font-geist), system-ui, sans-serif'

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'
const stagger = (i: number, base = 80) => ({ animationDelay: `${i * base}ms` })

function diasVividosNoPlanner(): number {
  return Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86_400_000)
}

export function PerfilPage() {
  const profile = useProfileStore()
  const planners = useAppStore((s) => s.planners)
  const diarioRegistros = useDiarioStore((s) => s.registros)
  const diarioSequencia = useDiarioStore((s) => s.sequencia())
  const habitsCount = useHabitsStore((s) => s.habits.length)
  const goalsCount = useFinanceStore((s) => s.goals.length)

  const totalPages = useMemo(
    () => planners.reduce((n, p) => n + (p.pages?.length ?? 0), 0),
    [planners],
  )

  const hour = new Date().getHours()
  const saudacaoHora =
    hour >= 0 && hour < 5
      ? 'ainda acordada'
      : hour < 12
        ? 'despertar'
        : hour < 17
          ? 'a tarde boa'
          : hour < 20
            ? 'entre dois dias'
            : 'recolher'

  return (
    <div className="min-h-full pb-24 pt-6 sm:pt-8">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
        {/* Topete — nome da página, sem ícone genérico */}
        <div className={cn('mb-10', enter)}>
          <h1
            className="text-[0.72rem] uppercase tracking-[0.32em] text-muted-foreground/55"
            style={{ fontFamily: FONT_MONO }}
          >
            identidade · 一些
          </h1>
          <p
            className="mt-2 text-balance"
            style={{ fontFamily: FONT_HAND, fontSize: '2.1rem', lineHeight: 1.05 }}
          >
            como você aparece, dentro do caderno.
          </p>
        </div>

        {/* Grid principal — coluna fixa (3) + conteúdo (9) */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
          {/* ── Esquerdinha: cartão de identidade ─────────────────────── */}
          <aside
            className={cn('lg:col-span-4 lg:sticky lg:top-6 self-start', enter)}
            style={stagger(1)}
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
              {/* assinatura de cor — não é "faixa brilhante", é lombada */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: profile.accent }}
              />

              {/* avatar — grande, prancha */}
              <div className="flex items-center gap-4 pl-1">
                <div
                  className="flex size-16 items-center justify-center rounded-2xl bg-muted text-3xl shadow-inner"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  {profile.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-balance"
                    style={{ fontFamily: FONT_SERIF, fontSize: '1.5rem', lineHeight: 1.1 }}
                  >
                    {profile.name || 'sem nome ainda'}
                  </p>
                  <p
                    className="mt-1 truncate text-[0.72rem] text-muted-foreground/70"
                    style={{ fontFamily: FONT_MONO }}
                  >
                    {profile.email || '— · sem e-mail'}
                  </p>
                </div>
              </div>

              {/* bio — manuscrita, com edição inline */}
              <textarea
                value={profile.bio}
                onChange={(e) => profile.setBio(e.target.value)}
                placeholder="diga algo sobre você — uma linha basta."
                rows={3}
                className="mt-5 w-full resize-none bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/35"
                style={{ fontFamily: FONT_HAND, fontSize: '1.2rem', lineHeight: 1.25 }}
              />

              <Separator className="my-5" />

              {/* Acento — selo pessoal, não é "gradient" */}
              <span
                className="text-[0.6rem] uppercase tracking-[0.26em] text-muted-foreground/45"
                style={{ fontFamily: FONT_MONO }}
              >
                cor que acompanha a página
              </span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ACCENT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => profile.setAccent(c)}
                    aria-label={`Acento ${c}`}
                    className={cn(
                      'size-6 rounded-full transition-transform duration-200',
                      profile.accent === c
                        ? 'scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-card'
                        : 'hover:scale-110',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* ── Direita: conteúdo vivo ─────────────────────────────── */}
          <div className="space-y-12 lg:col-span-8">
            {/* Capítulo 1 — estações do dia */}
            <section className={enter} style={stagger(2)}>
              <Cabecalho rotulo="I" titulo="sua estação favorita" />
              <p
                className="-mt-1 mb-4 max-w-md text-balance"
                style={{ fontFamily: FONT_SERIF, fontSize: '1.02rem', lineHeight: 1.55 }}
              >
                O caderno pode aparecer diferente quando o dia muda. Escolha em qual vez do dia você
                mais é você.
              </p>
              <Estacoes
                valor={profile.estacao}
                onChange={(e) => profile.setEstacao(e)}
                accent={profile.accent}
              />
            </section>

            {/* Capítulo 2 — sinais do caminho (estatística honesta) */}
            <section className={enter} style={stagger(3)}>
              <Cabecalho rotulo="II" titulo="o que ficou no papel" />
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
                <Sinal rotulo="planners">
                  <span className="inline-block" style={{ fontFamily: FONT_HAND, fontSize: '2.4rem', lineHeight: 1 }}>
                    {planners.length}
                  </span>
                </Sinal>
                <Sinal rotulo="páginas desenhadas">
                  <span className="inline-block" style={{ fontFamily: FONT_HAND, fontSize: '2.4rem', lineHeight: 1 }}>
                    {totalPages}
                  </span>
                </Sinal>
                <Sinal rotulo="registo no diário">
                  <span className="inline-block" style={{ fontFamily: FONT_HAND, fontSize: '2.4rem', lineHeight: 1 }}>
                    {diarioRegistros.length}
                  </span>
                </Sinal>
                <Sinal rotulo="sequência atual">
                  <span className="inline-block" style={{ fontFamily: FONT_HAND, fontSize: '2.4rem', lineHeight: 1 }}>
                    {diarioSequencia}
                    <span
                      className="ml-1 align-baseline text-[0.65rem] text-muted-foreground/55"
                      style={{ fontFamily: FONT_MONO }}
                    >
                      d
                    </span>
                  </span>
                </Sinal>
              </div>
              <p
                className="mt-6 text-balance text-muted-foreground"
                style={{ fontFamily: FONT_SERIF, fontSize: '0.95rem', lineHeight: 1.55 }}
              >
                {(planners.length === 0 && diarioRegistros.length === 0)
                  ? 'ainda em branco — qualquer página que você criar aparece aqui como prova de que houve intenção.'
                  : 'nada aqui é média ou projeção. São contas fiéis do que você já pôs no caderno.'}
              </p>
            </section>

            {/* Capítulo 3 — avatar e nome, edição cuidada */}
            <section className="enter" style={stagger(4)}>
              <Cabecalho rotulo="III" titulo="como você assina" />

              {/* Linha de nome */}
              <label
                className="mt-4 block text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground/45"
                style={{ fontFamily: FONT_MONO }}
              >
                nome
              </label>
              <input
                value={profile.name}
                onChange={(e) => profile.setName(e.target.value)}
                placeholder="seu nome"
                className="mt-1 w-full bg-transparent pb-2 outline-none"
                style={{ fontFamily: FONT_SERIF, fontSize: '2rem', lineHeight: 1.1, borderBottom: '1px solid var(--border)' }}
              />

              {/* Linha de email */}
              <label
                className="mt-6 block text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground/45"
                style={{ fontFamily: FONT_MONO }}
              >
                e-mail
              </label>
              <input
                value={profile.email}
                onChange={(e) => profile.setEmail(e.target.value)}
                placeholder="voce@caderno.com"
                type="email"
                className="mt-1 w-full bg-transparent pb-2 outline-none"
                style={{ fontFamily: FONT_MONO, fontSize: '1rem', borderBottom: '1px solid var(--border)' }}
              />

              {/* Avatares — prancha, não card */}
              <label
                className="mt-7 block text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground/45"
                style={{ fontFamily: FONT_MONO }}
              >
                bichos — uma assinatura rápida
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => profile.setAvatar(a)}
                    className={cn(
                      'flex size-12 items-center justify-center rounded-2xl text-xl transition-all duration-200',
                      profile.avatar === a
                        ? 'bg-foreground text-background scale-105'
                        : 'bg-muted/60 hover:bg-muted hover:scale-105',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>

            {/* Capítulo 4 — pra onde ir a seguir */}
            <section className="enter" style={stagger(5)}>
              <Cabecalho rotulo="IV" titulo="o resto do caderno" />
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                <ItemHabitos count={habitsCount} />
                <ItemMetas count={goalsCount} />
                <ItemPlanners count={planners.length} />
              </ul>
            </section>
          </div>
        </div>

        {/* Rodapé discreto — não é CTA brilhante */}
        <footer
          className={cn('mt-16 flex items-end justify-between gap-4 border-t border-border/40 pt-4', enter)}
          style={stagger(6)}
        >
          <p
            className="text-balance"
            style={{ fontFamily: FONT_HAND, fontSize: '1.25rem', lineHeight: 1.15 }}
          >
            {saudacaoHora}.
          </p>
          <button
            type="button"
            onClick={() => toast({ title: 'Tudo guardado.', variant: 'success' })}
            className="shrink-0 rounded-full border border-foreground/30 px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
            style={{ fontFamily: FONT_MONO }}
          >
            guardar
          </button>
        </footer>
      </div>
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Cabecalho({ rotulo, titulo }: { rotulo: string; titulo: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span
        aria-hidden
        className="text-[0.65rem] tabular-nums text-muted-foreground/40"
        style={{ fontFamily: FONT_MONO }}
      >
        {rotulo}
      </span>
      <span
        className="text-balance"
        style={{ fontFamily: FONT_SERIF, fontSize: '1.85rem', lineHeight: 1.1 }}
      >
        {titulo}
      </span>
    </div>
  )
}

function Sinal({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/45"
        style={{ fontFamily: FONT_MONO }}
      >
        {rotulo}
      </span>
      <div className="flex items-baseline">{children}</div>
    </div>
  )
}

function Estacoes({
  valor,
  onChange,
  accent,
}: {
  valor: Estacao
  onChange: (e: Estacao) => void
  accent: string
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {ESTACOES.map((est) => {
        const ativo = valor === est.id
        return (
          <button
            key={est.id}
            onClick={() => onChange(est.id)}
            className={cn(
              'group relative flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all duration-200',
              ativo
                ? 'border-foreground/50 bg-foreground/[0.03] shadow-sm'
                : 'border-border/40 hover:border-foreground/25 bg-transparent',
            )}
          >
            {/* barra de cor, vertical — não é chip ou glow */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-opacity"
              style={{
                backgroundColor: est.faixa,
                opacity: ativo ? 1 : 0.35,
              }}
            />
            <span
              className="mt-1 text-[0.78rem] capitalize"
              style={{ fontFamily: FONT_SERIF, color: ativo ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              {est.rotulo}
            </span>
            <span
              className="text-[0.62rem] tabular-nums text-muted-foreground/55"
              style={{ fontFamily: FONT_MONO }}
            >
              {est.janela}
            </span>
            {/* ponto central quando ativo */}
            {ativo && (
              <span
                aria-hidden
                className="absolute bottom-2 right-2 size-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

function ItemHabitos({ count }: { count: number }) {
  return (
    <li className="flex items-baseline gap-2 text-[0.9rem] text-muted-foreground/70">
      <span style={{ fontFamily: FONT_SERIF }}>
        hábitos no fio
      </span>
      <span className="text-[0.7rem] tabular-nums text-muted-foreground/45" style={{ fontFamily: FONT_MONO }}>
        ({count})
      </span>
    </li>
  )
}

function ItemMetas({ count }: { count: number }) {
  return (
    <li className="flex items-baseline gap-2 text-[0.9rem] text-muted-foreground/70">
      <span style={{ fontFamily: FONT_SERIF }}>
        metas em frente
      </span>
      <span className="text-[0.7rem] tabular-nums text-muted-foreground/45" style={{ fontFamily: FONT_MONO }}>
        ({count})
      </span>
    </li>
  )
}

function ItemPlanners({ count }: { count: number }) {
  return (
    <li className="flex items-baseline gap-2 text-[0.9rem] text-muted-foreground/70">
      <span style={{ fontFamily: FONT_SERIF }}>
        planners abertos
      </span>
      <span className="text-[0.7rem] tabular-nums text-muted-foreground/45" style={{ fontFamily: FONT_MONO }}>
        ({count})
      </span>
    </li>
  )
}
