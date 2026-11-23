'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/primitives'

/**
 * Input para valores monetários em BRL.
 * - Armazena internamente em centavos (number)
 * - Exibe formatado como "R$ 1.234,56"
 * - Aceita digitação natural: "1234,56" ou "1234.56" ou "1.234,56"
 */
interface CurrencyInputProps {
  /** Valor em centavos (ex: 3000 = R$ 30,00) */
  valueCents: number
  /** Callback com novo valor em centavos */
  onChange: (cents: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Mostra o valor formatado abaixo do input como feedback visual */
  showPreview?: boolean
  /** Label do campo */
  label?: string
  /** Mensagem de erro */
  error?: string
}

export function CurrencyInput({
  valueCents,
  onChange,
  placeholder = '0,00',
  disabled = false,
  className,
  showPreview = true,
  label,
  error,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Sincroniza displayValue quando valueCents muda externamente
  useEffect(() => {
    if (valueCents === 0) {
      setDisplayValue('')
    } else {
      setDisplayValue((valueCents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }))
    }
  }, [valueCents])

  const parseToCents = (input: string): number => {
    // Remove tudo que não é dígito, vírgula ou ponto
    const cleaned = input.replace(/[^\d.,]/g, '')

    if (!cleaned) return 0

    // Heurística: última vírgula ou ponto é separador decimal
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')

    if (lastComma > lastDot) {
      // Formato brasileiro: 1.234,56
      const integerPart = cleaned.slice(0, lastComma).replace(/\./g, '')
      const decimalPart = cleaned.slice(lastComma + 1).padEnd(2, '0').slice(0, 2)
      return Math.round(Number(integerPart + decimalPart))
    } else if (lastDot > lastComma) {
      // Formato US/internacional: 1,234.56 ou 1234.56
      const integerPart = cleaned.slice(0, lastDot).replace(/,/g, '')
      const decimalPart = cleaned.slice(lastDot + 1).padEnd(2, '0').slice(0, 2)
      return Math.round(Number(integerPart + decimalPart))
    } else {
      // Sem separador decimal — assume centavos inteiros
      return Math.round(Number(cleaned) * 100)
    }
  }

  const formatForDisplay = (cents: number): string => {
    if (cents === 0) return ''
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplayValue(raw)

    const cents = parseToCents(raw)
    onChange(cents)
  }

  const handleBlur = () => {
    // Re-formata ao perder foco para padronizar visual
    const cents = parseToCents(displayValue)
    setDisplayValue(formatForDisplay(cents))
    onChange(cents)
  }

  const handleFocus = () => {
    // Ao focar, mostra valor "limpo" para edição fácil
    if (valueCents > 0) {
      setDisplayValue((valueCents / 100).toFixed(2).replace('.', ','))
    }
  }

  const formattedPreview = valueCents > 0
    ? (valueCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : null

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 pointer-events-none select-none"
          aria-hidden="true"
        >
          R$
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-7 pr-10 text-right font-mono text-sm',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          )}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : showPreview && formattedPreview ? `${label}-preview` : undefined}
        />
        {valueCents > 0 && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setDisplayValue('')
              onChange(0)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Limpar valor"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {(showPreview && formattedPreview) || error ? (
        <div
          id={error ? `${label}-error` : `${label}-preview`}
          className={cn(
            'mt-1.5 text-xs transition-opacity',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
          role="status"
          aria-live="polite"
        >
          {error ? error : `Valor: ${formattedPreview}`}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Versão simplificada — apenas exibe o valor formatado (read-only)
 */
export function CurrencyDisplay({
  valueCents,
  className,
  hideZero = false,
}: {
  valueCents: number
  className?: string
  hideZero?: boolean
}) {
  if (hideZero && valueCents === 0) return null

  const formatted = valueCents === 0
    ? 'Grátis'
    : (valueCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })

  return (
    <span className={cn('font-mono font-medium', className)}>
      {formatted}
    </span>
  )
}

/**
 * Input para percentual (cupons) — similar ao CurrencyInput mas para %
 */
export function PercentInput({
  value,
  onChange,
  placeholder = '10',
  disabled = false,
  className,
  label,
  error,
}: {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  error?: string
}) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    setDisplayValue(value === 0 ? '' : String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    const num = raw ? Math.min(100, Math.max(0, Number(raw))) : 0
    setDisplayValue(raw)
    onChange(num)
  }

  const handleBlur = () => {
    const num = displayValue ? Math.min(100, Math.max(0, Number(displayValue))) : 0
    setDisplayValue(num === 0 ? '' : String(num))
    onChange(num)
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-7 text-right font-mono text-sm',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          )}
          aria-label={label}
          aria-invalid={!!error}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 pointer-events-none select-none"
          aria-hidden="true"
        >
          %
        </span>
      </div>
      {error && (
        <div className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}