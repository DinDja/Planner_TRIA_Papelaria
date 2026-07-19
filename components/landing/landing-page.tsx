'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, PenLine, Sparkles } from 'lucide-react'

const HERO_VIDEO =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/agentic-hero-9yW3wnTNMfn2U6lsVhTTZSJFEvAoSj.mp4'

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
    icon: Sparkles,
    title: 'Stickers & animações',
    desc: 'Biblioteca com 180+ stickers SVG e animações Lottie diretamente no canvas.',
  },
  {
    icon: ArrowRight,
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

function RevealFeature({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: typeof PenLine
  title: string
  desc: string
  delay?: number
}) {
  const { ref, inView } = useScrollReveal(0.1)
  return (
    <div
      ref={ref}
      className="group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden p-8 transition-all duration-700 hover:border-black/[0.15] hover:bg-[#fafaf8]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
      }}
    >
      <div className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center mb-5">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-light mb-2">{title}</h3>
      <p className="text-sm text-black/45 leading-relaxed">{desc}</p>
    </div>
  )
}

export function LandingPage() {
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setHeroReady(true)
      setVideoReady(true)
    }, 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen antialiased" style={{ fontFamily: 'var(--font-plex), sans-serif' }}>
      {/* ── STICKY NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#F5F4F0]/70 border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="PlannerHub" className="h-14 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-black/40 hover:text-black/70 transition-colors tracking-widest"
              >
                {l.label.toUpperCase()}
              </a>
            ))}
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2 rounded-xl bg-[#111] text-white text-sm tracking-widest hover:bg-[#333] transition-colors"
          >
            ABRIR
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden">
        {/* Vídeo de fundo — zoom in quando o hero revela */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={HERO_VIDEO}
          style={{
            transform: videoReady ? 'scale(1.05)' : 'scale(0.85)',
            transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Gradient + progressive blur subindo do rodapé */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: '65%',
            background:
              'linear-gradient(to top, #F5F4F0 0%, #F5F4F0 18%, rgba(245,244,240,0.85) 35%, rgba(245,244,240,0.5) 55%, rgba(245,244,240,0.15) 75%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: '20%',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: '38%',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: '55%',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        />

        {/* Spacer para não ficar embaixo do nav */}
        <div className="h-20" />

        {/* Título + métricas — ancorados no canto inferior esquerdo */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col px-6 md:px-12 pb-12 max-w-3xl">
          <h1
            className="text-6xl sm:text-7xl md:text-8xl font-light text-[#111] leading-[1.0] tracking-tight mb-10"
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
                  className="text-3xl sm:text-4xl text-[#111] font-light tracking-tight"
                  style={{ fontFamily: 'var(--font-plex), sans-serif' }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs text-black/40 tracking-widest uppercase mt-1"
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
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#111] text-white text-sm tracking-widest hover:bg-[#333] transition-colors"
            >
              COMEÇAR AGORA
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATAFORMA (bento resumido) ────────────────────────────────── */}
      <section id="plataforma" className="py-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest text-black/40 bg-black/[0.04]">
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
          </div>

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

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: 'var(--font-plex), sans-serif' }}
          >
            Comece seu planner
            <br />
            agora mesmo.
          </h2>
          <p className="text-sm text-black/45 leading-relaxed mb-10 max-w-md mx-auto">
            Sem cadastro, sem backend. Seus planners ficam salvos no seu navegador. Pronto em segundos.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-[#111] text-white text-sm tracking-widest hover:bg-[#333] transition-colors"
          >
            ABRIR EDITOR
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <span
            className="text-xs tracking-[0.25em] text-black/50"
            style={{ fontFamily: 'var(--font-plex), sans-serif' }}
          >
            PLANNERHUB
          </span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-black/35 hover:text-black/70 transition-colors tracking-widest"
              >
                {l.label.toUpperCase()}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="text-xs text-black/35 hover:text-black/70 transition-colors tracking-widest"
            >
              EDITOR
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/[0.04]">
          <span className="text-xs text-black/20">© {new Date().getFullYear()} PlannerHub. Feito com 💛 para quem ama planejar.</span>
        </div>
      </footer>
    </div>
  )
}
