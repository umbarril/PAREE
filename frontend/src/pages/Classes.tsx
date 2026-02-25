import { useEffect, useState, type JSX } from "react";
import Base from "../components/Base";
import { useParams } from "react-router";
import { fetchClassCoursePlan, fetchClassMissesAndGrades, fetchClassNews, fetchClassProfessors, fetchClassStudents } from "../services/ClassesService";
import type { NewsPieceResponse } from "../types/NewsResponse";
import { useAuthStore } from "../store/AuthStore";
import DOMPurify from "dompurify";
import type { Arquivo, CoursePlanResponse, LessonTopic } from "../types/CoursePlanResponse";
import type { ProfessorResponse } from "../types/DocenteResponse";
import type { MissesAndGradesResponse } from "../types/MissesAndGradesResponse";
import type { StudentResponse } from "../types/DiscenteResponse";
import { Box, Grid, Card, CardHeader, CardContent, Avatar, Tooltip, Typography, Container, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemAvatar, IconButton, Link as MuiLink, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from "@mui/material";
import { BiBookBookmark, BiBookmark, BiDetail, BiExpandVertical, BiMailSend } from "react-icons/bi";

export default function Classes(): JSX.Element {
  const { id } = useParams();

  const user = useAuthStore((store) => store.user);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<number>(0);

  const menuList = ["Principal", "Plano de Curso", "Participantes", "Outros"];

  if (user === null) {
    console.error("User is null");
    setError("User is null");
  }
  if (user?.matricula === null) {
    console.error("Matricula is undefined");
    setError("Matricula is undefined");
  }
  if (id === undefined) {
    console.error("Class id is undefined");
    setError("Class id is undefined");
  }

  return (
    <Base>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <div className="flex-1 flex flex-col">
          <main className="p-6 overflow-auto">
            <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={menu} onChange={(_, v) => setMenu(v as number)} textColor="primary" indicatorColor="primary">
                {menuList.map((item, index) => (
                  <Tab label={item} key={index} />
                ))}
              </Tabs>
            </Box>

            {menu === 0 && <MainClassesMenu id={id!} setLoading={setLoading} />}
            {menu === 1 && <CoursePlanMenu id={id!} setLoading={setLoading} />}
            {menu === 2 && <ParticipantsMenu id={id!} setLoading={setLoading} />}
            {menu === 3 && <OthersMenu matricula={user?.matricula ? user.matricula : ""} id={id!} setLoading={setLoading} />}
          </main>
        </div>
      )}{" "}
      ;
    </Base>
  );
}

function MainClassesMenu({ id, setLoading }: { id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const [news, setNews] = useState<NewsPieceResponse[]>([]);
    const [professors, setProfessors] = useState<ProfessorResponse[]>([]);

    useEffect(() => { 
        setLoading(true)
        console.log("Fetching class news for class id:", id);
        async function run() {
            fetchClassNews(id!).then((details) => {
                console.log(details);
                setNews(details);
            });
            fetchClassProfessors(id!).then((details) => {
                console.log(details);
                setProfessors(details);
            });
            setLoading(false);
        }
        run();
    }, [id]);

    return (
        <>
        <Box sx={{ display: 'flex', itemsAlign: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">Notícias da Turma</Typography>
        </Box>

        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="stretch" justifyContent="center">
            {news.map((n) => {
              let cleanHtml = DOMPurify.sanitize(n.htmlNoticia || '');
              // normalize BR tags coming from API to avoid forced line breaks
              cleanHtml = cleanHtml.replace(/<br\s*\/?>/gi, ' ');
              const prof = professors.find((p) => p.nome === n.nomePessoaCadastro && p.urlFoto);
              const fullTimestamp = n.data ?? '';
              const shortDate = fullTimestamp.split(' ')[0] ?? fullTimestamp;

              return (
                <Grid key={n.idTurma} sx={{ display: 'flex', justifyContent: 'center', width: 'auto' }}>
                  <Card sx={{ width: { xs: '100%', sm: 520, md: 640 }, display: 'flex', flexDirection: 'column', flex: '0 0 auto', minHeight: 240 }}>
                    <CardHeader
                      avatar={
                        prof && prof.urlFoto? 
                        <Avatar alt={prof.nome} src={prof.urlFoto} /> : 
                        <Avatar>{n.nomePessoaCadastro?.[0] ?? '?'}</Avatar>
                    }
                      title={n.descricaoNoticia}
                      subheader={<Tooltip title={fullTimestamp}><Typography variant="caption">{shortDate}</Typography></Tooltip>}
                    />
                    <CardContent sx={{ flex: 1, overflow: 'hidden' }}>
                      <Box sx={{ color: 'text.secondary', overflowWrap: 'anywhere', wordBreak: 'break-word', '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
        </>
    )
}

function CoursePlanMenu({ id, setLoading }: { id: string; setLoading: (loading: boolean) => void }): JSX.Element {
    const [coursePlan, setCoursePlan] = useState<CoursePlanResponse>();

    useEffect(() => {
        // setLoading(true);
        async function run() {
            // try {
                const details = await fetchClassCoursePlan(id!);
                setCoursePlan(details);
            // } finally { setLoading(false); }
        }
        run();
    }, [id]);

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
                <Typography variant="caption" color="text.secondary">Resumo do plano e informações importantes</Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Objetivos</Typography>
                <Box sx={{ color: 'text.secondary', mt: 0.5 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.objetivos || '') }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Conteúdo</Typography>
                <Box sx={{ color: 'text.secondary', mt: 0.5, maxHeight: 140, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.conteudo || '') }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Procedimento de Avaliação</Typography>
                <Typography variant="body2" color="text.secondary">{String(coursePlan.procedimentoAvaliacaoAprendizagem ?? '—')}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Horário de Atendimento</Typography>
                <Typography variant="body2" color="text.secondary">{coursePlan.horarioAtendimento ?? '—'}</Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Competências / Habilidades</Typography>
                <Box sx={{ color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(coursePlan.habilidadesCompetencias || '') }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Exame Final / Reposição</Typography>
                <Typography variant="body2" color="text.secondary">Exame: {coursePlan.exameFinal ?? '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Hora exame: {coursePlan.horaExameFinal ?? '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Reposição: {coursePlan.reposicao ?? '—'}</Typography>
                <Typography variant="body2" color="text.secondary">Hora reposição: {coursePlan.horaReposicao ?? '—'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>Itens do Plano de Curso</Typography>

        <div>
          {items.length === 0 && <Typography color="text.secondary">Nenhum item no plano.</Typography>}
          {items.map((it, idx) => {
            const hasContent = (it.kind === 'topico' && ((it.payload.conteudo && it.payload.conteudo.trim()) || (it.payload.arquivos && it.payload.arquivos.length) || (it.payload.tarefas && it.payload.tarefas.length))) ||
              (it.kind === 'avaliacao' && ((it.payload.descricao && it.payload.descricao.trim()) || (it.payload.observacoes && it.payload.observacoes.trim())));

            if (!hasContent) {
              return (
                <Card key={idx} sx={{ mb: 1, p: 0 }}>
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
              <Accordion key={idx} disableGutters>
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
    const [students, setStudents] = useState<StudentResponse[]>();
    const [professors, setProfessors] = useState<ProfessorResponse[]>([]);

    useEffect(() => {
        // setLoading(true)
        console.log("Fetching class course plan for class id:", id);
        async function run() {
            fetchClassStudents(id!).then((details) => {
                console.log(details);
                setStudents(details);
            });
            fetchClassProfessors(id!).then((details) => {
                console.log(details);
                setProfessors(details);
            });
            // setLoading(false);
        }
        run();
    }, [id]);
    
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
              {professors.map((p, i) => (
                <ListItem key={p.nome || i} secondaryAction={
                  <IconButton edge="end" aria-label="email">
                    <BiMailSend />
                  </IconButton>
                }>
                  <ListItemAvatar>
                    <Avatar src={(p as any).urlFoto}>{p.nome ? p.nome[0] : '?'}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={p.nome ?? 'Professor'} secondary={(p as any).email ?? ''} />
                </ListItem>
              ))}
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
    const [gradesAndMisses, setGradesAndMisses] = useState<MissesAndGradesResponse>();

    useEffect(() => {
        // setLoading(true)
        console.log("Fetching class course plan for class id:", id);
        async function run() {
            fetchClassMissesAndGrades(matricula, id!).then((details) => {
                console.log(details);
                setGradesAndMisses(details);
            });
            // setLoading(false);
        }
        run();
    }, [id]);

    // Render two tables: Grades (notasPorUnidade) and Misses/Attendance (if detailed data exists show rows, otherwise show summary)
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ mb: 2 }}>Mapa de Frequências & Notas</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
                  {(gradesAndMisses?.notasPorUnidade ?? []).map((n, i) => (
                    <TableRow key={i}>
                      <TableCell>{n.unidade}</TableCell>
                      <TableCell>{n.nota}</TableCell>
                    </TableRow>
                  ))}
                  {(!gradesAndMisses || (gradesAndMisses.notasPorUnidade ?? []).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>Nenhuma nota disponível.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Card sx={{ mt: 2, p: 2 }}>
              <Typography variant="body2">Média final: <strong>{gradesAndMisses?.mediaFinal ?? '—'}</strong></Typography>
              <Typography variant="body2">Situação: <strong>{gradesAndMisses?.situacao ?? '—'}</strong></Typography>
              {gradesAndMisses?.recuperacao !== null && <Typography variant="body2">Recuperação: <strong>{gradesAndMisses?.recuperacao}</strong></Typography>}
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6">Mapa de Frequências</Typography>
            {/* If detailed attendance rows are present render them; otherwise show summary */}
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Situação</TableCell>
                    <TableCell>Falta justificada?</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Some backends may provide a detailed list under gradesAndMisses.faltasDetalhadas or similar. Try to render if present. */}
                  {((gradesAndMisses as any)?.faltasDetalhadas ?? []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{r.data ?? r.dataFalta ?? ''}</TableCell>
                      <TableCell>{r.situacao ?? ''}</TableCell>
                      <TableCell>{r.justificada ? 'Sim' : (r.justificada === false ? 'Não' : '')}</TableCell>
                    </TableRow>
                  ))}

                  {/* If no detailed rows, show a placeholder row with totals if available */}
                  {(!((gradesAndMisses as any)?.faltasDetalhadas) || ((gradesAndMisses as any)?.faltasDetalhadas.length === 0)) && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">Total de Faltas: <strong>{gradesAndMisses?.numeroDeFaltas ?? '—'}</strong></Typography>
                          <Typography variant="body2">Total de Faltas Justificadas: <strong>{(gradesAndMisses as any)?.numeroDeFaltasJustificadas ?? '—'}</strong></Typography>
                          <Typography variant="body2">Máximo de Faltas Permitido: <strong>{(gradesAndMisses as any)?.maximoFaltasPermitido ?? '—'}</strong></Typography>
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