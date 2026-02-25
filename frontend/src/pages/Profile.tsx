import { useEffect, useState, type JSX } from "react";
import Base from "../components/Base";
import { useAuthStore } from "../store/AuthStore";
import { fetchUsuario, fetchVinculo } from "../services/PersonalService";

export default function Profile(): JSX.Element {
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [personal, setPersonal] = useState<any>(null);
    const [vinculos, setVinculos] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        async function load() {
            try {
                const u = await fetchUsuario();
                if (!mounted) return;
                setPersonal(u.data ?? u);

                const v = await fetchVinculo();
                if (!mounted) return;
                // API returns { discente: DiscenteVinculoResponse[] }
                const data = v?.data?.discente ?? [];
                setVinculos(Array.isArray(data) ? data : []);
            } catch (err: any) {
                console.error("Failed to load personal data", err);
                setError(String(err?.message ?? err));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => { mounted = false; };
    }, []);

    return (
        <Base>
            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4">
                        <img src={personal?.fotoUrl || personal?.pessoa?.fotoUrl || user?.foto} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                        <div>
                            <h2 className="text-2xl font-semibold">{personal?.pessoa?.nome || personal?.nome || user?.nome}</h2>
                            <p className="text-sm text-gray-600">Curso: {user?.nomeCurso ?? personal?.curso ?? '—'}</p>
                            <p className="text-sm text-gray-600">Matrícula: {user?.matricula ?? personal?.matricula ?? '—'}</p>
                            {(personal?.pessoa?.email || personal?.email) && <p className="text-sm text-gray-600">E-mail: <a className="text-blue-600" href={`mailto:${personal?.pessoa?.email ?? personal?.email}`}>{personal?.pessoa?.email ?? personal?.email}</a></p>}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium">Vínculos</h3>
                        {loading && <p className="text-sm text-gray-500">Carregando...</p>}
                        {error && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

                        {!loading && vinculos.length === 0 && <p className="text-sm text-gray-500">Nenhum vínculo listado.</p>}

                        <ul className="mt-2 space-y-2">
                            {vinculos.map((v, i) => (
                                <li key={v.idVinculo ?? v.matricula ?? i} className="p-3 border rounded bg-white shadow-sm">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-medium">{v.curso?.nome ?? v.pessoa?.nome ?? v.matriculaNome ?? `Vínculo ${i+1}`}</div>
                                            <div className="text-sm text-gray-600">Matricula: {v.matricula ?? v.matriculaNome ?? '—'}</div>
                                            <div className="text-sm text-gray-600">E-mail: {v.email ?? v.pessoa?.email ?? '—'}</div>
                                        </div>
                                        <div className="text-sm text-gray-500 text-right">
                                            <div>{v.tipoString ?? ''}</div>
                                            {v.idVinculo && <div className="text-xs">ID: {String(v.idVinculo)}</div>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 flex gap-3">
                                <button className="px-4 py-2 border rounded" onClick={() => logout()}>Sair.</button>
                        </div>
                    </div>
                </div>
            </div>
        </Base>
    );
}