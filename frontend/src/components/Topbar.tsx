import IconButton from "@mui/material/IconButton";
import { BiMenu } from "react-icons/bi";
import { useAuthStore } from "../store/AuthStore";
import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { useMemo, type JSX } from "react";
import { BiChevronRight } from "react-icons/bi";
import { Link, useLocation, useParams } from "react-router";
import { useStudentClasses } from "../hooks/useStudentClasses";

type TopbarProps = {
    sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void
}

type BreadcrumbItem = {
    label: string;
    to?: string;
};

function AppBreadcrumbs(): JSX.Element | null {
    const location = useLocation();
    const { id } = useParams();
    const { data: classes = [] } = useStudentClasses();

    const items = useMemo(() => {
        if (location.pathname === "/") return [];

        const currentClass = classes.find((turma) => String(turma.idTurma) === id);
        const path = location.pathname;
        const breadcrumbs: BreadcrumbItem[] = [];

        if (path.startsWith("/class/") && currentClass) {
            // breadcrumbs.push({ label: "Início", to: "/" });
            breadcrumbs.push({ label: currentClass.nome, to: `/class/${currentClass.idTurma}` });

            if (path.endsWith("/courseplan")) {
                breadcrumbs.push({ label: "Plano de curso" });
            } else if (path.endsWith("/people")) {
                breadcrumbs.push({ label: "Participantes" });
            } else if (path.endsWith("/other")) {
                breadcrumbs.push({ label: "Outros" });
            }

            return breadcrumbs;
        }

        const staticRoutes: Record<string, string> = {
            "/calendar": "Calendário",
            "/documents": "Documentos",
            "/profile": "Perfil",
            "/settings": "Configurações",
            "/library": "Biblioteca",
            "/logout": "Sair",
        };

        const label = staticRoutes[path];
        if (!label) return [];

        breadcrumbs.push({ label });
        return breadcrumbs;
    }, [classes, id, location.pathname]);

    if (items.length === 0) return null;

    return (
        <div className="border-slate-200 bg-white/90 px-6 backdrop-blur-sm">
            <Breadcrumbs separator={<BiChevronRight className="text-slate-400" size={16} />} aria-label="breadcrumb">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    if (!isLast && item.to) {
                        return (
                            <MuiLink
                                key={`${item.label}-${index}`}
                                component={Link}
                                to={item.to}
                                underline="hover"
                                color="inherit"
                                sx={{ fontSize: "0.875rem", color: "#475569" }}
                            >
                                {item.label}
                            </MuiLink>
                        );
                    }

                    return (
                        <Typography key={`${item.label}-${index}`} sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                            {item.label}
                        </Typography>
                    );
                })}
            </Breadcrumbs>
        </div>
    );
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

                <AppBreadcrumbs />
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
