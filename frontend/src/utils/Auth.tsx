import { useContext, useEffect, useState, type PropsWithChildren } from "react";
import type { AuthResponse } from "../types/AuthResponse";
import { AuthResponseMock } from "./AuthMock";
import { AuthContext, type AuthContextValue } from "./AuthContext";

type AuthProviderProps = PropsWithChildren<{
  testMode: boolean;
}>;

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default function AuthProvider({ children, testMode }: AuthProviderProps) {
  const [authData, setAuthData] = useState<AuthResponse | null>(() => {
    if (testMode) return AuthResponseMock;
    try {
      const raw = localStorage.getItem("authData");
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (authData) {
        localStorage.setItem("authData", JSON.stringify(authData));
      } else {
        localStorage.removeItem("authData");
      }
    } catch {
      // ignore storage errors
    }
  }, [authData]);

  const logout = () => setAuthData(null);

  const value: AuthContextValue = { authData, setAuthData, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

