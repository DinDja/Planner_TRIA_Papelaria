'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, PenLine } from 'lucide-react'
import { InfiniteBook } from './infinite-book'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/auth/theme-toggle'

/** Ícones próprios para a landing — não Lucide; cada um codifica a feature. */
function StickersGlyph({ size = 18, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  // Três adesivos sobrepostos ("cena de stickers") — não um Sparkles genérico.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      aria-hidden
    >
      <path d="M4 5 L11 5 L11 12 L4 12 Z" />
      <path d="M7 8 L14 8 L14 15 L7 15 Z" />
      <path d="M10 11 L17 11 L17 18 L10 18 Z" />
    </svg>
  )
}
function TemplatesGlyph({ size = 18, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  // Pilha de páginas (também o ícone de módulo templates, mantém coerência).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      aria-hidden
    >
      <path d="M6 6 L15 6 L15 16 L6 16 Z" />
      <path d="M7 4 L16 4 L16 14" />
      <path d="M8 2 L17 2 L17 12" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Plataforma', href: '#plataforma' },
  { label: 'Ferramentas', href: '#ferramentas' },
  { label: 'Templates', href: '#templates' },
  { label: 'Preços', href: '#precos' },
]

const HERO_STATS = [
  { value: '50K+', label: 'Planners' },
  { value: '99,9%', label: 'No navegador' },
  { value: '180+', label: 'Stickers' },
]

const FEATURE_CARDS = [
  {
    icon: PenLine,
    title: 'Escrita à mão natural',
    desc: 'Traços suaves com pressão, opacidade e espessura ajustáveis via perfect-freehand.',
  },
  {
    icon: StickersGlyph,
    title: 'Stickers & animações',
    desc: 'Biblioteca com 180+ stickers SVG e animações Lottie diretamente no canvas.',
  },
  {
    icon: TemplatesGlyph,
    title: '14 templates de página',
    desc: 'Em branco, pautado, grade, Cornell, diário, semanal, Kanban, finanças e mais.',
  },
]

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true)
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/** Deslocamento vertical do hero conforme o scroll (parallax sutil). */
function useHeroParallax() {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setOffset(Math.min(window.scrollY, window.innerHeight)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return offset
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useScrollReveal(0.12)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        filter: inView ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function RevealFeature({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  desc: string
  delay?: number
}) {
  const { ref, inView } = useScrollReveal(0.1)
  return (
    <div
      ref={ref}
      className="landing-card group relative rounded-2xl border overflow-hidden p-8 transition-all duration-700"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
      }}
    >
      <div className="landing-border w-10 h-10 rounded-xl border flex items-center justify-center mb-5">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-light mb-2">{title}</h3>
      <p className="landing-copy-muted text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

/** Miniaturas desenhadas em CSS puro — cada padrão representa o template de verdade. */
const TEMPLATE_PREVIEWS = [
  { name: 'Em branco', pattern: 'blank' },
  { name: 'Pautado', pattern: 'lined' },
  { name: 'Grade', pattern: 'grid' },
  { name: 'Pontos', pattern: 'dots' },
  { name: 'Cornell', pattern: 'cornell' },
  { name: 'Semanal', pattern: 'weekly' },
  { name: 'Kanban', pattern: 'kanban' },
  { name: 'Finanças', pattern: 'finance' },
] as const

const TEMPLATE_PATTERNS: Record<string, React.CSSProperties> = {
  blank: {},
  lined: {
    backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 11px, color-mix(in oklab, var(--landing-fg) 12%, transparent) 11px, color-mix(in oklab, var(--landing-fg) 12%, transparent) 12px)',
  },
  grid: {
    backgroundImage:
      'repeating-linear-gradient(to bottom, transparent 0, transparent 11px, color-mix(in oklab, var(--landing-fg) 10%, transparent) 11px, color-mix(in oklab, var(--landing-fg) 10%, transparent) 12px), repeating-linear-gradient(to right, transparent 0, transparent 11px, color-mix(in oklab, var(--landing-fg) 10%, transparent) 11px, color-mix(in oklab, var(--landing-fg) 10%, transparent) 12px)',
  },
  dots: {
    backgroundImage: 'radial-gradient(color-mix(in oklab, var(--landing-fg) 20%, transparent) 1px, transparent 1px)',
    backgroundSize: '12px 12px',
  },
  cornell: {
    backgroundImage:
      'linear-gradient(to right, transparent 0, transparent 30%, color-mix(in oklab, var(--landing-fg) 14%, transparent) 30%, color-mix(in oklab, var(--landing-fg) 14%, transparent) calc(30% + 1px), transparent calc(30% + 1px)), linear-gradient(to top, transparent 0, transparent 25%, color-mix(in oklab, var(--landing-fg) 14%, transparent) 25%, color-mix(in oklab, var(--landing-fg) 14%, transparent) calc(25% + 1px), transparent calc(25% + 1px)), repeating-linear-gradient(to bottom, transparent 0, transparent 11px, color-mix(in oklab, var(--landing-fg) 9%, transparent) 11px, color-mix(in oklab, var(--landing-fg) 9%, transparent) 12px)',
  },
  weekly: {
    backgroundImage:
      'repeating-linear-gradient(to right, transparent 0, transparent calc(25% - 1px), color-mix(in oklab, var(--landing-fg) 12%, transparent) calc(25% - 1px), color-mix(in oklab, var(--landing-fg) 12%, transparent) 25%)',
  },
  kanban: {
    backgroundImage:
      'repeating-linear-gradient(to right, transparent 0, transparent calc(33.33% - 1px), color-mix(in oklab, var(--landing-fg) 12%, transparent) calc(33.33% - 1px), color-mix(in oklab, var(--landing-fg) 12%, transparent) 33.33%)',
  },
  finance: {
    backgroundImage:
      'repeating-linear-gradient(to bottom, transparent 0, transparent 15px, color-mix(in oklab, var(--landing-fg) 12%, transparent) 15px, color-mix(in oklab, var(--landing-fg) 12%, transparent) 16px), linear-gradient(to right, transparent 0, transparent 60%, color-mix(in oklab, var(--landing-fg) 12%, transparent) 60%, color-mix(in oklab, var(--landing-fg) 12%, transparent) calc(60% + 1px), transparent calc(60% + 1px))',
  },
}

function TemplateCard({ name, pattern, delay = 0 }: { name: string; pattern: string; delay?: number }) {
  const { ref, inView } = useScrollReveal(0.1)
  return (
    <div
      ref={ref}
      className="landing-card group rounded-2xl border p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.15)]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, box-shadow 0.3s ease`,
      }}
    >
      <div
        className="landing-preview aspect-[3/4] rounded-lg border transition-transform duration-500 group-hover:scale-[1.02]"
        style={TEMPLATE_PATTERNS[pattern]}
      />
      <p className="landing-copy-muted mt-3 text-xs tracking-widest uppercase text-center">{name}</p>
    </div>
  )
}

const PLANS = [
  {
    name: 'Papel',
    price: 'Grátis',
    period: 'para sempre',
    cta: 'COMEÇAR GRÁTIS',
    highlight: false,
    features: ['Planners ilimitados', '14 templates de página', '180+ stickers', 'Salvo no navegador'],
  },
  {
    name: 'Papelaria',
    price: 'R$ 19',
    period: '/mês',
    cta: 'ASSINAR',
    highlight: true,
    features: ['Tudo do plano Papel', 'Sincronização entre dispositivos', 'Backup na nuvem', 'Novos stickers toda semana'],
  },
]

export function LandingPage() {
  const [heroReady, setHeroReady] = useState(false)
  const heroOffset = useHeroParallax()

  useEffect(() => {
    const t = setTimeout(() => {
      setHeroReady(true)
    }, 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="landing-page min-h-screen antialiased"
      style={{ fontFamily: 'var(--font-plex), sans-serif', scrollBehavior: 'smooth' }}
    >
      {/* ── STICKY NAV ─────────────────────────────────────────────────── */}
      <nav className="landing-nav fixed top-0 inset-x-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-14 w-36" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="landing-copy-subtle text-xs transition-colors tracking-widest"
              >
                {l.label.toUpperCase()}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="landing-theme-toggle" />
            <Link
              href="/auth/login"
              className="landing-action px-5 py-2 rounded-xl text-sm tracking-widest transition-colors"
            >
              ENTRAR
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative mt-20 h-[calc(100svh-5rem)] min-h-[780px] sm:min-h-[700px] lg:min-h-[640px] overflow-hidden">
        {/* Livro do produto — ao lado do título no desktop e acima dele no mobile. */}
        <div className="absolute z-20 top-0 right-[-18%] h-[42%] w-[92%] sm:right-[-8%] sm:h-[48%] sm:w-[70%] lg:top-auto lg:right-[-2%] lg:bottom-[8%] lg:h-[76%] lg:w-[54%] xl:right-[2%] xl:w-[52%]">
          <InfiniteBook ready={heroReady} />
          <span className="landing-copy-faint absolute bottom-3 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.24em] pointer-events-none sm:block">
            Arraste para girar
          </span>
        </div>

        {/* Título + métricas — ancorados no canto inferior esquerdo, com parallax invertido */}
        <div
          className="absolute inset-x-0 bottom-0 z-30 flex flex-col px-6 md:px-12 pb-12 max-w-3xl"
          style={{
            transform: `translateY(${heroOffset * -0.15}px)`,
            opacity: 1 - heroOffset / (typeof window !== 'undefined' ? window.innerHeight : 1000) * 1.2,
          }}
        >
          <h1
            className="landing-heading text-6xl sm:text-7xl md:text-8xl font-light leading-[1.0] tracking-tight mb-10"
            style={{
              fontFamily: 'var(--font-plex), sans-serif',
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? 'blur(0px)' : 'blur(24px)',
              transform: heroReady ? 'translateY(0px)' : 'translateY(32px)',
              transition:
                'opacity 1s cubic-bezier(0.16,1,0.3,1) 0ms, filter 1s cubic-bezier(0.16,1,0.3,1) 0ms, transform 1s cubic-bezier(0.16,1,0.3,1) 0ms',
            }}
          >
            Planeje &<br />
            escreva à mão<br />
            enquanto sua<br />
            vida flui.
          </h1>

          {/* 3 métricas — staggered após o título */}
          <div className="flex gap-8 sm:gap-12">
            {HERO_STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  opacity: heroReady ? 1 : 0,
                  filter: heroReady ? 'blur(0px)' : 'blur(16px)',
                  transform: heroReady ? 'translateY(0px)' : 'translateY(20px)',
                  transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, filter 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms`,
                }}
              >
                <div
                  className="landing-heading text-3xl sm:text-4xl font-light tracking-tight"
                  style={{ fontFamily: 'var(--font-plex), sans-serif' }}
                >
                  {stat.value}
                </div>
                <div
                  className="landing-copy-subtle text-xs tracking-widest uppercase mt-1"
                  style={{ fontFamily: 'var(--font-plex), sans-serif' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA — inicia o planner */}
          <div className="mt-10">
            <Link
              href="/auth/login"
              className="landing-action inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm tracking-widest transition-colors"
            >
              COMEÇAR AGORA
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────────────── */}
      <div className="landing-border overflow-hidden border-y py-4 select-none" aria-hidden>
        <div
          className="flex whitespace-nowrap gap-10 w-max"
          style={{ animation: 'landing-marquee 28s linear infinite' }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-10 items-center">
              {['Escrita à mão', 'Stickers', 'Templates', 'Finanças', 'Hábitos', 'Diário', 'Metas', 'Calendário', 'Listas', 'Memórias'].map((w) => (
                <span key={w} className="landing-copy-faint flex items-center gap-10 text-xs tracking-[0.3em] uppercase">
                  {w}
                  <span className="landing-dot w-1 h-1 rounded-full" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes landing-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* ── PLATAFORMA (bento resumido) ────────────────────────────────── */}
      <section id="plataforma" className="py-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-16">
            <span className="landing-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest">
              PLATAFORMA
            </span>
            <h2
              className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-plex), sans-serif' }}
            >
              Tudo que você precisa
              <br />
              para planejar.
            </h2>
          </Reveal>

          <div id="ferramentas" className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEATURE_CARDS.map((card, i) => (
              <RevealFeature
                key={card.title}
                icon={card.icon}
                title={card.title}
                desc={card.desc}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ──────────────────────────────────────────────────── */}
      <section id="templates" className="landing-border py-32 px-6 md:px-12 lg:px-20 border-t">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="landing-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest">
                TEMPLATES
              </span>
              <h2
                className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]"
                style={{ fontFamily: 'var(--font-plex), sans-serif' }}
              >
                Uma página para
                <br />
                cada momento.
              </h2>
            </div>
            <p className="landing-copy-muted text-sm max-w-xs leading-relaxed">
              14 formatos prontos — do Cornell ao Kanban — aplicados com um toque, sem sair do canvas.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATE_PREVIEWS.map((t, i) => (
              <TemplateCard key={t.name} {...t} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ─────────────────────────────────────────────────────── */}
      <section id="precos" className="landing-border py-32 px-6 md:px-12 lg:px-20 border-t">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-16 text-center">
            <span className="landing-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest">
              PREÇOS
            </span>
            <h2
              className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-plex), sans-serif' }}
            >
              Simples como papel.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <div
                  className={`relative rounded-2xl border p-8 h-full transition-all duration-500 hover:-translate-y-1 ${
                    p.highlight
                       ? 'landing-action-card border'
                       : 'landing-surface landing-border border'
                  }`}
                >
                  {p.highlight && (
                    <span className="landing-recommendation absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] tracking-widest">
                      RECOMENDADO
                    </span>
                  )}
                  <h3 className="text-lg font-light">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-light tracking-tight">{p.price}</span>
                    <span className={`text-xs ${p.highlight ? 'landing-on-action-muted' : 'landing-copy-subtle'}`}>{p.period}</span>
                  </div>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className={`text-sm flex items-start gap-2 ${p.highlight ? 'landing-on-action-muted' : 'landing-copy-muted'}`}
                      >
                        <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${p.highlight ? 'landing-on-action-dot' : 'landing-dot'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/login"
                    className={`mt-8 inline-flex items-center justify-center w-full py-3 rounded-xl text-sm tracking-widest transition-colors ${
                      p.highlight
                        ? 'landing-action-inverse'
                        : 'landing-action'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="landing-border py-32 px-6 md:px-12 lg:px-20 border-t">
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: 'var(--font-plex), sans-serif' }}
          >
            Comece seu planner
            <br />
            agora mesmo.
          </h2>
          <p className="landing-copy-muted text-sm leading-relaxed mb-10 max-w-md mx-auto">
            Entre com sua conta e seus planners sincronizam em qualquer dispositivo. Pronto em segundos.
          </p>
          <Link
            href="/auth/login"
            className="landing-action inline-flex items-center gap-2 px-10 py-4 rounded-xl text-sm tracking-widest transition-colors"
          >
            ENTRAR NA MINHA CONTA
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="landing-border py-10 px-6 md:px-12 lg:px-20 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <span
            className="landing-copy-muted text-xs tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-plex), sans-serif' }}
          >
            PLANNERHUB
          </span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="landing-copy-subtle text-xs transition-colors tracking-widest"
              >
                {l.label.toUpperCase()}
              </a>
            ))}
            <Link
              href="/auth/login"
              className="landing-copy-subtle text-xs transition-colors tracking-widest"
            >
              ENTRAR
            </Link>
          </div>
        </div>
        <div className="landing-border max-w-6xl mx-auto mt-8 pt-6 border-t">
          <span className="landing-copy-faint text-xs">© {new Date().getFullYear()} PlannerHub. Feito com 💛 para quem ama planejar.</span>
        </div>
      </footer>
    </div>
  )
}
