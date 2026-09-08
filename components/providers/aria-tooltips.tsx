'use client'

import { useEffect } from 'react'

const TOOLTIP_TARGETS =
  'button, a, input, select, textarea, [role="button"], [role="switch"], [role="tab"]'

/**
 * Mantém o tooltip nativo alinhado ao rótulo acessível dos controles.
 * A observação do DOM também cobre botões criados dentro de diálogos.
 */
export function AriaTooltips() {
  useEffect(() => {
    const applyTooltips = () => {
      document.querySelectorAll<HTMLElement>(TOOLTIP_TARGETS).forEach((element) => {
        const label = element.getAttribute('aria-label')?.trim()
        if (!label) return

        const generatedTooltip = element.dataset.ariaTooltip
        if (element.hasAttribute('title') && !generatedTooltip) return

        element.setAttribute('title', label)
        element.dataset.ariaTooltip = label
      })
    }

    applyTooltips()
    const observer = new MutationObserver(applyTooltips)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-label'],
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return null
}
