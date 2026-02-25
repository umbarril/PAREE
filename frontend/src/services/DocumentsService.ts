import api from "./Axios";

// Both endpoints return a PDF blob. Request with axios responseType 'blob' and return the Blob.
export async function fetchEnrollmentCertificate(matricula: string): Promise<Blob> {
    const response = await api.get(`/sigaa/mobile/discente/${matricula}/documentos/declaracao`, { responseType: 'blob' });
    return response.data as Blob;
}

export async function fetchOfficialTranscript(matricula: string): Promise<Blob> {
    const response = await api.get(`/sigaa/mobile/discente/${matricula}/documentos/historico`, { responseType: 'blob' });
    return response.data as Blob;
}

