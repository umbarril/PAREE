import { type JSX, useState } from "react";
import { useNavigate } from "react-router";
import Base from "../components/Base";
import { fetchClassCoursePlan, fetchClassNews, fetchClassProfessors, fetchClasses } from "../services/ClassesService";
import { generateColorFromPallete } from "../ThemeHelper";
import { useAuthStore } from "../store/AuthStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { Avaliacao, CoursePlanResponse } from "../types/CoursePlanResponse";
import type { NewsPieceResponse } from "../types/NewsResponse";
import type { ProfessorResponse } from "../types/DocenteResponse";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import { Box, LinearProgress } from "@mui/material";
import { BiTime } from "react-icons/bi";

type ClassPreviewData = {
    news: NewsPieceResponse[];
    professors: ProfessorResponse[];
    coursePlan: CoursePlanResponse | null;
};

function stripHtml(raw: string): string {
    return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value?: string | null): Date | null {
    if (!value) return null;

    const raw = value.trim();
    if (!raw) return null;

    // formato SIGAA: dd/MM/yyyy HH:mm 
    const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
        const day = Number(brMatch[1]);
        const month = Number(brMatch[2]);
        const yearRaw = Number(brMatch[3]);
        const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
        const hour = Number(brMatch[4] ?? 0);
        const minute = Number(brMatch[5] ?? 0);
        const second = Number(brMatch[6] ?? 0);

        const parsed = new Date(year, month - 1, day, hour, minute, second, 0);
        if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        ) {
            return parsed;
        }
        return null;
    }

    // Handle yyyy-MM-dd (and optional time) without timezone surprises.
    const isoDateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (isoDateOnlyMatch) {
        const year = Number(isoDateOnlyMatch[1]);
        const month = Number(isoDateOnlyMatch[2]);
        const day = Number(isoDateOnlyMatch[3]);
        const hour = Number(isoDateOnlyMatch[4] ?? 0);
        const minute = Number(isoDateOnlyMatch[5] ?? 0);
        const second = Number(isoDateOnlyMatch[6] ?? 0);

        const parsed = new Date(year, month - 1, day, hour, minute, second, 0);
        if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        ) {
            return parsed;
        }
        return null;
    }

    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d;
}

function getLatestNews(news: NewsPieceResponse[]): NewsPieceResponse | null {
    if (!news.length) return null;

    const today = startOfDay(new Date());
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 14);

    // api já retorna as notícias em ordem decrescente, então basta achar a primeira que esteja dentro da janela de 14 dias.
    const firstRecent = news.find((piece) => {
        const pieceDate = parseDate(piece.data);
        if (!pieceDate) return false;
        return startOfDay(pieceDate).getTime() >= cutoff.getTime();
    });

    return firstRecent ?? null;
}

function getNextEvaluation(coursePlan: CoursePlanResponse | null): Avaliacao | null {
    if (!coursePlan?.avaliacoes?.length) return null;
    const todayStart = startOfDay(new Date());

    const upcoming = coursePlan.avaliacoes
        .filter((a) => {
            const d = parseDate(a.dataRealizacao);
            return d ? startOfDay(d).getTime() >= todayStart.getTime() : false;
        })
        .sort((a, b) => {
            const ta = parseDate(a.dataRealizacao)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const tb = parseDate(b.dataRealizacao)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return ta - tb;
        });

    return upcoming[0] ?? null;
}

function formatDate(value?: string | null): string {
    const d = parseDate(value);
    if (!d) return "Data indefinida";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getDaysUntil(value?: string | null): number | null {
    const d = parseDate(value);
    if (!d) return null;

    const now = new Date();
    const start = startOfDay(now);
    const target = startOfDay(d);
    return Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(value?: string | null): string {
    const diff = getDaysUntil(value);
    if (diff === null) return "sem data";

    if (diff === 0) return "hoje";
    if (diff === 1) return "amanha";
    return `em ${diff} dias`;
}

function getProfessorInitials(name?: string): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function toDisplayName(name: string): string {
    const joinLower = new Set(["de", "da", "do", "dos", "das", "e"]);
    return name
        .toLowerCase()
        .split(/\s+/)
        .map((part, index) => {
            if (!part) return part;
            if (index > 0 && joinLower.has(part)) return part;
            return part
                .split("-")
                .map((token) => token ? `${token[0].toUpperCase()}${token.slice(1)}` : token)
                .join("-");
        })
        .join(" ");
}

function buildProfessorLine(
    professors: ProfessorResponse[],
    docentesFallback?: string[] | null,
): { line: string; full: string } {
    const raw =
        professors.length > 0
            ? professors.map((p) => toDisplayName(p.nome)).filter(Boolean)
            : (docentesFallback ?? []).map(toDisplayName);

    if (raw.length === 0) return { line: "", full: "" };

    const full = raw.join(", ");
    const visible = raw.slice(0, 3);

    // char budget per name shrinks as more names are shown
    const perName = [28, 15, 9][Math.min(visible.length - 1, 2)];
    const line = visible
        .map((n) => (n.length > perName ? `${n.slice(0, perName - 1).trimEnd()}\u2026` : n))
        .join(", ");

    return { line, full };
}

function buildScheduleLines(turma: TurmaResponse): string[] {
    if (Array.isArray(turma.horarioTurma) && turma.horarioTurma.length > 0) {
        const normalized = turma.horarioTurma
            .map((h) => {
                const day = h.dia?.trim();
                const start = h.horaInicio?.trim();
                const end = h.horaFim?.trim();
                if (!day || !start || !end) return null;
                return `${day}: ${start} - ${end}`;
            })
            .filter((line): line is string => Boolean(line));

        return Array.from(new Set(normalized));
    }

    const raw = turma.horario?.trim();
    if (!raw) return ["Horario nao informado"];

    const split = raw
        .split(/\s*(?:\|+|;|,)\s*/)
        .map((part) => part.trim())
        .filter(Boolean);

    return split.length ? split : [raw];
}

function ClassCard({
    turma,
    preview,
    isPreviewLoading,
    onOpen,
}: {
    turma: TurmaResponse;
    preview?: ClassPreviewData;
    isPreviewLoading: boolean;
    onOpen: () => void;
}): JSX.Element {
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const latestNews = getLatestNews(preview?.news ?? []);
    const nextEvaluation = getNextEvaluation(preview?.coursePlan ?? null);
    const nextEvaluationDays = getDaysUntil(nextEvaluation?.dataRealizacao);
    const shouldHighlightEvaluationTime = nextEvaluationDays !== null && nextEvaluationDays <= 7;
    const isDistantEvaluation = nextEvaluationDays !== null && nextEvaluationDays > 14;
    const professors = preview?.professors ?? [];
    const scheduleLines = buildScheduleLines(turma);
    const multiple = professors.length > 1;
    const visibleAvatars = professors.slice(0, 2);
    const hiddenCount = Math.max(0, professors.length - visibleAvatars.length);
    const avatarSize = multiple ? "w-10 h-10" : "w-14 h-14";
    const avatarTextSize = multiple ? "text-xs" : "text-sm";
    const spacing = multiple ? "mt-7" : "mt-4"; // baseado no tamanho do avatar
    const bodyPt = multiple ? "pt-5" : "pt-7";
    const { line: professorLine, full: professorFull } = buildProfessorLine(professors, turma.docentes);

    return (
        <article
            role="button"
            onClick={onOpen}
            className="h-full rounded-xl border border-slate-200 shadow-sm cursor-pointer bg-white overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 flex flex-col"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen();
            }}
        >
            <div className="relative h-32 p-4" style={{ background: generateColorFromPallete(turma.nome) }}>
                <div className="min-w-0">
                    <h3
                        className="text-lg font-bold text-slate-900 leading-tight truncate"
                        title={turma.nome}
                    >
                        {turma.nome}
                    </h3>
                    <p
                        className="text-[11px] text-slate-800 mt-1 truncate"
                        title={professorFull}
                    >
                        {professorLine}
                    </p>
                    <p className="text-sm text-slate-800/90 mt-1 truncate">{turma.local}</p>
                </div>

                <div className="absolute right-3 bottom-0 translate-y-1/2 z-10 flex items-center -space-x-2">
                    {visibleAvatars.map((p) =>
                        p.urlFoto ? (
                            <img
                                key={p.email || p.nome}
                                src={p.urlFoto}
                                alt={p.nome}
                                className={`${avatarSize} rounded-full object-cover`}
                            />
                        ) : (
                            <div
                                key={p.email || p.nome}
                                className={`${avatarSize} rounded-full bg-slate-700 text-white ${avatarTextSize} font-semibold flex items-center justify-center`}
                            >
                                {getProfessorInitials(p.nome)}
                            </div>
                        )
                    )}
                    {hiddenCount > 0 && (
                        <div className={`${avatarSize} rounded-full bg-slate-900 text-white ${avatarTextSize} font-semibold flex items-center justify-center`}>
                            +{hiddenCount}
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex-1 p-4 ${bodyPt} flex flex-col gap-3 ${spacing}`}>
                {isPreviewLoading && !latestNews ? (
                        <p className="text-sm text-slate-500">Carregando...</p>
                ) : latestNews ? (
                    <div >
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Última notícia</p>
                            {latestNews && <p className="text-xs text-slate-500 shrink-0">{formatDate(latestNews.data)}</p>}
                        </div>
                        <p className="text-sm font-medium text-slate-900 wrap-break-word line-clamp-3" title={latestNews.descricaoNoticia || stripHtml(latestNews.htmlNoticia || "Sem titulo")}>
                            {latestNews.descricaoNoticia || stripHtml(latestNews.htmlNoticia || "Sem titulo")}
                        </p>
                        <div className="border-b border-slate-200 pt-2"></div>
                    </div>
                ) : (<></>)}

                <div>
                    {nextEvaluation && (
                        <>
                            <p className={`text-[11px] uppercase tracking-wide ${isDistantEvaluation ? "text-slate-400" : "text-slate-500"}`}>Proxima avaliacao</p>
                            <p className={`text-sm font-medium line-clamp-2 wrap-break-word ${isDistantEvaluation ? "text-slate-500" : "text-slate-900"}`} title={nextEvaluation.descricao}>
                                {nextEvaluation.descricao || "Avaliacao"}
                            </p>
                            <p className={`text-xs ${shouldHighlightEvaluationTime ? "text-amber-700" : isDistantEvaluation ? "text-slate-400" : "text-slate-500"}`}>
                                {formatDate(nextEvaluation.dataRealizacao)}
                                {shouldHighlightEvaluationTime ? ` • ${daysUntil(nextEvaluation.dataRealizacao)}` : ""}
                            </p>
                        </>
                    )}
                </div>

                <div className="mt-auto border-t border-slate-200 pt-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label={`Mostrar horarios da turma ${turma.nome}`}
                            aria-expanded={isScheduleOpen}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsScheduleOpen((prev) => !prev);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                }
                            }}
                        >
                            <BiTime className="text-base" />
                            <span>Horarios</span>
                        </button>
                        <span className="font-medium">Ver →</span>
                    </div>
                    {isScheduleOpen && (
                        <ul className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                            {scheduleLines.map((line, index) => (
                                <li key={`${turma.idTurma}-${index}`}>{line}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </article>
    );
}

// todo: adicionar temas
export default function Home(): JSX.Element {
    const { user } = useAuthStore();

    const navigate = useNavigate();
    const goToClass = (id: string) => navigate(`/class/${id}`);

    const { data: classes = [], isFetching: isFetchingClasses, isPending, error } = useQuery({
        queryKey: ['classes', user?.matricula],
        queryFn: async () => {
            if (!user) throw new Error("Usuário não autenticado. Por favor, faça login.");
            if (!user.matricula) throw new Error("Matrícula do usuário não encontrada. Por favor, verifique suas informações de perfil.");
            const { data } = await fetchClasses(user.matricula);
            return data;
        },
    })

    const classPreviewQueries = useQueries({
        queries: classes.map((c) => ({
            queryKey: ["class", c.idTurma, "home-preview"],
            queryFn: async (): Promise<ClassPreviewData> => {
                const [newsResult, professorsResult, coursePlanResult] = await Promise.allSettled([
                    fetchClassNews(String(c.idTurma)),
                    fetchClassProfessors(String(c.idTurma)),
                    fetchClassCoursePlan(String(c.idTurma)),
                ]);

                return {
                    news: newsResult.status === "fulfilled" ? newsResult.value : [],
                    professors: professorsResult.status === "fulfilled" ? professorsResult.value : [],
                    coursePlan: coursePlanResult.status === "fulfilled" ? coursePlanResult.value : null,
                };
            },
            staleTime: 1000 * 60 * 5,
        })),
    });

    return (
        <Base>
            <Box sx={{ width: '100%' }}>
                {isFetchingClasses && <LinearProgress />}
            </Box>
            <div className="flex-1 flex flex-col">
                <main className="p-6 overflow-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
                           Um erro ocorreu ao carregar suas turmas. 
                        </div>
                    )}

                    {isPending ? (
                        <>
                            <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Carregando...

                            {/* trocar por um circulo girando */}
                        </>
                    ) : classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <p className="text-base font-medium">Nenhuma turma encontrada</p>
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="Lista de turmas">
                            {classes.map((c, index) => {
                                const previewQuery = classPreviewQueries[index];
                                return (
                                    <ClassCard
                                        key={c.idTurma}
                                        turma={c}
                                        preview={previewQuery?.data}
                                        isPreviewLoading={Boolean(previewQuery?.isFetching)}
                                        onOpen={() => goToClass(c.idTurma.toString())}
                                    />
                                );
                            })}
                        </section>
                    )}
                </main>
            </div>
        </Base>
    );
}
