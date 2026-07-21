'use client'

import { cn } from '@/lib/utils'
import { Dialog } from '@base-ui/react/dialog'
import { Popover } from '@base-ui/react/popover'
import { Tabs } from '@base-ui/react/tabs'
import { Tooltip } from '@base-ui/react/tooltip'
import { X } from 'lucide-react'
import * as React from 'react'

// ─── Animações base-ui (data-starting-style / data-ending-style) ─────────────

const backdropAnim =
  'transition-[opacity] duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0'

const popupAnim =
  'transition-[opacity,scale,translate] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.95] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:duration-100'

const floatingAnim =
  'transition-[opacity,scale] duration-150 ease-out origin-[var(--transform-origin)] data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98]'

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function DialogWrapper({ open, onOpenChange, children }: DialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      {children}
    </Dialog.Root>
  )
}

function DialogTriggerW({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <Dialog.Trigger className={className}>{children}</Dialog.Trigger>
}

function DialogContentW({
  children,
  className,
  title,
  description,
  hideClose,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  hideClose?: boolean
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop
        className={cn('fixed inset-0 z-50 bg-black/45 backdrop-blur-md', backdropAnim)}
      />
      <Dialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-border/50 bg-popover shadow-2xl outline-none max-h-[85dvh]',
          popupAnim,
          className,
        )}
      >
        {!hideClose && (
          <Dialog.Close className="absolute right-3.5 top-3.5 z-10 rounded-full border border-border/50 bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm hover:bg-muted hover:text-foreground hover:rotate-90 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <X size={15} />
          </Dialog.Close>
        )}
        <div className="overflow-y-auto overscroll-contain scrollbar-thin rounded-[inherit] p-4 sm:p-6">
          {title && <Dialog.Title className="text-lg font-semibold mb-1 pr-10">{title}</Dialog.Title>}
          {description && (
            <Dialog.Description className="text-sm text-muted-foreground mb-4 pr-6">
              {description}
            </Dialog.Description>
          )}
          {children}
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

// ─── Popover ──────────────────────────────────────────────────────────────────

function PopoverW({
  children,
  className,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Popover.Root>
  )
}

function PopoverTriggerW({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <Popover.Trigger className={className}>{children}</Popover.Trigger>
}

function PopoverContentW({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  style?: React.CSSProperties
}) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={6}>
        <Popover.Popup
          className={cn(
            'z-50 rounded-2xl border border-border/50 bg-popover p-3 shadow-xl glass outline-none',
            floatingAnim,
            className,
          )}
          style={style}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function TooltipW({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Tooltip.Root>{children}</Tooltip.Root>
}

function TooltipTriggerW({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: React.MouseEventHandler
}) {
  return <Tooltip.Trigger className={className} onClick={onClick}>{children}</Tooltip.Trigger>
}

function TooltipContentW({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner sideOffset={8}>
        <Tooltip.Popup
          className={cn(
            'z-50 rounded-xl border border-border/60 bg-popover px-3 py-1.5 text-xs font-medium shadow-lg glass',
            floatingAnim,
            className,
          )}
        >
          {children}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TabsW({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className={className}>
      {children}
    </Tabs.Root>
  )
}

function TabListW({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tabs.List
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-muted/70 border border-border/40 p-1',
        className,
      )}
    >
      {children}
    </Tabs.List>
  )
}

function TabW({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tabs.Tab
      value={value}
      className={(state) =>
        cn(
          'inline-flex items-center justify-center rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none cursor-pointer',
          state.active
            ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
          className,
        )
      }
    >
      {children}
    </Tabs.Tab>
  )
}

function TabPanelW({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tabs.Panel value={value} className={cn('mt-3 outline-none', className)}>
      {children}
    </Tabs.Panel>
  )
}

export {
  DialogWrapper as Dialog,
  DialogTriggerW as DialogTrigger,
  DialogContentW as DialogContent,
  PopoverW as Popover,
  PopoverTriggerW as PopoverTrigger,
  PopoverContentW as PopoverContent,
  TooltipW as Tooltip,
  TooltipTriggerW as TooltipTrigger,
  TooltipContentW as TooltipContent,
  TabsW as Tabs,
  TabListW as TabList,
  TabW as Tab,
  TabPanelW as TabPanel,
}
