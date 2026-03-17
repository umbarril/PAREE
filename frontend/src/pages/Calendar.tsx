import type { JSX } from "react";
import { useMemo, useState } from "react";
import Base from "../components/Base";
import { useAuthStore } from "../store/AuthStore";
import { fetchClasses, fetchClassCoursePlan } from "../services/ClassesService";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { EventInput } from "@fullcalendar/core";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";

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

function minutesToTimeString(minutes: number): string {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

interface EvaluationItem {
    dataRealizacao?: string | null;
    descricao?: string | null;
}

interface EvaluationGroup {
    turmaName: string;
    avaliacoes: EvaluationItem[];
}

interface EvaluationResult {
    groups: EvaluationGroup[];
    failedCount: number;
}

const CalendarComponent = FullCalendar as unknown as (props: Record<string, unknown>) => JSX.Element;

export default function Calendar(): JSX.Element {
    const user = useAuthStore((s) => s.user);
    const [showEvaluations, setShowEvaluations] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const {
        data: classes = [],
        isLoading,
        isError: isClassesError,
        error: classesError,
        refetch: refetchClasses,
    } = useQuery<TurmaResponse[]>({
        queryKey: ["calendar", "classes", user?.matricula],
        enabled: Boolean(user?.matricula),
        queryFn: async () => {
            if (!user?.matricula) return [];
            const res = await fetchClasses(user.matricula);
            const data = (res as any).data ?? res;
            return Array.isArray(data) ? data : [];
        },
    });

    const {
        data: evaluationsData,
        isLoading: isEvaluationsLoading,
        isError: isEvaluationsError,
        error: evaluationsError,
        refetch: refetchEvaluations,
    } = useQuery<EvaluationResult>({
        queryKey: ["calendar", "evaluations", classes.map((t) => t.idTurma).join(",")],
        enabled: showEvaluations && classes.length > 0,
        queryFn: async () => {
            const settled = await Promise.allSettled(
                classes.map(async (t) => {
                    const cp = await fetchClassCoursePlan(String(t.idTurma));
                    return {
                        turmaName: t.nome,
                        avaliacoes: (cp.avaliacoes ?? []).map((a) => ({
                            dataRealizacao: a.dataRealizacao,
                            descricao: a.descricao,
                        })),
                    };
                }),
            );

            const groups: EvaluationGroup[] = [];
            let failed = 0;

            settled.forEach((item) => {
                if (item.status === "fulfilled") {
                    groups.push(item.value);
                    return;
                }

                failed += 1;
            });

            if (failed > 0 && groups.length === 0) {
                throw new Error("Nao foi possivel carregar as avaliacoes das turmas.");
            }

            return {
                groups,
                failedCount: failed,
            };
        },
    });

    const events = useMemo<EventInput[]>(() => {
        const ev: EventInput[] = [];

        classes.forEach((t) => {
            const groupedByDay = new Map<number, Array<{ start: number; end: number }>>();

            (t.horarioTurma ?? []).forEach((h) => {
                const day = mapDayToIndex(h.dia);
                const start = parseTimeToMinutes(h.horaInicio ?? h.horaInicio);
                const end = parseTimeToMinutes(h.horaFim ?? h.horaFim);
                if (day === null || start === null || end === null) return;

                const intervals = groupedByDay.get(day) ?? [];
                intervals.push({ start, end });
                groupedByDay.set(day, intervals);
            });

            groupedByDay.forEach((intervals, day) => {
                const merged = intervals
                    .sort((a, b) => a.start - b.start)
                    .reduce<Array<{ start: number; end: number }>>((acc, interval) => {
                        const last = acc[acc.length - 1];
                        if (!last) {
                            acc.push({ ...interval });
                            return acc;
                        }

                        if (interval.start <= last.end) {
                            last.end = Math.max(last.end, interval.end);
                            return acc;
                        }

                        acc.push({ ...interval });
                        return acc;
                    }, []);

                merged.forEach((interval) => {
                    ev.push({
                        id: `class-${t.idTurma}-${day}-${interval.start}`,
                        title: t.nome,
                        daysOfWeek: [day === 6 ? 0 : day + 1],
                        startTime: minutesToTimeString(interval.start),
                        endTime: minutesToTimeString(interval.end),
                        display: "block",
                        color: "#1565c0",
                        extendedProps: {
                            kind: "class",
                            professor: t.docentes?.join(", ") ?? "",
                            courseCode: t.codigoTurma,
                        },
                    });
                });
            });
        });

        if (showEvaluations && evaluationsData?.groups?.length) {
            evaluationsData.groups.forEach((group) => {
                group.avaliacoes.forEach((a, index) => {
                    const rawDate = a.dataRealizacao;
                    if (!rawDate) return;

                    const dt = new Date(rawDate);
                    if (Number.isNaN(dt.getTime())) return;

                    const dateOnly = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

                    ev.push({
                        id: `evaluation-${group.turmaName}-${index}-${dateOnly}`,
                        title: `${group.turmaName}: ${a.descricao?.trim() || "Avaliacao"}`,
                        start: dateOnly,
                        allDay: true,
                        color: "#d32f2f",
                        extendedProps: {
                            kind: "evaluation",
                        },
                    });
                });
            });
        }

        return ev;
    }, [classes, evaluationsData, showEvaluations]);

    // const handleGoogleSync = () => {
    //     alert("Sincronizar com Google Calendar: funcionalidade em desenvolvimento.");
    // };

    return (
        <Base>
            <Box sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>
                <Box sx={{ maxWidth: 1280, mx: "auto" }}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                    >
                        <Typography variant="h5">Calendário Acadêmico</Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                            <FormControlLabel
                                control={<Checkbox checked={showEvaluations} onChange={(e) => setShowEvaluations(e.target.checked)} />}
                                label="Mostrar avaliacoes"
                            />
                            {/* <Button variant="outlined" onClick={handleGoogleSync}>
                                Sincronizar com Google Calendar
                            </Button> */}
                        </Stack>
                    </Stack>

                    {!user?.matricula && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Nao foi encontrada matricula de usuario para carregar as turmas.
                        </Alert>
                    )}

                    {isClassesError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 2 }}
                            action={
                                <Button color="inherit" size="small" onClick={() => refetchClasses()}>
                                    Tentar novamente
                                </Button>
                            }
                        >
                            Falha ao carregar turmas: {String(classesError instanceof Error ? classesError.message : classesError)}
                        </Alert>
                    )}

                    {isLoading && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                                Carregando turmas...
                            </Typography>
                        </Stack>
                    )}

                    {showEvaluations && isEvaluationsError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 2 }}
                            action={
                                <Button color="inherit" size="small" onClick={() => refetchEvaluations()}>
                                    Tentar novamente
                                </Button>
                            }
                        >
                            Falha ao carregar avaliacoes: {String(evaluationsError instanceof Error ? evaluationsError.message : evaluationsError)}
                        </Alert>
                    )}

                    {showEvaluations && !isEvaluationsError && (evaluationsData?.failedCount ?? 0) > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Algumas turmas nao tiveram avaliacoes carregadas. Exibindo os dados disponiveis.
                        </Alert>
                    )}

                    <Box
                        sx={{
                            mt: 2,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "#fff",
                            "& .fc": {
                                fontSize: { xs: "0.85rem", md: "0.95rem" },
                            },
                            "& .fc-toolbar": {
                                flexWrap: "wrap",
                                rowGap: 1,
                                px: { xs: 1, md: 2 },
                                pt: { xs: 1, md: 2 },
                            },
                            "& .fc-toolbar-title": {
                                fontSize: { xs: "1rem", md: "1.2rem" },
                            },
                            "& .fc-button": {
                                textTransform: "capitalize",
                            },
                            "& .fc-timegrid-slot": {
                                height: { xs: "2rem", md: "2.3rem" },
                            },
                            "& .fc-daygrid-day-frame": {
                                minHeight: "3rem",
                            },
                        }}
                    >
                        <CalendarComponent
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            locale={ptBrLocale}
                            initialView={isMobile ? "listWeek" : "timeGridWeek"}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: isMobile ? "listWeek,dayGridMonth" : "timeGridWeek,dayGridMonth,listWeek",
                            }}
                            buttonText={{
                                today: "hoje",
                                month: "mes",
                                week: "semana",
                                day: "dia",
                                list: "lista",
                            }}
                            allDayText="Dia inteiro"
                            noEventsContent="Nenhum evento para exibir"
                            events={events}
                            firstDay={1}
                            slotMinTime="07:00:00"
                            slotMaxTime="22:00:00"
                            slotDuration="01:00:00"
                            slotLabelInterval="01:00:00"
                            nowIndicator
                            expandRows
                            eventDisplay="block"
                            height="auto"
                            stickyHeaderDates
                        />
                    </Box>

                    {showEvaluations && isEvaluationsLoading && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                                Carregando avaliacoes...
                            </Typography>
                        </Stack>
                    )}
                </Box>
            </Box>
        </Base>
    );
}