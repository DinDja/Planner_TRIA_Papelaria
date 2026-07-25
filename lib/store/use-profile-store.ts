import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Estacao = 'madrugada' | 'manha' | 'tarde' | 'anoitecer' | 'noite'

interface ProfileState {
  name: string
  avatar: string
  email: string
  bio: string
  accent: string
  estacao: Estacao

  setName: (name: string) => void
  setAvatar: (avatar: string) => void
  setEmail: (email: string) => void
  setBio: (bio: string) => void
  setAccent: (accent: string) => void
  setEstacao: (e: Estacao) => void
}

const AVATARS = ['🦊', '🐼', '🐨', '🦁', '🐧', '🐸', '🦉', '🐱', '🐶', '🐰', '🦄', '🐙']

export const AVATAR_OPTIONS = AVATARS

export const ACCENT_OPTIONS = [
  '#e05b6d',
  '#5b8dbf',
  '#7bb686',
  '#f0b429',
  '#c9b6e4',
  '#e8a0a0',
  '#8b7aaa',
  '#d4b070',
]

export const ESTACOES: { id: Estacao; rotulo: string; faixa: string; janela: string }[] = [
  { id: 'madrugada', rotulo: 'madrugada', faixa: '#3b3b55', janela: '00–05h' },
  { id: 'manha', rotulo: 'manhã', faixa: '#f0b429', janela: '05–12h' },
  { id: 'tarde', rotulo: 'tarde', faixa: '#e8a0a0', janela: '12–17h' },
  { id: 'anoitecer', rotulo: 'anoitecer', faixa: '#8b7aaa', janela: '17–20h' },
  { id: 'noite', rotulo: 'noite', faixa: '#2a2a44', janela: '20–24h' },
]

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      avatar: '🦊',
      email: '',
      bio: '',
      accent: '#e05b6d',
      estacao: 'manha',

      setName: (name) => set({ name }),
      setAvatar: (avatar) => set({ avatar }),
      setEmail: (email) => set({ email }),
      setBio: (bio) => set({ bio }),
      setAccent: (accent) => set({ accent }),
      setEstacao: (estacao) => set({ estacao }),
    }),
    { name: 'plannerhub-profile' },
  ),
)
