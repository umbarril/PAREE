import { useEffect, useState, type JSX } from "react";
import Base from "../components/Base";
import { useParams } from "react-router";
import { fetchClassCoursePlan, fetchClassMissesAndGrades, fetchClassNews, fetchClassProfessors, fetchClassStudents } from "../services/ClassesService";
import type { NewsPieceResponse } from "../types/NewsResponse";
import { useAuthStore } from "../store/AuthStore";
import DOMPurify from "dompurify";
import type { CoursePlanResponse } from "../types/CoursePlanResponse";
import type { ProfessorResponse } from "../types/DocenteResponse";
import type { MissesAndGradesResponse } from "../types/MissesAndGradesResponse";
import type { StudentResponse } from "../types/DiscenteResponse";
import { Box, Grid, Card, CardHeader, CardContent, Avatar, Tooltip, Typography, Container, Tabs, Tab, Stack } from "@mui/material";

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

            {menu === 0 && <MainClassesMenu id={id!} error={error} setLoading={setLoading} />}
            {menu === 1 && <CoursePlanMenu id={id!} error={error} setLoading={setLoading} />}
            {menu === 2 && <ParticipantsMenu id={id!} error={error} setLoading={setLoading} />}
            {menu === 3 && <OthersMenu matricula={user?.matricula ? user.matricula : ""} id={id!} error={error} setLoading={setLoading} />}
          </main>
        </div>
      )}{" "}
      ;
    </Base>
  );
}

function MainClassesMenu({ id, error, setLoading }: { id: string; error: string | null; setLoading: (loading: boolean) => void }): JSX.Element {
    const [news, setNews] = useState<NewsPieceResponse[]>([]);
    const [professors, setProfessors] = useState<ProfessorResponse[]>([]);

    useEffect(() => { // todo: melhorar isso, ta meio gambiarra, tem que mostrar loading enquanto carrega, e nao pode ficar setando loading true toda hora
        // sem falar que isso não cacheia
        setLoading(true)
        console.log("Fetching class news for class id:", id);
        async function run() {
            if (error) {
                setLoading(false);
                return;
            }
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
    }, [id, error]);
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

function CoursePlanMenu({ id, error, setLoading }: { id: string; error: string | null; setLoading: (loading: boolean) => void }): JSX.Element {
    const [coursePlan, setCoursePlan] = useState<CoursePlanResponse>();

    useEffect(() => { // todo: melhorar isso, ta meio gambiarra, tem que mostrar loading enquanto carrega, e nao pode ficar setando loading true toda hora
        // sem falar que isso não cacheia
        setLoading(true)
        console.log("Fetching class course plan for class id:", id);
        async function run() {
            if (error) {
                setLoading(false);
                return;
            }
            fetchClassCoursePlan(id!).then((details) => {
                console.log(details);
                setCoursePlan(details);
            });
            setLoading(false);
        }
        run();
    }, [id, error]);

    return (
        <div className="flex items-center justify-between mb-4">
            <div>
            <h2 className="m-0 text-xl font-semibold">
                Atividades
            </h2>
            </div>
        </div>
    )
}

function ParticipantsMenu({ id, error, setLoading }: { id: string; error: string | null; setLoading: (loading: boolean) => void }): JSX.Element {
    const [students, setStudents] = useState<StudentResponse[]>();
    const [professors, setProfessors] = useState<ProfessorResponse[]>([]);

    useEffect(() => { // todo: melhorar isso, ta meio gambiarra, tem que mostrar loading enquanto carrega, e nao pode ficar setando loading true toda hora
        // sem falar que isso não cacheia
        setLoading(true)
        console.log("Fetching class course plan for class id:", id);
        async function run() {
            if (error) {
                setLoading(false);
                return;
            }
            fetchClassStudents(id!).then((details) => {
                console.log(details);
                setStudents(details);
            });
            fetchClassProfessors(id!).then((details) => {
                console.log(details);
                setProfessors(details);
            });
            setLoading(false);
        }
        run();
    }, [id, error]);
    
    return (
        <div className="flex items-center justify-between mb-4">
            <div>
            <h2 className="m-0 text-xl font-semibold">
                Participantes
            </h2>
            </div>
        </div>
    )
}


function OthersMenu({ matricula, id, error, setLoading }: { matricula: string, id: string; error: string | null; setLoading: (loading: boolean) => void }): JSX.Element {
    const [gradesAndMisses, setGradesAndMisses] = useState<MissesAndGradesResponse>();

    useEffect(() => { // todo: melhorar isso, ta meio gambiarra, tem que mostrar loading enquanto carrega, e nao pode ficar setando loading true toda hora
        // sem falar que isso não cacheia
        setLoading(true)
        console.log("Fetching class course plan for class id:", id);
        async function run() {
            if (error) {
                setLoading(false);
                return;
            }
            fetchClassMissesAndGrades(matricula, id!).then((details) => {
                console.log(details);
                setGradesAndMisses(details);
            });
            setLoading(false);
        }
        run();
    }, [id, error]);

    return (
        <div className="flex items-center justify-between mb-4">
            <div>
            <h2 className="m-0 text-xl font-semibold">
                Outros
            </h2>
            </div>
        </div>
    )
}