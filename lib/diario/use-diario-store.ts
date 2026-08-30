import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Stroke } from '@/lib/types'
import {
  EMOCOES,
  PROMPTS,
  type Energia,
  type Emocao,
  type Momento,
  type Periodo,
  type Prompt,
  type Registro,
  type RetroResumo,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 11)
const nowISO = () => new Date().toISOString()

export const isoDia = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const offsetIso = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return isoDia(d)
}

const momentoAtual = (): Momento => {
  const h = new Date().getHours()
  if (h >= 0 && h < 5) return 'madrugada'
  if (h >= 5 && h < 12) return 'manha'
  if (h >= 12 && h < 17) return 'tarde'
  if (h >= 17 && h < 20) return 'anoitecer'
  return 'noite'
}

/** Prompt do dia — determinístico por data. Não muda ao recarregar. */
export const promptDoDia = (dataISO: string = isoDia()): Prompt => {
  const nums = dataISO.replace(/-/g, '').split('').reduce((a, b) => a + Number(b), 0)
  return PROMPTS[nums % PROMPTS.length]
}

const corPadrao = '#8a8580'

// ─── Seeds honestos ───────────────────────────────────────────────────────────
// Não há "50K usuários" aqui. São entradas próprias, sinais de uma vida
// começando a ser anotada — o ponto do produto é você dar continuidade.

const seedRegistros: Registro[] = [
  {
    id: 'seed-1',
    periodo: 'dia',
    data: offsetIso(0),
    criadoEm: nowISO(),
    atualizadoEm: nowISO(),
    titulo: 'Antes que o dia leve tudo',
    emocoes: ['serenidade', 'gratidao'],
    energia: 3,
    cor: EMOCOES.serenidade.cor,
    tags: ['início'],
    momento: 'manha',
    prompt: promptDoDia(offsetIso(0)).texto,
    texto:
      'O sol demorou a aparecer hoje. Fiquei olhando a janela por um tempo sem pensar em nada — e foi bom não pensar em nada.\n\nQuero lembrar dessa calma quando a semana apertar.',
    fixado: true,
  },
  {
    id: 'seed-2',
    periodo: 'dia',
    data: offsetIso(-1),
    criadoEm: nowISO(),
    atualizadoEm: nowISO(),
    titulo: 'Domingo na cozinha',
    emocoes: ['alegria', 'cansaco'],
    energia: 2,
    cor: EMOCOES.alegria.cor,
    tags: ['casa', 'cuidar'],
    momento: 'anoitecer',
    texto:
      'Passei a tarde cozinhando devagar. Nada pressa. O cheiro da comida ficou na casa inteira e eu percebi que era exatamente isso que eu precisava: uma prova de que eu existo, sem ter que explicar pra ninguém.',
  },
  {
    id: 'seed-3',
    periodo: 'semana',
    data: offsetIso(-6),
    dataFim: isoDia(),
    criadoEm: nowISO(),
    atualizadoEm: nowISO(),
    titulo: 'Uma semana de coisas pequenas',
    emocoes: ['gratidao', 'preocupacao'],
    energia: 3,
    cor: EMOCOES.gratidao.cor,
    tags: ['semana'],
    retro: {
      fora: [
        'Terminei de organizar os papéis da gaveta.',
        'Reconectei com uma pessoa que faz tempo.',
      ],
      dentro: [
        'Senti que andei cuidando dos outros e esquecendo de mim.',
        'Uma cena antiga voltou sem avisar — ficou o dia todo comigo.',
      ],
      proximo: [
        'Reservar a primeira hora da manhã só pra mim.',
      ],
    },
    notas: 'Foi uma semana de ajustes finos. Nada grande aconteceu — e isso também é uma forma de avançar.',
  },
]

// ─── Estado / Ações ───────────────────────────────────────────────────────────

interface EstadoDiario {
  registros: Registro[]
  senhaHash: string | null
  /** Datas que o usuário já "abriu" pelo calendário-índice. */
  ultimaVista: string

  // Acesso
  definirSenha: (hash: string) => void

  // Escrita
  adicionar: (dados: EntradaCriar) => string
  atualizar: (id: string, patch: Partial<Registro>) => void
  remover: (id: string) => void
  fixar: (id: string) => void

  // Consultas
  porData: (data: string) => Registro[]
  porPeriodo: (periodo: Periodo) => Registro[]
  buscar: (consulta: string) => Registro[]
  linhaDoTempo: () => Registro[]

  // Estatísticas honestas
  episodios: () => number
  sequencia: () => number
  emocoesFrequentes: (limite?: number) => { emocao: Emocao; n: number }[]
}

export interface EntradaCriar {
  periodo: Periodo
  data: string
  dataFim?: string
  titulo?: string
  emocoes: Emocao[]
  energia: Energia
  cor?: string
  tags?: string[]
  rabisco?: Stroke[]
  momento?: Momento
  prompt?: string
  texto?: string
  retro?: RetroResumo
  notas?: string
}

export const useDiarioStore = create<EstadoDiario>()(
  persist(
    (set, get) => ({
      registros: [],
      senhaHash: null,
      ultimaVista: isoDia(),

      definirSenha: (hash) => set({ senhaHash: hash }),

      adicionar: (dados) => {
        const id = `d-${uid()}`
        const registro: Registro = {
          id,
          periodo: dados.periodo,
          data: dados.data,
          dataFim: dados.dataFim,
          titulo: dados.titulo?.trim() || undefined,
          emocoes: dados.emocoes ?? [],
          energia: dados.energia ?? 3,
          cor: dados.cor ?? (dados.emocoes[0] ? EMOCOES[dados.emocoes[0]].cor : corPadrao),
          tags: dados.tags ?? [],
          rabisco: dados.rabisco?.length ? dados.rabisco : undefined,
          momento: dados.momento,
          prompt: dados.prompt?.trim() || undefined,
          texto: dados.texto?.trim() || undefined,
          retro: dados.retro,
          notas: dados.notas?.trim() || undefined,
          criadoEm: nowISO(),
          atualizadoEm: nowISO(),
        }
        set((s) => ({ registros: [registro, ...s.registros] }))
        return id
      },

      atualizar: (id, patch) =>
        set((s) => ({
          registros: s.registros.map((r) =>
            r.id === id ? { ...r, ...patch, atualizadoEm: nowISO() } : r,
          ),
        })),

      remover: (id) => set((s) => ({ registros: s.registros.filter((r) => r.id !== id) })),

      fixar: (id) =>
        set((s) => ({
          registros: s.registros.map((r) =>
            r.id === id ? { ...r, fixado: !r.fixado } : r,
          ),
        })),

      porData: (data) =>
        get().registros.filter((r) => r.data === data),

      porPeriodo: (periodo) => get().registros.filter((r) => r.periodo === periodo),

      buscar: (consulta) => {
        const q = consulta.trim().toLowerCase()
        if (!q) return []
        return get().registros.filter(
          (r) =>
            r.titulo?.toLowerCase().includes(q) ||
            r.texto?.toLowerCase().includes(q) ||
            r.notas?.toLowerCase().includes(q) ||
            r.tags.some((t) => t.toLowerCase().includes(q)) ||
            r.emocoes.some((e) => EMOCOES[e].rotulo.toLowerCase().includes(q)),
        )
      },

      linhaDoTempo: () => {
        // Fixados primeiro, depois por data (mais recente primeiro).
        return [...get().registros].sort((a, b) => {
          if (a.fixado && !b.fixado) return -1
          if (!a.fixado && b.fixado) return 1
          return b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm)
        })
      },

      episodios: () => get().registros.length,

      sequencia: () => {
        const datas = [
          ...new Set(get().registros.filter((r) => r.periodo === 'dia').map((r) => r.data)),
        ].sort().reverse()
        if (datas.length === 0) return 0
        let seq = 0
        let esperado = isoDia()
        for (const d of datas) {
          if (d === esperado) {
            seq++
            const dia = new Date(esperado + 'T12:00:00')
            dia.setDate(dia.getDate() - 1)
            esperado = isoDia(dia)
          } else if (d < esperado) {
            break
          }
        }
        return seq
      },

      emocoesFrequentes: (limite = 4) => {
        const contagem = new Map<Emocao, number>()
        for (const r of get().registros) {
          for (const e of r.emocoes) contagem.set(e, (contagem.get(e) ?? 0) + 1)
        }
        return [...contagem.entries()]
          .map(([emocao, n]) => ({ emocao, n }))
          .sort((a, b) => b.n - a.n)
          .slice(0, limite)
      },
    }),
    {
      name: 'plannerhub-diario',
      partialize: (s) => ({ registros: s.registros, senhaHash: s.senhaHash }),
    },
  ),
)
