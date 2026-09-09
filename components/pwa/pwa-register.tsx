'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Não foi possível preparar o Tria para instalação.', error)
    })
  }, [])

  return null
}
