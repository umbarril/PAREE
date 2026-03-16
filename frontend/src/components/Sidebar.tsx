import Button from "@mui/material/Button";
import type { JSX } from "react";
import { BiCalendar, BiClipboard, BiHome, BiLogOut, BiX } from "react-icons/bi";
import { NavLink } from "react-router";

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

function NavButton({ to, children, end, className }: { to: string; children: React.ReactNode; end?: boolean; className?: string }) {
  return (
    <NavLink to={to} end={end} className={className} style={{ textDecoration: "none", display: "block" }}>
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

export default function Sidebar(props: { sidebarOpen: boolean; setSidebarOpen?: (open: boolean) => void }): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = props;

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

      <NavButton to="/logout" className="mt-auto">
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
