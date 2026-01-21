
export async function fetchClasses(matricula: string, access_token: string): Promise<string[]> {
    const body = {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "User-Agent": "Dart/2.10 (dart:io)",
            "Accept-Encoding": "gzip",
        },
    }

    const response = await fetch(`http://localhost:8085/sigaa/mobile/discente/${matricula}/turmas`, body);
    if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.statusText}`);
    }

    return await response.json();;
}

export async function fetchClassDetails(matricula: string, idTurma: string, access_token: string): Promise<string> {
    const body = {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "User-Agent": "Dart/2.10 (dart:io)",
            "Accept-Encoding": "gzip",
        },
    }
    const response = await fetch(`http://localhost:8085/sigaa/mobile/discente/${matricula}/turma/${idTurma}`, body);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch class details: ${response.statusText}`);
    }

    return await response.json();
}
