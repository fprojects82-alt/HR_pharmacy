import { create } from 'zustand'

export type UserRole = 'admin' | 'hr' | 'accountant' | 'control' | 'manager' | 'employee' | 'area_manager' | 'ceo'

export interface Profile {
  id: string
  username: string
  full_name: string
  role: UserRole
  is_active: boolean
  employee_id: number | null
}

interface AuthState {
  profile: Profile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}))
