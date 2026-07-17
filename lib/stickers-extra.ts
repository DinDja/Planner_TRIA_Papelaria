import type { StickerDef } from './types'

const s = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`

export const EXTRA_STICKERS: StickerDef[] = [
  {
    id: 'book',
    name: 'Livro',
    category: 'Estudos',
    svg: s('<path d="M28 16 L28 82 C32 76 40 72 50 72 C60 72 68 76 72 82 L72 16 C68 22 60 26 50 26 C40 26 32 22 28 16Z" fill="#5b8dbf"/><path d="M50 26 L50 72" stroke="#3a6080" stroke-width="2"/>'),
  },
  {
    id: 'lamp',
    name: 'Lâmpada',
    category: 'Estudos',
    svg: s('<path d="M34 18 Q34 4 50 4 Q66 4 66 18 Q66 34 50 36 Q34 34 34 18Z" fill="#f0b429"/><rect x="46" y="34" width="8" height="10" rx="2" fill="#b0a090"/><rect x="42" y="42" width="16" height="4" rx="2" fill="#a0a0a0"/><line x1="40" y1="22" x2="28" y2="14" stroke="#f0b429" stroke-width="2"/><line x1="60" y1="22" x2="72" y2="14" stroke="#f0b429" stroke-width="2"/>'),
  },
  {
    id: 'coffee',
    name: 'Café',
    category: 'Trabalho',
    svg: s('<rect x="22" y="20" width="44" height="48" rx="8" fill="#c9b6e4"/><path d="M66 36 Q86 36 86 52 Q86 66 66 62" stroke="#c9b6e4" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="28" y="30" width="16" height="24" rx="4" fill="#ffffff" opacity="0.4"/>'),
  },
  {
    id: 'briefcase',
    name: 'Maleta',
    category: 'Trabalho',
    svg: s('<rect x="14" y="34" width="72" height="48" rx="6" fill="#8b7aaa"/><rect x="34" y="20" width="32" height="20" rx="6" fill="#8b7aaa"/><rect x="44" y="26" width="12" height="6" rx="3" fill="#6b5a8a"/>'),
  },
  {
    id: 'wallet',
    name: 'Carteira',
    category: 'Financas',
    svg: s('<rect x="14" y="30" width="72" height="46" rx="8" fill="#7bb686"/><rect x="14" y="62" width="46" height="14" rx="4" fill="#5a9b65"/><circle cx="64" cy="68" r="6" fill="#5a9b65"/>'),
  },
  {
    id: 'coin',
    name: 'Moeda',
    category: 'Financas',
    svg: s('<circle cx="50" cy="50" r="40" fill="#f0b429"/><circle cx="50" cy="50" r="30" stroke="#d4942a" stroke-width="4" fill="none"/><text x="50" y="60" text-anchor="middle" font-size="28" font-weight="bold" fill="#d4942a">$</text>'),
  },
  {
    id: 'smile',
    name: 'Sorriso',
    category: 'Emojis',
    svg: s('<circle cx="50" cy="50" r="42" fill="#f0b429"/><circle cx="35" cy="40" r="6" fill="#5c3d1a"/><circle cx="65" cy="40" r="6" fill="#5c3d1a"/><path d="M30 62 Q50 82 70 62" stroke="#5c3d1a" stroke-width="5" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'laughing',
    name: 'Rindo',
    category: 'Emojis',
    svg: s('<circle cx="50" cy="50" r="42" fill="#f7d070"/><circle cx="35" cy="38" r="5" fill="#5c3d1a"/><circle cx="65" cy="38" r="5" fill="#5c3d1a"/><path d="M28 64 Q50 98 72 64" stroke="#5c3d1a" stroke-width="4" fill="#5c3d1a" opacity="0.3"/>'),
  },
  {
    id: 'tulip',
    name: 'Tulipa',
    category: 'Flores',
    svg: s('<rect x="46" y="52" width="8" height="40" rx="2" fill="#7bb686"/><ellipse cx="42" cy="28" rx="14" ry="18" fill="#f7a0b0" transform="rotate(-15,42,28)"/><ellipse cx="58" cy="28" rx="14" ry="18" fill="#f7a0b0" transform="rotate(15,58,28)"/><ellipse cx="50" cy="24" rx="12" ry="16" fill="#f7b8c0"/>'),
  },
  {
    id: 'rose',
    name: 'Rosa',
    category: 'Flores',
    svg: s('<circle cx="50" cy="34" r="18" fill="#e05b6d"/><circle cx="38" cy="50" r="16" fill="#e55b6d"/><circle cx="62" cy="50" r="16" fill="#e55b6d"/><circle cx="50" cy="62" r="14" fill="#ea6b7d"/><rect x="47" y="72" width="6" height="22" rx="3" fill="#7bb686"/>'),
  },
  {
    id: 'cat',
    name: 'Gatinho',
    category: 'Animais',
    svg: s('<circle cx="50" cy="50" r="38" fill="#e8a0a0"/><polygon points="28,26 22,4 36,20" fill="#e8a0a0"/><polygon points="72,26 78,4 64,20" fill="#e8a0a0"/><circle cx="36" cy="44" r="5" fill="#333"/><circle cx="64" cy="44" r="5" fill="#333"/><ellipse cx="44" cy="58" rx="4" ry="2" fill="#333"/><path d="M46 62 L50 64 L54 62" stroke="#333" stroke-width="2" fill="none"/>'),
  },
  {
    id: 'dog',
    name: 'Cachorrinho',
    category: 'Animais',
    svg: s('<circle cx="50" cy="50" r="34" fill="#d4b070"/><ellipse cx="34" cy="30" rx="16" ry="12" fill="#c49a50"/><ellipse cx="66" cy="30" rx="16" ry="12" fill="#c49a50"/><circle cx="32" cy="46" r="4" fill="#333"/><circle cx="60" cy="46" r="4" fill="#333"/><ellipse cx="46" cy="56" rx="7" ry="5" fill="#333"/><path d="M46 60 Q49 66 52 60" stroke="#333" stroke-width="2" fill="none"/>'),
  },
  {
    id: 'bird',
    name: 'Passarinho',
    category: 'Animais',
    svg: s('<circle cx="50" cy="50" r="30" fill="#a5c8e4"/><circle cx="38" cy="42" r="4" fill="#333"/><polygon points="58,50 78,42 74,58" fill="#f0b429"/><path d="M52 40 L56 34" stroke="#f0b429" stroke-width="3"/>'),
  },
  {
    id: 'fita-kawaii',
    name: 'Fita fofa',
    category: 'Kawaii',
    svg: s('<rect x="4" y="30" width="92" height="40" fill="#f7a0b0" opacity="0.8"/><circle cx="22" cy="50" r="3" fill="#fff" opacity="0.7"/><circle cx="50" cy="50" r="3" fill="#fff" opacity="0.7"/><circle cx="78" cy="50" r="3" fill="#fff" opacity="0.7"/>'),
  },
  {
    id: 'star-face',
    name: 'Estrela feliz',
    category: 'Kawaii',
    svg: s('<polygon points="50,5 60,36 94,38 68,56 76,90 50,70 24,90 32,56 6,38 40,36" fill="#f0b429"/><circle cx="42" cy="48" r="4" fill="#333"/><circle cx="58" cy="48" r="4" fill="#333"/><path d="M44 60 Q50 68 56 60" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>'),
  },
  {
    id: 'envelope',
    name: 'Envelope',
    category: 'Vintage',
    svg: s('<rect x="12" y="28" width="76" height="50" rx="4" fill="#d4c0a0"/><path d="M12 28 L50 56 L88 28" stroke="#b09a7a" stroke-width="3" fill="none" stroke-linejoin="round"/>'),
  },
  {
    id: 'key',
    name: 'Chave',
    category: 'Vintage',
    svg: s('<circle cx="40" cy="40" r="14" stroke="#d4b060" stroke-width="8" fill="none"/><rect x="40" y="36" width="48" height="8" rx="3" fill="#d4b060"/><rect x="78" y="26" width="6" height="28" rx="2" fill="#d4b060"/><rect x="80" y="30" width="16" height="8" rx="2" fill="#d4b060"/>'),
  },
  {
    id: 'phone',
    name: 'Celular',
    category: 'Tecnologia',
    svg: s('<rect x="24" y="10" width="52" height="80" rx="10" fill="#6b8fb0"/><rect x="30" y="18" width="40" height="56" rx="2" fill="#a5c8e4"/><rect x="38" y="82" width="24" height="4" rx="2" fill="#4a6f8a"/>'),
  },
  {
    id: 'headphones',
    name: 'Fones',
    category: 'Tecnologia',
    svg: s('<path d="M16 40 C16 18 84 18 84 40" stroke="#c9b6e4" stroke-width="10" fill="none"/><rect x="10" y="40" width="22" height="26" rx="10" fill="#c9b6e4"/><rect x="68" y="40" width="22" height="26" rx="10" fill="#c9b6e4"/><rect x="42" y="16" width="16" height="4" rx="2" fill="#c9b6e4"/>'),
  },
  {
    id: 'plane',
    name: 'Avião',
    category: 'Viagem',
    svg: s('<path d="M50 8 L80 60 L56 56 L50 82 L44 56 L20 60 Z" fill="#a5c8e4"/><path d="M50 12 L44 56" stroke="#6b8fb0" stroke-width="3"/><path d="M52 26 L64 22 L62 30 Z" fill="#5b8dbf"/><path d="M48 26 L36 22 L38 30 Z" fill="#5b8dbf"/>'),
  },
  {
    id: 'map-pin',
    name: 'Mapa',
    category: 'Viagem',
    svg: s('<circle cx="50" cy="32" r="20" fill="#e05b6d"/><circle cx="43" cy="24" r="6" fill="#fff" opacity="0.5"/><path d="M50 52 L50 92" stroke="#e05b6d" stroke-width="8" stroke-linecap="round"/>'),
  },
  {
    id: 'dumbbell',
    name: 'Halteres',
    category: 'Fitness',
    svg: s('<rect x="12" y="38" width="76" height="14" rx="4" fill="#a0a0a0"/><rect x="8" y="32" width="16" height="26" rx="6" fill="#5a5a5a"/><rect x="76" y="32" width="16" height="26" rx="6" fill="#5a5a5a"/>'),
  },
  {
    id: 'water-bottle',
    name: 'Garrafa',
    category: 'Fitness',
    svg: s('<rect x="30" y="22" width="40" height="62" rx="10" fill="#5b8dbf"/><rect x="36" y="14" width="28" height="14" rx="6" fill="#5b8dbf"/><rect x="36" y="38" width="28" height="30" rx="2" fill="#a5c8e4" opacity="0.5"/>'),
  },
  {
    id: 'cake',
    name: 'Bolo',
    category: 'Datas comemorativas',
    svg: s('<ellipse cx="50" cy="72" rx="36" ry="12" fill="#e8a0a0"/><rect x="20" y="44" width="60" height="28" rx="4" fill="#f5d0d0"/><rect x="20" y="52" width="60" height="4" fill="#f0c0c0"/><path d="M42 44 L46 28 L54 28 L58 44" fill="#f0b429"/><circle cx="46" cy="22" r="4" fill="#f0b429"/><circle cx="54" cy="22" r="4" fill="#f7d070"/>'),
  },
  {
    id: 'gift',
    name: 'Presente',
    category: 'Datas comemorativas',
    svg: s('<rect x="14" y="32" width="72" height="50" rx="6" fill="#f0b429"/><rect x="42" y="14" width="16" height="68" fill="#f0b429"/><rect x="30" y="14" width="8" height="28" rx="4" fill="#f7d070"/><path d="M40 28 C36 14 22 14 30 28 C28 14 44 14 40 28Z" fill="#f7d070"/>'),
  },
  {
    id: 'balloon',
    name: 'Balão',
    category: 'Datas comemorativas',
    svg: s('<ellipse cx="50" cy="34" rx="26" ry="30" fill="#e05b6d"/><ellipse cx="42" cy="24" rx="8" ry="6" fill="#fff" opacity="0.4"/><path d="M50 64 L44 88 M50 64 L56 88" stroke="#8a5a6d" stroke-width="2"/>'),
  },
]
