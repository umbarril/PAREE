import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand/react";
import { fetchLogout, fetchMe } from "../services/LoginService";
import { fetchVinculo } from "../services/PersonalService";
import type { AuthDiscenteResponse, AuthResponse } from "../types/AuthResponse";
import type { DiscenteVinculoResponse } from "../types/VinculosResponse";

interface User {
  nome: string;
  id: number;
  foto: string;
  matricula: string;
  idCurso: string;
  nivel: string;
  nomeCurso: string;
}

export interface UserDiscente {
  nomeCurso: string;
  matricula: string;
  idCurso: string;
  nivel: string;
  isActive: boolean;
  idVinculo?: number;
}

interface AuthSessionData {
  user: User;
  discentes: UserDiscente[];
  activeDiscenteIndex: number;
}

// 2. Define the Store's state and actions
interface AuthState {
  user: User | null;
  discentes: UserDiscente[];
  activeDiscenteIndex: number;
  isAuthenticated: boolean;
  isBooting: boolean;
  checkAuth: () => Promise<void>;
  login: (sessionData: AuthSessionData) => void;
  logout: () => void;
  setActiveDiscente: (index: number) => void;
  setActiveDiscenteByMatricula: (matricula: string) => void;
}

// 3. Pass the interface to create
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      discentes: [],
      activeDiscenteIndex: 0,
      isAuthenticated: false,
      isBooting: true,

      checkAuth: async () => {
        try {
          const response = await fetchMe();
          const sessionData = await authResponseToSession(response.data);

          set({
            user: sessionData.user,
            discentes: sessionData.discentes,
            activeDiscenteIndex: sessionData.activeDiscenteIndex,
            isAuthenticated: true,
            isBooting: false,
          });
        } catch {
          set({ user: null, discentes: [], activeDiscenteIndex: 0, isAuthenticated: false, isBooting: false });
        }
      },

      login: (sessionData: AuthSessionData) =>
        set({
          user: sessionData.user,
          discentes: sessionData.discentes,
          activeDiscenteIndex: sessionData.activeDiscenteIndex,
          isAuthenticated: true,
        }),

      logout: () => {
        fetchLogout().catch((err) => {
          console.error("Logout failed:", err);
        });
        set({ user: null, discentes: [], activeDiscenteIndex: 0, isAuthenticated: false });
      },

      setActiveDiscente: (index: number) =>
        set((state) => {
          if (!state.user || index < 0 || index >= state.discentes.length) {
            return state;
          }

          return {
            activeDiscenteIndex: index,
            user: userWithSelectedDiscente(state.user, state.discentes[index]),
          };
        }),

      setActiveDiscenteByMatricula: (matricula: string) =>
        set((state) => {
          if (!state.user) {
            return state;
          }

          const targetIndex = state.discentes.findIndex((discente) => discente.matricula === matricula);
          if (targetIndex < 0) {
            return state;
          }

          return {
            activeDiscenteIndex: targetIndex,
            user: userWithSelectedDiscente(state.user, state.discentes[targetIndex]),
          };
        }),
    }),
    {
      name: 'sigaa-user-storage',
      storage: createJSONStorage(() => localStorage),
      // Now TypeScript knows exactly what 'state' is!
      partialize: (state) => ({ 
        user: state.user, 
        discentes: state.discentes,
        activeDiscenteIndex: state.activeDiscenteIndex,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

const userWithSelectedDiscente = (baseUser: User, discente: UserDiscente): User => {
  return {
    ...baseUser,
    nomeCurso: discente.nomeCurso,
    matricula: discente.matricula,
    idCurso: discente.idCurso,
    nivel: discente.nivel,
  };
};

const buildDiscenteFromAuth = (discente: AuthDiscenteResponse): UserDiscente => {
  return {
    nomeCurso: discente.nome,
    matricula: discente.matricula.toString(),
    idCurso: discente.idCurso.toString(),
    nivel: discente.nivel,
    isActive: false,
  };
};

const mergeDiscenteWithVinculo = (
  discente: UserDiscente,
  vinculoByMatricula: Map<string, DiscenteVinculoResponse>
): UserDiscente => {
  const vinculo = vinculoByMatricula.get(discente.matricula);
  if (!vinculo) {
    return discente;
  }

  return {
    ...discente,
    nomeCurso: vinculo.curso?.nome ?? discente.nomeCurso,
    idCurso: (vinculo.curso?.idCurso ?? discente.idCurso).toString(),
    nivel: vinculo.curso?.nivel ?? discente.nivel,
    isActive: true,
    idVinculo: vinculo.idVinculo,
  };
};

export const authResponseToSession = async (authData: AuthResponse): Promise<AuthSessionData> => {
  console.log("Transforming AuthResponse to auth session:", authData);

  const discentesFromAuth = authData.DISCENTE.map(buildDiscenteFromAuth);
  if (discentesFromAuth.length === 0) {
    throw new Error("Nenhum discente encontrado na autenticacao");
  }

  let activeMatriculasInOrder: string[] = [];
  let vinculoByMatricula = new Map<string, DiscenteVinculoResponse>();

  try {
    const vinculosResponse = await fetchVinculo();
    const vinculos = vinculosResponse.data?.discente ?? [];
    activeMatriculasInOrder = vinculos.map((v) => v.matricula.toString());
    vinculoByMatricula = new Map(vinculos.map((v) => [v.matricula.toString(), v]));
  } catch (error) {
    console.warn("Nao foi possivel resolver vinculos ativos em fetchVinculo. Usando fallback para o primeiro DISCENTE.", error);
  }

  const discentes = discentesFromAuth.map((discente) => mergeDiscenteWithVinculo(discente, vinculoByMatricula));
  const preferredMatricula = activeMatriculasInOrder.find((matricula) =>
    discentes.some((discente) => discente.matricula === matricula)
  );
  const activeDiscenteIndex = preferredMatricula
    ? discentes.findIndex((discente) => discente.matricula === preferredMatricula)
    : 0;
  const selectedDiscente = discentes[activeDiscenteIndex];

  return {
    user: {
      nome: authData.nome,
      id: authData.id_usuario,
      foto: authData.foto,
      nomeCurso: selectedDiscente.nomeCurso,
      matricula: selectedDiscente.matricula,
      idCurso: selectedDiscente.idCurso,
      nivel: selectedDiscente.nivel,
    },
    discentes,
    activeDiscenteIndex,
  };
};

export const authResponseToUser = async (authData: AuthResponse): Promise<User> => {
  const sessionData = await authResponseToSession(authData);
  return sessionData.user;
};