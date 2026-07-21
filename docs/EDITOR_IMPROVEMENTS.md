# Plano de melhorias do Editor do PlannerHub

> Estudo do estado atual via **Codebase Memory MCP** (projeto `C-Workspace-planner-hub`, 1286 nós / 2709 arestas) e leitura direta dos arquivos:
> - `components/editor/planner-editor.tsx` (2073 linhas, monolítico)
> - `components/editor/hooks/use-canvas-pointer.ts` (532 linhas)
> - `components/editor/context-menu.tsx` (97 linhas)
> - `components/editor/hooks/use-handwriting-ocr.ts` (265 linhas)
> - `lib/types.ts`, `lib/store/use-editor-store.ts`, `lib/templates.ts`, `lib/stickers.ts`
>
> Roteiro usado pelo editor: `app/planner/[id]/...` → `<PlannerEditor>`.

## 1. Estado atual — diagnóstico

### Ferramentas existentes (`lib/types.ts:16-25`)
`pen`, `pencil`, `highlighter`, `eraser`, `ruler`, `lasso`, `text`, `sticker`, `pan` — 9 ferramentas.

### Problemas identificados

| # | Problema | Onde | Impacto |
|---|----------|------|---------|
| 1 | **Caneta/lápis ignoram pressão** — `perfect-freehand` recebe `size` fixo, `pressure` é capturado em `StrokePoint` mas nunca usado | `use-canvas-pointer.ts:459-479` | UX fraca em tablets com caneta (Apple Pencil, S-Pen, Surface Pen) |
| 2 | **Sem brush/flat/round** — não há variação de estilo de traço | idem | Traços parecem idênticos em todos os tools |
| 3 | **Eraser cursor `display:none` inline** — nunca aparece (morto) | `planner-editor.tsx:1407-1417, 1533-1539` | Feedback visual ausente na borracha |
| 4 | **Sem palm rejection / touch区分** — `pointerType` (touch/pen/mouse) nunca verificado | `use-canvas-pointer.ts:155` | Toque da mão desenha enquanto se usa caneta |
| 5 | **Barra superior super lotada em mobile** — botões de zoom, página, undo/redo, template, insert, import, export, todos juntos | `planner-editor.tsx:1004-1362` | Inutilizável em smartphone (<768px) |
| 6 | **Toolbar lateral fixa 48px** — em mobile vira dock inferior de 56px, mas ambos ocupam área útil; sem colapso | `planner-editor.tsx:1366-1402, 2037-2070` | Área de desenho pequena |
| 7 | **Sem menu radial / pie menu touch** — toque longo no canvas não abre nada | — | Tablets não têm fluxo natural para trocar ferramenta |
| 8 | **Shapes só são adicionados pelo menu Insert** — não existe ferramenta “retângulo”/“círculo” na toolbar para desenhar direto no canvas | `planner-editor.tsx:1142-1203` | Fluxo não-idiomático vs GoodNotes/Notability |
| 9 | **No fill bucket** (balde de tinta) | — | Comum em editores de planner |
| 10 | **Sem cor/recent colors** — `ToolSettings` mostra paleta fixa de 10 cores, sem histórico das recentes | `planner-editor.tsx:846` | UX repetitiva |
| 11 | **Sem auto-pan quando caneta atinge bordas** | — | Usuário precisa parar e mover manualmente |
| 12 | **Sem snap/grid/alinhamento** ao arrastar shapes/stickers | `use-canvas-pointer.ts:233-287` | Posicionamento impreciso |
| 13 | **Lasso só seleciona, não move o grupo** | `use-canvas-pointer.ts:340-396` | Seleção multi-item inútil |
| 14 | **Sticker panel/OCR panel cobrem tela inteira em mobile** (`fixed inset-0`) | `planner-editor.tsx:1825, 1935` | Bloqueia canvas |
| 15 | **Atalhos 1-9** só funcionam em desktop; mobile não tem como disparar undo/redo entre trocas de tool | `planner-editor.tsx:424-434` | UX mobile quebrada |
| 16 | **Escala de display**: `displayScale = displayWidth / PAGE_WIDTH` mas `transform: translate(panX, panY)` no wrapper externo, então pan move só o sheet, não o container — comportamento ok mas sem pinch-zoom (só ctrl+wheel) | `planner-editor.tsx:1498-1502` | Sem pinch em touch |
| 17 | **Sem undo/redo na própria toolbar** mobile — só na top bar desktop | — | — |
| 18 | `setShowPagesPanel` é declarado mas o botão formato-popover duplica funcionalidade | — | Confuso |
| 19 | **Texto só edita com tool 'sticker' ativa** — `onDoubleClick` ignora se ferramenta != sticker | `planner-editor.tsx:1611-1616, use-canvas-pointer.ts:489-504` | Contraintuitivo |
| 20 | **Top bar usa `window.history.back()`** em vez de nav do app | `planner-editor.tsx:1005` | Volta não-preservável |

## 2. O que vai ser incrementado

### 2.1 Novas ferramentas (`ToolType`)

| id | Nome | Ícone | Descrição |
|----|------|-------|-----------|
| `brush` | Pincel | `Paintbrush` | Traço largo com variação forte de pressão (`thinning: 1.2`) |
| `marker` | Marcador | `PaintBucket` | Traço opaco reto, largura fixa |
| `fill` | Balde de tinta | `PaintBucket` | Flood-fill em traços vizinhos (ráfaga aproximada) |
| `rectangle`/`ellipse`/`line`/`arrow` | Formas geométricas | `Square`/`Circle`/`Minus`/`ArrowRight` | Tool de desenho direto (drag & release) |
| `hand` | Mão | `Hand` | Alias explícito de `pan` (semântica clara) |

### 2.2 Suporte a caneta touch / pressure

- Capturar `e.pressure`, `e.tiltX`, `e.tiltY`, `e.twist` em `getPageCoords`
- `perfect-freehand` options dinâmicas por ponto usando `simulatePressure: false` e passando `pressure` em cada `StrokePoint`
- `pen`/`brush` respeitam pressure; `pencil`/`highlighter`/`marker` usam pressão suavizada
- Detectar `pointerType === 'pen'` para ativar palm rejection: ignore pontos `pointerType: 'touch'` quando uma caneta está ativa
- `pointercancel` e `pointerleave` tratados
- Eraser de caneta (botão lateral do S-Pen / Apple Pencil 2): `e.buttons === 32`（`e.button === 5`） alterna temporariamente para borracha

### 2.3 UX responsiva para tablet/smartphone

**Top bar split** (≤768px):
- Mobile: barra compacta de 44px com apenas `[voltar] [nome/auto-save] [menu ⋯]`
- O menu `⋯` engole: insert, template, página, import/export, undo/redo, zoom
- Tablet (768–1024px): top bar completa, mas ToolSettings como popover anchored

**Toolbar lateral**:
- Mobile/tablet: **dock inferior flutuante em pílula** com as ferramentas primárias + botão ` MORE` que expande pra grid
- Desktop: mantém dock lateral de 48px

**Radial / pie menu** (toque longo no canvas, 500ms):
- Anel com 8 ferramentas ao redor do dedo; arrastar para selecionar (estilo GoodNotes)
- Disponível em qualquer device touch (`pointerType: touch` ou `coarse: pointer`)

**Painéis (stickers/OCR/pages)** mobile:
- Convertidos em **bottom sheet** (anchored em baixo, 60% height) com drag-handle, não `fixed inset-0`

**Pinch zoom em touch**:
- 2 dedos: gesture nativo aplicando zoom; standalone (sem caneta)
- 1 dedo: desenha
- Adiciona `touch-action: none` refinado e `pointerevents` multi-toque

**Eraser cursor visível**:
- Resolvido: cursor circular seguindo o pointer com `mix-blend-difference`

### 2.4 Paleta e cores recentes

- Novo `lastColors: string[]` persistido por tool no `useEditorStore` (máx 8 cores), exibido acima da paleta fixa
- Cores exibidas em ファブ trimmed `grid-cols-8`, maiores (32px) e mais espaçadas para touch
- Eyedropper (`Eyedropper` icon): clica pega cor de uma área do canvas

### 2.5 Snap-to-grid e alinhamento

- `snappingEnabled: boolean` no editor store
- Enquanto arrasta shape/sticker com snap ligado, magnetiza para grid do template (linhas/quadros) a cada `gridSize` (default 8px)
- Guias de alinhamento centralizado com outros itens (linhas vermelhas tracejadas)

### 2.6 Lasso multi-seleção

- Após lasso, itens dentro entram em `selectedIds: string[]` em vez de só o primeiro
- Movimentação conjunta via drag em qualquer item do grupo
- Context menu funciona no grupo (duplicar/excluir todos)

### 2.7 Auto-scroll quando caneta atinge borda

- `useCanvasPointer` dispara pan automático quando ponteiro está a <40px de qualquer borda enquanto desenha (interval rAF)

### 2.8 Outros incrementos

- **Text tool**: duplo clique edita independente da tool ativa (não só sticker)
- **Eyedropper tool**: `I` pega cor
- **Undo/redo buttons**: presentes na dock mobile flutuante
- **Botão voltar** usa `router.back()` do Next em vez de `window.history.back()`
- **Save status**: mesmo em mobile visível no menu ⋯

## 3. Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `lib/types.ts` | Expandir `ToolType`, adicionar `BrushStyle`, `FillAction`, `pointerType` em `Stroke` |
| `lib/store/use-editor-store.ts` | Adicionar `brush*`, `marker*`, `fillColor`, `lastColors[]`, `snappingEnabled`, `selectedIds[]`, `isTouch` |
| `components/editor/hooks/use-canvas-pointer.ts` | Pressure-aware drawing, shape draw mode, fill mode, palm rejection, multi-touch pinch, lasso-multi, auto-pan, snap |
| `components/editor/planner-editor.tsx` | Responsividade top bar, dock mobile flutuante, radial menu, bottom sheets, paleta recente, snap guides |
| `components/editor/context-menu.tsx` | Suporte a grupo de seleção |
| `components/editor/radial-menu.tsx` (novo) | Componente do menu radial touch |
| `components/editor/bottom-sheet.tsx` (novo) | Wrapper bottom sheet reutilizável |
| `components/editor/color-palette.tsx` (novo) | Paleta com cores recentes + eyedropper |

## 4. Aplicação em fases

**Fase 1** (high, sem quebrar nada): tipos + store + brush/marker + pressure + eraser cursor fix
**Fase 2** (high): shapes-tools direto no canvas + fill bucket
**Fase 3** (high): refatoração responsiva top bar + dock mobile flutuante
**Fase 4** (medium): radial menu touch + bottom sheets + pinch zoom + palm rejection
**Fase 5** (medium): snapping + lasso multi + auto-pan + paleta recente + eyedropper
**Fase 6** (low): text-edits-on-dblclick-any-tool + nav router.back

## 5. Edição de elementos nível Canva (fase adicional solicitada)

Depois das fases 1-6, o usuário pediu para aproximar a edição de elementos ao nível do **Canva**: seleção, redimensionamento e manipulação avançada. Estado atual ainda é rudimentar:

- 1 único resize handle (`br` apenas)
- Sem rotação de shapes
- Sem redimensionamento de notas/textos (tamanho fixo 120×120 e fonte fixa)
- Sem edição inline via toolbar flutuante
- Sem multi-seleção drag (seleciona, mas arrasta só um)
- Sem alinhamento/distribuição em lote
- Sem lock explícito (só sticker tem)
- Copiar/colar inexistente
- Arrastar seleciona item mas não dá feedback visual de "estou segurando"
- Sem menu de contexto por item com ações ricas (alinhamento, ordem z, opacidade)

### 5.1 Novo que será adicionado

| Feature | Descrição |
|---------|-----------|
| **Resize com 8 handles** | NW, N, NE, E, SE, S, SW, W — proporcional (shift) ou livre |
| **Rotate handle** | Acima do item selecionado, circular, com snap a 15° (shift) |
| **Sticky note resizable** | Pode mudar w/h (default 120×120) |
| **Text resizable** | Ajusta `fontSize` via handle E/W, mantém line-height |
| **Multi-drag** | Arrastar qualquer item do `selectedIds` move todos |
| **Context toolbar flutuante** | Aparece acima da seleção com ações rápidas (delete, duplicate, lock, align, opacity, order z, edit) |
| **Align/Distribute** | Alinhar esquerda/centro/direita/topo/meio/base, distribuir horizontal/vertical |
| **Lock/Unlock por item** | Lock em qualquer item (sticker/shape/note/text); locked não seleciona nem move |
| **Opacity por item** | Slider 0-100% para stickers/shapes/notes |
| **Copy/Paste** | Ctrl+C/Ctrl+V (duplica seleção com offset) |
| **Drag feedback** | Cursor muda, item fica ligeiramente transparente durante drag, bounding box mais grossa |
| **Agrupar (group)** | Criar `GroupItem` que referencia vários ids; move/resize/rotate juntos |
| **Undo granular** | Cada commit ja tem undo; garantir que lote de ops (multi-drag) seja uma única entrada |

### 5.2 Mudanças no modelo de dados (`lib/types.ts`)

- `StickyNote`: adicionar `width`, `height`, `opacity?`
- `TextItem`: já tem `fontSize`; adicionar `width?` para caixa de texto fixa
- `ShapeItem`: já tem `rotation?`; adicionar `opacity?`
- `StickerInstance`: adicionar `opacity?`
- Novo `GroupItem { id, itemIds: string[], x, y, width, height }` em `CanvasData.groups`

### 5.3 Arquitetura

- **`use-canvas-pointer.ts`**: refatorar seleção em um `SelectionState` único (unifica sticker/shape/note/text); implementar 8-handle resize com cálculo de anchor oposto; rotate handle com cálculo angular; multi-drag com offsets relativos.
- **`planner-editor.tsx`**: renderizar `<SelectionOverlay>` que abstrai qualquer seleção (handles + rotate + toolbar flutuante); adicionar keyboard shortcuts (Ctrl+C/V/X, Ctrl+A, Ctrl+G, Ctrl+Shift+G, Delete, Ctrl+D já existe).
- **`components/editor/selection-overlay.tsx`** (novo): componente dedicado para handles, rotate, alignment guides, context toolbar.
- **`components/editor/align-toolbar.tsx`** (novo): botões de alinhar/distribuir/agrupar.

### 5.4 Fases desta entrega

**Fase 7**: Modelo de dados (types + sticky note resizable) + 8-handle resize para stickers/shapes
**Fase 8**: Rotate handle + snap 15°
**Fase 9**: Multi-drag (selectedIds) + multi-select via Shift+click
**Fase 10**: Selection overlay com toolbar flutuante (delete/dup/lock/align/opacity/order)
**Fase 11**: Align/distribute + group/ungroup
**Fase 12**: Copy/paste + drag feedback + opacity por item
