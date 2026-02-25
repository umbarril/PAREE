import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import { useAuthStore } from "../store/AuthStore";
import { fetchClasses, fetchClassCoursePlan } from "../services/ClassesService";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import type { CoursePlanResponse } from "../types/CoursePlanResponse";
import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";

function mapDayToIndex(d?: string | null): number | null {
    if (!d) return null;
    const s = String(d).toLowerCase();
    if (s.includes("segunda")) return 0;
    if (s.includes("terça") || s.includes("terca")) return 1;
    if (s.includes("quarta")) return 2;
    if (s.includes("quinta")) return 3;
    if (s.includes("sexta")) return 4;
    if (s.includes("sábado") || s.includes("sabado")) return 5;
    if (s.includes("domingo")) return 6;
    // try numbers
    const n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0 && n <= 6) return n;
    return null;
}

function parseTimeToMinutes(t?: string | null): number | null {
    if (!t) return null;
    const m = String(t).match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    return hh * 60 + mm;
}

export default function Calendar(): JSX.Element {
    const user = useAuthStore((s) => s.user);
    const [classes, setClasses] = useState<TurmaResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEvaluations, setShowEvaluations] = useState(false);
    const [evaluations, setEvaluations] = useState<Array<{ turmaName: string; avaliacoes: any[]; }>>([]);

    useEffect(() => {
        if (!user?.matricula) return;
        let mounted = true;
        setLoading(true);
        setError(null);
        fetchClasses(user.matricula)
            .then((res) => {
                const data = (res as any).data ?? res;
                if (!mounted) return;
                setClasses(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Failed to fetch classes", err);
                if (!mounted) return;
                setError(String(err?.message ?? err));
            })
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [user?.matricula]);

    // fetch evaluations on demand to avoid many requests by default
    useEffect(() => {
        if (!showEvaluations) return;
        if (classes.length === 0) return;

        let mounted = true;
        (async () => {
            const results: Array<{ turmaName: string; avaliacoes: any[] }> = [];
            for (const t of classes) {
                try {
                    const cp: CoursePlanResponse = await fetchClassCoursePlan(String(t.idTurma));
                    if (!mounted) break;
                    results.push({ turmaName: t.nome, avaliacoes: (cp.avaliacoes ?? []).map(a => ({ ...a, turma: t.nome })) });
                } catch (err) {
                    console.warn("Failed to fetch course plan for", t.idTurma, err);
                }
            }
            if (mounted) setEvaluations(results);
        })();

        return () => { mounted = false; };
    }, [showEvaluations, classes]);

    // prepare events from class schedules
    const events = useMemo(() => {
        const ev: Array<{ title: string; day: number; startMin: number; endMin: number; turma: TurmaResponse }> = [];
        classes.forEach((t) => {
            (t.horarioTurma ?? []).forEach((h) => {
                const day = mapDayToIndex(h.dia);
                const start = parseTimeToMinutes(h.horaInicio ?? h.horaInicio);
                const end = parseTimeToMinutes(h.horaFim ?? h.horaFim);
                if (day === null || start === null || end === null) return;
                ev.push({ title: t.nome, day, startMin: start, endMin: end, turma: t });
            });
        });
        return ev;
    }, [classes]);

    const startHour = 7;
    const endHour = 22;
    const hourHeight = 56; // px per hour

    const handleGoogleSync = () => {
        // placeholder - real implementation will create events and redirect to Google Calendar OAuth/Import
        alert('Sincronizar com Google Calendar: funcionalidade em desenvolvimento.');
    };

    return (
        <Base>
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Typography variant="h5">Calendário Acadêmico</Typography>
                        <div className="flex items-center gap-3">
                            <FormControlLabel control={<Checkbox checked={showEvaluations} onChange={(e) => setShowEvaluations(e.target.checked)} />} label="Mostrar avaliações" />
                            <Button variant="outlined" onClick={handleGoogleSync}>Sincronizar com Google Calendar</Button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div style={{ border: '1px solid rgba(0,0,0,0.06)', background: '#f3f4f6', minHeight: 520, display: 'flex', overflow: 'auto' }}>
                            {/* hours column */}
                            <div style={{ width: 64, borderRight: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                                {Array.from({ length: endHour - startHour }).map((_, i) => (
                                    <div key={i} style={{ height: hourHeight, boxSizing: 'border-box', paddingLeft: 6, fontSize: 12, color: '#4b5563' }}>{`${String(startHour + i).padStart(2, '0')}:00`}</div>
                                ))}
                            </div>

                            {/* days area */}
                            <div style={{ flex: 1, display: 'flex' }}>
                                {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].map((dayLabel, idx) => (
                                    <div key={dayLabel} style={{ flex: 1, borderLeft: '1px solid rgba(0,0,0,0.04)', position: 'relative', minWidth: 120 }}>
                                        <div style={{ height: 36, padding: 8, borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fff' }}>
                                            <strong style={{ fontSize: 13 }}>{dayLabel}</strong>
                                        </div>
                                        <div style={{ position: 'relative', minHeight: (endHour - startHour) * hourHeight }}>
                                            {events.filter(e => e.day === idx).map((e, i) => {
                                                const top = ((e.startMin / 60) - startHour) * hourHeight;
                                                const height = ((e.endMin - e.startMin) / 60) * hourHeight;
                                                const clampedTop = Math.max(0, top);
                                                const clampedHeight = Math.max(20, height - Math.max(0, 0 - top));
                                                return (
                                                    <div key={i} title={`${e.title} ${Math.floor(e.startMin/60)}:${String(e.startMin%60).padStart(2,'0')}-${Math.floor(e.endMin/60)}:${String(e.endMin%60).padStart(2,'0')}`} style={{ position: 'absolute', left: 6, right: 6, top: clampedTop, height: clampedHeight, background: '#2563eb', color: '#fff', borderRadius: 6, padding: '6px 8px', fontSize: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                                                        <div style={{ fontSize: 11, opacity: 0.9 }}>{`${String(Math.floor(e.startMin/60)).padStart(2,'0')}:${String(e.startMin%60).padStart(2,'0')} — ${String(Math.floor(e.endMin/60)).padStart(2,'0')}:${String(e.endMin%60).padStart(2,'0')}`}</div>
                                                    </div>
                                                );
                                            })}
                                            {/* small markers for evaluations on this day */}
                                            {showEvaluations && evaluations.flatMap(r => r.avaliacoes.map(a => ({ turma: r.turmaName, data: a.dataRealizacao }))).filter(ev => {
                                                if (!ev.data) return false;
                                                const dt = new Date(ev.data);
                                                if (isNaN(dt.getTime())) return false;
                                                return dt.getDay() === ((idx + 1) % 7); // JS: 0=Sunday, so Monday=1 -> idx 0 -> 1
                                            }).map((ev, i) => (
                                                <div key={`eval-${idx}-${i}`} style={{ position: 'absolute', right: 6, top: 8 + i * 20, background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{ev.turma}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Typography variant="h6">Avaliações</Typography>
                            {!showEvaluations && <Typography variant="body2" color="textSecondary">Ative "Mostrar avaliações" para carregar e exibir as avaliações.</Typography>}
                            {showEvaluations && evaluations.length === 0 && <Typography variant="body2" color="textSecondary">Nenhuma avaliação encontrada.</Typography>}
                            {showEvaluations && evaluations.map((r, i) => (
                                <Box key={i} sx={{ mt: 1, p: 1, background: '#fff', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                                    <Typography variant="subtitle2">{r.turmaName}</Typography>
                                    <ul>
                                        {r.avaliacoes.map((a, j) => (
                                            <li key={j}>{a.dataRealizacao ?? a.data ?? '—'} — {a.descricao ?? a.descricao ?? 'Avaliação'}</li>
                                        ))}
                                    </ul>
                                </Box>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Base>
    );
}