import { createContext } from "react";
import type { AuthResponse } from "../types/AuthResponse";

export type AuthContextValue = {
	authData: AuthResponse | null;
	setAuthData: (data: AuthResponse | null) => void;
	logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);