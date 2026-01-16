import { BiMenu } from "react-icons/bi";
import { Link } from "react-router";
import type { JSX } from "react/jsx-dev-runtime";
import { useAuth } from "../utils/Auth";

type TopbarProps = {
    sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void
}

export default function Topbar(props: TopbarProps): JSX.Element {
    const auth = useAuth();
    const user = {
        name: auth?.authData ? auth.authData.nome : "Usuário",
        avatarUrl: auth?.authData?.foto ? auth.authData.foto : "",
    }

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
                    
                    {/* <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect width="24" height="24" rx="6" fill="#03DAC6" />
                        <path d="M7 12h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg> */}
                    <span>Portal PAREE</span>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <div aria-hidden className="text-slate-500 text-sm">
                    Bem-vindo, {user.name.split(" ")[0]}
                </div>

                {/* TODO trocar para /profile depois */}
                <Link to="/testauth" title={`Ir para o perfil de ${user.name}`} className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent flex items-center justify-center cursor-pointer">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={`${user.name} avatar`} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-900 font-bold text-sm">
                            {user.name
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
