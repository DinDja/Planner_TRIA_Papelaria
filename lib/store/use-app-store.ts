'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CanvasData, Folder, Planner, PlannerPage, Tag } from '../types'
import { EMPTY_CANVAS } from '../types'

const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()

interface AppState {
  planners: Planner[]
  folders: Folder[]
  tags: Tag[]
  theme: 'light' | 'dark'

  setTheme: (t: 'light' | 'dark') => void

  addPlanner: (
    p: Pick<Planner, 'name' | 'category' | 'color' | 'icon'> & Partial<Planner>,
  ) => string
  addPlannerWithPages: (
    p: Pick<Planner, 'name' | 'category' | 'color' | 'icon'> & Partial<Planner>,
    pages: { title: string; template: PlannerPage['template'] }[],
  ) => string
  updatePlanner: (id: string, patch: Partial<Planner>) => void
  deletePlanner: (id: string) => void
  toggleFavorite: (id: string) => void

  addPage: (plannerId: string, template?: PlannerPage['template']) => void
  deletePage: (plannerId: string, pageId: string) => void
  updatePageData: (plannerId: string, pageId: string, data: CanvasData) => void
  updatePageTemplate: (plannerId: string, pageId: string, template: PlannerPage['template']) => void

  addFolder: (name: string, color: string) => void
  deleteFolder: (id: string) => void

  addTag: (name: string, color: string) => void
  deleteTag: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      planners: [],
      folders: [],
      tags: [],
      theme: 'light',

      setTheme: (theme) => set({ theme }),

      addPlanner: (data) => {
        const now = nowISO()
        const id = `pl-${uid()}`
        const planner: Planner = {
          ...data,
          id,
          favorite: false,
          folderId: data.folderId ?? null,
          tags: data.tags ?? [],
          pages: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ planners: [...s.planners, planner] }))
        return id
      },

      addPlannerWithPages: (data, pages) => {
        const now = nowISO()
        const id = `pl-${uid()}`
        const plannerPages: PlannerPage[] = pages.map((p, i) => ({
          id: `${id}-pg-${i}`,
          title: p.title,
          template: p.template,
          data: { strokes: [], stickers: [], texts: [], shapes: [], stickyNotes: [] },
        }))
        const planner: Planner = {
          ...data,
          id,
          favorite: false,
          folderId: data.folderId ?? null,
          tags: data.tags ?? [],
          pages: plannerPages,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ planners: [...s.planners, planner] }))
        return id
      },

      updatePlanner: (id, patch) =>
        set((s) => ({
          planners: s.planners.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p,
          ),
        })),

      deletePlanner: (id) =>
        set((s) => ({ planners: s.planners.filter((p) => p.id !== id) })),

      toggleFavorite: (id) =>
        set((s) => ({
          planners: s.planners.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite, updatedAt: nowISO() } : p,
          ),
        })),

      addPage: (plannerId, template = 'blank') =>
        set((s) => ({
          planners: s.planners.map((p) => {
            if (p.id !== plannerId) return p
            const idx = p.pages.length
            return {
              ...p,
              updatedAt: nowISO(),
              pages: [
                ...p.pages,
                {
                  id: `pg-${uid()}`,
                  title: `Página ${idx + 1}`,
                  template,
                  data: { ...EMPTY_CANVAS },
                },
              ],
            }
          }),
        })),

      deletePage: (plannerId, pageId) =>
        set((s) => ({
          planners: s.planners.map((p) =>
            p.id === plannerId
              ? { ...p, pages: p.pages.filter((pg) => pg.id !== pageId), updatedAt: nowISO() }
              : p,
          ),
        })),

      updatePageData: (plannerId, pageId, data) =>
        set((s) => ({
          planners: s.planners.map((p) =>
            p.id === plannerId
              ? {
                  ...p,
                  updatedAt: nowISO(),
                  pages: p.pages.map((pg) =>
                    pg.id === pageId ? { ...pg, data } : pg,
                  ),
                }
              : p,
          ),
        })),

      updatePageTemplate: (plannerId, pageId, template) =>
        set((s) => ({
          planners: s.planners.map((p) =>
            p.id === plannerId
              ? {
                  ...p,
                  updatedAt: nowISO(),
                  pages: p.pages.map((pg) =>
                    pg.id === pageId ? { ...pg, template } : pg,
                  ),
                }
              : p,
          ),
        })),

      addFolder: (name, color) =>
        set((s) => {
          const id = `fld-${uid()}`
          return { folders: [...s.folders, { id, name, color }] }
        }),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          planners: s.planners.map((p) =>
            p.folderId === id ? { ...p, folderId: null } : p,
          ),
        })),

      addTag: (name, color) =>
        set((s) => {
          const id = `tag-${uid()}`
          return { tags: [...s.tags, { id, name, color }] }
        }),

      deleteTag: (id) =>
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== id),
          planners: s.planners.map((p) => ({
            ...p,
            tags: p.tags.filter((t) => t !== id),
          })),
        })),
    }),
    {
      name: 'plannerhub-storage',
      partialize: (state) => ({
        planners: state.planners,
        folders: state.folders,
        tags: state.tags,
        theme: state.theme,
      }),
    },
  ),
)
