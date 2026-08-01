'use client'

import { getListKindMeta } from '@/lib/lists'
import { List, Luggage, Pill, ShoppingCart } from 'lucide-react'

const KIND_ICONS = {
  supermercado: ShoppingCart,
  farmacia: Pill,
  mala: Luggage,
  custom: List,
} as const

export function ListKindIcon({
  kind,
  size = 18,
  color,
}: {
  kind?: string
  size?: number
  color?: string
}) {
  const Icon = KIND_ICONS[getListKindMeta(kind).kind]
  return <Icon size={size} style={color ? { color } : undefined} aria-hidden />
}
