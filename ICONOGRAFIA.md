# Auditoria de Iconografia

> Princípio: ícone é linguagem, não decoração. Esta doc registra o diagnóstico,
> a nova política e o sistema de ícones adotado. **Cada vitro ícone abaixo tem
> um motivo.**
>
> A regra de ouro: se um componente funciona perfeitamente sem ícone, o ícone
> sai. Prefira ausência a genericidade.

## Diagnóstico — o que havia antes

### "Lucide React Default" identificado

A frequência de uso dos ícones mais populares do Lucide, sem critério, configurava
o produto como um template bootstrapped em poucas horas:

| Ícone | Contagem | Diagnóstico |
| --- | ---: | --- |
| `Trash2` | 20 | presente em toda lista de ações; deveria viver só onde faz sentido, com confirmação secondary |
| `Plus` | 17 | usado para "novo X" em vários módulos — primeira opção da biblioteca, sem metáfora |
| `Check` | 14 | genérico para confirmação |
| `Sparkles` | 13 | o pior caso: usado para Features, Frases favoritas, Hero, CTA Premium, Mood excelente, Principal — seis metáforas diferentes com o MESMO ícone |
| `CheckCircle2` | 9 | genérico de "feito" |
| `Target` | 8 | usado para Metas — ok mas repetido em N telas como ícone de "objetivo" genérico |
| `FileText` | 8 | Notas — genérico, não distingue nota de documento qualquer |
| `ChevronRight` | 7 | navegação; aceitável mas usado até onde caberia gradiente implícito |
| `Search` | 7 | fine em si; reaproveitado para educação onboarding |
| `Bookmark` | 5 | usado para Frases — genérico;.resume em marcar uma página qualquer |
| `BookOpen` | 5 | usado para Templates **e** para cabeçalho "Planners recentes" — duplicado no mesmo viewport |
| `KeyRound` | 5 | Cofre — genérico de chave; todo "cofre" online usa o mesmo |
| `Wallet` | 5 | Finanças — genérico |
| `LayoutDashboard` | 3 | o ícone mais usado por IAs para "home" |

Problemas estruturais adicionais:

1. **Ícone reutilizado com significados diferentes no mesmo viewport** —
   `BookOpen` aparecia para Templates **e** para cabeçalho "Planners recentes" na
   sidebar.
2. **Duas fontes de verdade para os ícones de módulo** — sidebar tinha
   `NAV_ITEMS` com componentes diretos; menu page tinha `ICON_MAP[string]`.
   Mesma coisa definida duas vezes, com possível divergência.
3. **Metáforas se sobrepondo** — `List` (Listas) e `ListChecks` / `ClipboardList`
   (Checklists / Rotina) são três membros da mesma família visual para três
   funcionalidades diferentes. Idem `Heart` (Wishlist) vs `HeartPulse` (Saúde) —
   duas variações do coração para domínios opostos.
4. **`BriefcaseBusiness` para "Planos"** — máscula enterprise em um produto
   íntimo pessoal. O próprio backend chama de "Planos" mas a metáfora usada é
   de maleta corporativa.
5. **`Sparkles` como mood "Excelente"** — em retrospectiva, memória e journal.
   Reduz emoções complexas a um emoji-decorativo disfarçado de ícone.
6. **`Moon`/`Sun` no fundo da sidebar** — ok por convenção mas o product não
   tematiza dia/noite de nenhum outro modo; o gesto sobrevive sem identidade.
7. **Bins confundíveis**: `FileText`/`BookOpen`/`BookHeart` são todos "documento
   aberto" — usado para Notas, Templates e Diário respectivamente, sem critério
   de distinção para o usuário.

### Decisões de reprojeto

Adotamos um sistema **próprio** de ícones de módulo. Justificativas:

- Lucide é útil mas seu catálogo empurra para metáforas saturadas; um projeto
  que visa identidade precisa de uma assinatura.
- O produto já abandonou shadcn-templates no Diário (V2). Continuar copiando
  o vocabulário default do Lucide contradiz a direção.
- Apenas 20 ícones de módulo são permanentes. Desenhá-los a mão é um trabalho
  pequeno e dá ao projeto um vocabulário reconhecível.

### Política (passa a valer)

1. **Um ícone por domínio.** Cada módulo tem um único ícone. Em outra tela, o
   usuário já vê aquele símbolo = aquela funcionalidade. Não reciclar.
2. **Stroke 1.5px, grid 20, butt joints.** Assinatura visual única.
3. **Preto sobre cor, nunca cor sobre ícone.** Ícone herdará `currentColor`;
   estados (ativo/hover) usam `text-color`, não `backgroundColor` no ícone.
4. **Sem emoji-decorativo.** Mood não é mais `Sparkles`/`Smile`/`Angry`; é rótulo
   tipográfico + cor (ver Diário V2).
5. **Fonte única**: `components/icons/modules.tsx`. Quem precisar de ícone de
   módulo (sidebar, menu page, command palette, quick create) importa de lá.
6. **Buscar antes de decorar.** Quando um lugar precisa de ícone de UI
   transiente (ex.: fechar dialog), pode usar Lucide. **Módulos e domínios
   permanentes** vão pelo sistema próprio.
7. **Ausência > genericidade.** Lugares que tinham ícone só para preencher
   espaço (Folder antes de "Pastas", Tag antes de "Tags", `BookOpen` antes de
   "Planners recentes") passam a usar tipografiasmall-caps sem ícone.
8. **Auditável:** nada de ícone "novo" entra sem o item correspondente nesta
   doc com um parágrafo de justificativa. Política viva em `ICONOGRAFIA.md`.

## Ícones de módulo adotados

A cada um: significado, por que este desenho, contexto de uso.

### `diario` — Página aberta com linha de tinta

`Desenho`: folha com margem (traço superior) e linha de tinta ondulada atravessando-a.

Por que: a página em branco é o gesto. A linha substitui a "caneta" (`Pencil`,
`Feather`) — porque no produto, escrever é dar forma a uma curva que oscila
(com a energia). Reconhecível até sem o rótulo.

### `notas` — Quadrado com canto dobrado, sem pauta

`Desenho`: contorno com canto inferior-direito dobrado.

Por que: nota não é documento (`FileText`); é um papel rapidamente marcado. O
canto dobrado é a única concessão — distingue de `Bookmark` (Frases), de
`BookOpen` (Templates) e de `BookHeart`-estilo (Diário).

### `listas` — Três linhas de tamanhos variados, sem checkbox

`Desenho`: três traços horizontais de comprimentos diferentes.

Por que: diverge do `List` (Lucide) por ter variação de tamanho — sugere itens
orgânicos (compra, tarefa, desejo), não uma enumeração rígida. Distingue-se de
Checklists por **não ter marcas**: lista é livre, não tem "done".

### `checklists` — Três linhas com marca de visto

`Desenho`: três traços na linha base + três pequenos vistos à esquerda.

Por que: a marca é o ponto. Checklist = cada item pode ser concluído. Diferente
de `CheckCircle` (genérico "tudo certo") e `ListChecks` (família indefinida),
este é especificamente "lista com confirmação item-a-item".

### `frases` — Aspas curvas sobre linha

`Desenho`: aspas duplas tipográficas sobre uma linha de base.

Por que: Frase favorita = citação. Aspas são o símbolo natural. Substituem o
`Bookmark` (genérico "marcar página") com a única metáfora que se aplica a
citações. Não confunde com `BookHeart`/`BookOpen`.

### `memorias` — Caixa com linha do tempo

`Desenho`: retângulo (caixa) com uma curva ascendente saindo.

Por que: Memória = algo guardado de onde sai um fio de recordação. Substitui o
`Box` genérico ("qualquer container") com uma metáfora de objeto-que-guarda.

### `cofre` — Compartimento com dial

`Desenho`: retângulo com dial circular pequeno.

Por que: cofre de segredos. Dial é o gesto seguro. Substitui `KeyRound`
(genérico de chave; todo password-vault usa). Dial = cofre mecânico, não
gerenciador de senhas.

### `saude` — Pulso contínuo

`Desenho`: linha ECG (onda quadrada do batimento) horizontal.

Por que: Saúde = seguimento do corpo ao longo do tempo. Substitui `HeartPulse`
(que reaparece em apps genéricos) por uma linha de monitor **sem o coração**,
duplamente distintas de `Heart` (Wishlist).

### `wishlist` — Estrela de desejo

`Desenho`: estrela de 5 pontas sem preenchimento.

Por que: desejo, querer, anseio. Substitui `Heart` (usado em 6 lugares); evita o
conflito simbólico Saúde vs Desejo (ambos coração antes). A estrela é mais
neutra para "isto seria bom ter".

### `rotina` — Relógio com marcação

`Desenho`: círculo com dois traços internos (horas) e um ponto no topo (12h).

Por que: rotina = tempo recorrente. Não confunde com `ClipboardList`
(checklist-look). Substitui `Calendar` (que pertence a Calendário) por uma
**repetição temporal**, não um **encontro específico**.

### `calendario` — Página com marcação de dia

`Desenho`: folha com dois marcadores em cima + grade 3×2 com um dia realçado.

Por que: calendário gregoriano visual. Mais específico que `Calendar` do
Lucide (que é círculo+traços). Marca um dia entre vários.

### `financas` — Moeda com sinal

`Desenho`: círculo com "R$" central.

Por que: moeda local (BRL). Substitui `Wallet` (carteira física, evoca), e
qualquer tendência genérica de $-string. Para um app pt-BR, "R$" é contextual.

### `metas` — Marco no caminho

`Desenho`: bandeira em um ponto alto com linha de base.

Por que: meta = marco atingido. Substitui `Target` (alvo de arco, que pertence
mais a foco/mira). Bandeira em cimo é mais reconhecível como "cheguei" —
consistência semântica com"conquista".

### `habitos` — Selo repetido

`Desenho`: três selos pequenos iguais alinhados.

Por que: hábito = repetição. Substitui `CheckCircle` (genérico "ok"). Três selos
iguais comunicam que a ação volta. Diferente de checklists (item-a-item),
hábito é um ciclo.

### `retrospectiva` — Loop com ponto

`Desenho`: seta curva que quase completa um círculo, com um ponto no fim.

Por que: olhar para trás para seguir adiante. Conserta `RefreshCw` (duas setas
rodando, genérico de "sincronização") por algo semanticamente próximo de
"revir e transformar".

### `templates` — Páginas empilhadas

`Desenho`: três retângulos offset, sugerindo uma pilha.

Por que: template = página modelo a replicar. Substitui `BookOpen` (que também
aparecia para "Planners recentes" — má reutilização) por algo que codifica
"página que se repete", não "livro aberto".

### `plans` — Etiqueta de preço

`Desenho`: cartão com "R$" no canto.

Por que: planos de assinatura/compra. Substitui `BriefcaseBusiness` que
carrega conotação enterprise inadequada ao produto. Etiqueta diz " Razor
R$ direto".

### `admin` — Cavado em grade

`Desenho`: grade 2×2 com parte tracejada.

Por que: ferramenta de administração. Substitui `Shield` (que vive como
"segurança" e caberia em Cofre). "Grade sob inspeção" dá ideia de controle /
painel.

### `perfil` — Silhueta vazada

`Desenho`: circulo + arco de ombros, todos vazios.

Por que: identidade. Substitui `User` (Lucide). Mesmo que
`User` em essência, mas a versão própria mantém stroke 1.5 e **não compartilha
identidade com `circle-dot`** que pode aparecer em outro lugar.

### `dashboard` — Composição (não grid quadrado)

`Desenho`: três retângulos de tamanhos diferentes uns sobre os outros.

Por que: dashboard = mistura que resume o dia. Substitui `LayoutDashboard`
(o ícone mais usado por IAs para "home"). A composição assimétrica faz
explícito que NÃO é uma grelha SaaS.

## O que não recebeu ícone próprio

- **Pastas, Tags, Planners recentes** (sidebar): os cabeçalhos tinham ícone
  decorativo. Removidos; viram tipografia small-caps sem ícone. A hierarquia
  continua clara pela tipografia.
- **Hamburger menu** (top-bar mobile): mantido `Menu` do Lucide — é UI
  transiente, não módulo, e paciente consegue reconhecer globalmente.
- **Fechar / X / Chevron / Plus / Pencil / Save / Eye** etc. — mantidos como
  Lucide pontualmente nos dialogs, porque são UI transiente, não módulo.
- **Mood** (retro/memória antigos): substituído por tipografia + cor no Diário
  V2; legado permanece como está até migração.

## Implementação

- Ficheiro: `components/icons/modules.tsx` — SVG inline (não dependência), grid
  20, stroke 1.5, `currentColor`, `butt` joints, fill none.
- Consumidores: `app-sidebar.tsx`, `menu-page.tsx`. Comand palette pode adotar
  depois sem mexer no sistema.
- A store `useMenuStore` passa a exportar tipo `ModuleId` e cada item aponta
  para uma chave (`'diario'`, etc.) — nunca para nome de componente. Novas
  telas só referenciam essas chaves.
