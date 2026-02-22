import api from "./Axios";

// todo
export async function fetchEnrollmentCertificate(matricula: string): Promise<number[]> {
    const response = await api.get(`/documentos/${matricula}/certificado-de-matricula`, {});

    return response.data;
}

// todo
// export async function fetchOfficialTranscript(matricula: string, access_token: string): Promise<Blob> {

// }
