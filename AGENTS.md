# PlannerHub

Next.js 16 + React 19 + Tailwind CSS v4. Canvas digital planner.

## Commands
- `pnpm dev` — dev server
- `pnpm build` — build
- `pnpm lint` — ESLint

## Project Structure
- `app/` — pages (dashboard, editor, templates, plans)
- `components/` — UI, layout, editor, pages
- `lib/` — types, mock data, templates, stickers, Zustand stores
- `app/(app)/` — route group with AppShell
- `app/planner/[id]/` — canvas editor (full-screen)

## Key Architecture
- **State**: Zustand v5 — useAppStore (persist/localStorage), useEditorStore (transient)
- **Canvas**: HTML5 Canvas (template bg) + SVG overlay (perfect-freehand strokes)
- **UI**: shadcn/base-ui components; cn() utility
- **Language**: pt-BR
- **Data**: Fully client-side, mock data

## Code Conventions
- `'use client'` on interactive components
- `cn()` for class merging
- Deep-clone pattern for canvas data: `JSON.parse(JSON.stringify(data))`
- Undo/redo per pageId, max 50 entries

## Memory
See `.opencode/memory/project.md` for full codebase index.