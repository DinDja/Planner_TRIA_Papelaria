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
  '#d1bdb8',
  '#b76f06',
  '#6a634d',
  '#ddd6c6',
]

export const ESTACOES: { id: Estacao; rotulo: string; faixa: string; janela: string }[] = [
  { id: 'madrugada', rotulo: 'madrugada', faixa: '#6a634d', janela: '00–05h' },
  { id: 'manha', rotulo: 'manhã', faixa: '#b76f06', janela: '05–12h' },
  { id: 'tarde', rotulo: 'tarde', faixa: '#d1bdb8', janela: '12–17h' },
  { id: 'anoitecer', rotulo: 'anoitecer', faixa: '#ddd6c6', janela: '17–20h' },
  { id: 'noite', rotulo: 'noite', faixa: '#6a634d', janela: '20–24h' },
]

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      avatar: '🦊',
      email: '',
      bio: '',
      accent: '#d1bdb8',
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
