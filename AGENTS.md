# PlannerHub

Next.js 16 + React 19 + Tailwind CSS v4. Canvas digital planner.

## Commands
- `pnpm dev` — dev server
- `pnpm build` — build (use `npm run build` if pnpm not installed)
- `pnpm lint` — ESLint (⚠️ eslint not currently installed in node_modules — `npm run lint` fails with "'eslint' is not recognized". Install with `npm i -D eslint` if needed.)

## Project Structure
- `app/` — pages (dashboard, editor, templates, plans)
- `app/(app)/` — route group with AppShell + `RequireAuth` + `StoreSyncProvider`
- `app/planner/[id]/` — canvas editor (full-screen, also auth-guarded)
- `app/auth/` — login/cadastro/esqueci-senha (Firebase Auth)
- `components/` — UI, layout, editor, pages, auth, providers
- `lib/` — types, templates, stickers, Zustand stores, firebase, auth, db
- `firestore/` — schema.md, firestore.rules, firestore.indexes.json

## Key Architecture
- **State**: Zustand v5 — all data stores use `persist` (localStorage cache) AND sync to Firestore (see Backend)
- **Backend**: Firebase Auth + Firestore (Native mode). Multi-tenant strict: all data at `/users/{uid}/...`
  - `lib/firebase.ts` — init app/auth/firestore
  - `lib/auth/auth-context.tsx` — `AuthProvider` + `useAuth()` (signIn/signUp/Google/reset/logout)
  - `lib/auth/migrate.ts` — one-time localStorage → Firestore migration on first login
  - `lib/db/client.ts` — Firestore CRUD + `subscribeCollection` helpers
  - `lib/db/write-through.ts` — store → Firestore write-through (batches full collection rewrites)
  - `components/providers/store-sync-provider.tsx` — bidirectional sync: `onSnapshot` (Firestore→store) + `store.subscribe` (store→Firestore) for root doc + 36 collections. Loop-safe via `snapshotsEqual` guard.
- **Canvas**: HTML5 Canvas (template bg) + SVG overlay (perfect-freehand strokes)
- **UI**: shadcn/base-ui components; cn() utility
- **Language**: pt-BR
- **Data**: Firebase Firestore (source of truth) + localStorage cache (offline). No mock data.

## Code Conventions
- `'use client'` on interactive components
- `cn()` for class merging
- Deep-clone pattern for canvas data: `JSON.parse(JSON.stringify(data))`
- Undo/redo per pageId, max 50 entries
- Firebase config is in `lib/firebase.ts` (client-side, public apiKey only)

## Security Notes
- `usePasswordsStore` stores `masterPin` and passwords in plaintext in Firestore — NOT production-safe. See `firestore/schema.md` "Cofre de senhas" notes for hardening plan.
- Firestore rules (`firestore/firestore.rules`) enforce per-user ownership only. To deploy: `firebase deploy --only firestore:rules`.

## Memory
See `.opencode/memory/project.md` for full codebase index.

# Anti AI Design Slop

Este projeto não aceita interfaces genéricas, templates disfarçados ou decisões de design baseadas apenas em tendências.

Toda alteração de UI/UX deve priorizar identidade, contexto de uso e experiência real do usuário.

---

# Filosofia

O objetivo não é criar uma interface "bonita".

O objetivo é criar uma ferramenta que pareça construída especificamente para seu domínio.

Se uma decisão poderia ser aplicada em qualquer SaaS do mercado, provavelmente ela não é boa o suficiente.

Cada tela deve transmitir personalidade.

Cada componente deve justificar sua existência.

Cada pixel deve resolver um problema.

---

# Princípios

Antes de criar ou modificar qualquer interface, pergunte:

- Qual problema isto resolve?
- O usuário realmente precisa deste componente?
- Existe uma forma mais simples?
- Esta decisão melhora a experiência?
- Isto transmite identidade própria?
- Isto parece um template?
- Isto parece algo que uma IA faria automaticamente?

Se a resposta indicar baixa qualidade, reprojete.

---

# Nunca copie tendências

Evite reproduzir padrões encontrados em:

- ChatGPT
- Claude
- Gemini
- Vercel
- Linear
- Notion
- Supabase
- Clerk
- Stripe
- shadcn/ui examples
- Tailwind UI examples
- Aceternity UI
- Magic UI
- Origin UI
- React Bits
- Dribbble trends

Essas referências podem servir para estudo técnico, nunca para reprodução direta.

---

# AI Design Slop

Evite automaticamente:

- Dashboards SaaS genéricos
- Hero padrão
- Cards repetitivos
- Grid previsível
- Glassmorphism sem propósito
- Glow exagerado
- Gradientes neon
- Bordas excessivamente arredondadas
- Sombras exageradas
- Espaçamento artificial
- Componentes apenas decorativos
- Estatísticas falsas
- Gráficos ilustrativos sem função
- Landing pages padrão
- Layouts idênticos aos exemplos do shadcn/ui
- Seções copiadas de templates

---

# Componentes

Todo componente deve possuir:

- motivo para existir
- contexto de uso
- hierarquia clara
- função bem definida
- comportamento consistente

Nunca adicione componentes apenas porque "fica bonito".

---

# Iconografia

Os ícones são uma ferramenta de comunicação, não decoração.

Evite utilizar ícones apenas porque são populares, familiares ou a primeira opção da biblioteca.

Cada ícone deve possuir uma justificativa funcional.

Antes de escolher um ícone, pergunte:

- Este ícone representa corretamente esta funcionalidade?
- Existe uma metáfora visual melhor?
- O usuário entenderá sua função sem esforço?
- O ícone adiciona informação ou apenas ocupa espaço?

Se a resposta for negativa, substitua ou remova.

---

## Evite escolhas automáticas

Os seguintes ícones aparecem em milhares de projetos feitos com IA e devem ser questionados sempre que utilizados:

### Navegação

- Home
- House
- LayoutDashboard
- Menu
- PanelLeft
- Sidebar

### Usuário

- User
- Users
- UserRound
- CircleUser

### Configuração

- Settings
- Cog
- Sliders
- Wrench

### Conteúdo

- FileText
- Folder
- FolderOpen
- BookOpen
- Book
- Clipboard

### Ações

- Plus
- Pencil
- Trash
- Download
- Upload
- Search
- Eye
- EyeOff
- Check
- X

### Navegação

- ChevronRight
- ChevronLeft
- ArrowRight
- ArrowLeft

### IA

- Sparkles
- Brain
- Bot
- Zap
- Wand
- Stars

### Status

- Bell
- Shield
- Star
- Heart

Eles não são proibidos.

O problema é utilizá-los automaticamente sem refletir sobre sua adequação.

---

## Evite a síndrome do Lucide React

O objetivo não é eliminar o Lucide React.

O objetivo é eliminar escolhas previsíveis.

Uma interface deve ser reconhecida pelo produto, não pela biblioteca de ícones utilizada.

---

## Coerência

Toda a aplicação deve utilizar uma linguagem visual consistente.

Evite misturar metáforas.

Exemplo ruim:

- Livro para documentos
- Pasta para documentos
- Papel para documentos

Escolha uma metáfora e mantenha-a.

---

## Menos é melhor

Não coloque ícones:

- em todos os botões;
- em todos os títulos;
- em todos os cards;
- em todas as tabelas;
- em todos os menus.

Utilize-os apenas quando melhorarem a identificação, a velocidade de leitura ou a compreensão da interface.

---

## Auditoria obrigatória

Sempre que modificar uma tela:

- revise todos os ícones;
- remova os desnecessários;
- substitua escolhas genéricas por metáforas mais adequadas;
- mantenha consistência entre telas;
- explique por que um ícone foi mantido, removido ou substituído quando houver impacto na experiência do usuário.

# UX

Sempre priorize:

- menos cliques
- menor carga cognitiva
- feedback imediato
- navegação intuitiva
- acessibilidade
- consistência
- velocidade
- clareza

Nunca adicione complexidade para parecer profissional.

---

# Identidade

O projeto deve ser reconhecido pela forma como funciona, não pelos efeitos visuais.

A identidade deve surgir de:

- arquitetura da informação
- organização
- linguagem
- fluxos
- microinterações
- tipografia
- ritmo visual
- personalidade

Não de gradientes.

Não de sombras.

Não de animações.

---

# Refatoração

Ao modificar uma tela:

1. Analise sua função.
2. Identifique padrões genéricos.
3. Questione cada componente.
4. Elimine elementos sem propósito.
5. Reorganize a informação quando necessário.
6. Simplifique fluxos.
7. Melhore a hierarquia visual.
8. Reduza esforço cognitivo.
9. Preserve consistência.
10. Explique brevemente por que a nova solução é superior.

Nunca faça alterações apenas para "modernizar".

---

# Regra de Ouro

Se um Product Designer experiente conseguir olhar para a interface e dizer:

"Isso parece um template feito por IA."

Então o trabalho ainda não terminou.