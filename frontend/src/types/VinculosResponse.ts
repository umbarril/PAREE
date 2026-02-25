export interface VinculosResponse {
    // servidor: [], // ignorando
    discente: DiscenteVinculoResponse[]
}

export interface DiscenteVinculoResponse {
    curso: CourseResponse,
    matricula: number,
    pessoa: PersonResponse,
    email: string,
    telefone: number,
    matriculaNome: string,
    tipoString: string,
    idVinculo: number
}

export interface CourseResponse {
    nome: string,
    nivel: string, // G (graduação)
    idCurso: number
}

export interface PersonResponse {
    nome: string,
    sexo: string, // M ou F
    email: string,
    celular: number,
    telefone: number,
    tipo: string,
    nomeResumido: string,
    primeiroNome: string,
    nomeSocialOficial: string,
    idPessoa: number
}