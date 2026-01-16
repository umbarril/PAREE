import { useState, type ChangeEvent, type FormEvent, type JSX } from "react";
import type { AuthResponse } from "../types/AuthResponse";
import { useAuth } from "../utils/Auth";
import { useNavigate } from "react-router";

export default function LoginPortal(): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // authData is stored in global context; use context setter to persist login
  const { setAuthData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!username) {
      setError("Por favor, insira um nome de usuário válido.");
      return;
    }

    if (!password) {
      setError("Por favor, insira uma senha válida.");
      return;
    }

    setLoading(true);

    // Prepare URL-encoded body
    const bodyParams = new URLSearchParams({
      grant_type: "password",
      username: username,
      password: password,
    });

    try {
      const response = await fetch("https://sistemas.ufpb.br/auth-server/oauth/token", {
        method: "POST",
        headers: {
          Authorization:
            "Basic c2lnYWEtZGlzY2VudGUtbW9iaWxlOjZkMDYyODBkMTc5MzY3ZjhmM2I3ZjhmYmJjNmJmOTgx",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          Accept: "application/json",
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth failed with status: ${response.status}. ${text}`);
      }

      const data: AuthResponse = await response.json();
      setAuthData(data);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col max-w-md h-screen items-center justify-center bg-gray-50 px-4 px col-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-400">PAREE</h1>
          <p className="text-gray-500 mt-2 uppercase tracking-wide">
            Portal do Discente
          </p>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-wide">
            Conceito de interface para o SIGAA
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Nome de Usuário
            </label>
            <input
              id="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="Senha"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="
                mt-1 block w-full px-3 py-2 
                border border-gray-300 rounded-md shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                transition-all"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5
              px-4 border border-transparent 
              rounded-md shadow-sm text-sm 
              font-bold text-white 
              bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Autenticando...
              </>
            ) : (
              "ENTRAR NO PORTAL"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

