import Image from 'next/image'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { formatBRL, PLAN_ORDER, PLANS } from '@/lib/subscriptions/plan'

const QUESTIONS = [
  {
    question: 'Meus dados são privados?',
    answer:
      'Sim. Seus dados são privados. Cada usuário tem um espaço individual e somente ele consegue acessar o conteúdo registrado. Nossa equipe não tem acesso às suas informações, e nenhum dado é compartilhado com terceiros. O que você guarda no app fica restrito a você.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'No plano mensal, você pode cancelar a qualquer momento. No plano anual, a devolução é aceita somente dentro de 7 dias da compra.',
  },
  {
    question: 'Posso mudar de plano?',
    answer:
      'Sim. Comece no mensal e, se gostar da experiência, mude para o anual.',
  },
  {
    question: 'O app tem atualizações?',
    answer:
      'Sim. A TRIA está crescendo, e novas funcionalidades chegarão.',
  },
  {
    question: 'Posso sugerir alguma alteração?',
    answer:
      'Sim, queremos ouvir você. Toda sugestão passa por uma análise e, quando atende a uma necessidade comum, é incluída nas próximas atualizações.',
  },
]

function PlanCalendarMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className="h-12 w-12 shrink-0"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="9" width="27" height="31" rx="2" />
      <path d="M14 6v7M27 6v7M7 17h27M13 23h5M13 29h5M13 35h5" />
      <circle cx="35" cy="33" r="9" fill="var(--landing-plan-bg)" />
      <path d="m31 33 3 3 5-6" />
    </svg>
  )
}

export function LandingPage() {
  return (
    <main
      className="landing-page min-h-dvh overflow-hidden antialiased"
      style={{ fontFamily: 'var(--font-plex), sans-serif' }}
    >
      <header className="relative mx-auto flex w-full max-w-6xl justify-center px-4 pt-16 sm:pt-8">
        <div className="absolute right-4 top-4 flex items-center gap-1.5 sm:top-8">
          <Link
            href="/auth/login"
            className="landing-login-link inline-flex min-h-9 items-center justify-center rounded-sm border px-2.5 text-[10px] font-semibold tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
          >
            ENTRAR
          </Link>
          <a
            href="https://wa.me/5571996621923"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Entrar em contato com a TRIA pelo WhatsApp"
            className="landing-login-link inline-flex min-h-9 items-center justify-center rounded-sm border px-2.5 text-[10px] font-semibold tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
          >
            WHATSAPP
          </a>
        </div>
        <Link
          href="/"
          aria-label="TRIA Papelaria — página inicial"
          className="flex flex-col items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
        >
          <span className="landing-accent text-[9px] mb-3 font-semibold uppercase tracking-[0.52em]">
            PAPELARIA
          </span>
          <BrandLogo
            alt="TRIA"
            className="landing-logo -mt-1 h-14 w-40 sm:h-16 sm:w-44"
            imageClassName="brightness-[.48] saturate-[.6]"
          />
        </Link>
      </header>

      <section
        aria-labelledby="landing-title"
        className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-7 pt-5 text-center sm:px-6 sm:pt-8"
      >
        <h1
          id="landing-title"
          className="landing-heading max-w-5xl font-light tracking-tight"
          style={{
            fontFamily: 'var(--font-instrument), Georgia, serif',
            fontSize: 'clamp(2.35rem, 5.8vw, 5rem)',
            lineHeight: 0.98,
          }}
        >
          E se você pudesse parar de pular entre apps o dia inteiro?
        </h1>

        <p className="landing-intro mt-6 max-w-3xl border px-5 py-4 text-sm leading-relaxed sm:mt-8 sm:px-9 sm:py-5 sm:text-base">
          O app TRIA reúne sua rotina em um lugar só: tarefas, agenda, notas,
          listas, finanças, aniversários... tudo do jeito que você sempre quis.
          <br />
          <strong className="mt-1 inline-block font-semibold underline decoration-[var(--landing-accent)] decoration-1 underline-offset-2">
            Simples, rápido e tudo organizado.
          </strong>
        </p>

        <figure className="my-5 w-full max-w-[850px] sm:my-8">
          <Image
            src="/landing/tria-phone-paper-collage.png"
            alt="Tela inicial da TRIA em um celular, ao lado de caderno e recortes de papel em tons de creme, rosé e ocre"
            width={1312}
            height={1199}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 92vw, 850px"
            className="h-auto w-full"
          />
        </figure>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <p className="landing-benefit flex min-h-24 items-center justify-center px-5 py-5 text-sm leading-snug sm:min-h-28 sm:px-6">
            Telas desenhadas para simplificar sua rotina.
          </p>
          <p className="landing-benefit flex min-h-24 items-center justify-center px-5 py-5 text-sm leading-snug sm:min-h-28 sm:px-6">
            Sua vida inteira, reunida e organizada em um só ambiente.
          </p>
          <Link
            href="/auth/cadastro"
            className="landing-benefit landing-benefit-link flex min-h-24 flex-col items-center justify-center gap-1 px-5 py-5 text-sm leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] sm:min-h-28 sm:px-6"
          >
            <span>Comece hoje! A vida organizada começa com um passo.</span>
            <span className="landing-accent mt-1 text-[10px] font-semibold tracking-[0.16em]">
              CRIAR CONTA
            </span>
          </Link>
        </div>
      </section>

      <section className="px-4 py-7 sm:px-6 sm:py-10">
        <p className="landing-highlight mx-auto max-w-5xl px-4 py-4 text-center text-base font-semibold leading-snug sm:px-8 sm:py-5 sm:text-xl">
          O app TRIA cabe na sua rotina, onde você estiver.
        </p>
        <div className="mx-auto max-w-4xl px-2 pb-3 pt-9 text-center sm:pt-12">
          <p className="landing-muted text-sm sm:text-base">
            O app TRIA foi feito para acompanhar você:
          </p>
          <p
            className="landing-heading mt-1 text-3xl italic sm:text-4xl"
            style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}
          >
            no trabalho, em casa ou na rua.
          </p>
          <p className="landing-muted mx-auto mt-2 max-w-3xl text-sm leading-relaxed sm:text-base sm:leading-8">
            Suas tarefas, compromissos e planos ficam sincronizados em um só
            lugar, acessíveis de qualquer dispositivo, não importa onde o dia te
            levar.
          </p>
        </div>
      </section>

      <section
        id="planos"
        aria-labelledby="plans-title"
        className="mx-auto max-w-5xl scroll-mt-8 px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="landing-plan-banner flex items-center gap-4 border px-4 py-5 sm:gap-6 sm:px-8 sm:py-7">
          <PlanCalendarMark />
          <div>
            <h2
              id="plans-title"
              className="landing-heading text-2xl leading-tight sm:text-3xl"
              style={{ fontFamily: 'var(--font-instrument), Georgia, serif' }}
            >
              Escolha o plano que combina com você.
            </h2>
            <p className="landing-muted">
              Sem fidelidade e com 30 dias grátis. Comece mensal, evolua quando quiser e cancele sem burocracia
            </p>
          </div>
        </div>
      </section>

      <section
        id="perguntas"
        aria-labelledby="faq-title"
        className="mx-auto max-w-5xl scroll-mt-8 px-4 py-9 sm:px-6 sm:py-14"
      >
        <h2
          id="faq-title"
          className="landing-accent mb-7 text-center text-4xl font-normal sm:mb-9 sm:text-6xl"
          style={{
            fontFamily: 'var(--font-instrument), Georgia, serif',
            textDecoration: 'underline',
            textDecorationThickness: '1px',
            textUnderlineOffset: '0.13em',
          }}
        >
          Perguntas frequentes
        </h2>

        <div className="space-y-2.5 sm:space-y-3">
          {QUESTIONS.map(({ question, answer }) => (
            <article
              key={question}
              className="landing-faq-card px-5 py-5 text-center sm:px-10 sm:py-6"
            >
              <h3 className="landing-heading text-sm font-semibold sm:text-base">
                {question}
              </h3>
              <p className="landing-muted mx-auto mt-3 max-w-3xl text-xs leading-relaxed sm:text-sm sm:leading-6">
                {answer}
              </p>
            </article>
          ))}

          <article className="landing-faq-card px-5 py-5 text-center sm:px-10 sm:py-6">
            <h3 className="landing-heading text-sm font-semibold sm:text-base">
              Como colocar o app TRIA na tela inicial do celular?
            </h3>
            <p className="landing-muted mx-auto mt-3 max-w-3xl text-xs leading-relaxed sm:text-sm sm:leading-6">
              Crie um atalho na tela inicial para abrir a TRIA com rapidez sempre
              que precisar.
            </p>
            <div className="landing-muted mx-auto mt-5 grid max-w-3xl gap-5 text-left text-xs leading-relaxed sm:grid-cols-2 sm:text-sm">
              <div>
                <h4 className="landing-heading mb-2 text-center font-semibold sm:text-left">
                  Para celulares Android
                </h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Abra a TRIA no navegador Google Chrome.</li>
                  <li>
                    Abra o menu dos três pontinhos e escolha “Adicionar à tela
                    inicial” ou “Instalar aplicativo”.
                  </li>
                  <li>Confirme para concluir.</li>
                </ol>
              </div>
              <div>
                <h4 className="landing-heading mb-2 text-center font-semibold sm:text-left">
                  Para iPhone
                </h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Abra a TRIA no navegador Safari.</li>
                  <li>
                    Toque em Compartilhar e escolha “Adicionar à Tela de
                    Início”.
                  </li>
                  <li>Finalize tocando em “Adicionar”.</li>
                </ol>
              </div>
            </div>
            <p className="landing-muted mx-auto mt-5 max-w-3xl text-xs leading-relaxed sm:text-sm">
              Pronto: o atalho fica disponível na tela inicial e você não precisa
              procurar o endereço no navegador a cada acesso.
            </p>
          </article>
        </div>
      </section>

      <footer className="flex flex-col items-center px-4 pb-8 pt-7 text-center sm:pb-10 sm:pt-10">
        <Link
          href="/"
          aria-label="Voltar ao início da TRIA"
          className="flex flex-col items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)]"
        >
          <span className="landing-accent mb-3 text-[8px] font-semibold uppercase tracking-[0.48em]">
            PAPELARIA
          </span>
          <BrandLogo
            alt="TRIA"
            className="landing-logo -mt-1 h-15 w-36"
            imageClassName="brightness-[.48] saturate-[.6]"
          />
        </Link>
        <Link
          href="/auth/login"
          className="landing-link mt-3 text-xs font-medium underline underline-offset-4"
        >
          Já usa a TRIA? Entre na sua conta.
        </Link>
        <span className="landing-muted mt-6 text-[10px]">
          © {new Date().getFullYear()} TRIA Papelaria
        </span>
      </footer>
    </main>
  )
}
