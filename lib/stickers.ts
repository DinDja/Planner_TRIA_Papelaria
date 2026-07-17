import type { StickerDef } from './types'
import { EXTRA_STICKERS } from './stickers-extra'

export const STICKER_CATEGORIES = [
  'Estudos',
  'Trabalho',
  'Financas',
  'Emojis',
  'Flores',
  'Animais',
  'Minimalista',
  'Kawaii',
  'Vintage',
  'Tecnologia',
  'Viagem',
  'Fitness',
  'Datas comemorativas',
] as const

const s = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`

export const STICKERS: StickerDef[] = [
  // Formas
  {
    id: 'heart',
    name: 'Coração',
    category: 'Kawaii',
    svg: s('<path d="M50 88 C20 64 8 46 8 32 C8 18 19 10 30 10 C39 10 46 15 50 22 C54 15 61 10 70 10 C81 10 92 18 92 32 C92 46 80 64 50 88Z" fill="#e05b6d"/>'),
  },
  {
    id: 'star',
    name: 'Estrela',
    category: 'Minimalista',
    svg: s('<path d="M50 6 L61 36 L94 38 L68 58 L77 92 L50 72 L23 92 L32 58 L6 38 L39 36 Z" fill="#f0b429"/>'),
  },
  {
    id: 'sparkle',
    name: 'Brilho',
    category: 'Kawaii',
    svg: s('<path d="M50 5 C54 30 60 40 95 50 C60 60 54 70 50 95 C46 70 40 60 5 50 C40 40 46 30 50 5Z" fill="#f7d070"/>'),
  },
  {
    id: 'cloud',
    name: 'Nuvem',
    category: 'Minimalista',
    svg: s('<path d="M28 76 A16 16 0 0 1 26 44 A22 22 0 0 1 68 36 A18 18 0 0 1 76 76 Z" fill="#a5c8e4"/>'),
  },
  {
    id: 'moon',
    name: 'Lua',
    category: 'Vintage',
    svg: s('<path d="M66 10 A42 42 0 1 0 90 62 A34 34 0 0 1 66 10Z" fill="#c9b6e4"/>'),
  },
  {
    id: 'rainbow',
    name: 'Arco-íris',
    category: 'Kawaii',
    svg: s('<path d="M10 80 A40 40 0 0 1 90 80" stroke="#e05b6d" stroke-width="8" fill="none"/><path d="M22 80 A28 28 0 0 1 78 80" stroke="#f0b429" stroke-width="8" fill="none"/><path d="M34 80 A16 16 0 0 1 66 80" stroke="#7bb686" stroke-width="8" fill="none"/>'),
  },
  // Natureza
  {
    id: 'flower',
    name: 'Flor',
    category: 'Flores',
    svg: s('<g fill="#f2a7bb"><circle cx="50" cy="24" r="16"/><circle cx="76" cy="42" r="16"/><circle cx="66" cy="72" r="16"/><circle cx="34" cy="72" r="16"/><circle cx="24" cy="42" r="16"/></g><circle cx="50" cy="50" r="13" fill="#f0b429"/>'),
  },
  {
    id: 'leaf',
    name: 'Folha',
    category: 'Flores',
    svg: s('<path d="M50 8 C82 28 86 66 50 92 C14 66 18 28 50 8Z" fill="#7bb686"/><path d="M50 20 L50 84" stroke="#4e8a5c" stroke-width="3"/>'),
  },
  {
    id: 'sun',
    name: 'Sol',
    category: 'Flores',
    svg: s('<circle cx="50" cy="50" r="22" fill="#f0b429"/><g stroke="#f0b429" stroke-width="6" stroke-linecap="round"><line x1="50" y1="6" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="94"/><line x1="6" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="94" y2="50"/><line x1="19" y1="19" x2="27" y2="27"/><line x1="73" y1="73" x2="81" y2="81"/><line x1="19" y1="81" x2="27" y2="73"/><line x1="73" y1="27" x2="81" y2="19"/></g>'),
  },
  {
    id: 'butterfly',
    name: 'Borboleta',
    category: 'Animais',
    svg: s('<g fill="#c9b6e4"><path d="M48 50 C20 20 4 30 10 52 C14 68 34 66 48 54Z"/><path d="M52 50 C80 20 96 30 90 52 C86 68 66 66 52 54Z"/><path d="M48 54 C26 60 20 82 34 88 C44 92 50 74 50 60Z"/><path d="M52 54 C74 60 80 82 66 88 C56 92 50 74 50 60Z"/></g><rect x="47" y="34" width="6" height="34" rx="3" fill="#6b5b8a"/>'),
  },
  // Fitas (washi tape)
  {
    id: 'washi-rose',
    name: 'Fita rosa',
    category: 'Kawaii',
    svg: s('<rect x="4" y="34" width="92" height="32" fill="#f2a7bb" opacity="0.85"/><g fill="#ffffff" opacity="0.5"><circle cx="18" cy="50" r="4"/><circle cx="38" cy="50" r="4"/><circle cx="58" cy="50" r="4"/><circle cx="78" cy="50" r="4"/></g>'),
  },
  {
    id: 'washi-stripe',
    name: 'Fita listrada',
    category: 'Vintage',
    svg: s('<rect x="4" y="34" width="92" height="32" fill="#a5c8e4" opacity="0.85"/><g stroke="#ffffff" stroke-width="5" opacity="0.5"><line x1="12" y1="30" x2="24" y2="70"/><line x1="32" y1="30" x2="44" y2="70"/><line x1="52" y1="30" x2="64" y2="70"/><line x1="72" y1="30" x2="84" y2="70"/></g>'),
  },
  {
    id: 'washi-sage',
    name: 'Fita verde',
    category: 'Minimalista',
    svg: s('<rect x="4" y="34" width="92" height="32" fill="#7bb686" opacity="0.8"/><g fill="#ffffff" opacity="0.45"><rect x="14" y="44" width="12" height="12" rx="2"/><rect x="44" y="44" width="12" height="12" rx="2"/><rect x="74" y="44" width="12" height="12" rx="2"/></g>'),
  },
  // Marcadores
  {
    id: 'check-badge',
    name: 'Feito',
    category: 'Trabalho',
    svg: s('<circle cx="50" cy="50" r="42" fill="#7bb686"/><path d="M30 52 L44 66 L72 36" stroke="#ffffff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  },
  {
    id: 'important',
    name: 'Importante',
    category: 'Trabalho',
    svg: s('<circle cx="50" cy="50" r="42" fill="#e05b6d"/><rect x="44" y="24" width="12" height="34" rx="6" fill="#ffffff"/><circle cx="50" cy="72" r="7" fill="#ffffff"/>'),
  },
  {
    id: 'pin',
    name: 'Alfinete',
    category: 'Minimalista',
    svg: s('<circle cx="50" cy="34" r="24" fill="#f0b429"/><circle cx="42" cy="27" r="8" fill="#ffffff" opacity="0.5"/><path d="M50 56 L50 92" stroke="#8a7035" stroke-width="6" stroke-linecap="round"/>'),
  },
  {
    id: 'flag',
    name: 'Bandeira',
    category: 'Minimalista',
    svg: s('<rect x="24" y="8" width="7" height="84" rx="3.5" fill="#8a7035"/><path d="M31 12 L82 24 L31 40 Z" fill="#e05b6d"/>'),
  },
  {
    id: 'arrow',
    name: 'Seta',
    category: 'Minimalista',
    svg: s('<path d="M10 50 L74 50 M54 28 L78 50 L54 72" stroke="#5b8dbf" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  },
]

export const ALL_STICKERS: StickerDef[] = [...STICKERS, ...EXTRA_STICKERS]

export function stickerToDataUrl(def: StickerDef): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(def.svg)}`
}

export function getSticker(id: string): StickerDef | undefined {
  return STICKERS.find((st) => st.id === id)
}
