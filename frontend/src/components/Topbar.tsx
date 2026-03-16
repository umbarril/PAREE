import IconButton from "@mui/material/IconButton";
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
        <header className="h-16 min-h-[64px] flex items-center justify-between px-5 py-2 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <IconButton
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-controls="sidebar"
                    aria-expanded={sidebarOpen}
                    size="small"
                >
                    <BiMenu />
                </IconButton>

                <Link to="/" className="flex items-center gap-2 font-bold text-sm">
                    <img src="/logo.png" alt="PAREE logo" className="w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10 object-contain" loading="lazy" />
                    <span>Portal PAREE</span>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <div aria-hidden className="text-slate-500 text-sm hidden sm:block">
                    Bem-vindo, {userName.split(" ")[0]}
                </div>

                {/* TODO trocar para /profile depois */}
                <IconButton
                    component={Link}
                    to="/profile"
                    title={`Ir para o perfil de ${userName}`}
                    sx={{ p: 0, width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "2px solid transparent" }}
                >
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
                </IconButton>
            </div>
        </header>
    ); 
}
