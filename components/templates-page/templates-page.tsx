'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import {
  PLANNER_TEMPLATES,
  PLANNER_TEMPLATE_CATEGORIES,
  type PlannerTemplate,
} from '@/lib/planner-templates'
import {
  Calendar,
  GraduationCap,
  Heart,
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

export function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<IdOrAll>('Todos')
  const addPlannerWithPages = useAppStore((s) => s.addPlannerWithPages)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Explore templates premium para começar seus planners rapidamente.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="mb-6 -mx-2 px-2">
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
            {filtered.map((tpl) => {
              const firstPage = tpl.pages[0]
              return (
                <Card
                  key={tpl.id}
                  hover
                  className="group cursor-pointer overflow-hidden flex flex-col"
                  onClick={() => handleUseTemplate(tpl)}
                >
                  {/* thumbnail */}
                  <div className="relative rounded-xl mb-3 border border-border/40 overflow-hidden bg-[color:light-dark(#fafafa,#1e1e1c)]">
                    {firstPage && (
                      <TemplateThumbnail
                        template={firstPage.template}
                        aspectRatio={1.0}
                        className="w-full"
                      />
                    )}
                    {tpl.premium && (
                      <Badge className="absolute top-2 right-2 bg-yellow-400/90 text-yellow-900 text-[10px] font-bold px-2.5 py-0.5">
                        PRO
                      </Badge>
                    )}
                    {/* page count overlay */}
                    <div className="absolute bottom-2 right-2 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {tpl.pages.length} pág
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-sm">{tpl.name}</h3>
                    <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {tpl.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={tpl.premium ? 'outline' : 'default'}
                    className="w-full mt-3 rounded-xl text-xs"
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