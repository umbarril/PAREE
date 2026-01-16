import type { JSX } from "react";
import { BiCalendar, BiCog, BiHome, BiLibrary } from "react-icons/bi";
import { NavLink } from "react-router";

const navItemBase = "flex items-center gap-3 text-sm px-3 py-2 rounded-lg";
const navItemActive = "bg-indigo-50 text-indigo-700 font-semibold";
const navItemInactive = "text-slate-900 hover:bg-slate-50";

export default function Sidebar(props: { sidebarOpen: boolean }): JSX.Element {
  const { sidebarOpen } = props;

  return (
    <aside
      id="sidebar"
      aria-hidden={!sidebarOpen}
      className={`${
        sidebarOpen ? "w-56 border-r border-slate-200 p-5" : "w-0 p-0 border-0"
      } bg-white rounded-xl shadow-sm flex flex-col transition-all duration-200 ease-in-out overflow-hidden`}
    >
      <nav
        className={`flex flex-col gap-2 flex-1 transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Navegação principal"
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
          to="/settings"
          className={({ isActive }) =>
            `mt-auto ${navItemBase} ${
              isActive ? navItemActive : navItemInactive
            }`
          }
        >
          <span>
            <BiCog />
          </span>
          Configurações
        </NavLink>
      </nav>
    </aside>
  );
}
