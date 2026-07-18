'use client'

import { useSettingsStore, PALETTES } from '@/lib/store/use-settings-store'
import type { FontScale, GradientArea, RadiusPreset, SystemPaletteId } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Check,
  Eye,
  Grid3X3,
  Rainbow,
  Palette,
  RotateCcw,
  Settings2,
  Square,
  Type,
} from 'lucide-react'
import { Dialog, DialogContent } from '../ui/overlays'
import { Button } from '../ui/button'
import { Separator, Switch } from '../ui/primitives'
import { toast } from '../ui/toaster'

interface Props {
  open: boolean
  onClose: () => void
}

const GRADIENT_AREAS: { id: GradientArea; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Gradientes no título e cartões da home' },
  { id: 'covers', label: 'Capas de planners', desc: 'Brilho diagonal nas capas' },
  { id: 'charts', label: 'Gráficos', desc: 'Preenchimento gradiente nos gráficos' },
  { id: 'badges', label: 'Emblemas premium', desc: 'Brilho dourado/roxo dos selos' },
]

const RADIUS_OPTIONS: { id: RadiusPreset; label: string }[] = [
  { id: 'sharp', label: 'Reto' },
  { id: 'soft', label: 'Suave' },
  { id: 'rounded', label: 'Arredondado' },
  { id: 'pill', label: 'Pílula' },
]

const FONT_SCALE_OPTIONS: { id: FontScale; label: string }[] = [
  { id: 'sm', label: 'Compacto' },
  { id: 'base', label: 'Padrão' },
  { id: 'lg', label: 'Grande' },
]

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Rainbow
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon size={15} />
        </div>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>}
        </div>
      </header>
      <div className="pl-9.5">{children}</div>
    </section>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

export function SettingsDialog({ open, onClose }: Props) {
  const s = useSettingsStore()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Configurações do sistema"
        description="Personalize a aparência e comportamento do PlannerHub."
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-7">
          {/* ── Paleta de cores ──────────────────────────────────────── */}
          <Section icon={Palette} title="Paleta de cores" desc="Define a cor de destaque do app.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PALETTES.map((p) => {
                const isActive = s.palette === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => s.setPalette(p.id)}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-2xl border p-2.5 transition-all duration-200 cursor-pointer',
                      isActive
                        ? 'border-transparent shadow-md scale-[1.02]'
                        : 'border-border/60 hover:border-border hover:bg-muted/40',
                    )}
                    style={
                      isActive
                        ? { boxShadow: `0 0 0 2px ${p.swatch}, 0 4px 12px -4px ${p.swatch}66` }
                        : undefined
                    }
                  >
                    <div
                      className="flex size-9 items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: p.swatch }}
                    >
                      {isActive && <Check size={14} strokeWidth={3} className="text-white drop-shadow-sm" />}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold leading-tight truncate">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {p.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Section>

          <Separator />

          {/* ── Gradientes ───────────────────────────────────────────── */}
          <Section
            icon={Rainbow}
            title="Gradientes"
            desc="Escolha em quais lugares usar efeitos de gradiente."
          >
            <div className="flex flex-col divide-y divide-border/40">
              {GRADIENT_AREAS.map((g) => (
                <ToggleRow
                  key={g.id}
                  label={g.label}
                  desc={g.desc}
                  checked={s.gradients[g.id]}
                  onChange={(v) => s.setGradient(g.id, v)}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => s.setGradients(true)}
              >
                Ativar todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => s.setGradients(false)}
              >
                Desativar todos
              </Button>
            </div>
          </Section>

          <Separator />

          {/* ── Raios & tipografia ───────────────────────────────────── */}
          <Section
            icon={Square}
            title="Forma e tipografia"
            desc="Ajuste o arredondamento dos cantos e tamanho das fontes."
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium mb-2">Arredondamento dos cantos</p>
                <div className="grid grid-cols-4 gap-2">
                  {RADIUS_OPTIONS.map((r) => {
                    const isActive = s.radius === r.id
                    return (
                      <button
                        key={r.id}
                        onClick={() => s.setRadius(r.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all cursor-pointer',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/60 hover:bg-muted/40',
                        )}
                      >
                        <div
                          className="size-5 border-2 border-current"
                          style={{
                            borderRadius:
                              r.id === 'sharp' ? '2px' :
                              r.id === 'soft' ? '6px' :
                              r.id === 'rounded' ? '12px' :
                              '999px',
                          }}
                        />
                        <span className="text-[11px] font-medium">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Type size={12} /> Tamanho da fonte
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_SCALE_OPTIONS.map((f) => {
                    const isActive = s.fontScale === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => s.setFontScale(f.id)}
                        className={cn(
                          'rounded-xl border py-2 text-center transition-all cursor-pointer',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border/60 hover:bg-muted/40 text-sm',
                        )}
                        style={{
                          fontSize: f.id === 'sm' ? '13px' : f.id === 'base' ? '15px' : '17px',
                        }}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </Section>

          <Separator />

          {/* ── Aparência avançada ─────────────────────────────────── */}
          <Section
            icon={Eye}
            title="Aparência avançada"
            desc="Efeitos visuais do editor e interface."
          >
            <div className="flex flex-col divide-y divide-border/40">
              <ToggleRow
                label="Glassmorphism"
                desc="Efeito de vidro fosco (blur) em painéis e janelas."
                checked={s.glassUI}
                onChange={s.setGlassUI}
              />
              <ToggleRow
                label="Textura de papel"
                desc="Grão sutil no fundo das páginas do editor."
                checked={s.paperGrain}
                onChange={s.setPaperGrain}
              />
              <ToggleRow
                label="Superfície de mesa"
                desc="Fundo decorativo de mesa ao redor do papel."
                checked={s.deskBackground}
                onChange={s.setDeskBackground}
              />
              <ToggleRow
                label="Reduzir movimento"
                desc="Desativa animações e transições."
                checked={s.reduceMotion}
                onChange={s.setReduceMotion}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Comportamento ──────────────────────────────────────── */}
          <Section
            icon={Settings2}
            title="Comportamento"
            desc="Preferências de uso, confirmação e salvamento."
          >
            <div className="flex flex-col divide-y divide-border/40">
              <ToggleRow
                label="Confirmar exclusões"
                desc="Sempre pedir confirmação ao excluir planners e páginas."
                checked={s.confirmDelete}
                onChange={s.setConfirmDelete}
              />
              <ToggleRow
                label="Salvamento automático"
                desc="Salvar alterações automaticamente (recomendado)."
                checked={s.autoSave}
                onChange={s.setAutoSave}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Ações ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground"
              onClick={() => {
                s.reset()
                toast({ title: 'Configurações restauradas', variant: 'success' })
              }}
            >
              <RotateCcw size={14} className="mr-1.5" />
              Restaurar padrões
            </Button>
            <Button onClick={onClose} className="rounded-xl">
              Concluído
            </Button>
          </div>

          {/* Mini preview ao vivo */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Grid3X3 size={12} /> Pré-visualização
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Badge primário
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  s.gradients.badges
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
                    : 'bg-amber-400 text-white',
                )}
              >
                Premium
              </span>
              <Button size="sm" className="rounded-xl">Botão</Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Switch:</span>
                <Switch checked aria-label="Exemplo" onCheckedChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
