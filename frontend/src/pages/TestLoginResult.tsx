import Base from "../components/Base";
import { useAuthStore } from "../store/AuthStore";

export default function TestLoginResult() {
    const { user } = useAuthStore();
    return (
        <Base>
            <div>
                <h2>Bem-vindo, {user?.nome}</h2>
                <img src={user?.foto} alt="Profile" className="w-24 h-24 rounded-full" />
                
                <h3>Cursos:</h3>
                {user?.nomeCurso} - Matrícula: {user?.matricula}
            </div>
        </Base>
  );
}