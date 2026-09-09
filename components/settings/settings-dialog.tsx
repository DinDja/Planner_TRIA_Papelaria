'use client'

import { useSettingsStore } from '@/lib/store/use-settings-store'
import { useProfileStore } from '@/lib/store/use-profile-store'
import type { FontScale, RadiusPreset } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ContactRound,
  Palette,
  RotateCcw,
  Settings2,
  Square,
  Type,
} from 'lucide-react'
import { Dialog, DialogContent } from '../ui/overlays'
import { Button } from '../ui/button'
import { Input, Separator, Switch } from '../ui/primitives'
import { toast } from '../ui/toaster'

interface Props {
  open: boolean
  onClose: () => void
}

const BRAND_COLORS = [
  { label: 'Rosa', value: '#d1bdb8' },
  { label: 'Mostarda', value: '#b76f06' },
  { label: 'Verde', value: '#6a634d' },
  { label: 'Bege', value: '#ddd6c6' },
] as const

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
  icon: typeof Palette
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
  const name = useProfileStore((state) => state.name)
  const email = useProfileStore((state) => state.email)
  const setName = useProfileStore((state) => state.setName)
  const setEmail = useProfileStore((state) => state.setEmail)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Configurações do sistema"
        description="Personalize a aparência e comportamento da TRIA."
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-7">
          {/* ── Dados da conta ──────────────────────────────────────── */}
          <Section
            icon={ContactRound}
            title="Dados da conta"
            desc="Como você é identificado dentro da TRIA. As alterações são salvas automaticamente."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium" htmlFor="settings-account-name">
                Nome
                <Input
                  id="settings-account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium" htmlFor="settings-account-email">
                E-mail
                <Input
                  id="settings-account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </label>
            </div>
          </Section>

          <Separator />

          {/* ── Paleta de cores ──────────────────────────────────────── */}
          <Section icon={Palette} title="Paleta" desc="Identidade fixa do sistema, com predominância do rosa.">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BRAND_COLORS.map((color) => (
                <div
                  key={color.value}
                  className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card p-2.5"
                >
                  <span
                    className="size-9 shrink-0 rounded-xl border border-foreground/10"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">{color.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{color.value}</p>
                  </div>
                </div>
              ))}
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

        </div>
      </DialogContent>
    </Dialog>
  )
}
