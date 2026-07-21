<div align="center">

# 📒 Tria Papelaria

**Planner digital premium com escrita à mão, stickers e templates.**
Organize sua vida com fluidez e beleza — no navegador, sem backend.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-444?logo=zustand&logoColor=white)](https://github.com/pmndrs/zustand)

</div>

---

## ✨ Destaques (implementado)

- **Canvas vetorial de escrita natural** — traços suaves via `perfect-freehand`, com pressão, opacidade e espessura ajustáveis
- **13 templates de página** — em branco, pautado, pontilhado, grade, Cornell, diário, semanal, mensal, Kanban, checklist, hábitos, refeições, finanças e calendário
- **17 planners pré-montados** em 9 categorias (Planejamento, Estudos, Business, Saúde, Finanças, Receitas, Wedding, Teacher, Life)
- **Biblioteca de stickers** — 148 stickers estáticos + animações Lottie
- **Ferramentas de desenho** — caneta, lápis, marca-texto, borracha, régua, laço, texto, formas geométricas, sticky notes e pan
- **OCR de escrita manual** — reconhecimento offline via Tesseract.js
- **Undo/Redo robusto** — stacks por página (máx. 50 entradas)
- **Temas & personalização visual** — 7 paletas, gradientes por área, raio global, escala de fontes, efeito papel, glassmorphism, textura de mesa
- **Dashboard** — visão geral com planners recentes, favoritos, mini calendário, agenda do dia, metas, gráfico de atividade
- **Sidebar inteligente** — pastas, tags, planners recentes, tema, comando paleta (Ctrl+K)
- **Landing page** — página de apresentação com hero, features e CTA
- **Planos/Preços** — página de planos Free e Premium
- **100% client-side** — dados persistidos em `localStorage`, zero backend
- **UI em pt-BR**

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
| OCR           | Tesseract.js                                      |
| Dados         | Mock + localStorage                               |
| Linguagem     | TypeScript 5.7                                    |

---

## 🚀 Começando

### Pré-requisitos

- Node.js ≥ 20
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)

### Instalação

```bash
git clone <url-do-repo>
cd PlannerHub
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
│   ├── (app)/              # Route group com AppShell (sidebar + topbar)
│   │   ├── page.tsx         # Dashboard
│   │   ├── plans/           # Planos/Preços
│   │   └── templates/       # Galeria de templates
│   ├── planner/[id]/       # Editor canvas full-screen
│   ├── landing/            # Landing page
│   ├── globals.css          # Tokens de tema
│   └── layout.tsx           # Root layout + providers
├── components/
│   ├── ui/                  # Primitivos (button, card, overlays, etc.)
│   ├── layout/              # AppShell, sidebar, topbar, command palette
│   ├── dashboard/           # Dashboard + criar planner
│   ├── editor/              # Canvas editor + hooks (canvas pointer, OCR)
│   ├── landing/             # Landing page
│   ├── plans-page/          # Planos/Preços
│   ├── templates-page/      # Galeria de templates
│   ├── settings/            # Configurações visuais
│   └── providers/           # Theme + Settings providers
├── lib/
│   ├── types.ts             # Tipos centrais (Canvas, Planner, Settings)
│   ├── mock-data.ts         # Dados mock
│   ├── planner-templates.ts # 17 planners pré-montados
│   ├── templates.ts         # Desenho dos 13 templates de página
│   ├── stickers*.ts         # Bibliotecas de stickers (148)
│   ├── utils.ts             # cn() e helpers
│   └── store/
│       ├── use-app-store.ts     # Zustand persistido
│       ├── use-editor-store.ts  # Estado do editor
│       └── use-settings-store.ts# Preferências visuais
```

---

## 🗺️ Mapa do Sistema — CheckPlanner

### ✅ Implementado

| Domínio           | Funcionalidades                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| **Editor Canvas** | Caneta, lápis, marca-texto, borracha, régua, laço, texto, formas, sticky notes |
| **Templates**     | 13 templates de página + 17 planners pré-montados em 9 categorias              |
| **Stickers**      | 148 stickers estáticos e Lottie                                                |
| **Dashboard**     | Planners recentes, favoritos, mini calendário, agenda, metas, atividade        |
| **Organização**   | Pastas, tags, planners, favoritos                                              |
| **Rotina**        | Tarefas únicas, tarefas recorrentes (diária/semanal/mensal), pendências avulsas, rotina ideal com blocos de horário |
| **Calendário**    | Visualização mensal com grade, eventos com horário/all-day, navegação entre meses, integração com tarefas da Rotina |
| **Finanças**      | Transações (receitas/despesas), contas fixas, assinaturas, cartões de crédito com limite, parcelamentos, metas financeiras, caixinhas |
| **Metas Financeiras** | Página dedicada com visão geral (total guardado/meta/progresso), grid de metas com barra de progresso, aportes individuais com timeline, indicador de prazo |
| **Hábitos**       | Criação de hábitos (diário/semanal/mensal), toggle diário, streak, mini heatmap dos últimos 35 dias, arquivamento, filtro ativos/arquivados |
| **Temas**         | 7 paletas, gradientes, raio, escala fonte, papel, glass, textura mesa          |
| **Landing Page**  | Hero, features, estatísticas, CTA                                              |
| **Planos**        | Free / Premium mensal / Premium anual (UI apenas)                              |
| **OCR**           | Reconhecimento de escrita manual via Tesseract.js                              |

### ❌ Não Implementado (a construir)

| Domínio                         | Funcionalidades Pendentes                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Checklists**                  | Listas verificáveis (apenas template de canvas)                                                    |
| **Frases Favoritas**            | Armazenamento de citações e frases importantes                                                     |
| **Caixa de Memórias**           | Registro de momentos felizes                                                                       |
| **Cofre de Senhas**             | Gerenciamento de credenciais                                                                       |
| **Saúde**                       | Peso, medidas corporais, sintomas, medicamentos, ciclo menstrual, consultas, médicos, exames       |
| **Personalização do Menu**      | Organização dos módulos conforme preferência do usuário                                            |
| **Conta e Admin**               | Perfil, notificações, gerenciamento de planos real, lixeira, ajuda                                |

---

## 🏗️ Arquitetura

### Camada de estado

- **`useAppStore`** — fonte única de verdade dos planners, páginas, pastas e tags. Persiste automaticamente em `localStorage`.
- **`useEditorStore`** — estado transitório do editor (ferramenta ativa, cor/tamanho/opacidade, zoom, pan, undo/redo).
- **`useSettingsStore`** — preferências visuais globais (paleta, gradientes, raio, fonte, papel, glass…).

### Editor de canvas

- O fundo da página (template) é desenhado em `<canvas>` HTML5.
- Os traços vivem em um overlay SVG renderizado com `perfect-freehand`.
- Stickers podem ser SVG estático ou player Lottie.

### Padrões de código

- Componentes interativos usam `'use client'`.
- Classes condicionais sempre via `cn()` de `@/lib/utils`.
- Undo/redo keyado por `pageId`, limite de 50 entradas por página.
- Toda a UI em português brasileiro.

---

## 🎨 Personalização visual

| Preferência        | Opções                                                       |
| ------------------ | ------------------------------------------------------------ |
| Paleta             | amber, rose, ocean, forest, lavender, sunset, mono           |
| Gradientes         | dashboard, covers, charts, badges (liga/desliga por área)    |
| Raio               | sharp, soft, rounded, pill                                   |
| Escala de fontes   | sm, base, lg                                                 |
| Efeito papel       | grão no editor                                               |
| Glassmorphism      | elementos de UI                                              |
| Textura de mesa    | ao redor do papel no editor                                  |
| Reduzir animações  | preferência de movimento                                     |

---

## 🛣️ Roadmap (próximos passos)

### Prioridade Alta
- [x] Módulo de Rotina (tarefas, tarefas recorrentes, pendências)
- [x] Módulo de Calendário completo
- [x] Módulo Financeiro (receitas, despesas, cartões, parcelamentos, assinaturas, caixinhas)
- [x] Metas Financeiras (página dedicada com aportes e timeline)
- [x] Módulo de Hábitos dedicado

### Prioridade Média
- [ ] Módulo de Saúde (peso, medidas, sintomas, medicamentos, ciclo, consultas, médicos, exames)
- [ ] Diário Digital (escrita livre e guiada)
- [ ] Notas
- [ ] Listas (personalizadas, supermercado)
- [ ] Wishlist
- [ ] Checklists como módulo dedicado

### Prioridade Baixa
- [ ] Retrospectivas e Eventos Pessoais
- [ ] Frases Favoritas
- [ ] Caixa de Memórias
- [ ] Cofre de Senhas
- [ ] Personalização do Menu
- [ ] Conta (perfil, notificações, planos reais, lixeira, ajuda)

### Infraestrutura
- [ ] Sincronização com nuvem (backend + auth)
- [ ] Exportação para PDF / PNG / impressão
- [ ] Colaboração em tempo real

---

## 📄 Licença

Distribuído sob licença MIT.

<div align="center">

Feito com 💛 para quem ama planejar.

</div>
