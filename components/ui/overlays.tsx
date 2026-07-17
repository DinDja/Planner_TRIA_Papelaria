'use client'

import { cn } from '@/lib/utils'
import { Dialog } from '@base-ui/react/dialog'
import { Popover } from '@base-ui/react/popover'
import { Tabs } from '@base-ui/react/tabs'
import { Tooltip } from '@base-ui/react/tooltip'
import { X } from 'lucide-react'
import * as React from 'react'

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
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-200" />
      <Dialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/50 bg-popover p-6 shadow-2xl',
          className,
        )}
      >
        {!hideClose && (
          <Dialog.Close className="absolute right-4 top-4 rounded-xl p-1.5 hover:bg-muted transition-colors">
            <X size={18} />
          </Dialog.Close>
        )}
        {title && <Dialog.Title className="text-lg font-semibold mb-1">{title}</Dialog.Title>}
        {description && (
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            {description}
          </Dialog.Description>
        )}
        {children}
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
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <Popover.Portal>
      <Popover.Positioner>
        <Popover.Popup
          className={cn(
            'z-50 rounded-2xl border border-border/50 bg-popover p-4 shadow-xl glass',
            className,
          )}
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
      <Tooltip.Positioner>
        <Tooltip.Popup
          className={cn(
            'z-50 rounded-xl border border-border/60 bg-popover px-3 py-1.5 text-xs shadow-lg glass',
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
        'inline-flex items-center gap-1 rounded-2xl bg-muted p-1',
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
          'inline-flex items-center justify-center rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
          state.active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
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
    <Tabs.Panel value={value} className={cn('mt-3', className)}>
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
