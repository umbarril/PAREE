import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand/react";
import { fetchLogout, fetchMe } from "../services/LoginService";
import type { AuthResponse } from "../types/AuthResponse";

interface User {
  nome: string;
  id: number;
  foto: string;
  matricula: string;
  idCurso: string;
  nivel: string;
  nomeCurso: string;
}

// 2. Define the Store's state and actions
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBooting: boolean;
  checkAuth: () => Promise<void>;
  login: (userData: User) => void;
  logout: () => void;
}

// 3. Pass the interface to create
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isBooting: true,

      checkAuth: async () => {
        try {
          const response = await fetchMe();
          const user: User = authResponseToUser(response.data);
           
          set({ user: user, isAuthenticated: true, isBooting: false });
        } catch {
          set({ user: null, isAuthenticated: false, isBooting: false });
        }
      },

      login: (userData: User) => set({ user: userData, isAuthenticated: true }),
      
      logout: () => {
        fetchLogout().catch((err) => {
          console.error("Logout failed:", err);
        });
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'sigaa-user-storage',
      storage: createJSONStorage(() => localStorage),
      // Now TypeScript knows exactly what 'state' is!
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export const authResponseToUser = (authData: AuthResponse): User => {
  console.log("Transforming AuthResponse to User:", authData);
  return {
    nome: authData.nome,
    id: authData.id_usuario,
    foto: authData.foto,
    nomeCurso: authData.DISCENTE[0].nome,
    matricula: authData.DISCENTE[0].matricula.toString(),
    idCurso: authData.DISCENTE[0].idCurso.toString(),
    nivel: authData.DISCENTE[0].nivel
  };
}