import { useEffect, useMemo, useState, type JSX } from "react";
import Base from "../components/Base";
import { useParams, useNavigate, useLocation } from "react-router";
import { fetchClassCoursePlan, fetchClassFrequency, fetchClassMissesAndGrades, fetchClassNews, fetchClassProfessors, fetchClassStudents } from "../services/ClassesService";
import { useAuthStore } from "../store/AuthStore";
import DOMPurify from "dompurify";
import type { Arquivo, CoursePlanResponse } from "../types/CoursePlanResponse";
import type { ProfessorResponse } from "../types/DocenteResponse";
import type { MissesAndGradesResponse } from "../types/MissesAndGradesResponse";
import type { StudentResponse } from "../types/DiscenteResponse";
import { Box, Grid, Card, CardHeader, CardContent, Avatar, Tooltip, Typography, Container, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemAvatar, IconButton, Link as MuiLink, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Menu, MenuItem, LinearProgress, useMediaQuery, useTheme, Collapse } from "@mui/material";
import { BiBookBookmark, BiDetail, BiDotsVerticalRounded, BiExpandVertical, BiMailSend, BiHomeAlt2, BiBookContent, BiGroup, BiGridAlt, BiCalendarEvent, BiAlarm } from "react-icons/bi";
import { useQuery } from "@tanstack/react-query";
import type { FrequencyResponse, FrequencyResponseItem } from "../types/FrequencyResponse";

export default function Classes(): JSX.Element {
  const { id } = useParams();

  const user = useAuthStore((store) => store.user);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<number>(0);

  const menuList = ["Principal", "Plano de Curso", "Participantes", "Outros"];
  const menuIcons = [BiHomeAlt2, BiBookContent, BiGroup, BiGridAlt] as const;

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  const pathToMenu = (path: string) => {
    if (path.endsWith('/courseplan')) return 1;
    if (path.endsWith('/people')) return 2;
    if (path.endsWith('/other')) return 3;
    return 0;
  }

  useEffect(() => {
    // sync tab with URL when location changes
    setMenu(pathToMenu(location.pathname));
  }, [location.pathname]);

  const error = useMemo(() => {
    if (user === null) return "User is null";
    if (user?.matricula === null) return "Matricula is undefined";
    if (id === undefined) return "Class id is undefined";
    return null;
  }, [id, user]);

  return (
    <Base>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Linear progress just below the topbar to indicate any page-level loading */}
      <Box sx={{ width: '100%' }}>
        {loading && <LinearProgress />}
      </Box>

      <div className="flex-1 flex flex-col">
        <main className={menu === 0 ? "p-6 overflow-hidden" : "p-6 overflow-auto"}>
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={menu}
              variant={isCompact ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTabs-flexContainer': {
                  gap: { xs: 0.5, sm: 1 },
                },
                '& .MuiTab-root': {
                  minWidth: { xs: 86, sm: 120 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 1, sm: 1.25 },
                  fontSize: { xs: '0.7rem', sm: '0.82rem', md: '0.875rem' },
                },
              }}
              onChange={(_, v) => {
                const idx = v as number;
                setMenu(idx);
                const base = `/class/${id}`;
                const path = idx === 0 ? base : idx === 1 ? `${base}/courseplan` : idx === 2 ? `${base}/people` : `${base}/other`;
                navigate(path);
              }}
              textColor="primary"
              indicatorColor="primary"
            >
              {menuList.map((item, index) => {
                const Icon = menuIcons[index];
                return (
                  <Tab
                    key={index}
                    label={isCompact ? undefined : item}
                    aria-label={item}
                    icon={<Icon size={18} />}
                    iconPosition={isCompact ? 'top' : 'start'}
                    wrapped={!isCompact}
                  />
                );
              })}
            </Tabs>
          </Box>

          {menu === 0 && <MainClassesMenu id={id!} setLoading={setLoading} />}
          {menu === 1 && <CoursePlanMenu id={id!} setLoading={setLoading} />}
          {menu === 2 && <ParticipantsMenu id={id!} setLoading={setLoading} />}
          {menu === 3 && <OthersMenu matricula={user?.matricula ? user.matricula : ""} id={id!} setLoading={setLoading} />}
        </main>
      </div>
    </Base>
  );
}

function MainClassesMenu({ id, setLoading }: { id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const { data: news = [], isFetching: isNewsFetching } = useQuery({
      queryKey: ["class", id, "news"],
      queryFn: () => fetchClassNews(id),
    });

    const { data: professors = [], isFetching: isProfessorsFetching } = useQuery({
      queryKey: ["class", id, "professors"],
      queryFn: () => fetchClassProfessors(id),
    });

    const { data: coursePlan } = useQuery<CoursePlanResponse>({
      queryKey: ["class", id, "course-plan"],
      queryFn: () => fetchClassCoursePlan(id),
    });

    const navigate = useNavigate();

    const parseApiDate = (value?: string | null): Date | null => {
      if (!value) return null;
      const raw = String(value).trim();
      if (!raw) return null;

      // Handles dd/mm/yyyy and dd/mm/yyyy hh:mm[:ss] consistently.
      const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (brMatch) {
        const day = Number(brMatch[1]);
        const month = Number(brMatch[2]) - 1;
        const year = Number(brMatch[3]);
        const hour = Number(brMatch[4] ?? 0);
        const minute = Number(brMatch[5] ?? 0);
        const second = Number(brMatch[6] ?? 0);
        const parsed = new Date(year, month, day, hour, minute, second);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      const parsed = new Date(raw);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const getTopicDateRaw = (topic: { dataInicio?: string | null; dataCadastro?: string | null }): string | null => {
      return topic.dataInicio ?? topic.dataCadastro ?? null;
    };

    const upcomingTopic = useMemo(() => {
      if (!coursePlan?.topicosDeAula) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const candidates = coursePlan.topicosDeAula
        .filter((t) => !t.cancelada)
        .map((t) => ({ topic: t, date: parseApiDate(getTopicDateRaw(t)) }))
        .filter((item) => item.date !== null && item.date >= today) as Array<{ topic: CoursePlanResponse["topicosDeAula"][number]; date: Date }>;

      if (candidates.length === 0) return null;

      candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

      return candidates[0]?.topic ?? null;
    }, [coursePlan]);

    const upcomingEvaluation = useMemo(() => {
      if (!coursePlan?.avaliacoes) return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sorted = coursePlan.avaliacoes
        .map((a) => ({ evaluation: a, date: parseApiDate(a.dataRealizacao) }))
        .filter((item) => item.evaluation.ativo && item.date !== null && item.date >= now)
        .sort((a, b) => a.date!.getTime() - b.date!.getTime());
      return sorted[0]?.evaluation ?? null;
    }, [coursePlan]);

    const fmtShortDate = (d?: string | null): string => {
      if (!d) return 'Sem data';
      const dt = parseApiDate(d);
      if (!dt || isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    const daysUntil = (d?: string | null): number | null => {
      if (!d) return null;
      const dt = parseApiDate(d);
      if (!dt || isNaN(dt.getTime())) return null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      dt.setHours(0, 0, 0, 0);
      return Math.round((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const toDataKey = (d?: string | null) => String(d ?? '').replace(/[^a-zA-Z0-9]/g, '-');

    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [menuEmail, setMenuEmail] = useState<string | null>(null);

    const handleMenuOpen = (e: any, email?: string) => {
      setMenuAnchorEl(e.currentTarget);
      setMenuEmail(email ?? null);
    };

    const handleMenuClose = () => {
      setMenuAnchorEl(null);
      setMenuEmail(null);
    };

    const handleSendEmail = () => {
      if (menuEmail) {
        window.location.href = `mailto:${menuEmail}`;
      }
      handleMenuClose();
    };

    useEffect(() => {
      setLoading(isNewsFetching || isProfessorsFetching);
    }, [isNewsFetching, isProfessorsFetching, setLoading]);

    return (
      <Grid container spacing={3}>
        {/* Sidebar – próximos eventos */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Próximos Eventos</Typography>

          {upcomingTopic && (() => {
            const topicDate = getTopicDateRaw(upcomingTopic);
            // const days = daysUntil(topicDate);
            // const label = days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : days !== null ? `Em ${days} dias` : '';
            // const chipColor = (days === 0 ? 'error' : days !== null && days <= 3 ? 'warning' : 'default') as any;
            return (
              <Card
                sx={{ mb: 2, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' } }}
                onClick={() => navigate(`/class/${id}/courseplan`, { state: { scrollTo: { kind: 'topico', topicoId: upcomingTopic.idTopicoAula } } })}
              >
                <CardHeader
                  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><BiCalendarEvent /></Avatar>}
                  title="Próximo Tópico"
                  subheader={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                      {/* {label && <Chip label={label} size="small" color={chipColor} />} */}
                      <Typography variant="caption" color="text.secondary">{fmtShortDate(topicDate)}</Typography>
                    </Box>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{upcomingTopic.descricao}</Typography>
                  {upcomingTopic.conteudo && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 }}>
                      {upcomingTopic.conteudo.replace(/<[^>]+>/g, '').trim()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {!upcomingTopic && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Próximo Tópico</Typography>
                <Typography color="text.secondary" variant="body2">Não há próximo tópico no plano.</Typography>
              </CardContent>
            </Card>
          )}

          {upcomingEvaluation && (() => {
            const days = daysUntil(upcomingEvaluation.dataRealizacao);
            const showLabel = days !== null && days <= 3;
            const label = days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : days !== null ? `Em ${days} dias` : '';
            const chipColor = (days === 0 ? 'error' : 'warning') as any;
            return (
              <Card
                variant="outlined"
                sx={{ mb: 2, cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' } }}
                onClick={() => navigate(`/class/${id}/courseplan`, { state: { scrollTo: { kind: 'avaliacao', dataKey: toDataKey(upcomingEvaluation.dataRealizacao) } } })}
              >
                <CardHeader
                  avatar={<Avatar sx={{ bgcolor: 'grey.200', color: 'text.primary' }}><BiAlarm /></Avatar>}
                  title="Próxima Avaliação"
                  subheader={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                      {showLabel && label && <Chip label={label} size="small" color={chipColor} variant="outlined" />}
                      <Typography variant="caption" color="text.secondary">{fmtShortDate(upcomingEvaluation.dataRealizacao)}</Typography>
                      {upcomingEvaluation.horario && <Typography variant="caption" color="text.secondary">{upcomingEvaluation.horario}</Typography>}
                    </Box>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{upcomingEvaluation.descricao}</Typography>
                  {upcomingEvaluation.observacoes && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{upcomingEvaluation.observacoes}</Typography>
                  )}
                </CardContent>
              </Card>
            );
          })()}

        </Grid>

        {/* Notícias da Turma */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Box sx={{ position: { md: 'sticky' }, top: 0, alignSelf: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" component="h2">Notícias da Turma</Typography>
            </Box>
            <Box sx={{ maxHeight: { md: 'calc(100vh - 220px)' }, overflowY: { md: 'auto' }, pr: { md: 1 } }}>
              <Grid container spacing={2} alignItems="stretch" justifyContent="flex-start">
            {news.map((n) => {
              let cleanHtml = DOMPurify.sanitize(n.htmlNoticia || '');
              // normalize BR tags coming from API to avoid forced line breaks
              cleanHtml = cleanHtml.replace(/<br\s*\/?>/gi, ' ');
              const prof = professors.find((p) => p.nome === n.nomePessoaCadastro && p.urlFoto);
              const fullTimestamp = n.data ?? '';
              const shortDate = fullTimestamp.split(' ')[0] ?? fullTimestamp;

              return (
                <Grid key={`${n.data ?? 'date'}-${n.descricaoNoticia ?? 'news'}`} size={{ xs: 12 }} sx={{ display: 'flex' }}>
                  <Card sx={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                    <CardHeader sx={{ pb: 0.5 }}
                      avatar={
                        prof && prof.urlFoto?
                        <Avatar alt={prof.nome} src={prof.urlFoto} /> :
                        <Avatar>{n.nomePessoaCadastro?.[0] ?? '?'}</Avatar>
                      }
                      title={prof?.nome ?? n.nomePessoaCadastro ?? 'Desconecido'}
                      subheader={<Tooltip title={fullTimestamp}><Typography variant="caption">{shortDate}</Typography></Tooltip>}
                      action={
                        <IconButton aria-label="settings" onClick={(e) => handleMenuOpen(e, (prof as any)?.email ?? ((n as any).email ?? ''))}>
                          <BiDotsVerticalRounded />
                        </IconButton>
                      }
                    />
                    <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 1 }}>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>{n.descricaoNoticia}</Typography>
                      <Box sx={{ color: 'text.secondary', overflowWrap: 'anywhere', wordBreak: 'break-word', '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
              </Grid>
            </Box>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleSendEmail} disabled={!menuEmail}>Enviar e-mail</MenuItem>
            </Menu>
          </Box>
        </Grid>
      </Grid>
    )
}

function CoursePlanMenu({ id, setLoading }: { id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const { data: coursePlan, isFetching } = useQuery<CoursePlanResponse>({
      queryKey: ["class", id, "course-plan"],
      queryFn: () => fetchClassCoursePlan(id),
    });

    const location = useLocation();
    const scrollTarget = (location.state as { scrollTo?: { kind: string; topicoId?: number; dataKey?: string } } | null)?.scrollTo ?? null;
    const scrollTargetKey: string | null = scrollTarget
      ? scrollTarget.kind === 'topico'
        ? `course-topico-${scrollTarget.topicoId}`
        : `course-avaliacao-${scrollTarget.dataKey ?? ''}`
      : null;

    const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showDisciplineInfo, setShowDisciplineInfo] = useState(false);

    const toggleItem = (key: string) => {
      setExpandedItems(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    };

    useEffect(() => {
      if (!scrollTargetKey || !coursePlan) return;
      setExpandedItems(prev => { const next = new Set(prev); next.add(scrollTargetKey); return next; });
      setHighlightedKey(scrollTargetKey);
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollTargetKey);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      const timer = setTimeout(() => setHighlightedKey(null), 3000);
      return () => clearTimeout(timer);
    }, [scrollTargetKey, coursePlan]);

    useEffect(() => {
      setLoading(isFetching);
    }, [isFetching, setLoading]);

    if (!coursePlan) {
      return (
        <div className="mb-4">
          <Typography variant="h6">Plano de Curso</Typography>
          <Typography variant="body2" color="text.secondary">Plano de curso não disponível.</Typography>
        </div>
      );
    }

    type Item = { kind: 'topico'|'avaliacao'; date?: string|null; title: string; payload: any };
    const items: Item[] = [];

    (coursePlan.topicosDeAula ?? []).forEach((t) => {
      items.push({ kind: 'topico', date: t.dataInicio ?? t.dataCadastro ?? null, title: t.descricao || 'Tópico', payload: t });
    });

    (coursePlan.avaliacoes ?? []).forEach((a) => {
      items.push({ kind: 'avaliacao', date: a.dataRealizacao ?? null, title: a.descricao || 'Avaliação', payload: a });
    });

    items.sort((a,b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date!).getTime() - new Date(b.date!).getTime();
    });

    const references = coursePlan.referencias ?? [];

    // Returns true when HTML/text is effectively empty (null, whitespace-only, or trivial punctuation like ".")
    const isHtmlEmpty = (html: string | null | undefined): boolean => {
      if (!html) return true;
      const stripped = html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
      return stripped === '' || /^[\s.\-—·]+$/.test(stripped);
    };

    const isTextEmpty = (val: string | number | null | undefined): boolean => {
      if (val === null || val === undefined) return true;
      const s = String(val).trim();
      return s === '' || /^[\s.\-—·]+$/.test(s);
    };

    const EmptyPlaceholder = () => (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>Não informado</Typography>
    );

    const fmtDate = (d?: string|null) => {
      if (!d) return 'Sem data';
      const str = String(d);
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) {
        const dateStr = dt.toLocaleDateString();
        const hasTime = dt.getHours() !== 0 || dt.getMinutes() !== 0 || dt.getSeconds() !== 0;
        if (hasTime) {
          const hh = String(dt.getHours()).padStart(2, '0');
          return `${dateStr} ${hh}h`;
        }
        return dateStr;
      }

      // fallback: try to extract date and time fragments
      const dateMatch = str.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      let out = '';
      if (dateMatch) out += dateMatch[0];
      if (timeMatch) out += (out ? ' ' : '') + `${timeMatch[1].padStart(2, '0')}h`;
      if (out) return out;
      return str;
    }

    return (
      <div>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="h5">Informações da Disciplina</Typography>
                <Typography variant="caption" color="text.secondary">
                  Objetivos, conteúdo e critérios gerais do plano
                </Typography>
              </Box>
              <Tooltip title={showDisciplineInfo ? 'Recolher informações' : 'Expandir informações'}>
                <IconButton
                  size="small"
                  aria-label={showDisciplineInfo ? 'Recolher informações da disciplina' : 'Expandir informações da disciplina'}
                  aria-expanded={showDisciplineInfo}
                  onClick={() => setShowDisciplineInfo((prev) => !prev)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <BiExpandVertical />
                </IconButton>
              </Tooltip>
            </Box>

            {!showDisciplineInfo && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Informações detalhadas recolhidas para focar em tópicos e avaliações. Use o ícone ao lado para abrir os detalhes.
              </Typography>
            )}

            <Collapse in={showDisciplineInfo} unmountOnExit>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2">Objetivos</Typography>
                  {isHtmlEmpty(coursePlan.objetivos)
                    ? <EmptyPlaceholder />
                    : <Box sx={{ color: 'text.secondary', mt: 0.5 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.objetivos) }} />}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2">Conteúdo</Typography>
                  {isHtmlEmpty(coursePlan.conteudo)
                    ? <EmptyPlaceholder />
                    : <Box sx={{ color: 'text.secondary', mt: 0.5, maxHeight: 140, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.conteudo) }} />}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2">Procedimento de Avaliação</Typography>
                  {isTextEmpty(coursePlan.procedimentoAvaliacaoAprendizagem)
                    ? <EmptyPlaceholder />
                    : <Typography variant="body2" color="text.secondary">{String(coursePlan.procedimentoAvaliacaoAprendizagem)}</Typography>}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2">Horário de Atendimento</Typography>
                  {isTextEmpty(coursePlan.horarioAtendimento)
                    ? <EmptyPlaceholder />
                    : <Typography variant="body2" color="text.secondary">{coursePlan.horarioAtendimento}</Typography>}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2">Competências / Habilidades</Typography>
                  {isHtmlEmpty(coursePlan.habilidadesCompetencias)
                    ? <EmptyPlaceholder />
                    : <Box sx={{ color: 'text.secondary', mt: 0.5 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.habilidadesCompetencias) }} />}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2">Exame Final / Reposição</Typography>
                  <Typography variant="body2" color="text.secondary">Exame: {isTextEmpty(coursePlan.exameFinal) ? <em>Não informado</em> : coursePlan.exameFinal}</Typography>
                  <Typography variant="body2" color="text.secondary">Hora exame: {isTextEmpty(coursePlan.horaExameFinal) ? <em>Não informado</em> : coursePlan.horaExameFinal}</Typography>
                  <Typography variant="body2" color="text.secondary">Reposição: {isTextEmpty(coursePlan.reposicao) ? <em>Não informado</em> : coursePlan.reposicao}</Typography>
                  <Typography variant="body2" color="text.secondary">Hora reposição: {isTextEmpty(coursePlan.horaReposicao) ? <em>Não informado</em> : coursePlan.horaReposicao}</Typography>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>Itens do Plano de Curso</Typography>

        <div>
          {items.length === 0 && <Typography color="text.secondary">Nenhum item no plano.</Typography>}
          {items.map((it, idx) => {
            const itemKey = it.kind === 'topico'
              ? `course-topico-${it.payload.idTopicoAula}`
              : `course-avaliacao-${String(it.payload.dataRealizacao ?? idx).replace(/[^a-zA-Z0-9]/g, '-')}`;
            const isHighlighted = highlightedKey === itemKey;
            const hasContent = (it.kind === 'topico' && ((it.payload.conteudo && it.payload.conteudo.trim()) || (it.payload.arquivos && it.payload.arquivos.length) || (it.payload.tarefas && it.payload.tarefas.length))) ||
              (it.kind === 'avaliacao' && ((it.payload.descricao && it.payload.descricao.trim()) || (it.payload.observacoes && it.payload.observacoes.trim())));

            if (!hasContent) {
              return (
                <Card key={idx} id={itemKey} sx={{ mb: 1, p: 0, ...(isHighlighted ? { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '2px' } : {}) }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                        {it.kind === 'topico' ? <BiBookBookmark /> : <BiDetail />}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">{it.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{it.kind.toUpperCase()}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right', flexShrink: 0 }}>{fmtDate(it.date)}</Typography>
                  </Box>
                </Card>
              );
            }

            return (
              <Accordion
                key={idx}
                id={itemKey}
                disableGutters
                expanded={expandedItems.has(itemKey)}
                onChange={() => toggleItem(itemKey)}
                sx={isHighlighted ? { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '2px' } : undefined}
              >
                <AccordionSummary expandIcon={<BiExpandVertical />} sx={{ px: 2, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                        {it.kind === 'topico' ? <BiBookBookmark /> : <BiDetail />}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">{it.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{it.kind.toUpperCase()}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right', flexShrink: 0 }}>{fmtDate(it.date)}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {it.kind === 'topico' && (
                    <Box>
                      {/* sanitize and render HTML content like news */}
                      {(() => {
                        const raw = it.payload.conteudo || '';
                        let clean = DOMPurify.sanitize(raw);
                        // normalize BRs to spaces to avoid forced narrow line breaks
                        clean = clean.replace(/<br\s*\/?>/gi, ' ');
                        return (
                          <Box sx={{ color: 'text.secondary', overflowWrap: 'anywhere', wordBreak: 'break-word', '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: clean }} />
                        );
                      })()}

                      {it.payload.arquivos && it.payload.arquivos.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">Arquivos:</Typography>
                          <List dense>
                            {it.payload.arquivos.map((f: Arquivo, i: number) => (
                              <ListItem key={i} secondaryAction={f.link ? <MuiLink href={f.link} target="_blank" rel="noreferrer">Abrir</MuiLink> : undefined}>
                                <ListItemText primary={f.nomeArquivo ?? f.descricao ?? `Arquivo ${i+1}`} secondary={f.tipoMaterial ?? ''} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  )}
                  {it.kind === 'avaliacao' && (
                    <Box>
                      {/* <Typography variant="body2">{it.payload.descricao}</Typography> */}
                      <Typography variant="caption" color="text.secondary">Horário: {it.payload.horario ?? '—'}</Typography>
                      {it.payload.observacoes && <Typography variant="body2" sx={{ mt: 1 }}>{it.payload.observacoes}</Typography>}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )
          })}

          {references.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Referências</Typography>
              <List>
                {references.map((r, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={r.titulo ?? r.descricao ?? `Referência ${i+1}`} secondary={r.autor ?? ''} />
                    {r.url && <MuiLink href={r.url} target="_blank" rel="noreferrer">Abrir</MuiLink>}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </div>
      </div>
    )
}

function ParticipantsMenu({ id, setLoading }: { id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const { data, isFetching } = useQuery<{ students: StudentResponse[]; professors: ProfessorResponse[] }>({
      queryKey: ["class", id, "participants"],
      queryFn: async () => {
        const [students, professors] = await Promise.all([
          fetchClassStudents(id),
          fetchClassProfessors(id),
        ]);
        return { students, professors };
      },
    });

    const students = data?.students;
    const professors = data?.professors ?? [];

    useEffect(() => {
      setLoading(isFetching);
    }, [isFetching, setLoading]);
    
    return (
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5">Professores</Typography>
          <Card sx={{ mt: 1 }}>
            <List>
              {professors.length === 0 && (
                <ListItem>
                  <ListItemText primary="Nenhum professor listado." />
                </ListItem>
              )}
              {professors.map((p, i) => {
                const email = (p as any).email;
                return (
                  <ListItem
                    key={p.nome || i}
                    secondaryAction={
                      email ? (
                        <IconButton component="a" href={`mailto:${email}`} edge="end" aria-label={`Enviar e-mail para ${p.nome}`} title={`Enviar e-mail para ${p.nome}`}>
                          <BiMailSend />
                        </IconButton>
                      ) : (
                        <IconButton edge="end" aria-label="email" disabled>
                          <BiMailSend />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={(p as any).urlFoto}>{p.nome ? p.nome[0] : '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={p.nome ?? 'Professor'} secondary={email ?? ''} />
                  </ListItem>
                );
              })}
            </List>
          </Card>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">Colegas de turma</Typography>
            <Typography variant="caption">{students ? `${students.length} estudantes` : ''}</Typography>
          </Box>

          <Card sx={{ mt: 1 }}>
            <List>
              {(!students || students.length === 0) && (
                <ListItem>
                  <ListItemText primary="Nenhum estudante listado." />
                </ListItem>
              )}

              {students && (() => {
                const sorted = [...students].sort((a,b) => {
                  const aTr = (a.situacaoMatricula || '').toUpperCase() === 'TRANCADO';
                  const bTr = (b.situacaoMatricula || '').toUpperCase() === 'TRANCADO';
                  if (aTr === bTr) return (a.nome || '').localeCompare(b.nome || '');
                  return aTr ? 1 : -1;
                });
                return sorted.map((s, i) => {
                  const email = (s as any).email;
                  const isTrancado = ((s.situacaoMatricula || '').toUpperCase() === 'TRANCADO');
                  return (
                    <ListItem key={s.matricula ?? s.nome ?? i} secondaryAction={
                      email ? (
                        <IconButton component="a" href={`mailto:${email}`} edge="end" aria-label="email" title={`Enviar e-mail para ${s.nome}`}>
                          <BiMailSend />
                        </IconButton>
                      ) : (
                        <IconButton edge="end" aria-label="email" disabled>
                          <BiMailSend />
                        </IconButton>
                      )
                    }>
                      <ListItemAvatar>
                        <Avatar src={(s as any).urlFoto} sx={{ filter: isTrancado ? 'grayscale(100%)' : 'none', opacity: isTrancado ? 0.6 : 1 }}>{s.nome ? s.nome[0] : '?'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{s.nome ?? 'Estudante'}</Typography>
                            {isTrancado && <Chip label="Trancado" size="small" variant="outlined" />}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {s.curso && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{s.curso}</Typography>}
                            {email && <Typography variant="caption" color="text.secondary">{email}</Typography>}
                          </Box>
                        }
                      />
                    </ListItem>
                  )
                })
              })()}
            </List>
          </Card>
        </Box>
      </Container>
    )
}


function OthersMenu({ matricula, id, setLoading }: { matricula: string, id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const { data: gradesAndMisses, isFetching } = useQuery<MissesAndGradesResponse>({
      queryKey: ["class", id, "grades-misses", matricula],
      enabled: Boolean(matricula),
      queryFn: () => {
        const result = fetchClassMissesAndGrades(matricula, id)
        console.log("Fetched grades and misses:", result);
        return result;
      }
    });

    const { data: frequencyData = [] } = useQuery<FrequencyResponse>({
      queryKey: ["class", id, "frequency", matricula],
      enabled: Boolean(matricula),
      queryFn: () => {
        const result = fetchClassFrequency(matricula, id)
        console.log("Fetched frequency:", result);
        return result;
      } 
    });

    useEffect(() => {
      setLoading(isFetching);
    }, [isFetching, setLoading]);

    if (gradesAndMisses === undefined) {
      return (
        <Container maxWidth="lg">
          <Typography variant="h5" sx={{ mb: 2 }}>Mapa de Frequências & Notas</Typography>
          <Typography variant="body2" color="text.secondary">Informações de notas e frequências não disponíveis.</Typography>
        </Container>
      );
    }

    // Render two tables: Grades (notasPorUnidade) and Misses/Attendance (if detailed data exists show rows, otherwise show summary)
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ mb: 2 }}>Mapa de Frequências & Notas</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Notas por Unidade</Typography>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Unidade</TableCell>
                    <TableCell>Nota</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(gradesAndMisses.notasPorUnidade).map(([unidade, nota]) => (
                    <TableRow key={unidade}>
                      <TableCell>{unidade}</TableCell>
                      <TableCell>{nota}</TableCell>
                    </TableRow>
                  ))}
                  {/* {(!gradesAndMisses || Object.values(gradesAndMisses.notasPorUnidade).filter((v): v is string => !!v).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>Nenhuma nota disponível.</TableCell>
                    </TableRow>
                  )} */}
                </TableBody>
              </Table>
            </TableContainer>
            <Card sx={{ mt: 2, p: 2 }}>
              <Typography variant="body2">Média final: <strong>{gradesAndMisses?.mediaFinal ?? '—'}</strong></Typography>
              <Typography variant="body2">Situação: <strong>{gradesAndMisses?.situacao ?? '—'}</strong></Typography>
              {gradesAndMisses?.recuperacao !== null && <Typography variant="body2">Recuperação: <strong>{gradesAndMisses?.recuperacao}</strong></Typography>}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6">Mapa de Frequências</Typography>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Faltas</TableCell>
                    <TableCell>Quantidade de Horas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {frequencyData.map((r: FrequencyResponseItem, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{r.data}</TableCell>
                      <TableCell>{r.qtdFaltas ?? ''}</TableCell>
                      <TableCell>{r.qtdHorarios ?? ''}</TableCell>
                    </TableRow>
                  ))}

                  {gradesAndMisses && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">Total de Faltas: <strong>{gradesAndMisses.numeroDeFaltas ?? '—'}</strong></Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>
    )
}