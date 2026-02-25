import { useEffect, useState, type ChangeEvent, type FormEvent, type JSX } from "react";
// import { useNavigate } from "react-router";
import { fetchAuthData } from "../services/LoginService";
import { authResponseToUser, useAuthStore } from "../store/AuthStore";
import { useNavigate } from "react-router";

export default function LoginPortal(): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  if (isAuthenticated) {
    useEffect(() => {
      navigate("/");
    }, [navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Você já está logado</h1>
          <p className="text-gray-500">Redirecionando para a página inicial...</p>
        </div>
      </div>
    );
  }

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
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
    try {
      const response = await fetchAuthData(username, password);
      login(authResponseToUser(response.data));
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

