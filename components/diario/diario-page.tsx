'use client'

import { DiarioGate } from './diario-gate'
import { JournalPage } from '@/components/journal/journal-page'

/**
 * O Diário volta ao fluxo do caderno tradicional do marco anterior à
 * refatoração manuscrita. O acesso continua isolado no gate atual: trocar a
 * experiência do caderno não altera a senha nem o estado de desbloqueio.
 */
export function DiarioPage() {
  return (
    <DiarioGate>
      <JournalPage />
    </DiarioGate>
  )
}
