import { BiMenu } from "react-icons/bi";
import { Link } from "react-router";
import type { JSX } from "react/jsx-dev-runtime";
import { useAuthStore } from "../store/AuthStore";

type TopbarProps = {
    sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void
}

export default function Topbar(props: TopbarProps): JSX.Element {
    const { user } = useAuthStore();
    const userName = user ? user.nome : "Usuário";
    const avatarUrl = user ? user.foto : "";

    const { sidebarOpen, setSidebarOpen } = props;
    return(
        <header className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-controls="sidebar"
                    aria-expanded={sidebarOpen}
                    className="p-2 rounded-md"
                >
                    <BiMenu />
                </button>

                <Link to="/" className="flex items-center gap-2 font-bold text-sm">
                    <img src="/logo.png" alt="PAREE logo" className="w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10 object-contain" loading="lazy" />
                    <span>Portal PAREE</span>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <div aria-hidden className="text-slate-500 text-sm">
                    Bem-vindo, {userName.split(" ")[0]}
                </div>

                {/* TODO trocar para /profile depois */}
                <Link to="/testauth" title={`Ir para o perfil de ${userName}`} className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent flex items-center justify-center cursor-pointer">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={`${userName} avatar`} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-900 font-bold text-sm">
                            {userName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                        </div>
                    )}
                </Link>
            </div>
        </header>
    ); 
}
