import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import Base from "../components/Base";
import { useAuth } from "../utils/AuthProvider";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import { fetchClasses } from "../utils/ClassesService";
import { generateVibrantColor } from "../utils/ThemeHelper";

// todo: adicionar temas
export default function Home(): JSX.Element {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<TurmaResponse[]>([]);

    const auth = useAuth();
    const navigate = useNavigate();

    const matricula: string | number | undefined = auth?.authData?.DISCENTE?.[0]?.matricula;
    const access_token: string | undefined = auth?.authData?.access_token;

    useEffect(() => {
        async function run() {
            if (!matricula || !access_token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setClasses(await fetchClasses(matricula.toString(), access_token));
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        run();
    }, [matricula, access_token]);

    const goToClass = (id: string) => navigate(`/class/${id}`);
    return (
        <Base>
            <div className="flex-1 flex flex-col">
                <main className="p-6 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="m-0 text-xl font-semibold">Suas Turmas</h2>
                        </div>
                    </div>

                    {/* todo: melhorar aparência e por botão para recarregar */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Carregando...
                        </>
                    ) : (
                        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="Lista de turmas">
                            {classes.map((c) => (
                                <article
                                    key={c.idTurma}
                                    role="button"
                                    onClick={() => goToClass(c.idTurma.toString())}
                                    style={{ background: generateVibrantColor(c.nome) }}
                                    className="p-4 rounded-xl shadow-sm cursor-pointer flex flex-col gap-2 min-h-27.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") goToClass(c.idTurma.toString());
                                    }}
                                >
                                    <div className="text-base font-bold text-slate-900">{c.nome}</div>
                                    <div className="text-sm text-slate-600">{c.docentes?.join(", ")}</div>
                                    <div className="mt-auto flex items-center justify-between text-sm text-slate-700">
                                        <div>{c.local}</div>
                                        <div>Ver →</div>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </main>
            </div>
        </Base>
    );
}
