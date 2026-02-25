import type { AxiosResponse } from "axios";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import api from "./Axios";


export async function fetchClasses(matricula: string): Promise<AxiosResponse<TurmaResponse[]>> {
    return api.get(`/sigaa/mobile/discente/${matricula}/turmas`);
}

export async function fetchClassDetails(matricula: string, idTurma: string): Promise<AxiosResponse<string>> {
    return api.get(`/sigaa/mobile/discente/${matricula}/turma/${idTurma}`);
}
