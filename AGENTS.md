# PlannerHub — Digital Planner App

Next.js 16 + React 19 + Tailwind CSS v4. Canvas-based bullet journal/digital planner editor.

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint

## Project Structure
- `app/` — Next.js App Router pages (dashboard, editor, templates, plans)
- `components/` — UI primitives, layout shell, dashboard, editor, pages
- `lib/` — Types, mock data, templates, stickers, Zustand stores
- `app/(app)/` — Route group wrapped with AppShell (sidebar + topbar)
- `app/planner/[id]/` — Canvas editor (full-screen, standalone)

## Key Architecture
- **State**: Zustand v5 — `useAppStore` persists to localStorage; `useEditorStore` is transient
- **Canvas**: HTML5 Canvas for template backgrounds + SVG overlay for strokes (perfect-freehand)
- **UI**: shadcn/base-ui components; cn() utility for class merging
- **Language**: All UI in Brazilian Portuguese (pt-BR)
- **Data**: Fully client-side with mock data (no backend yet)

## Code Conventions
- All interactive components use `'use client'`
- Use `cn()` from `@/lib/utils` for conditional class merging
- Tool-specific settings (color, size, opacity) accessed via `getToolColor()`, `getToolSize()`, `getToolOpacity()` from editor store
- Canvas data updates follow deep-clone pattern: `JSON.parse(JSON.stringify(data))`
- Undo/redo stacks are keyed by pageId, max 50 entries per page

## Memory
For detailed codebase index, see `.opencode/memory/project.md`.
