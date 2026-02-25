import type { JSX } from "react";
import { BiCalendar, BiClipboard, BiCog, BiDetail, BiHome, BiLibrary, BiLogOut, BiX } from "react-icons/bi";
import { NavLink } from "react-router";

const navItemBase = "flex items-center gap-3 text-sm px-3 py-2 rounded-lg";
const navItemActive = "bg-indigo-50 text-indigo-700 font-semibold";
const navItemInactive = "text-slate-900 hover:bg-slate-50";

export default function Sidebar(props: { sidebarOpen: boolean; setSidebarOpen?: (open: boolean) => void }): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = props;

  const nav = (
    <nav
      className={`flex flex-col gap-2 transition-opacity duration-200 ${
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Navegação principal"
      style={{ overflowY: 'auto' }}
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
        }
      >
        <span>
          <BiHome />
        </span>
        Início
      </NavLink>

      <NavLink
        to="/library"
        className={({ isActive }) =>
          `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
        }
      >
        <span>
          <BiLibrary />
        </span>
        Biblioteca
      </NavLink>

      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
        }
      >
        <span>
          <BiCalendar />
        </span>
        Calendário
      </NavLink>

      <NavLink
        to="/documents"
        className={({ isActive }) =>
          `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
        }
      >
        <span>
          <BiClipboard />
        </span>
        Documentos
      </NavLink>

      <div className="mt-auto">
        {/* <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${navItemBase} ${
              isActive ? navItemActive : navItemInactive
            }`
          }
        >
          <span>
            <BiCog />
          </span>
          Configurações
        </NavLink> */}

        <NavLink
          to="/logout"
          className={({ isActive }) =>
            `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
          }
        >
          <span>
            <BiLogOut />
          </span>
          Sair
        </NavLink>
      </div>
    </nav>
  );

  return (
    <>
      <aside
        id="sidebar-desktop"
        aria-hidden={!sidebarOpen}
        className={`${
          sidebarOpen ? "w-56 border-r border-slate-200 p-5" : "w-0 p-0 border-0"
        } hidden sm:flex bg-white rounded-xl shadow-sm flex-col transition-all duration-200 ease-in-out h-full`}
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
