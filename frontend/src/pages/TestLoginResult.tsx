import Base from "../components/Base";
import { useAuth } from "../utils/Auth";

export default function TestLoginResult() {
    const { authData } = useAuth();
    return (
        <Base>
            <div>
                <h2>Bem-vindo, {authData?.nome}</h2>
                <img src={authData?.foto} alt="Profile" className="w-24 h-24 rounded-full" />
                
                <h3>Cursos:</h3>
                <ul>
                    {authData?.DISCENTE.map((d) => (
                    <li key={d.matricula}>
                        {d.nome} - Matrícula: {d.matricula}
                    </li>
                    ))}
                </ul>

                <p>Token expira em: {authData?.expires_in} segundos</p>
            </div>
        </Base>
  );
}