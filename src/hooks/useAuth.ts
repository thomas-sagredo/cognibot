// hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/chatbot';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (token: string, user: User) => {
        // Solo actualizar el estado, persist se encarga de localStorage
        set({ token, user });
      },
      logout: () => {
        // Limpiar todo el localStorage relacionado con auth
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);