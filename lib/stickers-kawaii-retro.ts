import type { StickerDef } from './types'

const s = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`

const face = (cx: number, cy: number, scl = 1) => `
  <circle cx="${cx - 5 * scl}" cy="${cy - 2 * scl}" r="${2.5 * scl}" fill="#2a1a2e"/>
  <circle cx="${cx + 5 * scl}" cy="${cy - 2 * scl}" r="${2.5 * scl}" fill="#2a1a2e"/>
  <ellipse cx="${cx - 8 * scl}" cy="${cy + 3 * scl}" rx="${3.5 * scl}" ry="${2 * scl}" fill="#ffb0c0" opacity="0.7"/>
  <ellipse cx="${cx + 8 * scl}" cy="${cy + 3 * scl}" rx="${3.5 * scl}" ry="${2 * scl}" fill="#ffb0c0" opacity="0.7"/>
  <path d="M${cx - 3 * scl} ${cy + 5 * scl} Q${cx} ${cy + 9 * scl} ${cx + 3 * scl} ${cy + 5 * scl}" stroke="#2a1a2e" stroke-width="${1.5 * scl}" fill="none" stroke-linecap="round"/>
`

const blush = (cx: number, cy: number, scl = 1) => `
  <ellipse cx="${cx - 7 * scl}" cy="${cy + 3 * scl}" rx="${3 * scl}" ry="${1.8 * scl}" fill="#ffb0c0" opacity="0.7"/>
  <ellipse cx="${cx + 7 * scl}" cy="${cy + 3 * scl}" rx="${3 * scl}" ry="${1.8 * scl}" fill="#ffb0c0" opacity="0.7"/>
`

const eyes = (cx: number, cy: number, scl = 1) => `
  <circle cx="${cx - 5 * scl}" cy="${cy}" r="${2.5 * scl}" fill="#2a1a2e"/>
  <circle cx="${cx + 5 * scl}" cy="${cy}" r="${2.5 * scl}" fill="#2a1a2e"/>
`

const mouth = (cx: number, cy: number, scl = 1) => `
  <path d="M${cx - 3 * scl} ${cy} Q${cx} ${cy + 4 * scl} ${cx + 3 * scl} ${cy}" stroke="#2a1a2e" stroke-width="${1.5 * scl}" fill="none" stroke-linecap="round"/>
`

const smile = (cx: number, cy: number, scl = 1) => `
  <path d="M${cx - 4 * scl} ${cy} Q${cx} ${cy + 5 * scl} ${cx + 4 * scl} ${cy}" stroke="#2a1a2e" stroke-width="${1.5 * scl}" fill="none" stroke-linecap="round"/>
`

const bigSmile = (cx: number, cy: number, scl = 1) => `
  <path d="M${cx - 5 * scl} ${cy} Q${cx} ${cy + 7 * scl} ${cx + 5 * scl} ${cy}" stroke="#2a1a2e" stroke-width="${1.5 * scl}" fill="none" stroke-linecap="round"/>
`

const starGlow = (cx: number, cy: number, r: number) => `
  <path d="M${cx} ${cy - r} L${cx + r * 0.22} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.22} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.22} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.22} ${cy - r * 0.3} Z" fill="#f7d070" opacity="0.6"/>
`

const sparkle = (cx: number, cy: number, sz: number) => `
  <path d="M${cx} ${cy - sz} L${cx + sz * 0.25} ${cy - sz * 0.2} L${cx + sz} ${cy} L${cx + sz * 0.25} ${cy + sz * 0.2} L${cx} ${cy + sz} L${cx - sz * 0.25} ${cy + sz * 0.2} L${cx - sz} ${cy} L${cx - sz * 0.25} ${cy - sz * 0.2} Z" fill="#fff"/>
`

export const KAWAII_RETRO_STICKERS: StickerDef[] = [
  // ═══════════════════════════════════════════════
  //  RETRÔ 90s  —  ícones nostálgicos anos 90
  // ═══════════════════════════════════════════════
  {
    id: 'floppy-disk',
    name: 'Disquete',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="14" y="16" width="72" height="70" rx="6" fill="#5b8dbf"/>
      <rect x="20" y="22" width="30" height="34" rx="3" fill="#e0e8f0"/>
      <rect x="52" y="18" width="28" height="18" rx="2" fill="#c0d0e0"/>
      <rect x="56" y="22" width="20" height="10" rx="1" fill="#90a0b0"/>
      ${face(35, 42)}
      <circle cx="68" cy="48" r="10" fill="#3a6080"/>
      <rect x="65" y="48" width="6" height="14" rx="2" fill="#e0e8f0"/>
    `),
  },
  {
    id: 'cassette',
    name: 'Fita Cassete',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="8" y="22" width="84" height="56" rx="8" fill="#6b8fb0"/>
      <rect x="14" y="30" width="20" height="10" rx="2" fill="#d4b070"/>
      <rect x="66" y="30" width="20" height="10" rx="2" fill="#d4b070"/>
      <circle cx="35" cy="56" r="14" fill="#4a6f8a"/>
      <circle cx="65" cy="56" r="14" fill="#4a6f8a"/>
      <circle cx="35" cy="56" r="5" fill="#d4b070"/>
      <circle cx="65" cy="56" r="5" fill="#d4b070"/>
      ${face(50, 40)}
    `),
  },
  {
    id: 'gamepad',
    name: 'Controle',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="10" y="38" width="80" height="38" rx="12" fill="#e8a0b0"/>
      <rect x="36" y="42" width="28" height="6" rx="3" fill="#d08090"/>
      <rect x="14" y="46" width="18" height="22" rx="6" fill="#e8a0b0"/>
      <rect x="68" y="46" width="18" height="22" rx="6" fill="#e8a0b0"/>
      <circle cx="23" cy="57" r="4" fill="#3a2a2a"/>
      <circle cx="77" cy="57" r="4" fill="#3a2a2a"/>
      <circle cx="50" cy="57" r="3" fill="#3a2a2a"/>
      <rect x="30" y="74" width="8" height="16" rx="4" fill="#d08090"/>
      <rect x="62" y="74" width="8" height="16" rx="4" fill="#d08090"/>
      ${eyes(50, 48)}
      ${mouth(50, 54)}
    `),
  },
  {
    id: 'smiley-90s',
    name: 'Smiley 90s',
    category: 'Retrô 90s',
    svg: s(`
      <circle cx="50" cy="50" r="42" fill="#f7d070"/>
      <circle cx="50" cy="50" r="38" stroke="#d4942a" stroke-width="2" fill="none"/>
      <ellipse cx="34" cy="40" rx="8" ry="10" fill="#2a1a2e" opacity="0.15"/>
      <ellipse cx="66" cy="40" rx="8" ry="10" fill="#2a1a2e" opacity="0.15"/>
      <path d="M28 56 Q50 78 72 56" stroke="#2a1a2e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="48" cy="42" r="4" fill="#2a1a2e"/>
      <circle cx="52" cy="42" r="4" fill="#2a1a2e"/>
      <circle cx="50" cy="38" r="3" fill="#2a1a2e"/>
      <rect x="30" y="58" width="40" height="4" rx="2" fill="#fff" opacity="0.5"/>
    `),
  },
  {
    id: 'skateboard',
    name: 'Skate',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="8" y="46" width="84" height="10" rx="5" fill="#e8a0b0"/>
      <rect x="8" y="46" width="84" height="4" rx="2" fill="#f0c0d0" opacity="0.5"/>
      <circle cx="22" cy="60" r="8" fill="#3a2a2a"/>
      <circle cx="22" cy="60" r="3" fill="#6a5a5a"/>
      <circle cx="78" cy="60" r="8" fill="#3a2a2a"/>
      <circle cx="78" cy="60" r="3" fill="#6a5a5a"/>
      <path d="M40 46 L38 34 Q42 30 46 34 Z" fill="#f0b429"/>
      <path d="M60 46 L62 34 Q58 30 54 34 Z" fill="#f0b429"/>
      ${face(50, 38)}
    `),
  },
  {
    id: 'roller-skate',
    name: 'Patins',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="18" y="20" width="40" height="34" rx="8" fill="#c9b6e4"/>
      <rect x="18" y="34" width="40" height="6" fill="#a088c0"/>
      <circle cx="28" cy="48" r="7" fill="#e05b6d"/>
      <circle cx="48" cy="48" r="7" fill="#e05b6d"/>
      <rect x="54" y="26" width="20" height="12" rx="4" fill="#e05b6d"/>
      <rect x="66" y="22" width="8" height="20" rx="3" fill="#c9b6e4"/>
      <circle cx="70" cy="48" r="5" fill="#e05b6d"/>
      <line x1="58" y1="30" x2="72" y2="18" stroke="#f0b429" stroke-width="3" stroke-linecap="round"/>
      ${face(38, 28)}
    `),
  },
  {
    id: 'boombox',
    name: 'Rádio',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="6" y="30" width="88" height="46" rx="8" fill="#4a4a5a"/>
      <circle cx="28" cy="52" r="18" fill="#2a2a3a"/>
      <circle cx="28" cy="52" r="8" fill="#6a6a7a"/>
      <circle cx="72" cy="52" r="18" fill="#2a2a3a"/>
      <circle cx="72" cy="52" r="8" fill="#6a6a7a"/>
      <rect x="14" y="28" width="12" height="6" rx="2" fill="#f0b429"/>
      <rect x="74" y="28" width="12" height="6" rx="2" fill="#f0b429"/>
      <rect x="44" y="36" width="12" height="8" rx="2" fill="#e05b6d"/>
      <circle cx="50" cy="56" r="2" fill="#7bb686"/>
      ${face(50, 45)}
    `),
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="12" y="14" width="76" height="76" rx="6" fill="#f0f0f0"/>
      <rect x="18" y="18" width="64" height="48" rx="4" fill="#a5c8e4"/>
      <circle cx="38" cy="34" r="6" fill="#f7d070"/>
      <circle cx="62" cy="40" r="8" fill="#7bb686"/>
      <rect x="42" y="50" width="16" height="10" rx="3" fill="#e8a0b0"/>
      <circle cx="40" cy="32" r="3" fill="#fff" opacity="0.6"/>
      <rect x="30" y="72" width="40" height="4" rx="2" fill="#e05b6d"/>
      <path d="M18 8 L38 14 L62 14 L82 8" stroke="#d0d0d0" stroke-width="2" fill="none"/>
    `),
  },
  {
    id: 'tv-crt',
    name: 'TV Retrô',
    category: 'Retrô 90s',
    svg: s(`
      <rect x="14" y="16" width="72" height="54" rx="8" fill="#6a5a5a"/>
      <rect x="20" y="22" width="52" height="36" rx="4" fill="#2a3a5a"/>
      <rect x="20" y="22" width="52" height="36" rx="4" fill="#4a8abf" opacity="0.3"/>
      <rect x="50" y="40" width="6" height="10" rx="1" fill="#fff" opacity="0.8"/>
      <rect x="20" y="42" width="28" height="4" rx="1" fill="#a5c8e4" opacity="0.5"/>
      <rect x="62" y="36" width="4" height="14" rx="1" fill="#f7d070" opacity="0.6"/>
      <rect x="72" y="36" width="8" height="24" rx="2" fill="#6a5a5a"/>
      <rect x="72" y="64" width="8" height="20" rx="3" fill="#5a4a4a"/>
      <rect x="44" y="70" width="12" height="16" rx="3" fill="#5a4a4a"/>
      <circle cx="50" cy="78" r="2" fill="#3a2a2a"/>
      ${face(50, 36)}
    `),
  },

  // ═══════════════════════════════════════════════
  //  KAWAII POP  —  kawaii contemporâneo
  // ═══════════════════════════════════════════════
  {
    id: 'bubble-tea',
    name: 'Bubble Tea',
    category: 'Kawaii Pop',
    svg: s(`
      <rect x="36" y="14" width="28" height="8" rx="4" fill="#f0c0d0"/>
      <path d="M34 20 L38 80 Q50 86 62 80 L66 20 Z" fill="#f5d0d8" stroke="#e0a0b0" stroke-width="2"/>
      <circle cx="46" cy="62" r="5" fill="#5c3d1a" opacity="0.7"/>
      <circle cx="56" cy="58" r="4" fill="#5c3d1a" opacity="0.7"/>
      <circle cx="50" cy="70" r="4" fill="#5c3d1a" opacity="0.7"/>
      <circle cx="44" cy="52" r="3" fill="#5c3d1a" opacity="0.7"/>
      <path d="M56 20 L64 14 Q68 10 72 14 L70 22 Z" fill="#7bb686"/>
      ${face(50, 36)}
    `),
  },
  {
    id: 'donut',
    name: 'Donut',
    category: 'Kawaii Pop',
    svg: s(`
      <circle cx="50" cy="50" r="40" fill="#f5d0a0"/>
      <circle cx="50" cy="50" r="40" stroke="#e0a070" stroke-width="3" fill="none"/>
      <circle cx="50" cy="50" r="14" fill="#fdf5e6"/>
      <path d="M36 30 L64 70" stroke="#e05b6d" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
      <path d="M28 60 L72 40" stroke="#f0b429" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
      <rect x="30" y="38" width="8" height="5" rx="2" fill="#c9b6e4" transform="rotate(-15,34,40)"/>
      <rect x="60" y="48" width="8" height="5" rx="2" fill="#7bb686" transform="rotate(20,64,50)"/>
      <rect x="42" y="74" width="8" height="5" rx="2" fill="#e05b6d" transform="rotate(-5,46,76)"/>
      ${face(50, 44)}
    `),
  },
  {
    id: 'sushi-kawaii',
    name: 'Sushi Kawaii',
    category: 'Kawaii Pop',
    svg: s(`
      <ellipse cx="50" cy="50" rx="40" ry="28" fill="#fdf5e6"/>
      <ellipse cx="50" cy="56" rx="36" ry="18" fill="#e8e0d0"/>
      <rect x="18" y="36" width="64" height="6" rx="3" fill="#5a3a2a"/>
      <rect x="18" y="36" width="64" height="3" rx="1" fill="#6a4a3a" opacity="0.6"/>
      <ellipse cx="38" cy="48" rx="10" ry="8" fill="#e8a0b0"/>
      <ellipse cx="62" cy="48" rx="10" ry="8" fill="#e8a0b0"/>
      <ellipse cx="38" cy="48" rx="6" ry="4" fill="#f0c0d0"/>
      <ellipse cx="62" cy="48" rx="6" ry="4" fill="#f0c0d0"/>
      ${face(50, 40)}
    `),
  },
  {
    id: 'strawberry',
    name: 'Morango',
    category: 'Kawaii Pop',
    svg: s(`
      <path d="M50 18 Q30 28 22 50 Q18 64 28 74 Q38 84 50 86 Q62 84 72 74 Q82 64 78 50 Q70 28 50 18Z" fill="#e05b6d"/>
      <path d="M50 18 Q50 18 62 28 Q68 18 50 12 Q32 18 38 28 Q50 18 50 18Z" fill="#7bb686"/>
      <circle cx="34" cy="46" r="2" fill="#f7d070"/>
      <circle cx="44" cy="56" r="2" fill="#f7d070"/>
      <circle cx="56" cy="52" r="2" fill="#f7d070"/>
      <circle cx="46" cy="70" r="2" fill="#f7d070"/>
      <circle cx="62" cy="64" r="2" fill="#f7d070"/>
      <circle cx="36" cy="60" r="2" fill="#f7d070"/>
      ${face(50, 42)}
    `),
  },
  {
    id: 'cherries',
    name: 'Cerejinhas',
    category: 'Kawaii Pop',
    svg: s(`
      <path d="M30 30 Q20 50 24 68" stroke="#7bb686" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M60 34 Q72 54 64 70" stroke="#7bb686" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="24" cy="72" r="16" fill="#e05b6d"/>
      <circle cx="64" cy="74" r="16" fill="#e05b6d"/>
      <circle cx="18" cy="66" r="4" fill="#f0c0d0" opacity="0.5"/>
      <circle cx="58" cy="68" r="4" fill="#f0c0d0" opacity="0.5"/>
      ${face(24, 68)}
      ${face(64, 70)}
    `),
  },
  {
    id: 'bunny',
    name: 'Coelhinho',
    category: 'Kawaii Pop',
    svg: s(`
      <ellipse cx="50" cy="62" rx="30" ry="30" fill="#f5e0e8"/>
      <ellipse cx="30" cy="24" rx="10" ry="20" fill="#f5e0e8"/>
      <ellipse cx="70" cy="24" rx="10" ry="20" fill="#f5e0e8"/>
      <ellipse cx="30" cy="22" rx="6" ry="14" fill="#f0d0d8"/>
      <ellipse cx="70" cy="22" rx="6" ry="14" fill="#f0d0d8"/>
      <ellipse cx="50" cy="54" rx="14" ry="18" fill="#f0d0d8" opacity="0.3"/>
      ${face(50, 50)}
      <circle cx="50" cy="66" r="3" fill="#f0b0c0"/>
      <ellipse cx="44" cy="70" rx="5" ry="3" fill="#e8a0b0"/>
    `),
  },
  {
    id: 'fox',
    name: 'Raposinha',
    category: 'Kawaii Pop',
    svg: s(`
      <ellipse cx="50" cy="56" rx="32" ry="28" fill="#f0b060"/>
      <polygon points="18,30 30,10 38,36" fill="#f0b060"/>
      <polygon points="82,30 70,10 62,36" fill="#f0b060"/>
      <polygon points="22,22 30,14 32,28" fill="#f5d0a0"/>
      <polygon points="78,22 70,14 68,28" fill="#f5d0a0"/>
      <ellipse cx="50" cy="50" rx="22" ry="18" fill="#f5d0a0"/>
      ${face(50, 46)}
      <circle cx="50" cy="62" r="3" fill="#e05b6d"/>
      <ellipse cx="44" cy="64" rx="4" ry="2" fill="#5c3d1a"/>
    `),
  },
  {
    id: 'penguin',
    name: 'Pinguim',
    category: 'Kawaii Pop',
    svg: s(`
      <ellipse cx="50" cy="52" rx="28" ry="36" fill="#3a4a6a"/>
      <ellipse cx="50" cy="54" rx="18" ry="24" fill="#f0f0f0"/>
      <ellipse cx="50" cy="62" rx="14" ry="16" fill="#e8e8e8"/>
      <ellipse cx="28" cy="40" rx="8" ry="6" fill="#3a4a6a"/>
      <ellipse cx="72" cy="40" rx="8" ry="6" fill="#3a4a6a"/>
      ${face(50, 44)}
      <ellipse cx="44" cy="72" rx="6" ry="4" fill="#f0b429"/>
      <ellipse cx="56" cy="72" rx="6" ry="4" fill="#f0b429"/>
    `),
  },
  {
    id: 'panda',
    name: 'Pandinha',
    category: 'Kawaii Pop',
    svg: s(`
      <circle cx="50" cy="54" r="32" fill="#f0f0f0"/>
      <circle cx="50" cy="54" r="28" stroke="#e0e0e0" stroke-width="2" fill="none"/>
      <ellipse cx="30" cy="46" rx="14" ry="12" fill="#3a4a6a"/>
      <ellipse cx="70" cy="46" rx="14" ry="12" fill="#3a4a6a"/>
      <ellipse cx="30" cy="46" rx="8" ry="7" fill="#2a2a3a"/>
      <ellipse cx="70" cy="46" rx="8" ry="7" fill="#2a2a3a"/>
      <circle cx="50" cy="46" r="8" fill="#3a4a6a"/>
      <circle cx="50" cy="46" r="4" fill="#2a2a3a"/>
      ${face(50, 44)}
      <ellipse cx="50" cy="62" rx="12" ry="8" fill="#f0f0f0"/>
      <ellipse cx="50" cy="64" rx="8" ry="4" fill="#e0e0e0"/>
    `),
  },
  {
    id: 'unicorn',
    name: 'Unicórnio',
    category: 'Kawaii Pop',
    svg: s(`
      <ellipse cx="50" cy="60" rx="26" ry="22" fill="#f5e0f0"/>
      <polygon points="50,14 62,8 56,20" fill="#f7d070"/>
      <polygon points="50,14 44,6 56,10" fill="#f0b429"/>
      <circle cx="50" cy="12" r="3" fill="#f7d070"/>
      <ellipse cx="34" cy="34" rx="12" ry="10" fill="#f5e0f0"/>
      <ellipse cx="66" cy="34" rx="12" ry="10" fill="#f5e0f0"/>
      <circle cx="50" cy="48" r="4" fill="#f0b0c0"/>
      ${face(50, 46)}
      <path d="M50 64 Q54 68 58 64" stroke="#e0a0b0" stroke-width="2" fill="none"/>
      <circle cx="44" cy="72" r="3" fill="#c9b6e4"/>
      <circle cx="56" cy="72" r="3" fill="#c9b6e4"/>
      <circle cx="50" cy="74" r="2" fill="#f0b429"/>
    `),
  },

  // ═══════════════════════════════════════════════
  //  Y2K  —  virada do milênio, chromados, futurismo 2000
  // ═══════════════════════════════════════════════
  {
    id: 'y2k-star',
    name: 'Estrela Y2K',
    category: 'Y2K',
    svg: s(`
      <polygon points="50,4 62,36 96,38 70,56 78,92 50,72 22,92 30,56 4,38 38,36" fill="#d4a0e8" stroke="#a060c0" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="50,14 58,36 80,38 64,50 68,76 50,62 32,76 36,50 20,38 42,36" fill="#f0d0ff" opacity="0.6"/>
      <circle cx="50" cy="46" r="8" fill="#fff" opacity="0.3"/>
      <path d="M50 4 L50 12" stroke="#f0d0ff" stroke-width="2" opacity="0.8"/>
      <path d="M96 38 L86 40" stroke="#f0d0ff" stroke-width="2" opacity="0.8"/>
      <path d="M4 38 L14 40" stroke="#f0d0ff" stroke-width="2" opacity="0.8"/>
      ${face(50, 48)}
    `),
  },
  {
    id: 'y2k-heart',
    name: 'Coração Y2K',
    category: 'Y2K',
    svg: s(`
      <path d="M50 88 C20 64 8 46 8 32 C8 18 19 10 30 10 C39 10 46 15 50 22 C54 15 61 10 70 10 C81 10 92 18 92 32 C92 46 80 64 50 88Z" fill="#e05b6d" stroke="#a03050" stroke-width="2"/>
      <path d="M50 82 C24 60 14 46 14 34 C14 22 22 16 30 16 C37 16 44 20 50 28 C56 20 63 16 70 16 C78 16 86 22 86 34 C86 46 76 60 50 82Z" fill="#f08090" opacity="0.3"/>
      <circle cx="50" cy="52" r="3" fill="#fff" opacity="0.5"/>
      ${face(50, 42)}
      ${sparkle(78, 26, 6)}
      ${sparkle(22, 30, 5)}
      ${sparkle(38, 14, 4)}
    `),
  },
  {
    id: 'y2k-butterfly',
    name: 'Borboleta Y2K',
    category: 'Y2K',
    svg: s(`
      <defs>
        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c9b6e4"/>
          <stop offset="50%" stop-color="#f0b0c0"/>
          <stop offset="100%" stop-color="#f7d070"/>
        </linearGradient>
      </defs>
      <path d="M46 50 C14 14 6 36 10 54 C14 72 34 66 46 52Z" fill="url(#wingGrad)" stroke="#a080c0" stroke-width="1.5"/>
      <path d="M54 50 C86 14 94 36 90 54 C86 72 66 66 54 52Z" fill="url(#wingGrad)" stroke="#a080c0" stroke-width="1.5"/>
      <path d="M46 52 C20 62 14 84 28 88 C38 92 44 74 46 60Z" fill="#f0b0c0" stroke="#a080c0" stroke-width="1"/>
      <path d="M54 52 C80 62 86 84 72 88 C62 92 56 74 54 60Z" fill="#f0b0c0" stroke="#a080c0" stroke-width="1"/>
      <rect x="48" y="28" width="4" height="36" rx="2" fill="#6a4a8a"/>
      <circle cx="50" cy="34" r="2" fill="#f0b429"/>
      <circle cx="50" cy="42" r="2" fill="#f0b429"/>
      <circle cx="50" cy="50" r="2" fill="#f0b429"/>
      <circle cx="62" cy="36" r="3" fill="#f7d070" opacity="0.8"/>
      <circle cx="38" cy="36" r="3" fill="#f7d070" opacity="0.8"/>
      ${starGlow(76, 26, 8)}
      ${starGlow(24, 26, 8)}
    `),
  },
  {
    id: 'y2k-flame',
    name: 'Chama',
    category: 'Y2K',
    svg: s(`
      <path d="M50 90 Q20 60 30 40 Q38 24 50 10 Q62 24 70 40 Q80 60 50 90Z" fill="#f0b429" stroke="#e08020" stroke-width="2"/>
      <path d="M50 84 Q26 58 34 40 Q40 30 50 16 Q60 30 66 40 Q74 58 50 84Z" fill="#f7d070" opacity="0.7"/>
      <path d="M50 76 Q34 56 40 42 Q44 34 50 24 Q56 34 60 42 Q66 56 50 76Z" fill="#fff" opacity="0.3"/>
      <circle cx="48" cy="56" r="3" fill="#fff" opacity="0.5"/>
      <circle cx="55" cy="48" r="2" fill="#fff" opacity="0.4"/>
      ${sparkle(66, 28, 5)}
      ${sparkle(34, 30, 4)}
    `),
  },
  {
    id: 'y2k-crown',
    name: 'Coroa',
    category: 'Y2K',
    svg: s(`
      <path d="M14 78 L14 38 L30 52 L50 22 L70 52 L86 38 L86 78 Z" fill="#f7d070" stroke="#d4942a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14 38 L30 52 L50 22 L70 52 L86 38" fill="none" stroke="#f0e090" stroke-width="2"/>
      <circle cx="50" cy="22" r="6" fill="#e05b6d"/>
      <circle cx="30" cy="52" r="5" fill="#5b8dbf"/>
      <circle cx="70" cy="52" r="5" fill="#7bb686"/>
      <circle cx="50" cy="22" r="3" fill="#fff" opacity="0.5"/>
      <circle cx="30" cy="52" r="2" fill="#fff" opacity="0.5"/>
      <circle cx="70" cy="52" r="2" fill="#fff" opacity="0.5"/>
      ${face(50, 60)}
      ${sparkle(38, 12, 4)}
      ${sparkle(62, 12, 4)}
    `),
  },
  {
    id: 'y2k-moon',
    name: 'Lua Y2K',
    category: 'Y2K',
    svg: s(`
      <path d="M66 10 A42 42 0 1 0 90 62 A34 34 0 0 1 66 10Z" fill="#c9b6e4" stroke="#a080c0" stroke-width="2"/>
      <circle cx="70" cy="22" r="2" fill="#f7d070"/>
      <circle cx="80" cy="38" r="2" fill="#f7d070"/>
      <circle cx="74" cy="52" r="2" fill="#f7d070"/>
      ${face(50, 48)}
      ${starGlow(28, 24, 6)}
      ${starGlow(18, 60, 5)}
    `),
  },
  {
    id: 'y2k-sun',
    name: 'Sol Y2K',
    category: 'Y2K',
    svg: s(`
      <circle cx="50" cy="50" r="24" fill="#f7d070" stroke="#e8a020" stroke-width="2"/>
      <g stroke="#f7d070" stroke-width="5" stroke-linecap="round">
        <line x1="50" y1="8" x2="50" y2="16"/>
        <line x1="50" y1="84" x2="50" y2="92"/>
        <line x1="8" y1="50" x2="16" y2="50"/>
        <line x1="84" y1="50" x2="92" y2="50"/>
        <line x1="20" y1="20" x2="26" y2="26"/>
        <line x1="74" y1="74" x2="80" y2="80"/>
        <line x1="20" y1="80" x2="26" y2="74"/>
        <line x1="74" y1="26" x2="80" y2="20"/>
      </g>
      <circle cx="50" cy="50" r="18" fill="#f0d060"/>
      <g fill="#e8a020" opacity="0.3">
        <line x1="50" y1="34" x2="50" y2="44" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
        <line x1="38" y1="50" x2="48" y2="50" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
        <line x1="62" y1="50" x2="72" y2="50" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
      </g>
      ${face(50, 48)}
    `),
  },
  {
    id: 'y2k-diamond',
    name: 'Diamante',
    category: 'Y2K',
    svg: s(`
      <polygon points="50,4 90,50 50,96 10,50" fill="#a5c8e4" stroke="#5b8dbf" stroke-width="2"/>
      <polygon points="50,14 78,50 50,86 22,50" fill="#c0ddf0" opacity="0.6"/>
      <polygon points="50,24 66,50 50,76 34,50" fill="#e0f0ff" opacity="0.4"/>
      <polygon points="50,4 10,50 50,24" fill="#fff" opacity="0.2"/>
      ${face(50, 46)}
      ${sparkle(76, 32, 5)}
      ${sparkle(24, 32, 5)}
    `),
  },

  // ═══════════════════════════════════════════════
  //  CULTURA POP  —  referências pop / lifestyle
  // ═══════════════════════════════════════════════
  {
    id: 'pop-mic',
    name: 'Microfone',
    category: 'Cultura Pop',
    svg: s(`
      <ellipse cx="50" cy="34" rx="14" ry="16" fill="#3a3a4a"/>
      <rect x="44" y="48" width="12" height="20" rx="3" fill="#c0c0c8"/>
      <rect x="32" y="64" width="36" height="10" rx="5" fill="#3a3a4a"/>
      <rect x="32" y="64" width="36" height="4" rx="2" fill="#5a5a6a"/>
      <ellipse cx="50" cy="34" rx="8" ry="10" fill="#5a5a6a"/>
      <rect x="46" y="48" width="8" height="20" rx="2" fill="#a0a0b0"/>
      <circle cx="50" cy="34" r="3" fill="#f0b429"/>
      ${face(50, 30, 0.7)}
    `),
  },
  {
    id: 'pop-film',
    name: 'Claquete',
    category: 'Cultura Pop',
    svg: s(`
      <rect x="14" y="18" width="72" height="60" rx="4" fill="#3a3a3a"/>
      <polygon points="14,18 14,52 50,52 86,18" fill="#e8e0d0"/>
      <polygon points="14,18 14,38 32,52" fill="#3a3a3a"/>
      <rect x="14" y="18" width="72" height="8" rx="2" fill="#3a3a3a"/>
      <rect x="14" y="18" width="72" height="4" rx="1" fill="#5a5a5a"/>
      <line x1="22" y1="24" x2="40" y2="40" stroke="#fff" stroke-width="2" opacity="0.8"/>
      <line x1="38" y1="24" x2="56" y2="40" stroke="#fff" stroke-width="2" opacity="0.8"/>
      <line x1="54" y1="24" x2="72" y2="40" stroke="#fff" stroke-width="2" opacity="0.8"/>
      ${face(50, 46)}
    `),
  },
  {
    id: 'pop-music-note',
    name: 'Nota Musical',
    category: 'Cultura Pop',
    svg: s(`
      <circle cx="36" cy="68" r="14" fill="#e05b6d"/>
      <circle cx="76" cy="50" r="10" fill="#e05b6d"/>
      <path d="M36 54 L36 18" stroke="#e05b6d" stroke-width="6" stroke-linecap="round"/>
      <path d="M36 18 Q56 8 76 18" stroke="#e05b6d" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M76 28 L76 50" stroke="#e05b6d" stroke-width="6" stroke-linecap="round"/>
      <circle cx="36" cy="56" r="4" fill="#fff" opacity="0.4"/>
      <circle cx="76" cy="42" r="3" fill="#fff" opacity="0.4"/>
      ${face(36, 66, 0.6)}
      ${face(76, 48, 0.6)}
      ${sparkle(58, 22, 5)}
    `),
  },
  {
    id: 'pop-cd',
    name: 'CD',
    category: 'Cultura Pop',
    svg: s(`
      <circle cx="50" cy="50" r="42" fill="#c0c0c8" stroke="#a0a0a8" stroke-width="2"/>
      <circle cx="50" cy="50" r="34" fill="#e0e0e8"/>
      <circle cx="50" cy="50" r="22" fill="#f0f0f8"/>
      <circle cx="50" cy="50" r="6" fill="#3a3a4a"/>
      <circle cx="50" cy="50" r="3" fill="#c0c0c8"/>
      <path d="M50 16 L50 24" stroke="#a0a0a8" stroke-width="3" stroke-linecap="round"/>
      <path d="M22 38 L28 42" stroke="#a0a0a8" stroke-width="3" stroke-linecap="round"/>
      <path d="M72 38 L78 42" stroke="#a0a0a8" stroke-width="3" stroke-linecap="round"/>
      <path d="M16 66 L24 62" stroke="#e0e0e8" stroke-width="2" opacity="0.5"/>
      <path d="M76 66 L84 62" stroke="#e0e0e8" stroke-width="2" opacity="0.5"/>
      ${face(50, 44)}
    `),
  },
  {
    id: 'pop-comic-boom',
    name: 'Boom!',
    category: 'Cultura Pop',
    svg: s(`
      <polygon points="50,4 36,34 8,38 30,56 22,86 50,66 78,86 70,56 92,38 64,34" fill="#f7d070" stroke="#e8a020" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="50,16 40,36 22,38 36,52 30,72 50,58 70,72 64,52 78,38 60,36" fill="#fff" opacity="0.3"/>
      <text x="50" y="54" text-anchor="middle" font-size="22" font-weight="900" fill="#e05b6d" font-family="Arial, sans-serif">BOOM</text>
      <path d="M14 50 L8 44" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 50 L92 44" stroke="#e8a020" stroke-width="3" stroke-linecap="round"/>
    `),
  },
  {
    id: 'pop-cassette-tape',
    name: 'K7 Mix',
    category: 'Cultura Pop',
    svg: s(`
      <rect x="8" y="24" width="84" height="52" rx="6" fill="#e05b6d"/>
      <rect x="8" y="28" width="84" height="8" rx="2" fill="#c04050"/>
      <rect x="14" y="42" width="32" height="20" rx="3" fill="#f0f0f0" opacity="0.9"/>
      <rect x="54" y="42" width="32" height="20" rx="3" fill="#f0f0f0" opacity="0.9"/>
      <circle cx="30" cy="52" r="10" fill="#3a2a2a"/>
      <circle cx="70" cy="52" r="10" fill="#3a2a2a"/>
      <circle cx="30" cy="52" r="4" fill="#f0f0f0"/>
      <circle cx="70" cy="52" r="4" fill="#f0f0f0"/>
      <text x="50" y="34" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff" font-family="Arial, sans-serif" letter-spacing="1">MIX 90</text>
      ${face(50, 42, 0.6)}
    `),
  },
  {
    id: 'pop-headphones',
    name: 'Headphone',
    category: 'Cultura Pop',
    svg: s(`
      <path d="M20 42 C20 16 80 16 80 42" stroke="#e8a0b0" stroke-width="10" fill="none" stroke-linecap="round"/>
      <rect x="12" y="42" width="16" height="26" rx="8" fill="#e8a0b0"/>
      <rect x="72" y="42" width="16" height="26" rx="8" fill="#e8a0b0"/>
      <rect x="14" y="44" width="12" height="6" rx="2" fill="#d08090"/>
      <rect x="74" y="44" width="12" height="6" rx="2" fill="#d08090"/>
      <path d="M50 16 L50 26" stroke="#d08090" stroke-width="4" stroke-linecap="round"/>
      ${face(50, 34, 0.7)}
    `),
  },
  {
    id: 'pop-popcorn',
    name: 'Pipoca',
    category: 'Cultura Pop',
    svg: s(`
      <rect x="18" y="58" width="64" height="30" rx="6" fill="#e05b6d"/>
      <rect x="18" y="58" width="64" height="8" rx="3" fill="#c04050"/>
      <circle cx="30" cy="42" r="16" fill="#f0e8d0"/>
      <circle cx="52" cy="34" r="18" fill="#f0e8d0"/>
      <circle cx="74" cy="42" r="16" fill="#f0e8d0"/>
      <circle cx="42" cy="26" r="14" fill="#f5edc0"/>
      <circle cx="64" cy="26" r="14" fill="#f5edc0"/>
      <circle cx="52" cy="20" r="12" fill="#fdf5e0"/>
      <circle cx="34" cy="36" r="6" fill="#e8d0a0" opacity="0.5"/>
      <circle cx="68" cy="36" r="6" fill="#e8d0a0" opacity="0.5"/>
      ${face(52, 28, 0.6)}
    `),
  },
  {
    id: 'pop-ticket',
    name: 'Ingresso',
    category: 'Cultura Pop',
    svg: s(`
      <rect x="8" y="20" width="84" height="56" rx="8" fill="#f5e6d3"/>
      <rect x="8" y="20" width="84" height="56" rx="8" stroke="#c9b6e4" stroke-width="2" fill="none"/>
      <circle cx="50" cy="48" r="6" fill="#c9b6e4"/>
      <path d="M8 32 L92 32" stroke="#c9b6e4" stroke-width="1" stroke-dasharray="4,4"/>
      <path d="M8 66 L92 66" stroke="#c9b6e4" stroke-width="1" stroke-dasharray="4,4"/>
      <text x="50" y="46" text-anchor="middle" font-size="7" font-weight="bold" fill="#6a4a8a" font-family="Arial, sans-serif">ADMIT ONE</text>
      <rect x="14" y="24" width="72" height="4" rx="1" fill="#e05b6d" opacity="0.6"/>
      ${face(50, 54, 0.6)}
    `),
  },
]
