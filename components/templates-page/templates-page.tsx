'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { useSettingsStore } from '@/lib/store/use-settings-store'
import {
  PLANNER_TEMPLATES,
  PLANNER_TEMPLATE_CATEGORIES,
  type PlannerTemplate,
} from '@/lib/planner-templates'
import { cn } from '@/lib/utils'
import {
  Calendar,
  GraduationCap,
  Heart,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Tab, TabList, Tabs } from '../ui/overlays'
import { Badge, ScrollArea } from '../ui/primitives'
import { toast } from '../ui/toaster'
import { TemplateThumbnail } from './template-thumbnail'

type IdOrAll = 'Todos' | string

const categoryIcons: Record<string, typeof Calendar> = {
  'Planejamento': Calendar,
  'Estudos': GraduationCap,
  'Business': Calendar,
  'Saúde': Heart,
  'Finanças': Calendar,
  'Receitas': Calendar,
  'Wedding Planner': Heart,
  'Teacher Planner': GraduationCap,
  'Life Planner': Sparkles,
}

const categoryColors: Record<string, string> = {
  'Planejamento': '#e05b6d',
  'Estudos': '#5b8dbf',
  'Business': '#c9b6e4',
  'Saúde': '#7bb686',
  'Finanças': '#f0b429',
  'Receitas': '#e8a0a0',
  'Wedding Planner': '#e8a0a0',
  'Teacher Planner': '#5b8dbf',
  'Life Planner': '#e05b6d',
}

const enter = 'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both'

export function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<IdOrAll>('Todos')
  const addPlannerWithPages = useAppStore((s) => s.addPlannerWithPages)
  const gradBadges = useSettingsStore((s) => s.gradients.badges)
  const router = useRouter()

  const filtered = useMemo(() => {
    if (activeTab === 'Todos') return PLANNER_TEMPLATES
    return PLANNER_TEMPLATES.filter((t) => t.category === activeTab)
  }, [activeTab])

  const handleUseTemplate = (tpl: PlannerTemplate) => {
    const iconName = tpl.icon
    const id = addPlannerWithPages(
      {
        name: tpl.name,
        category: 'diario' as any,
        color: tpl.color,
        icon: iconName,
      },
      tpl.pages,
    )
    toast({ title: 'Template aplicado!', description: `${tpl.pages.length} páginas criadas.` })
    router.push(`/planner/${id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className={cn('mb-8', enter)}>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Explore templates premium para começar seus planners rapidamente.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className={cn('mb-6 -mx-2 px-2', enter)} style={{ animationDelay: '70ms' }}>
          <TabList className="no-scrollbar">
            <Tab value="Todos">Todos</Tab>
            {PLANNER_TEMPLATE_CATEGORIES.slice(1).map((c) => {
              const Icon = categoryIcons[c] ?? Calendar
              return (
                <Tab key={c} value={c}>
                  <Icon size={14} className="mr-1.5" style={{ color: categoryColors[c] ?? '#6b7280' }} />
                  {c}
                </Tab>
              )
            })}
          </TabList>
        </ScrollArea>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum template nesta categoria ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((tpl, i) => {
              const firstPage = tpl.pages[0]
              const accent = categoryColors[tpl.category] ?? tpl.color
              return (
                <Card
                  key={tpl.id}
                  hover
                  className={cn('group cursor-pointer flex flex-col', enter)}
                  style={{ animationDelay: `${(i % 8) * 60 + 120}ms` }}
                  onClick={() => handleUseTemplate(tpl)}
                >
                  {/* thumbnail em pilha de papel */}
                  <div className="relative rounded-xl border border-border/40 bg-[color:light-dark(#f4f2ed,#1b1b19)] px-4 pt-4 pb-3 overflow-hidden">
                    {/* brilho sutil da categoria */}
                    <div
                      className="absolute -top-10 -right-10 size-32 rounded-full blur-3xl opacity-15 pointer-events-none"
                      style={{ backgroundColor: accent }}
                    />
                    <div className="relative mx-auto w-[74%] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-[-1.2deg]">
                      {/* folhas atrás */}
                      <div
                        aria-hidden
                        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[2.5deg] rounded-[4px] bg-[color:light-dark(#e7e4dc,#242422)] shadow-sm"
                      />
                      <div className="relative overflow-hidden rounded-[4px] ring-1 ring-black/[0.07] dark:ring-white/10 shadow-lift bg-[color:light-dark(#ffffff,#2a2a28)]">
                        {firstPage && (
                          <TemplateThumbnail
                            template={firstPage.template}
                            className="block w-full"
                          />
                        )}
                      </div>
                      {/* badge PRO */}
                      {tpl.premium && (
                        <span
                          data-grad="badge"
                          className="absolute -top-2 -right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-amber-950 shadow-md"
                          style={{
                            background: gradBadges
                              ? 'linear-gradient(90deg, #fbbf24, #fde047)'
                              : '#fbbf24',
                          }}
                        >
                          <Sparkles size={9} />
                          PRO
                        </span>
                      )}
                    </div>

                    {/* mini strip das outras páginas */}
                    {tpl.pages.length > 1 && (
                      <div className="relative flex gap-1.5 mt-3">
                        {tpl.pages.slice(1, 4).map((page, j) => (
                          <div
                            key={j}
                            className="flex-1 overflow-hidden rounded-[3px] ring-1 ring-border/50 shadow-sm opacity-80 bg-[color:light-dark(#ffffff,#2a2a28)]"
                          >
                            <TemplateThumbnail
                              template={page.template}
                              width={60}
                              className="block w-full"
                            />
                          </div>
                        ))}
                        {tpl.pages.length > 4 && (
                          <div className="flex items-center justify-center flex-1 rounded-[3px] ring-1 ring-border/50 bg-muted/60 text-[10px] text-muted-foreground font-semibold">
                            +{tpl.pages.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{tpl.name}</h3>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                        <Layers size={10} />
                        {tpl.pages.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-transparent"
                        style={{ backgroundColor: accent + '14', color: accent }}
                      >
                        {tpl.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={tpl.premium ? 'outline' : 'default'}
                    className="w-full mt-3 rounded-xl text-xs shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseTemplate(tpl)
                    }}
                  >
                    Usar template
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </Tabs>
    </div>
  )
}
