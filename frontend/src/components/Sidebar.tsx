import Button from "@mui/material/Button";
import type { JSX, ReactNode } from "react";
import { useMemo, useState } from "react";
import { BiBookBookmark, BiCalendar, BiChevronDown, BiChevronUp, BiClipboard, BiHome, BiLogOut, BiX } from "react-icons/bi";
import { NavLink } from "react-router";
import { generateVibrantColor } from "../ThemeHelper";
import { useStudentClasses } from "../hooks/useStudentClasses";
import type { TurmaResponse } from "../types/StudentClassesResponse";

const navButtonSx = {
  justifyContent: "flex-start",
  gap: 1.5,
  fontSize: "0.875rem",
  px: 1.5,
  py: 1,
  borderRadius: 2,
  textTransform: "none",
  width: "100%",
};

const navButtonActiveSx = {
  ...navButtonSx,
  bgcolor: "#eef2ff",
  color: "#4338ca",
  fontWeight: 600,
  "&:hover": { bgcolor: "#e0e7ff" },
};

const navButtonInactiveSx = {
  ...navButtonSx,
  color: "#0f172a",
  "&:hover": { bgcolor: "#f8fafc" },
};

function NavButton({ to, children, end, className, onNavigate }: { to: string; children: ReactNode; end?: boolean; className?: string; onNavigate?: () => void }) {
  return (
    <NavLink to={to} end={end} className={className} style={{ textDecoration: "none", display: "block" }} onClick={onNavigate}>
      {({ isActive }) => (
        <Button
          variant="text"
          sx={isActive ? navButtonActiveSx : navButtonInactiveSx}
          disableRipple={false}
        >
          {children}
        </Button>
      )}
    </NavLink>
  );
}

function getClassInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function getClassMeta(turma: TurmaResponse): string {
  const periodLabel = turma.ano && turma.periodo ? `${turma.ano}.${turma.periodo}` : "";
  return periodLabel || turma.codigoTurma || turma.local || "Disciplina";
}

function ClassNavItem({ turma, onNavigate }: { turma: TurmaResponse; onNavigate?: () => void }) {
  return (
    <NavLink
      to={`/class/${turma.idTurma}`}
      onClick={onNavigate}
      style={{ textDecoration: "none", display: "block" }}
    >
      {({ isActive }) => (
        <div
          className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
            isActive ? "bg-white shadow-sm ring-1 ring-indigo-100" : "hover:bg-white/80"
          }`}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${generateVibrantColor(turma.nome)}22`,
              color: generateVibrantColor(turma.nome),
            }}
          >
            {getClassInitial(turma.nome)}
          </div>

          <div className="min-w-0 flex-1">
            <div className={`truncate text-sm ${isActive ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`} title={turma.nome}>
              {turma.nome}
            </div>
            <div className="truncate text-xs text-slate-500">{getClassMeta(turma)}</div>
          </div>
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar(props: { sidebarOpen: boolean; setSidebarOpen?: (open: boolean) => void }): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = props;
  const [classesOpen, setClassesOpen] = useState(true);
  const { data: classes = [], isLoading: isLoadingClasses } = useStudentClasses();

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((left, right) => {
        if (left.ano !== right.ano) return right.ano - left.ano;
        if (left.periodo !== right.periodo) return right.periodo - left.periodo;
        return left.nome.localeCompare(right.nome, "pt-BR");
      }),
    [classes],
  );

  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setSidebarOpen?.(false);
    }
  };

  const nav = (
    <nav
      className={`flex flex-col gap-1 flex-1 transition-opacity duration-200 ${
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Navegação principal"
      style={{ overflowY: 'auto' }}
    >
      <NavButton to="/" end>
        <BiHome />
        Início
      </NavButton>

      {/* <NavButton to="/library">
        <BiLibrary />
        Biblioteca
      </NavButton> */}

      <NavButton to="/calendar">
        <BiCalendar />
        Calendário
      </NavButton>

      <NavButton to="/documents">
        <BiClipboard />
        Documentos
      </NavButton>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
        <button
          type="button"
          onClick={() => setClassesOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-white/80"
          aria-expanded={classesOpen}
          aria-controls="sidebar-classes-list"
        >
          <span className="flex items-center gap-2">
            <BiBookBookmark />
            Minhas disciplinas
          </span>
          {classesOpen ? <BiChevronUp /> : <BiChevronDown />}
        </button>

        {classesOpen && (
          <div id="sidebar-classes-list" className="mt-1 space-y-1 overflow-auto pr-1 max-h-80">
            {isLoadingClasses && <div className="px-3 py-2 text-xs text-slate-500">Carregando disciplinas...</div>}

            {!isLoadingClasses && sortedClasses.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-500">Nenhuma disciplina encontrada.</div>
            )}

            {sortedClasses.map((turma) => (
              <ClassNavItem key={turma.idTurma} turma={turma} onNavigate={handleNavigate} />
            ))}
          </div>
        )}
      </section>

      <NavButton to="/logout" className="mt-auto" onNavigate={handleNavigate}>
          <BiLogOut />
          Sair
        </NavButton>
    </nav>
  );

  return (
    <>
      <aside
        id="sidebar-desktop"
        aria-hidden={!sidebarOpen}
        className={`${
          sidebarOpen ? "w-56 border-r border-slate-200 p-5" : "w-0 p-0 border-0"
        } hidden sm:flex bg-white shadow-sm flex-col transition-all duration-200 ease-in-out h-full`}
      >
        {nav}
      </aside>

      {sidebarOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen?.(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white p-5 shadow-lg overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold">Portal PAREE</div>
              <button aria-label="Fechar" onClick={() => setSidebarOpen?.(false)} className="p-1 rounded-md">
                <BiX />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
