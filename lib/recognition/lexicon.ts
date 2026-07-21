// ─── Léxico e pós-processamento linguístico ──────────────────────────────────
// Modelo de linguagem leve: vocabulário pt-BR (~700 palavras mais frequentes
// + vocabulário de planner) e en (~200). Usado para:
//   1. pontuar hipóteses de palavras (lexiconScore)
//   2. corrigir palavras de baixa confiança por distância de Damerau (suggest)
//   3. restaurar acentos que a escrita omite (restoreAccents)

export type LexLang = 'por' | 'eng' | 'por+eng'

// Ordenado grosseiramente por frequência — o índice serve de desempate.
const PT_WORDS = [
  // Artigos, pronomes, preposições, conjunções
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela', 'com', 'sem', 'sob', 'sobre',
  'entre', 'até', 'após', 'ante', 'perante', 'para', 'pra', 'pro', 'e', 'ou', 'mas',
  'que', 'se', 'como', 'quando', 'onde', 'porque', 'pois', 'nem', 'já', 'ainda',
  'também', 'só', 'muito', 'mais', 'menos', 'tão', 'eu', 'tu', 'ele', 'ela', 'nós',
  'vós', 'eles', 'elas', 'me', 'te', 'lhe', 'nos', 'vos', 'lhes', 'meu', 'minha',
  'teu', 'tua', 'seu', 'sua', 'nosso', 'nossa', 'dele', 'dela', 'este', 'esta',
  'esse', 'essa', 'aquele', 'aquela', 'isto', 'isso', 'aquilo', 'aqui', 'ali', 'lá',
  'cá', 'agora', 'depois', 'antes', 'hoje', 'ontem', 'amanhã', 'sempre', 'nunca',
  'talvez', 'sim', 'não', 'ao', 'aos', 'à', 'às', 'lá', 'cujo', 'cuja',
  // Verbos frequentes
  'ser', 'estar', 'ter', 'fazer', 'ir', 'ver', 'dar', 'saber', 'querer', 'poder',
  'dizer', 'falar', 'ficar', 'haver', 'vir', 'passar', 'deixar', 'parecer', 'seguir',
  'encontrar', 'levar', 'começar', 'pensar', 'olhar', 'ouvir', 'tomar', 'achar',
  'sair', 'chegar', 'trabalhar', 'estudar', 'ler', 'escrever', 'comprar', 'vender',
  'pagar', 'receber', 'abrir', 'fechar', 'entrar', 'voltar', 'partir', 'dormir',
  'acordar', 'comer', 'beber', 'cozinhar', 'limpar', 'lavar', 'andar', 'correr',
  'jogar', 'brincar', 'ajudar', 'precisar', 'gostar', 'amar', 'odiar', 'sentir',
  'lembrar', 'esquecer', 'aprender', 'ensinar', 'entender', 'compreender', 'usar',
  'chamar', 'responder', 'perguntar', 'pedir', 'colocar', 'tirar', 'mudar', 'criar',
  'terminar', 'acabar', 'continuar', 'parar', 'esperar', 'aguardar', 'marcar',
  'desmarcar', 'remarcar', 'confirmar', 'cancelar', 'enviar', 'mandar', 'mostrar',
  'tentar', 'conseguir', 'perder', 'ganhar', 'vencer', 'cumprir', 'resolver',
  'organizar', 'planejar', 'anotar', 'revisar', 'praticar', 'treinar', 'descansar',
  'viajar', 'dirigir', 'passear', 'visitar', 'morar', 'viver', 'nascer', 'crescer',
  'foi', 'vai', 'vou', 'era', 'são', 'está', 'estou', 'tem', 'tinha', 'fez', 'feito',
  // Substantivos frequentes
  'dia', 'noite', 'tarde', 'manhã', 'semana', 'mês', 'ano', 'hora', 'minuto',
  'tempo', 'momento', 'vez', 'vezes', 'coisa', 'coisas', 'pessoa', 'pessoas', 'gente',
  'homem', 'mulher', 'menino', 'menina', 'filho', 'filha', 'pai', 'mãe', 'irmão',
  'irmã', 'amigo', 'amiga', 'família', 'casa', 'apartamento', 'quarto', 'cozinha',
  'trabalho', 'emprego', 'escola', 'faculdade', 'curso', 'aula', 'prova', 'teste',
  'exame', 'matéria', 'disciplina', 'professor', 'professora', 'aluno', 'aluna',
  'livro', 'caderno', 'caneta', 'papel', 'mesa', 'cadeira', 'computador', 'celular',
  'telefone', 'carro', 'ônibus', 'metrô', 'bicicleta', 'rua', 'cidade', 'bairro',
  'país', 'mundo', 'lugar', 'lado', 'parte', 'meio', 'fim', 'início', 'começo',
  'nome', 'vida', 'mão', 'olho', 'cabeça', 'coração', 'corpo', 'pé', 'braço',
  'água', 'café', 'comida', 'almoço', 'jantar', 'lanche', 'fruta', 'pão', 'leite',
  'arroz', 'feijão', 'carne', 'peixe', 'salada', 'suco', 'dinheiro', 'preço',
  'conta', 'banco', 'cartão', 'salário', 'compra', 'compras', 'mercado', 'loja',
  'presente', 'aniversário', 'festa', 'música', 'filme', 'série', 'jogo', 'livros',
  'saúde', 'médico', 'médica', 'remédio', 'hospital', 'academia', 'exercício',
  'treino', 'sono', 'descanso', 'férias', 'viagem', 'praia', 'parque', 'projeto',
  'reunião', 'tarefa', 'tarefas', 'meta', 'metas', 'objetivo', 'plano', 'lista',
  'nota', 'lembrete', 'compromisso', 'evento', 'encontro', 'consulta', 'agenda',
  'rotina', 'hábito', 'prioridade', 'prazo', 'entrega', 'relatório', 'documento',
  'email', 'mensagem', 'ligação', 'chamada', 'problema', 'solução', 'ideia',
  'pergunta', 'resposta', 'assunto', 'tema', 'exemplo', 'caso', 'forma', 'jeito',
  'sistema', 'processo', 'resultado', 'grupo', 'equipe', 'time', 'cliente', 'chefe',
  'governo', 'empresa', 'serviço', 'produto', 'valor', 'número', 'data', 'semana',
  'história', 'novidade', 'notícia', 'verdade', 'dúvida', 'medo', 'alegria',
  'felicidade', 'amor', 'paz', 'fé', 'deus', 'senhor',
  // Adjetivos frequentes
  'bom', 'boa', 'mau', 'má', 'grande', 'pequeno', 'pequena', 'novo', 'nova',
  'velho', 'velha', 'jovem', 'bonito', 'bonita', 'feio', 'feia', 'fácil', 'difícil',
  'rápido', 'devagar', 'cedo', 'tarde', 'longe', 'perto', 'alto', 'baixo', 'forte',
  'fraco', 'feliz', 'triste', 'cansado', 'cansada', 'doente', 'saudável', 'livre',
  'ocupado', 'ocupada', 'pronto', 'pronta', 'certo', 'certa', 'errado', 'errada',
  'verdadeiro', 'falso', 'possível', 'impossível', 'importante', 'necessário',
  'urgente', 'simples', 'complicado', 'claro', 'escuro', 'cheio', 'vazio', 'caro',
  'barato', 'quente', 'frio', 'limpo', 'sujo', 'primeiro', 'primeira', 'último',
  'última', 'próximo', 'próxima', 'anterior', 'mesmo', 'mesma', 'outro', 'outra',
  'todo', 'toda', 'cada', 'algum', 'alguma', 'nenhum', 'nenhuma', 'qualquer',
  // Números e tempo
  'zero', 'dois', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete',
  'dezoito', 'dezenove', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta',
  'setenta', 'oitenta', 'noventa', 'cem', 'cento', 'mil', 'segundo', 'terceiro',
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro', 'segunda', 'terça', 'quarta',
  'quinta', 'sexta', 'sábado', 'domingo', 'feriado', 'fim', 'final',
  // Expressões comuns em planners
  'fazer', 'comprar', 'pagar', 'levar', 'buscar', 'ligar', 'agendar', 'remédio',
  'academia', 'estudar', 'revisar', 'entregar', 'enviar', 'responder', 'limpar',
  'organizar', 'planejar', 'aniversário', 'reunião', 'consulta', 'dentista',
  'supermercado', 'farmácia', 'padaria', 'banco', 'conta', 'luz', 'internet',
  'aluguel', 'cartão', 'fatura', 'acordar', 'meditar', 'alongar', 'caminhar',
  'corrida', 'ler', 'páginas', 'capítulo', 'arrumar', 'guardar', 'separar',
  'lavar', 'roupa', 'roupas', 'louça', 'lixo', 'cachorro', 'gato', 'veterinário',
  'vacina', 'escola', 'filhos', 'jantar', 'almoço', 'café', 'lanche', 'receita',
  'ingredientes', 'orçamento', 'economia', 'poupança', 'investimento', 'dívida',
  'meta', 'sonho', 'viagem', 'passagem', 'hotel', 'mala', 'documentos', 'passaporte',
]

const EN_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
  'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some',
  'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
  'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
  'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had',
  'did', 'done', 'said', 'each', 'many', 'more', 'very', 'much', 'where', 'here',
  'today', 'tomorrow', 'yesterday', 'week', 'month', 'monday', 'tuesday',
  'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'meeting', 'task',
  'plan', 'goal', 'note', 'list', 'buy', 'call', 'email', 'send', 'read', 'write',
  'study', 'review', 'finish', 'start', 'project', 'home', 'house', 'family',
  'friend', 'doctor', 'gym', 'run', 'walk', 'sleep', 'wake', 'eat', 'drink',
  'water', 'coffee', 'lunch', 'dinner', 'breakfast', 'pay', 'bill', 'money',
  'bank', 'card', 'shopping', 'store', 'market', 'birthday', 'party', 'trip',
  'travel', 'flight', 'hotel', 'book', 'clean', 'wash', 'car', 'important',
  'urgent', 'remember', 'appointment', 'schedule', 'deadline', 'report',
]

// ─── Normalização e índices ──────────────────────────────────────────────────

/** minúsculas, sem acentos (NFD strip), sem pontuação final */
export function normalizeWord(w: string): string {
  return w
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:!?'"()]+$/g, '')
}

interface LexIndex {
  /** normalized → forma acentuada preferida (mais frequente) */
  accented: Map<string, string>
  /** normalized → rank de frequência (menor = mais frequente) */
  rank: Map<string, number>
  /** bucket por comprimento para busca rápida */
  byLen: Map<number, string[]>
}

const indexes = new Map<LexLang, LexIndex>()

function buildIndex(lang: LexLang): LexIndex {
  const words =
    lang === 'por' ? PT_WORDS : lang === 'eng' ? EN_WORDS : [...PT_WORDS, ...EN_WORDS]
  const idx: LexIndex = { accented: new Map(), rank: new Map(), byLen: new Map() }
  words.forEach((w, i) => {
    const norm = normalizeWord(w)
    if (!idx.rank.has(norm)) idx.rank.set(norm, i)
    // Prefere a primeira forma com acentos encontrada (senão a primeira forma)
    const prev = idx.accented.get(norm)
    if (prev === undefined || (prev === norm && w !== norm)) idx.accented.set(norm, w)
    const bucket = idx.byLen.get(norm.length)
    if (bucket) bucket.push(norm)
    else idx.byLen.set(norm.length, [norm])
  })
  return idx
}

function getIndex(lang: LexLang): LexIndex {
  let idx = indexes.get(lang)
  if (!idx) {
    idx = buildIndex(lang)
    indexes.set(lang, idx)
  }
  return idx
}

// ─── Distância de Damerau-Levenshtein com corte ──────────────────────────────

export function damerau(a: string, b: string, maxDist = 3): number {
  const n = a.length
  const m = b.length
  if (Math.abs(n - m) > maxDist) return maxDist + 1
  if (n === 0) return m
  if (m === 0) return n

  let d0 = new Array<number>(m + 1)
  let d1 = new Array<number>(m + 1)
  let d2 = new Array<number>(m + 1)
  for (let j = 0; j <= m; j++) d1[j] = j

  for (let i = 1; i <= n; i++) {
    d2[0] = i
    let rowMin = Infinity
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(d1[j] + 1, d2[j - 1] + 1, d1[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d0[j - 2] + 1)
      }
      d2[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > maxDist) return maxDist + 1
    ;[d0, d1, d2] = [d1, d2, d0]
  }
  return d1[m]
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** 1.0 = palavra no léxico; decai com a distância de edição até ~0.15. */
export function lexiconScore(word: string, lang: LexLang): number {
  const norm = normalizeWord(word)
  if (norm.length === 0) return 0.3
  if (norm.length === 1) return 0.8 // letras soltas e artigos são plausíveis
  const idx = getIndex(lang)
  if (idx.rank.has(norm)) return 1

  const best = nearest(norm, lang, 2)
  if (best) {
    if (best.dist === 1) return 0.72
    if (best.dist === 2) return 0.45
  }
  return norm.length >= 4 ? 0.15 : 0.3
}

/** Palavra mais próxima no léxico (dentro de maxDist), desempatada por frequência. */
export function nearest(
  normWord: string,
  lang: LexLang,
  maxDist = 2,
): { word: string; dist: number } | null {
  const idx = getIndex(lang)
  let best: { word: string; dist: number } | null = null
  for (let len = Math.max(1, normWord.length - maxDist); len <= normWord.length + maxDist; len++) {
    const bucket = idx.byLen.get(len)
    if (!bucket) continue
    for (const cand of bucket) {
      const d = damerau(normWord, cand, best ? best.dist - 1 : maxDist)
      if (d <= maxDist && (best === null || d < best.dist)) {
        best = { word: cand, dist: d }
        if (d === 1) return best // não melhora
      }
    }
  }
  return best
}

export interface Suggestion {
  /** Forma com acentos do léxico. */
  word: string
  dist: number
}

/** Até `limit` sugestões ordenadas por (distância, frequência). */
export function suggest(word: string, lang: LexLang, maxDist = 2, limit = 5): Suggestion[] {
  const norm = normalizeWord(word)
  if (norm.length < 2) return []
  const idx = getIndex(lang)
  const out: Suggestion[] = []
  for (let len = Math.max(2, norm.length - maxDist); len <= norm.length + maxDist; len++) {
    const bucket = idx.byLen.get(len)
    if (!bucket) continue
    for (const cand of bucket) {
      if (cand === norm) continue
      const d = damerau(norm, cand, maxDist)
      if (d <= maxDist) out.push({ word: idx.accented.get(cand) ?? cand, dist: d })
    }
  }
  out.sort((a, b) => a.dist - b.dist || (idx.rank.get(normalizeWord(a.word)) ?? 1e9) - (idx.rank.get(normalizeWord(b.word)) ?? 1e9))
  return out.slice(0, limit)
}

/**
 * Restaura acentos: se a forma normalizada bate com uma entrada acentuada do
 * léxico e o usuário escreveu sem acento, devolve a forma acentuada.
 */
export function restoreAccents(word: string, lang: LexLang): string {
  if (/[à-ÿ]/i.test(word)) return word // já tem acento
  const norm = normalizeWord(word)
  const idx = getIndex(lang)
  const accented = idx.accented.get(norm)
  if (!accented || accented === norm) return word
  // Preserva capitalização da primeira letra
  if (word.length > 0 && word[0] === word[0].toUpperCase()) {
    return accented[0].toUpperCase() + accented.slice(1)
  }
  return accented
}
