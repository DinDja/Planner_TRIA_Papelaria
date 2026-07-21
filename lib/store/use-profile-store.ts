import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  name: string
  avatar: string // emoji avatar
  email: string

  setName: (name: string) => void
  setAvatar: (avatar: string) => void
  setEmail: (email: string) => void
}

const AVATARS = ['🦊', '🐼', '🐨', '🦁', '🐧', '🐸', '🦉', '🐱', '🐶', '🐰', '🦄', '🐙']

export const AVATAR_OPTIONS = AVATARS

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      avatar: '🦊',
      email: '',

      setName: (name) => set({ name }),
      setAvatar: (avatar) => set({ avatar }),
      setEmail: (email) => set({ email }),
    }),
    { name: 'plannerhub-profile' },
  ),
)
