<div align="center">

# 📒 PlannerHub

**Planner digital premium com escrita à mão, stickers e templates.**
Organize sua vida com fluidez e beleza — no navegador, sem backend.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-444?logo=zustand&logoColor=white)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](#contribuindo)

</div>

---

## ✨ Destaques

- **Canvas vetorial de escrita natural** — traços suaves via `perfect-freehand`, com pressão, opacidade e espessura ajustáveis
- **13 templates de página** — em branco, pautado, pontilhado, grade, Cornell, diário, semanal, mensal, Kanban, checklist, hábitos, refeições, finanças e calendário
- **Biblioteca de stickers** — SVGs estáticos + animações **Lottie** via CDN
- **Ferramentas completas** — caneta, lápis, marca-texto, borracha, régua, laço, texto, formas geométricas, sticky notes e pan
- **Undo / Redo robusto** — stacks por página (máx. 50 entradas), acessíveis por atalhos de teclado
- **Temas & personalização** — 7 paletas, gradientes configuráveis por área, raio global, escala de fontes, efeito de papel, glassmorphism e textura de mesa
- **100% client-side** — dados persistem em `localStorage`, zero backend, pronto para deploy estático
- **UI em pt-BR** — pensada do zero no idioma brasileiro

---

## 🧱 Stack

| Camada        | Tecnologia                                        |
| ------------- | ------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                           |
| UI            | React 19, Tailwind CSS v4, shadcn + base-ui       |
| Estado        | Zustand v5 (`localStorage` para app store)        |
| Canvas        | HTML5 Canvas + SVG overlay                        |
| Traços        | `perfect-freehand`                                |
| Animações     | Framer Motion, tw-animate-css, Lottie             |
| Ícones        | lucide-react                                      |
| Dados/remoto  | SWR (reservado), dados mock                       |
| Linguagem     | TypeScript 5.7                                    |

---

## 🚀 Começando

### Pré-requisitos

- Node.js ≥ 20
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)

### Instalação

```bash
git clone <url-do-repo>
cd Planner_TRIA_Papelaria
pnpm install
```

### Scripts

| Comando        | Descrição                                  |
| -------------- | ------------------------------------------ |
| `pnpm dev`     | Inicia o servidor de desenvolvimento       |
| `pnpm build`   | Build de produção                          |
| `pnpm start`   | Serve o build de produção                  |
| `pnpm lint`    | Roda o ESLint                              |

Abra [http://localhost:3000](http://localhost:3000) para visualizar.

---

## 📂 Estrutura do projeto

```
.
├── app/
│   ├── (app)/              # Route group envolvido pelo AppShell (sidebar + topbar)
│   │   ├── page.tsx         # Dashboard
│   │   ├── plans/           # Gestão de planners
│   │   └── templates/       # Galeria de templates
│   ├── planner/[id]/       # Editor canvas full-screen (standalone)
│   ├── globals.css          # Tokens de tema (paletas, gradientes, raio)
│   └── layout.tsx           # Root layout + providers
├── components/
│   ├── ui/                  # Primitivos shadcn/base-ui
│   ├── layout/              # AppShell, sidebar, topbar
│   ├── dashboard/           # Visão geral, criação de planners
│   ├── editor/              # Canvas editor + hooks
│   ├── pages/               # Templates de página renderizados
│   ├── plans-page/          # Tela de planners
│   ├── templates-page/      # Tela de templates
│   ├── settings/            # Preferências do sistema
│   └── providers/          # Theme + Settings providers
├── lib/
│   ├── types.ts             # Tipos centrais (Canvas, Planner, Settings)
│   ├── mock-data.ts         # Dados mock
│   ├── planner-templates.ts # Definições de templates
│   ├── templates.ts         # Templates de página
│   ├── stickers*.ts         # Bibliotecas de stickers
│   ├── utils.ts             # cn() e helpers
│   └── store/
│       ├── use-app-store.ts     # Zustand persistido (planners, pastas, tags)
│       ├── use-editor-store.ts  # Estado transitório do editor
│       └── use-settings-store.ts # Preferências de UI (paleta, raio, etc.)
```

---

## 🏗️ Arquitetura

### Camada de estado

- **`useAppStore`** — fonte única de verdade dos planners, páginas, pastas e tags. Persiste automaticamente em `localStorage`.
- **`useEditorStore`** — estado transitório do editor (ferramenta ativa, cor/tamanho/opacidade, zoom, pan). Não persiste.
- **`useSettingsStore`** — preferências visuais globais (paleta, gradientes, raio, escala de fonte, efeito papel, glassmorphism…).

> Atalhos por ferramenta: obtenha cor/tamanho/opacidade via `getToolColor()`, `getToolSize()`, `getToolOpacity()` do editor store.

### Editor de canvas

- O **fundo da página** (template) é desenhado em `<canvas>` HTML5.
- Os **traços** vivem em um overlay **SVG** renderizado com `perfect-freehand`, garantindo nitidez vetorial e zoom sem perda.
- Stickers podem ser SVG estático ou player **Lottie** (URL `.json`/`.lottie` em CDN).
- Atualizações de canvas seguem o padrão deep-clone: `JSON.parse(JSON.stringify(data))`.

### Padrões de código

- Componentes interativos usam `'use client'`.
- Classes condicionais sempre via `cn()` de `@/lib/utils`.
- Undo/redo é keyado por `pageId`, limite de 50 entradas por página.
- Toda a UI é escrita em **português brasileiro**.

---

## 🎨 Personalização visual

As preferências ficam em **Configurações** e são controladas por `useSettingsStore`:

| Preferência        | Opções                                                       |
| ------------------ | ------------------------------------------------------------ |
| Paleta             | amber (padrão), rose, ocean, forest, lavender, sunset, mono  |
| Gradientes         | dashboard, covers, charts, badges (liga/desliga por área)    |
| Raio               | sharp, soft, rounded, pill                                   |
| Escala de fontes   | sm, base, lg                                                 |
| Efeito papel       | grão no editor                                               |
| Glassmorphism      | elementos de UI                                              |
| Textura de mesa    | ao redor do papel no editor                                  |
| Reduzir animações  | preferência de movimento                                     |
| Confirmar exclusão | planners / páginas                                           |

---

## 🛣️ Roadmap

- [ ] Sincronização com nuvem (backend + auth)
- [ ] Exportação para PDF / PNG
- [ ] Colaboração em tempo real
- [ ] Reatividade nativa a caneta stylus (Pointer Events Pressure)
- [ ] Biblioteca de stickers personalizada pelo usuário

---

## Contribuindo

Contribuições são bem-vindas! O fluxo sugerido:

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feat/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona X'`)
4. Push na branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

Antes de submeter, rode `pnpm lint` e `pnpm build` para garantir que tudo passa.

---

## 📄 Licença

Distribuído sob licença MIT. Veja [`LICENSE`](./LICENSE) para mais detalhes.

<div align="center">

Feito com 💛 para quem ama planejar.

</div>