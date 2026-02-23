import axios from "axios";
import type { TurmaResponse } from "../types/StudentClassesResponse";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

export async function fetchClasses(matricula: string, access_token: string): Promise<TurmaResponse[]> {
    const body = {
        headers: { 
            Authorization: `Bearer ${access_token}` 
        }
    }

    const response = await axios.get(`${API_URL}/sigaa/mobile/discente/${matricula}/turmas`, body);
    return response.data;
}

export async function fetchClassDetails(matricula: string, idTurma: string, access_token: string): Promise<string> {
    const body = {
        headers: { 
            Authorization: `Bearer ${access_token}` 
        }
    }

    const response = await axios.get(`${API_URL}/sigaa/mobile/discente/${matricula}/turma/${idTurma}`, body);
    return response.data;
}
