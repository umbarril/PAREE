import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import Base from "../components/Base";
import { useAuth } from "../utils/Auth";
import type { Turma } from "../utils/StudentClasses";

// gera uma cor vibrante baseada em uma string de entrada
// todo: melhorar essa função para gerar cores mais variadas
// todo: ter certeza de que o texto é legível sobre a cor de fundo gerada
const generateVibrantColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to get a Hue between 0 and 360
  const hue = Math.abs(hash % 360);
  // Return HSL string (70% saturation, 50% lightness for balanced colors)
  return `hsl(${hue}, 70%, 50%)`;
};

export default function Home(): JSX.Element {
    // todo
    const [loading, setLoading] = useState(true);
    // todo
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<Turma[]>([]);

    const auth = useAuth();
    const navigate = useNavigate();

    const matricula: string | number | undefined = auth?.authData?.DISCENTE?.[0]?.matricula;
    const access_token: string | undefined = auth?.authData?.access_token;

    useEffect(() => {
        if (!matricula || !access_token) {
            // nothing to do yet
            setLoading(false);
            return;
        }

        async function fetchClasses() {
            try {
                const response = await fetch(
                    `http://localhost:8085/sigaa/mobile/discente/${matricula}/turmas`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            "Content-Type": "application/json",
                            "User-Agent": "Dart/2.10 (dart:io)",
                            "Accept-Encoding": "gzip",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch classes: ${response.status}`);
                }

                const data = await response.json();
                setClasses(data as unknown as Turma[]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        void fetchClasses();
    }, [matricula, access_token]);

    const goToClass = (id: string) => navigate(`/classes/${id}`);
    return (
        <Base>
            <div className="flex-1 flex flex-col">
                <main className="p-6 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="m-0 text-xl font-semibold">Suas Turmas</h2>
                    </div>
                </div>

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
                </main>
            </div>
        </Base>
    );
}
