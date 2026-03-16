import type { AxiosResponse } from "axios";
import type { TurmaResponse } from "../types/StudentClassesResponse";
import api from "./Axios";
import type { StudentResponse } from "../types/DiscenteResponse";
import type { ProfessorResponse } from "../types/DocenteResponse";
import type { MissesAndGradesResponse } from "../types/MissesAndGradesResponse";
import type { CoursePlanResponse } from "../types/CoursePlanResponse";
import type { NewsPieceResponse } from "../types/NewsResponse";
import type { FrequencyResponse } from "../types/FrequencyResponse";

export async function fetchClasses(matricula: string): Promise<AxiosResponse<TurmaResponse[]>> {
    return api.get(`/sigaa/mobile/discente/${matricula}/turmas`);
}

export async function fetchClassNews(idTurma: string): Promise<NewsPieceResponse[]> {
    const response = await api.get(`/sigaa/mobile/turma/${idTurma}/noticias`);
    return response.data;
}

export async function fetchClassCoursePlan(idTurma: string): Promise<CoursePlanResponse> {
    const response = await api.get(`/sigaa/mobile/turma/${idTurma}/plano-de-curso`);
    return response.data;
}

export async function fetchClassMissesAndGrades(matricula: string, idTurma: string): Promise<MissesAndGradesResponse> {
    const response = await api.get(`/sigaa/mobile/discente/${matricula}/${idTurma}/faltas-notas`);
    return response.data;
}

export async function fetchClassFrequency(matricula: string, idTurma: string): Promise<FrequencyResponse> {
    const response = await api.get(`/sigaa/mobile/discente/${matricula}/${idTurma}/frequencia`);
    return response.data;
}

export async function fetchClassStudents(idTurma: string): Promise<StudentResponse[]> {
    const response = await api.get(`/sigaa/mobile/turma/${idTurma}/discentes`);
    return response.data;
}

export async function fetchClassProfessors(idTurma: string): Promise<ProfessorResponse[]> {
    const response = await api.get(`/sigaa/mobile/turma/${idTurma}/docentes`);
    return response.data;
}
