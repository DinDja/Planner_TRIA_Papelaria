'use client'

import { useEffect, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import type { Stroke, StrokePoint } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  EMOCOES,
  PROMPTS,
  type Energia,
  type Emocao,
  type Momento,
  type Periodo,
  type Registro,
  type RetroResumo,
} from '@/lib/diario/types'
import {
  isoDia,
  promptDoDia,
  useDiarioStore,
  type EntradaCriar,
} from '@/lib/diario/use-diario-store'

/** Momento do dia atual, derivado da hora local. Espelha o helper da store. */
function momentoAgora(): Momento {
  const h = new Date().getHours()
  if (h >= 0 && h < 5) return 'madrugada'
  if (h >= 5 && h < 12) return 'manha'
  if (h >= 12 && h < 17) return 'tarde'
  if (h >= 17 && h < 20) return 'anoitecer'
  return 'noite'
}
import { Dialog, DialogContent } from '@/components/ui/overlays'
import { Input } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toaster'
import { LinhaDeEnergia } from './linha-de-energia'

const FONT_HAND = 'var(--font-caveat), "Segoe Script", cursive'
const FONT_SERIF = 'var(--font-instrument), Georgia, serif'

const PERIODOS: { v: Periodo; rotulo: string }[] = [
  { v: 'dia', rotulo: 'dia' },
  { v: 'semana', rotulo: 'semana' },
  { v: 'mes', rotulo: 'mês' },
]

const MOMENTOS: { v: Momento; rotulo: string }[] = [
  { v: 'madrugada', rotulo: 'madrugada' },
  { v: 'manha', rotulo: 'manhã' },
  { v: 'tarde', rotulo: 'tarde' },
  { v: 'anoitecer', rotulo: 'anoitecer' },
  { v: 'noite', rotulo: 'noite' },
]

const TODAS_EMOCOES = Object.keys(EMOCOES) as Emocao[]

// ─── Helpers de SVG ───────────────────────────────────────────────────────────

function vecToSvg(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  return `M ${pts[0][0]} ${pts[0][1]} L ${pts.slice(1).map((p) => `${p[0]} ${p[1]}`).join(' ')} Z`
}
function strokeToPath(s: Stroke): string {
  try {
    const outline = getStroke(s.points, { size: 4, thinning: 0.5, smoothing: 0.6, streamline: 0.4 })
    return vecToSvg(outline)
  } catch {
    return ''
  }
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export interface EscreverDialogProps {
  open: boolean
  onClose: () => void
  /** Se passada, somos edição. */
  editar?: Registro | null
  /** Pré-seleciona o período (default: dia). */
  periodoInicial?: Periodo
}

export function EscreverDialog({
  open,
  onClose,
  editar,
  periodoInicial,
}: EscreverDialogProps) {
  const adicionar = useDiarioStore((s) => s.adicionar)
  const atualizar = useDiarioStore((s) => s.atualizar)

  // ── Estado do formulário
  const [periodo, setPeriodo] = useState<Periodo>('dia')
  const [data, setData] = useState(isoDia())
  const [dataFim, setDataFim] = useState(isoDia())
  const [momento, setMomento] = useState<Momento>('manha')
  const [emocoes, setEmocoes] = useState<Emocao[]>([])
  const [energia, setEnergia] = useState<Energia>(3)
  const [titulo, setTitulo] = useState('')
  const [prompt, setPrompt] = useState('')
  const [texto, setTexto] = useState('')
  const [fora, setFora] = useState(['', ''])
  const [dentro, setDentro] = useState(['', ''])
  const [proximo, setProximo] = useState([''])
  const [notas, setNotas] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // ── Preencher quando abre (novo ou edição)
  useEffect(() => {
    if (!open) return
    if (editar) {
      setPeriodo(editar.periodo)
      setData(editar.data)
      setDataFim(editar.dataFim ?? isoDia())
      setMomento(editar.momento ?? 'manha')
      setEmocoes(editar.emocoes)
      setEnergia(editar.energia)
      setTitulo(editar.titulo ?? '')
      setPrompt(editar.prompt ?? '')
      setTexto(editar.texto ?? '')
      setFora(editar.retro?.fora ?? ['', ''])
      setDentro(editar.retro?.dentro ?? ['', ''])
      setProximo(editar.retro?.proximo ?? [''])
      setNotas(editar.notas ?? '')
      setTags(editar.tags)
    } else {
      setPeriodo(periodoInicial ?? 'dia')
      setData(isoDia())
      setDataFim(isoDia())
      setMomento(momentoAgora())
      setEmocoes([])
      setEnergia(3)
      setTitulo('')
      setPrompt((periodoInicial ?? 'dia') === 'dia' ? promptDoDia().texto : '')
      setTexto('')
      setFora(['', ''])
      setDentro(['', ''])
      setProximo([''])
      setNotas('')
      setTags([])
    }
    setTagInput('')
  }, [open, editar, periodoInicial])

  const ehPeriodo = periodo !== 'dia'
  const cor = emocoes[0] ? EMOCOES[emocoes[0]].cor : 'var(--foreground)'

  // ── Handlers
  const toggleEmocao = (e: Emocao) => {
    if (emocoes.includes(e)) setEmocoes(emocoes.filter((x) => x !== e))
    else if (emocoes.length < 3) setEmocoes([...emocoes, e])
  }

  const adicionarTag = () => {
    const v = tagInput.trim().toLowerCase()
    if (!v || tags.includes(v)) return
    setTags([...tags, v])
    setTagInput('')
  }

  const trocarPrompt = () => {
    const outro = PROMPTS.filter((p) => p.texto !== prompt)[
      Math.floor(Math.random() * PROMPTS.length)
    ]
    setPrompt(outro.texto)
  }

  const salvar = () => {
    // Validação honesta, sem marcar bordas vermelhas ou enfeitar erros.
    if (ehPeriodo) {
      const retro: RetroResumo = {
        fora: fora.map((s) => s.trim()).filter(Boolean),
        dentro: dentro.map((s) => s.trim()).filter(Boolean),
        proximo: proximo.map((s) => s.trim()).filter(Boolean),
      }
      const vazio =
        retro.fora.length === 0 &&
        retro.dentro.length === 0 &&
        retro.proximo.length === 0 &&
        !notas.trim()
      if (vazio) {
        toast({ title: 'Escreva ao menos uma linha — mesmo uma palavra.', variant: 'error' })
        return
      }
      const dados: EntradaCriar = {
        periodo,
        data,
        dataFim: periodo === 'dia' ? undefined : dataFim,
        titulo: titulo || undefined,
        emocoes,
        energia,
        tags,
        retro,
        notas: notas || undefined,
      }
      if (editar) {
        atualizar(editar.id, { ...dados, atualizadoEm: new Date().toISOString() })
        toast({ title: 'Registro atualizado.', variant: 'success' })
      } else {
        adicionar(dados)
        toast({ title: 'Registro guardado.', variant: 'success' })
      }
      onClose()
      return
    }

    if (!texto.trim() && emocoes.length === 0) {
      toast({ title: 'Diga ao menos uma emoção, ou uma palavra.', variant: 'error' })
      return
    }
    const dados: EntradaCriar = {
      periodo,
      data,
      momento,
      emocoes,
      energia,
      titulo: titulo || undefined,
      prompt: prompt || undefined,
      texto: texto || undefined,
      tags,
    }
    if (editar) {
      atualizar(editar.id, { ...dados, atualizadoEm: new Date().toISOString() })
      toast({ title: 'Registro atualizado.', variant: 'success' })
    } else {
      adicionar(dados)
      toast({ title: 'Registro guardado.', variant: 'success' })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        hideClose
        className="max-w-2xl max-h-[92dvh] p-0 sm:p-0"
        title=""
        description=""
      >
        <FolhaEditavel
          periodo={periodo}
          data={data}
          dataFim={dataFim}
          momento={momento}
          emocoes={emocoes}
          energia={energia}
          titulo={titulo}
          prompt={prompt}
          texto={texto}
          fora={fora}
          dentro={dentro}
          proximo={proximo}
          notas={notas}
          tags={tags}
          tagInput={tagInput}
          cor={cor}
          ehPeriodo={ehPeriodo}
          setPeriodo={setPeriodo}
          setData={setData}
          setDataFim={setDataFim}
          setMomento={setMomento}
          toggleEmocao={toggleEmocao}
          setEnergia={setEnergia}
          setTitulo={setTitulo}
          setPrompt={setPrompt}
          trocarPrompt={trocarPrompt}
          setTexto={setTexto}
          setFora={setFora}
          setDentro={setDentro}
          setProximo={setProximo}
          setNotas={setNotas}
          setTags={setTags}
          setTagInput={setTagInput}
          adicionarTag={adicionarTag}
          onFechar={onClose}
          onSalvar={salvar}
        />
      </DialogContent>
    </Dialog>
  )
}

// ─── A folha editável — tudo em uma única vista ─────────────────────────────

interface FolhaEditavelProps {
  // estado
  periodo: Periodo
  data: string
  dataFim: string
  momento: Momento
  emocoes: Emocao[]
  energia: Energia
  titulo: string
  prompt: string
  texto: string
  fora: string[]
  dentro: string[]
  proximo: string[]
  notas: string
  tags: string[]
  tagInput: string
  cor: string
  ehPeriodo: boolean
  // setters
  setPeriodo: (v: Periodo) => void
  setData: (v: string) => void
  setDataFim: (v: string) => void
  setMomento: (v: Momento) => void
  toggleEmocao: (e: Emocao) => void
  setEnergia: (v: Energia) => void
  setTitulo: (v: string) => void
  setPrompt: (v: string) => void
  trocarPrompt: () => void
  setTexto: (v: string) => void
  setFora: (v: string[]) => void
  setDentro: (v: string[]) => void
  setProximo: (v: string[]) => void
  setNotas: (v: string) => void
  setTags: (v: string[]) => void
  setTagInput: (v: string) => void
  adicionarTag: () => void
  onFechar: () => void
  onSalvar: () => void
}

function FolhaEditavel(p: FolhaEditavelProps) {
  return (
    <div className="surface-diario">
      {/* Cabeçalho operacional — discreto, sans. */}
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-3 sm:px-7">
        {/* Seletor de período — linguagem de "períodos da vida". */}
        <div className="flex items-center gap-1">
          {PERIODOS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => p.setPeriodo(opt.v)}
              aria-pressed={p.periodo === opt.v}
              className={cn(
                'rounded px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.18em] transition-colors',
                p.periodo === opt.v
                  ? 'text-foreground bg-muted/70'
                  : 'text-muted-foreground/60 hover:text-foreground',
              )}
            >
              {opt.rotulo}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={p.onFechar}
            className="rounded px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            fechar
          </button>
          <button
            type="button"
            onClick={p.onSalvar}
            style={{ borderColor: p.cor, color: p.cor }}
            className="rounded border bg-transparent px-3 py-1 text-[0.72rem] uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background"
          >
            guardar
          </button>
        </div>
      </div>

      {/* A folha — corpo escrevível */}
      <div className="grid grid-cols-1 gap-6 px-5 py-8 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:px-7 sm:py-10">
        {/* Coluna-data editável */}
        <header className="flex flex-col gap-3 sm:text-right">
          <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
            {p.periodo === 'dia' ? 'quando' : 'de – até'}
          </span>
          {p.ehPeriodo ? (
            <div className="flex flex-col gap-1.5">
              <Input type="date" value={p.data} onChange={(e) => p.setData(e.target.value)} className="h-8 rounded px-2 py-1 text-xs" />
              <Input type="date" value={p.dataFim} onChange={(e) => p.setDataFim(e.target.value)} className="h-8 rounded px-2 py-1 text-xs" />
            </div>
          ) : (
            <>
              <input
                type="date"
                value={p.data}
                onChange={(e) => p.setData(e.target.value)}
                className="h-8 w-full rounded border border-border/50 bg-transparent px-2 text-xs text-foreground/85"
              />
              {/* Momento — manuscrito */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
                  momento
                </span>
                <select
                  value={p.momento}
                  onChange={(e) => p.setMomento(e.target.value as Momento)}
                  className="h-8 w-full rounded border border-border/50 bg-transparent px-1.5 text-xs"
                >
                  {MOMENTOS.map((m) => (
                    <option key={m.v} value={m.v}>{m.rotulo}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="mt-2">
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
              energia
            </span>
            <div className="mt-1.5 flex flex-col items-center gap-1.5 sm:items-end">
              <LinhaDeEnergia energia={p.energia} cor={p.cor} comRotulo />
              <EnergiaPicker value={p.energia} onChange={(e) => p.setEnergia(e)} cor={p.cor} />
            </div>
          </div>
        </header>

        {/* Corpo */}
        <div className="flex flex-col gap-5">
          {/* Título */}
          <input
            type="text"
            value={p.titulo}
            onChange={(e) => p.setTitulo(e.target.value)}
            placeholder="um título, se quiser"
            className="w-full bg-transparent font-serif font-medium outline-none placeholder:text-muted-foreground/35"
            style={{ fontFamily: FONT_SERIF, fontSize: '1.55rem', lineHeight: 1.15 }}
          />

          {/* Prompt do dia (apenas para dia) */}
          {!p.ehPeriodo && p.prompt && (
            <div className="-ml-0.5 flex items-baseline gap-2">
              <span
                className="flex-1 font-hand text-muted-foreground/80"
                style={{ fontFamily: FONT_HAND, fontSize: '1.18rem', lineHeight: 1.2 }}
              >
                {p.prompt}
              </span>
              <button
                type="button"
                onClick={p.trocarPrompt}
                className="shrink-0 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                outro
              </button>
            </div>
          )}

          {/* Emoções */}
          <div>
            <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
              emoções {p.emocoes.length}/3
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TODAS_EMOCOES.map((e) => {
                const cfg = EMOCOES[e]
                const ativa = p.emocoes.includes(e)
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => p.toggleEmocao(e)}
                    aria-pressed={ativa}
                    className={cn(
                      'flex items-baseline gap-1.5 rounded border px-2.5 py-1 text-sm transition-colors',
                      ativa
                        ? 'border-transparent text-background'
                        : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border',
                    )}
                    style={ativa ? { backgroundColor: cfg.cor } : undefined}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'inline-block h-2 w-2 translate-y-[1px] rounded-[1px]',
                        !ativa && 'opacity-80',
                      )}
                      style={{ backgroundColor: ativa ? 'var(--background)' : cfg.cor }}
                    />
                    <span
                      className={cn('font-serif italic', ativa ? 'not-italic' : '')}
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      {cfg.rotulo}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Corpo conforme período */}
          {p.ehPeriodo ? (
            <div className="space-y-5">
              <BlocoRetroEditavel
                titulo="fora de mim"
                linhas={p.fora}
                setLinhas={p.setFora}
                saldo="·"
                cor={p.cor}
              />
              <BlocoRetroEditavel
                titulo="dentro de mim"
                linhas={p.dentro}
                setLinhas={p.setDentro}
                saldo="·"
                cor={p.cor}
              />
              <BlocoRetroEditavel
                titulo="levarei adiante"
                linhas={p.proximo}
                setLinhas={p.setProximo}
                saldo="→"
                cor={p.cor}
              />
              <div>
                <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
                  notas
                </span>
                <textarea
                  value={p.notas}
                  onChange={(e) => p.setNotas(e.target.value)}
                  rows={4}
                  placeholder="Algo que não cabe nas listas acima…"
                  className="mt-2 w-full resize-none rounded border border-border/40 bg-transparent px-3 py-2 font-serif text-foreground/85 outline-none focus-visible:border-foreground/40"
                  style={{ fontFamily: FONT_SERIF, fontSize: '1rem', lineHeight: 1.55 }}
                />
              </div>
            </div>
          ) : (
            <textarea
              value={p.texto}
              onChange={(e) => p.setTexto(e.target.value)}
              rows={12}
              autoFocus
              placeholder="Escreva. Sem julgamentos — só você e a página."
              className="w-full resize-none bg-transparent font-serif text-foreground/85 outline-none placeholder:text-muted-foreground/30"
              style={{ fontFamily: FONT_SERIF, fontSize: '1.02rem', lineHeight: 1.65 }}
            />
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/60">
              tags
            </span>
            {p.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t}
                <button
                  type="button"
                  aria-label={`Remover ${t}`}
                  onClick={() => p.setTags(p.tags.filter((x) => x !== t))}
                  className="text-muted-foreground/50 hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={p.tagInput}
              onChange={(e) => p.setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  p.adicionarTag()
                }
              }}
              placeholder="adicionar…"
              className="min-w-[7rem] flex-1 bg-transparent text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground/70 outline-none placeholder:text-muted-foreground/30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Transforma a linha de energia num input ───────────────────────────────

function EnergiaPicker({
  value,
  onChange,
  cor,
}: {
  value: Energia
  onChange: (v: Energia) => void
  cor: string
}) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Nível de energia">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n as Energia)}
          className={cn(
            'size-3.5 rounded-full border transition-transform',
            value === n ? 'scale-100' : 'scale-90 opacity-50 hover:opacity-100',
          )}
          style={{
            borderColor: value === n ? cor : 'var(--border)',
            backgroundColor: value === n ? cor : 'transparent',
          }}
          aria-label={`energia ${n}`}
        />
      ))}
    </div>
  )
}

// ─── Bloco de retrospectiva editável ─────────────────────────────────────────

function BlocoRetroEditavel({
  titulo,
  linhas,
  setLinhas,
  saldo,
  cor,
}: {
  titulo: string
  linhas: string[]
  setLinhas: (v: string[]) => void
  saldo: string
  cor: string
}) {
  const trocar = (i: number, v: string) => {
    const next = [...linhas]
    next[i] = v
    setLinhas(next)
  }
  const remover = (i: number) => setLinhas(linhas.filter((_, j) => j !== i))
  const adicionar = () => setLinhas([...linhas, ''])

  // Garante sempre uma última linha em branco
  const exibidas = linhas.length > 0 && linhas[linhas.length - 1].trim() === '' ? linhas : [...linhas, '']

  return (
    <section>
      <h3 className="mb-2 text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground">
        {titulo}
      </h3>
      <ul className="space-y-1.5">
        {exibidas.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span aria-hidden className="mt-2 text-sm" style={{ color: cor }}>
              {saldo}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => trocar(i, e.target.value)}
              placeholder={i === exibidas.length - 1 ? 'escreva, ou deixe em branco…' : ''}
              className="flex-1 bg-transparent font-serif text-foreground/85 outline-none placeholder:text-muted-foreground/30"
              style={{ fontFamily: FONT_SERIF, fontSize: '1rem', lineHeight: 1.55 }}
            />
            {linhas.length > 1 && item.trim() && (
              <button
                type="button"
                onClick={() => remover(i)}
                aria-label="Remover linha"
                className="mt-1 shrink-0 text-muted-foreground/40 hover:text-destructive"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {linhas.length > 0 && linhas[linhas.length - 1].trim() !== '' && (
        <button
          type="button"
          onClick={adicionar}
          className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/60 hover:text-foreground"
        >
          + outra linha
        </button>
      )}
    </section>
  )
}
